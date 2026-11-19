"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BellOff,
  ClipboardCheck,
  Home,
  Lock,
  Monitor,
  QrCode,
  School,
  X,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";

export function KendariLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Dikbud Kota Kendari"
    >
      <path
        d="M32 4L56 14V32C56 46.5 45.5 56.5 32 60C18.5 56.5 8 46.5 8 32V14L32 4Z"
        fill="#0F2C59"
        stroke="#F59E0B"
        strokeWidth="3"
      />
      <path
        d="M32 8L52 16.5V31.5C52 43.8 43.2 52.4 32 55.5C20.8 52.4 12 43.8 12 31.5V16.5L32 8Z"
        fill="#1E40AF"
      />
      <circle
        cx="32"
        cy="28"
        r="11"
        stroke="#F59E0B"
        strokeWidth="2.2"
        strokeDasharray="4 2"
      />
      <path
        d="M21 34C24.5 32.5 28.5 32.5 32 34.5C35.5 32.5 39.5 32.5 43 34V25C39.5 23.5 35.5 23.5 32 25.5C28.5 23.5 24.5 23.5 21 25V34Z"
        fill="#FFFFFF"
      />
      <path
        d="M32 14C34 17 35 19 32 22C29 19 30 17 32 14Z"
        fill="#F59E0B"
      />
      <path
        d="M18 44H46L43 49H21L18 44Z"
        fill="#0D9488"
        stroke="#F59E0B"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { soundEnabled, setSoundEnabled, toasts, dismissToast } = useButadi();

  // Hanya menampilkan menu publik: Menu Utama, Portal Tamu, Portal Lobi Kiosk, dan Portal SKM
  const navItems = [
    {
      href: "/",
      label: "Menu Utama",
      icon: Home,
    },
    {
      href: "/tamu",
      label: "Portal Tamu",
      icon: QrCode,
    },
    {
      href: "/kiosk",
      label: "Portal Lobi Kiosk",
      icon: Monitor,
    },
    {
      href: "/skm",
      label: "Portal SKM",
      icon: ClipboardCheck,
    },
    {
      href: "/sekolah",
      label: "Portal Sekolah",
      icon: School,
    },
  ];

  const isInternalRoute =
    pathname?.startsWith("/admin") || pathname?.startsWith("/kadis");

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0F2C59] text-white shadow-lg border-b-2 border-[#F59E0B] tenun-header-pattern no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
            {/* Brand Identity */}
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <KendariLogo className="w-11 h-11 shrink-0 transition-transform group-hover:scale-105" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                      BUTADI
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59]">
                      Dikbud Kendari
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 leading-snug line-clamp-1 sm:line-clamp-none">
                    Buku Tamu Digital &amp; E-Receptionist Dinas Pendidikan dan
                    Kebudayaan Kota Kendari
                  </p>
                </div>
              </Link>

              {/* Mobile Bell Button */}
              <div className="flex items-center gap-2 lg:hidden">
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

            {/* Public Menu Navigation */}
            <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar touch-pan-x">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
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

              {isInternalRoute && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500/20 border border-[#F59E0B] text-[#F59E0B] whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {pathname?.startsWith("/kadis")
                      ? "Mode Eksekutif Kepala Dinas"
                      : "Mode Portal Admin"}
                  </span>
                </span>
              )}
            </nav>

            {/* Desktop Controls: Bell */}
            <div className="hidden lg:flex items-center gap-2">
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
