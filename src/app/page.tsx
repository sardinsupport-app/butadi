"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  Monitor,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { calculateIKM } from "@/lib/ikm";
import { KendariLogo } from "@/components/Navbar";

export default function MainMenuHomePage() {
  const { bidangList, kunjunganList, skmList } = useButadi();

  const today = new Date().toISOString().split("T")[0];
  const todayVisits = kunjunganList.filter((k) => k.tanggal === today);
  const activeQueue = todayVisits.filter(
    (k) =>
      k.status === "Menunggu" ||
      k.status === "Dilayani" ||
      k.status === "Disposisi"
  );
  const ikm = calculateIKM(skmList);
  const availablePejabatCount = bidangList.filter(
    (b) => b.status_pejabat === "Tersedia"
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Hero Banner Utama */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white p-7 sm:p-11 shadow-2xl border-2 border-[#F59E0B]/70 relative overflow-hidden">
        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-bold tracking-wide text-[#F59E0B]">
            <Sparkles className="w-4 h-4" />
            <span>LAYANAN PENERIMAAN TAMU &amp; SURVEI PELAYANAN TERPADU</span>
          </div>

          <div className="flex items-center gap-4">
            <KendariLogo className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#F59E0B]">
                Pemerintah Kota Kendari
              </p>
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                BUTADI &mdash; Buku Tamu Digital Dikbud Kendari
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            Selamat datang di portal layanan digital{" "}
            <strong>Dinas Pendidikan dan Kebudayaan Kota Kendari</strong>.
            Silakan pilih menu fasilitas layanan di bawah ini untuk melakukan
            registrasi kunjungan, memantau antrean lobi, atau mengisi Survei
            Kepuasan Masyarakat (SKM).
          </p>

          {/* Indikator Live Singkat */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-[11px] text-blue-200 font-semibold">
                Tamu Hari Ini
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {todayVisits.length} Orang
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-[11px] text-blue-200 font-semibold">
                Antrean Aktif
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#F59E0B] mt-0.5">
                {activeQueue.length} Tiket
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-[11px] text-blue-200 font-semibold">
                Unit Siap Melayani
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-0.5">
                {availablePejabatCount} / {bidangList.length} Bidang
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-[11px] text-blue-200 font-semibold">
                Indeks Kepuasan (IKM)
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-0.5">
                {ikm.nilaiIkm || "94.44"}{" "}
                <span className="text-xs font-bold">
                  (Mutu {ikm.mutuPelayanan})
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MENU UTAMA FASILITAS APLIKASI (HANYA 3 MENU PUBLIK) */}
      <div className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#1E40AF]">
            MENU FASILITAS UTAMA
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F2C59]">
            Pilih Layanan Digital BUTADI
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Klik salah satu kartu menu di bawah ini sesuai dengan keperluan
            kunjungan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* MENU 1: PORTAL TAMU */}
          <Link
            href="/tamu"
            className="group relative bg-white rounded-3xl p-7 shadow-md hover:shadow-2xl border-2 border-slate-200 hover:border-[#1E40AF] transition-all duration-200 flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center group-hover:bg-[#1E40AF] group-hover:text-white transition shadow-sm">
                  <QrCode className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider">
                  Check-In &amp; E-Ticket
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0F2C59] group-hover:text-[#1E40AF] transition">
                  Portal Tamu
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Registrasi kunjungan tamu baru dengan fitur{" "}
                  <strong>Smart Auto-Fill NIK/NIP</strong>, pemilihan Bidang
                  tujuan, pengambilan swafoto (selfie), serta pelacakan status{" "}
                  <strong>E-Ticket Digital</strong> secara <em>real-time</em>.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Isi Buku Tamu cepat tanpa instalasi aplikasi</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cek &amp; lacak status panggilan ruangan</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#1E40AF]">
                Buka Portal Tamu
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-[#0F2C59] flex items-center justify-center group-hover:translate-x-1 transition-transform shadow">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* MENU 2: PORTAL LOBI KIOSK */}
          <Link
            href="/kiosk"
            className="group relative bg-white rounded-3xl p-7 shadow-md hover:shadow-2xl border-2 border-slate-200 hover:border-[#0F2C59] transition-all duration-200 flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#0F2C59] flex items-center justify-center group-hover:bg-[#0F2C59] group-hover:text-[#F59E0B] transition shadow-sm">
                  <Monitor className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0F2C59] font-extrabold text-[11px] uppercase tracking-wider">
                  Monitor Lobi &amp; QR
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0F2C59] group-hover:text-[#1E40AF] transition">
                  Portal Lobi Kiosk
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Layar informasi interaktif untuk monitor lobi/tablet resepsionis
                  yang menampilkan <strong>Standee QR Code Check-In</strong>,
                  daftar panggilan antrean tamu aktif, dan status kehadiran
                  pejabat tiap Bidang.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tampilan Standee QR Code siap pindai/cetak</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pantauan status kehadiran pejabat real-time</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#0F2C59]">
                Buka Portal Lobi Kiosk
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#0F2C59] text-[#F59E0B] flex items-center justify-center group-hover:translate-x-1 transition-transform shadow">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* MENU 3: PORTAL SKM */}
          <Link
            href="/skm"
            className="group relative bg-white rounded-3xl p-7 shadow-md hover:shadow-2xl border-2 border-slate-200 hover:border-teal-600 transition-all duration-200 flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition shadow-sm">
                  <ClipboardCheck className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 font-extrabold text-[11px] uppercase tracking-wider">
                  PermenPAN-RB 14/2017
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0F2C59] group-hover:text-teal-700 transition">
                  Portal SKM
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Survei Kepuasan Masyarakat berbasis{" "}
                  <strong>9 Unsur Pelayanan</strong> bagi tamu yang telah
                  menyelesaikan urusan layanan, dilengkapi kotak saran digital
                  dan kalkulasi nilai IKM otomatis.
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Penilaian cepat 9 Unsur Pelayanan (&lt; 1 menit)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kotak saran &amp; apresiasi layanan Dikbud</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-teal-700">
                Buka Portal SKM
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Alur Pelayanan & Jam Operasional */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#0F2C59]">
              Jam Pelayanan Kantor
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Senin &ndash; Kamis: 08.00 &ndash; 16.00 WITA
              <br />
              Jumat: 08.00 &ndash; 16.30 WITA
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#0F2C59]">
              Lokasi Kantor Dikbud Kendari
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Jl. Balaikota III No. 44, Pondambea, Kec. Kadia, Kota Kendari,
              Sulawesi Tenggara 93117
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#0F2C59]">
              Pelayanan Bebas Pungutan (Gratis)
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Seluruh layanan administrasi pendidikan &amp; kebudayaan tidak
              dipungut biaya. Sampaikan masukan melalui Portal SKM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
