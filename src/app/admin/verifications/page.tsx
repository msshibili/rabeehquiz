"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function AdminVerificationsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  // Selected payment modal state
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/verifications?status=${statusFilter}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedPayment) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          action,
          rejectionReason: action === "REJECT" ? rejectionReason : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setSelectedPayment(null);
      setShowRejectForm(false);
      setRejectionReason("");
      fetchPayments();
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" /> Payment Verification Portal
          </h1>
          <p className="text-xs text-slate-400">
            Inspect payment proofs, verify 12-digit UTR numbers, and approve registrations
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold w-full md:w-auto">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search UTR, Reg ID, Name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-white"
          >
            Search
          </button>
        </form>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-xs text-slate-500 p-8 text-center">No payment submissions found matching filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Participant Details</th>
                  <th className="py-3 px-4">UTR / Transaction ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-mono text-indigo-400">{p.registrationId}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{p.registration?.user?.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.registration?.user?.email} • {p.registration?.user?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-100 font-bold">{p.transactionId}</td>
                    <td className="py-3.5 px-4 text-slate-200">₹{p.amount}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(p.submittedAt).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setShowRejectForm(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Proof
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT PROOF MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Verification Details
              </span>
              <h3 className="text-xl font-extrabold text-white">{selectedPayment.registration?.user?.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Reg ID: {selectedPayment.registrationId}
              </p>
            </div>

            {/* Proof Image Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block font-semibold">Payment Proof Screenshot</span>
              <div className="w-full h-48 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 overflow-hidden relative">
                <img
                  src={selectedPayment.screenshotUrl || "/sample-payment-proof.png"}
                  alt="Payment Proof"
                  className="w-full h-full object-contain"
                  onError={(e: any) => {
                    e.target.src = "https://placehold.co/600x400/1e293b/ffffff?text=Payment+Screenshot+Proof";
                  }}
                />
              </div>
            </div>

            {/* Info Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">UTR / Transaction ID</span>
                <span className="font-bold text-indigo-400 font-mono text-sm block">{selectedPayment.transactionId}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Amount Paid</span>
                <span className="font-bold text-white text-sm block">₹{selectedPayment.amount} INR</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Email & Phone</span>
                <span className="font-medium text-slate-200 block">{selectedPayment.registration?.user?.email}</span>
                <span className="font-medium text-slate-400 block">{selectedPayment.registration?.user?.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Institution & Course</span>
                <span className="font-medium text-slate-200 block">{selectedPayment.registration?.institution || "N/A"}</span>
                <span className="font-medium text-slate-400 block">{selectedPayment.registration?.course || "N/A"}</span>
              </div>
            </div>

            {/* Reject Reason Input (If toggled) */}
            {showRejectForm && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                <label className="block text-xs font-semibold text-red-300">
                  Reason for Rejection
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid UTR ID or mismatched payment screenshot"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Payment
                  </button>

                  <button
                    onClick={() => handleAction("APPROVE")}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                  >
                    {actionLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Approve Registration
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-900 text-slate-400 font-semibold text-xs border border-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleAction("REJECT")}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    Confirm Rejection
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
