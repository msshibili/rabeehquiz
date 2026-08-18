import Link from "next/link";
import { db } from "@/lib/db";
import {
  Award,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  HelpCircle,
  QrCode,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  FileCheck,
} from "lucide-react";

export const revalidate = 0; // Dynamic server component

export default async function Home() {
  const quizzes = await db.quiz.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true, attempts: true },
      },
    },
  });

  const paymentSettings = (await db.paymentSettings.findFirst()) || {
    feeAmount: 100.0,
    upiId: "quizpro@upi",
    accountName: "ProQuiz Competitions Ltd",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=quizpro@upi&pn=ProQuiz%20Competitions&am=100&cu=INR",
    instructions: "Scan the QR code using GPay, PhonePe, Paytm or any UPI app. Submit payment screenshot & UTR number upon registration.",
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-slate-900 bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-sm shadow-indigo-500/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>BADRUL HUDA QUIZ COMPETITION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
            Test Your Knowledge. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Compete Nationwide & Win Cash Prizes!
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Join thousands of participants across the country. Take live proctored online quizzes, track real-time leaderboards, and receive official verified certificates.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Register Now (₹{paymentSettings.feeAmount})</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/#quizzes"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-indigo-400" />
              <span>Explore Active Quizzes</span>
            </Link>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl glass-card border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Prize Pool
              </div>
              <div className="text-2xl font-bold text-white">₹50,000+</div>
              <div className="text-[11px] text-emerald-400 mt-1">Cash Prizes & Trophies</div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Verification
              </div>
              <div className="text-2xl font-bold text-white">Instant UTR</div>
              <div className="text-[11px] text-slate-400 mt-1">100% Verified Registrations</div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Anti-Cheat
              </div>
              <div className="text-2xl font-bold text-white">Tab Shield</div>
              <div className="text-[11px] text-amber-400 mt-1">Real-time Proctored Engine</div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-800/80">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" /> Certification
              </div>
              <div className="text-2xl font-bold text-white">Instant Score</div>
              <div className="text-[11px] text-purple-400 mt-1">Download Verified Report</div>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE QUIZZES SECTION */}
      <section id="quizzes" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Live Competitions
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Active Quizzes & Challenges</h2>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            All registered and approved participants can take active quizzes within the specified time duration.
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-card border border-slate-800 text-slate-400">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No Active Quizzes Right Now</h3>
            <p className="text-sm">Check back soon! New quiz rounds will be announced shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-2xl glass-card border border-slate-800/80 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ACTIVE
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {quiz.durationMinutes} Mins
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                    {quiz.description || "Test your knowledge and skills in this live competitive challenge."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs mb-6">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Questions</span>
                      <span className="font-semibold text-slate-200">{quiz._count.questions} MCQs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Passing</span>
                      <span className="font-semibold text-indigo-400">{quiz.passingPercentage}% Marks</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Negative Mark</span>
                      <span className="font-semibold text-amber-400">{quiz.negativeMarking ? "Yes (-0.5)" : "No"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Max Attempts</span>
                      <span className="font-semibold text-slate-200">{quiz.maxAttempts} Allowed</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/quiz/${quiz.id}`}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                >
                  <span>Start Quiz Challenge</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* REGISTRATION & PAYMENT GUIDANCE */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Simple 3-Step Process</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">How to Participate in 3 Minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl glass-card border border-slate-800 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Create Account & Fill Info</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register with your basic personal details, college/institution, and phone number.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-slate-800 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Scan & Pay ₹{paymentSettings.feeAmount}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan the official UPI QR Code using Google Pay, PhonePe, or Paytm. Save payment screenshot & 12-digit UTR ID.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-slate-800 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Take Test & Get Result</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once verifier approves your UTR, unlock all active quizzes, attempt test, and view your scorecard instantly!
              </p>
            </div>
          </div>

          {/* QR Code & Payment Information Box */}
          <div className="mt-16 p-8 rounded-3xl glass-panel border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 bg-white p-3 rounded-2xl shrink-0 flex items-center justify-center shadow-lg">
              {/* QR Code preview */}
              <img
                src={paymentSettings.qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5" /> Official UPI Payee: {paymentSettings.upiId}
              </div>

              <h3 className="text-xl font-bold text-white">Registration Fee: ₹{paymentSettings.feeAmount} INR</h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {paymentSettings.instructions}
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Instant Receipt
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" /> Secure UTR Matching
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUIDELINES & ANTI-CHEAT RULES */}
      <section id="guidelines" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Test Integrity</span>
            <h2 className="text-3xl font-extrabold text-white mt-1 mb-6">Anti-Cheat & Quiz Rules</h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 p-4 rounded-xl glass-card border border-slate-800">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">No Tab Switching Allowed</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Switching browser tabs or minimizing the window will trigger security warnings. Excessive tab switches will automatically terminate and submit your attempt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl glass-card border border-slate-800">
                <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Strict Countdown Timer</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    The timer starts immediately when you open the test page. If time runs out, your selected answers will be auto-submitted automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl glass-card border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Mandatory Questions Marked with (*)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    All questions marked with a red asterisk (*) must be answered before final submission can be accepted.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" /> Frequently Asked Questions
            </h3>

            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="font-bold text-slate-200 mb-1">How soon is my payment verified?</h4>
                <p className="text-slate-400">Our verifiers review UTR numbers continuously. Verification usually takes 5 - 15 minutes.</p>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <h4 className="font-bold text-slate-200 mb-1">Can I re-attempt a quiz if I disconnect?</h4>
                <p className="text-slate-400">If your attempt is still within the active timer duration, you can resume the quiz right where you left off!</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">When will I get my scorecard and answers?</h4>
                <p className="text-slate-400">Immediately upon submission! You can view detailed correct answer explanations and rank on the leaderboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
