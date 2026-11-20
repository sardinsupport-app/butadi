"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Monitor,
  Printer,
  QrCode,
  School,
  Star,
  Users,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { KendariLogo } from "@/components/Navbar";

export default function PortalKioskSekolahPage() {
  const params = useParams<{ npsn: string }>();
  const npsn = params?.npsn || "";

  const { sekolahList, kunjunganSekolahList } = useButadi();
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

  const sekolah = sekolahList.find((s) => s.npsn === npsn);

  if (!sekolah) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-3">
          <School className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-xl font-extrabold text-[#0F2C59]">
            Sekolah Tidak Ditemukan (NPSN: {npsn})
          </h1>
          <Link
            href="/sekolah"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2C59] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Direktori Sekolah</span>
          </Link>
        </div>
      </div>
    );
  }

  const qrTargetUrl = `${originUrl}/sekolah/${sekolah.npsn}`;
  const today = new Date().toISOString().split("T")[0];
  const schoolVisits = kunjunganSekolahList.filter(
    (k) => k.sekolah_id === sekolah.id
  );
  const todayVisits = schoolVisits.filter((k) => k.tanggal === today);
  const activeQueue = todayVisits.filter(
    (k) => k.status === "Menunggu" || k.status === "Dilayani"
  );

  const ratedVisits = schoolVisits.filter((k) => k.nilai_kepuasan !== null);
  const avgRating =
    ratedVisits.length > 0
      ? (
          ratedVisits.reduce((acc, r) => acc + (r.nilai_kepuasan || 0), 0) /
          ratedVisits.length
        ).toFixed(2)
      : "-";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar Kiosk Sekolah */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white rounded-3xl p-5 sm:p-6 shadow-xl border-b-4 border-[#F59E0B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <KendariLogo className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[10px] font-extrabold uppercase tracking-wider">
                KIOSK LOBI SEKOLAH &bull; NPSN {sekolah.npsn}
              </span>
              {currentTime && (
                <span className="text-xs text-blue-200 font-medium">
                  &bull; {currentTime} WITA
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">
              {sekolah.nama_sekolah}
            </h1>
            <p className="text-xs text-blue-200">
              Kecamatan {sekolah.kecamatan} &bull; Dinas Pendidikan &amp;
              Kebudayaan Kota Kendari
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <Link
            href={`/sekolah/${sekolah.npsn}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] font-extrabold text-xs shadow transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Isi Buku Tamu Sekolah</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
          >
            <Printer className="w-4 h-4 text-[#F59E0B]" />
            <span>Cetak Standee QR Sekolah</span>
          </button>
        </div>
      </div>

      {/* Main Grid Kiosk Sekolah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Standee QR Code Sekolah */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border-4 border-[#F59E0B] text-center space-y-4 tenun-card-watermark">
            <div className="flex items-center justify-center gap-2.5 border-b border-slate-200 pb-3">
              <KendariLogo className="w-10 h-10 shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Dinas Pendidikan &amp; Kebudayaan Kota Kendari
                </p>
                <p className="text-xs font-extrabold text-[#0F2C59]">
                  {sekolah.nama_sekolah.toUpperCase()}
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  NPSN: {sekolah.npsn} &bull; Kec. {sekolah.kecamatan}
                </p>
              </div>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#1E40AF] font-extrabold text-xs">
                SCAN QR CODE BUKU TAMU SEKOLAH
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Arahkan kamera HP Anda untuk mengisi Buku Tamu Digital{" "}
                <strong>{sekolah.nama_sekolah}</strong>
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-[#0F2C59]/30 inline-block mx-auto shadow-inner">
              <QRCodeSVG
                value={qrTargetUrl}
                size={185}
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
              <span>Terintegrasi BUTADI Dikbud Kota Kendari</span>
            </div>
          </div>

          {/* Ringkasan Statistik Sekolah */}
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
                Rating (1-4)
              </p>
              <p className="text-2xl font-extrabold text-emerald-300 mt-0.5 flex items-center justify-center gap-1">
                <span>{avgRating}</span>
                {avgRating !== "-" && (
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Status Kepala Sekolah, Unit Layanan & Antrean Tamu */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status Kehadiran Kepala Sekolah & Profil */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pimpinan Satuan Pendidikan
                </p>
                <h2 className="text-lg font-extrabold text-[#0F2C59]">
                  {sekolah.kepala_sekolah}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1E40AF]" />
                  <span>{sekolah.alamat}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <span className="text-[11px] font-semibold text-slate-500">
                Status Kehadiran Kepala Sekolah:
              </span>
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold ${
                  sekolah.status_kepsek === "Tersedia"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : sekolah.status_kepsek === "Rapat"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {sekolah.status_kepsek}
              </span>
            </div>
          </div>

          {/* Layar Antrean Tamu Sekolah Aktif */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#1E40AF] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#F59E0B]" />
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base">
                    Daftar Antrean Tamu {sekolah.nama_sekolah}
                  </h2>
                  <p className="text-xs text-blue-100">
                    Pantauan panggilan pelayanan tamu sekolah hari ini
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-white/15">
                {activeQueue.length} Tamu Aktif
              </span>
            </div>

            <div className="p-5 divide-y divide-slate-100 space-y-3 max-h-[340px] overflow-y-auto">
              {activeQueue.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  Belum ada antrean tamu aktif di {sekolah.nama_sekolah} saat
                  ini.
                </div>
              ) : (
                activeQueue.map((k) => {
                  const statusBadge =
                    k.status === "Dilayani"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300";

                  return (
                    <div
                      key={k.id}
                      className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-2 rounded-xl bg-[#0F2C59] text-[#F59E0B] font-mono font-extrabold text-xs">
                          {k.kode_tiket}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm">
                              {k.nama_tamu}
                            </p>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                              {k.kategori_tamu}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {k.instansi_asal} &rarr;{" "}
                            <strong className="text-slate-700">
                              {k.tujuan_unit}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${statusBadge}`}
                        >
                          {k.status === "Dilayani"
                            ? `Silakan Masuk: ${k.tujuan_unit}`
                            : "Menunggu Konfirmasi"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Unit Layanan yang Tersedia di Sekolah */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-sm text-[#0F2C59] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1E40AF]" />
              <span>Unit Tujuan Pelayanan di {sekolah.nama_sekolah}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(sekolah.unit_layanan || []).map((u) => (
                <div
                  key={u}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0F2C59] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{u}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
