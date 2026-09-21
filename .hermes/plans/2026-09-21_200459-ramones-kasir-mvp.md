# Ramones Kasir — MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a simple POS (point-of-sale) web app for a small coffee shop, with role-based access (admin, cashier), attendance with geolocation, product/stock management, sales, expenses, and a basic financial report.

**Architecture:** Single-page React app bootstrapped with Vite. Tailwind CSS for styling. Supabase for auth (manual user injection), PostgreSQL database, and real-time/subscription features as needed. No SSR; client-side routing with `react-router-dom`.

**Tech Stack:** Vite, React, Tailwind CSS v4, Supabase (auth + database), `react-router-dom`, `@supabase/supabase-js`, `lucide-react` (ikon).

**Theme:** Light & dark mode dengan class strategy (`.dark` di `<html>`), toggle di Navbar, preferensi disimpan di `localStorage` dan fallback ke `prefers-color-scheme` device.

---

## Assumptions & Constraints

1. The Supabase project, URL, dan **public key** (format baru Supabase, menggantikan anon key) akan diisi user; app hanya menyediakan template `.env`. Secret key TIDAK pernah masuk frontend.
2. User auth accounts (email/password) will be injected manually by the user via Supabase Dashboard; the app only implements the login UI and session handler.
3. Roles are stored in a custom `roles` table linked to `users` (Supabase Auth users) by `user_id`.
4. The app is Indonesian language first (UI labels), code in English.
5. Geolocation is browser-based (`navigator.geolocation`) and stored as `lat,lng` text.
6. MVP only: no payment integration, no receipt printing, no offline support.
7. Theme light/dark disimpan per-device di `localStorage` (bukan di DB), key `ramones-theme`.
8. Default theme mengikuti preferensi OS saat pertama kali buka; setelah user memilih manual, pilihan itu yang dipakai.

---

## Project Structure

```
/Users/cecha/Documents/codes/ramones-kasir/
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js (or CSS config for v4)
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   └── supabase.js
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── PrivateRoute.jsx
│   │   ├── Navbar.jsx
│   │   ├── AuthForm.jsx
│   │   ├── AttendanceButton.jsx
│   │   ├── ProductForm.jsx
│   │   ├── ProductList.jsx
│   │   ├── TransactionForm.jsx
│   │   ├── ExpenseForm.jsx
│   │   └── ReportSummary.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── SalesPage.jsx
│   │   ├── ExpensesPage.jsx
│   │   └── ReportsPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useRole.js
│   │   └── useGeolocation.js
│   └── utils/
│       └── formatters.js
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## Database Schema (Supabase PostgreSQL)

### Table: `roles`

| Column       | Type                     | Notes                        |
|--------------|--------------------------|------------------------------|
| id           | uuid                     | PK, default gen_random_uuid()|
| user_id      | uuid                     | references auth.users(id), unique |
| name         | text                     | check in ('admin','cashier') |
| created_at   | timestamptz              | default now()                  |

### Table: `products`

| Column       | Type                     | Notes                        |
|--------------|--------------------------|------------------------------|
| id           | uuid                     | PK                           |
| name         | text                     | not null, unique             |
| price        | integer                  | not null, >= 0               |
| stock        | integer                  | not null, >= 0               |
| created_at   | timestamptz              | default now()                  |
| updated_at   | timestamptz              | default now()                  |

### Table: `attendances`

| Column       | Type                     | Notes                        |
|--------------|--------------------------|------------------------------|
| id           | uuid                     | PK                           |
| user_id      | uuid                     | references auth.users(id)   |
| location     | text                     | lat,lng string               |
| created_at   | timestamptz              | default now()                  |
| updated_at   | timestamptz              | default now()                  |

### Table: `sales`

| Column       | Type                     | Notes                        |
|--------------|--------------------------|------------------------------|
| id           | uuid                     | PK                           |
| product_id   | uuid                     | references products(id)      |
| product_name | text                     | denormalized snapshot         |
| price        | integer                  | price at time of sale         |
| total_item   | integer                  | quantity                      |
| total_price  | integer                  | price * total_item            |
| created_at   | timestamptz              | default now()                  |

### Table: `expenses`

| Column       | Type                     | Notes                        |
|--------------|--------------------------|------------------------------|
| id           | uuid                     | PK                           |
| name         | text                     | not null                     |
| price        | integer                  | unit price                   |
| total_item   | integer                  | quantity                     |
| total_price  | integer                  | price * total_item           |
| created_at   | timestamptz              | default now()                  |

---

## Feature Breakdown

### 1. Auth (Login Only)

- Login form: username / password.
- Use Supabase Auth `signInWithPassword`.
- On success, fetch role from `roles` table by `user_id`.
- Store minimal session in context; react to `onAuthStateChange`.
- No register/reset flow in app; user injected manually.

### 2. Role-Based Access

- `admin`: full access.
- `cashier`: attendance, products (add/reduce stock), sales, expenses.
- Role check on route-level and component-level.

### 3. Theme (Light / Dark)

- `ThemeProvider` menyimpan mode aktif: `light` | `dark`.
- Saat mount: baca `localStorage['ramones-theme']`; kalau kosong, pakai `window.matchMedia('(prefers-color-scheme: dark)')`.
- Terapkan dengan menambah/melepas class `dark` pada `document.documentElement`, dan set `color-scheme` agar form control native ikut gelap.
- `ThemeToggle` (ikon matahari/bulan) diletakkan di `Navbar`, tersedia untuk semua role termasuk di halaman login.
- Semua komponen wajib pakai pasangan class Tailwind, contoh: `bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100`.
- Tidak ada flash putih saat load: set tema lewat inline script kecil di `index.html` sebelum React mount.

### 4. Attendance with Geolocation

- Request `navigator.geolocation.getCurrentPosition`.
- On success, insert `{ user_id, location }` into `attendances`.
- Show success/failure toast.

### 5. Product Management

- List products (name, price, stock).
- Add new product (name, price, initial stock).
- Reduce/increase stock (admin & cashier).
- Delete product (admin only).

### 6. Sales Entry

- Select product; auto-fill price from product table.
- Input quantity; calculate total price.
- Save to `sales`; optionally decrement product stock.

### 7. Expense Entry

- Input name, price, quantity.
- Save to `expenses`.

### 8. Financial Report

- Sum of sales and expenses by date range (default today).
- Simple net income: `total_sales - total_expenses`.
- Admin only (cashier cannot view).

---

## Implementation Tasks

### Task 1: Bootstrap Vite + Tailwind project

**Objective:** Create the base project with Vite, React, Tailwind v4, and folder structure.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/package.json`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/vite.config.js`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/index.html`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/main.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/App.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/index.css`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/.env.example`
- Create folder structure: `src/lib`, `src/components`, `src/pages`, `src/hooks`, `src/utils`, `supabase/migrations`

