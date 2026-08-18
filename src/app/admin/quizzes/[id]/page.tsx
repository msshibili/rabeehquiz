"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  FileText,
  X,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminQuizQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [csvText, setCsvText] = useState("");

  const [formData, setFormData] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    marks: 1.0,
    negativeMarks: 0.5,
    isMandatory: false,
    category: "General Knowledge",
    difficulty: "Medium",
    explanation: "",
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions?quizId=${quizId}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [quizId]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, quizId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add question");

      setShowAddModal(false);
      setFormData({
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A",
        marks: 1.0,
        negativeMarks: 0.5,
        isMandatory: false,
        category: "General Knowledge",
        difficulty: "Medium",
        explanation: "",
      });
      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete question");

      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, csvText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import CSV");

      alert(data.message);
      setShowCsvModal(false);
      setCsvText("");
      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/quizzes"
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mb-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" /> Manage Questions ({questions.length})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-indigo-400" /> Bulk CSV Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/25"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-card border border-slate-800 text-slate-400">
          No questions added to this quiz yet. Add questions manually or import via CSV.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl glass-card border border-slate-800 space-y-4 relative"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">Q{idx + 1}.</span>
                  {q.isMandatory && (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                      Mandatory *
                    </span>
                  )}
                  {q.category && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px]">
                      {q.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">
                    Marks: <strong className="text-white">+{q.marks}</strong> / <strong className="text-amber-400">-{q.negativeMarks}</strong>
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm font-semibold text-white">{q.questionText}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: "A", text: q.optionA },
                  { key: "B", text: q.optionB },
                  { key: "C", text: q.optionC },
                  { key: "D", text: q.optionD },
                ].map((opt) => {
                  const isCorrect = q.correctAnswer.toUpperCase() === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        isCorrect
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                          : "bg-slate-900/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-slate-800">
                        {opt.key}
                      </span>
                      <span>{opt.text}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <strong className="text-indigo-400">Explanation:</strong> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD QUESTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 relative text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white">Add MCQ Question</h3>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="Enter the question..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    value={formData.optionA}
                    onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    value={formData.optionB}
                    onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Option C *</label>
                  <input
                    type="text"
                    required
                    value={formData.optionC}
                    onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Option D *</label>
                  <input
                    type="text"
                    required
                    value={formData.optionD}
                    onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Correct Answer *
                  </label>
                  <select
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1.0 })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.negativeMarks}
                    onChange={(e) => setFormData({ ...formData, negativeMarks: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMandatory}
                    onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Mandatory Question (*)</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Explanation</label>
                <input
                  type="text"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Solution explanation for result review..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-slate-400 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Import Questions via CSV</h3>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400">
              CSV must have headers: <code className="text-indigo-400">questionText,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,isMandatory,category,explanation</code>
            </p>

            <form onSubmit={handleCsvImport} className="space-y-4">
              <textarea
                rows={8}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`questionText,optionA,optionB,optionC,optionD,correctAnswer,marks,negativeMarks,isMandatory,category,explanation\n"What is 2+2?","3","4","5","6","B",1,0,true,"Math","Basic addition"`}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  {actionLoading ? "Importing..." : "Upload & Insert Questions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
