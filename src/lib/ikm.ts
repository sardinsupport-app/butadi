import { SkmResponse, UnsurMetadata } from "@/types/butadi";

export const UNSUR_SKM_LIST: UnsurMetadata[] = [
  {
    key: "u1_persyaratan",
    kode: "U1",
    nama: "Persyaratan",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang kesesuaian persyaratan pelayanan dengan jenis pelayanannya di Dikbud Kendari?",
    opsi: [
      { nilai: 1, label: "Tidak Sesuai" },
      { nilai: 2, label: "Kurang Sesuai" },
      { nilai: 3, label: "Sesuai" },
      { nilai: 4, label: "Sangat Sesuai" },
    ],
  },
  {
    key: "u2_prosedur",
    kode: "U2",
    nama: "Sistem, Mekanisme, dan Prosedur",
    pertanyaan:
      "Bagaimana pemahaman Saudara tentang kemudahan prosedur pelayanan di unit ini?",
    opsi: [
      { nilai: 1, label: "Tidak Mudah" },
      { nilai: 2, label: "Kurang Mudah" },
      { nilai: 3, label: "Mudah" },
      { nilai: 4, label: "Sangat Mudah" },
    ],
  },
  {
    key: "u3_waktu",
    kode: "U3",
    nama: "Waktu Penyelesaian",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang kecepatan waktu dalam memberikan pelayanan?",
    opsi: [
      { nilai: 1, label: "Tidak Cepat" },
      { nilai: 2, label: "Kurang Cepat" },
      { nilai: 3, label: "Cepat" },
      { nilai: 4, label: "Sangat Cepat" },
    ],
  },
  {
    key: "u4_biaya",
    kode: "U4",
    nama: "Biaya / Tarif (Gratis)",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang kewajaran biaya/tarif (bebas pungutan/gratis) dalam pelayanan?",
    opsi: [
      { nilai: 1, label: "Sangat Mahal" },
      { nilai: 2, label: "Cukup Mahal" },
      { nilai: 3, label: "Murah" },
      { nilai: 4, label: "Gratis / Sesuai Aturan" },
    ],
  },
  {
    key: "u5_produk",
    kode: "U5",
    nama: "Produk Spesifikasi Jenis Pelayanan",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang kesesuaian produk pelayanan antara yang tercantum dalam standar pelayanan dengan hasil yang diberikan?",
    opsi: [
      { nilai: 1, label: "Tidak Sesuai" },
      { nilai: 2, label: "Kurang Sesuai" },
      { nilai: 3, label: "Sesuai" },
      { nilai: 4, label: "Sangat Sesuai" },
    ],
  },
  {
    key: "u6_kompetensi",
    kode: "U6",
    nama: "Kompetensi Pelaksana",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang kompetensi/kemampuan petugas dalam pelayanan?",
    opsi: [
      { nilai: 1, label: "Tidak Kompeten" },
      { nilai: 2, label: "Kurang Kompeten" },
      { nilai: 3, label: "Kompeten" },
      { nilai: 4, label: "Sangat Kompeten" },
    ],
  },
  {
    key: "u7_perilaku",
    kode: "U7",
    nama: "Perilaku Pelaksana",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang perilaku petugas dalam pelayanan terkait kesopanan dan keramahan?",
    opsi: [
      { nilai: 1, label: "Tidak Sopan & Ramah" },
      { nilai: 2, label: "Kurang Sopan & Ramah" },
      { nilai: 3, label: "Sopan & Ramah" },
      { nilai: 4, label: "Sangat Sopan & Ramah" },
    ],
  },
  {
    key: "u8_sarpras",
    kode: "U8",
    nama: "Sarana dan Prasarana",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang kualitas sarana dan prasarana ruang layanan Dikbud Kendari?",
    opsi: [
      { nilai: 1, label: "Buruk" },
      { nilai: 2, label: "Cukup" },
      { nilai: 3, label: "Baik" },
      { nilai: 4, label: "Sangat Baik" },
    ],
  },
  {
    key: "u9_pengaduan",
    kode: "U9",
    nama: "Penanganan Pengaduan, Saran & Masukan",
    pertanyaan:
      "Bagaimana pendapat Saudara tentang penanganan pengaduan, saran, dan masukan pengguna layanan?",
    opsi: [
      { nilai: 1, label: "Tidak Ada" },
      { nilai: 2, label: "Ada Tetapi Tidak Berfungsi" },
      { nilai: 3, label: "Berfungsi Kurang Maksimal" },
      { nilai: 4, label: "Dikelola dengan Baik" },
    ],
  },
];

export interface IkmSummary {
  totalResponden: number;
  nilaiIkm: number; // Skala 25 - 100
  nilaiRataRata: number; // Skala 1 - 4
  mutuPelayanan: "A" | "B" | "C" | "D" | "-";
  kinerjaUnit: string;
  perUnsur: {
    kode: string;
    nama: string;
    nrr: number; // Skala 1 - 4
    konversi: number; // Skala 25 - 100
  }[];
}

/**
 * Perhitungan resmi Indeks Kepuasan Masyarakat (IKM) sesuai PermenPAN-RB No. 14 Tahun 2017
 */
export function calculateIKM(responses: SkmResponse[]): IkmSummary {
  if (!responses || responses.length === 0) {
    return {
      totalResponden: 0,
      nilaiIkm: 0,
      nilaiRataRata: 0,
      mutuPelayanan: "-",
      kinerjaUnit: "Belum Ada Data",
      perUnsur: UNSUR_SKM_LIST.map((u) => ({
        kode: u.kode,
        nama: u.nama,
        nrr: 0,
        konversi: 0,
      })),
    };
  }

  const n = responses.length;
  const bobotTertimbang = 1 / 9;

  let totalNrrTertimbang = 0;

  const perUnsur = UNSUR_SKM_LIST.map((u) => {
    const sum = responses.reduce((acc, r) => acc + (Number(r[u.key]) || 0), 0);
    const nrr = sum / n;
    const nrrTertimbang = nrr * bobotTertimbang;
    totalNrrTertimbang += nrrTertimbang;
    return {
      kode: u.kode,
      nama: u.nama,
      nrr: Number(nrr.toFixed(2)),
      konversi: Number((nrr * 25).toFixed(2)),
    };
  });

  const nilaiIkm = Number((totalNrrTertimbang * 25).toFixed(2));
  const nilaiRataRata = Number(totalNrrTertimbang.toFixed(2));

  let mutuPelayanan: "A" | "B" | "C" | "D" = "D";
  let kinerjaUnit = "Tidak Baik";

  if (nilaiIkm >= 88.31) {
    mutuPelayanan = "A";
    kinerjaUnit = "Sangat Baik";
  } else if (nilaiIkm >= 76.61) {
    mutuPelayanan = "B";
    kinerjaUnit = "Baik";
  } else if (nilaiIkm >= 65.0) {
    mutuPelayanan = "C";
    kinerjaUnit = "Kurang Baik";
  }

  return {
    totalResponden: n,
    nilaiIkm,
    nilaiRataRata,
    mutuPelayanan,
    kinerjaUnit,
    perUnsur,
  };
}
