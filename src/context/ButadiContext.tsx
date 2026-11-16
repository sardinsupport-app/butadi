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
  Kunjungan,
  SkmResponse,
  StatusKunjungan,
  StatusPejabat,
} from "@/types/butadi";
import {
  getInitialKunjunganSeed,
  getInitialSkmSeed,
  getSupabaseClient,
  getSupabaseConfig,
  INITIAL_BIDANG_SEED,
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

interface SubmitSkmInput {
  kunjungan_id: string;
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
  configureSupabase: (url: string, anonKey: string) => Promise<boolean>;
  seedInitialDataToSupabase: () => Promise<{ ok: boolean; message: string }>;
}

const ButadiContext = createContext<ButadiContextValue | undefined>(undefined);

const LS_BIDANG = "butadi_data_bidang_v1";
const LS_KUNJUNGAN = "butadi_data_kunjungan_v1";
const LS_SKM = "butadi_data_skm_v1";

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
    (b?: Bidang[], k?: Kunjungan[], s?: SkmResponse[]) => {
      if (typeof window === "undefined") return;
      if (b) localStorage.setItem(LS_BIDANG, JSON.stringify(b));
      if (k) localStorage.setItem(LS_KUNJUNGAN, JSON.stringify(k));
      if (s) localStorage.setItem(LS_SKM, JSON.stringify(s));
    },
    []
  );

  const loadFromLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const rawB = localStorage.getItem(LS_BIDANG);
      const rawK = localStorage.getItem(LS_KUNJUNGAN);
      const rawS = localStorage.getItem(LS_SKM);

      const b = rawB ? (JSON.parse(rawB) as Bidang[]) : INITIAL_BIDANG_SEED;
      const k = rawK
        ? (JSON.parse(rawK) as Kunjungan[])
        : getInitialKunjunganSeed();
      const s = rawS ? (JSON.parse(rawS) as SkmResponse[]) : getInitialSkmSeed();

      setBidangList(b);
      setKunjunganList(k);
      setSkmList(s);

      if (!rawB || !rawK || !rawS) {
        persistLocal(b, k, s);
      }
    } catch {
      setBidangList(INITIAL_BIDANG_SEED);
      setKunjunganList(getInitialKunjunganSeed());
      setSkmList(getInitialSkmSeed());
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
      const [resBidang, resKunjungan, resSkm] = await Promise.all([
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
      ]);

      if (resBidang.error) throw resBidang.error;
      if (resKunjungan.error) throw resKunjungan.error;
      if (resSkm.error) throw resSkm.error;

      let finalBidang = (resBidang.data || []) as Bidang[];
      if (finalBidang.length === 0) {
        // Auto-seed bidang if table is empty
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

      setBidangList(finalBidang);
      setKunjunganList(finalKunjungan);
      setSkmList(finalSkm);
      persistLocal(finalBidang, finalKunjungan, finalSkm);

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
              "Tamu Baru Check-In!",
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
        kunjungan_id: input.kunjungan_id,
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
        const { data, error } = await supabase
          .from("skm_responses")
          .upsert([newSkm], { onConflict: "kunjungan_id" })
          .select("*")
          .single();

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

      const { error: errK } = await supabase
        .from("kunjungan")
        .upsert(getInitialKunjunganSeed());
      if (errK) throw errK;

      const { error: errS } = await supabase
        .from("skm_responses")
        .upsert(getInitialSkmSeed());
      if (errS) throw errS;

      await refreshData();
      return {
        ok: true,
        message:
          "Berhasil mengunggah data awal Bidang, Kunjungan, dan SKM Dikbud Kendari ke Supabase!",
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
        findVisitorByNikNip,
        updateStatusPejabat,
        saveBidang,
        deleteBidang,
        submitSkm,
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
