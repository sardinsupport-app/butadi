"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MapPin,
  MessageSquareShare,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Ticket,
  UserCheck,
  VideoOff,
} from "lucide-react";
import { useButadi } from "@/context/ButadiContext";
import { KategoriTamu, Kunjungan } from "@/types/butadi";
import {
  buildTicketWaMessage,
  getDirectWaUrl,
  sendFonnteWhatsApp,
} from "@/lib/whatsapp";
import { KendariLogo } from "@/components/Navbar";

function PortalTamuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    bidangList,
    kunjunganList,
    createKunjungan,
    findVisitorByNikNip,
    updateStatusKunjungan,
  } = useButadi();

  const initialTiketParam = searchParams.get("tiket") || "";
  const [activeTab, setActiveTab] = useState<"form" | "tiket">(
    initialTiketParam ? "tiket" : "form"
  );

  // Form states
  const [nikNip, setNikNip] = useState("");
  const [namaTamu, setNamaTamu] = useState("");
  const [instansiAsal, setInstansiAsal] = useState("");
  const [kategoriTamu, setKategoriTamu] =
    useState<KategoriTamu>("Guru/Kepsek");
  const [noWa, setNoWa] = useState("");
  const [bidangId, setBidangId] = useState(
    bidangList[2]?.id || bidangList[0]?.id || ""
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

  // Ticket tracking states
  const [lookupTiketInput, setLookupTiketInput] = useState(initialTiketParam);
  const [activeTicketCode, setActiveTicketCode] = useState(initialTiketParam);
  const [waSentInfo, setWaSentInfo] = useState<string | null>(null);

  useEffect(() => {
    if (bidangList.length > 0 && !bidangId) {
      setBidangId(bidangList[0].id);
    }
  }, [bidangList, bidangId]);

  useEffect(() => {
    if (initialTiketParam) {
      setActiveTicketCode(initialTiketParam);
      setLookupTiketInput(initialTiketParam);
      setActiveTab("tiket");
    }
  }, [initialTiketParam]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser ini tidak mendukung akses kamera langsung.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 360 },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Tidak dapat mengakses kamera perangkat.";
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 270;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      setFotoUrl(dataUrl);
    }
    stopCamera();
  };

  const handleNikNipLookup = async (value: string) => {
    setNikNip(value);
    if (value.trim().length >= 8) {
      const existing = await findVisitorByNikNip(value);
      if (existing) {
        setNamaTamu(existing.nama_tamu);
        setInstansiAsal(existing.instansi_asal);
        setKategoriTamu(existing.kategori_tamu);
        setNoWa(existing.no_wa);
        setAutoFillNotice(
          `Data ditemukan! Selamat datang kembali, ${existing.nama_tamu} (${existing.instansi_asal}).`
        );
      } else {
        setAutoFillNotice(null);
      }
    } else {
      setAutoFillNotice(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikNip || !namaTamu || !instansiAsal || !noWa || !bidangId || !keperluan)
      return;

    setSubmitting(true);
    stopCamera();

    const created: Kunjungan = await createKunjungan({
      nik_nip: nikNip,
      nama_tamu: namaTamu,
      instansi_asal: instansiAsal,
      kategori_tamu: kategoriTamu,
      no_wa: noWa,
      bidang_id: bidangId,
      keperluan,
      foto_url: fotoUrl,
    });

    const targetBidang = bidangList.find((b) => b.id === created.bidang_id);
    const waMsg = buildTicketWaMessage(created, targetBidang);
    const fonnteRes = await sendFonnteWhatsApp(created.no_wa, waMsg);
    setWaSentInfo(fonnteRes.info);

    setActiveTicketCode(created.kode_tiket);
    setLookupTiketInput(created.kode_tiket);
    setActiveTab("tiket");
    setSubmitting(false);
  };

  const currentTicket = kunjunganList.find(
    (k) =>
      k.kode_tiket.toLowerCase() === activeTicketCode.trim().toLowerCase()
  );

  const selectedBidang = bidangList.find((b) => b.id === bidangId);
  const ticketBidang = bidangList.find(
    (b) => b.id === currentTicket?.bidang_id
  );

  const quickTemplates = [
    "Verifikasi Berkas Tunjangan Profesi Guru (TPG) / Sertifikasi",
    "Konsultasi Mutasi / Pindah Rayon Siswa SD/SMP",
    "Koordinasi Laporan Dana BOS & Sinkronisasi Dapodik",
    "Legalisir Ijazah / Surat Keterangan Pengganti Ijazah",
    "Audiensi / Koordinasi Program Pendidikan & Kebudayaan",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Portal Tamu */}
      <div className="bg-gradient-to-r from-[#0F2C59] to-[#1E40AF] text-white rounded-3xl p-6 shadow-xl border-b-4 border-[#F59E0B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#0F2C59] text-[11px] font-extrabold uppercase">
            Portal 1 &bull; Mobile-First Check-In
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            Portal Tamu Digital Dikbud Kendari
          </h1>
          <p className="text-xs sm:text-sm text-blue-100">
            Isi buku tamu dalam 30 detik &amp; pantau panggilan ruangan secara{" "}
            <em>real-time</em> dari HP Anda.
          </p>
        </div>

        {/* Switcher Tab */}
        <div className="flex bg-slate-900/40 p-1 rounded-xl border border-white/15 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === "form"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "text-blue-100 hover:text-white"
            }`}
          >
            Isi Buku Tamu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tiket")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "tiket"
                ? "bg-[#F59E0B] text-[#0F2C59] shadow"
                : "text-blue-100 hover:text-white"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>E-Ticket &amp; Status</span>
          </button>
        </div>
      </div>

      {activeTab === "form" ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          {/* Quick Demo Auto-Fill helper */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-700">
              <p className="font-bold text-[#0F2C59] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#1E40AF]" />
                <span>Fitur Smart Auto-Fill NIK / NIP:</span>
              </p>
              <p className="mt-0.5">
                Ketik NIP/NIK tamu yang pernah berkunjung untuk mengisi otomatis
                identitas tamu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleNikNipLookup("198103152006041009")}
              className="shrink-0 px-3 py-2 rounded-xl bg-white hover:bg-blue-100 text-[#1E40AF] border border-blue-300 text-xs font-bold transition"
            >
              Coba NIP Contoh (SMPN 1 Kendari)
            </button>
          </div>

          {autoFillNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{autoFillNotice}</span>
            </div>
          )}

          {/* Grid Identitas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIK / NIP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nikNip}
                onChange={(e) => handleNikNipLookup(e.target.value)}
                placeholder="Masukkan 16 digit NIK atau 18 digit NIP"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaTamu}
                onChange={(e) => setNamaTamu(e.target.value)}
                placeholder="Contoh: Drs. La Ode Muh. Saleh, M.Pd."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori Tamu <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategoriTamu}
                onChange={(e) =>
                  setKategoriTamu(e.target.value as KategoriTamu)
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-[#1E40AF] outline-none"
              >
                <option value="Guru/Kepsek">
                  Guru / Kepala Sekolah / Tendik
                </option>
                <option value="Umum">Orang Tua Siswa / Masyarakat Umum</option>
                <option value="Instansi">
                  Tamu Instansi / Lembaga / Mitra
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sekolah / Instansi / Alamat Asal{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={instansiAsal}
                onChange={(e) => setInstansiAsal(e.target.value)}
                placeholder="Contoh: SDN 2 Baruga / SMPN 9 Kendari"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor WhatsApp Aktif (Untuk Pengiriman E-Ticket &amp; Link SKM){" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                placeholder="Contoh: 081241234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] outline-none"
              />
            </div>
          </div>

          {/* Pemilihan Tujuan Terstruktur */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Pilih Bidang / Pejabat yang Dituju{" "}
              <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bidangList.map((b) => {
                const isSelected = b.id === bidangId;
                const statusColor =
                  b.status_pejabat === "Tersedia"
                    ? "bg-emerald-100 text-emerald-800"
                    : b.status_pejabat === "Rapat"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800";

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBidangId(b.id)}
                    className={`text-left p-3.5 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-[#1E40AF] bg-blue-50/60 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-[#0F2C59]">
                        {b.nama_bidang}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}
                      >
                        {b.status_pejabat}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <p className="font-medium text-slate-800">
                        {b.kepala_bidang}
                      </p>
                      <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#1E40AF]" />
                        <span>{b.lokasi_ruangan}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedBidang && selectedBidang.status_pejabat !== "Tersedia" && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Informasi:</strong> Pejabat pada{" "}
                <strong>{selectedBidang.nama_bidang}</strong> saat ini berstatus{" "}
                <strong>{selectedBidang.status_pejabat}</strong>. Anda tetap
                dapat melakukan check-in untuk dilayani oleh Staf/Kasubag atau
                dijadwalkan disposisi.
              </div>
            )}
          </div>

          {/* Keperluan Kunjungan */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Maksud dan Keperluan Kunjungan{" "}
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
              placeholder="Tuliskan rincian keperluan Anda secara singkat dan jelas..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1E40AF] outline-none"
            />
          </div>

          {/* Web-Camera Selfie Capture */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Swafoto (Selfie) Tamu &mdash; Validasi Keamanan
                </label>
                <p className="text-[11px] text-slate-500">
                  Ambil foto wajah langsung dari kamera browser HP/Tablet Anda
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
                  {cameraError} (Anda tetap dapat mengirim formulir tanpa foto
                  kamera).
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
                    <span>Ambil Foto Sekarang</span>
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
                  alt="Selfie Tamu"
                  className="w-24 h-20 object-cover rounded-xl border-2 border-[#0F2C59]"
                />
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Swafoto berhasil ditangkap</span>
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
                ? "Memproses Tiket Antrean..."
                : "Kirim & Dapatkan E-Ticket Kunjungan"}
            </span>
          </button>
        </form>
      ) : (
        /* TAB E-TICKET & REAL-TIME TRACKING */
        <div className="space-y-6">
          {/* Pencarian Nomor Tiket */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupTiketInput}
                onChange={(e) => setLookupTiketInput(e.target.value)}
                placeholder="Masukkan Kode Tiket (misal: BTD-KDI-002)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-[#1E40AF] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveTicketCode(lookupTiketInput)}
              className="px-5 py-2.5 rounded-xl bg-[#0F2C59] hover:bg-[#1E40AF] text-white text-xs font-bold transition"
            >
              Lacak Status Tiket
            </button>
            <div className="flex flex-wrap gap-1.5">
              {kunjunganList.slice(0, 3).map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => {
                    setLookupTiketInput(k.kode_tiket);
                    setActiveTicketCode(k.kode_tiket);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                    activeTicketCode.toLowerCase() ===
                    k.kode_tiket.toLowerCase()
                      ? "bg-[#F59E0B] text-[#0F2C59] border-[#F59E0B]"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {k.kode_tiket}
                </button>
              ))}
            </div>
          </div>

          {!currentTicket ? (
            <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200 space-y-3">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">
                Pilih atau Masukkan Kode Tiket Kunjungan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ketikkan kode tiket kunjungan Anda pada kotak pencarian di atas,
                atau lakukan pendaftaran pada formulir buku tamu untuk mendapatkan E-Ticket baru.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border-2 border-[#0F2C59] overflow-hidden tenun-card-watermark">
              {/* Ticket Header */}
              <div className="bg-[#0F2C59] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#F59E0B]">
                <div className="flex items-center gap-3">
                  <KendariLogo className="w-12 h-12" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#F59E0B] font-extrabold">
                      E-TICKET KUNJUNGAN RESMI &bull; REAL-TIME TRACKER
                    </p>
                    <h2 className="text-lg sm:text-xl font-extrabold">
                      Dinas Pendidikan &amp; Kebudayaan Kota Kendari
                    </h2>
                  </div>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right">
                  <p className="text-[10px] uppercase text-blue-200">
                    Nomor Antrean Tiket
                  </p>
                  <p className="text-xl font-mono font-extrabold text-[#F59E0B]">
                    {currentTicket.kode_tiket}
                  </p>
                </div>
              </div>

              {/* Live Status Banner */}
              <div
                className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  currentTicket.status === "Dilayani"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : currentTicket.status === "Disposisi"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-950"
                    : currentTicket.status === "Selesai"
                    ? "bg-teal-50 border-teal-200 text-teal-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E40AF]" />
                      Status Real-Time: {currentTicket.status}
                    </span>
                  </div>
                  <p className="font-extrabold text-base sm:text-lg pt-1">
                    {currentTicket.status === "Menunggu" &&
                      "Menunggu Konfirmasi Petugas Lobi / Admin Bidang..."}
                    {currentTicket.status === "Dilayani" &&
                      `SILAKAN MASUK KE RUANGAN: ${
                        ticketBidang?.lokasi_ruangan ||
                        ticketBidang?.nama_bidang
                      }`}
                    {currentTicket.status === "Disposisi" &&
                      `DIALIHKAN / DISPOSISI KE: ${
                        ticketBidang?.nama_bidang || "-"
                      }`}
                    {currentTicket.status === "Selesai" &&
                      "Kunjungan Telah Selesai. Terima Kasih!"}
                    {currentTicket.status === "Batal" &&
                      "Kunjungan Dibatalkan / Dijadwalkan Ulang."}
                  </p>
                  {currentTicket.catatan_disposisi_kadis && (
                    <p className="text-xs font-semibold bg-white/80 px-3 py-2 rounded-xl border border-indigo-200 mt-1">
                      Instruksi / Catatan Pejabat:{" "}
                      <span className="text-indigo-900">
                        {currentTicket.catatan_disposisi_kadis}
                      </span>
                    </p>
                  )}
                </div>

                {currentTicket.status === "Selesai" ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/skm?tiket=${encodeURIComponent(
                          currentTicket.kode_tiket
                        )}`
                      )
                    }
                    className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#F59E0B] hover:bg-amber-400 text-[#0F2C59] font-extrabold text-sm shadow-lg animate-bounce"
                  >
                    <ClipboardCheck className="w-5 h-5" />
                    <span>Isi Survei SKM Sekarang</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateStatusKunjungan(currentTicket.id, "Selesai");
                      router.push(
                        `/skm?tiket=${encodeURIComponent(
                          currentTicket.kode_tiket
                        )}`
                      );
                    }}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Check-Out Mandiri &amp; Isi SKM</span>
                  </button>
                )}
              </div>

              {/* Ticket Body */}
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
                      <p className="text-xs text-slate-600 font-medium">
                        {currentTicket.instansi_asal} &bull; NIK/NIP:{" "}
                        {currentTicket.nik_nip}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">
                        Bidang / Unit Tujuan
                      </p>
                      <p className="font-bold text-[#0F2C59] text-sm mt-0.5">
                        {ticketBidang?.nama_bidang || "-"}
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Pejabat: {ticketBidang?.kepala_bidang || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">
                        Lokasi Ruangan &amp; Waktu Check-In
                      </p>
                      <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1E40AF]" />
                        <span>{ticketBidang?.lokasi_ruangan || "-"}</span>
                      </p>
                      <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(currentTicket.waktu_masuk).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </p>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">
                        Keperluan Kunjungan
                      </p>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {currentTicket.keperluan}
                      </p>
                    </div>
                  </div>

                  {waSentInfo && (
                    <p className="text-[11px] text-slate-500 italic">
                      Status Notifikasi WA: {waSentInfo}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5">
                    <a
                      href={getDirectWaUrl(
                        currentTicket.no_wa,
                        buildTicketWaMessage(currentTicket, ticketBidang)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      <MessageSquareShare className="w-4 h-4" />
                      <span>Kirim E-Ticket ke WhatsApp Saya</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveTab("form")}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                    >
                      + Registrasi Tamu Lainnya
                    </button>
                  </div>
                </div>

                {/* QR Ticket Code */}
                <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <QRCodeSVG
                      value={currentTicket.kode_tiket}
                      size={140}
                      fgColor="#0F2C59"
                      level="M"
                    />
                  </div>
                  <p className="font-mono font-extrabold text-sm text-[#0F2C59] mt-2">
                    {currentTicket.kode_tiket}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tunjukkan QR ini kepada Resepsionis Lobi atau Admin Bidang
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortalTamuPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-8 text-center text-sm text-slate-500">
          Memuat Portal Tamu Digital Dikbud Kendari...
        </div>
      }
    >
      <PortalTamuContent />
    </Suspense>
  );
}
