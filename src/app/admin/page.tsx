"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    totalRegistrations: 0,
    pendingPayments: 0,
    approvedPayments: 0,
    totalRevenue: 0,
    activeQuizzes: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/verifications?status=ALL").then((r) => r.json()),
      fetch("/api/admin/quizzes").then((r) => r.json()),
    ])
      .then(([verifData, quizData]) => {
        const payments = verifData.payments || [];
        const quizzes = quizData.quizzes || [];

        const pending = payments.filter((p: any) => p.status === "PENDING").length;
        const approved = payments.filter((p: any) => p.status === "APPROVED").length;
        const totalRev = approved * 100;

        setStats({
          totalRegistrations: payments.length,
          pendingPayments: pending,
          approvedPayments: approved,
          totalRevenue: totalRev,
          activeQuizzes: quizzes.filter((q: any) => q.status === "ACTIVE").length,
        });

        setRecentPayments(payments.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Overview Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time platform metrics, payment verifications queue, and quiz management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/verifications"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Payments ({stats.pendingPayments})</span>
          </Link>
          <Link
            href="/admin/quizzes"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quiz</span>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Verifications</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.pendingPayments}</div>
          <span className="text-[11px] text-amber-400 block font-medium">Requires UTR verification</span>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Verified Participants</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.approvedPayments}</div>
          <span className="text-[11px] text-emerald-400 block font-medium">Unlocked quiz hall</span>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">₹{stats.totalRevenue}</div>
          <span className="text-[11px] text-indigo-400 block font-medium">From verified fees</span>
        </div>

        <div className="p-6 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Quizzes</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.activeQuizzes}</div>
          <span className="text-[11px] text-purple-400 block font-medium">Live competitions</span>
        </div>
      </div>

      {/* RECENT PAYMENTS QUEUE TABLE */}
      <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Recent Payment Proof Submissions
          </h2>
          <Link href="/admin/verifications" className="text-xs font-semibold text-indigo-400 hover:underline">
            View All →
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 text-center">No payment submissions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">UTR / Transaction ID</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-mono text-indigo-400">{p.registrationId}</td>
                    <td className="py-3 px-4 text-white font-semibold">{p.registration?.user?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">{p.transactionId}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(p.submittedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {p.status === "APPROVED" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          APPROVED
                        </span>
                      ) : p.status === "REJECTED" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                          REJECTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/admin/verifications"
                        className="px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-[11px] font-semibold"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
