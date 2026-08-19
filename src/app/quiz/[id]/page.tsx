"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  FileText,
  Lock,
} from "lucide-react";

export default function QuizPreStartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.quiz) {
          setQuiz(data.quiz);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleStartQuiz = async () => {
    setStarting(true);
    setError(null);

    try {
      const res = await fetch(`/api/quiz/${quizId}/start`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.error || "Failed to start quiz attempt");
      }

      // Navigate to quiz take hall with attempt ID
      router.push(`/quiz/${quizId}/take?attemptId=${data.attempt.id}`);
    } catch (err: any) {
      setError(err.message);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">Quiz Not Found</h2>
        <Link href="/dashboard" className="text-indigo-400 hover:underline text-xs">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
      {/* Quiz Banner Header */}
      <div className="p-8 rounded-3xl glass-panel border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            OFFICIAL QUIZ HALL
          </span>
          {quiz.enableAntiCheat && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Anti-Cheat Monitored
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight">{quiz.title}</h1>
        <p className="text-sm text-slate-300 leading-relaxed">{quiz.description}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Duration</span>
            <span className="font-bold text-white text-sm flex items-center gap-1">
              <Clock className="w-4 h-4 text-indigo-400" /> {quiz.durationMinutes} Minutes
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Total MCQs</span>
            <span className="font-bold text-white text-sm">{quiz.totalQuestions || 10} Questions</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Passing Mark</span>
            <span className="font-bold text-indigo-400 text-sm">{quiz.passingPercentage}%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">Negative Mark</span>
            <span className="font-bold text-amber-400 text-sm">{quiz.negativeMarking ? "Yes (-0.5)" : "None"}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Rules & Guidelines */}
      <div className="p-8 rounded-3xl glass-card border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Competition Guidelines & Exam Protocol
        </h3>

        <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>The test consists of multiple-choice questions. Select the best option for each question.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Questions marked with a red asterisk (<span className="text-red-400 font-bold">*</span>) are mandatory and must be answered before final submission.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Your answers are autosaved automatically on each selection.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Anti-Cheat Security:</strong> Do NOT switch tabs, minimize the browser window, or open developer console during the test. Window blur actions are logged automatically.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>

          <button
            onClick={handleStartQuiz}
            disabled={starting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {starting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>I Agree & Begin Test</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
