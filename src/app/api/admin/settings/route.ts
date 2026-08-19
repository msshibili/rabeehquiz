import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGoogleAccessToken } from "@/lib/google-api";
import { syncParticipantToSheets } from "@/lib/google-sync";

export async function GET() {
  try {
    const paymentSettings = (await db.paymentSettings.findFirst()) || {
      id: "default",
      feeAmount: 100.0,
      currency: "INR",
      upiId: "quizpro@upi",
      accountName: "ProQuiz Competitions Ltd",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quizpro@upi&pn=ProQuiz%20Competitions&am=100&cu=INR",
      instructions: "Scan QR code using GPay, PhonePe, Paytm. Upload payment screenshot & UTR ID.",
      active: true,
    };

    const platformSettings = (await db.platformSettings.findFirst()) || {
      id: "default",
      platformName: "NATIONAL QUIZ CHAMPIONSHIP 2026",
      logoUrl: "",
      primaryColor: "#4F46E5",
      contactEmail: "support@proquiz.com",
      contactPhone: "+91 98765 43210",
    };

    const googleConfig = await db.googleIntegrationConfig.findFirst();

    return NextResponse.json({
      paymentSettings,
      platformSettings,
      googleConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentSettings, platformSettings, googleConfig } = body;

    if (paymentSettings) {
      await db.paymentSettings.upsert({
        where: { id: "default" },
        update: {
          feeAmount: paymentSettings.feeAmount ? parseFloat(paymentSettings.feeAmount) : 100.0,
          currency: paymentSettings.currency || "INR",
          upiId: paymentSettings.upiId || "quizpro@upi",
          accountName: paymentSettings.accountName || "ProQuiz Competitions",
          qrCodeUrl: paymentSettings.qrCodeUrl || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quizpro@upi",
          instructions: paymentSettings.instructions || "",
          active: paymentSettings.active !== false,
        },
        create: {
          id: "default",
          feeAmount: paymentSettings.feeAmount ? parseFloat(paymentSettings.feeAmount) : 100.0,
          currency: paymentSettings.currency || "INR",
          upiId: paymentSettings.upiId || "quizpro@upi",
          accountName: paymentSettings.accountName || "ProQuiz Competitions",
          qrCodeUrl: paymentSettings.qrCodeUrl || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quizpro@upi",
          instructions: paymentSettings.instructions || "",
          active: true,
        },
      });
    }

    if (platformSettings) {
      await db.platformSettings.upsert({
        where: { id: "default" },
        update: {
          platformName: platformSettings.platformName || "NATIONAL QUIZ CHAMPIONSHIP 2026",
          logoUrl: platformSettings.logoUrl || "",
          primaryColor: platformSettings.primaryColor || "#4F46E5",
          contactEmail: platformSettings.contactEmail || "support@proquiz.com",
          contactPhone: platformSettings.contactPhone || "+91 98765 43210",
        },
        create: {
          id: "default",
          platformName: platformSettings.platformName || "NATIONAL QUIZ CHAMPIONSHIP 2026",
          logoUrl: platformSettings.logoUrl || "",
          primaryColor: platformSettings.primaryColor || "#4F46E5",
          contactEmail: platformSettings.contactEmail || "support@proquiz.com",
          contactPhone: platformSettings.contactPhone || "+91 98765 43210",
        },
      });
    }

    if (googleConfig) {
      const isConn = !!(
        googleConfig.formUrl ||
        (googleConfig.serviceAccountEmail && googleConfig.privateKey && googleConfig.sheetId)
      );
      await db.googleIntegrationConfig.upsert({
        where: { id: "default" },
        update: {
          sheetId: googleConfig.sheetId || null,
          driveFolderId: googleConfig.driveFolderId || null,
          formUrl: googleConfig.formUrl || null,
          serviceAccountEmail: googleConfig.serviceAccountEmail || null,
          privateKey: googleConfig.privateKey || null,
          isConnected: isConn,
        },
        create: {
          id: "default",
          sheetId: googleConfig.sheetId || null,
          driveFolderId: googleConfig.driveFolderId || null,
          formUrl: googleConfig.formUrl || null,
          serviceAccountEmail: googleConfig.serviceAccountEmail || null,
          privateKey: googleConfig.privateKey || null,
          isConnected: isConn,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}

// Test Connection & Trigger Sync
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = await db.googleIntegrationConfig.findFirst();
    if (!config || (!config.formUrl && (!config.serviceAccountEmail || !config.privateKey))) {
      return NextResponse.json(
        { error: "Please enter your Google Apps Script Web App URL or Service Account credentials first." },
        { status: 400 }
      );
    }

    // Sync all existing registrations to Google Sheets
    const allRegs = await db.registration.findMany({ select: { registrationId: true } });
    for (const r of allRegs) {
      await syncParticipantToSheets(r.registrationId);
    }

    return NextResponse.json({
      success: true,
      message: `Google Sheets Sync Triggered! Processed ${allRegs.length} participant records to your Google Sheet.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Google Connection Test Failed" }, { status: 500 });
  }
}
