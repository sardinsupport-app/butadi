"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  MessageSquareShare,
  Monitor,
  QrCode,
  RefreshCw,
  School,
  Search,
  Send,
  Sparkles,
  Star,
  Ticket,
  UserCheck,
  VideoOff,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { KategoriTamuSekolah } from "@/types/butadi";
import {
  buildTicketSekolahWaMessage,
  getDirectWaUrl,
  sendFonnteWhatsApp,
} from "@/lib/whatsapp";
import { KendariLogo } from "@/components/Navbar";

function PortalTamuSekolahContent() {
  const params = useParams<{ npsn: string }>();
  const searchParams = useSearchParams();
  const npsn = params?.npsn || "";

  const {
    sekolahList,
    kunjunganSekolahList,
    createKunjunganSekolah,
    findVisitorSekolahByNikNip,
    updateStatusKunjunganSekolah,
  } = useButadi();

  const sekolah = sekolahList.find((s) => s.npsn === npsn);

  const initialTiketParam = searchParams.get("tiket") || "";
  const [activeTab, setActiveTab] = useState<"form" | "tiket">(
    initialTiketParam ? "tiket" : "form"
  );

  // Form states
  const [nikNip, setNikNip] = useState("");
  const [namaTamu, setNamaTamu] = useState("");
  const [instansiAsal, setInstansiAsal] = useState("");
  const [kategoriTamu, setKategoriTamu] =
    useState<KategoriTamuSekolah>("Orang Tua / Wali");
  const [noWa, setNoWa] = useState("");
  const [tujuanUnit, setTujuanUnit] = useState(
    sekolah?.unit_layanan?.[0] || "Kepala Sekolah"
  );
  const [keperluan, setKeperluan] = useState("");
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Camera Selfie states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Ticket tracking & rating states
  const [lookupTiketInput, setLookupTiketInput] = useState(initialTiketParam);
  const [activeTicketCode, setActiveTicketCode] = useState(initialTiketParam);
  const [waSentInfo, setWaSentInfo] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState<number>(4);
  const [saranSekolah, setSaranSekolah] = useState<string>("");
  const [ratingSaved, setRatingSaved] = useState<boolean>(false);

  useEffect(() => {
    if (sekolah?.unit_layanan?.length && !tujuanUnit) {
      setTujuanUnit(sekolah.unit_layanan[0]);
    }
  }, [sekolah, tujuanUnit]);

  useEffect(() => {
    if (initialTiketParam) {
      setActiveTicketCode(initialTiketParam);
      setLookupTiketInput(initialTiketParam);
      setActiveTab("tiket");
    }
  }, [initialTiketParam]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setCameraError(
        "Kamera tidak dapat diakses. Pastikan izin kamera browser diaktifkan."
      );
      setCameraActive(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      setFotoUrl(dataUrl);
    }
    stopCamera();
  };

  const handleNikNipLookup = async (val: string) => {
    setNikNip(val);
    if (val.trim().length >= 8) {
      const found = await findVisitorSekolahByNikNip(val.trim());
      if (found) {
        if (!namaTamu) setNamaTamu(found.nama_tamu);
        if (!instansiAsal) setInstansiAsal(found.instansi_asal);
        setKategoriTamu(found.kategori_tamu);
        if (!noWa) setNoWa(found.no_wa);
        setAutoFillNotice(
          `Data pengunjung ditemukan (${found.nama_tamu}) dan diisi otomatis!`
        );
      } else {
        setAutoFillNotice(null);
      }
    } else {
      setAutoFillNotice(null);
    }
  };

  if (!sekolah) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-3">
          <School className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-xl font-extrabold text-[#0F2C59]">
            Satuan Pendidikan Tidak Ditemukan (NPSN: {npsn})
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pastikan kode NPSN sekolah sudah terdaftar di ekosistem BUTADI Dinas
            Pendidikan dan Kebudayaan Kota Kendari.
          </p>
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

  const schoolVisits = kunjunganSekolahList.filter(
    (k) => k.sekolah_id === sekolah.id
  );

  const currentTicket = schoolVisits.find(
    (k) =>
      k.kode_tiket.toLowerCase() === activeTicketCode.trim().toLowerCase()
  );

  const quickTemplates = [
    "Konsultasi perkembangan akademik & karakter siswa",
    "Pengambilan Rapor / Ijazah / Legalisir Dokumen Sekolah",
    "Urusan mutasi / pendaftaran peserta didik",
    "Supervisi & monitoring Pengawas Dinas Pendidikan",
    "Koordinasi Komite Sekolah / Mitra Satuan Pendidikan",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikNip || !namaTamu || !instansiAsal || !noWa || !keperluan) return;
    setSubmitting(true);
    try {
      const created = await createKunjunganSekolah({
        sekolah_id: sekolah.id,
        npsn: sekolah.npsn,
        nik_nip: nikNip,
        nama_tamu: namaTamu,
        instansi_asal: instansiAsal,
        kategori_tamu: kategoriTamu,
        no_wa: noWa,
        tujuan_unit: tujuanUnit,
        keperluan,
        foto_url: fotoUrl,
      });

      const waMsg = buildTicketSekolahWaMessage(created, sekolah);
      const waResult = await sendFonnteWhatsApp(created.no_wa, waMsg);
      setWaSentInfo(waResult.info);

      setActiveTicketCode(created.kode_tiket);
      setLookupTiketInput(created.kode_tiket);
      setActiveTab("tiket");
      setRatingSaved(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRatingAndCheckout = async () => {
    if (!currentTicket) return;
    await updateStatusKunjunganSekolah(currentTicket.id, "Selesai", {
      nilai_kepuasan: ratingVal,
      saran_masukan: saranSekolah.trim() || null,
    });
    setRatingSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Identitas Sekolah */}
      <div className="bg-gradient-to-r from-[#0F2C59] via-[#1E40AF] to-[#0F2C59] text-white rounded-3xl p-5 sm:p-7 shadow-xl border-b-4 border-[#F59E0B] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <KendariLogo className="w-12 h-12 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[10px] font-extrabold uppercase tracking-wider">
                  BUKU TAMU DIGITAL SEKOLAH &bull; {sekolah.jenjang}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-blue-100 font-mono text-[11px] font-bold">
                  NPSN: {sekolah.npsn}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
                {sekolah.nama_sekolah}
              </h1>
              <p className="text-xs text-blue-200 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>
                  Kec. {sekolah.kecamatan} &bull; {sekolah.alamat}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sekolah/${sekolah.npsn}/kiosk`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
            >
              <Monitor className="w-4 h-4 text-[#F59E0B]" />
              <span>Layar Kiosk</span>
            </Link>
            <Link
              href="/sekolah"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Daftar Sekolah</span>
            </Link>
          </div>
        </div>

        {/* Bar Info Kepala Sekolah */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-blue-200">Kepala Sekolah:</span>
            <strong className="text-white">{sekolah.kepala_sekolah}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-200">Status Kehadiran:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                sekolah.status_kepsek === "Tersedia"
                  ? "bg-emerald-400 text-slate-950"
                  : sekolah.status_kepsek === "Rapat"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-rose-400 text-slate-950"
              }`}
            >
              {sekolah.status_kepsek}
            </span>
          </div>
        </div>

        {/* Switch Tabs */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === "form"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Formulir Check-In Tamu</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tiket")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === "tiket"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>E-Ticket &amp; Status Kunjungan</span>
          </button>
        </div>
      </div>

      {activeTab === "form" ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F2C59]">
                Identitas Tamu {sekolah.nama_sekolah}
              </h2>
              <p className="text-xs text-slate-500">
                Ketik NIK/NIP Anda. Jika sudah pernah berkunjung ke sekolah di
                Kota Kendari, data akan terisi otomatis.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 self-start sm:self-center">
              Terintegrasi Dikbud Kota Kendari
            </span>
          </div>

          {autoFillNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{autoFillNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIK atau NIP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nikNip}
                onChange={(e) => handleNikNipLookup(e.target.value)}
                placeholder="Masukkan NIK atau NIP Anda"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Tamu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaTamu}
                onChange={(e) => setNamaTamu(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori Tamu Sekolah <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategoriTamu}
                onChange={(e) =>
                  setKategoriTamu(e.target.value as KategoriTamuSekolah)
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
              >
                <option value="Orang Tua / Wali">
                  Orang Tua / Wali Peserta Didik
                </option>
                <option value="Pengawas / Dikbud">
                  Pengawas Sekolah / Pejabat Dikbud
                </option>
                <option value="Instansi / Mitra">
                  Tamu Instansi / Puskesmas / Mitra
                </option>
                <option value="Umum">Masyarakat Umum / Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keterangan Asal / Orang Tua Siswa Kelas{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={instansiAsal}
                onChange={(e) => setInstansiAsal(e.target.value)}
                placeholder="Contoh: Wali Siswa Kelas VIII-A / Pengawas Dikbud"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                placeholder="Contoh: 081241234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>
          </div>

          {/* Pemilihan Unit Tujuan di Sekolah */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Pejabat / Unit Layanan di {sekolah.nama_sekolah}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(sekolah.unit_layanan || []).map((unit) => {
                const isSelected = tujuanUnit === unit;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setTujuanUnit(unit)}
                    className={`text-left p-3.5 rounded-2xl border-2 transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? "border-[#1E40AF] bg-blue-50/70 text-[#0F2C59] shadow-sm font-extrabold"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold"
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{unit}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keperluan Kunjungan */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Keperluan Kunjungan di Sekolah{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {quickTemplates.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setKeperluan(tpl)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#1E40AF] text-slate-700 border border-slate-200 transition"
                >
                  + {tpl}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              placeholder="Tuliskan keperluan kunjungan Anda di sekolah ini..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
            />
          </div>

          {/* Swafoto Kamera */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Swafoto (Selfie) Tamu Sekolah
                </label>
                <p className="text-[11px] text-slate-500">
                  Dokumentasi kehadiran tamu di lingkungan sekolah
                </p>
              </div>
              {!cameraActive && !fotoUrl && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold transition shrink-0"
                >
                  <Camera className="w-4 h-4 text-[#F59E0B]" />
                  <span>Buka Kamera Selfie</span>
                </button>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <VideoOff className="w-4 h-4 shrink-0" />
                <span>
                  {cameraError} (Anda tetap dapat mengirim buku tamu tanpa
                  foto).
                </span>
              </div>
            )}

            {cameraActive && (
              <div className="bg-slate-900 rounded-2xl p-4 text-center space-y-3 max-w-sm mx-auto">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl border-2 border-[#F59E0B] bg-black aspect-[4/3] object-cover"
                />
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={captureSelfie}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#F59E0B] text-[#0F2C59] font-extrabold text-xs shadow"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {fotoUrl && (
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <img
                  src={fotoUrl}
                  alt="Selfie Tamu Sekolah"
                  className="w-24 h-20 object-cover rounded-xl border-2 border-[#0F2C59]"
                />
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Swafoto berhasil diambil</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoUrl(null);
                      startCamera();
                    }}
                    className="text-xs font-bold text-[#1E40AF] hover:underline"
                  >
                    Ambil Ulang Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] font-extrabold text-base shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            <span>
              {submitting
                ? "Menyimpan Buku Tamu Sekolah..."
                : `Simpan Buku Tamu ${sekolah.nama_sekolah}`}
            </span>
          </button>
        </form>
      ) : (
        /* TAB E-TICKET & PENILAIAN LAYANAN SEKOLAH */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupTiketInput}
                onChange={(e) => setLookupTiketInput(e.target.value)}
                placeholder={`Masukkan Kode Tiket (misal: BTD-${sekolah.npsn}-001)`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveTicketCode(lookupTiketInput)}
              className="px-5 py-2.5 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold transition"
            >
              Lacak Tiket
            </button>
          </div>

          {!currentTicket ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">
                Belum Ada Tiket yang Dipilih
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Masukkan nomor tiket kunjungan Anda di atas atau isi formulir
                buku tamu {sekolah.nama_sekolah} terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border-2 border-[#0F2C59] overflow-hidden">
              {/* Ticket Header */}
              <div className="bg-[#0F2C59] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#F59E0B]">
                <div className="flex items-center gap-3">
                  <KendariLogo className="w-12 h-12" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#F59E0B] font-extrabold">
                      E-TICKET KUNJUNGAN SEKOLAH &bull; NPSN {sekolah.npsn}
                    </p>
                    <h2 className="text-lg sm:text-xl font-extrabold">
                      {sekolah.nama_sekolah}
                    </h2>
                  </div>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right">
                  <p className="text-[10px] uppercase text-blue-200">
                    Kode Tiket
                  </p>
                  <p className="text-lg font-mono font-extrabold text-[#F59E0B]">
                    {currentTicket.kode_tiket}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  currentTicket.status === "Dilayani"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : currentTicket.status === "Selesai"
                    ? "bg-teal-50 border-teal-200 text-teal-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E40AF]" />
                    Status: {currentTicket.status}
                  </span>
                  <p className="font-extrabold text-base pt-1">
                    {currentTicket.status === "Menunggu" &&
                      "Menunggu Konfirmasi Petugas Piket / Tata Usaha Sekolah..."}
                    {currentTicket.status === "Dilayani" &&
                      `Silakan Menuju: ${currentTicket.tujuan_unit}`}
                    {currentTicket.status === "Selesai" &&
                      "Kunjungan Selesai. Terima kasih atas kunjungan Anda!"}
                    {currentTicket.status === "Batal" &&
                      "Kunjungan Dibatalkan / Dijadwalkan Ulang."}
                  </p>
                  {currentTicket.catatan_sekolah && (
                    <p className="text-xs font-semibold bg-white/80 px-3 py-2 rounded-xl border border-blue-200 mt-1">
                      Catatan Sekolah:{" "}
                      <span className="text-[#0F2C59]">
                        {currentTicket.catatan_sekolah}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Detail Tamu & QR */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-4">
                    {currentTicket.foto_url ? (
                      <img
                        src={currentTicket.foto_url}
                        alt={currentTicket.nama_tamu}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0F2C59]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#0F2C59] text-[#F59E0B] flex items-center justify-center font-extrabold text-xl">
                        {currentTicket.nama_tamu.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E40AF]">
                        {currentTicket.kategori_tamu}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                        {currentTicket.nama_tamu}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {currentTicket.instansi_asal} &bull; NIK/NIP:{" "}
                        {currentTicket.nik_nip}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold">
                        Unit Tujuan di Sekolah
                      </p>
                      <p className="font-extrabold text-[#0F2C59] mt-0.5">
                        {currentTicket.tujuan_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">
                        Waktu Check-In
                      </p>
                      <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1E40AF]" />
                        <span>
                          {new Date(
                            currentTicket.waktu_masuk
                          ).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WITA ({currentTicket.tanggal})
                        </span>
                      </p>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                      <p className="text-slate-400 font-semibold">Keperluan</p>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {currentTicket.keperluan}
                      </p>
                    </div>
                  </div>

                  {/* Kirim Tiket ke WA */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <a
                      href={getDirectWaUrl(
                        currentTicket.no_wa,
                        buildTicketSekolahWaMessage(currentTicket, sekolah)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                    >
                      <MessageSquareShare className="w-4 h-4" />
                      <span>Kirim E-Ticket ke WhatsApp</span>
                    </a>
                    {waSentInfo && (
                      <span className="text-[11px] text-slate-500">
                        ({waSentInfo})
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <QRCodeSVG
                      value={currentTicket.kode_tiket}
                      size={140}
                      bgColor="#FFFFFF"
                      fgColor="#0F2C59"
                      level="H"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#0F2C59]">
                    QR Code E-Ticket Sekolah
                  </p>
                </div>
              </div>

              {/* Form Check-Out & Rating Kepuasan Layanan Sekolah */}
              <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-4">
                <h4 className="font-extrabold text-sm text-[#0F2C59] flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>
                    Penilaian Kepuasan Pelayanan {sekolah.nama_sekolah}
                  </span>
                </h4>

                {ratingSaved || currentTicket.nilai_kepuasan ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Terima kasih! Penilaian pelayanan sekolah (
                      {currentTicket.nilai_kepuasan || ratingVal} / 4 Bintang)
                      telah tersimpan.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { val: 1, label: "Kurang Baik" },
                        { val: 2, label: "Cukup Baik" },
                        { val: 3, label: "Baik" },
                        { val: 4, label: "Sangat Baik" },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setRatingVal(item.val)}
                          className={`p-3 rounded-xl border-2 text-left transition ${
                            ratingVal === item.val
                              ? "border-teal-600 bg-teal-50/70 font-extrabold text-teal-950"
                              : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: item.val }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]"
                              />
                            ))}
                          </div>
                          <span className="text-xs">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={saranSekolah}
                      onChange={(e) => setSaranSekolah(e.target.value)}
                      placeholder="Saran atau apresiasi untuk pelayanan sekolah (opsional)..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                    />

                    <button
                      type="button"
                      onClick={handleSaveRatingAndCheckout}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow transition"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Selesai Kunjungan &amp; Kirim Penilaian</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortalTamuSekolahPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-8 text-center text-sm text-slate-500">
          Memuat Portal Buku Tamu Sekolah...
        </div>
      }
    >
      <PortalTamuSekolahContent />
    </Suspense>
  );
}
