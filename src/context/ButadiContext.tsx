"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bidang,
  KategoriTamu,
  KategoriTamuSekolah,
  Kunjungan,
  KunjunganSekolah,
  Sekolah,
  SkmResponse,
  StatusKunjungan,
  StatusKunjunganSekolah,
  StatusPejabat,
} from "@/types/butadi";
import {
  DEFAULT_UNIT_LAYANAN_SEKOLAH,
  getInitialKunjunganSeed,
  getInitialKunjunganSekolahSeed,
  getInitialSkmSeed,
  getSupabaseClient,
  getSupabaseConfig,
  INITIAL_BIDANG_SEED,
  INITIAL_SEKOLAH_SEED,
  saveBrowserSupabaseConfig,
} from "@/lib/supabase";
import { playNotificationBell } from "@/lib/sound";

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
}

interface CreateKunjunganInput {
  nik_nip: string;
  nama_tamu: string;
  instansi_asal: string;
  kategori_tamu: KategoriTamu;
  no_wa: string;
  bidang_id: string;
  keperluan: string;
  foto_url: string | null;
}

export interface CreateKunjunganSekolahInput {
  sekolah_id: string;
  npsn: string;
  nik_nip: string;
  nama_tamu: string;
  instansi_asal: string;
  kategori_tamu: KategoriTamuSekolah;
  no_wa: string;
  tujuan_unit: string;
  keperluan: string;
  foto_url: string | null;
}

interface SubmitSkmInput {
  kunjungan_id?: string | null;
  bidang_id: string;
  u1_persyaratan: number;
  u2_prosedur: number;
  u3_waktu: number;
  u4_biaya: number;
  u5_produk: number;
  u6_kompetensi: number;
  u7_perilaku: number;
  u8_sarpras: number;
  u9_pengaduan: number;
  saran_masukan: string;
}

interface ButadiContextValue {
  bidangList: Bidang[];
  kunjunganList: Kunjungan[];
  skmList: SkmResponse[];
  sekolahList: Sekolah[];
  kunjunganSekolahList: KunjunganSekolah[];
  isLoading: boolean;
  isSupabaseConnected: boolean;
  supabaseSource: "env" | "browser" | "none";
  supabaseError: string | null;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  toasts: ToastAlert[];
  dismissToast: (id: string) => void;
  refreshData: () => Promise<void>;
  createKunjungan: (input: CreateKunjunganInput) => Promise<Kunjungan>;
  updateStatusKunjungan: (
    id: string,
    status: StatusKunjungan,
    extra?: { bidang_id?: string; catatan_disposisi_kadis?: string | null }
  ) => Promise<Kunjungan | null>;
  deleteKunjungan: (id: string) => Promise<boolean>;
  deleteMultipleKunjungan: (ids: string[]) => Promise<boolean>;
  findVisitorByNikNip: (
    nikNip: string
  ) => Promise<Pick<
    Kunjungan,
    "nama_tamu" | "instansi_asal" | "kategori_tamu" | "no_wa"
  > | null>;
  updateStatusPejabat: (
    bidangId: string,
    status_pejabat: StatusPejabat
  ) => Promise<void>;
  saveBidang: (
    bidang: Omit<Bidang, "id"> & { id?: string }
  ) => Promise<Bidang>;
  deleteBidang: (id: string) => Promise<void>;
  submitSkm: (input: SubmitSkmInput) => Promise<SkmResponse>;
  // Operasi Ekosistem Sekolah
  createKunjunganSekolah: (
    input: CreateKunjunganSekolahInput
  ) => Promise<KunjunganSekolah>;
  updateStatusKunjunganSekolah: (
    id: string,
    status: StatusKunjunganSekolah,
    extra?: {
      catatan_sekolah?: string | null;
      nilai_kepuasan?: number | null;
      saran_masukan?: string | null;
    }
  ) => Promise<KunjunganSekolah | null>;
  deleteKunjunganSekolah: (id: string) => Promise<boolean>;
  deleteMultipleKunjunganSekolah: (ids: string[]) => Promise<boolean>;
  findVisitorSekolahByNikNip: (
    nikNip: string
  ) => Promise<Pick<
    KunjunganSekolah,
    "nama_tamu" | "instansi_asal" | "kategori_tamu" | "no_wa"
  > | null>;
  saveSekolah: (
    sekolah: Omit<Sekolah, "id"> & { id?: string }
  ) => Promise<Sekolah>;
  deleteSekolah: (id: string) => Promise<void>;
  configureSupabase: (url: string, anonKey: string) => Promise<boolean>;
  seedInitialDataToSupabase: () => Promise<{ ok: boolean; message: string }>;
}

const ButadiContext = createContext<ButadiContextValue | undefined>(undefined);

