"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, User, LogOut, ShieldAlert, Sparkles, CheckCircle2, LayoutDashboard, Menu, X } from "lucide-react";

export function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
              BADRUL HUDA QUIZ
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block tracking-widest uppercase">Online Competition Platform</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-300 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/#quizzes" className="text-slate-300 hover:text-white transition-colors">
            Active Quizzes
          </Link>
          <Link href="/#guidelines" className="text-slate-300 hover:text-white transition-colors">
            Guidelines & Rewards
          </Link>

          {(currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "VERIFIER") && (
            <Link
              href="/admin"
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <ShieldAlert className="w-4 h-4" /> Admin Portal
            </Link>
          )}
        </nav>

        {/* Actions & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-slate-800/60 animate-pulse rounded-lg" />
          ) : currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-medium transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
                {currentUser.registration?.status === "APPROVED" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </Link>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-5 space-y-3 text-sm font-medium animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-slate-900"
          >
            Home
          </Link>
          <Link
            href="/#quizzes"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-slate-900"
          >
            Active Quizzes
          </Link>
          <Link
            href="/#guidelines"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white border-b border-slate-900"
          >
            Guidelines & Rewards
          </Link>

          {(currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "VERIFIER") && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center gap-2 py-2 text-amber-400 font-semibold"
            >
              <ShieldAlert className="w-4 h-4" /> Admin Portal
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
