"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  KeyRound,
  Lock,
  MapPin,
  MessageSquareShare,
  Play,
  Plus,
  QrCode,
  School,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import {
  Bidang,
  JenjangSekolah,
  Kunjungan,
  Sekolah,
  StatusKunjungan,
  StatusPejabat,
} from "@/types/butadi";
import {
  buildSkmWaMessage,
  buildTicketWaMessage,
  getDirectWaUrl,
  sendFonnteWhatsApp,
} from "@/lib/whatsapp";
import {
  exportKunjunganSekolahToExcel,
  exportKunjunganSekolahToPDF,
  exportLaporanToExcel,
  exportLaporanToPDF,
} from "@/lib/export";
import {
  DEFAULT_UNIT_LAYANAN_SEKOLAH,
  KECAMATAN_KENDARI_LIST,
} from "@/lib/supabase";
import { playNotificationBell } from "@/lib/sound";
import { PasscodeGate } from "@/components/PasscodeGate";

function PortalAdminDashboard({ onLock }: { onLock: () => void }) {
  const {
    bidangList,
    kunjunganList,
    skmList,
    sekolahList,
    kunjunganSekolahList,
    updateStatusKunjungan,
    deleteKunjungan,
    updateStatusPejabat,
    saveBidang,
    deleteBidang,
    saveSekolah,
    deleteSekolah,
  } = useButadi();

  const [activeTab, setActiveTab] = useState<
    "queue" | "master" | "monitoring_sekolah" | "master_sekolah"
  >("queue");
  const [selectedBidangFilter, setSelectedBidangFilter] =
    useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // State Monitoring Kunjungan Sekolah (Read-Only oleh Dinas)
  const [filterJenjangSekolah, setFilterJenjangSekolah] =
    useState<string>("ALL");
  const [filterKecamatanSekolah, setFilterKecamatanSekolah] =
    useState<string>("ALL");
  const [filterSekolahId, setFilterSekolahId] = useState<string>("ALL");
  const [filterStatusSekolah, setFilterStatusSekolah] =
    useState<string>("ALL");
  const [filterDateSekolah, setFilterDateSekolah] = useState<string>("");
  const [searchQuerySekolah, setSearchQuerySekolah] = useState<string>("");

  // State Master Sekolah (Tambah/Edit Sekolah oleh Admin Dinas)
  const [editingSekolah, setEditingSekolah] =
    useState<Partial<Sekolah> | null>(null);
  const [searchMasterSekolah, setSearchMasterSekolah] = useState<string>("");

  // Delete Visitor Modal state
  const [deletingVisitor, setDeletingVisitor] = useState<Kunjungan | null>(null);
  const [isDeletingVisitor, setIsDeletingVisitor] = useState<boolean>(false);

  // Disposisi Modal state
  const [disposisiTarget, setDisposisiTarget] = useState<Kunjungan | null>(
    null
  );
  const [newBidangId, setNewBidangId] = useState<string>("");
  const [catatanDisposisi, setCatatanDisposisi] = useState<string>("");

  // Checkout SKM Modal state
  const [checkoutVisitor, setCheckoutVisitor] = useState<Kunjungan | null>(
    null
  );
  const [waAutoStatus, setWaAutoStatus] = useState<string | null>(null);

  // QR Scanner Modal state
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const scannerContainerId = "butadi-qr-reader";
  const html5QrCodeRef = useRef<unknown>(null);

  // Form tambah/edit Bidang
  const [editingBidang, setEditingBidang] = useState<Partial<Bidang> | null>(
    null
  );

  const bidangMap = new Map(bidangList.map((b) => [b.id, b]));
  const skmKunjunganSet = new Set(skmList.map((s) => s.kunjungan_id));

  // Filter daftar kunjungan
  const filteredKunjungan = kunjunganList.filter((k) => {
    if (selectedBidangFilter !== "ALL" && k.bidang_id !== selectedBidangFilter)
      return false;
    if (selectedStatusFilter !== "ALL" && k.status !== selectedStatusFilter)
      return false;
    if (dateFilter && k.tanggal !== dateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNama = k.nama_tamu.toLowerCase().includes(q);
      const matchTiket = k.kode_tiket.toLowerCase().includes(q);
      const matchInstansi = k.instansi_asal.toLowerCase().includes(q);
      const matchNik = k.nik_nip.toLowerCase().includes(q);
      if (!matchNama && !matchTiket && !matchInstansi && !matchNik)
        return false;
    }
    return true;
  });

  // Handle QR Scanner lifecycle
  useEffect(() => {
    if (!showQrScanner) return;
    let isMounted = true;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (!isMounted) return;
        const qr = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = qr;
        qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            setScannedCode(decodedText);
            setSearchQuery(decodedText);
            qr.stop().catch(() => {});
            setShowQrScanner(false);
          },
          () => {}
        ).catch(() => {});
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      const qr = html5QrCodeRef.current as {
        stop?: () => Promise<void>;
      } | null;
      if (qr && qr.stop) {
        qr.stop().catch(() => {});
      }
    };
  }, [showQrScanner]);

  const handleLayaniTamu = async (k: Kunjungan) => {
    await updateStatusKunjungan(k.id, "Dilayani");
  };

  const handleConfirmDelete = async () => {
    if (!deletingVisitor) return;
    setIsDeletingVisitor(true);
    await deleteKunjungan(deletingVisitor.id);
    setIsDeletingVisitor(false);
    setDeletingVisitor(null);
  };

  const handleSelesaiKunjungan = async (k: Kunjungan) => {
    const updated = await updateStatusKunjungan(k.id, "Selesai");
    if (updated) {
      setCheckoutVisitor(updated);
      const bidang = bidangMap.get(updated.bidang_id);
      const msg = buildSkmWaMessage(updated, bidang);
      const res = await sendFonnteWhatsApp(updated.no_wa, msg);
      setWaAutoStatus(res.info);
    }
  };

  const handleOpenDisposisi = (k: Kunjungan) => {
    setDisposisiTarget(k);
    setNewBidangId(k.bidang_id);
    setCatatanDisposisi(k.catatan_disposisi_kadis || "");
  };

  const handleSubmitDisposisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposisiTarget) return;
    await updateStatusKunjungan(disposisiTarget.id, "Disposisi", {
      bidang_id: newBidangId,
      catatan_disposisi_kadis:
        catatanDisposisi.trim() ||
        "Dialihkan oleh Petugas Resepsionis / Admin Bidang",
    });
    setDisposisiTarget(null);
  };

  const handleSaveBidangForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingBidang?.nama_bidang ||
      !editingBidang?.kepala_bidang ||
      !editingBidang?.lokasi_ruangan
    )
      return;

    await saveBidang({
      id: editingBidang.id,
      nama_bidang: editingBidang.nama_bidang,
      kepala_bidang: editingBidang.kepala_bidang,
      nip_pejabat: editingBidang.nip_pejabat || "",
      lokasi_ruangan: editingBidang.lokasi_ruangan,
      status_pejabat:
        (editingBidang.status_pejabat as StatusPejabat) || "Tersedia",
    });
    setEditingBidang(null);
  };

  const sekolahMap = useMemo(
    () => new Map(sekolahList.map((s) => [s.id, s])),
    [sekolahList]
  );

  const filteredKunjunganSekolah = useMemo(() => {
    return kunjunganSekolahList.filter((k) => {
      const sek = sekolahMap.get(k.sekolah_id);
      if (
        filterJenjangSekolah !== "ALL" &&
        sek?.jenjang !== filterJenjangSekolah
      )
        return false;
      if (
        filterKecamatanSekolah !== "ALL" &&
        sek?.kecamatan !== filterKecamatanSekolah
      )
        return false;
      if (filterSekolahId !== "ALL" && k.sekolah_id !== filterSekolahId)
        return false;
      if (filterStatusSekolah !== "ALL" && k.status !== filterStatusSekolah)
        return false;
      if (filterDateSekolah && k.tanggal !== filterDateSekolah) return false;
      if (searchQuerySekolah.trim()) {
        const q = searchQuerySekolah.toLowerCase();
        const matchNama = k.nama_tamu.toLowerCase().includes(q);
        const matchTiket = k.kode_tiket.toLowerCase().includes(q);
        const matchNik = k.nik_nip.toLowerCase().includes(q);
        const matchAsal = k.instansi_asal.toLowerCase().includes(q);
        const matchSek = sek?.nama_sekolah.toLowerCase().includes(q) || false;
        const matchNpsn = sek?.npsn.toLowerCase().includes(q) || false;
        if (
          !matchNama &&
          !matchTiket &&
          !matchNik &&
          !matchAsal &&
          !matchSek &&
          !matchNpsn
        )
          return false;
      }
      return true;
    });
  }, [
    kunjunganSekolahList,
    sekolahMap,
    filterJenjangSekolah,
    filterKecamatanSekolah,
    filterSekolahId,
    filterStatusSekolah,
    filterDateSekolah,
    searchQuerySekolah,
  ]);

  const filteredMasterSekolah = useMemo(() => {
    return sekolahList.filter((s) => {
      if (!searchMasterSekolah.trim()) return true;
      const q = searchMasterSekolah.toLowerCase();
      return (
        s.nama_sekolah.toLowerCase().includes(q) ||
        s.npsn.toLowerCase().includes(q) ||
        s.kecamatan.toLowerCase().includes(q) ||
        s.kepala_sekolah.toLowerCase().includes(q)
      );
    });
  }, [sekolahList, searchMasterSekolah]);

  const handleSaveMasterSekolah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingSekolah ||
      !editingSekolah.npsn ||
      !editingSekolah.nama_sekolah ||
      !editingSekolah.kepala_sekolah
    )
      return;
    await saveSekolah({
      id: editingSekolah.id,
      npsn: editingSekolah.npsn,
      nama_sekolah: editingSekolah.nama_sekolah,
      jenjang: (editingSekolah.jenjang as JenjangSekolah) || "SMP",
      kecamatan: editingSekolah.kecamatan || "Kadia",
      alamat: editingSekolah.alamat || "",
      kepala_sekolah: editingSekolah.kepala_sekolah,
      nip_kepsek: editingSekolah.nip_kepsek || "",
      no_wa_sekolah: editingSekolah.no_wa_sekolah || "",
      passcode: editingSekolah.passcode || "sekolah1010",
      status_kepsek:
        (editingSekolah.status_kepsek as StatusPejabat) || "Tersedia",
      unit_layanan:
        editingSekolah.unit_layanan && editingSekolah.unit_layanan.length > 0
          ? editingSekolah.unit_layanan
          : DEFAULT_UNIT_LAYANAN_SEKOLAH,
      aktif: editingSekolah.aktif ?? true,
    });
    setEditingSekolah(null);
  };

  const countStatus = (st: StatusKunjungan) =>
    kunjunganList.filter((k) => k.status === st).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Portal Admin */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white rounded-3xl p-6 shadow-xl border-b-4 border-[#F59E0B] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[11px] font-extrabold uppercase">
              Portal 2 &bull; Pusat Kendali Admin Dinas Pendidikan Kota Kendari
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
              Manajemen Antrean Dinas &amp; Monitoring Kunjungan Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-blue-100">
              Kelola pelayanan tamu Kantor Dinas Pendidikan, serta pantau
              riwayat buku tamu seluruh sekolah se-Kota Kendari secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => playNotificationBell()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
            >
              <BellRing className="w-4 h-4 text-[#F59E0B]" />
              <span>Tes Bunyi Bell</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrScanner(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] text-xs font-extrabold shadow transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Tiket</span>
            </button>

            <button
              type="button"
              onClick={onLock}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 text-xs font-bold border border-rose-400/40 transition"
              title="Kunci Kembali Portal Admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci</span>
            </button>
          </div>
        </div>

        {/* 4 Menu Tab Admin Dinas */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === "queue"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Antrean Tamu Dinas ({kunjunganList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("master")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === "master"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Bidang Dinas ({bidangList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("monitoring_sekolah")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === "monitoring_sekolah"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>
              Monitoring History Sekolah ({kunjunganSekolahList.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("master_sekolah")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === "master_sekolah"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <School className="w-4 h-4" />
            <span>Master Akun Sekolah ({sekolahList.length})</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Counter Status */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-slate-400">
            Total Kunjungan
          </p>
          <p className="text-2xl font-extrabold text-[#0F2C59] mt-0.5">
            {kunjunganList.length}
          </p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-amber-700">
            Menunggu Konfirmasi
          </p>
          <p className="text-2xl font-extrabold text-amber-800 mt-0.5">
            {countStatus("Menunggu")}
          </p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-emerald-700">
            Sedang Dilayani
          </p>
          <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">
            {countStatus("Dilayani")}
          </p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase text-indigo-700">
            Disposisi / Dialihkan
          </p>
          <p className="text-2xl font-extrabold text-indigo-800 mt-0.5">
            {countStatus("Disposisi")}
          </p>
        </div>
        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase text-teal-700">
            Selesai (Check-Out)
          </p>
          <p className="text-2xl font-extrabold text-teal-800 mt-0.5">
            {countStatus("Selesai")}
          </p>
        </div>
      </div>

      {activeTab === "queue" ? (
        <div className="space-y-4">
          {/* Toolbar Filter & Export PDF/Excel */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, tiket, sekolah..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E40AF] outline-none"
                />
              </div>

              <div className="relative">
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedBidangFilter}
                  onChange={(e) => setSelectedBidangFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
                >
                  <option value="ALL">Semua Bidang (FO Lobi)</option>
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_bidang}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
              >
                <option value="ALL">Semua Status Kunjungan</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Dilayani">Dilayani</option>
                <option value="Disposisi">Disposisi</option>
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

            {/* Export Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  exportLaporanToPDF(
                    filteredKunjungan,
                    bidangList,
                    skmList,
                    dateFilter || "Semua Periode"
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Ekspor PDF</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportLaporanToExcel(filteredKunjungan, bidangList, skmList)
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Live Queue Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F2C59] text-white text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tiket &amp; Waktu</th>
                    <th className="py-3.5 px-4">Tamu &amp; Identitas</th>
                    <th className="py-3.5 px-4">Bidang Tujuan</th>
                    <th className="py-3.5 px-4">Keperluan &amp; Catatan</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">
                      Aksi Resepsionis / Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredKunjungan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400"
                      >
                        Tidak ada data kunjungan yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredKunjungan.map((k) => {
                      const bidang = bidangMap.get(k.bidang_id);
                      const hasSkm = skmKunjunganSet.has(k.id);

                      const badgeClass =
                        k.status === "Menunggu"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : k.status === "Dilayani"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : k.status === "Disposisi"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-300"
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
                                Masuk:{" "}
                                {new Date(k.waktu_masuk).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                            {k.waktu_keluar && (
                              <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                                Selesai:{" "}
                                {new Date(k.waktu_keluar).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </div>
                            )}
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
                                  <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                                    {k.nik_nip}
                                  </span>
                                  <span className="px-2 py-0.2 rounded bg-blue-50 text-[#1E40AF] font-semibold text-[10px]">
                                    {k.kategori_tamu}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <p className="font-bold text-[#0F2C59]">
                              {bidang?.nama_bidang || "-"}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {bidang?.kepala_bidang}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {bidang?.lokasi_ruangan}
                            </p>
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            <p className="text-slate-800 leading-relaxed">
                              {k.keperluan}
                            </p>
                            {k.catatan_disposisi_kadis && (
                              <div className="mt-1.5 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900">
                                <strong>Disposisi:</strong>{" "}
                                {k.catatan_disposisi_kadis}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              {k.status}
                            </span>
                            {k.status === "Selesai" && (
                              <div className="mt-1.5">
                                {hasSkm ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    SKM Terisi
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    Menunggu SKM
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {(k.status === "Menunggu" ||
                                k.status === "Disposisi") && (
                                <button
                                  type="button"
                                  onClick={() => handleLayaniTamu(k)}
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
                                      onClick={() => handleOpenDisposisi(k)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs transition"
                                      title="Alihkan / Disposisi ke Bidang Lain"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                      <span>Disposisi</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSelesaiKunjungan(k)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                                      title="Selesai Kunjungan & Kirim Survei SKM"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Selesai &amp; SKM</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateStatusKunjungan(k.id, "Batal")
                                      }
                                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                                      title="Batalkan Kunjungan"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}

                              {/* Tombol Kirim WA Tiket / Link SKM */}
                              <a
                                href={getDirectWaUrl(
                                  k.no_wa,
                                  k.status === "Selesai"
                                    ? buildSkmWaMessage(k, bidang)
                                    : buildTicketWaMessage(k, bidang)
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition"
                                title="Kirim Notifikasi ke WhatsApp Tamu"
                              >
                                <MessageSquareShare className="w-3.5 h-3.5" />
                                <span>WA</span>
                              </a>

                              {/* Tombol Hapus Data Tamu */}
                              <button
                                type="button"
                                onClick={() => setDeletingVisitor(k)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
                                title="Hapus Data Tamu"
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

            {/* Mobile Card List View (Super Responsive di Layar HP) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredKunjungan.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada data kunjungan yang sesuai dengan filter.
                </div>
              ) : (
                filteredKunjungan.map((k) => {
                  const bidang = bidangMap.get(k.bidang_id);
                  const hasSkm = skmKunjunganSet.has(k.id);
                  const badgeClass =
                    k.status === "Menunggu"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : k.status === "Dilayani"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : k.status === "Disposisi"
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : k.status === "Selesai"
                      ? "bg-teal-100 text-teal-800 border-teal-300"
                      : "bg-rose-100 text-rose-800 border-rose-300";

                  return (
                    <div key={k.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-mono font-extrabold text-xs">
                          {k.kode_tiket}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                          >
                            {k.status}
                          </span>
                          {k.status === "Selesai" &&
                            (hasSkm ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                SKM Terisi
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Menunggu SKM
                              </span>
                            ))}
                        </div>
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
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">
                              {k.nik_nip}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1E40AF] font-semibold text-[9px]">
                              {k.kategori_tamu}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              &bull;{" "}
                              {new Date(k.waktu_masuk).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <p className="text-[11px] text-slate-500">
                          Tujuan:{" "}
                          <strong className="text-[#0F2C59]">
                            {bidang?.nama_bidang || "-"}
                          </strong>{" "}
                          ({bidang?.lokasi_ruangan || "-"})
                        </p>
                        <p className="text-slate-700">
                          <strong>Keperluan:</strong> {k.keperluan}
                        </p>
                        {k.catatan_disposisi_kadis && (
                          <p className="text-indigo-900 bg-indigo-50 p-1.5 rounded-lg border border-indigo-200 text-[11px]">
                            <strong>Disposisi:</strong>{" "}
                            {k.catatan_disposisi_kadis}
                          </p>
                        )}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {(k.status === "Menunggu" ||
                          k.status === "Disposisi") && (
                          <button
                            type="button"
                            onClick={() => handleLayaniTamu(k)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#1E40AF] hover:bg-[#0F2C59] text-white font-bold text-xs shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Layani</span>
                          </button>
                        )}

                        {k.status !== "Selesai" && k.status !== "Batal" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenDisposisi(k)}
                              className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>Disposisi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelesaiKunjungan(k)}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Selesai &amp; SKM</span>
                            </button>
                          </>
                        )}

                        <a
                          href={getDirectWaUrl(
                            k.no_wa,
                            k.status === "Selesai"
                              ? buildSkmWaMessage(k, bidang)
                              : buildTicketWaMessage(k, bidang)
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs"
                        >
                          <MessageSquareShare className="w-3.5 h-3.5" />
                          <span>WA</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setDeletingVisitor(k)}
                          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                          title="Hapus Data Tamu"
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
      ) : activeTab === "master" ? (
        /* TAB DATA MASTER BIDANG & STATUS KEHADIRAN PEJABAT */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-base text-[#0F2C59] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1E40AF]" />
                <span>
                  Data Master Bidang &amp; Status Kehadiran Pejabat (Real-Time)
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Perubahan status kehadiran langsung tampil di layar Kiosk Lobi
                dan form pilihan tamu.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingBidang({
                  nama_bidang: "",
                  kepala_bidang: "",
                  nip_pejabat: "",
                  lokasi_ruangan: "",
                  status_pejabat: "Tersedia",
                })
              }
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold shadow transition"
            >
              <Plus className="w-4 h-4 text-[#F59E0B]" />
              <span>Tambah Bidang / Unit Kerja</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bidangList.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0F2C59]">
                      {b.nama_bidang}
                    </h3>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      Pejabat: {b.kepala_bidang}
                    </p>
                    {b.nip_pejabat && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        NIP: {b.nip_pejabat}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Lokasi: {b.lokasi_ruangan}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingBidang(b)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBidang(b.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Hapus Bidang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Status Pejabat Switcher */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">
                    Status Kehadiran Pejabat:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(["Tersedia", "Rapat", "Dinas Luar"] as StatusPejabat[]).map(
                      (st) => {
                        const active = b.status_pejabat === st;
                        const activeClass =
                          st === "Tersedia"
                            ? "bg-emerald-600 text-white"
                            : st === "Rapat"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-rose-600 text-white";
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => updateStatusPejabat(b.id, st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              active
                                ? `${activeClass} shadow-sm`
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {st}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === "monitoring_sekolah" ? (
        /* TAB 3: MONITORING & HISTORY KUNJUNGAN SEKOLAH SE-KOTA KENDARI (READ-ONLY) */
        <div className="space-y-5">
          {/* Banner Penegasan Kewenangan Read-Only Dinas */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-[#1E40AF] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-extrabold text-sm text-[#0F2C59]">
                  Monitoring Terpusat History Kunjungan Sekolah (Mode Pantau /
                  Read-Only)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sesuai tata kelola BUTADI Terintegrasi, pengelolaan/maintenance
                  buku tamu sekolah sepenuhnya dikelola oleh{" "}
                  <strong>Admin Sekolah masing-masing</strong>. Admin Dinas
                  Pendidikan dapat memantau riwayat kunjungan seluruh sekolah
                  secara <em>real-time</em> dan mengunduh rekapitulasi laporan.
                </p>
              </div>
            </div>
            <Link
              href="/sekolah"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold transition"
            >
              <School className="w-4 h-4 text-[#F59E0B]" />
              <span>Lihat Direktori Sekolah</span>
            </Link>
          </div>

          {/* Kartu Ringkasan Kunjungan per Sekolah (Klik untuk Filter Cepat) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-[#0F2C59] uppercase tracking-wider">
                Pilih Sekolah untuk Melihat History Kunjungan:
              </p>
              {filterSekolahId !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setFilterSekolahId("ALL")}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Tampilkan Semua Sekolah
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {sekolahList.map((s) => {
                const count = kunjunganSekolahList.filter(
                  (k) => k.sekolah_id === s.id
                ).length;
                const active = filterSekolahId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setFilterSekolahId(active ? "ALL" : s.id)
                    }
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      active
                        ? "border-[#1E40AF] bg-blue-50 text-[#0F2C59] shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/60"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-[#0F2C59] truncate">
                        {s.nama_sekolah}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {s.jenjang} &bull; NPSN {s.npsn}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-extrabold text-xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Lengkap & Tombol Ekspor Laporan Sekolah */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuerySekolah}
                  onChange={(e) => setSearchQuerySekolah(e.target.value)}
                  placeholder="Cari nama tamu, sekolah, NPSN..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-[#1E40AF]"
                />
              </div>

              <select
                value={filterJenjangSekolah}
                onChange={(e) => setFilterJenjangSekolah(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Jenjang (TK/SD/SMP)</option>
                <option value="SMP">Jenjang SMP</option>
                <option value="SD">Jenjang SD</option>
                <option value="TK/PAUD">Jenjang TK/PAUD</option>
              </select>

              <select
                value={filterKecamatanSekolah}
                onChange={(e) => setFilterKecamatanSekolah(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Kecamatan</option>
                {KECAMATAN_KENDARI_LIST.map((kec) => (
                  <option key={kec} value={kec}>
                    Kec. {kec}
                  </option>
                ))}
              </select>

              <select
                value={filterSekolahId}
                onChange={(e) => setFilterSekolahId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              >
                <option value="ALL">Semua Sekolah ({sekolahList.length})</option>
                {sekolahList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_sekolah} ({s.npsn})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filterDateSekolah}
                onChange={(e) => setFilterDateSekolah(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  exportKunjunganSekolahToPDF(
                    filteredKunjunganSekolah,
                    sekolahList,
                    {
                      targetSekolah:
                        filterSekolahId !== "ALL"
                          ? sekolahMap.get(filterSekolahId)
                          : undefined,
                      periodeLabel: filterDateSekolah || "Semua Periode",
                    }
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Ekspor PDF Sekolah</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  exportKunjunganSekolahToExcel(
                    filteredKunjunganSekolah,
                    sekolahList,
                    filterSekolahId !== "ALL"
                      ? sekolahMap.get(filterSekolahId)
                      : undefined
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Tabel History Kunjungan Sekolah (Read-Only) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F2C59] text-white text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Sekolah &amp; NPSN</th>
                    <th className="py-3.5 px-4">Tiket &amp; Waktu</th>
                    <th className="py-3.5 px-4">Identitas Tamu</th>
                    <th className="py-3.5 px-4">Tujuan di Sekolah</th>
                    <th className="py-3.5 px-4">Keperluan &amp; Catatan</th>
                    <th className="py-3.5 px-4">Status &amp; Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredKunjunganSekolah.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400"
                      >
                        Belum ada riwayat kunjungan pada sekolah yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredKunjunganSekolah.map((k) => {
                      const sek = sekolahMap.get(k.sekolah_id);
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
                          <td className="py-4 px-4">
                            <p className="font-extrabold text-[#0F2C59] text-sm">
                              {sek?.nama_sekolah || "-"}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {sek?.jenjang} &bull; NPSN:{" "}
                              <span className="font-mono font-bold">
                                {sek?.npsn}
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Kec. {sek?.kecamatan}
                            </p>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-[#0F2C59] text-[#F59E0B] font-mono font-extrabold text-xs">
                              {k.kode_tiket}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-1.5">
                              {k.tanggal} &bull;{" "}
                              {new Date(k.waktu_masuk).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-start gap-2.5">
                              {k.foto_url ? (
                                <img
                                  src={k.foto_url}
                                  alt={k.nama_tamu}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E40AF] font-extrabold text-xs flex items-center justify-center shrink-0">
                                  {k.nama_tamu.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-slate-900">
                                  {k.nama_tamu}
                                </p>
                                <p className="text-slate-600">
                                  {k.instansi_asal}
                                </p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-50 text-[#1E40AF] font-semibold text-[10px]">
                                  {k.kategori_tamu}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-bold text-[#0F2C59]">
                            {k.tujuan_unit}
                          </td>

                          <td className="py-4 px-4 max-w-xs">
                            <p className="text-slate-800">{k.keperluan}</p>
                            {k.catatan_sekolah && (
                              <p className="mt-1 p-1.5 rounded bg-blue-50 border border-blue-200 text-[11px] text-[#0F2C59]">
                                <strong>Catatan Sekolah:</strong>{" "}
                                {k.catatan_sekolah}
                              </p>
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
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View History Sekolah */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredKunjunganSekolah.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada riwayat kunjungan pada sekolah yang dipilih.
                </div>
              ) : (
                filteredKunjunganSekolah.map((k) => {
                  const sek = sekolahMap.get(k.sekolah_id);
                  return (
                    <div key={k.id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-[#0F2C59]">
                          {sek?.nama_sekolah} ({sek?.npsn})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {k.status}
                        </span>
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">
                          {k.nama_tamu}{" "}
                          <span className="font-normal text-slate-500">
                            ({k.instansi_asal})
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tujuan: <strong>{k.tujuan_unit}</strong> &bull;{" "}
                          {k.tanggal}
                        </p>
                        <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {k.keperluan}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 4: DATA MASTER AKUN SEKOLAH SE-KOTA KENDARI */
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-base text-[#0F2C59] flex items-center gap-2">
                <School className="w-5 h-5 text-[#1E40AF]" />
                <span>
                  Data Master Satuan Pendidikan (TK/SD/SMP) se-Kota Kendari
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Daftarkan sekolah baru atau lihat/reset Passcode Admin Sekolah
                jika operator sekolah lupa aksesnya.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchMasterSekolah}
                  onChange={(e) => setSearchMasterSekolah(e.target.value)}
                  placeholder="Cari sekolah / NPSN..."
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingSekolah({
                    npsn: "",
                    nama_sekolah: "",
                    jenjang: "SMP",
                    kecamatan: "Kadia",
                    alamat: "",
                    kepala_sekolah: "",
                    nip_kepsek: "",
                    no_wa_sekolah: "",
                    passcode: "sekolah1010",
                    status_kepsek: "Tersedia",
                    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
                    aktif: true,
                  })
                }
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold shadow transition"
              >
                <Plus className="w-4 h-4 text-[#F59E0B]" />
                <span>Tambah Sekolah Baru</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMasterSekolah.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E40AF] text-[10px] font-extrabold">
                        {s.jenjang}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-600">
                        NPSN: {s.npsn}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-[#0F2C59]">
                      {s.nama_sekolah}
                    </h3>
                    <p className="text-xs font-bold text-slate-700">
                      Kepala Sekolah: {s.kepala_sekolah}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1E40AF]" />
                      <span>
                        Kec. {s.kecamatan} &bull; {s.alamat}
                      </span>
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-[11px]">
                        <KeyRound className="w-3.5 h-3.5 text-[#F59E0B]" />
                        Passcode Admin Sekolah: {s.passcode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingSekolah(s)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Edit / Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSekolah(s.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Hapus Sekolah"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSekolahId(s.id);
                      setActiveTab("monitoring_sekolah");
                    }}
                    className="inline-flex items-center gap-1 text-[#1E40AF] font-extrabold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat History Tamu Sekolah Ini</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/sekolah/${s.npsn}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                    >
                      <span>Portal Tamu</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/sekolah/${s.npsn}/admin`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F2C59] text-white font-semibold text-[11px]"
                    >
                      <span>Portal Admin</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT MASTER SEKOLAH */}
      {editingSekolah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#0F2C59] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#F59E0B]">
              <h3 className="font-bold text-sm">
                {editingSekolah.id
                  ? `Edit Data Master Sekolah (${editingSekolah.nama_sekolah})`
                  : "Tambah Satuan Pendidikan Baru di Kota Kendari"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSekolah(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMasterSekolah} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NPSN Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSekolah.npsn || ""}
                    onChange={(e) =>
                      setEditingSekolah({
                        ...editingSekolah,
                        npsn: e.target.value,
                      })
                    }
                    placeholder="Contoh: 40402601"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenjang Pendidikan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingSekolah.jenjang || "SMP"}
                    onChange={(e) =>
                      setEditingSekolah({
                        ...editingSekolah,
                        jenjang: e.target.value as JenjangSekolah,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="SMP">SMP</option>
                    <option value="SD">SD</option>
                    <option value="TK/PAUD">TK / PAUD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Satuan Pendidikan / Sekolah{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingSekolah.nama_sekolah || ""}
                  onChange={(e) =>
                    setEditingSekolah({
                      ...editingSekolah,
                      nama_sekolah: e.target.value,
                    })
                  }
                  placeholder="Contoh: SMP Negeri 1 Kendari"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kecamatan
                  </label>
                  <select
                    value={editingSekolah.kecamatan || "Kadia"}
                    onChange={(e) =>
                      setEditingSekolah({
                        ...editingSekolah,
                        kecamatan: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {KECAMATAN_KENDARI_LIST.map((kec) => (
                      <option key={kec} value={kec}>
                        {kec}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passcode Admin Sekolah{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSekolah.passcode || ""}
                    onChange={(e) =>
                      setEditingSekolah({
                        ...editingSekolah,
                        passcode: e.target.value,
                      })
                    }
                    placeholder="Contoh: smpn1kdi"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  value={editingSekolah.alamat || ""}
                  onChange={(e) =>
                    setEditingSekolah({
                      ...editingSekolah,
                      alamat: e.target.value,
                    })
                  }
                  placeholder="Jl. ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kepala Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSekolah.kepala_sekolah || ""}
                    onChange={(e) =>
                      setEditingSekolah({
                        ...editingSekolah,
                        kepala_sekolah: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={editingSekolah.nip_kepsek || ""}
                    onChange={(e) =>
                      setEditingSekolah({
                        ...editingSekolah,
                        nip_kepsek: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSekolah(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2C59] text-white text-xs font-bold"
                >
                  Simpan Data Sekolah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DISPOSISI / ALIHKAN TAMU */}
      {disposisiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0F2C59] text-white px-5 py-4 flex items-center justify-between border-b-2 border-[#F59E0B]">
              <h3 className="font-bold text-sm">
                Disposisi / Alihkan Kunjungan ({disposisiTarget.kode_tiket})
              </h3>
              <button
                onClick={() => setDisposisiTarget(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitDisposisi} className="p-5 space-y-4">
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">
                  Tamu: {disposisiTarget.nama_tamu} (
                  {disposisiTarget.instansi_asal})
                </p>
                <p className="text-slate-600 mt-0.5">
                  Keperluan: {disposisiTarget.keperluan}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alihkan ke Bidang / Pejabat Tujuan:
                </label>
                <select
                  value={newBidangId}
                  onChange={(e) => setNewBidangId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
                >
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_bidang} ({b.kepala_bidang} - {b.status_pejabat})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Disposisi / Instruksi Pelayanan:
                </label>
                <textarea
                  rows={3}
                  value={catatanDisposisi}
                  onChange={(e) => setCatatanDisposisi(e.target.value)}
                  placeholder="Contoh: Pejabat sedang dinas luar, silakan menghadap Kasubag Umum / Staf GTK..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#1E40AF] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisposisiTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold shadow"
                >
                  Simpan Disposisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRIGGER OTOMATIS SKM SAAT CHECK-OUT */}
      {checkoutVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-teal-500">
            <div className="bg-teal-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-extrabold text-sm">
                  Kunjungan Selesai &amp; Trigger SKM Aktif!
                </h3>
              </div>
              <button
                onClick={() => setCheckoutVisitor(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Status kunjungan Bapak/Ibu{" "}
                <strong>{checkoutVisitor.nama_tamu}</strong> (Tiket{" "}
                <strong className="font-mono">
                  {checkoutVisitor.kode_tiket}
                </strong>
                ) telah diubah menjadi <strong>SELESAI</strong>. Layar E-Ticket
                tamu kini otomatis menampilkan tombol pengisian{" "}
                <strong>Survei Kepuasan Masyarakat (SKM)</strong>.
              </p>

              {waAutoStatus && (
                <div className="p-3 rounded-xl bg-slate-100 text-slate-700 font-medium">
                  Status WA Gateway: {waAutoStatus}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={getDirectWaUrl(
                    checkoutVisitor.no_wa,
                    buildSkmWaMessage(
                      checkoutVisitor,
                      bidangMap.get(checkoutVisitor.bidang_id)
                    )
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-center flex items-center justify-center gap-2 shadow"
                >
                  <MessageSquareShare className="w-4 h-4" />
                  <span>Kirim Tautan Survei SKM ke WhatsApp Tamu</span>
                </a>
                <button
                  type="button"
                  onClick={() => setCheckoutVisitor(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR SCANNER */}
      {showQrScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0F2C59] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#F59E0B]" />
                <span>Scan QR Code E-Ticket Tamu</span>
              </h3>
              <button
                onClick={() => setShowQrScanner(false)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-center">
              <div
                id={scannerContainerId}
                className="w-full rounded-2xl overflow-hidden bg-slate-900 min-h-[240px]"
              />
              <p className="text-xs text-slate-500">
                Arahkan QR Code E-Ticket pada HP tamu ke kamera, atau ketik
                kode tiket di bawah ini:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  placeholder="BTD-KDI-001"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(scannedCode);
                    setShowQrScanner(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0F2C59] text-white text-xs font-bold"
                >
                  Cari
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT BIDANG */}
      {editingBidang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0F2C59] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingBidang.id
                  ? "Edit Data Bidang / Unit"
                  : "Tambah Bidang Baru"}
              </h3>
              <button
                onClick={() => setEditingBidang(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBidangForm} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bidang / Unit Kerja
                </label>
                <input
                  type="text"
                  required
                  value={editingBidang.nama_bidang || ""}
                  onChange={(e) =>
                    setEditingBidang({
                      ...editingBidang,
                      nama_bidang: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pejabat / Kepala Bidang
                </label>
                <input
                  type="text"
                  required
                  value={editingBidang.kepala_bidang || ""}
                  onChange={(e) =>
                    setEditingBidang({
                      ...editingBidang,
                      kepala_bidang: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP Pejabat
                </label>
                <input
                  type="text"
                  value={editingBidang.nip_pejabat || ""}
                  onChange={(e) =>
                    setEditingBidang({
                      ...editingBidang,
                      nip_pejabat: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Ruangan
                </label>
                <input
                  type="text"
                  required
                  value={editingBidang.lokasi_ruangan || ""}
                  onChange={(e) =>
                    setEditingBidang({
                      ...editingBidang,
                      lokasi_ruangan: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBidang(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F2C59] text-white text-xs font-bold"
                >
                  Simpan Bidang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Data Tamu */}
      {deletingVisitor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Data Kunjungan Tamu?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tindakan ini akan menghapus data kunjungan dan hasil survei SKM terkait secara permanen dari sistem.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nomor Tiket:</span>
                <span className="font-mono font-extrabold text-[#0F2C59] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {deletingVisitor.kode_tiket}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nama Tamu:</span>
                <span className="font-bold text-slate-900">
                  {deletingVisitor.nama_tamu}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Instansi / Asal:</span>
                <span className="text-slate-700">{deletingVisitor.instansi_asal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-slate-800">{deletingVisitor.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingVisitor}
                onClick={() => setDeletingVisitor(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingVisitor}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingVisitor ? "Menghapus..." : "Ya, Hapus Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalAdminPage() {
  return (
    <PasscodeGate
      storageKey="butadi_auth_admin"
      expectedPasscode="admin1010"
      portalBadge="Otorisasi Petugas Admin"
      portalTitle="Portal Admin & Resepsionis"
      portalSubtitle="Halaman khusus Petugas Front Office (Lobi) dan Staf Administrasi Bidang Dikbud Kota Kendari."
    >
      {(onLock) => <PortalAdminDashboard onLock={onLock} />}
    </PasscodeGate>
  );
}
