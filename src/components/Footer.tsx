"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Mail, Phone, Shield, FileText } from "lucide-react";

export function Footer() {
  const [platformSettings, setPlatformSettings] = useState({
    platformName: "BADRUL HUDA QUIZ",
    contactEmail: "support@badrulhudaquiz.com",
    contactPhone: "+91 98765 43210",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.platformSettings) {
          setPlatformSettings(data.platformSettings);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-base">
              {platformSettings.platformName || "BADRUL HUDA QUIZ"}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Official Online Quiz Competition Platform. Empowering students and participants with fair, anti-cheat monitored online tests and verifiable results.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
            <li><Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Participant Dashboard</Link></li>
            <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Participant Sign In</Link></li>
            <li><Link href="/admin" className="hover:text-indigo-400 transition-colors">Admin & Verifier Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase">Rules & Integrity</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-indigo-400" /> Automated Anti-Cheat Monitoring</li>
            <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-indigo-400" /> Quick Payment Verification</li>
            <li className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-indigo-400" /> Merit Certificates & Rankings</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3 text-xs tracking-wider uppercase">Support & Contact</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> {platformSettings.contactEmail}
            </li>
            <li className="flex items-center gap-2 font-semibold text-indigo-300">
              <Phone className="w-3.5 h-3.5 text-indigo-400" /> {platformSettings.contactPhone}
            </li>
            <li className="text-[11px] text-slate-500 pt-2">Office Hours: Mon - Sat (9:00 AM - 6:00 PM IST)</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 {platformSettings.platformName || "Badrul Huda Quiz"}. All rights reserved.</p>
      </div>
    </footer>
  );
}
