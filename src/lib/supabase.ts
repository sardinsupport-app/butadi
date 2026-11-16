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
