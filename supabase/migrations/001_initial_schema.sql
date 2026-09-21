-- ============================================================
-- Ramones Kasir — Initial Schema
-- Jalankan seluruh file ini SEKALI UTUH di Supabase Dashboard > SQL Editor.
--
-- CATATAN PENTING:
-- 1. auth.users milik Supabase. Kita TIDAK mengubah tabel itu,
--    hanya membuat foreign key yang mengarah ke sana.
-- 2. Urutan penting: tabel dulu, baru fungsi helper, baru policy.
--    Fungsi helper membaca public.roles, jadi tabelnya harus ada dulu.
-- ============================================================


-- ============================================================
-- 1. TABLES
-- ============================================================

-- roles: memetakan auth.users -> role aplikasi
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('admin', 'cashier')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_role UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT,
  device TEXT,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  total_item INTEGER NOT NULL CHECK (total_item > 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  total_item INTEGER NOT NULL CHECK (total_item > 0),
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_roles_user_id ON public.roles(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON public.attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_created_at ON public.attendances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);


-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

-- Trigger helper: auto update kolom updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- SECURITY DEFINER dipakai supaya policy yang membaca public.roles
-- tidak memicu RLS public.roles lagi (penyebab error
-- "infinite recursion detected in policy for relation roles").
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT name FROM public.roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles WHERE user_id = auth.uid() AND name = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles
    WHERE user_id = auth.uid() AND name IN ('admin', 'cashier')
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;


-- ============================================================
-- 4. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trg_roles_updated_at ON public.roles;
CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_attendances_updated_at ON public.attendances;
CREATE TRIGGER trg_attendances_updated_at
  BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- roles ------------------------------------------------------
DROP POLICY IF EXISTS "roles_select_own" ON public.roles;
CREATE POLICY "roles_select_own" ON public.roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "roles_admin_all" ON public.roles;
CREATE POLICY "roles_admin_all" ON public.roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- products ---------------------------------------------------
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
CREATE POLICY "products_select_authenticated" ON public.products
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "products_insert_staff" ON public.products;
CREATE POLICY "products_insert_staff" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "products_update_staff" ON public.products;
CREATE POLICY "products_update_staff" ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- attendances ------------------------------------------------
DROP POLICY IF EXISTS "attendances_select_own_or_admin" ON public.attendances;
CREATE POLICY "attendances_select_own_or_admin" ON public.attendances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "attendances_insert_own" ON public.attendances;
CREATE POLICY "attendances_insert_own" ON public.attendances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- sales ------------------------------------------------------
DROP POLICY IF EXISTS "sales_select_own_or_admin" ON public.sales;
CREATE POLICY "sales_select_own_or_admin" ON public.sales
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "sales_insert_staff" ON public.sales;
CREATE POLICY "sales_insert_staff" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

DROP POLICY IF EXISTS "sales_delete_admin" ON public.sales;
CREATE POLICY "sales_delete_admin" ON public.sales
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- expenses ---------------------------------------------------
DROP POLICY IF EXISTS "expenses_select_own_or_admin" ON public.expenses;
CREATE POLICY "expenses_select_own_or_admin" ON public.expenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "expenses_insert_staff" ON public.expenses;
CREATE POLICY "expenses_insert_staff" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND user_id = auth.uid());

DROP POLICY IF EXISTS "expenses_delete_admin" ON public.expenses;
CREATE POLICY "expenses_delete_admin" ON public.expenses
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 6. SEED (opsional)
-- Setelah user dibuat di Authentication > Users, daftarkan role-nya.
-- Ganti <USER_UUID> dengan UUID user dari dashboard.
-- ============================================================
-- INSERT INTO public.roles (user_id, name) VALUES ('<USER_UUID>', 'admin');
-- INSERT INTO public.roles (user_id, name) VALUES ('<USER_UUID>', 'cashier');
