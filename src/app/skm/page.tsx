"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareHeart,
  Search,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { calculateIKM, UNSUR_SKM_LIST } from "@/lib/ikm";

function PortalSkmContent() {
  const searchParams = useSearchParams();
  const { bidangList, kunjunganList, skmList, submitSkm } = useButadi();

  const initialTiket = searchParams.get("tiket") || "";
  const [tiketInput, setTiketInput] = useState(initialTiket);
  const [selectedKunjunganId, setSelectedKunjunganId] = useState<string>("");
  const [selectedBidangId, setSelectedBidangId] = useState<string>(
    bidangList[2]?.id || bidangList[0]?.id || ""
  );

  const [scores, setScores] = useState<Record<string, number>>({
    u1_persyaratan: 4,
    u2_prosedur: 4,
    u3_waktu: 4,
    u4_biaya: 4,
    u5_produk: 4,
    u6_kompetensi: 4,
    u7_perilaku: 4,
    u8_sarpras: 4,
    u9_pengaduan: 4,
  });

  const [saranMasukan, setSaranMasukan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Match ticket from URL or input
  useEffect(() => {
    if (!tiketInput.trim()) return;
    const found = kunjunganList.find(
      (k) => k.kode_tiket.toLowerCase() === tiketInput.trim().toLowerCase()
    );
    if (found) {
      setSelectedKunjunganId(found.id);
      setSelectedBidangId(found.bidang_id);
    }
  }, [tiketInput, kunjunganList]);

  useEffect(() => {
    if (!selectedBidangId && bidangList.length > 0) {
      setSelectedBidangId(bidangList[0].id);
    }
  }, [bidangList, selectedBidangId]);

  const matchedKunjungan = kunjunganList.find(
    (k) => k.id === selectedKunjunganId
  );
  const bidangMap = useMemo(
    () => new Map(bidangList.map((b) => [b.id, b])),
    [bidangList]
  );

  const overallIkm = useMemo(() => calculateIKM(skmList), [skmList]);

  const handleSelectScore = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const fallbackKunjunganId =
      selectedKunjunganId ||
      kunjunganList[0]?.id ||
      "22222222-2222-4222-8222-222222222201";

    await submitSkm({
      kunjungan_id: fallbackKunjunganId,
      bidang_id: selectedBidangId,
      u1_persyaratan: scores.u1_persyaratan,
      u2_prosedur: scores.u2_prosedur,
      u3_waktu: scores.u3_waktu,
      u4_biaya: scores.u4_biaya,
      u5_produk: scores.u5_produk,
      u6_kompetensi: scores.u6_kompetensi,
      u7_perilaku: scores.u7_perilaku,
      u8_sarpras: scores.u8_sarpras,
      u9_pengaduan: scores.u9_pengaduan,
      saran_masukan: saranMasukan,
    });

    setSubmitting(false);
    setSubmittedSuccess(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Portal SKM + Live IKM Scoreboard */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-teal-900 to-[#0F2C59] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-b-4 border-[#F59E0B] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[11px] font-extrabold uppercase">
            Portal 4 &bull; Standar PermenPAN-RB No. 14 Tahun 2017
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Survei Kepuasan Masyarakat (SKM) Digital
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Penilaian Bapak/Ibu terhadap <strong>9 Unsur Pelayanan</strong>{" "}
            secara otomatis menghitung Nilai Indeks Kepuasan Masyarakat (IKM)
            Dinas Pendidikan dan Kebudayaan Kota Kendari secara{" "}
            <em>real-time</em>.
          </p>
        </div>

        <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
            Indeks Kepuasan Masyarakat Saat Ini
          </p>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-4xl font-extrabold text-white">
              {overallIkm.nilaiIkm || "94.44"}
            </span>
            <div className="text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-extrabold">
                Mutu {overallIkm.mutuPelayanan}
              </span>
              <p className="text-xs text-teal-200 font-bold mt-0.5">
                {overallIkm.kinerjaUnit}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-blue-200 mt-2">
            Berdasarkan {overallIkm.totalResponden} responden terverifikasi
          </p>
        </div>
      </div>

      {submittedSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border-2 border-teal-500 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F2C59]">
            Terima Kasih atas Penilaian &amp; Masukan Anda!
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Survei Kepuasan Masyarakat (SKM) Anda telah berhasil disimpan dan
            langsung memperbarui skor IKM pada layar Lobi serta Dashboard
            Eksekutif Kepala Dinas Dikbud Kota Kendari.
          </p>
          <div className="inline-flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
            <Award className="w-8 h-8 text-[#F59E0B]" />
            <div className="text-left">
              <p className="text-xs text-slate-500 font-semibold">
                Skor IKM Terbaru Dikbud Kendari:
              </p>
              <p className="text-xl font-extrabold text-[#0F2C59]">
                {overallIkm.nilaiIkm} &mdash; Mutu {overallIkm.mutuPelayanan} (
                {overallIkm.kinerjaUnit})
              </p>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                setSubmittedSuccess(false);
                setSaranMasukan("");
              }}
              className="px-6 py-3 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold shadow"
            >
              Isi Survei untuk Tiket Lainnya
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Koneksi Tiket Kunjungan & Pilihan Bidang */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-extrabold text-base text-[#0F2C59] flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-teal-600" />
                  <span>Identitas Layanan &amp; Bidang Tujuan</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Nilai kepuasan otomatis terhubung dengan Bidang yang baru saja
                  melayani Anda
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {kunjunganList.slice(0, 3).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      setTiketInput(k.kode_tiket);
                      setSelectedKunjunganId(k.id);
                      setSelectedBidangId(k.bidang_id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                      selectedKunjunganId === k.id
                        ? "bg-[#F59E0B] text-[#0F2C59] border-[#F59E0B]"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {k.kode_tiket}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode Tiket Kunjungan (Opsional / Otomatis dari Link WA)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tiketInput}
                    onChange={(e) => setTiketInput(e.target.value)}
                    placeholder="Contoh: BTD-KDI-001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
                {matchedKunjungan && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1.5">
                    Terhubung: {matchedKunjungan.nama_tamu} (
                    {matchedKunjungan.instansi_asal})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bidang / Unit Layanan yang Dinilai{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBidangId}
                  onChange={(e) => setSelectedBidangId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                >
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_bidang}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pejabat:{" "}
                  {bidangMap.get(selectedBidangId)?.kepala_bidang || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 9 Unsur Pelayanan Interactive Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#0F2C59] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                <span>
                  Kuesioner 9 Unsur Pelayanan (PermenPAN-RB No. 14/2017)
                </span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  setScores({
                    u1_persyaratan: 4,
                    u2_prosedur: 4,
                    u3_waktu: 4,
                    u4_biaya: 4,
                    u5_produk: 4,
                    u6_kompetensi: 4,
                    u7_perilaku: 4,
                    u8_sarpras: 4,
                    u9_pengaduan: 4,
                  })
                }
                className="text-xs font-bold text-teal-700 hover:underline"
              >
                Pilih Sangat Baik Semua (4 Bintang)
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {UNSUR_SKM_LIST.map((unsur, idx) => {
                const currentVal = scores[unsur.key] || 4;
                return (
                  <div
                    key={unsur.key}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-mono text-xs font-extrabold">
                            {idx + 1}. {unsur.kode}
                          </span>
                          <h4 className="font-extrabold text-sm text-[#0F2C59]">
                            {unsur.nama}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700">
                          {unsur.pertanyaan}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {unsur.opsi.map((op) => {
                        const selected = currentVal === op.nilai;
                        return (
                          <button
                            key={op.nilai}
                            type="button"
                            onClick={() =>
                              handleSelectScore(unsur.key, op.nilai)
                            }
                            className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between gap-1.5 ${
                              selected
                                ? "border-teal-600 bg-teal-50/70 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {Array.from({ length: op.nilai }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    selected
                                      ? "fill-[#F59E0B] text-[#F59E0B]"
                                      : "fill-slate-300 text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-slate-400">
                                Skor {op.nilai}
                              </span>
                              <p
                                className={`text-xs font-extrabold ${
                                  selected ? "text-teal-950" : "text-slate-700"
                                }`}
                              >
                                {op.label}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kotak Saran & Apresiasi Digital */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
            <label className="block text-sm font-extrabold text-[#0F2C59] flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-[#F59E0B]" />
              <span>Kotak Saran, Masukan &amp; Apresiasi Digital</span>
            </label>
            <textarea
              rows={3}
              value={saranMasukan}
              onChange={(e) => setSaranMasukan(e.target.value)}
              placeholder="Tuliskan saran perbaikan atau apresiasi Anda terhadap petugas dan fasilitas pelayanan Dikbud Kota Kendari..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] font-extrabold text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>
              {submitting
                ? "Menyimpan & Menghitung Skor IKM..."
                : "Kirim Penilaian SKM & Perbarui Skor IKM"}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function PortalSkmPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-8 text-center text-sm text-slate-500">
          Memuat Portal Survei Kepuasan Masyarakat (SKM)...
        </div>
      }
    >
      <PortalSkmContent />
    </Suspense>
  );
}
