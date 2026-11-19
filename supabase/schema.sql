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

-- ============================================================================
-- 5. TABEL MASTER SEKOLAH SE-KOTA KENDARI (EKOSISTEM TERINTEGRASI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sekolah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npsn VARCHAR(20) UNIQUE NOT NULL,
  nama_sekolah VARCHAR(150) NOT NULL,
  jenjang VARCHAR(20) NOT NULL DEFAULT 'SMP'
    CHECK (jenjang IN ('TK/PAUD', 'SD', 'SMP')),
  kecamatan VARCHAR(60) NOT NULL DEFAULT 'Kadia',
  alamat TEXT NOT NULL DEFAULT '',
  kepala_sekolah VARCHAR(120) NOT NULL,
  nip_kepsek VARCHAR(40),
  no_wa_sekolah VARCHAR(30),
  passcode VARCHAR(50) NOT NULL DEFAULT 'sekolah1010',
  status_kepsek VARCHAR(20) NOT NULL DEFAULT 'Tersedia'
    CHECK (status_kepsek IN ('Tersedia', 'Rapat', 'Dinas Luar')),
  unit_layanan JSONB NOT NULL DEFAULT '["Kepala Sekolah", "Tata Usaha / Operator", "Wakil Kepala Sekolah", "Guru BK / Piket", "Wali Kelas / Guru Mapel"]'::jsonb,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL KUNJUNGAN BUKU TAMU SEKOLAH
CREATE TABLE IF NOT EXISTS public.kunjungan_sekolah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sekolah_id UUID NOT NULL REFERENCES public.sekolah(id) ON DELETE CASCADE,
  kode_tiket VARCHAR(40) UNIQUE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu_masuk TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_keluar TIMESTAMPTZ,
  nik_nip VARCHAR(40) NOT NULL,
  nama_tamu VARCHAR(120) NOT NULL,
  instansi_asal VARCHAR(150) NOT NULL,
  kategori_tamu VARCHAR(40) NOT NULL DEFAULT 'Orang Tua / Wali'
    CHECK (kategori_tamu IN ('Orang Tua / Wali', 'Pengawas / Dikbud', 'Instansi / Mitra', 'Umum')),
  no_wa VARCHAR(30) NOT NULL,
  tujuan_unit VARCHAR(100) NOT NULL DEFAULT 'Kepala Sekolah',
  keperluan TEXT NOT NULL,
  foto_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Menunggu'
    CHECK (status IN ('Menunggu', 'Dilayani', 'Selesai', 'Batal')),
  catatan_sekolah TEXT,
  nilai_kepuasan SMALLINT CHECK (nilai_kepuasan BETWEEN 1 AND 4),
  saran_masukan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sekolah_npsn ON public.sekolah(npsn);
CREATE INDEX IF NOT EXISTS idx_sekolah_jenjang ON public.sekolah(jenjang);
CREATE INDEX IF NOT EXISTS idx_sekolah_kecamatan ON public.sekolah(kecamatan);
CREATE INDEX IF NOT EXISTS idx_kunjungan_sekolah_sekolah_id ON public.kunjungan_sekolah(sekolah_id);
CREATE INDEX IF NOT EXISTS idx_kunjungan_sekolah_tanggal ON public.kunjungan_sekolah(tanggal);
CREATE INDEX IF NOT EXISTS idx_kunjungan_sekolah_nik_nip ON public.kunjungan_sekolah(nik_nip);
CREATE INDEX IF NOT EXISTS idx_kunjungan_sekolah_status ON public.kunjungan_sekolah(status);

ALTER TABLE public.sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunjungan_sekolah ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all on sekolah" ON public.sekolah;
CREATE POLICY "Allow public all on sekolah" ON public.sekolah FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on kunjungan_sekolah" ON public.kunjungan_sekolah;
CREATE POLICY "Allow public all on kunjungan_sekolah" ON public.kunjungan_sekolah FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.sekolah (
  id, npsn, nama_sekolah, jenjang, kecamatan, alamat, kepala_sekolah, nip_kepsek, no_wa_sekolah, passcode, status_kepsek
)
VALUES
  ('44444444-4444-4444-8444-444444444401', '40402601', 'SMP Negeri 1 Kendari', 'SMP', 'Mandonga', 'Jl. Jend. Ahmad Yani No. 17, Kota Kendari', 'Drs. Muh. Ruslan, M.Pd.', '19700512 199603 1 004', '08114001001', 'smpn1kdi', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444402', '40402602', 'SMP Negeri 2 Kendari', 'SMP', 'Kendari Barat', 'Jl. Sultan Hasanuddin No. 48, Tipulu, Kota Kendari', 'Hj. Sitti Maemunah, S.Pd., M.Pd.', '19720814 199802 2 003', '08114001002', 'smpn2kdi', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444403', '40402609', 'SMP Negeri 9 Kendari', 'SMP', 'Kadia', 'Jl. Sao-Sao, Bende, Kec. Kadia, Kota Kendari', 'Milwan, S.Pd., M.Pd.', '19741109 199903 1 005', '08114001009', 'smpn9kdi', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444404', '40402604', 'SMP Negeri 4 Kendari', 'SMP', 'Wua-Wua', 'Jl. Kijang No. 5, Rahandouna, Kota Kendari', 'La Ode Muh.Kurdin, S.Pd., M.Pd.', '19710321 199702 1 002', '08114001004', 'smpn4kdi', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444405', '40402501', 'SD Negeri 1 Kendari', 'SD', 'Kendari', 'Jl. Ir. H. Alala, Kandai, Kota Kendari', 'Hj. Hasniati, S.Pd., M.Pd.', '19750621 200012 2 004', '08114002001', 'sdn1kdi', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444406', '40402502', 'SD Negeri 2 Baruga', 'SD', 'Baruga', 'Jl. Brigjen M. Yoenoes, Lepo-Lepo, Kec. Baruga', 'Wa Ode Siti Aisyah, S.Pd.', '19780411 200312 2 007', '08114002002', 'sdn2baruga', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444407', '40402584', 'SD Negeri 84 Kendari', 'SD', 'Kambu', 'Jl. Martandu, Kambu, Kota Kendari', 'H. Abdul Rahim, S.Pd., M.M.', '19730918 199803 1 006', '08114002084', 'sdn84kdi', 'Tersedia'),
  ('44444444-4444-4444-8444-444444444408', '40402701', 'TK Negeri Pembina Kota Kendari', 'TK/PAUD', 'Kadia', 'Jl. Balaikota III, Pondambea, Kec. Kadia, Kota Kendari', 'Hj. Nurhayati, S.Pd.AUD.', '19761205 200212 2 003', '08114003001', 'tknpembina', 'Tersedia')
ON CONFLICT (npsn) DO NOTHING;
