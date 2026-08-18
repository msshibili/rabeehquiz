import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { evaluateQuizAttempt } from "@/lib/scoring";
import { syncQuizResultToSheets } from "@/lib/google-sync";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quizId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 });
    }

    const evaluatedAttempt = await evaluateQuizAttempt(attemptId);
    
    // Trigger Google Sheets sync in background
    syncQuizResultToSheets(attemptId).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Quiz submitted and evaluated successfully",
      attempt: evaluatedAttempt,
    });
  } catch (error: any) {
    console.error("Submit Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit quiz" }, { status: 500 });
  }
}