**Step 1:** Run `npm create vite@latest . -- --template react` and install deps (or write files manually).

**Step 2:** Install Tailwind v4: `npm install -D tailwindcss @tailwindcss/vite` and configure Vite plugin.

**Step 3:** Write `src/index.css` with `@import "tailwindcss";` lalu tambahkan class-based dark variant:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-brand-50: #fff7ed;
  --color-brand-500: #f97316;
  --color-brand-600: #ea580c;
}
```

**Step 4:** Tambahkan inline script anti-flash di `index.html` (di dalam `<head>`, sebelum `#root`):

```html
<script>
  (function () {
    var t = localStorage.getItem('ramones-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.style.colorScheme = t;
  })();
</script>
```

**Step 5:** Verify dev server runs: `npm run dev`.

**Step 6:** Commit.

---

### Task 2: Supabase client + env template

**Objective:** Initialize Supabase client and document required env vars.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/lib/supabase.js`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLIC_KEY`)

**Step 1:** Create Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLIC_KEY`.

**Step 2:** Add `.env.example` with those two keys. Secret key hanya dipakai server-side (Edge Functions), bukan di bundle frontend.

**Step 3:** Commit.

---

### Task 3: Database migrations

**Objective:** Create initial schema in Supabase SQL editor or migration file.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/supabase/migrations/001_initial_schema.sql`

**Step 1:** Create `roles`, `products`, `attendances`, `sales`, `expenses` tables with PKs, FKs, and RLS policies.

**Step 2:** Add RLS policies: users can read their own role; admins can manage all data; cashiers can read products and insert attendances/sales/expenses.

**Step 3:** Commit.

---

### Task 4: Auth context + login page

**Objective:** Implement login-only auth and role-aware session.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/hooks/useAuth.js`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/context/AuthContext.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/LoginPage.jsx`
- Modify: `/Users/cecha/Documents/codes/ramones-kasir/src/App.jsx`

**Step 1:** Create `AuthProvider` wrapping the app.

**Step 2:** On mount, listen to `onAuthStateChange`; if session exists, fetch role.

**Step 3:** Provide `login(email, password)` that calls `supabase.auth.signInWithPassword` then fetches role.

**Step 4:** Provide `logout()` that signs out and clears state.

**Step 5:** Build `LoginPage` with username/email + password fields and a login button.

**Step 6:** Commit.

---

### Task 5: Theme provider + toggle

**Objective:** Implement light/dark theme with persistence and no flash on load.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/context/ThemeContext.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/ThemeToggle.jsx`
- Modify: `/Users/cecha/Documents/codes/ramones-kasir/src/main.jsx`
- Modify: `/Users/cecha/Documents/codes/ramones-kasir/index.html`

**Step 1:** Buat `ThemeProvider` dengan state `theme` ('light' | 'dark'), fungsi `toggleTheme()`, dan efek yang:
- menulis `localStorage.setItem('ramones-theme', theme)`
- toggle class `dark` di `document.documentElement`
- set `document.documentElement.style.colorScheme = theme`

**Step 2:** Initial state dibaca dari `document.documentElement.classList.contains('dark')` supaya konsisten dengan inline script di `index.html` (menghindari mismatch hydration/flash).

**Step 3:** Export hook `useTheme()` yang melempar error bila dipakai di luar provider.

**Step 4:** Bungkus `<App />` dengan `<ThemeProvider>` di `src/main.jsx`.

**Step 5:** Buat `ThemeToggle` — tombol ikon (matahari saat light, bulan saat dark) dengan `aria-label`, `aria-pressed`, dan `title` yang berubah sesuai mode.

**Step 6:** Verifikasi manual: klik toggle → class `dark` muncul/hilang di `<html>`, refresh halaman → tema tetap sama, hapus `localStorage` → tema ikut OS.

**Step 7:** Commit.

---

### Task 6: Layout + private routes

**Objective:** Protect pages and provide navigation based on role.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/Layout.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/PrivateRoute.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/Navbar.jsx`
- Modify: `/Users/cecha/Documents/codes/ramones-kasir/src/App.jsx`

