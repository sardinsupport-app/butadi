import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Bidang,
  Kunjungan,
  KunjunganSekolah,
  Sekolah,
  SkmResponse,
} from "@/types/butadi";

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
    status_pejabat: "Tersedia",
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
    status_pejabat: "Tersedia",
  },
];

export function getInitialKunjunganSeed(): Kunjungan[] {
  // Mode data riil: Tanpa data dummy/mockup
  return [];
}

export function getInitialSkmSeed(): SkmResponse[] {
  // Mode data riil: Tanpa data dummy/mockup
  return [];
}

export const KECAMATAN_KENDARI_LIST: string[] = [
  "Mandonga",
  "Baruga",
  "Puuwatu",
  "Kadia",
  "Wua-Wua",
  "Poasia",
  "Abeli",
  "Kambu",
  "Nambo",
  "Kendari",
  "Kendari Barat",
];

export const DEFAULT_UNIT_LAYANAN_SEKOLAH: string[] = [
  "Kepala Sekolah",
  "Tata Usaha / Operator Sekolah",
  "Wakil Kepala Sekolah",
  "Guru BK / Guru Piket",
  "Wali Kelas / Guru Mata Pelajaran",
  "Bendahara BOS / Komite Sekolah",
];

export const INITIAL_SEKOLAH_SEED: Sekolah[] = [
  {
    id: "44444444-4444-4444-8444-444444444401",
    npsn: "40402601",
    nama_sekolah: "SMP Negeri 1 Kendari",
    jenjang: "SMP",
    kecamatan: "Mandonga",
    alamat: "Jl. Jend. Ahmad Yani No. 17, Kota Kendari",
    kepala_sekolah: "Drs. Muh. Ruslan, M.Pd.",
    nip_kepsek: "19700512 199603 1 004",
    no_wa_sekolah: "08114001001",
    passcode: "smpn1kdi",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444402",
    npsn: "40402602",
    nama_sekolah: "SMP Negeri 2 Kendari",
    jenjang: "SMP",
    kecamatan: "Kendari Barat",
    alamat: "Jl. Sultan Hasanuddin No. 48, Tipulu, Kota Kendari",
    kepala_sekolah: "Hj. Sitti Maemunah, S.Pd., M.Pd.",
    nip_kepsek: "19720814 199802 2 003",
    no_wa_sekolah: "08114001002",
    passcode: "smpn2kdi",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444403",
    npsn: "40402609",
    nama_sekolah: "SMP Negeri 9 Kendari",
    jenjang: "SMP",
    kecamatan: "Kadia",
    alamat: "Jl. Sao-Sao, Bende, Kec. Kadia, Kota Kendari",
    kepala_sekolah: "Milwan, S.Pd., M.Pd.",
    nip_kepsek: "19741109 199903 1 005",
    no_wa_sekolah: "08114001009",
    passcode: "smpn9kdi",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444404",
    npsn: "40402604",
    nama_sekolah: "SMP Negeri 4 Kendari",
    jenjang: "SMP",
    kecamatan: "Wua-Wua",
    alamat: "Jl. Kijang No. 5, Rahandouna, Kota Kendari",
    kepala_sekolah: "La Ode Muh. Kurdin, S.Pd., M.Pd.",
    nip_kepsek: "19710321 199702 1 002",
    no_wa_sekolah: "08114001004",
    passcode: "smpn4kdi",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444405",
    npsn: "40402501",
    nama_sekolah: "SD Negeri 1 Kendari",
    jenjang: "SD",
    kecamatan: "Kendari",
    alamat: "Jl. Ir. H. Alala, Kandai, Kota Kendari",
    kepala_sekolah: "Hj. Hasniati, S.Pd., M.Pd.",
    nip_kepsek: "19750621 200012 2 004",
    no_wa_sekolah: "08114002001",
    passcode: "sdn1kdi",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444406",
    npsn: "40402502",
    nama_sekolah: "SD Negeri 2 Baruga",
    jenjang: "SD",
    kecamatan: "Baruga",
    alamat: "Jl. Brigjen M. Yoenoes, Lepo-Lepo, Kec. Baruga",
    kepala_sekolah: "Wa Ode Siti Aisyah, S.Pd.",
    nip_kepsek: "19780411 200312 2 007",
    no_wa_sekolah: "08114002002",
    passcode: "sdn2baruga",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444407",
    npsn: "40402584",
    nama_sekolah: "SD Negeri 84 Kendari",
    jenjang: "SD",
    kecamatan: "Kambu",
    alamat: "Jl. Martandu, Kambu, Kota Kendari",
    kepala_sekolah: "H. Abdul Rahim, S.Pd., M.M.",
    nip_kepsek: "19730918 199803 1 006",
    no_wa_sekolah: "08114002084",
    passcode: "sdn84kdi",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444408",
    npsn: "40402701",
    nama_sekolah: "TK Negeri Pembina Kota Kendari",
    jenjang: "TK/PAUD",
    kecamatan: "Kadia",
    alamat: "Jl. Balaikota III, Pondambea, Kec. Kadia, Kota Kendari",
    kepala_sekolah: "Hj. Nurhayati, S.Pd.AUD.",
    nip_kepsek: "19761205 200212 2 003",
    no_wa_sekolah: "08114003001",
    passcode: "tknpembina",
    status_kepsek: "Tersedia",
    unit_layanan: DEFAULT_UNIT_LAYANAN_SEKOLAH,
    aktif: true,
  },
];

export function getInitialKunjunganSekolahSeed(): KunjunganSekolah[] {
  // Mode data riil: Tanpa data dummy/mockup
  return [];
}
