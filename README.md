# Ramones Kasir

Aplikasi kasir sederhana untuk warung kopi. Tech stack: Vite, React, Tailwind CSS, Supabase.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` ke `.env` dan isi dengan public key Supabase kamu:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLIC_KEY=eyJ...
   ```

3. Jalankan migration SQL di Supabase Dashboard → SQL Editor:
   - Buka file `supabase/migrations/001_initial_schema.sql`
   - Paste dan jalankan semua perintah SQL

4. Register user auth dilakukan secara manual via Supabase Dashboard → Authentication → Users → Add user.

5. Setelah user dibuat, tambahkan role di tabel `roles`:
   ```sql
   INSERT INTO public.roles (user_id, name)
   VALUES ('<uuid-user>', 'admin');
   -- atau 'cashier'
   ```

6. Jalankan local dev:
   ```bash
   npm run dev
   ```

## Fitur

- Login dengan Supabase Auth (email/password)
- Dark / light mode toggle
- Role-based access: admin & cashier
- Absensi dengan geolocation device
- Manajemen produk & stok
- Input penjualan (otomatis mengurangi stok)
- Input pengeluaran
- Laporan keuangan (admin only)

## Build

```bash
npm run build
```
