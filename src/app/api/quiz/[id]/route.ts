import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quizId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        durationMinutes: true,
        passingPercentage: true,
        negativeMarking: true,
        showResults: true,
        maxAttempts: true,
        status: true,
        enableAntiCheat: true,
        totalQuestions: true,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch quiz" }, { status: 500 });
  }
}
