"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, QrCode, School, ShieldAlert } from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import {
  ISOLATED_SCHOOL_SESSION_KEY,
  KendariLogo,
} from "@/components/Navbar";

export default function AksesPortalSekolahGatewayPage() {
  const router = useRouter();
  const { sekolahList } = useButadi();

  const [npsnInput, setNpsnInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEnterSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = npsnInput.trim();
    const found = sekolahList.find(
      (s) => s.npsn.toLowerCase() === cleaned.toLowerCase() && s.aktif
    );
    if (!found) {
      setErrorMsg(
        "Kode NPSN Sekolah tidak ditemukan atau belum terdaftar di sistem BUTADI."
      );
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem(ISOLATED_SCHOOL_SESSION_KEY, found.npsn);
    }
    router.replace(`/sekolah/${found.npsn}`);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#0F2C59] overflow-hidden tenun-card-watermark">
        <div className="bg-gradient-to-br from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white p-6 text-center space-y-3 border-b-4 border-[#F59E0B]">
          <div className="flex justify-center">
            <div className="relative">
              <KendariLogo className="w-14 h-14" />
              <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-[#0F2C59] flex items-center justify-center absolute -bottom-1 -right-1 shadow">
                <School className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[10px] font-extrabold uppercase tracking-wider">
            Mode Isolasi Privasi Satuan Pendidikan
          </span>
          <h1 className="text-xl font-extrabold">
            Akses Portal Buku Tamu Sekolah
          </h1>
          <p className="text-xs text-blue-100 leading-relaxed">
            Masukkan 8 digit Nomor Pokok Sekolah Nasional (NPSN) untuk membuka
            halaman Buku Tamu Digital khusus sekolah Anda.
          </p>
        </div>

        <form onSubmit={handleEnterSchool} className="p-6 sm:p-7 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#1E40AF]" />
              <span>Kode NPSN Sekolah</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={npsnInput}
              onChange={(e) => {
                setNpsnInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Masukkan NPSN Sekolah..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-[#F59E0B]" />
            <span>Buka Buku Tamu Sekolah</span>
          </button>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-[#0F2C59] shrink-0 mt-0.5" />
            <span>
              Demi menjaga privasi data antar-instansi, setelah masuk ke portal
              sekolah, perangkat hanya akan menampilkan halaman buku tamu
              sekolah tersebut.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
