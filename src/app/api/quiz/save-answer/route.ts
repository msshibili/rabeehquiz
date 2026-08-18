import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, questionId, selectedOption, tabSwitchCount } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: "Attempt ID and Question ID are required" }, { status: 400 });
    }

    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Quiz attempt is closed or not in progress" }, { status: 400 });
    }

    // Check expiration
    if (new Date() > new Date(attempt.expiresAt)) {
      return NextResponse.json({ error: "Time for this quiz has expired" }, { status: 400 });
    }

    // Update tab switch count if provided
    if (typeof tabSwitchCount === "number" && tabSwitchCount > attempt.tabSwitchCount) {
      await db.quizAttempt.update({
        where: { id: attemptId },
        data: { tabSwitchCount },
      });
    }

    // Upsert answer selection
    const existingAnswer = await db.answer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      await db.answer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOption: selectedOption || null,
          savedAt: new Date(),
        },
      });
    } else {
      await db.answer.create({
        data: {
          attemptId,
          questionId,
          selectedOption: selectedOption || null,
        },
      });
    }

    return NextResponse.json({ success: true, savedAt: new Date() });
  } catch (error: any) {
    console.error("Save Answer Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save answer" }, { status: 500 });
  }
}
