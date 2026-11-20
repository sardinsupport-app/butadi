"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Volume2 } from "lucide-react";
import { KendariLogo } from "@/components/Navbar";
import { playWelcomeSound } from "@/lib/sound";
import { useButadi } from "@/context/ButadiContext";

export function WelcomeScreen() {
  const pathname = usePathname();
  const { sekolahList, soundEnabled } = useButadi();

  // Default langsung true agar tampil seketika setiap kali aplikasi di-refresh / dimuat
  const [visible, setVisible] = useState<boolean>(true);
  const [exiting, setExiting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [soundPlayed, setSoundPlayed] = useState<boolean>(false);

  // Deteksi apakah sedang berada di portal sekolah tertentu (/sekolah/[npsn], /sekolah/[npsn]/kiosk, /sekolah/[npsn]/admin)
  const schoolMatch = pathname?.match(/^\/sekolah\/([^/]+)/);
  const activeNpsn = schoolMatch ? schoolMatch[1] : null;
  const activeSchool = activeNpsn
    ? sekolahList.find((s) => s.npsn === activeNpsn)
    : null;

  // Catat konteks portal terakhir agar saat berpindah ke portal sekolah juga otomatis memutar Welcome Screen sekolah tersebut
  const lastPortalKeyRef = useRef<string | null>(null);

  const triggerWelcome = useCallback(async () => {
    setExiting(false);
    setProgress(0);
    setSoundPlayed(false);
    setVisible(true);

    if (soundEnabled) {
      const ok = await playWelcomeSound();
      if (ok) {
        setSoundPlayed(true);
      }
    }
  }, [soundEnabled]);

  const handleEnterApp = useCallback(
    async (withSound = true) => {
      if (withSound && soundEnabled && !soundPlayed) {
        await playWelcomeSound();
        setSoundPlayed(true);
      }
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 650);
    },
    [soundEnabled, soundPlayed]
  );

  // Tampilkan otomatis setiap kali halaman di-refresh / dimuat pertama kali,
  // serta saat berpindah masuk ke portal sekolah (/sekolah/[npsn])
  useEffect(() => {
    const currentPortalKey = activeNpsn ? `school:${activeNpsn}` : "main";
    if (lastPortalKeyRef.current !== currentPortalKey) {
      lastPortalKeyRef.current = currentPortalKey;
      triggerWelcome();
    }
  }, [activeNpsn, triggerWelcome]);

  // Dengarkan event replay manual dari tombol "Welcome Intro" di Navbar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleReplay = () => {
      triggerWelcome();
    };
    window.addEventListener("butadi:replay-welcome", handleReplay);
    return () => {
      window.removeEventListener("butadi:replay-welcome", handleReplay);
    };
  }, [triggerWelcome]);

  // Animasi progress bar selama Welcome Screen tampil
  useEffect(() => {
    if (!visible || exiting) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 85);

    return () => clearInterval(interval);
  }, [visible, exiting]);

  // Ketika progress mencapai 100%, otomatis masuk dengan mulus (atau pengguna bisa klik kapan saja untuk langsung masuk + membunyikan chime)
  useEffect(() => {
    if (visible && !exiting && progress >= 100) {
      const timer = setTimeout(() => {
        handleEnterApp(true);
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [visible, exiting, progress, handleEnterApp]);

  if (!visible) return null;

  return (
    <div
      onClick={() => handleEnterApp(true)}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 overflow-hidden select-none cursor-pointer transition-all duration-700 no-print ${
        exiting
          ? "opacity-0 scale-110 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #1E40AF 0%, #0F2C59 48%, #040D21 100%)",
      }}
    >
      {/* Efek Gradasi Cahaya Aurora Berlapis di Latar Belakang */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#F59E0B]/30 via-amber-300/20 to-sky-400/25 blur-3xl animate-aurora-pulse" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-400/25 via-blue-500/20 to-indigo-600/25 blur-3xl animate-aurora-pulse" />
      <div className="pointer-events-none absolute top-1/4 -right-24 w-80 h-80 rounded-full bg-gradient-to-bl from-[#F59E0B]/25 to-emerald-400/20 blur-3xl animate-aurora-pulse" />

      {/* Jaring Cahaya Halus */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(rgba(245, 158, 11, 0.45) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Konten Utama Welcome Screen */}
      <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center space-y-7">
        {/* Badge Instansi */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#F59E0B]/50 shadow-lg">
          <Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200">
            Pemerintah Kota Kendari
          </span>
        </div>

        {/* Lingkaran Cincin Gradasi Cahaya Berputar & Logo Resmi Kota Kendari */}
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
          {/* Pancaran Aura Emas & Biru Langit */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F59E0B] via-sky-400 to-emerald-400 opacity-40 blur-2xl animate-aurora-pulse" />

          {/* Cincin Conic Gradient Berputar */}
          <div
            className="absolute inset-2 rounded-full p-[3px] animate-spin-slow opacity-90"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, #F59E0B 25%, #FEF08A 40%, #38BDF8 65%, transparent 85%, #F59E0B 100%)",
            }}
          >
            <div className="w-full h-full rounded-full bg-[#0A1E40]/90 backdrop-blur-xl" />
          </div>

          {/* Cincin Putus-putus Berlawanan Arah */}
          <div className="absolute inset-5 rounded-full border-2 border-dashed border-[#F59E0B]/50 animate-spin-reverse-slow" />

          {/* Medali Kaca & Logo Kota Kendari + Kilau Cahaya Melintas */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center overflow-hidden animate-float-logo">
            {/* Kilatan Cahaya Menyapu Logo */}
            <div className="pointer-events-none absolute inset-0 w-1/2 h-[200%] -top-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-light-sweep" />
            <KendariLogo className="w-24 h-24 sm:w-28 sm:h-28 relative z-10" />
          </div>
        </div>

        {/* Nama Aplikasi dengan Efek Gradasi Cahaya Berkilau */}
        <div className="space-y-2.5 px-2">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
            <span className="bg-gradient-to-r from-white via-[#FDE68A] to-[#F59E0B] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(245,158,11,0.45)] animate-text-shimmer">
              BUTADI
            </span>
          </h1>

          <p className="text-base sm:text-xl font-extrabold text-white tracking-wide">
            Buku Tamu Digital &amp; E-Receptionist Terintegrasi
          </p>

          <p className="text-xs sm:text-sm font-semibold text-blue-200 max-w-lg mx-auto">
            {activeSchool
              ? `${activeSchool.nama_sekolah.toUpperCase()} (NPSN: ${activeSchool.npsn}) • Dinas Pendidikan dan Kebudayaan Kota Kendari`
              : "Dinas Pendidikan dan Kebudayaan Kota Kendari • Provinsi Sulawesi Tenggara"}
          </p>
        </div>

        {/* Bar Progres Cahaya & Tombol Masuk */}
        <div className="w-full max-w-xs space-y-4 pt-1">
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden border border-white/15 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-[#F59E0B] to-amber-300 transition-all duration-150 shadow-[0_0_12px_#F59E0B]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnterApp(true);
            }}
            className="group relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F59E0B] via-amber-400 to-[#F59E0B] text-[#0F2C59] font-extrabold text-xs sm:text-sm shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center gap-2 overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-light-sweep" />
            <Volume2 className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              {activeSchool
                ? `Masuk Buku Tamu ${activeSchool.nama_sekolah}`
                : "Masuk ke Aplikasi BUTADI"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
