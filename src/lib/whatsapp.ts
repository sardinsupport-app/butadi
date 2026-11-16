import { Bidang, Kunjungan } from "@/types/butadi";

export function normalizeWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

export function buildTicketWaMessage(
  kunjungan: Kunjungan,
  bidang?: Bidang,
  baseUrl?: string
): string {
  const origin =
    baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const trackUrl = `${origin}/tamu?tiket=${encodeURIComponent(
    kunjungan.kode_tiket
  )}`;

  return [
    `*TIKET ANTREAN DIGITAL - BUTADI*`,
    `*Dinas Pendidikan & Kebudayaan Kota Kendari*`,
    `----------------------------------------`,
    `Halo Bapak/Ibu *${kunjungan.nama_tamu}*,`,
    `Registrasi buku tamu Anda telah berhasil dicatat:`,
    ``,
    `• *Kode Tiket:* ${kunjungan.kode_tiket}`,
    `• *Asal/Instansi:* ${kunjungan.instansi_asal}`,
    `• *Tujuan:* ${bidang?.nama_bidang || "-"}`,
    `• *Lokasi:* ${bidang?.lokasi_ruangan || "-"}`,
    `• *Status Saat Ini:* *${kunjungan.status.toUpperCase()}*`,
    kunjungan.catatan_disposisi_kadis
      ? `• *Catatan Disposisi:* _${kunjungan.catatan_disposisi_kadis}_`
      : "",
    ``,
    `Pantau status panggilan antrean Anda secara real-time melalui tautan berikut:`,
    trackUrl,
    ``,
    `_Terima kasih atas kunjungan Anda. Pelayanan Cepat, Transparan & Akuntabel._`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSkmWaMessage(
  kunjungan: Kunjungan,
  bidang?: Bidang,
  baseUrl?: string
): string {
  const origin =
    baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const skmUrl = `${origin}/skm?tiket=${encodeURIComponent(
    kunjungan.kode_tiket
  )}`;

  return [
    `*SURVEI KEPUASAN MASYARAKAT (SKM) - BUTADI*`,
    `*Dinas Pendidikan & Kebudayaan Kota Kendari*`,
    `----------------------------------------`,
    `Yth. Bapak/Ibu *${kunjungan.nama_tamu}*,`,
    `Terima kasih telah berkunjung ke *${
      bidang?.nama_bidang || "Dikbud Kota Kendari"
    }* pada hari ini.`,
    ``,
    `Mohon kesediaan waktu Anda (< 1 menit) untuk mengisi *Survei Kepuasan Masyarakat (SKM)* guna peningkatan mutu pelayanan kami melalui tautan berikut:`,
    skmUrl,
    ``,
    `• *Kode Tiket:* ${kunjungan.kode_tiket}`,
    ``,
    `_Masukan Anda sangat berharga bagi kemajuan layanan pendidikan & kebudayaan di Kota Kendari._`,
  ].join("\n");
}

export function getDirectWaUrl(phone: string, message: string): string {
  const normalized = normalizeWaNumber(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Mengirim pesan WhatsApp otomatis via Fonnte Gateway API jika token tersedia.
 * Mengembalikan status pengiriman.
 */
export async function sendFonnteWhatsApp(
  phone: string,
  message: string,
  customToken?: string
): Promise<{ ok: boolean; info: string }> {
  const token =
    customToken ||
    process.env.NEXT_PUBLIC_FONNTE_TOKEN ||
    (typeof window !== "undefined"
      ? localStorage.getItem("butadi_fonnte_token") || ""
      : "");

  if (!token) {
    return {
      ok: false,
      info: "Token Fonnte belum diatur (menggunakan tautan WA langsung)",
    };
  }

  try {
    const formData = new FormData();
    formData.append("target", normalizeWaNumber(phone));
    formData.append("message", message);
    formData.append("countryCode", "62");

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: formData,
    });
    const data = await res.json();
    if (data && data.status) {
      return { ok: true, info: "Pesan WA otomatis terkirim via Fonnte" };
    }
    return {
      ok: false,
      info: data?.reason || "Gagal mengirim via Fonnte API",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, info: msg };
  }
}