**Step 1:** `PrivateRoute` checks session and role requirements.

**Step 2:** `Layout` renders `Navbar` and outlet.

**Step 3:** `Navbar` shows links: Dashboard, Absen, Produk, Penjualan, Pengeluaran, Laporan (admin only) + `<ThemeToggle />` di sisi kanan.

**Step 4:** Wire routes in `App.jsx`.

**Step 5:** Commit.

---

### Task 7: Attendance with geolocation

**Objective:** Allow users to check in with current device location.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/hooks/useGeolocation.js`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/AttendanceButton.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/AttendancePage.jsx`

**Step 1:** `useGeolocation` wraps `navigator.geolocation.getCurrentPosition` and returns `{ lat, lng, error }`.

**Step 2:** `AttendanceButton` requests location, then inserts `{ user_id, location: "lat,lng" }` into `attendances`.

**Step 3:** Show loading, success, and error states.

**Step 4:** Commit.

---

### Task 8: Product management

**Objective:** CRUD-ish product list with stock adjustment.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/ProductsPage.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/ProductForm.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/ProductList.jsx`

**Step 1:** Fetch and display products from Supabase.

**Step 2:** Add product form: name, price, stock.

**Step 3:** Inline +/- buttons to adjust stock.

**Step 4:** Admin can delete product.

**Step 5:** Commit.

---

### Task 9: Sales entry

**Objective:** Record sales and update stock.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/SalesPage.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/TransactionForm.jsx`

**Step 1:** Product dropdown populated from `products`.

**Step 2:** Auto-fill price; editable if needed.

**Step 3:** Input quantity; calculate total.

**Step 4:** On submit, insert into `sales` and decrement product stock.

**Step 5:** Commit.

---

### Task 10: Expense entry

**Objective:** Record operational expenses.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/ExpensesPage.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/ExpenseForm.jsx`

**Step 1:** Form: name, price, quantity, total auto-calculated.

**Step 2:** Insert into `expenses`.

**Step 3:** Commit.

---

### Task 11: Financial report

**Objective:** Show sales vs expenses summary by date range (admin only).

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/ReportsPage.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/components/ReportSummary.jsx`
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/utils/formatters.js`

**Step 1:** Date range picker (from, to) default today.

**Step 2:** Query `sales` and `expenses` within range.

**Step 3:** Show totals and net income.

**Step 4:** Format currency in Rupiah.

**Step 5:** Commit.

---

### Task 12: Dashboard overview

**Objective:** Landing page with quick actions and summary.

**Files:**
- Create: `/Users/cecha/Documents/codes/ramones-kasir/src/pages/DashboardPage.jsx`

**Step 1:** Display today’s sales and expense totals.

**Step 2:** Quick links to Attendance, Sales, Expenses, Products, Reports.

**Step 3:** Commit.

---

### Task 13: Final polish & verification

**Objective:** Ensure app builds, no lint errors, and basic flows work.

**Files:**
- Modify: any final CSS or route tweaks.

**Step 1:** Run `npm run build` and fix errors.

**Step 2:** Run `npm run lint` if configured.

**Step 3:** Manual smoke test: login → attendance → add product → sale → expense → report.

**Step 3b:** Smoke test tema: toggle light/dark di setiap halaman, cek kontras teks & tabel tetap terbaca, refresh (no flash), lalu cek di halaman login (belum authenticated) toggle tetap berfungsi.

**Step 4:** Update README with setup instructions, env vars, and Supabase manual user injection steps.

**Step 5:** Commit.

---

## Open Questions

1. Should stock be allowed to go negative when a sale exceeds stock? (Recommended: block or warn.)
2. Should each user attend multiple times per day, or only once? (Recommended: allow multiple; report by user if needed.)
3. Is product price in sales a snapshot or always linked to product? (Recommended: snapshot stored in `sales.price`.)
4. Do you want receipt/invoice printing in MVP? (Recommended: no, post-MVP.)
5. Preferensi tema perlu disimpan per-user di DB, atau cukup per-device via `localStorage`? (Recommended: per-device, lebih simpel.)

---

## Next Step

**Plan complete. Ready to execute using subagent-driven-development — I'll dispatch tasks one by one with two-stage review (spec compliance then code quality). Shall I proceed?**
