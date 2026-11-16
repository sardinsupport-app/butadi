export type StatusPejabat = "Tersedia" | "Rapat" | "Dinas Luar";

export type RoleUser = "superadmin" | "resepsionis" | "admin_bidang" | "kadis";

export type KategoriTamu = "Guru/Kepsek" | "Umum" | "Instansi";

export type StatusKunjungan =
  | "Menunggu"
  | "Dilayani"
  | "Disposisi"
  | "Selesai"
  | "Batal";

export interface Bidang {
  id: string;
  nama_bidang: string;
  kepala_bidang: string;
  nip_pejabat?: string;
  lokasi_ruangan: string;
  status_pejabat: StatusPejabat;
  created_at?: string;
}

export interface UserAccount {
  id: string;
  nama: string;
  nip: string;
  role: RoleUser;
  bidang_id: string | null;
}

export interface Kunjungan {
  id: string;
  kode_tiket: string;
  tanggal: string; // YYYY-MM-DD
  waktu_masuk: string; // ISO timestamp
  waktu_keluar: string | null;
  nik_nip: string;
  nama_tamu: string;
  instansi_asal: string;
  kategori_tamu: KategoriTamu;
  no_wa: string;
  bidang_id: string;
  keperluan: string;
  foto_url: string | null;
  status: StatusKunjungan;
  catatan_disposisi_kadis: string | null;
  created_at?: string;
}

export interface SkmResponse {
  id: string;
  kunjungan_id: string | null;
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
  saran_masukan: string | null;
  created_at: string;
}

export interface UnsurMetadata {
  key: keyof Pick<
    SkmResponse,
    | "u1_persyaratan"
    | "u2_prosedur"
    | "u3_waktu"
    | "u4_biaya"
    | "u5_produk"
    | "u6_kompetensi"
    | "u7_perilaku"
    | "u8_sarpras"
    | "u9_pengaduan"
  >;
  kode: string;
  nama: string;
  pertanyaan: string;
  opsi: { nilai: number; label: string }[];
}
