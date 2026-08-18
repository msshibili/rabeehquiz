"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  QrCode,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Folder,
  Key,
  Copy,
  Sparkles,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState({
    feeAmount: 100.0,
    currency: "INR",
    upiId: "quizpro@upi",
    accountName: "ProQuiz Competitions Ltd",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quizpro@upi&pn=ProQuiz%20Competitions&am=100&cu=INR",
    instructions: "Scan QR code using GPay, PhonePe, or Paytm. Submit payment screenshot & UTR ID.",
    active: true,
  });

  const [platformSettings, setPlatformSettings] = useState({
    platformName: "NATIONAL QUIZ CHAMPIONSHIP 2026",
    logoUrl: "",
    primaryColor: "#4F46E5",
    contactEmail: "support@proquiz.com",
    contactPhone: "+91 98765 43210",
  });

  const [googleConfig, setGoogleConfig] = useState({
    serviceAccountEmail: "",
    privateKey: "",
    sheetId: "",
    driveFolderId: "",
    formUrl: "",
  });

  const freeAppsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (data.action === "SYNC_PARTICIPANT") {
      sheet.appendRow([
        data.registrationId,
        data.name,
        data.email,
        data.phone,
        data.place,
        data.institution,
        data.course,
        data.utr,
        data.proofLink,
        data.status,
        data.timestamp
      ]);
    } else if (data.action === "SYNC_QUIZ_RESULT") {
      sheet.appendRow([
        "QUIZ_RESULT",
        data.registrationId,
        data.name,
        data.quizTitle,
        data.score,
        data.percentage,
        data.status,
        data.timestamp
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        if (data.platformSettings) setPlatformSettings(data.platformSettings);
        if (data.googleConfig) setGoogleConfig(data.googleConfig);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentSettings,
          platformSettings,
          googleConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setMsg("Settings updated successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestMsg(null);

    try {
      const res = await fetch("/api/admin/settings", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Google Integration Test Failed");
      setTestMsg({ type: "success", text: data.message });
    } catch (err: any) {
      setTestMsg({ type: "error", text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(freeAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" /> Platform & Free Google Integration
          </h1>
          <p className="text-slate-400">
            Configure UPI payment payee ID, QR code image, registration fee amount, and FREE Google Sheets & Drive sync
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* PAYMENT SETTINGS */}
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" /> UPI Payment & QR Code Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Registration Fee Amount (INR)
              </label>
              <input
                type="number"
                value={paymentSettings.feeAmount}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, feeAmount: parseFloat(e.target.value) || 100 })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                UPI ID (Payee VPA)
              </label>
              <input
                type="text"
                value={paymentSettings.upiId}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block font-semibold text-slate-300 uppercase tracking-wider">
                UPI QR Code Image (Upload File or Enter URL)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={paymentSettings.qrCodeUrl}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, qrCodeUrl: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="flex-1 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const uploadFormData = new FormData();
                      uploadFormData.append("file", file);
                      try {
                        const res = await fetch("/api/upload", { method: "POST", body: uploadFormData });
                        const data = await res.json();
                        if (data.url) {
                          setPaymentSettings({ ...paymentSettings, qrCodeUrl: data.url });
                          alert("QR Code Image uploaded successfully!");
                        }
                      } catch (err: any) {
                        alert(err.message || "Upload failed");
                      }
                    }
                  }}
                  className="text-xs text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900 p-1.5 rounded-xl border border-slate-800 shrink-0"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Payment Instructions for Participants
              </label>
              <textarea
                rows={2}
                value={paymentSettings.instructions}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, instructions: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* METHOD 1: FREE GOOGLE APPS SCRIPT WEB APP (RECOMMENDED & 100% FREE) */}
        <div className="p-6 rounded-3xl glass-card border border-emerald-500/40 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Method 1: FREE Google Apps Script Web App (Easiest - 1 Min Setup)
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              100% FREE & ZERO CREDENTIALS
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3 text-[11px]">
            <div className="font-bold text-slate-200">How to set up in 1 minute (Free for any Gmail account):</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Open your Google Sheet -&gt; Click <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Paste the free Apps Script code below. Click <strong>Deploy &gt; New deployment</strong>.</li>
              <li>Select type <strong>Web app</strong> -&gt; Set "Execute as: <b>Me</b>" and "Who has access: <b>Anyone</b>".</li>
              <li>Click <strong>Deploy</strong>, copy your <strong>Web App URL</strong>, and paste it below!</li>
            </ol>

            {/* Code Snippet Box with Copy Button */}
            <div className="relative pt-2">
              <div className="flex justify-between items-center bg-slate-900 px-3 py-1.5 rounded-t-xl text-[10px] text-slate-400 font-mono border border-slate-800">
                <span>Free Google Apps Script Code</span>
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedScript ? "Copied to Clipboard!" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-b-xl border border-t-0 border-slate-800 font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-36">
                {freeAppsScriptCode}
              </pre>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Google Apps Script Web App URL (Paste URL here)
            </label>
            <input
              type="url"
              value={googleConfig.formUrl || ""}
              onChange={(e) => setGoogleConfig({ ...googleConfig, formUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* METHOD 2: FREE GOOGLE CLOUD SERVICE ACCOUNT */}
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" /> Method 2: Google Cloud Service Account OAuth (Optional)
            </h2>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0"
            >
              {testing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Test Service Account
                </>
              )}
            </button>
          </div>

          {testMsg && (
            <div
              className={`p-4 rounded-xl font-semibold flex items-center gap-2 ${
                testMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{testMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-400" /> Service Account Email
              </label>
              <input
                type="email"
                value={googleConfig.serviceAccountEmail || ""}
                onChange={(e) => setGoogleConfig({ ...googleConfig, serviceAccountEmail: e.target.value })}
                placeholder="quiz-service@my-project.iam.gserviceaccount.com"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-indigo-400" /> Google Drive Folder ID
              </label>
              <input
                type="text"
                value={googleConfig.driveFolderId || ""}
                onChange={(e) => setGoogleConfig({ ...googleConfig, driveFolderId: e.target.value })}
                placeholder="1a2b3c4d5e6f7g8h9i0j"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" /> Google Sheet ID
              </label>
              <input
                type="text"
                value={googleConfig.sheetId || ""}
                onChange={(e) => setGoogleConfig({ ...googleConfig, sheetId: e.target.value })}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Service Account Private Key (RSA Private Key PEM)
              </label>
              <textarea
                rows={3}
                value={googleConfig.privateKey || ""}
                onChange={(e) => setGoogleConfig({ ...googleConfig, privateKey: e.target.value })}
                placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[10px] outline-none"
              />
            </div>
          </div>
        </div>

        {/* PLATFORM BRANDING */}
        <div className="p-6 rounded-3xl glass-card border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" /> Platform & Championship Branding
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Competition Platform Title
              </label>
              <input
                type="text"
                value={platformSettings.platformName}
                onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Support Phone Number *
              </label>
              <input
                type="tel"
                value={platformSettings.contactPhone}
                onChange={(e) => setPlatformSettings({ ...platformSettings, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Support Contact Email
              </label>
              <input
                type="email"
                value={platformSettings.contactEmail}
                onChange={(e) => setPlatformSettings({ ...platformSettings, contactEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Platform Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
