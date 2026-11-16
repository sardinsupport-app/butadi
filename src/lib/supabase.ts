import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Bidang, Kunjungan, SkmResponse } from "@/types/butadi";

const LS_SUPABASE_URL = "butadi_supabase_url";
const LS_SUPABASE_KEY = "butadi_supabase_anon_key";

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: "env" | "browser" | "none";
} {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (
    envUrl &&
    envKey &&
    !envUrl.includes("your-project-id") &&
    !envKey.includes("your-supabase-anon-key")
  ) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: "env",
    };
  }

  if (typeof window !== "undefined") {
    const lsUrl = localStorage.getItem(LS_SUPABASE_URL)?.trim() || "";
    const lsKey = localStorage.getItem(LS_SUPABASE_KEY)?.trim() || "";
    if (lsUrl && lsKey && lsUrl.startsWith("http")) {
      return {
        url: lsUrl,
        anonKey: lsKey,
        isConfigured: true,
        source: "browser",
      };
    }
  }

  return {
    url: "",
    anonKey: "",
    isConfigured: false,
    source: "none",
  };
}

export function saveBrowserSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === "undefined") return;
  if (!url.trim() || !anonKey.trim()) {
    localStorage.removeItem(LS_SUPABASE_URL);
    localStorage.removeItem(LS_SUPABASE_KEY);
  } else {
    localStorage.setItem(LS_SUPABASE_URL, url.trim());
    localStorage.setItem(LS_SUPABASE_KEY, anonKey.trim());
  }
  cachedClient = null;
  cachedConfigKey = "";
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const key = `${url}::${anonKey}`;
  if (cachedClient && cachedConfigKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    cachedConfigKey = key;
    return cachedClient;
  } catch {
    return null;
  }
}

export const INITIAL_BIDANG_SEED: Bidang[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    nama_bidang: "Kepala Dinas",
    kepala_bidang: "Hj. Saemina, S.Pd., M.Pd.",
    nip_pejabat: "19680512 199303 2 008",
    lokasi_ruangan: "Lantai 2 - Ruang Utama Kepala Dinas",
    status_pejabat: "Tersedia",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    nama_bidang: "Sekretariat (Umum, Kepegawaian & Perencanaan)",
    kepala_bidang: "Drs. H. La Ode Muh. Izat, M.Si.",
    nip_pejabat: "19710410 199703 1 004",
    lokasi_ruangan: "Lantai 1 - Sayap Kanan (Ruang Sekretariat)",
    status_pejabat: "Tersedia",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    nama_bidang: "Bidang Pembinaan GTK (Guru & Tenaga Kependidikan)",
    kepala_bidang: "La Ode Halidin, S.Pd., M.M.",
    nip_pejabat: "19750819 200012 1 002",
    lokasi_ruangan: "Lantai 1 - Sayap Kiri (Ruang GTK)",
    status_pejabat: "Tersedia",
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    nama_bidang: "Bidang Pembinaan Sekolah Dasar (SD)",
    kepala_bidang: "Hj. Wa Ode Nurhasanah, S.Pd., M.Pd.",
    nip_pejabat: "19731102 199802 2 005",
    lokasi_ruangan: "Lantai 2 - Sayap Kiri (Ruang Pembinaan SD)",
    status_pejabat: "Rapat",
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    nama_bidang: "Bidang Pembinaan SMP",
    kepala_bidang: "Muh. Syahrir, S.Pd., M.Pd.",
    nip_pejabat: "19760322 200212 1 006",
    lokasi_ruangan: "Lantai 2 - Sayap Kanan (Ruang Pembinaan SMP)",
    status_pejabat: "Tersedia",
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    nama_bidang: "Bidang Kebudayaan",
    kepala_bidang: "Andi Tenri Sangka, S.Sos., M.Hum.",
    nip_pejabat: "19780914 200502 2 003",
    lokasi_ruangan: "Gedung B - Lantai 1 (Ruang Kebudayaan)",
    status_pejabat: "Dinas Luar",
  },
];

