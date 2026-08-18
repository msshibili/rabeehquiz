import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    // Regular users can view active quizzes, admins can view all
    const isAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
    const where = isAdmin ? {} : { status: "ACTIVE" };

    const quizzes = await db.quiz.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return NextResponse.json({ quizzes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch quizzes" }, { status: 500 });
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
      title,
      description,
      instructions,
      durationMinutes,
      passingPercentage,
      negativeMarking,
      showResults,
      showAnswers,
      showLeaderboard,
      maxAttempts,
      status,
      enableAntiCheat,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Quiz title is required" }, { status: 400 });
    }

    const quiz = await db.quiz.create({
      data: {
        title: title.trim(),
        description: description || null,
        instructions: instructions || null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 15,
        passingPercentage: passingPercentage ? parseFloat(passingPercentage) : 40.0,
        negativeMarking: !!negativeMarking,
        showResults: showResults !== false,
        showAnswers: showAnswers !== false,
        showLeaderboard: showLeaderboard !== false,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : 1,
        status: status || "ACTIVE",
        enableAntiCheat: enableAntiCheat !== false,
      },
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create quiz" }, { status: 500 });
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
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    if (data.durationMinutes) data.durationMinutes = parseInt(data.durationMinutes);
    if (data.passingPercentage) data.passingPercentage = parseFloat(data.passingPercentage);
    if (data.maxAttempts) data.maxAttempts = parseInt(data.maxAttempts);

    const updatedQuiz = await db.quiz.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, quiz: updatedQuiz });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update quiz" }, { status: 500 });
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
      return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
    }

    await db.quiz.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Quiz deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete quiz" }, { status: 500 });
  }
}
