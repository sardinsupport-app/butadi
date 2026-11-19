"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  Lock,
  MapPin,
  Monitor,
  QrCode,
  School,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { KECAMATAN_KENDARI_LIST } from "@/lib/supabase";
import { JenjangSekolah } from "@/types/butadi";

export default function DirektoriSekolahPage() {
  const { sekolahList, kunjunganSekolahList } = useButadi();

  const [selectedJenjang, setSelectedJenjang] = useState<string>("ALL");
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  // Hitung jumlah tamu hari ini & total per sekolah
  const statsPerSekolah = useMemo(() => {
    const map = new Map<string, { todayCount: number; totalCount: number }>();
    kunjunganSekolahList.forEach((k) => {
      const curr = map.get(k.sekolah_id) || { todayCount: 0, totalCount: 0 };
      curr.totalCount += 1;
      if (k.tanggal === today) {
        curr.todayCount += 1;
      }
      map.set(k.sekolah_id, curr);
    });
    return map;
  }, [kunjunganSekolahList, today]);

  const filteredSekolah = useMemo(() => {
    return sekolahList.filter((s) => {
      if (!s.aktif) return false;
      if (selectedJenjang !== "ALL" && s.jenjang !== selectedJenjang)
        return false;
      if (selectedKecamatan !== "ALL" && s.kecamatan !== selectedKecamatan)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = s.nama_sekolah.toLowerCase().includes(q);
        const matchNpsn = s.npsn.toLowerCase().includes(q);
        const matchKepsek = s.kepala_sekolah.toLowerCase().includes(q);
        const matchKec = s.kecamatan.toLowerCase().includes(q);
        if (!matchNama && !matchNpsn && !matchKepsek && !matchKec) return false;
      }
      return true;
    });
  }, [sekolahList, selectedJenjang, selectedKecamatan, searchQuery]);

  const todaySchoolVisitsCount = useMemo(
    () => kunjunganSekolahList.filter((k) => k.tanggal === today).length,
    [kunjunganSekolahList, today]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner Direktori Sekolah Terintegrasi */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white p-6 sm:p-8 shadow-xl border-b-4 border-[#F59E0B]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-extrabold uppercase tracking-wider text-[#F59E0B]">
              <School className="w-3.5 h-3.5" />
              <span>
                EKOSISTEM BUKU TAMU TERINTEGRASI DINAS PENDIDIKAN &amp; SEKOLAH
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Portal Buku Tamu Digital Sekolah se-Kota Kendari
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Pilih satuan pendidikan (TK/PAUD, SD, atau SMP) di bawah ini untuk
              mengisi buku tamu kunjungan sekolah, menampilkan layar QR Kiosk
              sekolah, atau masuk ke{" "}
              <strong>Portal Admin Mandiri Sekolah</strong>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/15">
              <p className="text-[10px] uppercase font-bold text-blue-200">
                Sekolah Aktif
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {sekolahList.length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/15">
              <p className="text-[10px] uppercase font-bold text-blue-200">
                Tamu Hari Ini
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#F59E0B] mt-0.5">
                {todaySchoolVisitsCount}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 text-center border border-white/15">
              <p className="text-[10px] uppercase font-bold text-blue-200">
                Total Riwayat
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-0.5">
                {kunjunganSekolahList.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Otonomi Sekolah & Integrasi Dinas */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#1E40AF] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Otonomi Pengelolaan Sekolah:</strong> Data buku tamu setiap
            sekolah hanya dapat dikelola/di-<em>maintenance</em> oleh{" "}
            <strong>Admin Sekolah masing-masing</strong> menggunakan Passcode
            sekolahnya, dan terhubung secara <em>real-time</em> ke dashboard
            pemantauan Dinas Pendidikan Kota Kendari.
          </span>
        </div>
      </div>

      {/* Filter & Pencarian Sekolah */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Sekolah, NPSN (misal: 40402601), atau Nama Kepala Sekolah..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs focus:ring-2 focus:ring-[#1E40AF] outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none font-semibold"
            >
              <option value="ALL">Semua Jenjang (TK / SD / SMP)</option>
              <option value="SMP">Jenjang SMP</option>
              <option value="SD">Jenjang SD</option>
              <option value="TK/PAUD">Jenjang TK / PAUD</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none font-semibold"
            >
              <option value="ALL">Semua Kecamatan se-Kota Kendari</option>
              {KECAMATAN_KENDARI_LIST.map((kec) => (
                <option key={kec} value={kec}>
                  Kec. {kec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Jenjang Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(["ALL", "SMP", "SD", "TK/PAUD"] as const).map((j) => {
            const active = selectedJenjang === j;
            const count =
              j === "ALL"
                ? sekolahList.length
                : sekolahList.filter((s) => s.jenjang === (j as JenjangSekolah))
                    .length;
            return (
              <button
                key={j}
                type="button"
                onClick={() => setSelectedJenjang(j)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? "bg-[#0F2C59] text-[#F59E0B] shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {j === "ALL" ? "Semua Satuan Pendidikan" : `Jenjang ${j}`} (
                {count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Daftar Kartu Sekolah */}
      {filteredSekolah.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
          <School className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-base text-slate-800">
            Sekolah Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ada satuan pendidikan yang cocok dengan kata kunci atau filter
            Anda. Admin Dinas Pendidikan dapat menambahkan data sekolah baru
            melalui Portal Admin Dinas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSekolah.map((sek) => {
            const st = statsPerSekolah.get(sek.id) || {
              todayCount: 0,
              totalCount: 0,
            };
            const jenjangBadge =
              sek.jenjang === "SMP"
                ? "bg-blue-100 text-[#1E40AF] border-blue-200"
                : sek.jenjang === "SD"
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : "bg-amber-100 text-amber-900 border-amber-200";

            const statusBadge =
              sek.status_kepsek === "Tersedia"
                ? "bg-emerald-100 text-emerald-800"
                : sek.status_kepsek === "Rapat"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800";

            return (
              <div
                key={sek.id}
                className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl border-2 border-slate-200 hover:border-[#1E40AF] transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${jenjangBadge}`}
                      >
                        {sek.jenjang}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                        NPSN: {sek.npsn}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}
                      title="Status Kehadiran Kepala Sekolah"
                    >
                      Kepsek: {sek.status_kepsek}
                    </span>
                  </div>

                  {/* Nama Sekolah & Alamat */}
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0F2C59] leading-snug">
                      {sek.nama_sekolah}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1E40AF] shrink-0 mt-0.5" />
                      <span>
                        Kec. <strong>{sek.kecamatan}</strong> &bull;{" "}
                        {sek.alamat || "Kota Kendari"}
                      </span>
                    </p>
                  </div>

                  {/* Info Kepala Sekolah & Statistik Singkat */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-[#0F2C59]" />
                        <span>Kepala Sekolah:</span>
                      </span>
                      <span className="font-bold text-slate-800 text-right truncate">
                        {sek.kepala_sekolah}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span>Kunjungan Tamu:</span>
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-[#1E40AF]">
                          Hari Ini: {st.todayCount}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-slate-600">
                          Total: {st.totalCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi 3 Portal Sekolah */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/sekolah/${sek.npsn}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Isi Buku Tamu Sekolah</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/sekolah/${sek.npsn}/kiosk`}
                      className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0F2C59] border border-blue-200 font-bold text-[11px] transition flex items-center justify-center gap-1.5"
                    >
                      <Monitor className="w-3.5 h-3.5 text-[#1E40AF]" />
                      <span>Kiosk &amp; QR</span>
                    </Link>

                    <Link
                      href={`/sekolah/${sek.npsn}/admin`}
                      className="py-2 px-3 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5"
                      title="Khusus Operator / Admin Sekolah"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Admin Sekolah</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