export function getInitialKunjunganSeed(): Kunjungan[] {
  const today = new Date().toISOString().split("T")[0];
  const now = Date.now();
  return [
    {
      id: "22222222-2222-4222-8222-222222222201",
      kode_tiket: "BTD-KDI-001",
      tanggal: today,
      waktu_masuk: new Date(now - 120 * 60 * 1000).toISOString(),
      waktu_keluar: new Date(now - 75 * 60 * 1000).toISOString(),
      nik_nip: "198103152006041009",
      nama_tamu: "Drs. Muh. Ruslan, M.Pd.",
      instansi_asal: "SMP Negeri 1 Kendari",
      kategori_tamu: "Guru/Kepsek",
      no_wa: "081241234567",
      bidang_id: "11111111-1111-4111-8111-111111111103",
      keperluan:
        "Verifikasi berkas pengusulan Tunjangan Profesi Guru (TPG) Semester Ganjil",
      foto_url: null,
      status: "Selesai",
      catatan_disposisi_kadis: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      kode_tiket: "BTD-KDI-002",
      tanggal: today,
      waktu_masuk: new Date(now - 45 * 60 * 1000).toISOString(),
      waktu_keluar: null,
      nik_nip: "197906212005012014",
      nama_tamu: "Hj. Hasniati, S.Pd.",
      instansi_asal: "SD Negeri 2 Baruga",
      kategori_tamu: "Guru/Kepsek",
      no_wa: "085241889900",
      bidang_id: "11111111-1111-4111-8111-111111111101",
      keperluan:
        "Audiensi persiapan Lomba Sekolah Sehat Tingkat Provinsi Sultra & penandatanganan MoU komite",
      foto_url: null,
      status: "Menunggu",
      catatan_disposisi_kadis: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222203",
      kode_tiket: "BTD-KDI-003",
      tanggal: today,
      waktu_masuk: new Date(now - 25 * 60 * 1000).toISOString(),
      waktu_keluar: null,
      nik_nip: "7471081209880002",
      nama_tamu: "Irwan Saputra, S.T.",
      instansi_asal: "Orang Tua Siswa (Kec. Kadia)",
      kategori_tamu: "Umum",
      no_wa: "082187654321",
      bidang_id: "11111111-1111-4111-8111-111111111105",
      keperluan:
        "Konsultasi mutasi siswa pindah rayon masuk ke SMP Negeri 9 Kendari",
      foto_url: null,
      status: "Dilayani",
      catatan_disposisi_kadis: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222204",
      kode_tiket: "BTD-KDI-004",
      tanggal: today,
      waktu_masuk: new Date(now - 15 * 60 * 1000).toISOString(),
      waktu_keluar: null,
      nik_nip: "198411102010011005",
      nama_tamu: "La Ode Hasanuddin, S.Sn., M.Pd.",
      instansi_asal: "Sanggar Seni Kalosara Kendari",
      kategori_tamu: "Instansi",
      no_wa: "081340556677",
      bidang_id: "11111111-1111-4111-8111-111111111101",
      keperluan:
        "Koordinasi Festival Budaya Lulo & Pameran Cagar Budaya Kota Kendari",
      foto_url: null,
      status: "Menunggu",
      catatan_disposisi_kadis: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222205",
      kode_tiket: "BTD-KDI-005",
      tanggal: today,
      waktu_masuk: new Date(now - 180 * 60 * 1000).toISOString(),
      waktu_keluar: new Date(now - 140 * 60 * 1000).toISOString(),
      nik_nip: "198207142008012011",
      nama_tamu: "Wa Ode Siti Aisyah, S.Pd.",
      instansi_asal: "SD Negeri 84 Kendari",
      kategori_tamu: "Guru/Kepsek",
      no_wa: "081341998877",
      bidang_id: "11111111-1111-4111-8111-111111111104",
      keperluan: "Pelaporan realisasi Dana BOS Tahap II dan sinkronisasi Dapodik",
      foto_url: null,
      status: "Selesai",
      catatan_disposisi_kadis: null,
    },
  ];
}

export function getInitialSkmSeed(): SkmResponse[] {
  const now = Date.now();
  return [
    {
      id: "33333333-3333-4333-8333-333333333301",
      kunjungan_id: "22222222-2222-4222-8222-222222222201",
      bidang_id: "11111111-1111-4111-8111-111111111103",
      u1_persyaratan: 4,
      u2_prosedur: 4,
      u3_waktu: 4,
      u4_biaya: 4,
      u5_produk: 4,
      u6_kompetensi: 4,
      u7_perilaku: 4,
      u8_sarpras: 3,
      u9_pengaduan: 4,
      saran_masukan:
        "Pelayanan di Bidang GTK sangat cepat, ramah, dan sekarang pakai sistem tiket digital jadi lebih tertib tanpa antre lama.",
      created_at: new Date(now - 70 * 60 * 1000).toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      kunjungan_id: "22222222-2222-4222-8222-222222222205",
      bidang_id: "11111111-1111-4111-8111-111111111104",
      u1_persyaratan: 4,
      u2_prosedur: 3,
      u3_waktu: 4,
      u4_biaya: 4,
      u5_produk: 4,
      u6_kompetensi: 4,
      u7_perilaku: 4,
      u8_sarpras: 4,
      u9_pengaduan: 3,
      saran_masukan:
        "Ruang tunggu lobi nyaman dan petugas resepsionis sangat membantu mengarahkan ke ruang Pembinaan SD.",
      created_at: new Date(now - 135 * 60 * 1000).toISOString(),
    },
  ];
}
