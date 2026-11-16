# BUTADI — Buku Tamu Digital Dinas Pendidikan dan Kebudayaan Kota Kendari

Aplikasi web **E-Receptionist & Buku Tamu Digital Terintegrasi (4 Portal Real-Time)** untuk **Dinas Pendidikan dan Kebudayaan Kota Kendari**, menggunakan **Next.js (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL + Realtime Subscriptions)**, **Recharts**, **QRCode**, serta ekspor laporan **PDF (`jspdf`) & Excel (`xlsx`)**.

---

## Fitur Utama di 4 Portal Terintegrasi

1. **Lobi & Kiosk Monitor (`/`)**
   - Generator **Standee QR Code Check-In** siap cetak untuk meja resepsionis.
   - Monitor status kehadiran pejabat per Bidang (*Ada di Kantor*, *Sedang Rapat*, *Dinas Luar*) secara *real-time*.
   - Layar antrean panggilan tamu aktif dan skor Indeks Kepuasan Masyarakat (IKM).

2. **Portal 1: Portal Tamu Digital (`/tamu`)**
   - **Smart Form Kunjungan** dengan fitur **Auto-Fill NIK/NIP** (mengisi otomatis Nama, Sekolah/Instansi Asal, Kategori, dan Nomor WA jika tamu pernah berkunjung).
   - Pemilihan Bidang tujuan terstruktur lengkap dengan indikator ketersediaan pejabat.
   - **Web-Camera Selfie Capture** langsung dari browser HP/Tablet.
   - **E-Ticket QR Code & Real-Time Status Tracker** (*Menunggu* ➔ *Silakan Masuk Ruangan* / *Disposisi* ➔ *Selesai & Isi SKM*).

3. **Portal 2: Portal Admin FO / Resepsionis & Admin Bidang (`/admin`)**
   - **Live Queue Monitor** dengan lonceng notifikasi otomatis (*Web Audio API Bell*).
   - **Pemindai QR Code Tiket** menggunakan kamera (`html5-qrcode`).
   - Manajemen status kunjungan, pengalihan/disposisi tamu, dan **Trigger Otomatis SKM** saat *Check-Out* (mengirim tautan survei ke WhatsApp tamu via Fonnte Gateway / WA Direct).
   - **CRUD Data Master Bidang** & tombol cepat ubah status kehadiran pejabat.
   - **Ekspor Laporan PDF Resmi** (lengkap dengan Kop Surat Pemkot Kendari & tanda tangan Kepala Dinas) dan **Excel Multi-Sheet** (`Buku_Tamu_BUTADI` & `Rekap_SKM_IKM`).

4. **Portal 3: Portal Kepala Dinas — Executive Dashboard (`/kadis`)**
   - **Executive Summary Cards** (Total Tamu Hari Ini/Bulan Ini, Bidang Paling Sibuk, Tamu Khusus Kadis, dan Skor IKM).
   - **VIP / Direct Approval Panel**: Tombol aksi cepat bagi Kepala Dinas (*"Terima Sekarang"*, *"Disposisi ke Sekdis / Kabid"*, atau *"Tunda / Rapat"*).
   - Grafik analitik distribusi kunjungan per Bidang, proporsi kategori tamu, dan tren jam sibuk.
   - Pantauan capaian 9 Unsur Pelayanan & **Kotak Saran Digital**.

5. **Portal 4: Portal SKM — Survei Kepuasan Masyarakat (`/skm`)**
   - Kuesioner interaktif **9 Unsur Pelayanan sesuai PermenPAN-RB No. 14 Tahun 2017**.
   - Terhubung otomatis dengan tiket kunjungan dan Bidang yang melayani.
   - **Kalkulasi IKM Otomatis** (NRR Tertimbang $\times 25$, Konversi 25–100, Mutu Pelayanan A/B/C/D).

---

## Cara Menghubungkan ke Project Supabase Anda

### Langkah 1: Jalankan Skema Tabel SQL di Supabase
1. Buka dashboard project Supabase Anda di https://supabase.com/dashboard
2. Masuk ke menu **SQL Editor** ➔ klik **New Query**.
3. Salin seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql) lalu klik **Run**.
   *(Script ini akan membuat tabel `bidang`, `users`, `kunjungan`, `skm_responses`, mengaktifkan Supabase Realtime, serta mengisi data awal bidang Dikbud Kota Kendari).*

### Langkah 2: Masukkan URL & Anon Key Supabase
Anda dapat memilih **salah satu** dari dua cara berikut:
- **Cara A (Melalui Web UI Langsung):** Klik tombol **"Hubungkan Supabase"** di pojok kanan atas aplikasi web, tempelkan `Project URL` dan `Anon Key` Anda, lalu klik **Simpan & Hubungkan** (tersedia juga tombol **Seed Data Awal ke Supabase**).
- **Cara B (Melalui File `.env.local`):** Salin `.env.local.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Menjalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser Anda.
