"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  ClipboardCheck,
  Home,
  Lock,
  Monitor,
  QrCode,
  Sparkles,
  X,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";

export const ISOLATED_SCHOOL_SESSION_KEY = "butadi_isolated_school_npsn";

export function KendariLogo({
  className = "w-10 h-10",
}: {
  className?: string;
}) {
  return (
    <img
      src="/logo-kendari.png"
      alt="Logo Pemerintah Kota Kendari"
      className={`object-contain select-none drop-shadow-md ${className}`}
    />
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    sekolahList,
    soundEnabled,
    setSoundEnabled,
    toasts,
    dismissToast,
  } = useButadi();

  const [lockedSchoolNpsn, setLockedSchoolNpsn] = useState<string | null>(null);

  // Deteksi apakah URL saat ini berada di dalam portal sekolah spesifik (/sekolah/[npsn])
  const schoolMatch = pathname?.match(/^\/sekolah\/([^/]+)/);
  const urlSchoolNpsn = schoolMatch ? schoolMatch[1] : null;
  const isDinasProtectedRoute =
    pathname?.startsWith("/admin") || pathname?.startsWith("/kadis");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingLocked = sessionStorage.getItem(ISOLATED_SCHOOL_SESSION_KEY);

    // Jika sesi sudah terkunci pada satu sekolah tertentu:
    if (existingLocked) {
      setLockedSchoolNpsn(existingLocked);
      // Blokir akses ke aplikasi utama (/, /tamu, /kiosk, /skm, /sekolah) maupun ke NPSN sekolah lain
      if (!isDinasProtectedRoute) {
        if (!urlSchoolNpsn || urlSchoolNpsn !== existingLocked) {
          router.replace(`/sekolah/${existingLocked}`);
        }
      }
      return;
    }

    // Jika pertama kali masuk ke URL sekolah (/sekolah/[npsn]), langsung kunci sesi peramban ke sekolah tersebut
    if (urlSchoolNpsn) {
      sessionStorage.setItem(ISOLATED_SCHOOL_SESSION_KEY, urlSchoolNpsn);
      setLockedSchoolNpsn(urlSchoolNpsn);
    }
  }, [pathname, urlSchoolNpsn, isDinasProtectedRoute, router]);

  const activeSchoolNpsn =
    urlSchoolNpsn || (!isDinasProtectedRoute ? lockedSchoolNpsn : null);
  const activeSchool = activeSchoolNpsn
    ? sekolahList.find((s) => s.npsn === activeSchoolNpsn)
    : null;

  // Menu khusus ketika berada di Portal Sekolah (Aplikasi Utama Dinas TIDAK ditampilkan & TIDAK dapat diakses)
  const schoolNavItems = activeSchoolNpsn
    ? [
        {
          href: `/sekolah/${activeSchoolNpsn}`,
          label: "Buku Tamu Sekolah",
          icon: QrCode,
          exact: true,
        },
        {
          href: `/sekolah/${activeSchoolNpsn}/kiosk`,
          label: "Layar Kiosk & QR Sekolah",
          icon: Monitor,
          exact: false,
        },
      ]
    : [];

  // Menu aplikasi utama Kantor Dinas (Hanya tampil jika bukan sesi portal sekolah)
  const dinasNavItems = [
    {
      href: "/",
      label: "Menu Utama",
      icon: Home,
      exact: true,
    },
    {
      href: "/tamu",
      label: "Portal Tamu",
      icon: QrCode,
      exact: false,
    },
    {
      href: "/kiosk",
      label: "Portal Lobi Kiosk",
      icon: Monitor,
      exact: false,
    },
    {
      href: "/skm",
      label: "Portal SKM",
      icon: ClipboardCheck,
      exact: false,
    },
  ];

  const navItems = activeSchoolNpsn ? schoolNavItems : dinasNavItems;
  const brandHref = activeSchoolNpsn ? `/sekolah/${activeSchoolNpsn}` : "/";
  const isSchoolAdminRoute = Boolean(
    activeSchoolNpsn && pathname?.endsWith("/admin")
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-lg border-b-2 border-[#F59E0B] tenun-header-pattern no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
            {/* Brand Identity (Mengikuti Identitas Sekolah jika di Portal Sekolah) */}
            <div className="flex items-center justify-between">
              <Link href={brandHref} className="flex items-center gap-3 group">
                <KendariLogo className="w-11 h-11 shrink-0 transition-transform group-hover:scale-105" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                      {activeSchoolNpsn
                        ? activeSchool?.nama_sekolah ||
                          `Sekolah NPSN ${activeSchoolNpsn}`
                        : "BUTADI"}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59]">
                      {activeSchoolNpsn
                        ? `NPSN ${activeSchoolNpsn}`
                        : "Dikbud Kendari"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 leading-snug line-clamp-1 sm:line-clamp-none">
                    {activeSchoolNpsn
                      ? `Buku Tamu Digital Resmi ${
                          activeSchool?.nama_sekolah || "Satuan Pendidikan"
                        } • Dinas Pendidikan & Kebudayaan Kota Kendari`
                      : "Buku Tamu Digital & E-Receptionist Dinas Pendidikan dan Kebudayaan Kota Kendari"}
                  </p>
                </div>
              </Link>

              {/* Mobile Bell & Welcome Intro Button */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new Event("butadi:replay-welcome"))
                  }
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F59E0B]"
                  title="Tampilkan Welcome Screen & Efek Suara"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title={
                    soundEnabled
                      ? "Suara Notifikasi Aktif"
                      : "Suara Notifikasi Mati"
                  }
                >
                  {soundEnabled ? (
                    <Bell className="w-4 h-4 text-[#F59E0B]" />
                  ) : (
                    <BellOff className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Menu Navigation */}
            <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar touch-pan-x">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      active
                        ? "bg-[#F59E0B] text-[#0F2C59] shadow-md font-extrabold"
                        : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isSchoolAdminRoute && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500/20 border border-[#F59E0B] text-[#F59E0B] whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mode Admin Sekolah</span>
                </span>
              )}

              {isDinasProtectedRoute && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500/20 border border-[#F59E0B] text-[#F59E0B] whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {pathname?.startsWith("/kadis")
                      ? "Mode Eksekutif Kepala Dinas"
                      : "Mode Portal Admin Dinas"}
                  </span>
                </span>
              )}
            </nav>

            {/* Desktop Controls: Welcome Intro & Bell */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("butadi:replay-welcome"))
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-amber-200 hover:text-white transition"
                title="Putar Ulang Animasi Welcome Screen & Efek Suara"
              >
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                <span>Welcome Intro</span>
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition"
                title="Pengaturan Suara Lonceng Antrean"
              >
                {soundEnabled ? (
                  <>
                    <Bell className="w-4 h-4 text-[#F59E0B]" />
                    <span>Suara Bell Aktif</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 text-slate-300" />
                    <span>Mute</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Real-Time Notification Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-[#0F2C59] text-white p-4 rounded-2xl shadow-2xl border-l-4 border-[#F59E0B] flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-4"
          >
            <div className="flex items-start gap-2.5">
              <Bell className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#F59E0B] uppercase tracking-wider">
                    Notifikasi Real-Time
                  </span>
                  <span className="text-[10px] text-blue-200">
                    {t.timestamp}
                  </span>
                </div>
                <p className="font-bold text-sm mt-0.5">{t.title}</p>
                <p className="text-xs text-blue-100 mt-0.5">{t.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-blue-200 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
