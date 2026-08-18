import { db } from "./db";
import { getGoogleAccessToken, uploadFileToGoogleDrive, appendToGoogleSheet, postToGoogleWebApp } from "./google-api";

export async function syncParticipantToSheets(registrationId: string) {
  try {
    const reg = await db.registration.findUnique({
      where: { registrationId },
      include: { user: true, payments: { take: 1, orderBy: { submittedAt: "desc" } } },
    });

    if (!reg) return { success: false, error: "Registration not found" };

    const config = await db.googleIntegrationConfig.findFirst();

    // Approach 1: Free Google Apps Script Web App URL (Easiest, zero credentials)
    if (config?.formUrl) {
      const p = reg.payments[0];
      await postToGoogleWebApp(config.formUrl, {
        action: "SYNC_PARTICIPANT",
        registrationId: reg.registrationId,
        name: reg.user.name,
        email: reg.user.email,
        phone: reg.user.phone,
        place: reg.place || "",
        institution: reg.institution || "",
        course: reg.course || "",
        utr: p ? p.transactionId : "N/A",
        proofLink: p?.driveFileId || p?.screenshotUrl || "N/A",
        status: reg.status,
        timestamp: new Date().toISOString(),
      });

      await db.syncLog.create({
        data: {
          operation: "SYNC_PARTICIPANT",
          recordId: registrationId,
          status: "SUCCESS",
          error: null,
        },
      });

      return { success: true, isConnected: true };
    }

    // Approach 2: Google Service Account OAuth
    if (config?.isConnected && config.serviceAccountEmail && config.privateKey && config.sheetId) {
      const accessToken = await getGoogleAccessToken({
        serviceAccountEmail: config.serviceAccountEmail,
        privateKey: config.privateKey,
      });

      const p = reg.payments[0];
      const rowData = [
        reg.registrationId,
        reg.user.name,
        reg.user.email || "",
        reg.user.phone,
        reg.place || "",
        reg.institution || "",
        reg.course || "",
        p ? p.transactionId : "N/A",
        p?.driveFileId || p?.screenshotUrl || "N/A",
        reg.status,
        new Date().toISOString(),
      ];

      await appendToGoogleSheet(accessToken, config.sheetId, rowData);

      await db.syncLog.create({
        data: {
          operation: "SYNC_PARTICIPANT",
          recordId: registrationId,
          status: "SUCCESS",
          error: null,
        },
      });

      return { success: true, isConnected: true };
    }

    // Default: Local Storage fallback
    await db.syncLog.create({
      data: {
        operation: "SYNC_PARTICIPANT",
        recordId: registrationId,
        status: "QUEUED",
        error: "Saved in local database. Google Web App URL or Service Account not configured.",
      },
    });

    return { success: true, isConnected: false };
  } catch (error: any) {
    console.error("syncParticipantToSheets Error:", error);
    await db.syncLog.create({
      data: {
        operation: "SYNC_PARTICIPANT",
        recordId: registrationId,
        status: "FAILED",
        error: error.message || "Sync failed",
      },
    });
    return { success: false, error: error.message };
  }
}

export async function syncPaymentToDrive(registrationId: string, filePath: string) {
  try {
    const config = await db.googleIntegrationConfig.findFirst();

    // Approach 1: Free Apps Script Web App
    if (config?.formUrl) {
      const resData = await postToGoogleWebApp(config.formUrl, {
        action: "UPLOAD_PAYMENT_PROOF_DRIVE",
        registrationId,
        filePath,
        timestamp: new Date().toISOString(),
      });

      if (resData?.driveFileId) {
        await db.payment.updateMany({
          where: { registrationId },
          data: { driveFileId: resData.driveFileId },
        });
      }

      await db.syncLog.create({
        data: {
          operation: "UPLOAD_PAYMENT_PROOF_DRIVE",
          recordId: registrationId,
          status: "SUCCESS",
          error: null,
        },
      });

      return { success: true, driveFileId: resData?.driveFileId || null };
    }

    // Approach 2: Google Service Account
    if (
      config?.isConnected &&
      config.serviceAccountEmail &&
      config.privateKey &&
      config.driveFolderId &&
      filePath
    ) {
      const accessToken = await getGoogleAccessToken({
        serviceAccountEmail: config.serviceAccountEmail,
        privateKey: config.privateKey,
      });

      const uploadResult = await uploadFileToGoogleDrive(
        accessToken,
        config.driveFolderId,
        filePath,
        `PaymentProof_${registrationId}_${Date.now()}.png`
      );

      const driveFileLink = uploadResult.webViewLink;

      await db.payment.updateMany({
        where: { registrationId },
        data: { driveFileId: driveFileLink },
      });

      await db.syncLog.create({
        data: {
          operation: "UPLOAD_PAYMENT_PROOF_DRIVE",
          recordId: registrationId,
          status: "SUCCESS",
          error: null,
        },
      });

      return { success: true, driveFileId: driveFileLink };
    }

    await db.syncLog.create({
      data: {
        operation: "UPLOAD_PAYMENT_PROOF_DRIVE",
        recordId: registrationId,
        status: "LOCAL_ONLY",
        error: "Saved in local server storage.",
      },
    });

    return { success: true, driveFileId: null };
  } catch (error: any) {
    console.error("syncPaymentToDrive Error:", error);
    return { success: false, error: error.message };
  }
}

export async function syncQuizResultToSheets(attemptId: string) {
  try {
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true, registration: { include: { user: true } } },
    });

    if (!attempt) return;

    const config = await db.googleIntegrationConfig.findFirst();

    if (config?.formUrl) {
      await postToGoogleWebApp(config.formUrl, {
        action: "SYNC_QUIZ_RESULT",
        registrationId: attempt.registration.registrationId,
        name: attempt.registration.user.name,
        quizTitle: attempt.quiz.title,
        score: attempt.score,
        percentage: `${attempt.percentage}%`,
        status: attempt.status,
        timestamp: new Date().toISOString(),
      });
    } else if (config?.isConnected && config.serviceAccountEmail && config.privateKey && config.sheetId) {
      const accessToken = await getGoogleAccessToken({
        serviceAccountEmail: config.serviceAccountEmail,
        privateKey: config.privateKey,
      });

      const rowData = [
        "QUIZ_RESULT",
        attempt.registration.registrationId,
        attempt.registration.user.name,
        attempt.quiz.title,
        attempt.score,
        `${attempt.percentage}%`,
        attempt.status,
        new Date().toISOString(),
      ];

      await appendToGoogleSheet(accessToken, config.sheetId, rowData);
    }

    await db.syncLog.create({
      data: {
        operation: "SYNC_QUIZ_RESULT",
        recordId: attemptId,
        status: config?.formUrl || config?.isConnected ? "SUCCESS" : "QUEUED",
        error: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
