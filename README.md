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
   - Paste dan jalankan **seluruh file sekaligus** (urutan penting: tabel → index → fungsi → trigger → RLS)
   - Catatan: `auth.users` milik Supabase dan tidak diubah oleh migration ini. Kalau muncul error `must be owner of table users`, berarti ada baris yang mencoba mengubah `auth.users` — hapus baris itu.
   - Kalau muncul `infinite recursion detected in policy for relation roles`, pastikan fungsi `is_admin()` / `is_staff()` memakai `SECURITY DEFINER`.

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
- Absensi dengan geolocation device (menyimpan `location` lat,long dan `device` info)
- Manajemen produk & stok
- Input penjualan (otomatis mengurangi stok)
- Input pengeluaran
- Laporan keuangan (admin only)

## Skema Database

| Tabel | Kolom penting |
|---|---|
| `roles` | `user_id` → `auth.users.id`, `name` (`admin` \| `cashier`) |
| `products` | `name`, `price`, `stock` |
| `attendances` | `user_id`, `location` (lat,long), `device` |
| `sales` | `user_id`, `product_id`, `product_name`, `price`, `total_item`, `total_price` |
| `expenses` | `user_id`, `name`, `price`, `total_item`, `total_price` |

Semua tabel memakai RLS. Admin bisa melihat semua data; cashier hanya melihat data miliknya sendiri.

## Build

```bash
npm run build
```
