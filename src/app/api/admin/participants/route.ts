import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCSV } from "@/lib/csv";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "VERIFIER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportCsv = searchParams.get("export") === "true";
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const registrations = await db.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, phone: true, role: true },
        },
        payments: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
        attempts: {
          orderBy: { score: "desc" },
          take: 1,
        },
      },
    });

    if (exportCsv) {
      const csvData = registrations.map((r) => {
        const p = r.payments[0];
        const att = r.attempts[0];
        return {
          "Registration ID": r.registrationId,
          "Name": r.user.name,
          "Email": r.user.email,
          "Phone": r.user.phone,
          "Place": r.place || "",
          "Gender": r.gender || "",
          "Institution": r.institution || "",
          "Course": r.course || "",
          "Status": r.status,
          "Payment UTR": p ? p.transactionId : "N/A",
          "Payment Status": p ? p.status : "N/A",
          "Best Quiz Score": att ? att.score : "N/A",
          "Percentage": att ? `${att.percentage}%` : "N/A",
        };
      });

      const csvContent = generateCSV(csvData);
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Participants_Export_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ registrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch participants" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const registrationId = searchParams.get("registrationId");
    const userId = searchParams.get("userId");

    if (!registrationId && !userId) {
      return NextResponse.json({ error: "Missing registrationId or userId parameter." }, { status: 400 });
    }

    let targetUserId = userId;
    if (!targetUserId && registrationId) {
      const reg = await db.registration.findUnique({
        where: { registrationId },
        select: { userId: true },
      });
      targetUserId = reg?.userId || null;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Participant not found." }, { status: 404 });
    }

    await db.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ success: true, message: "User deleted successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { registrationId, name, phone, email, place, institution, course } = body;

    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }

    const reg = await db.registration.findUnique({
      where: { registrationId },
      include: { user: true },
    });

    if (!reg) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Update user details
    await db.user.update({
      where: { id: reg.userId },
      data: {
        name: name ? name.trim() : reg.user.name,
        phone: phone ? phone.trim() : reg.user.phone,
        email: email ? email.trim() : null,
      },
    });

    // Update registration details
    await db.registration.update({
      where: { registrationId },
      data: {
        place: place !== undefined ? place : reg.place,
        institution: institution !== undefined ? institution : reg.institution,
        course: course !== undefined ? course : reg.course,
      },
    });

    return NextResponse.json({ success: true, message: "Participant updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update participant" }, { status: 500 });
  }
}
