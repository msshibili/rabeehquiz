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
        <div className="p-5 sm:p-8 rounded-3xl glass-card border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Submit Payment Proof Screenshot & UTR Number</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {reg?.status === "REJECTED"
                  ? `Rejection Reason: ${latestPayment?.rejectionReason || "Invalid UTR or screenshot"}. Please re-upload your payment screenshot and 12-digit UTR ID.`
                  : "Scan the QR code below using Google Pay, PhonePe, or Paytm. Upload your payment screenshot and optional 12-digit UTR number for verifier approval."}
              </p>
            </div>

            {/* QR Code */}
            {paymentSettings && (
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 shrink-0 w-full sm:w-auto">
                <img
                  src={paymentSettings.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-20 h-20 bg-white p-1 rounded-xl object-contain shrink-0"
                />
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">UPI Payee</span>
                  <span className="font-bold text-white block text-sm select-all">{paymentSettings.upiId}</span>
                  <span className="text-indigo-400 font-bold block text-xs">Fee: ₹{paymentSettings.feeAmount} INR</span>
                </div>
              </div>
            )}
          </div>

          {paymentMsg && (
            <div
              className={`p-4 rounded-xl text-xs sm:text-sm flex items-start sm:items-center gap-2.5 ${
                paymentMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {paymentMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <span>{paymentMsg.text}</span>
            </div>
          )}

          {/* Submit UTR Form with File Upload */}
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Touch-Friendly File Selector Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Upload Payment Screenshot (.PNG, .JPG, .WEBP, .HEIC)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    id="screenshot-input"
                    accept="image/*, .png, .jpg, .jpeg, .webp, .heic, .heif"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-dashed border-slate-700 group-hover:border-indigo-500 transition-all text-center flex flex-col items-center justify-center gap-2 min-h-[110px]">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {selectedFile ? "Tap to Change Screenshot" : "Tap or Drag Screenshot Here"}
                      </span>
                      <span className="text-[11px] text-slate-400">Supports Mobile Gallery, Camera & Files (Max 20MB)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* UTR Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  12-Digit UTR / Transaction ID (Optional if Screenshot Attached)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 423910987654 (optional if screenshot attached)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Live Screenshot Preview Card */}
            {previewUrl && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 shrink-0 flex items-center justify-center relative">
                    <img
                      src={previewUrl}
                      alt="Screenshot Preview"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        // Fallback for iOS HEIC/HEIF binary formats that browser cannot render natively in <img>
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = '<div class="text-indigo-400 text-xs font-bold text-center px-1">IMG</div>';
                      }}
                    />
                  </div>
                  <div className="text-xs min-w-0">
                    <span className="font-bold text-white block truncate">{selectedFile?.name}</span>
                    <span className="text-indigo-300 text-[11px] font-medium block">
                      {(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB • Screenshot Attached & Ready
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
                  title="Remove screenshot"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingPayment || uploadingFile}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
            >
              {submittingPayment || uploadingFile ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{uploadingFile ? "Uploading Screenshot..." : "Submitting Verification..."}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Submit Verification Proof</span>
                </>
              )}
            </button>
          </form>

          {latestPayment && (
            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Last Submitted UTR: <code className="text-indigo-300 font-bold font-mono">{latestPayment.transactionId}</code></span>
              {latestPayment.driveFileId && (
                <a
                  href={latestPayment.driveFileId}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline font-semibold flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" /> View Uploaded Google Drive File
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
