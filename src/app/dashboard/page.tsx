"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  ArrowRight,
  Upload,
  Zap,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  // Payment form state
  const [transactionId, setTransactionId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user) {
        router.push("/login");
        return;
      }
      setUser(meData.user);

      // Fetch payment settings
      const settingsRes = await fetch("/api/admin/settings");
      const settingsData = await settingsRes.json();
      setPaymentSettings(settingsData.paymentSettings);

      // Fetch active quizzes
      const quizzesRes = await fetch("/api/admin/quizzes");
      const quizzesData = await quizzesRes.json();
      if (quizzesData.quizzes) {
        setQuizzes(quizzesData.quizzes.filter((q: any) => q.status === "ACTIVE"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim() && !selectedFile) {
      setPaymentMsg({ type: "error", text: "Please upload a payment screenshot or enter a UTR number." });
      return;
    }

    setSubmittingPayment(true);
    setPaymentMsg(null);

    try {
      let finalScreenshotUrl = "/sample-payment-proof.png";

      // If a screenshot file was selected, upload it first
      if (selectedFile) {
        setUploadingFile(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Screenshot upload failed.");
        finalScreenshotUrl = uploadData.url;
        setUploadingFile(false);
      }

      // Submit payment record
      const res = await fetch("/api/registration/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
          screenshotUrl: finalScreenshotUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit payment");

      setPaymentMsg({ type: "success", text: data.message });
      setTransactionId("");
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchDashboardData();
    } catch (err: any) {
      setPaymentMsg({ type: "error", text: err.message });
    } finally {
      setSubmittingPayment(false);
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const reg = user?.registration;
  const latestPayment = reg?.payments?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* HEADER BAR */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome, {user.name}</h1>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              {reg?.registrationId || "REG-2026-USER"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Email: <span className="text-slate-200">{user.email}</span> • Phone: <span className="text-slate-200">{user.phone}</span>
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="shrink-0">
          {reg?.status === "APPROVED" ? (
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2 glow-emerald">
              <CheckCircle2 className="w-5 h-5" />
              <span>REGISTRATION VERIFIED & APPROVED</span>
            </div>
          ) : reg?.status === "REJECTED" ? (
            <div className="px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>PAYMENT REJECTED</span>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" />
              <span>PAYMENT PENDING VERIFICATION</span>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT PROOF / FILE UPLOAD CARD */}
      {reg?.status !== "APPROVED" && (
        <div className="p-8 rounded-3xl glass-card border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                <span>Submit Payment Proof Screenshot & UTR Number</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {reg?.status === "REJECTED"
                  ? `Rejection Reason: ${latestPayment?.rejectionReason || "Invalid UTR or screenshot"}. Please re-upload your payment screenshot and 12-digit UTR ID.`
                  : "Scan the QR code, pay ₹100 via UPI (Google Pay, PhonePe, Paytm), upload your screenshot image, and enter your 12-digit UTR number for verifier approval."}
              </p>
            </div>

            {/* QR Code */}
            {paymentSettings && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                <img
                  src={paymentSettings.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-20 h-20 bg-white p-1 rounded-xl object-contain"
                />
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px]">UPI Payee</span>
                  <span className="font-bold text-white block">{paymentSettings.upiId}</span>
                  <span className="text-indigo-400 font-semibold block">Fee: ₹{paymentSettings.feeAmount}</span>
                </div>
              </div>
            )}
          </div>

          {paymentMsg && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                paymentMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{paymentMsg.text}</span>
            </div>
          )}

          {/* Submit UTR Form with File Upload */}
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Upload Payment Screenshot (.png, .jpg, .webp)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900 p-2 rounded-xl border border-slate-800"
                  />
                </div>
              </div>

              {/* UTR Number Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  12-Digit UTR / Transaction ID (Optional if Screenshot Uploaded)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UTR202608189876 (optional if screenshot uploaded)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 text-xs outline-none"
                />
              </div>
            </div>

            {/* Live Screenshot Preview */}
            {previewUrl && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-white block">{selectedFile?.name}</span>
                  <span className="text-slate-400 text-[11px]">
                    {(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB • Ready for upload
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingPayment || uploadingFile}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              {submittingPayment ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Submit Verification Proof</span>
                </>
              )}
            </button>
          </form>

          {latestPayment && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Last Submitted UTR: <code className="text-indigo-300 font-bold">{latestPayment.transactionId}</code></span>
              {latestPayment.driveFileId && (
                <a
                  href={latestPayment.driveFileId}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> View Uploaded Google Drive File
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE QUIZZES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Active Quizzes & Competitions
          </h2>
          <span className="text-xs text-slate-400">{quizzes.length} Quizzes Available</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-card border border-slate-800 text-slate-400 text-xs">
            No active quizzes at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-6 rounded-2xl glass-card border border-slate-800 hover:border-indigo-500/40 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {quiz.title}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" /> {quiz.durationMinutes} Mins
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-6">
                    <span>Passing: <strong className="text-white">{quiz.passingPercentage}%</strong></span>
                    <span>Negative Marking: <strong className="text-amber-400">{quiz.negativeMarking ? "Yes" : "No"}</strong></span>
                  </div>
                </div>

                {reg?.status === "APPROVED" ? (
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <span>Enter Quiz Hall</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-800/80 text-slate-500 font-semibold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700/50"
                  >
                    <span>Awaiting Payment Verification</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
