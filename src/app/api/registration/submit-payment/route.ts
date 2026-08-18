import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncPaymentToDrive } from "@/lib/google-sync";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.registration) {
      return NextResponse.json({ error: "Unauthorized. Registration profile required." }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId, screenshotUrl, amount } = body;

    const finalUtr = transactionId && transactionId.trim()
      ? transactionId.trim()
      : `UTR-IMG-${Math.floor(100000 + Math.random() * 900000)}`;

    const regId = user.registration.registrationId;
    const paymentAmount = amount ? parseFloat(amount) : 100.0;

    // Check if there is an existing payment record
    const existingPayment = await db.payment.findFirst({
      where: { registrationId: regId },
      orderBy: { submittedAt: "desc" },
    });

    let payment;
    if (existingPayment && existingPayment.status === "REJECTED") {
      // Re-submit payment
      payment = await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionId: finalUtr,
          screenshotUrl: screenshotUrl || "/sample-payment-proof.png",
          status: "PENDING",
          rejectionReason: null,
          submittedAt: new Date(),
        },
      });
    } else {
      payment = await db.payment.create({
        data: {
          registrationId: regId,
          amount: paymentAmount,
          currency: "INR",
          transactionId: finalUtr,
          screenshotUrl: screenshotUrl || "/sample-payment-proof.png",
          status: "PENDING",
        },
      });
    }

    // Reset registration status to PENDING_VERIFICATION
    await db.registration.update({
      where: { registrationId: regId },
      data: { status: "PENDING_VERIFICATION" },
    });

    // Trigger Google Drive sync simulation
    syncPaymentToDrive(regId, screenshotUrl || "").catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Payment proof submitted successfully! Verification is pending.",
      payment,
    });
  } catch (error: any) {
    console.error("Submit Payment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit payment proof" }, { status: 500 });
  }
}
