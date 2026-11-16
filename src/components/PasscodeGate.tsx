"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { KendariLogo } from "@/components/Navbar";

interface PasscodeGateProps {
  storageKey: string;
  expectedPasscode: string;
  portalBadge: string;
  portalTitle: string;
  portalSubtitle: string;
  children: (onLock: () => void) => React.ReactNode;
}

export function PasscodeGate({
  storageKey,
  expectedPasscode,
  portalBadge,
  portalTitle,
  portalSubtitle,
  children,
}: PasscodeGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved === "unlocked") {
        setIsUnlocked(true);
      }
      setChecking(false);
    }
  }, [storageKey]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.trim() === expectedPasscode) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(storageKey, "unlocked");
      }
      setErrorMsg(null);
      setPasscodeInput("");
      setIsUnlocked(true);
    } else {
      setErrorMsg("Passcode yang Anda masukkan tidak sesuai. Silakan coba lagi.");
    }
  };

  const handleLock = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(storageKey);
    }
    setIsUnlocked(false);
    setPasscodeInput("");
    setErrorMsg(null);
  };

  if (checking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Memeriksa otorisasi portal...
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children(handleLock)}</>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#0F2C59] overflow-hidden tenun-card-watermark">
        {/* Header Gate */}
        <div className="bg-gradient-to-br from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white p-6 text-center space-y-3 border-b-4 border-[#F59E0B]">
          <div className="flex justify-center">
            <div className="relative">
              <KendariLogo className="w-14 h-14" />
              <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-[#0F2C59] flex items-center justify-center absolute -bottom-1 -right-1 shadow">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[10px] font-extrabold uppercase tracking-wider">
            {portalBadge}
          </span>
          <h1 className="text-xl font-extrabold">{portalTitle}</h1>
          <p className="text-xs text-blue-100 leading-relaxed">
            {portalSubtitle}
          </p>
        </div>

        {/* Form Passcode */}
        <form onSubmit={handleUnlock} className="p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#1E40AF]" />
              <span>Masukkan Passcode Keamanan</span>
            </label>
            <div className="relative">
              <input
                type={showPasscode ? "text" : "password"}
                required
                autoFocus
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ketik passcode otorisasi..."
                className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
                title={showPasscode ? "Sembunyikan" : "Tampilkan Passcode"}
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>Buka Akses Portal</span>
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0F2C59] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Layar Menu Utama</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
