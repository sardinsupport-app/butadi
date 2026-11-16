"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Monitor,
  Printer,
  QrCode,
  Users,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { calculateIKM } from "@/lib/ikm";
import { KendariLogo } from "@/components/Navbar";

export default function PortalKioskPage() {
  const { bidangList, kunjunganList, skmList } = useButadi();
  const [originUrl, setOriginUrl] = useState("https://butadi.vercel.app");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleString("id-ID", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const qrTargetUrl = `${originUrl}/tamu`;
  const today = new Date().toISOString().split("T")[0];
  const todayVisits = kunjunganList.filter((k) => k.tanggal === today);
  const activeQueue = todayVisits.filter(
    (k) =>
      k.status === "Menunggu" ||
      k.status === "Dilayani" ||
      k.status === "Disposisi"
  );
  const ikm = calculateIKM(skmList);
  const bidangMap = new Map(bidangList.map((b) => [b.id, b]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar Kiosk */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white rounded-3xl p-5 sm:p-6 shadow-xl border-b-4 border-[#F59E0B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Monitor className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[10px] font-extrabold uppercase tracking-wider">
                Layar Monitor Lobi &amp; Kiosk
              </span>
              {currentTime && (
                <span className="text-xs text-blue-200 font-medium">
                  &bull; {currentTime} WITA
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">
              Monitor Informasi Pelayanan &amp; Antrean Tamu Real-Time
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <Link
            href="/tamu"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] font-extrabold text-xs shadow transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Isi Buku Tamu di Perangkat Ini</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
          >
            <Printer className="w-4 h-4 text-[#F59E0B]" />
            <span>Cetak QR Lobi</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu Utama</span>
          </Link>
        </div>
      </div>

      {/* Main Grid Kiosk: Standee QR + Status Pejabat + Antrean */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Standee QR Code & Skor IKM */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border-4 border-[#F59E0B] text-center space-y-4 tenun-card-watermark">
            <div className="flex items-center justify-center gap-2.5 border-b border-slate-200 pb-3">
              <KendariLogo className="w-9 h-9" />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pemerintah Kota Kendari
                </p>
                <p className="text-xs font-extrabold text-[#0F2C59]">
                  DINAS PENDIDIKAN &amp; KEBUDAYAAN
                </p>
              </div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#1E40AF] font-extrabold text-xs">
                SCAN QR CODE CHECK-IN TAMU
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Pindai dengan kamera HP untuk mengisi Buku Tamu Digital tanpa
                aplikasi tambahan
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-[#0F2C59]/30 inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={qrTargetUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0F2C59"
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-slate-100 rounded-xl p-2 text-[11px] font-mono text-slate-700 break-all">
              {qrTargetUrl}
            </div>

            <div className="text-[11px] font-semibold text-[#0F2C59] flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Cepat &bull; Tanpa Antre &bull; E-Ticket WA</span>
            </div>
          </div>

          {/* Ringkasan IKM & Kunjungan */}
          <div className="bg-[#0F2C59] text-white rounded-3xl p-5 shadow-lg border border-blue-800 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-[10px] uppercase text-blue-200 font-bold">
                Tamu Hari Ini
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">
                {todayVisits.length}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-[10px] uppercase text-blue-200 font-bold">
                Antrean Aktif
              </p>
              <p className="text-2xl font-extrabold text-[#F59E0B] mt-0.5">
                {activeQueue.length}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-[10px] uppercase text-blue-200 font-bold">
                IKM ({ikm.mutuPelayanan})
              </p>
              <p className="text-2xl font-extrabold text-emerald-300 mt-0.5">
                {ikm.nilaiIkm || "94.44"}
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right: Status Kehadiran Pejabat & Layar Panggilan Antrean */}
        <div className="lg:col-span-8 space-y-6">
          {/* Layar Panggilan Antrean Tamu Aktif */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#1E40AF] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#F59E0B]" />
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base">
                    Layar Panggilan Antrean Tamu Aktif
                  </h2>
                  <p className="text-xs text-blue-100">
                    Status panggilan masuk ruangan pelayanan secara real-time
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white/15">
                {activeQueue.length} Tamu Aktif
              </span>
            </div>

            <div className="p-5 divide-y divide-slate-100 space-y-3 max-h-[320px] overflow-y-auto">
              {activeQueue.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  Belum ada antrean tamu yang sedang menunggu panggilan saat
                  ini.
                </div>
              ) : (
                activeQueue.map((k) => {
                  const bidang = bidangMap.get(k.bidang_id);
                  const statusBadge =
                    k.status === "Dilayani"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : k.status === "Disposisi"
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : "bg-amber-100 text-amber-800 border-amber-300";

                  return (
                    <div
                      key={k.id}
                      className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-mono text-xs font-extrabold">
                            {k.kode_tiket}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {k.nama_tamu}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({k.instansi_asal})
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#1E40AF]">
                          Tujuan: {bidang?.nama_bidang || "-"} &bull;{" "}
                          <span className="text-slate-600 font-normal">
                            {bidang?.lokasi_ruangan}
                          </span>
                        </p>
                        {k.catatan_disposisi_kadis && (
                          <p className="text-[11px] bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 font-medium">
                            Disposisi: {k.catatan_disposisi_kadis}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${statusBadge}`}
                        >
                          {k.status === "Dilayani"
                            ? "SILAKAN MASUK RUANGAN"
                            : k.status === "Disposisi"
                            ? "DIALIHKAN / DISPOSISI"
                            : "MENUNGGU KONFIRMASI"}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(k.waktu_masuk).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Informasi Ketersediaan Pejabat & Bidang Layanan */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#F59E0B]" />
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base">
                    Status Kehadiran Pejabat &amp; Unit Layanan Dikbud Kendari
                  </h2>
                  <p className="text-xs text-blue-200">
                    Diperbarui secara real-time oleh Sekretariat &amp; Admin
                    Bidang
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                Live Status
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:gap-px bg-slate-100">
              {bidangList.map((b) => {
                const badgeColor =
                  b.status_pejabat === "Tersedia"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : b.status_pejabat === "Rapat"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-rose-100 text-rose-800 border-rose-300";

                const dotColor =
                  b.status_pejabat === "Tersedia"
                    ? "bg-emerald-500"
                    : b.status_pejabat === "Rapat"
                    ? "bg-amber-500"
                    : "bg-rose-500";

                return (
                  <div
                    key={b.id}
                    className="bg-white p-4 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-extrabold text-xs sm:text-sm text-[#0F2C59]">
                        {b.nama_bidang}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {b.status_pejabat === "Tersedia"
                          ? "Ada di Kantor"
                          : b.status_pejabat === "Rapat"
                          ? "Sedang Rapat"
                          : "Dinas Luar"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 font-semibold">
                        {b.kepala_bidang}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#1E40AF]" />
                        <span>{b.lokasi_ruangan}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
