import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCSV } from "@/lib/csv";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { quizId, csvText } = body;

    if (!quizId || !csvText) {
      return NextResponse.json({ error: "quizId and csvText are required" }, { status: 400 });
    }

    const rows = parseCSV<any>(csvText);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV." }, { status: 400 });
    }

    const existingCount = await db.question.count({ where: { quizId } });
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.questionText || !r.optionA || !r.optionB || !r.optionC || !r.optionD || !r.correctAnswer) {
        continue;
      }

      await db.question.create({
        data: {
          quizId,
          questionText: String(r.questionText).trim(),
          optionA: String(r.optionA).trim(),
          optionB: String(r.optionB).trim(),
          optionC: String(r.optionC).trim(),
          optionD: String(r.optionD).trim(),
          correctAnswer: String(r.correctAnswer).trim().toUpperCase(),
          marks: r.marks ? parseFloat(r.marks) : 1.0,
          negativeMarks: r.negativeMarks ? parseFloat(r.negativeMarks) : 0.0,
          isMandatory: String(r.isMandatory).toLowerCase() === "true" || r.isMandatory === 1,
          category: r.category || null,
          difficulty: r.difficulty || "Medium",
          explanation: r.explanation || null,
          orderIndex: existingCount + insertedCount + 1,
        },
      });
      insertedCount++;
    }

    const totalCount = await db.question.count({ where: { quizId } });
    await db.quiz.update({ where: { id: quizId }, data: { totalQuestions: totalCount } });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} questions!`,
      insertedCount,
    });
  } catch (error: any) {
    console.error("Import Questions Error:", error);
    return NextResponse.json({ error: error.message || "Failed to import CSV questions" }, { status: 500 });
  }
}