const LS_BIDANG = "butadi_data_bidang_v2";
const LS_KUNJUNGAN = "butadi_data_kunjungan_v2";
const LS_SKM = "butadi_data_skm_v2";
const LS_SEKOLAH = "butadi_data_sekolah_v2";
const LS_KUNJUNGAN_SEKOLAH = "butadi_data_kunjungan_sekolah_v2";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ButadiProvider({ children }: { children: React.ReactNode }) {
  const [bidangList, setBidangList] = useState<Bidang[]>(INITIAL_BIDANG_SEED);
  const [kunjunganList, setKunjunganList] = useState<Kunjungan[]>([]);
  const [skmList, setSkmList] = useState<SkmResponse[]>([]);
  const [sekolahList, setSekolahList] = useState<Sekolah[]>(INITIAL_SEKOLAH_SEED);
  const [kunjunganSekolahList, setKunjunganSekolahList] = useState<
    KunjunganSekolah[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] =
    useState<boolean>(false);
  const [supabaseSource, setSupabaseSource] = useState<
    "env" | "browser" | "none"
  >("none");
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const channelRef = useRef<BroadcastChannel | null>(null);

  const pushToast = useCallback(
    (
      title: string,
      message: string,
      type: "info" | "success" | "warning" = "info",
      ringBell = false
    ) => {
      const id = generateUUID();
      setToasts((prev) => [
        {
          id,
          title,
          message,
          type,
          timestamp: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev.slice(0, 4),
      ]);
      if (ringBell && soundEnabledRef.current) {
        playNotificationBell();
      }
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const persistLocal = useCallback(
    (
      b?: Bidang[],
      k?: Kunjungan[],
      s?: SkmResponse[],
      sek?: Sekolah[],
      kSek?: KunjunganSekolah[]
    ) => {
      if (typeof window === "undefined") return;
      if (b) localStorage.setItem(LS_BIDANG, JSON.stringify(b));
      if (k) localStorage.setItem(LS_KUNJUNGAN, JSON.stringify(k));
      if (s) localStorage.setItem(LS_SKM, JSON.stringify(s));
      if (sek) localStorage.setItem(LS_SEKOLAH, JSON.stringify(sek));
      if (kSek)
        localStorage.setItem(LS_KUNJUNGAN_SEKOLAH, JSON.stringify(kSek));
    },
    []
  );

  const loadFromLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const rawB = localStorage.getItem(LS_BIDANG);
      const rawK = localStorage.getItem(LS_KUNJUNGAN);
      const rawS = localStorage.getItem(LS_SKM);
      const rawSek = localStorage.getItem(LS_SEKOLAH);
      const rawKSek = localStorage.getItem(LS_KUNJUNGAN_SEKOLAH);

      const b = rawB ? (JSON.parse(rawB) as Bidang[]) : INITIAL_BIDANG_SEED;
      const k = rawK
        ? (JSON.parse(rawK) as Kunjungan[])
        : getInitialKunjunganSeed();
      const s = rawS ? (JSON.parse(rawS) as SkmResponse[]) : getInitialSkmSeed();
      const sek = rawSek
        ? (JSON.parse(rawSek) as Sekolah[])
        : INITIAL_SEKOLAH_SEED;
      const kSek = rawKSek
        ? (JSON.parse(rawKSek) as KunjunganSekolah[])
        : getInitialKunjunganSekolahSeed();

      setBidangList(b);
      setKunjunganList(k);
      setSkmList(s);
      setSekolahList(sek);
      setKunjunganSekolahList(kSek);

      if (!rawB || !rawK || !rawS || !rawSek || !rawKSek) {
        persistLocal(b, k, s, sek, kSek);
      }
    } catch {
      setBidangList(INITIAL_BIDANG_SEED);
      setKunjunganList(getInitialKunjunganSeed());
      setSkmList(getInitialSkmSeed());
      setSekolahList(INITIAL_SEKOLAH_SEED);
      setKunjunganSekolahList(getInitialKunjunganSekolahSeed());
    }
  }, [persistLocal]);

  const refreshData = useCallback(async () => {
    const cfg = getSupabaseConfig();
    setSupabaseSource(cfg.source);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsSupabaseConnected(false);
      setSupabaseError(null);
      loadFromLocal();
      setIsLoading(false);
      return;
    }

    try {
      const [
        resBidang,
        resKunjungan,
        resSkm,
        resSekolah,
        resKunjunganSekolah,
      ] = await Promise.all([
        supabase
          .from("bidang")
          .select("*")
          .order("nama_bidang", { ascending: true }),
        supabase
          .from("kunjungan")
          .select("*")
          .order("waktu_masuk", { ascending: false }),
        supabase
          .from("skm_responses")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("sekolah")
          .select("*")
          .order("nama_sekolah", { ascending: true }),
        supabase
          .from("kunjungan_sekolah")
          .select("*")
          .order("waktu_masuk", { ascending: false }),
      ]);

      if (resBidang.error) throw resBidang.error;
      if (resKunjungan.error) throw resKunjungan.error;
      if (resSkm.error) throw resSkm.error;

      let finalBidang = (resBidang.data || []) as Bidang[];
      if (finalBidang.length === 0) {
        const { data: seededB } = await supabase
          .from("bidang")
          .upsert(INITIAL_BIDANG_SEED)
          .select("*");
        if (seededB && seededB.length > 0) {
          finalBidang = seededB as Bidang[];
        } else {
          finalBidang = INITIAL_BIDANG_SEED;
        }
      }

      const finalKunjungan = (resKunjungan.data || []) as Kunjungan[];
      const finalSkm = (resSkm.data || []) as SkmResponse[];

      let finalSekolah = (resSekolah.data || []) as Sekolah[];
      if (!resSekolah.error && finalSekolah.length === 0) {
        const { data: seededSek } = await supabase
          .from("sekolah")
          .upsert(INITIAL_SEKOLAH_SEED, { onConflict: "npsn" })
          .select("*");
        if (seededSek && seededSek.length > 0) {
          finalSekolah = seededSek as Sekolah[];
        } else {
          finalSekolah = INITIAL_SEKOLAH_SEED;
        }
      } else if (resSekolah.error) {
        finalSekolah = INITIAL_SEKOLAH_SEED;
      }

      const finalKunjunganSekolah = !resKunjunganSekolah.error
        ? ((resKunjunganSekolah.data || []) as KunjunganSekolah[])
        : [];

      setBidangList(finalBidang);
      setKunjunganList(finalKunjungan);
      setSkmList(finalSkm);
      setSekolahList(finalSekolah);
      setKunjunganSekolahList(finalKunjunganSekolah);
      persistLocal(
        finalBidang,
        finalKunjungan,
        finalSkm,
        finalSekolah,
        finalKunjunganSekolah
      );

      setIsSupabaseConnected(true);
      setSupabaseError(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal terhubung ke tabel Supabase (Pastikan supabase/schema.sql sudah dijalankan)";
      setIsSupabaseConnected(false);
      setSupabaseError(msg);
      loadFromLocal();
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocal, persistLocal]);

  // Setup Realtime Subscriptions (Supabase + BroadcastChannel across tabs)
  useEffect(() => {
    refreshData();

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("butadi_realtime_sync");
      bc.onmessage = (ev) => {
        const { type, title, message, ring } = ev.data || {};
        if (type === "SYNC") {
          refreshData();
          if (title && message) {
            pushToast(title, message, "info", Boolean(ring));
          }
        }
      };
      channelRef.current = bc;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return () => {
        channelRef.current?.close();
      };
    }

    const realtimeChannel = supabase
      .channel("butadi-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kunjungan" },
        (payload) => {
          refreshData();
          if (payload.eventType === "INSERT") {
            const baru = payload.new as Kunjungan;
            pushToast(
              "Tamu Baru Check-In (Kantor Dinas)!",
              `${baru.nama_tamu} (${baru.instansi_asal}) - Tiket ${baru.kode_tiket}`,
              "info",
              true
            );
          } else if (payload.eventType === "UPDATE") {
            const upd = payload.new as Kunjungan;
            pushToast(
              `Status Tiket ${upd.kode_tiket} Diperbarui`,
              `${upd.nama_tamu} -> Status: ${upd.status}`,
              "success",
              true
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bidang" },
        () => {
          refreshData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "skm_responses" },
        () => {
          refreshData();
          pushToast(
            "Survei SKM Baru Masuk!",
            "Indeks Kepuasan Masyarakat (IKM) telah diperbarui secara real-time.",
            "success",
            true
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sekolah" },
        () => {
          refreshData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kunjungan_sekolah" },
        (payload) => {
          refreshData();
          if (payload.eventType === "INSERT") {
            const baru = payload.new as KunjunganSekolah;
            pushToast(
              "Tamu Baru di Sekolah!",
              `${baru.nama_tamu} - Tiket ${baru.kode_tiket}`,
              "info",
              true
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
      channelRef.current?.close();
    };
  }, [refreshData, pushToast]);

  const broadcastSync = useCallback(
    (title?: string, message?: string, ring = false) => {
      channelRef.current?.postMessage({
        type: "SYNC",
        title,
        message,
        ring,
      });
    },
    []
  );

  const createKunjungan = useCallback(
    async (input: CreateKunjunganInput): Promise<Kunjungan> => {
      const today = new Date().toISOString().split("T")[0];
      const countToday =
        kunjunganList.filter((k) => k.tanggal === today).length + 1;
      const padded = String(countToday).padStart(3, "0");
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const kode_tiket = `BTD-KDI-${padded}${randomSuffix}`;

      const newEntry: Kunjungan = {
        id: generateUUID(),
        kode_tiket,
        tanggal: today,
        waktu_masuk: new Date().toISOString(),
        waktu_keluar: null,
        nik_nip: input.nik_nip.trim(),
        nama_tamu: input.nama_tamu.trim(),
        instansi_asal: input.instansi_asal.trim(),
        kategori_tamu: input.kategori_tamu,
        no_wa: input.no_wa.trim(),
        bidang_id: input.bidang_id,
        keperluan: input.keperluan.trim(),
        foto_url: input.foto_url,
        status: "Menunggu",
        catatan_disposisi_kadis: null,
      };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data, error } = await supabase
          .from("kunjungan")
          .insert([newEntry])
          .select("*")
          .single();
        if (!error && data) {
          const saved = data as Kunjungan;
          setKunjunganList((prev) => {
            const next = [saved, ...prev.filter((x) => x.id !== saved.id)];
            persistLocal(undefined, next, undefined);
            return next;
          });
          broadcastSync(
            "Tamu Baru Check-In!",
            `${saved.nama_tamu} (${saved.instansi_asal}) - Tiket ${saved.kode_tiket}`,
            true
          );
          return saved;
        }
      }

      // Fallback / Local persistence
      setKunjunganList((prev) => {
        const next = [newEntry, ...prev];
        persistLocal(undefined, next, undefined);
        return next;
      });
      pushToast(
        "Tiket Kunjungan Dibuat",
        `${newEntry.kode_tiket} - ${newEntry.nama_tamu}`,
        "success",
        true
      );
      broadcastSync(
        "Tamu Baru Check-In!",
        `${newEntry.nama_tamu} (${newEntry.instansi_asal}) - Tiket ${newEntry.kode_tiket}`,
        true
      );
      return newEntry;
    },
    [kunjunganList, isSupabaseConnected, persistLocal, broadcastSync, pushToast]
  );

  const updateStatusKunjungan = useCallback(
    async (
      id: string,
      status: StatusKunjungan,
      extra?: { bidang_id?: string; catatan_disposisi_kadis?: string | null }
    ): Promise<Kunjungan | null> => {
      const target = kunjunganList.find((k) => k.id === id);
      if (!target) return null;

      const waktu_keluar =
        status === "Selesai"
          ? new Date().toISOString()
          : target.waktu_keluar;

      const updatedFields: Partial<Kunjungan> = {
        status,
        waktu_keluar,
        ...(extra?.bidang_id ? { bidang_id: extra.bidang_id } : {}),
        ...(extra?.catatan_disposisi_kadis !== undefined
          ? { catatan_disposisi_kadis: extra.catatan_disposisi_kadis }
          : {}),
      };

      const updatedItem: Kunjungan = { ...target, ...updatedFields };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data, error } = await supabase
          .from("kunjungan")
          .update(updatedFields)
          .eq("id", id)
          .select("*")
          .single();

        if (!error && data) {
          const saved = data as Kunjungan;
          setKunjunganList((prev) => {
            const next = prev.map((k) => (k.id === id ? saved : k));
            persistLocal(undefined, next, undefined);
            return next;
          });
          broadcastSync(
            `Status Tiket ${saved.kode_tiket}`,
            `${saved.nama_tamu} -> ${saved.status}`,
            true
          );
          return saved;
        }
      }

      setKunjunganList((prev) => {
        const next = prev.map((k) => (k.id === id ? updatedItem : k));
        persistLocal(undefined, next, undefined);
        return next;
      });
      pushToast(
        `Status Diperbarui: ${updatedItem.status}`,
        `Tiket ${updatedItem.kode_tiket} (${updatedItem.nama_tamu})`,
        "info",
        true
      );
      broadcastSync(
        `Status Tiket ${updatedItem.kode_tiket}`,
        `${updatedItem.nama_tamu} -> ${updatedItem.status}`,
        true
      );
      return updatedItem;
    },
    [kunjunganList, isSupabaseConnected, persistLocal, broadcastSync, pushToast]
  );

  const deleteKunjungan = useCallback(
    async (id: string): Promise<boolean> => {
      const target = kunjunganList.find((k) => k.id === id);
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        try {
          await supabase.from("skm_responses").delete().eq("kunjungan_id", id);
          const { error } = await supabase.from("kunjungan").delete().eq("id", id);
          if (error) {
            pushToast("Gagal Menghapus Data", error.message, "warning");
            return false;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
          pushToast("Gagal Menghapus Data", msg, "warning");
          return false;
        }
      }

      setKunjunganList((prev) => {
        const next = prev.filter((k) => k.id !== id);
        persistLocal(undefined, next, undefined);
        return next;
      });

      setSkmList((prev) => {
        const next = prev.filter((s) => s.kunjungan_id !== id);
        persistLocal(undefined, undefined, next);
        return next;
      });

      pushToast(
        "Data Kunjungan Berhasil Dihapus",
        target
          ? `Data ${target.nama_tamu} (${target.kode_tiket}) telah dihapus dari sistem.`
          : "Data kunjungan telah dihapus.",
        "info"
      );
      broadcastSync(
        "Data Kunjungan Dihapus",
        target ? `Tiket ${target.kode_tiket} telah dihapus` : "Data kunjungan dihapus",
        false
      );
      return true;
    },
    [kunjunganList, isSupabaseConnected, persistLocal, broadcastSync, pushToast]
  );

  const deleteMultipleKunjungan = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!ids || ids.length === 0) return false;
      const idSet = new Set(ids);
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        try {
          await supabase
            .from("skm_responses")
            .delete()
            .in("kunjungan_id", ids);
          const { error } = await supabase
            .from("kunjungan")
            .delete()
            .in("id", ids);
          if (error) {
            pushToast("Gagal Menghapus Data", error.message, "warning");
            return false;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
          pushToast("Gagal Menghapus Data", msg, "warning");
          return false;
        }
      }

      setKunjunganList((prev) => {
        const next = prev.filter((k) => !idSet.has(k.id));
        persistLocal(undefined, next, undefined);
        return next;
      });

      setSkmList((prev) => {
        const next = prev.filter(
          (s) => !s.kunjungan_id || !idSet.has(s.kunjungan_id)
        );
        persistLocal(undefined, undefined, next);
        return next;
      });

      pushToast(
        "Data Kunjungan Berhasil Dihapus",
        `${ids.length} data kunjungan tamu telah dihapus dari sistem.`,
        "info"
      );
      broadcastSync(
        "Data Kunjungan Dihapus",
        `${ids.length} data kunjungan dihapus`,
        false
      );
      return true;
    },
    [isSupabaseConnected, persistLocal, broadcastSync, pushToast]
  );

  const findVisitorByNikNip = useCallback(
    async (
      nikNip: string
    ): Promise<Pick<
      Kunjungan,
      "nama_tamu" | "instansi_asal" | "kategori_tamu" | "no_wa"
    > | null> => {
      const cleaned = nikNip.trim();
      if (cleaned.length < 5) return null;

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data } = await supabase
          .from("kunjungan")
          .select("nama_tamu, instansi_asal, kategori_tamu, no_wa")
          .eq("nik_nip", cleaned)
          .order("waktu_masuk", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          return data as Pick<
            Kunjungan,
            "nama_tamu" | "instansi_asal" | "kategori_tamu" | "no_wa"
          >;
        }
      }

      const found = kunjunganList.find(
        (k) => k.nik_nip.trim().toLowerCase() === cleaned.toLowerCase()
      );
      if (!found) return null;
      return {
        nama_tamu: found.nama_tamu,
        instansi_asal: found.instansi_asal,
        kategori_tamu: found.kategori_tamu,
        no_wa: found.no_wa,
      };
    },
    [isSupabaseConnected, kunjunganList]
  );

  const updateStatusPejabat = useCallback(
    async (bidangId: string, status_pejabat: StatusPejabat) => {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        await supabase
          .from("bidang")
          .update({ status_pejabat })
          .eq("id", bidangId);
      }

      setBidangList((prev) => {
        const next = prev.map((b) =>
          b.id === bidangId ? { ...b, status_pejabat } : b
        );
        persistLocal(next, undefined, undefined);
        return next;
      });
      broadcastSync(
        "Status Pejabat Diperbarui",
        `Status kehadiran diubah menjadi ${status_pejabat}`,
        false
      );
    },
    [isSupabaseConnected, persistLocal, broadcastSync]
  );

  const saveBidang = useCallback(
    async (
      bidangInput: Omit<Bidang, "id"> & { id?: string }
    ): Promise<Bidang> => {
      const item: Bidang = {
        id: bidangInput.id || generateUUID(),
        nama_bidang: bidangInput.nama_bidang.trim(),
        kepala_bidang: bidangInput.kepala_bidang.trim(),
        nip_pejabat: bidangInput.nip_pejabat?.trim() || "",
        lokasi_ruangan: bidangInput.lokasi_ruangan.trim(),
        status_pejabat: bidangInput.status_pejabat,
      };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data, error } = await supabase
          .from("bidang")
          .upsert([item])
          .select("*")
          .single();
        if (!error && data) {
          const saved = data as Bidang;
          setBidangList((prev) => {
            const exists = prev.some((b) => b.id === saved.id);
            const next = exists
              ? prev.map((b) => (b.id === saved.id ? saved : b))
              : [...prev, saved];
            persistLocal(next, undefined, undefined);
            return next;
          });
          broadcastSync();
          return saved;
        }
      }

      setBidangList((prev) => {
        const exists = prev.some((b) => b.id === item.id);
        const next = exists
          ? prev.map((b) => (b.id === item.id ? item : b))
          : [...prev, item];
        persistLocal(next, undefined, undefined);
        return next;
      });
      broadcastSync();
      return item;
    },
    [isSupabaseConnected, persistLocal, broadcastSync]
  );

  const deleteBidang = useCallback(
    async (id: string) => {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        await supabase.from("bidang").delete().eq("id", id);
      }
      setBidangList((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persistLocal(next, undefined, undefined);
        return next;
      });
      broadcastSync();
    },
    [isSupabaseConnected, persistLocal, broadcastSync]
  );

  const submitSkm = useCallback(
    async (input: SubmitSkmInput): Promise<SkmResponse> => {
      const newSkm: SkmResponse = {
        id: generateUUID(),
        kunjungan_id: input.kunjungan_id || null,
        bidang_id: input.bidang_id,
        u1_persyaratan: input.u1_persyaratan,
        u2_prosedur: input.u2_prosedur,
        u3_waktu: input.u3_waktu,
        u4_biaya: input.u4_biaya,
        u5_produk: input.u5_produk,
        u6_kompetensi: input.u6_kompetensi,
        u7_perilaku: input.u7_perilaku,
        u8_sarpras: input.u8_sarpras,
        u9_pengaduan: input.u9_pengaduan,
        saran_masukan: input.saran_masukan.trim() || null,
        created_at: new Date().toISOString(),
      };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const query = input.kunjungan_id
          ? supabase
              .from("skm_responses")
              .upsert([newSkm], { onConflict: "kunjungan_id" })
              .select("*")
              .single()
          : supabase
              .from("skm_responses")
              .insert([newSkm])
              .select("*")
              .single();

        const { data, error } = await query;

        if (!error && data) {
          const saved = data as SkmResponse;
          setSkmList((prev) => {
            const next = [
              saved,
              ...prev.filter((s) => s.kunjungan_id !== saved.kunjungan_id),
            ];
            persistLocal(undefined, undefined, next);
            return next;
          });
          broadcastSync(
            "Survei SKM Baru Masuk!",
            "Skor IKM Dikbud Kendari otomatis diperbarui.",
            true
          );
          return saved;
        }
      }

      setSkmList((prev) => {
        const next = [
          newSkm,
          ...prev.filter((s) => s.kunjungan_id !== newSkm.kunjungan_id),
        ];
        persistLocal(undefined, undefined, next);
        return next;
      });
      pushToast(
        "Terima Kasih atas Penilaian Anda!",
        "Data SKM telah masuk ke Dashboard Real-Time Dikbud Kendari.",
        "success",
        true
      );
      broadcastSync(
        "Survei SKM Baru Masuk!",
        "Skor IKM Dikbud Kendari otomatis diperbarui.",
        true
      );
      return newSkm;
    },
    [isSupabaseConnected, persistLocal, broadcastSync, pushToast]
  );

  // ==========================================================================
  // OPERASI EKOSISTEM BUKU TAMU SEKOLAH SE-KOTA KENDARI
  // ==========================================================================

  const createKunjunganSekolah = useCallback(
    async (input: CreateKunjunganSekolahInput): Promise<KunjunganSekolah> => {
      const today = new Date().toISOString().split("T")[0];
      const countToday =
        kunjunganSekolahList.filter(
          (k) => k.sekolah_id === input.sekolah_id && k.tanggal === today
        ).length + 1;
      const padded = String(countToday).padStart(3, "0");
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const kode_tiket = `BTD-${input.npsn}-${padded}${randomSuffix}`;

      const newEntry: KunjunganSekolah = {
        id: generateUUID(),
        sekolah_id: input.sekolah_id,
        kode_tiket,
        tanggal: today,
        waktu_masuk: new Date().toISOString(),
        waktu_keluar: null,
        nik_nip: input.nik_nip.trim(),
        nama_tamu: input.nama_tamu.trim(),
        instansi_asal: input.instansi_asal.trim(),
        kategori_tamu: input.kategori_tamu,
        no_wa: input.no_wa.trim(),
        tujuan_unit: input.tujuan_unit,
        keperluan: input.keperluan.trim(),
        foto_url: input.foto_url,
        status: "Menunggu",
        catatan_sekolah: null,
        nilai_kepuasan: null,
        saran_masukan: null,
      };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data, error } = await supabase
          .from("kunjungan_sekolah")
          .insert([newEntry])
          .select("*")
          .single();

        if (!error && data) {
          const saved = data as KunjunganSekolah;
          setKunjunganSekolahList((prev) => {
            const next = [saved, ...prev];
            persistLocal(undefined, undefined, undefined, undefined, next);
            return next;
          });
          broadcastSync(
            "Tamu Baru di Sekolah!",
            `${saved.nama_tamu} (${saved.kode_tiket})`,
            true
          );
          return saved;
        }
      }

      setKunjunganSekolahList((prev) => {
        const next = [newEntry, ...prev];
        persistLocal(undefined, undefined, undefined, undefined, next);
        return next;
      });
      pushToast(
        "Tiket Kunjungan Sekolah Terbit!",
        `${newEntry.nama_tamu} - Nomor Tiket: ${newEntry.kode_tiket}`,
        "success",
        true
      );
      broadcastSync(
        "Tamu Baru di Sekolah!",
        `${newEntry.nama_tamu} (${newEntry.kode_tiket})`,
        true
      );
      return newEntry;
    },
    [
      kunjunganSekolahList,
      isSupabaseConnected,
      persistLocal,
      broadcastSync,
      pushToast,
    ]
  );

  const updateStatusKunjunganSekolah = useCallback(
    async (
      id: string,
      status: StatusKunjunganSekolah,
      extra?: {
        catatan_sekolah?: string | null;
        nilai_kepuasan?: number | null;
        saran_masukan?: string | null;
      }
    ): Promise<KunjunganSekolah | null> => {
      const target = kunjunganSekolahList.find((k) => k.id === id);
      if (!target) return null;

      const waktu_keluar =
        status === "Selesai" ? new Date().toISOString() : target.waktu_keluar;

      const updatedFields: Partial<KunjunganSekolah> = {
        status,
        waktu_keluar,
        ...(extra?.catatan_sekolah !== undefined
          ? { catatan_sekolah: extra.catatan_sekolah }
          : {}),
        ...(extra?.nilai_kepuasan !== undefined
          ? { nilai_kepuasan: extra.nilai_kepuasan }
          : {}),
        ...(extra?.saran_masukan !== undefined
          ? { saran_masukan: extra.saran_masukan }
          : {}),
      };

      const updatedItem: KunjunganSekolah = { ...target, ...updatedFields };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data, error } = await supabase
          .from("kunjungan_sekolah")
          .update(updatedFields)
          .eq("id", id)
          .select("*")
          .single();

        if (!error && data) {
          const saved = data as KunjunganSekolah;
          setKunjunganSekolahList((prev) => {
            const next = prev.map((k) => (k.id === id ? saved : k));
            persistLocal(undefined, undefined, undefined, undefined, next);
            return next;
          });
          broadcastSync(
            `Status Tiket Sekolah ${saved.kode_tiket}`,
            `${saved.nama_tamu} -> ${saved.status}`,
            true
          );
          return saved;
        }
      }

      setKunjunganSekolahList((prev) => {
        const next = prev.map((k) => (k.id === id ? updatedItem : k));
        persistLocal(undefined, undefined, undefined, undefined, next);
        return next;
      });
      pushToast(
        `Status Diperbarui: ${updatedItem.status}`,
        `Tiket ${updatedItem.kode_tiket} (${updatedItem.nama_tamu})`,
        "info",
        true
      );
      broadcastSync(
        `Status Tiket Sekolah ${updatedItem.kode_tiket}`,
        `${updatedItem.nama_tamu} -> ${updatedItem.status}`,
        true
      );
      return updatedItem;
    },
    [
      kunjunganSekolahList,
      isSupabaseConnected,
      persistLocal,
      broadcastSync,
      pushToast,
    ]
  );

  const deleteKunjunganSekolah = useCallback(
    async (id: string): Promise<boolean> => {
      const target = kunjunganSekolahList.find((k) => k.id === id);
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        try {
          const { error } = await supabase
            .from("kunjungan_sekolah")
            .delete()
            .eq("id", id);
          if (error) {
            pushToast("Gagal Menghapus Data", error.message, "warning");
            return false;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
          pushToast("Gagal Menghapus Data", msg, "warning");
          return false;
        }
      }

      setKunjunganSekolahList((prev) => {
        const next = prev.filter((k) => k.id !== id);
        persistLocal(undefined, undefined, undefined, undefined, next);
        return next;
      });

      pushToast(
        "Data Tamu Sekolah Dihapus",
        target
          ? `Data ${target.nama_tamu} (${target.kode_tiket}) telah dihapus.`
          : "Data kunjungan sekolah telah dihapus.",
        "info"
      );
      broadcastSync(
        "Data Tamu Sekolah Dihapus",
        target ? `Tiket ${target.kode_tiket} dihapus` : "Data dihapus",
        false
      );
      return true;
    },
    [
      kunjunganSekolahList,
      isSupabaseConnected,
      persistLocal,
      broadcastSync,
      pushToast,
    ]
  );

  const deleteMultipleKunjunganSekolah = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!ids || ids.length === 0) return false;
      const idSet = new Set(ids);
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        try {
          const { error } = await supabase
            .from("kunjungan_sekolah")
            .delete()
            .in("id", ids);
          if (error) {
            pushToast("Gagal Menghapus Data", error.message, "warning");
            return false;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
          pushToast("Gagal Menghapus Data", msg, "warning");
          return false;
        }
      }

      setKunjunganSekolahList((prev) => {
        const next = prev.filter((k) => !idSet.has(k.id));
        persistLocal(undefined, undefined, undefined, undefined, next);
        return next;
      });

      pushToast(
        "Data Tamu Sekolah Dihapus",
        `${ids.length} data kunjungan sekolah berhasil dihapus.`,
        "info"
      );
      broadcastSync(
        "Data Tamu Sekolah Dihapus",
        `${ids.length} data kunjungan sekolah dihapus`,
        false
      );
      return true;
    },
    [isSupabaseConnected, persistLocal, broadcastSync, pushToast]
  );

  const findVisitorSekolahByNikNip = useCallback(
    async (
      nikNip: string
    ): Promise<Pick<
      KunjunganSekolah,
      "nama_tamu" | "instansi_asal" | "kategori_tamu" | "no_wa"
    > | null> => {
      const cleaned = nikNip.trim();
      if (cleaned.length < 5) return null;

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data } = await supabase
          .from("kunjungan_sekolah")
          .select("nama_tamu, instansi_asal, kategori_tamu, no_wa")
          .eq("nik_nip", cleaned)
          .order("waktu_masuk", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          return data as Pick<
            KunjunganSekolah,
            "nama_tamu" | "instansi_asal" | "kategori_tamu" | "no_wa"
          >;
        }
      }

      const foundLocal = kunjunganSekolahList.find(
        (k) => k.nik_nip.toLowerCase() === cleaned.toLowerCase()
      );
      if (foundLocal) {
        return {
          nama_tamu: foundLocal.nama_tamu,
          instansi_asal: foundLocal.instansi_asal,
          kategori_tamu: foundLocal.kategori_tamu,
          no_wa: foundLocal.no_wa,
        };
      }
      return null;
    },
    [isSupabaseConnected, kunjunganSekolahList]
  );

  const saveSekolah = useCallback(
    async (
      sekolahInput: Omit<Sekolah, "id"> & { id?: string }
    ): Promise<Sekolah> => {
      const item: Sekolah = {
        id: sekolahInput.id || generateUUID(),
        npsn: sekolahInput.npsn.trim(),
        nama_sekolah: sekolahInput.nama_sekolah.trim(),
        jenjang: sekolahInput.jenjang,
        kecamatan: sekolahInput.kecamatan.trim(),
        alamat: sekolahInput.alamat.trim(),
        kepala_sekolah: sekolahInput.kepala_sekolah.trim(),
        nip_kepsek: sekolahInput.nip_kepsek?.trim() || "",
        no_wa_sekolah: sekolahInput.no_wa_sekolah?.trim() || "",
        passcode: sekolahInput.passcode.trim() || "sekolah1010",
        status_kepsek: sekolahInput.status_kepsek || "Tersedia",
        unit_layanan:
          sekolahInput.unit_layanan && sekolahInput.unit_layanan.length > 0
            ? sekolahInput.unit_layanan
            : DEFAULT_UNIT_LAYANAN_SEKOLAH,
        aktif: sekolahInput.aktif ?? true,
      };

      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        const { data, error } = await supabase
          .from("sekolah")
          .upsert([item])
          .select("*")
          .single();
        if (!error && data) {
          const saved = data as Sekolah;
          setSekolahList((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            const next = exists
              ? prev.map((s) => (s.id === saved.id ? saved : s))
              : [...prev, saved];
            persistLocal(undefined, undefined, undefined, next, undefined);
            return next;
          });
          broadcastSync(
            "Data Sekolah Diperbarui",
            `${saved.nama_sekolah} (${saved.npsn})`,
            false
          );
          return saved;
        }
      }

      setSekolahList((prev) => {
        const exists = prev.some((s) => s.id === item.id);
        const next = exists
          ? prev.map((s) => (s.id === item.id ? item : s))
          : [...prev, item];
        persistLocal(undefined, undefined, undefined, next, undefined);
        return next;
      });
      broadcastSync(
        "Data Sekolah Diperbarui",
        `${item.nama_sekolah} (${item.npsn})`,
        false
      );
      return item;
    },
    [isSupabaseConnected, persistLocal, broadcastSync]
  );

  const deleteSekolah = useCallback(
    async (id: string) => {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConnected) {
        await supabase.from("sekolah").delete().eq("id", id);
      }
      setSekolahList((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistLocal(undefined, undefined, undefined, next, undefined);
        return next;
      });
      setKunjunganSekolahList((prev) => {
        const next = prev.filter((k) => k.sekolah_id !== id);
        persistLocal(undefined, undefined, undefined, undefined, next);
        return next;
      });
      broadcastSync();
    },
    [isSupabaseConnected, persistLocal, broadcastSync]
  );

  const configureSupabase = useCallback(
    async (url: string, anonKey: string): Promise<boolean> => {
      saveBrowserSupabaseConfig(url, anonKey);
      await refreshData();
      const client = getSupabaseClient();
      if (!client) return false;
      const { error } = await client.from("bidang").select("id").limit(1);
      if (error) {
        setSupabaseError(error.message);
        setIsSupabaseConnected(false);
        return false;
      }
      setIsSupabaseConnected(true);
      setSupabaseError(null);
      return true;
    },
    [refreshData]
  );

  const seedInitialDataToSupabase = useCallback(async (): Promise<{
    ok: boolean;
    message: string;
  }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        ok: false,
        message: "Kredensial Supabase URL & Anon Key belum dikonfigurasi.",
      };
    }

    try {
      const { error: errB } = await supabase
        .from("bidang")
        .upsert(INITIAL_BIDANG_SEED);
      if (errB) throw errB;

      await supabase
        .from("sekolah")
        .upsert(INITIAL_SEKOLAH_SEED, { onConflict: "npsn" });

      await refreshData();
      return {
        ok: true,
        message:
          "Berhasil mengunggah data master Bidang & Sekolah Dikbud Kendari ke Supabase!",
      };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal melakukan seed ke Supabase";
      return {
        ok: false,
        message: `Gagal: ${msg}. Pastikan Anda telah menjalankan supabase/schema.sql di SQL Editor Supabase.`,
      };
    }
  }, [refreshData]);

  return (
    <ButadiContext.Provider
      value={{
        bidangList,
        kunjunganList,
        skmList,
        sekolahList,
        kunjunganSekolahList,
        isLoading,
        isSupabaseConnected,
        supabaseSource,
        supabaseError,
        soundEnabled,
        setSoundEnabled,
        toasts,
        dismissToast,
        refreshData,
        createKunjungan,
        updateStatusKunjungan,
        deleteKunjungan,
        deleteMultipleKunjungan,
        findVisitorByNikNip,
        updateStatusPejabat,
        saveBidang,
        deleteBidang,
        submitSkm,
        createKunjunganSekolah,
        updateStatusKunjunganSekolah,
        deleteKunjunganSekolah,
        deleteMultipleKunjunganSekolah,
        findVisitorSekolahByNikNip,
        saveSekolah,
        deleteSekolah,
        configureSupabase,
        seedInitialDataToSupabase,
      }}
    >
      {children}
    </ButadiContext.Provider>
  );
}

export function useButadi() {
  const ctx = useContext(ButadiContext);
  if (!ctx) {
    throw new Error("useButadi harus digunakan di dalam ButadiProvider");
  }
  return ctx;
}
