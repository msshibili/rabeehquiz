import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quizId } = await params;
    const user = await getCurrentUser();

    if (!user || !user.registration) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.registration.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your registration payment is not approved yet. Please wait for verifier approval." },
        { status: 403 }
      );
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            quizId: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            marks: true,
            negativeMarks: true,
            isMandatory: true,
            category: true,
            difficulty: true,
            explanation: true,
            imageUrl: true,
            orderIndex: true,
            // DO NOT select correctAnswer during test execution!
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.status !== "ACTIVE" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "This quiz is not currently active." }, { status: 400 });
    }

    // Check existing attempts
    const previousAttempts = await db.quizAttempt.findMany({
      where: {
        registrationId: user.registration.registrationId,
        quizId: quiz.id,
      },
      orderBy: { startedAt: "desc" },
      include: { answers: true },
    });

    // Check for active IN_PROGRESS attempt
    const activeAttempt = previousAttempts.find((a) => a.status === "IN_PROGRESS");
    const now = new Date();

    if (activeAttempt) {
      // Check if attempt has expired
      if (new Date(activeAttempt.expiresAt) < now) {
        // Auto-mark expired
        await db.quizAttempt.update({
          where: { id: activeAttempt.id },
          data: { status: "EXPIRED" },
        });
      } else {
        return NextResponse.json({
          success: true,
          isResumed: true,
          attempt: activeAttempt,
          quiz,
        });
      }
    }

    // Check max attempts
    const completedAttemptsCount = previousAttempts.filter((a) => a.status === "COMPLETED" || a.status === "EXPIRED").length;
    if (completedAttemptsCount >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.` },
        { status: 400 }
      );
    }

    // Create new attempt
    const expiresAt = new Date(now.getTime() + quiz.durationMinutes * 60 * 1000);
    const newAttempt = await db.quizAttempt.create({
      data: {
        registrationId: user.registration.registrationId,
        quizId: quiz.id,
        startedAt: now,
        expiresAt,
        status: "IN_PROGRESS",
      },
      include: { answers: true },
    });

    return NextResponse.json({
      success: true,
      isResumed: false,
      attempt: newAttempt,
      quiz,
    });
  } catch (error: any) {
    console.error("Start Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Failed to start quiz" }, { status: 500 });
  }
}
