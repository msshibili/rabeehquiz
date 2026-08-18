import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncParticipantToSheets } from "@/lib/google-sync";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "VERIFIER")) {
      return NextResponse.json({ error: "Forbidden. Admin or Verifier privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, ALL
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search } },
        { registrationId: { contains: search } },
        { registration: { user: { name: { contains: search } } } },
        { registration: { user: { email: { contains: search } } } },
        { registration: { user: { phone: { contains: search } } } },
      ];
    }

    const payments = await db.payment.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        registration: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error("Admin Verifications GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "VERIFIER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, action, rejectionReason } = body; // action: "APPROVE" | "REJECT"

    if (!paymentId || !action) {
      return NextResponse.json({ error: "Payment ID and action are required." }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { registration: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    if (action === "APPROVE") {
      await db.$transaction([
        db.payment.update({
          where: { id: paymentId },
          data: {
            status: "APPROVED",
            verifiedAt: new Date(),
            verifiedBy: user.id,
            rejectionReason: null,
          },
        }),
        db.registration.update({
          where: { registrationId: payment.registrationId },
          data: { status: "APPROVED" },
        }),
      ]);

      // Sync updated status to Google Sheets
      syncParticipantToSheets(payment.registrationId).catch(() => {});

      return NextResponse.json({ success: true, message: "Payment and participant registration approved!" });
    } else if (action === "REJECT") {
      await db.$transaction([
        db.payment.update({
          where: { id: paymentId },
          data: {
            status: "REJECTED",
            verifiedAt: new Date(),
            verifiedBy: user.id,
            rejectionReason: rejectionReason || "Invalid payment details or UTR verification failed.",
          },
        }),
        db.registration.update({
          where: { registrationId: payment.registrationId },
          data: { status: "REJECTED" },
        }),
      ]);

      // Sync updated status to Google Sheets
      syncParticipantToSheets(payment.registrationId).catch(() => {});

      return NextResponse.json({ success: true, message: "Payment rejected." });
    } else {
      return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin Verifications POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process verification" }, { status: 500 });
  }
}
