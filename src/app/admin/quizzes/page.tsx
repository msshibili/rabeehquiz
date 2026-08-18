"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  FileText,
  ShieldAlert,
  Power,
} from "lucide-react";

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    durationMinutes: 15,
    passingPercentage: 40.0,
    negativeMarking: true,
    showResults: true,
    showAnswers: true,
    showLeaderboard: true,
    maxAttempts: 1,
    status: "ACTIVE",
    enableAntiCheat: true,
  });

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quizzes");
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "DRAFT" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update quiz status");

      fetchQuizzes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quiz");

      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        instructions: "",
        durationMinutes: 15,
        passingPercentage: 40.0,
        negativeMarking: true,
        showResults: true,
        showAnswers: true,
        showLeaderboard: true,
        maxAttempts: 1,
        status: "ACTIVE",
        enableAntiCheat: true,
      });
      fetchQuizzes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz and all its questions?")) return;

    try {
      const res = await fetch(`/api/admin/quizzes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete quiz");

      fetchQuizzes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-400" /> Quiz & Competition Manager
          </h1>
          <p className="text-xs text-slate-400">
            Create new quiz rounds, set anti-cheat rules, duration, and toggle active status for participants
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Quiz
        </button>
      </div>

      {/* QUIZ LIST GRID */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-slate-800 text-slate-400">
          No quizzes created yet. Click "Create New Quiz" to add your first competition round.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                        quiz.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {quiz.status}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(quiz.id, quiz.status)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-all ${
                        quiz.status === "ACTIVE"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{quiz.status === "ACTIVE" ? "Deactivate" : "Activate Quiz"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {quiz.durationMinutes} Mins
                    </span>
                    {quiz.enableAntiCheat && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Shield
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {quiz.description || "No description provided."}
                </p>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Questions</span>
                    <span className="font-bold text-white">{quiz._count?.questions || 0} MCQs</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Attempts</span>
                    <span className="font-bold text-indigo-400">{quiz._count?.attempts || 0} Taken</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Passing %</span>
                    <span className="font-bold text-emerald-400">{quiz.passingPercentage}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Link
                  href={`/admin/quizzes/${quiz.id}`}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> Manage Questions
                </Link>

                <button
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  title="Delete Quiz"
                  className="p-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 relative max-h-[90vh] overflow-y-auto text-xs">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-white">Create New Quiz Competition</h3>
              <p className="text-slate-400 mt-0.5">Configure timing, rules, and passing criteria</p>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Technology & General Knowledge Round 1"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary for participants..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Passing %
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.passingPercentage}
                    onChange={(e) => setFormData({ ...formData, passingPercentage: parseFloat(e.target.value) || 40 })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.negativeMarking}
                    onChange={(e) => setFormData({ ...formData, negativeMarking: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Negative Marking</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableAntiCheat}
                    onChange={(e) => setFormData({ ...formData, enableAntiCheat: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Anti-Cheat Shield</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showAnswers}
                    onChange={(e) => setFormData({ ...formData, showAnswers: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Show Answer Key</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-slate-400 font-semibold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
                >
                  {actionLoading ? "Creating..." : "Save & Create Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
