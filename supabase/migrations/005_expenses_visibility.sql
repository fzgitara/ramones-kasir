-- ============================================================
-- Ramones Kasir — Migration 005
-- Cashier boleh MELIHAT semua expenses (read-only untuk data orang lain),
-- tapi tetap tidak bisa akses menu Laporan (dibatasi di level route, bukan RLS).
--
-- Jalankan di Supabase Dashboard > SQL Editor.
-- ============================================================


-- ============================================================
-- expenses: SELECT untuk semua staff (admin + cashier)
-- ============================================================

DROP POLICY IF EXISTS "expenses_select_own_or_admin" ON public.expenses;
DROP POLICY IF EXISTS "expenses_select_staff" ON public.expenses;
CREATE POLICY "expenses_select_staff" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.is_staff());

-- INSERT tetap: hanya boleh insert atas nama diri sendiri
DROP POLICY IF EXISTS "expenses_insert_staff" ON public.expenses;
CREATE POLICY "expenses_insert_staff" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- UPDATE: pemilik baris atau admin
DROP POLICY IF EXISTS "expenses_update_own_or_admin" ON public.expenses;
CREATE POLICY "expenses_update_own_or_admin" ON public.expenses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- DELETE: admin saja
DROP POLICY IF EXISTS "expenses_delete_admin" ON public.expenses;
CREATE POLICY "expenses_delete_admin" ON public.expenses
  FOR DELETE TO authenticated
  USING (public.is_admin());
