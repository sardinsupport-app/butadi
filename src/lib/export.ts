import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Bidang, Kunjungan, SkmResponse } from "@/types/butadi";
import { calculateIKM } from "@/lib/ikm";

export function exportLaporanToPDF(
  kunjunganList: Kunjungan[],
  bidangList: Bidang[],
  skmList: SkmResponse[],
  periodeLabel: string
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const bidangMap = new Map(bidangList.map((b) => [b.id, b.nama_bidang]));
  const ikm = calculateIKM(skmList);

  // Header Kop Surat Pemerintah Kota Kendari
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PEMERINTAH KOTA KENDARI", 148.5, 14, { align: "center" });
  doc.setFontSize(15);
  doc.text("DINAS PENDIDIKAN DAN KEBUDAYAAN", 148.5, 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Jl. Balaikota III No. 44, Pondambea, Kec. Kadia, Kota Kendari, Sulawesi Tenggara 93117",
    148.5,
    25,
    { align: "center" }
  );
  doc.setLineWidth(0.6);
  doc.line(14, 28, 283, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `LAPORAN REKAPITULASI BUKU TAMU DIGITAL (BUTADI) & SKM`,
    148.5,
    35,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Periode: ${periodeLabel}   |   Total Tamu: ${kunjunganList.length}   |   Skor IKM: ${ikm.nilaiIkm} (Mutu ${ikm.mutuPelayanan} - ${ikm.kinerjaUnit})`,
    148.5,
    41,
    { align: "center" }
  );

  const tableRows = kunjunganList.map((k, idx) => [
    idx + 1,
    k.kode_tiket,
    new Date(k.waktu_masuk).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    `${k.nama_tamu}\n(${k.nik_nip})`,
    `${k.instansi_asal}\n[${k.kategori_tamu}]`,
    k.no_wa,
    bidangMap.get(k.bidang_id) || "-",
    k.keperluan,
    k.status,
  ]);

  autoTable(doc, {
    startY: 46,
    head: [
      [
        "No",
        "Tiket",
        "Waktu Masuk",
        "Nama & NIK/NIP",
        "Instansi / Kategori",
        "No. WA",
        "Bidang Tujuan",
        "Keperluan",
        "Status",
      ],
    ],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [15, 44, 89], // #0F2C59
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Tanda Tangan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = ((doc as any).lastAutoTable?.finalY || 140) + 12;
  const signY = finalY > 170 ? 25 : finalY;
  if (finalY > 170) {
    doc.addPage();
  }

  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(9.5);
  doc.text(`Kendari, ${tanggalCetak}`, 220, signY);
  doc.text("Kepala Dinas Pendidikan dan Kebudayaan", 220, signY + 5);
  doc.text("Kota Kendari,", 220, signY + 10);
  doc.setFont("helvetica", "bold");
  doc.text("Hj. Saemina, S.Pd., M.Pd.", 220, signY + 28);
  doc.setFont("helvetica", "normal");
  doc.text("NIP. 19680512 199303 2 008", 220, signY + 33);

  doc.save(
    `Laporan_BUTADI_Dikbud_Kendari_${new Date().toISOString().slice(0, 10)}.pdf`
  );
}

export function exportLaporanToExcel(
  kunjunganList: Kunjungan[],
  bidangList: Bidang[],
  skmList: SkmResponse[]
) {
  const bidangMap = new Map(bidangList.map((b) => [b.id, b.nama_bidang]));
  const kunjunganMap = new Map(kunjunganList.map((k) => [k.id, k]));

  const sheetKunjungan = kunjunganList.map((k, idx) => ({
    No: idx + 1,
    "Kode Tiket": k.kode_tiket,
    Tanggal: k.tanggal,
    "Waktu Masuk": new Date(k.waktu_masuk).toLocaleTimeString("id-ID"),
    "Waktu Keluar": k.waktu_keluar
      ? new Date(k.waktu_keluar).toLocaleTimeString("id-ID")
      : "-",
    "NIK / NIP": k.nik_nip,
    "Nama Tamu": k.nama_tamu,
    "Instansi / Sekolah Asal": k.instansi_asal,
    "Kategori Tamu": k.kategori_tamu,
    "Nomor WhatsApp": k.no_wa,
    "Bidang Tujuan": bidangMap.get(k.bidang_id) || "-",
    Keperluan: k.keperluan,
    Status: k.status,
    "Catatan Disposisi Kadis": k.catatan_disposisi_kadis || "-",
  }));

  const sheetSkm = skmList.map((s, idx) => {
    const k = kunjunganMap.get(s.kunjungan_id);
    const avg =
      (s.u1_persyaratan +
        s.u2_prosedur +
        s.u3_waktu +
        s.u4_biaya +
        s.u5_produk +
        s.u6_kompetensi +
        s.u7_perilaku +
        s.u8_sarpras +
        s.u9_pengaduan) /
      9;

    return {
      No: idx + 1,
      "Waktu Survei": new Date(s.created_at).toLocaleString("id-ID"),
      "Kode Tiket": k?.kode_tiket || "-",
      "Nama Responden": k?.nama_tamu || "Anonim",
      "Bidang Dilayani": bidangMap.get(s.bidang_id) || "-",
      "U1 Persyaratan": s.u1_persyaratan,
      "U2 Prosedur": s.u2_prosedur,
      "U3 Waktu": s.u3_waktu,
      "U4 Biaya": s.u4_biaya,
      "U5 Produk": s.u5_produk,
      "U6 Kompetensi": s.u6_kompetensi,
      "U7 Perilaku": s.u7_perilaku,
      "U8 Sarpras": s.u8_sarpras,
      "U9 Pengaduan": s.u9_pengaduan,
      "Rata-rata (1-4)": Number(avg.toFixed(2)),
      "Konversi IKM (25-100)": Number((avg * 25).toFixed(2)),
      "Saran & Masukan": s.saran_masukan || "-",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(sheetKunjungan);
  const ws2 = XLSX.utils.json_to_sheet(sheetSkm);

  XLSX.utils.book_append_sheet(wb, ws1, "Buku_Tamu_BUTADI");
  XLSX.utils.book_append_sheet(wb, ws2, "Rekap_SKM_IKM");

  XLSX.writeFile(
    wb,
    `Rekap_BUTADI_SKM_Dikbud_Kendari_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`
  );
}
