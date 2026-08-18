"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  RotateCcw,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function QuizResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id: quizId, attemptId } = use(params);
  const router = useRouter();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId || !attemptId) return;

    fetch(`/api/quiz/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAttempt(data.attempt);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [quizId, attemptId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Calculating Final Scorecard & Answer Breakdown...</span>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold text-white">{error || "Attempt not found"}</h2>
        <Link href="/dashboard" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isPassed = attempt.percentage >= (attempt.quiz?.passingPercentage || 40);
  const answers = attempt.answers || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* PERFORMANCE SCORECARD BANNER */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 relative overflow-hidden space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> OFFICIAL SCORECARD
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight">{attempt.quiz?.title}</h1>

        {/* Big Score Display */}
        <div className="py-6 max-w-sm mx-auto p-6 rounded-3xl glass-card border border-indigo-500/30 flex flex-col items-center justify-center space-y-2 glow-indigo">
          <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Your Total Score</span>
          <div className="text-5xl font-black text-white tracking-tight">
            {attempt.score} <span className="text-2xl text-slate-400 font-normal">pts</span>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {isPassed ? (
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> PASSED ({attempt.percentage}%)
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold text-xs flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> NEEDS IMPROVEMENT ({attempt.percentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs max-w-2xl mx-auto text-left">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Correct</span>
            <span className="font-bold text-emerald-400 text-base">{attempt.correctCount} Questions</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Incorrect</span>
            <span className="font-bold text-red-400 text-base">{attempt.wrongCount} Questions</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Unanswered</span>
            <span className="font-bold text-amber-400 text-base">{attempt.unansweredCount} Questions</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Time Used</span>
            <span className="font-bold text-white text-base flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> {Math.floor(attempt.timeUsedSeconds / 60)}m {attempt.timeUsedSeconds % 60}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* QUESTION-BY-QUESTION EXPLANATION REVIEW */}
      {attempt.quiz?.showAnswers && answers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Question & Answer Key Review
          </h2>

          <div className="space-y-4">
            {answers.map((ans: any, idx: number) => {
              const q = ans.question;
              if (!q) return null;

              const selected = ans.selectedOption;
              const isCorrect = ans.isCorrect;

              return (
                <div
                  key={ans.id}
                  className={`p-6 rounded-2xl glass-card border ${
                    isCorrect
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : selected
                      ? "border-red-500/30 bg-red-950/10"
                      : "border-slate-800 bg-slate-900/40"
                  } space-y-4`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-300">Q{idx + 1}.</span>
                      {isCorrect ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Correct (+{ans.marksAwarded})
                        </span>
                      ) : selected ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Incorrect ({ans.marksAwarded})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          Unanswered (0)
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400">{q.category || "General"}</span>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">{q.questionText}</p>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: "A", text: q.optionA },
                      { key: "B", text: q.optionB },
                      { key: "C", text: q.optionC },
                      { key: "D", text: q.optionD },
                    ].map((opt) => {
                      const isOptionCorrect = q.correctAnswer.toUpperCase() === opt.key;
                      const isOptionSelected = selected === opt.key;

                      let style = "bg-slate-900/60 border-slate-800 text-slate-400";
                      if (isOptionCorrect) {
                        style = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold";
                      } else if (isOptionSelected && !isOptionCorrect) {
                        style = "bg-red-500/20 border-red-500/50 text-red-300 font-bold";
                      }

                      return (
                        <div key={opt.key} className={`p-3 rounded-xl border flex items-center gap-2 ${style}`}>
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                          {isOptionCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                          {isOptionSelected && !isOptionCorrect && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="font-bold text-indigo-400 block text-[10px] uppercase">Explanation</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
