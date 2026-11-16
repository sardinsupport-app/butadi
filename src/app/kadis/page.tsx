"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRightLeft,
  Award,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Crown,
  Lock,
  MessageSquareQuote,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { calculateIKM } from "@/lib/ikm";
import { Kunjungan, StatusPejabat } from "@/types/butadi";
import { PasscodeGate } from "@/components/PasscodeGate";

const KADIS_BIDANG_ID = "11111111-1111-4111-8111-111111111101";
const CHART_COLORS = [
  "#0F2C59",
  "#1E40AF",
  "#F59E0B",
  "#0D9488",
  "#6366F1",
  "#EC4899",
];

function PortalKadisDashboard({ onLock }: { onLock: () => void }) {
  const {
    bidangList,
    kunjunganList,
    skmList,
    updateStatusKunjungan,
    updateStatusPejabat,
  } = useButadi();

  const [disposisiModalItem, setDisposisiModalItem] =
    useState<Kunjungan | null>(null);
  const [targetBidangDisposisi, setTargetBidangDisposisi] = useState<string>(
    "11111111-1111-4111-8111-111111111102"
  );
  const [catatanKadis, setCatatanKadis] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const todayVisits = useMemo(
    () => kunjunganList.filter((k) => k.tanggal === today),
    [kunjunganList, today]
  );

  const monthVisits = useMemo(
    () => kunjunganList.filter((k) => k.tanggal.startsWith(currentMonth)),
    [kunjunganList, currentMonth]
  );

  const kadisBidang = bidangList.find((b) => b.id === KADIS_BIDANG_ID);
  const bidangMap = useMemo(
    () => new Map(bidangList.map((b) => [b.id, b])),
    [bidangList]
  );

  // Tamu khusus Kepala Dinas
  const tamuKhususKadis = useMemo(
    () =>
      kunjunganList.filter(
        (k) =>
          k.bidang_id === KADIS_BIDANG_ID ||
          Boolean(k.catatan_disposisi_kadis)
      ),
    [kunjunganList]
  );

  // Bidang paling sibuk
  const bidangDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    kunjunganList.forEach((k) => {
      counts[k.bidang_id] = (counts[k.bidang_id] || 0) + 1;
    });
    return bidangList
      .map((b) => ({
        id: b.id,
        nama: b.nama_bidang
          .replace("Bidang Pembinaan ", "")
          .replace(" (Guru & Tenaga Kependidikan)", "")
          .replace(" (Umum, Kepegawaian & Perencanaan)", ""),
        namaLengkap: b.nama_bidang,
        jumlah: counts[b.id] || 0,
      }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [bidangList, kunjunganList]);

  const busiestBidang = bidangDistribution[0];

  // Distribusi Kategori Tamu
  const kategoriDistribution = useMemo(() => {
    const map: Record<string, number> = {
      "Guru/Kepsek": 0,
      Umum: 0,
      Instansi: 0,
    };
    kunjunganList.forEach((k) => {
      map[k.kategori_tamu] = (map[k.kategori_tamu] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [kunjunganList]);

  // Distribusi Jam Sibuk Pelayanan
  const jamSibukData = useMemo(() => {
    const hours = [
      { jam: "08:00", jumlah: 0 },
      { jam: "09:00", jumlah: 0 },
      { jam: "10:00", jumlah: 0 },
      { jam: "11:00", jumlah: 0 },
      { jam: "12:00", jumlah: 0 },
      { jam: "13:00", jumlah: 0 },
      { jam: "14:00", jumlah: 0 },
      { jam: "15:00", jumlah: 0 },
    ];
    kunjunganList.forEach((k) => {
      const h = new Date(k.waktu_masuk).getHours();
      const idx = Math.min(Math.max(h - 8, 0), hours.length - 1);
      hours[idx].jumlah += 1;
    });
    return hours;
  }, [kunjunganList]);

  const ikm = useMemo(() => calculateIKM(skmList), [skmList]);

  // Actions Kepala Dinas
  const handleTerimaSekarang = async (k: Kunjungan) => {
    await updateStatusKunjungan(k.id, "Dilayani", {
      catatan_disposisi_kadis:
        "Disetujui Kepala Dinas — Silakan masuk ke Ruang Utama Kepala Dinas (Lantai 2).",
    });
  };

  const handleJadwalkanUlang = async (k: Kunjungan) => {
    await updateStatusKunjungan(k.id, "Menunggu", {
      catatan_disposisi_kadis:
        "Kepala Dinas sedang memimpin rapat pimpinan. Mohon menunggu sebentar di ruang transit atau dijadwalkan ulang melalui Sekretariat.",
    });
  };

  const handleOpenDisposisiKadis = (k: Kunjungan) => {
    setDisposisiModalItem(k);
    setTargetBidangDisposisi("11111111-1111-4111-8111-111111111102");
    setCatatanKadis(
      "Instruksi Kepala Dinas: Mohon Sekretaris Dinas / Kabid terkait menindaklanjuti keperluan tamu ini."
    );
  };

  const handleSaveDisposisiKadis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposisiModalItem) return;
    await updateStatusKunjungan(disposisiModalItem.id, "Disposisi", {
      bidang_id: targetBidangDisposisi,
      catatan_disposisi_kadis: catatanKadis,
    });
    setDisposisiModalItem(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Executive Header */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-b-4 border-[#F59E0B] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[11px] font-extrabold uppercase">
            <Crown className="w-3.5 h-3.5" />
            <span>Portal 3 &bull; Executive Dashboard Kepala Dinas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Dashboard Eksekutif &amp; Persetujuan VIP Kepala Dinas
          </h1>
          <p className="text-xs sm:text-sm text-blue-100">
            Hj. Saemina, S.Pd., M.Pd. &mdash; Kepala Dinas Pendidikan dan
            Kebudayaan Kota Kendari
          </p>
        </div>

        {/* Status Kehadiran Kepala Dinas Quick Switch */}
        {kadisBidang && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
              Status Kehadiran Kepala Dinas Saat Ini:
            </p>
            <div className="flex items-center gap-1.5">
              {(["Tersedia", "Rapat", "Dinas Luar"] as StatusPejabat[]).map(
                (st) => {
                  const active = kadisBidang.status_pejabat === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateStatusPejabat(kadisBidang.id, st)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                        active
                          ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                          : "bg-white/10 text-blue-100 hover:bg-white/20"
                      }`}
                    >
                      {st === "Tersedia" ? "Ada di Kantor" : st}
                    </button>
                  );
                }
              )}
              <button
                type="button"
                onClick={onLock}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-xs font-bold border border-rose-400/40 transition ml-1"
                title="Kunci Kembali Portal Kepala Dinas"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4 Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tamu Kunjungan
            </p>
            <p className="text-3xl font-extrabold text-[#0F2C59] mt-1">
              {todayVisits.length}{" "}
              <span className="text-xs font-semibold text-slate-500">
                hari ini
              </span>
            </p>
            <p className="text-xs text-emerald-700 font-bold mt-2">
              Total Bulan Ini: {monthVisits.length} Tamu
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bidang Paling Sibuk
            </p>
            <p className="text-lg font-extrabold text-[#0F2C59] mt-1 line-clamp-1">
              {busiestBidang?.nama || "Bidang GTK"}
            </p>
            <p className="text-xs text-[#1E40AF] font-bold mt-2">
              {busiestBidang?.jumlah || 0} Kunjungan Terdaftar
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tamu Khusus Kadis
            </p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {
                tamuKhususKadis.filter((k) => k.status === "Menunggu").length
              }{" "}
              <span className="text-xs font-semibold text-slate-500">
                menunggu
              </span>
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-2">
              Total Audiensi Kadis: {tamuKhususKadis.length} Tamu
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Indeks Kepuasan (IKM)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-extrabold text-teal-600">
                {ikm.nilaiIkm || 0}
              </p>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold">
                Mutu {ikm.mutuPelayanan}
              </span>
            </div>
            <p className="text-xs text-teal-700 font-bold mt-2">
              {ikm.kinerjaUnit} ({ikm.totalResponden} Responden)
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* VIP / DIRECT APPROVAL PANEL (Tamu Khusus Menghadap Kepala Dinas) */}
      <div className="bg-white rounded-3xl shadow-md border-2 border-[#0F2C59] overflow-hidden">
        <div className="bg-[#0F2C59] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#F59E0B]">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h2 className="font-extrabold text-base">
                VIP / Direct Approval &mdash; Daftar Tamu Menghadap Kepala Dinas
              </h2>
              <p className="text-xs text-blue-200">
                Terima langsung, jadwalkan ulang, atau disposisikan ke
                Sekdis/Kabid dari layar Anda
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F59E0B] text-[#0F2C59] text-xs font-extrabold">
            {tamuKhususKadis.length} Tamu VIP / Disposisi
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tamuKhususKadis.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada tamu yang mengajukan permohonan menghadap Kepala Dinas.
            </div>
          ) : (
            tamuKhususKadis.map((k) => {
              const targetB = bidangMap.get(k.bidang_id);
              return (
                <div
                  key={k.id}
                  className="p-5 hover:bg-slate-50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F2C59] text-[#F59E0B] font-extrabold text-base flex items-center justify-center shrink-0">
                      {k.nama_tamu.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-[#F59E0B] font-mono text-xs font-extrabold">
                          {k.kode_tiket}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900">
                          {k.nama_tamu}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E40AF] text-[11px] font-bold">
                          {k.kategori_tamu}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            k.status === "Menunggu"
                              ? "bg-amber-100 text-amber-800"
                              : k.status === "Dilayani"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          Status: {k.status}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-700">
                        Asal Instansi/Sekolah: {k.instansi_asal} &bull; Tujuan
                        Saat Ini:{" "}
                        <span className="text-[#1E40AF]">
                          {targetB?.nama_bidang}
                        </span>
                      </p>

                      <p className="text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 mt-1">
                        <strong>Keperluan Audiensi:</strong> {k.keperluan}
                      </p>

                      {k.catatan_disposisi_kadis && (
                        <p className="text-xs text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 font-medium">
                          <strong>Arahan / Disposisi Kadis:</strong>{" "}
                          {k.catatan_disposisi_kadis}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tombol Aksi Langsung Kepala Dinas */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTerimaSekarang(k)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Terima Sekarang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDisposisiKadis(k)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-extrabold shadow-sm transition"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-[#F59E0B]" />
                      <span>Disposisi ke Sekdis / Kabid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleJadwalkanUlang(k)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition"
                    >
                      <CalendarClock className="w-4 h-4" />
                      <span>Tunda / Rapat</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Analitik Tren Kunjungan (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Kunjungan per Bidang */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-[#0F2C59] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1E40AF]" />
                <span>Distribusi Kunjungan Tamu per Bidang</span>
              </h3>
              <p className="text-xs text-slate-500">
                Volume pelayanan pada masing-masing unit kerja Dikbud Kendari
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bidangDistribution}
                margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="nama"
                  tick={{ fontSize: 11, fill: "#334155" }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#334155" }}
                />
                <Tooltip />
                <Bar
                  dataKey="jumlah"
                  name="Jumlah Tamu"
                  fill="#0F2C59"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Kategori Asal Tamu & Jam Sibuk */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#0F2C59]">
              Proporsi Kategori Tamu &amp; Jam Sibuk
            </h3>
            <p className="text-xs text-slate-500">
              Distribusi Guru/Kepsek, Orang Tua/Umum, dan Instansi
            </p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kategoriDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {kategoriDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span>Tren Jam Sibuk Pelayanan (WITA):</span>
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {jamSibukData.map((h) => (
                <div
                  key={h.jam}
                  className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center"
                >
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {h.jam}
                  </p>
                  <p className="text-sm font-extrabold text-[#0F2C59]">
                    {h.jumlah}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Monitoring SKM (9 Unsur PermenPAN-RB) & Kotak Saran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-[#0F2C59] flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600" />
                <span>
                  Capaian 9 Unsur Pelayanan (PermenPAN-RB No. 14/2017)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Nilai Rata-Rata (NRR) skala 1.00 - 4.00 dan Konversi IKM
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Mutu Layanan
              </span>
              <p className="text-lg font-extrabold text-teal-700">
                {ikm.mutuPelayanan} ({ikm.kinerjaUnit})
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {ikm.perUnsur.map((u) => {
              const pct = Math.min(Math.round((u.nrr / 4) * 100), 100);
              return (
                <div key={u.kode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      <span className="text-[#1E40AF] font-mono mr-1.5">
                        {u.kode}
                      </span>
                      {u.nama}
                    </span>
                    <span className="font-extrabold text-[#0F2C59]">
                      NRR: {u.nrr} / 4.00{" "}
                      <span className="text-teal-600 font-semibold">
                        ({u.konversi})
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0F2C59] to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kotak Saran & Apresiasi Digital */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquareQuote className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h3 className="font-extrabold text-base text-[#0F2C59]">
                Kotak Saran &amp; Apresiasi Digital
              </h3>
              <p className="text-xs text-slate-500">
                Masukan langsung dari masyarakat &amp; tenaga pendidik
              </p>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {skmList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Belum ada saran masukan yang masuk.
              </p>
            ) : (
              skmList.map((s) => {
                const b = bidangMap.get(s.bidang_id);
                const k = kunjunganList.find((x) => x.id === s.kunjungan_id);
                const avg = (
                  (s.u1_persyaratan +
                    s.u2_prosedur +
                    s.u3_waktu +
                    s.u4_biaya +
                    s.u5_produk +
                    s.u6_kompetensi +
                    s.u7_perilaku +
                    s.u8_sarpras +
                    s.u9_pengaduan) /
                  9
                ).toFixed(2);

                return (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#0F2C59]">
                        {k?.nama_tamu || "Responden Tamu"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold">
                        Skor: {avg} / 4.00
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-[#1E40AF]">
                      Unit Dilayani: {b?.nama_bidang || "-"}
                    </p>
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &ldquo;
                      {s.saran_masukan ||
                        "Pelayanan baik dan sesuai standar prosedur."}
                      &rdquo;
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Disposisi Langsung Kepala Dinas */}
      {disposisiModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-[#0F2C59]">
            <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#F59E0B]">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="font-extrabold text-sm">
                  Disposisi Kepala Dinas ({disposisiModalItem.kode_tiket})
                </h3>
              </div>
              <button
                onClick={() => setDisposisiModalItem(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveDisposisiKadis} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">
                  {disposisiModalItem.nama_tamu} (
                  {disposisiModalItem.instansi_asal})
                </p>
                <p className="text-slate-600 mt-1">
                  Keperluan: {disposisiModalItem.keperluan}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Disposisikan Kepada Pejabat / Bidang:
                </label>
                <select
                  value={targetBidangDisposisi}
                  onChange={(e) => setTargetBidangDisposisi(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
                >
                  {bidangList
                    .filter((b) => b.id !== KADIS_BIDANG_ID)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama_bidang} &mdash; {b.kepala_bidang}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instruksi / Catatan Disposisi Kepala Dinas:
                </label>
                <textarea
                  rows={3}
                  required
                  value={catatanKadis}
                  onChange={(e) => setCatatanKadis(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E40AF] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisposisiModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-extrabold shadow"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                  <span>Kirim Disposisi Kadis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalKadisPage() {
  return (
    <PasscodeGate
      storageKey="butadi_auth_kadis"
      expectedPasscode="aksesdinas1010"
      portalBadge="Otorisasi Eksekutif Pimpinan"
      portalTitle="Portal Kepala Dinas Dikbud Kendari"
      portalSubtitle="Halaman khusus Kepala Dinas & Sekretaris Dinas untuk persetujuan langsung (VIP Approval), disposisi, dan pantauan IKM."
    >
      {(onLock) => <PortalKadisDashboard onLock={onLock} />}
    </PasscodeGate>
  );
}
