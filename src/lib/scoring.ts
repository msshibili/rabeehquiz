import { db } from "./db";

export async function evaluateQuizAttempt(attemptId: string) {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: true,
        },
      },
      answers: true,
    },
  });

  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === "COMPLETED") return attempt;

  const now = new Date();
  const startedAt = new Date(attempt.startedAt);
  const timeUsedSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

  const questions = attempt.quiz.questions;
  const answerMap = new Map(attempt.answers.map((a: any) => [a.questionId, a]));

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let maxPossibleMarks = 0;

  for (const q of questions) {
    maxPossibleMarks += q.marks;
    const ans = answerMap.get(q.id);
    const selected = ans?.selectedOption;

    if (!selected) {
      unansweredCount++;
      if (ans) {
        await db.answer.update({
          where: { id: ans.id },
          data: { isCorrect: false, marksAwarded: 0 },
        });
      }
    } else if (selected.toUpperCase() === q.correctAnswer.toUpperCase()) {
      correctCount++;
      score += q.marks;
      if (ans) {
        await db.answer.update({
          where: { id: ans.id },
          data: { isCorrect: true, marksAwarded: q.marks },
        });
      } else {
        await db.answer.create({
          data: {
            attemptId,
            questionId: q.id,
            selectedOption: selected,
            isCorrect: true,
            marksAwarded: q.marks,
          },
        });
      }
    } else {
      wrongCount++;
      const deduction = attempt.quiz.negativeMarking ? q.negativeMarks : 0;
      score -= deduction;
      if (ans) {
        await db.answer.update({
          where: { id: ans.id },
          data: { isCorrect: false, marksAwarded: -deduction },
        });
      } else {
        await db.answer.create({
          data: {
            attemptId,
            questionId: q.id,
            selectedOption: selected,
            isCorrect: false,
            marksAwarded: -deduction,
          },
        });
      }
    }
  }

  // Ensure score doesn't fall below 0
  if (score < 0) score = 0;
  const percentage = maxPossibleMarks > 0 ? (score / maxPossibleMarks) * 100 : 0;

  const updatedAttempt = await db.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score: Math.round(score * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      correctCount,
      wrongCount,
      unansweredCount,
      submittedAt: now,
      timeUsedSeconds,
      status: "COMPLETED",
    },
    include: {
      quiz: true,
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  return updatedAttempt;
}
