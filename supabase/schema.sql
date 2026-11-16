-- ============================================================================
-- SKEMA DATABASE SUPABASE (PostgreSQL)
-- BUTADI - Buku Tamu Digital Dinas Pendidikan dan Kebudayaan Kota Kendari
-- Cara Pakai: Salin seluruh isi file ini ke menu "SQL Editor" di Dashboard
-- Supabase Anda, lalu klik "Run".
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL BIDANG / UNIT KERJA
CREATE TABLE IF NOT EXISTS public.bidang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_bidang VARCHAR(150) NOT NULL,
  kepala_bidang VARCHAR(150) NOT NULL,
  nip_pejabat VARCHAR(50),
  lokasi_ruangan VARCHAR(100) NOT NULL,
  status_pejabat VARCHAR(30) NOT NULL DEFAULT 'Tersedia'
    CHECK (status_pejabat IN ('Tersedia', 'Rapat', 'Dinas Luar')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL USERS (PETUGAS / ADMIN / PEJABAT)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(150) NOT NULL,
  nip VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(30) NOT NULL
    CHECK (role IN ('superadmin', 'resepsionis', 'admin_bidang', 'kadis')),
  bidang_id UUID REFERENCES public.bidang(id) ON DELETE SET NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL KUNJUNGAN (BUKU TAMU)
CREATE TABLE IF NOT EXISTS public.kunjungan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_tiket VARCHAR(40) UNIQUE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu_masuk TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_keluar TIMESTAMPTZ,
  nik_nip VARCHAR(30) NOT NULL,
  nama_tamu VARCHAR(150) NOT NULL,
  instansi_asal VARCHAR(200) NOT NULL,
  kategori_tamu VARCHAR(30) NOT NULL DEFAULT 'Guru/Kepsek'
    CHECK (kategori_tamu IN ('Guru/Kepsek', 'Umum', 'Instansi')),
  no_wa VARCHAR(30) NOT NULL,
  bidang_id UUID REFERENCES public.bidang(id) ON DELETE SET NULL,
  keperluan TEXT NOT NULL,
  foto_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Menunggu'
    CHECK (status IN ('Menunggu', 'Dilayani', 'Disposisi', 'Selesai', 'Batal')),
  catatan_disposisi_kadis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL SKM RESPONSES (SURVEI KEPUASAN MASYARAKAT - 9 UNSUR PERMENPAN-RB 14/2017)
CREATE TABLE IF NOT EXISTS public.skm_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kunjungan_id UUID UNIQUE REFERENCES public.kunjungan(id) ON DELETE CASCADE,
  bidang_id UUID REFERENCES public.bidang(id) ON DELETE SET NULL,
  u1_persyaratan SMALLINT NOT NULL CHECK (u1_persyaratan BETWEEN 1 AND 4),
  u2_prosedur SMALLINT NOT NULL CHECK (u2_prosedur BETWEEN 1 AND 4),
  u3_waktu SMALLINT NOT NULL CHECK (u3_waktu BETWEEN 1 AND 4),
  u4_biaya SMALLINT NOT NULL CHECK (u4_biaya BETWEEN 1 AND 4),
  u5_produk SMALLINT NOT NULL CHECK (u5_produk BETWEEN 1 AND 4),
  u6_kompetensi SMALLINT NOT NULL CHECK (u6_kompetensi BETWEEN 1 AND 4),
  u7_perilaku SMALLINT NOT NULL CHECK (u7_perilaku BETWEEN 1 AND 4),
  u8_sarpras SMALLINT NOT NULL CHECK (u8_sarpras BETWEEN 1 AND 4),
  u9_pengaduan SMALLINT NOT NULL CHECK (u9_pengaduan BETWEEN 1 AND 4),
  saran_masukan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEX UNTUK PERFORMA AUTO-FILL NIK/NIP & PENCARIAN TIKET
CREATE INDEX IF NOT EXISTS idx_kunjungan_nik_nip ON public.kunjungan(nik_nip);
CREATE INDEX IF NOT EXISTS idx_kunjungan_kode_tiket ON public.kunjungan(kode_tiket);
CREATE INDEX IF NOT EXISTS idx_kunjungan_tanggal ON public.kunjungan(tanggal);
CREATE INDEX IF NOT EXISTS idx_kunjungan_status ON public.kunjungan(status);

-- ============================================================================
-- KONFIGURASI ROW LEVEL SECURITY (RLS)
-- Mengizinkan operasi menggunakan Anon Key pada aplikasi web BUTADI
-- ============================================================================
ALTER TABLE public.bidang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skm_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all on bidang" ON public.bidang;
CREATE POLICY "Allow public all on bidang" ON public.bidang FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on users" ON public.users;
CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public all on kunjungan" ON public.kunjungan;
CREATE POLICY "Allow public all on kunjungan" ON public.kunjungan FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on skm_responses" ON public.skm_responses;
CREATE POLICY "Allow public all on skm_responses" ON public.skm_responses FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- AKTIFKAN SUPABASE REALTIME SUBSCRIPTIONS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bidang'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bidang;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'kunjungan'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kunjungan;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'skm_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.skm_responses;
  END IF;
END $$;

-- ============================================================================
-- DATA AWAL (SEED DATA) DINAS PENDIDIKAN DAN KEBUDAYAAN KOTA KENDARI
-- ============================================================================
INSERT INTO public.bidang (id, nama_bidang, kepala_bidang, nip_pejabat, lokasi_ruangan, status_pejabat)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Kepala Dinas', 'Hj. Saemina, S.Pd., M.Pd.', '19680512 199303 2 008', 'Lantai 2 - Ruang Utama Kepala Dinas', 'Tersedia'),
  ('11111111-1111-4111-8111-111111111102', 'Sekretariat (Umum, Kepegawaian & Perencanaan)', 'Drs. H. La Ode Muh. Izat, M.Si.', '19710410 199703 1 004', 'Lantai 1 - Sayap Kanan (Ruang Sekretariat)', 'Tersedia'),
  ('11111111-1111-4111-8111-111111111103', 'Bidang Pembinaan GTK (Guru & Tenaga Kependidikan)', 'La Ode Halidin, S.Pd., M.M.', '19750819 200012 1 002', 'Lantai 1 - Sayap Kiri (Ruang GTK)', 'Tersedia'),
  ('11111111-1111-4111-8111-111111111104', 'Bidang Pembinaan Sekolah Dasar (SD)', 'Hj. Wa Ode Nurhasanah, S.Pd., M.Pd.', '19731102 199802 2 005', 'Lantai 2 - Sayap Kiri (Ruang Pembinaan SD)', 'Rapat'),
  ('11111111-1111-4111-8111-111111111105', 'Bidang Pembinaan SMP', 'Muh. Syahrir, S.Pd., M.Pd.', '19760322 200212 1 006', 'Lantai 2 - Sayap Kanan (Ruang Pembinaan SMP)', 'Tersedia'),
  ('11111111-1111-4111-8111-111111111106', 'Bidang Kebudayaan', 'Andi Tenri Sangka, S.Sos., M.Hum.', '19780914 200502 2 003', 'Gedung B - Lantai 1 (Ruang Kebudayaan)', 'Dinas Luar')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (nama, nip, role, bidang_id, password_hash)
VALUES
  ('Hj. Saemina, S.Pd., M.Pd.', '196805121993032008', 'kadis', '11111111-1111-4111-8111-111111111101', 'hashed_kadis_pass'),
  ('Siti Rahmawati, A.Md. (FO Lobi)', '199502182020122011', 'resepsionis', '11111111-1111-4111-8111-111111111102', 'hashed_fo_pass'),
  ('Arif Rahman, S.Kom. (Admin GTK)', '199207042019031007', 'admin_bidang', '11111111-1111-4111-8111-111111111103', 'hashed_gtk_pass'),
  ('Super Administrator IT Dikbud', '199001012015031001', 'superadmin', NULL, 'hashed_admin_pass')
ON CONFLICT (nip) DO NOTHING;

-- CONTOH DATA KUNJUNGAN AWAL
INSERT INTO public.kunjungan (
  id, kode_tiket, tanggal, waktu_masuk, waktu_keluar, nik_nip, nama_tamu,
  instansi_asal, kategori_tamu, no_wa, bidang_id, keperluan, status, catatan_disposisi_kadis
)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    'BTD-KDI-001',
    CURRENT_DATE,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 15 minutes',
    '198103152006041009',
    'Drs. Muh. Ruslan, M.Pd.',
    'SMP Negeri 1 Kendari',
    'Guru/Kepsek',
    '081241234567',
    '11111111-1111-4111-8111-111111111103',
    'Verifikasi berkas pengusulan Tunjangan Profesi Guru (TPG) Semester Ganjil',
    'Selesai',
    NULL
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'BTD-KDI-002',
    CURRENT_DATE,
    NOW() - INTERVAL '45 minutes',
    NULL,
    '197906212005012014',
    'Hj. Hasniati, S.Pd.',
    'SD Negeri 2 Baruga',
    'Guru/Kepsek',
    '085241889900',
    '11111111-1111-4111-8111-111111111101',
    'Audiensi persiapan Lomba Sekolah Sehat Tingkat Provinsi Sultra & penandatanganan MoU komite',
    'Menunggu',
    NULL
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'BTD-KDI-003',
    CURRENT_DATE,
    NOW() - INTERVAL '25 minutes',
    NULL,
    '7471081209880002',
    'Irwan Saputra, S.T.',
    'Orang Tua Siswa (Kec. Kadia)',
    'Umum',
    '082187654321',
    '11111111-1111-4111-8111-111111111105',
    'Konsultasi mutasi siswa pindah rayon masuk ke SMP Negeri 9 Kendari',
    'Dilayani',
    NULL
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'BTD-KDI-004',
    CURRENT_DATE,
    NOW() - INTERVAL '15 minutes',
    NULL,
    '198411102010011005',
    'La Ode Hasanuddin, S.Sn., M.Pd.',
    'Sanggar Seni Kalosara Kendari',
    'Instansi',
    '081340556677',
    '11111111-1111-4111-8111-111111111101',
    'Koordinasi Festival Budaya Lulo & Pameran Cagar Budaya Kota Kendari',
    'Menunggu',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- CONTOH DATA SURVEI KEPUASAN MASYARAKAT (SKM)
INSERT INTO public.skm_responses (
  id, kunjungan_id, bidang_id,
  u1_persyaratan, u2_prosedur, u3_waktu, u4_biaya, u5_produk,
  u6_kompetensi, u7_perilaku, u8_sarpras, u9_pengaduan, saran_masukan
)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111103',
    4, 4, 4, 4, 4, 4, 4, 3, 4,
    'Pelayanan di Bidang GTK sangat cepat, ramah, dan sekarang pakai sistem tiket digital jadi lebih tertib tanpa antre lama.'
  )
ON CONFLICT (id) DO NOTHING;
