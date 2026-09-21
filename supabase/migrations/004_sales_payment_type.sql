-- ============================================================
-- Ramones Kasir — Migration 004
-- Tambah payment_type di sales dan multi-produk support
-- ============================================================

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('cash', 'qris'));

-- Default value untuk record lama
UPDATE public.sales SET payment_type = 'cash' WHERE payment_type IS NULL;
