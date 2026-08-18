"use client";

import { use, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldAlert,
  Save,
  HelpCircle,
  XCircle,
} from "lucide-react";

export default function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected options map: { questionId -> optionKey }
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  // Timer & anti-cheat states
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load quiz & attempt data
  useEffect(() => {
    if (!quizId) return;

    fetch(`/api/quiz/${quizId}/start`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
          setLoading(false);
          return;
        }

        setQuiz(data.quiz);
        setQuestions(data.quiz.questions || []);
        setAttempt(data.attempt);
        setTabSwitchCount(data.attempt.tabSwitchCount || 0);

        // Pre-populate existing answers if resumed
        if (data.attempt.answers) {
          const map: Record<string, string> = {};
          data.attempt.answers.forEach((ans: any) => {
            if (ans.selectedOption) map[ans.questionId] = ans.selectedOption;
          });
          setAnswersMap(map);
        }

        // Calculate timer remaining seconds
        const expiresAt = new Date(data.attempt.expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setSecondsRemaining(diff);

        setLoading(false);
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setLoading(false);
      });
  }, [quizId]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || secondsRemaining <= 0 || !attempt) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit("Timer Expiry");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, secondsRemaining, attempt]);

  // Anti-cheat window blur listener
  useEffect(() => {
    if (loading || !quiz?.enableAntiCheat || !attempt) return;

    const handleWindowBlur = () => {
      setTabSwitchCount((prev) => {
        const nextCount = prev + 1;
        setShowWarningModal(true);

        // Save switch count upstream
        const currentQ = questions[currentIndex];
        if (currentQ) {
          fetch("/api/quiz/save-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attemptId: attempt.id,
              questionId: currentQ.id,
              selectedOption: answersMap[currentQ.id] || null,
              tabSwitchCount: nextCount,
            }),
          }).catch(() => {});
        }

        if (nextCount >= 5) {
          handleAutoSubmit("Security Violation (Excessive Tab Switches)");
        }
        return nextCount;
      });
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [loading, quiz, attempt, questions, currentIndex, answersMap]);

  // Save selected answer
  const handleSelectOption = async (questionId: string, optionKey: string) => {
    const newMap = { ...answersMap, [questionId]: optionKey };
    setAnswersMap(newMap);
    setSavingMap((prev) => ({ ...prev, [questionId]: true }));

    try {
      await fetch("/api/quiz/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId,
          selectedOption: optionKey,
          tabSwitchCount,
        }),
      });
    } catch (err) {
      console.error("Save answer failed:", err);
    } finally {
      setSavingMap((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Auto-submit trigger
  const handleAutoSubmit = async (reason: string) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const data = await res.json();
      router.push(`/quiz/${quizId}/result/${attempt.id}`);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  // Manual Submit Trigger
  const handleManualSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const data = await res.json();
      router.push(`/quiz/${quizId}/result/${attempt.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Submission failed");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Loading Exam Hall & Anti-Cheat Monitor...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white">{errorMessage}</h2>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Check mandatory questions answered status
  const mandatoryQuestions = questions.filter((q) => q.isMandatory);
  const missingMandatoryCount = mandatoryQuestions.filter((q) => !answersMap[q.id]).length;
  const answeredCount = Object.keys(answersMap).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* TOP FLOATING TIMER HEADER */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 bg-slate-950/90 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-white tracking-tight">{quiz?.title}</span>
            <span className="text-xs text-slate-400 hidden md:inline">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Anti-cheat tab switch badge */}
            {quiz?.enableAntiCheat && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                  tabSwitchCount > 0
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Switches: {tabSwitchCount}/5</span>
              </div>
            )}

            {/* Countdown Timer */}
            <div
              className={`px-4 py-1.5 rounded-xl font-mono text-sm font-bold flex items-center gap-2 border ${
                secondsRemaining < 120
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                  : "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TEST CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* QUESTION DISPLAY AREA (Left 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ && (
            <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6 relative">
              {/* Question Header & Category */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs flex items-center justify-center">
                    Q{currentIndex + 1}
                  </span>
                  {currentQ.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 text-[10px] font-semibold border border-slate-800">
                      {currentQ.category}
                    </span>
                  )}
                  {currentQ.isMandatory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 flex items-center gap-1">
                      Mandatory *
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Marks: <strong className="text-white">+{currentQ.marks}</strong></span>
                  {quiz?.negativeMarking && (
                    <span>Negative: <strong className="text-amber-400">-{currentQ.negativeMarks}</strong></span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                {currentQ.questionText}
              </div>

              {/* Options Grid (A, B, C, D) */}
              <div className="space-y-3 pt-2">
                {[
                  { key: "A", text: currentQ.optionA },
                  { key: "B", text: currentQ.optionB },
                  { key: "C", text: currentQ.optionC },
                  { key: "D", text: currentQ.optionD },
                ].map((opt) => {
                  const isSelected = answersMap[currentQ.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(currentQ.id, opt.key)}
                      className={`w-full p-4 rounded-2xl text-left font-medium text-xs sm:text-sm flex items-center justify-between transition-all border ${
                        isSelected
                          ? "bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                          : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls Bottom Bar */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  {savingMap[currentQ.id] ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Save className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </span>
                  ) : answersMap[currentQ.id] ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Autosaved
                    </span>
                  ) : (
                    "Select an Option"
                  )}
                </span>

                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* QUESTION PALETTE SIDEBAR (Right 1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Question Palette</h3>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answersMap[q.id];
                const isMandatoryMissing = q.isMandatory && !isAnswered;

                let btnClass = "bg-slate-900 text-slate-400 border-slate-800";
                if (isCurrent) {
                  btnClass = "bg-indigo-600 text-white ring-2 ring-indigo-400 border-indigo-500";
                } else if (isAnswered) {
                  btnClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
                } else if (isMandatoryMissing) {
                  btnClass = "bg-red-500/10 text-red-400 border-red-500/30";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center relative ${btnClass}`}
                  >
                    {idx + 1}
                    {q.isMandatory && (
                      <span className="absolute top-0.5 right-1 text-red-400 text-[9px] font-bold">*</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-600 border border-indigo-400" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-red-500/10 border border-red-500/30" />
                <span>Mandatory Missing ({missingMandatoryCount})</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* SECURITY TAB-SWITCH WARNING MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-amber-500/40 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Security Warning: Tab Switch Logged!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You left the exam window or switched tabs. Tab switches are logged for anti-cheat verification.
              <br />
              <strong className="text-amber-400 block mt-1">Warning: {tabSwitchCount} / 5 Tab Switches Logged</strong>
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Return & Continue Test
            </button>
          </div>
        </div>
      )}

      {/* FINAL SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Submit Quiz Attempt?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to complete your test and view your scorecard?
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <span className="font-bold text-white">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Answered Questions:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unanswered Questions:</span>
                <span className="font-bold text-amber-400">{questions.length - answeredCount}</span>
              </div>
              {missingMandatoryCount > 0 && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{missingMandatoryCount} mandatory questions are unanswered!</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800"
              >
                Continue Answering
              </button>

              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-lg"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirm & Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
