-- ============================================================
-- Ramones Kasir — Migration 002
-- Absensi: absen masuk & absen keluar (multi-sesi per hari)
--
-- Jalankan di Supabase Dashboard > SQL Editor SETELAH 001 selesai.
--
-- Model data: 1 baris attendance = 1 SESI kerja.
--   - Absen masuk  -> INSERT baris baru (check_in_at terisi)
--   - Absen keluar -> UPDATE baris tersebut (check_out_at terisi)
--   - Sesi dianggap "terbuka" bila check_out_at masih NULL.
--   - User hanya boleh punya SATU sesi terbuka pada satu waktu.
--   - Setelah absen keluar, user boleh absen masuk lagi di hari
--     yang sama -> baris baru dibuat.
-- ============================================================


-- ============================================================
-- 1. Kolom sesi absensi
-- ============================================================

ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS attendance_date date,
  ADD COLUMN IF NOT EXISTS check_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS check_in_location text,
  ADD COLUMN IF NOT EXISTS check_in_device text,
  ADD COLUMN IF NOT EXISTS check_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS check_out_location text,
  ADD COLUMN IF NOT EXISTS check_out_device text;

-- Kolom lama digantikan oleh pasangan check_in_* / check_out_*
ALTER TABLE public.attendances
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS device;

-- Kolom created_at/updated_at dari 001 tetap dipakai sebagai
-- waktu baris dibuat / terakhir diubah. Absen keluar memakai check_out_at.


-- ============================================================
-- 2. Hapus batasan "satu baris per user per hari"
--    (dari versi 002 sebelumnya, kalau sempat dijalankan)
-- ============================================================

DROP INDEX IF EXISTS public.uniq_attendance_user_date;


-- ============================================================
-- 3. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_attendances_date
  ON public.attendances(attendance_date DESC);

-- Satu user hanya boleh punya satu sesi terbuka (check_out_at IS NULL).
-- Index parsial: hanya berlaku untuk baris yang belum check out.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_session_per_user
  ON public.attendances(user_id)
  WHERE check_out_at IS NULL;


-- ============================================================
-- 4. RLS
-- ============================================================

-- User boleh update barisnya sendiri (dipakai untuk absen keluar).
DROP POLICY IF EXISTS "attendances_update_own" ON public.attendances;
CREATE POLICY "attendances_update_own" ON public.attendances
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 5. Seed (opsional)
-- ============================================================
-- INSERT INTO public.attendances (user_id, attendance_date, check_in_at, check_in_location)
-- VALUES ('<USER_UUID>', CURRENT_DATE, NOW(), '-7.1234,112.5678');
