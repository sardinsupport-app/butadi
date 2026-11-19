"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  Edit3,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  KeyRound,
  Lock,
  MessageSquareShare,
  Monitor,
  Play,
  Plus,
  QrCode,
  Save,
  School,
  Search,
  Settings,
  Star,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import {
  KunjunganSekolah,
  Sekolah,
  StatusPejabat,
} from "@/types/butadi";
import {
  exportKunjunganSekolahToExcel,
  exportKunjunganSekolahToPDF,
} from "@/lib/export";
import {
  buildTicketSekolahWaMessage,
  getDirectWaUrl,
} from "@/lib/whatsapp";
import { playNotificationBell } from "@/lib/sound";
import { PasscodeGate } from "@/components/PasscodeGate";

function AdminSekolahDashboard({
  sekolah,
  onLock,
}: {
  sekolah: Sekolah;
  onLock: () => void;
}) {
  const {
    kunjunganSekolahList,
    updateStatusKunjunganSekolah,
    deleteKunjunganSekolah,
    saveSekolah,
  } = useButadi();

  const [activeTab, setActiveTab] = useState<"queue" | "settings">("queue");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Modal Catatan Tindak Lanjut Sekolah
  const [catatanTarget, setCatatanTarget] = useState<KunjunganSekolah | null>(
    null
  );
  const [catatanInput, setCatatanInput] = useState<string>("");

  // Modal Konfirmasi Hapus Tamu Sekolah
  const [deletingVisitor, setDeletingVisitor] =
    useState<KunjunganSekolah | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // State Pengaturan Profil & Passcode Sekolah
  const [kepalaSekolah, setKepalaSekolah] = useState(sekolah.kepala_sekolah);
  const [nipKepsek, setNipKepsek] = useState(sekolah.nip_kepsek || "");
  const [alamatSekolah, setAlamatSekolah] = useState(sekolah.alamat);
  const [noWaSekolah, setNoWaSekolah] = useState(sekolah.no_wa_sekolah || "");
  const [passcodeSekolah, setPasscodeSekolah] = useState(sekolah.passcode);
  const [unitList, setUnitList] = useState<string[]>(
    sekolah.unit_layanan || []
  );
  const [newUnitInput, setNewUnitInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);

  // Hanya data kunjungan milik sekolah ini sendiri
  const mySchoolVisits = kunjunganSekolahList.filter(
    (k) => k.sekolah_id === sekolah.id
  );

  const filteredVisits = mySchoolVisits.filter((k) => {
    if (selectedStatusFilter !== "ALL" && k.status !== selectedStatusFilter)
      return false;
    if (dateFilter && k.tanggal !== dateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNama = k.nama_tamu.toLowerCase().includes(q);
      const matchTiket = k.kode_tiket.toLowerCase().includes(q);
      const matchAsal = k.instansi_asal.toLowerCase().includes(q);
      const matchNik = k.nik_nip.toLowerCase().includes(q);
      const matchUnit = k.tujuan_unit.toLowerCase().includes(q);
      if (
        !matchNama &&
        !matchTiket &&
        !matchAsal &&
        !matchNik &&
        !matchUnit
      )
        return false;
    }
    return true;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayCount = mySchoolVisits.filter((k) => k.tanggal === today).length;
  const waitingCount = mySchoolVisits.filter(
    (k) => k.status === "Menunggu"
  ).length;
  const completedCount = mySchoolVisits.filter(
    (k) => k.status === "Selesai"
  ).length;

  const handleStatusKepsekChange = async (status_kepsek: StatusPejabat) => {
    await saveSekolah({
      ...sekolah,
      status_kepsek,
    });
  };

  const handleSaveCatatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatanTarget) return;
    await updateStatusKunjunganSekolah(catatanTarget.id, catatanTarget.status, {
      catatan_sekolah: catatanInput.trim() || null,
    });
    setCatatanTarget(null);
    setCatatanInput("");
  };

  const handleConfirmDelete = async () => {
    if (!deletingVisitor) return;
    setIsDeleting(true);
    await deleteKunjunganSekolah(deletingVisitor.id);
    setIsDeleting(false);
    setDeletingVisitor(null);
  };

  const handleAddUnit = () => {
    const trimmed = newUnitInput.trim();
    if (!trimmed) return;
    if (!unitList.includes(trimmed)) {
      setUnitList([...unitList, trimmed]);
    }
    setNewUnitInput("");
  };

  const handleRemoveUnit = (u: string) => {
    if (unitList.length <= 1) return;
    setUnitList(unitList.filter((item) => item !== u));
  };

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedMsg(null);
    try {
      await saveSekolah({
        ...sekolah,
        kepala_sekolah: kepalaSekolah,
        nip_kepsek: nipKepsek,
        alamat: alamatSekolah,
        no_wa_sekolah: noWaSekolah,
        passcode: passcodeSekolah,
        unit_layanan: unitList,
      });
      setSettingsSavedMsg(
        "Pengaturan profil, unit layanan, dan passcode sekolah berhasil disimpan!"
      );
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Admin Mandiri Sekolah */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white rounded-3xl p-6 shadow-xl border-b-4 border-[#F59E0B] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[11px] font-extrabold uppercase">
                PORTAL ADMIN MANDIRI SEKOLAH &bull; NPSN {sekolah.npsn}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-blue-100 text-[11px] font-bold">
                Jenjang {sekolah.jenjang} &bull; Kec. {sekolah.kecamatan}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              Manajemen Buku Tamu &mdash; {sekolah.nama_sekolah}
            </h1>
            <p className="text-xs text-blue-200">
              Otonomi Pengelolaan Sekolah: Hanya Anda (Admin{" "}
              {sekolah.nama_sekolah}) yang dapat mengubah atau menghapus data
              buku tamu di sekolah ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sekolah/${sekolah.npsn}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
            >
              <QrCode className="w-4 h-4 text-[#F59E0B]" />
              <span>Form Tamu</span>
            </Link>
            <Link
              href={`/sekolah/${sekolah.npsn}/kiosk`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
            >
              <Monitor className="w-4 h-4 text-[#F59E0B]" />
              <span>Kiosk &amp; QR</span>
            </Link>
            <button
              type="button"
              onClick={() => playNotificationBell()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
            >
              <BellRing className="w-4 h-4 text-[#F59E0B]" />
              <span>Tes Bell</span>
            </button>
            <button
              type="button"
              onClick={onLock}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-xs font-bold border border-rose-400/30 transition"
            >
              <Lock className="w-3.5 h-3.5 text-rose-300" />
              <span>Kunci Admin</span>
            </button>
          </div>
        </div>

        {/* Quick Toggle Status Kehadiran Kepala Sekolah & Tab Switcher */}
        <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === "queue"
                  ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                Kelola Buku Tamu Sekolah ({mySchoolVisits.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Profil, Unit Tujuan &amp; Passcode Sekolah</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-blue-200 font-semibold mr-1 flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
              Status Kepala Sekolah:
            </span>
            {(["Tersedia", "Rapat", "Dinas Luar"] as StatusPejabat[]).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusKepsekChange(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                    sekolah.status_kepsek === st
                      ? st === "Tersedia"
                        ? "bg-emerald-400 text-slate-950 shadow"
                        : st === "Rapat"
                        ? "bg-amber-400 text-slate-950 shadow"
                        : "bg-rose-400 text-slate-950 shadow"
                      : "bg-white/10 text-blue-100 hover:bg-white/20"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik Sekolah */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-400">
            Tamu Hari Ini
          </p>
          <p className="text-2xl font-extrabold text-[#0F2C59] mt-0.5">
            {todayCount} Orang
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold uppercase text-amber-600">
            Menunggu Dilayani
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
            {waitingCount} Tamu
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold uppercase text-teal-600">
            Selesai Dilayani
          </p>
          <p className="text-2xl font-extrabold text-teal-600 mt-0.5">
            {completedCount} Tamu
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <p className="text-[11px] font-bold uppercase text-slate-400">
            Total Riwayat Sekolah
          </p>
          <p className="text-2xl font-extrabold text-[#1E40AF] mt-0.5">
            {mySchoolVisits.length} Data
          </p>
        </div>
      </div>

      {activeTab === "queue" ? (
        <div className="space-y-4">
          {/* Bar Filter, Pencarian & Ekspor Laporan Sekolah */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama tamu, kode tiket, NIK, tujuan..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E40AF] outline-none"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
              >
                <option value="ALL">Semua Status Kunjungan</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Dilayani">Dilayani</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  exportKunjunganSekolahToPDF(filteredVisits, [sekolah], {
                    targetSekolah: sekolah,
                    periodeLabel: dateFilter || "Semua Periode",
                  })
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Cetak PDF Sekolah</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportKunjunganSekolahToExcel(
                    filteredVisits,
                    [sekolah],
                    sekolah
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Tabel Desktop & Kartu Mobile Buku Tamu Sekolah */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F2C59] text-white text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tiket &amp; Waktu</th>
                    <th className="py-3.5 px-4">Tamu &amp; Kategori</th>
                    <th className="py-3.5 px-4">Unit Tujuan</th>
                    <th className="py-3.5 px-4">Keperluan &amp; Catatan</th>
                    <th className="py-3.5 px-4">Status &amp; Rating</th>
                    <th className="py-3.5 px-4 text-right">
                      Aksi Admin Sekolah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400"
                      >
                        Belum ada data kunjungan tamu di {sekolah.nama_sekolah}.
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((k) => {
                      const badgeClass =
                        k.status === "Menunggu"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : k.status === "Dilayani"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : k.status === "Selesai"
                          ? "bg-teal-100 text-teal-800 border-teal-300"
                          : "bg-rose-100 text-rose-800 border-rose-300";

                      return (
                        <tr
                          key={k.id}
                          className="hover:bg-slate-50/80 transition align-top"
                        >
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-mono font-extrabold text-xs">
                              {k.kode_tiket}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {k.tanggal} &bull;{" "}
                                {new Date(k.waktu_masuk).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              {k.foto_url ? (
                                <img
                                  src={k.foto_url}
                                  alt={k.nama_tamu}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#1E40AF] font-extrabold text-sm flex items-center justify-center shrink-0">
                                  {k.nama_tamu.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-slate-900 text-sm">
                                  {k.nama_tamu}
                                </p>
                                <p className="text-slate-600 font-medium">
                                  {k.instansi_asal}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                                    {k.nik_nip}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1E40AF] font-semibold text-[10px]">
                                    {k.kategori_tamu}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-extrabold text-[#0F2C59]">
                              {k.tujuan_unit}
                            </span>
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            <p className="text-slate-800 leading-relaxed">
                              {k.keperluan}
                            </p>
                            {k.catatan_sekolah && (
                              <div className="mt-1.5 p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-[#0F2C59]">
                                <strong>Catatan Sekolah:</strong>{" "}
                                {k.catatan_sekolah}
                              </div>
                            )}
                            {k.saran_masukan && (
                              <div className="mt-1 p-2 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-teal-900">
                                <strong>Masukan Tamu:</strong> {k.saran_masukan}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              {k.status}
                            </span>
                            {k.nilai_kepuasan && (
                              <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-amber-700">
                                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                <span>{k.nilai_kepuasan} / 4</span>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {k.status === "Menunggu" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStatusKunjunganSekolah(
                                      k.id,
                                      "Dilayani"
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1E40AF] hover:bg-[#0F2C59] text-white font-bold text-xs shadow-sm transition"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Layani</span>
                                </button>
                              )}

                              {k.status !== "Selesai" &&
                                k.status !== "Batal" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateStatusKunjunganSekolah(
                                          k.id,
                                          "Selesai"
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Selesai</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateStatusKunjunganSekolah(
                                          k.id,
                                          "Batal"
                                        )
                                      }
                                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                                      title="Batalkan"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                              <button
                                type="button"
                                onClick={() => {
                                  setCatatanTarget(k);
                                  setCatatanInput(k.catatan_sekolah || "");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                                title="Beri Catatan Tindak Lanjut Sekolah"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">
                                  Catatan
                                </span>
                              </button>

                              <a
                                href={getDirectWaUrl(
                                  k.no_wa,
                                  buildTicketSekolahWaMessage(k, sekolah)
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition"
                              >
                                <MessageSquareShare className="w-3.5 h-3.5" />
                                <span>WA</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => setDeletingVisitor(k)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
                                title="Hapus Data Tamu Sekolah"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span className="hidden xl:inline">Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredVisits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada data kunjungan tamu di {sekolah.nama_sekolah}.
                </div>
              ) : (
                filteredVisits.map((k) => {
                  const badgeClass =
                    k.status === "Menunggu"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : k.status === "Dilayani"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : k.status === "Selesai"
                      ? "bg-teal-100 text-teal-800 border-teal-300"
                      : "bg-rose-100 text-rose-800 border-rose-300";

                  return (
                    <div key={k.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-mono font-extrabold text-xs">
                          {k.kode_tiket}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                        >
                          {k.status}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {k.foto_url ? (
                          <img
                            src={k.foto_url}
                            alt={k.nama_tamu}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1E40AF] font-extrabold text-sm flex items-center justify-center shrink-0">
                            {k.nama_tamu.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm truncate">
                            {k.nama_tamu}
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {k.instansi_asal}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {k.kategori_tamu} &bull; {k.tanggal}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <p className="text-[11px] text-slate-500">
                          Tujuan:{" "}
                          <strong className="text-[#0F2C59]">
                            {k.tujuan_unit}
                          </strong>
                        </p>
                        <p className="text-slate-700">
                          <strong>Keperluan:</strong> {k.keperluan}
                        </p>
                        {k.catatan_sekolah && (
                          <p className="text-[#0F2C59] bg-blue-50 p-1.5 rounded-lg border border-blue-200 text-[11px]">
                            <strong>Catatan:</strong> {k.catatan_sekolah}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {k.status === "Menunggu" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusKunjunganSekolah(k.id, "Dilayani")
                            }
                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#1E40AF] text-white font-bold text-xs"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Layani</span>
                          </button>
                        )}
                        {k.status !== "Selesai" && k.status !== "Batal" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusKunjunganSekolah(k.id, "Selesai")
                            }
                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Selesai</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setCatatanTarget(k);
                            setCatatanInput(k.catatan_sekolah || "");
                          }}
                          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Catatan</span>
                        </button>
                        <a
                          href={getDirectWaUrl(
                            k.no_wa,
                            buildTicketSekolahWaMessage(k, sekolah)
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs"
                        >
                          <MessageSquareShare className="w-3.5 h-3.5" />
                          <span>WA</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeletingVisitor(k)}
                          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB PENGATURAN PROFIL, UNIT LAYANAN & PASSCODE SEKOLAH */
        <form
          onSubmit={handleSaveSchoolSettings}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-[#0F2C59] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#1E40AF]" />
              <span>
                Pengaturan Mandiri {sekolah.nama_sekolah} (NPSN: {sekolah.npsn})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola informasi Kepala Sekolah, daftar Unit Layanan Tujuan di
              sekolah, serta Passcode keamanan Admin Sekolah Anda.
            </p>
          </div>

          {settingsSavedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{settingsSavedMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Kepala Sekolah &amp; Gelar
              </label>
              <input
                type="text"
                required
                value={kepalaSekolah}
                onChange={(e) => setKepalaSekolah(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={nipKepsek}
                onChange={(e) => setNipKepsek(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Lengkap Sekolah
              </label>
              <input
                type="text"
                required
                value={alamatSekolah}
                onChange={(e) => setAlamatSekolah(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp Operator / Resepsionis Sekolah
              </label>
              <input
                type="text"
                value={noWaSekolah}
                onChange={(e) => setNoWaSekolah(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div className="sm:col-span-2 bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-2">
              <label className="block text-xs font-extrabold text-[#0F2C59] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#F59E0B]" />
                <span>Passcode Akses Admin {sekolah.nama_sekolah}</span>
              </label>
              <input
                type="text"
                required
                value={passcodeSekolah}
                onChange={(e) => setPasscodeSekolah(e.target.value)}
                className="w-full sm:max-w-xs px-4 py-2 rounded-xl border border-amber-300 text-sm font-mono font-bold bg-white focus:ring-2 focus:ring-[#0F2C59] outline-none"
              />
              <p className="text-[11px] text-slate-600">
                Gunakan passcode ini untuk masuk ke halaman{" "}
                <code>/sekolah/{sekolah.npsn}/admin</code>.
              </p>
            </div>
          </div>

          {/* Kustomisasi Unit Tujuan di Sekolah */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Daftar Unit / Pejabat Tujuan Kunjungan di Sekolah Ini
            </label>
            <div className="flex flex-wrap gap-2">
              {unitList.map((u) => (
                <div
                  key={u}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-[#0F2C59] border border-blue-200 text-xs font-bold"
                >
                  <span>{u}</span>
                  {unitList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(u)}
                      className="text-rose-500 hover:text-rose-700"
                      title="Hapus Unit"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-md pt-1">
              <input
                type="text"
                value={newUnitInput}
                onChange={(e) => setNewUnitInput(e.target.value)}
                placeholder="Tambah unit tujuan baru (misal: Perpustakaan / Lab IPA)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddUnit}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-extrabold shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#F59E0B]" />
              <span>
                {savingSettings
                  ? "Menyimpan..."
                  : "Simpan Pengaturan Sekolah"}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Modal Catatan Tindak Lanjut Sekolah */}
      {catatanTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#0F2C59]">
                Catatan Sekolah &mdash; {catatanTarget.kode_tiket}
              </h3>
              <button
                type="button"
                onClick={() => setCatatanTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCatatan} className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-2">
                  Tamu: <strong>{catatanTarget.nama_tamu}</strong> (
                  {catatanTarget.instansi_asal})
                </p>
                <textarea
                  rows={3}
                  value={catatanInput}
                  onChange={(e) => setCatatanInput(e.target.value)}
                  placeholder="Tuliskan catatan pelayanan atau arahan untuk tamu ini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCatatanTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2C59] text-white text-xs font-bold"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Tamu Sekolah */}
      {deletingVisitor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Data Tamu {sekolah.nama_sekolah}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data kunjungan ini akan dihapus permanen dari buku tamu{" "}
                  {sekolah.nama_sekolah}.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nomor Tiket:</span>
                <span className="font-mono font-extrabold text-[#0F2C59]">
                  {deletingVisitor.kode_tiket}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nama Tamu:</span>
                <span className="font-bold text-slate-900">
                  {deletingVisitor.nama_tamu}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Unit Tujuan:</span>
                <span className="text-slate-700">
                  {deletingVisitor.tujuan_unit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingVisitor(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalAdminSekolahPage() {
  const params = useParams<{ npsn: string }>();
  const npsn = params?.npsn || "";
  const { sekolahList } = useButadi();

  const sekolah = sekolahList.find((s) => s.npsn === npsn);

  if (!sekolah) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-3">
          <School className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-xl font-extrabold text-[#0F2C59]">
            Satuan Pendidikan Tidak Ditemukan (NPSN: {npsn})
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

  return (
    <PasscodeGate
      storageKey={`butadi_auth_sekolah_${sekolah.npsn}`}
      expectedPasscode={sekolah.passcode}
      portalBadge={`Admin Sekolah • NPSN ${sekolah.npsn}`}
      portalTitle={`Admin ${sekolah.nama_sekolah}`}
      portalSubtitle={`Halaman khusus Operator / Tata Usaha / Petugas Buku Tamu ${sekolah.nama_sekolah}. Data buku tamu sekolah hanya dapat dikelola oleh sekolah ini sendiri.`}
      backHref={`/sekolah/${sekolah.npsn}`}
      backLabel={`Kembali ke Buku Tamu ${sekolah.nama_sekolah}`}
    >
      {(onLock) => <AdminSekolahDashboard sekolah={sekolah} onLock={onLock} />}
    </PasscodeGate>
  );
}
