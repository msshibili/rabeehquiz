import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    const questions = await db.question.findMany({
      where: { quizId },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      quizId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      marks,
      negativeMarks,
      isMandatory,
      category,
      difficulty,
      explanation,
      imageUrl,
    } = body;

    if (!quizId || !questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields for question." }, { status: 400 });
    }

    // Get highest order index
    const lastQ = await db.question.findFirst({
      where: { quizId },
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = (lastQ?.orderIndex || 0) + 1;

    const question = await db.question.create({
      data: {
        quizId,
        questionText: questionText.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer: correctAnswer.trim().toUpperCase(),
        marks: marks ? parseFloat(marks) : 1.0,
        negativeMarks: negativeMarks ? parseFloat(negativeMarks) : 0.0,
        isMandatory: !!isMandatory,
        category: category || null,
        difficulty: difficulty || "Medium",
        explanation: explanation || null,
        imageUrl: imageUrl || null,
        orderIndex,
      },
    });

    // Update totalQuestions count on quiz
    const totalCount = await db.question.count({ where: { quizId } });
    await db.quiz.update({ where: { id: quizId }, data: { totalQuestions: totalCount } });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create question" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    if (data.marks) data.marks = parseFloat(data.marks);
    if (data.negativeMarks) data.negativeMarks = parseFloat(data.negativeMarks);
    if (data.correctAnswer) data.correctAnswer = data.correctAnswer.trim().toUpperCase();

    const updated = await db.question.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Question ID required" }, { status: 400 });
    }

    const deleted = await db.question.delete({ where: { id } });

    // Update totalQuestions count on quiz
    const totalCount = await db.question.count({ where: { quizId: deleted.quizId } });
    await db.quiz.update({ where: { id: deleted.quizId }, data: { totalQuestions: totalCount } });

    return NextResponse.json({ success: true, message: "Question deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete question" }, { status: 500 });
  }
}
