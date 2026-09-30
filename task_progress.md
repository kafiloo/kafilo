# BOM (Bill of Materials) Integration - Menu Management + Stock Management

## Completed Implementation:

### 1. Database (Prisma Schema)
- [x] Added `InventoryItem` model (name, sku, category, unit, currentStock, minThreshold)
- [x] Added `RecipeItem` model (inventoryId, productId, quantityNeeded) with unique composite constraint
- [x] Added `UnitOfMeasure` enum (GRAM, KILOGRAM, MILLILITER, LITER, PIECE, PACK, BOX, BOTTLE, CUP, BAG)
- [x] Added `recipeItems` relation to `Product` model
- [x] Migrated database and seeded 15 inventory items

### 2. Backend API
- [x] **`GET /api/products`** - Returns products with full `recipeItems` array including inventory details
- [x] **`POST /api/products`** - Accepts `ingredients: [{ inventoryId, quantityNeeded }]` payload, validates all stock_ids exist
- [x] **`PUT /api/products`** - Accepts `ingredients` array, deletes old recipe items and creates new ones
- [x] **`GET /api/inventory/list`** - Lightweight endpoint for dropdown options (returns id, name, sku, unit, currentStock)
- [x] **`PATCH /api/inventory`** - Restock endpoint with precise stock calculation
- [x] **`DELETE /api/inventory`** - Blocked if item is linked to active recipe (Menu Management protection)

### 3. Frontend - Menu Management (Products Page)
- [x] **Recipe / Ingredients Section** in Add/Edit modal
- [x] **"Add Ingredient" button** to dynamically add ingredient rows
- [x] **Searchable dropdown** for each ingredient - fetches inventory items from `/api/inventory/list`
- [x] **Real-time search filter** inside dropdown to quickly find inventory items
- [x] **Auto unit label** - displays base unit (g, ml, pcs, etc.) based on selected inventory item
- [x] **Quantity input** for takaran (amount needed per recipe)
- [x] **Delete button** per ingredient row (cross icon)
- [x] **Frontend validation** - prevents save if ingredient not selected or quantity <= 0
- [x] **Edit mode** loads existing recipe items perfectly from API response
- [x] **Product table** shows ingredient count badge (e.g., "3 bahan baku") when recipe exists
- [x] **Excludes already-selected** inventory items from other dropdown options

### 4. Frontend - Stock Management (Inventory Page)
- [x] Full CRUD table with search, restock, add/edit/delete modals
- [x] Low Stock / In Stock status badges based on minThreshold comparison
- [x] Kebab menu with Restock, Edit Item, Delete options
- [x] Restock modal with current stock display, quantity input, and live total preview

### 5. Navigation
- [x] Added "Stock Management" to Sidebar with box icon

### Build Verification
- [x] TypeScript compilation passes
- [x] All routes registered correctly
- [x] Seed data runs without errors

---

# Migrasi Pembayaran ke Pakasir API v2 (30 Sep 2026)

Semua pembayaran (checkout PWA per meja + checkout langganan landing page)
kini 100% via Pakasir API v2. Tidak ada ongkir/pengiriman.

## Yang Dihapus

### Library
- [x] `src/lib/rajaongkir.ts` (cek ongkir / waybill)
- [x] `src/lib/komerce-payment.ts` (QRIS Komerce)
- [x] `src/lib/qrisly.ts` (generate/upload QRIS + status)
- [x] `src/components/customer/QrisDisplay.tsx` (UI QRIS lama)

### API Route
- [x] `src/app/api/v1/payment/{create,methods,callback,status/[paymentId]}`
- [x] `src/app/api/v1/qrisly/{generate-qris,upload-qris,payment-status/[historyId]}`
- [x] `src/app/api/v1/shipping/domestic-cost`
- [x] `src/app/api/v1/pwa/payment/create`

### Lain-lain
- [x] `rajaongkir_docs.html`, `rajaongkir_openapi.json`
- [x] Variabel `RAJAONGKIR_*`, `KOMERCE_PAYMENT_*`, `QRISLY_*` dari `.env`
- [x] Blok `env` berisi secret di `vercel.json` (kini `{}`)
- [x] Direktori nyasar `kafilo-main/` (duplikat project)
- [x] `tsconfig.tsbuildinfo` (artefak build)

## Yang Ditambah

### Server
- [x] `src/lib/env.ts` — `getPakasirEnv()` + `assertServerEnv()` (DATABASE_URL, JWT_SECRET, PAKASIR_*)
- [x] `src/lib/pakasir.ts` — client Pakasir v2 (create-transaction, transaction-status, cancel, payment-fee)
- [x] `src/lib/pakasir-order.ts` — generator `orderId` unik
- [x] `src/lib/pakasir-fulfillment.ts` — tandai COMPLETED + PwaOrder → BEING_PREPARED + potong stok (atomik)
- [x] `src/app/api/payments/route.ts` — POST buat transaksi (nominal dari `pwaOrderId` **atau** `planId`)
- [x] `src/app/api/payments/[orderId]/route.ts` — status + sinkronisasi (maks 1 req / 4 dtk)
- [x] `src/app/api/payments/[orderId]/cancel/route.ts`
- [x] `src/app/api/payments/fees/route.ts` — estimasi biaya per metode
- [x] `src/app/api/webhooks/pakasir/route.ts` — verifikasi `X-Secret` (timingSafeEqual), cek amount, konfirmasi ulang, idempoten, selalu balas 200
- [x] Migrasi Prisma `20260930073131_add_pakasir_payments` (tabel `pakasir_payments` + enum `PakasirPaymentStatus`)

### Frontend
- [x] `src/stores/checkout-store.ts` — state checkout Pakasir (Zustand)
- [x] `src/components/customer/PakasirMethodPicker.tsx`
- [x] `src/components/customer/PakasirPaymentView.tsx` (QR / VA / link + polling)
- [x] `src/components/customer/PakasirCheckoutPanel.tsx` (butuh `pwaOrderId`, prop `onPaid`)

### Halaman yang Dimigrasi
- [x] `src/app/(customer)/[tableId]/checkout/page.tsx` — pilihan CASH vs Online (Pakasir); `ensurePwaOrder()` lalu panel Pakasir; `handlePaid()` bersihkan cart + redirect ke order-status
- [x] `src/app/landingpage/checkout/page.tsx` — pakai `planId`, tanpa mock QRIS/bank/kartu
- [x] `src/middleware.ts` — `/api/payments*` & `/api/webhooks*` dikecualikan dari session POS

## Keamanan
- [x] Amount **selalu** dari server (PwaOrder.totalAmount / `PLANS[planId].price`), client tidak boleh kirim `amount`
- [x] Webhook: cek `X-Secret` constant-time, cocokkan amount DB ↔ webhook ↔ transaction-status, sandbox tidak memenuhi order production
- [x] API key Pakasir hanya di server (tidak ada di client bundle)
- [x] `SECURITY_AUDIT.md` H-04 ditandai RESOLVED + instruksi rotasi key lama

## Verifikasi
- [x] `npx tsc --noEmit` bersih
- [x] `npx eslint` bersih untuk file terkait
- [x] `npm run build` sukses (semua route terdaftar, `public/sw.js` regenerasi tanpa referensi lama)
- [x] Grep audit `rajaongkir|ongkir|komerce|qrisly` → hanya sisa di README/SECURITY_AUDIT (dokumentasi)

## Catatan / Follow-up Manual
- [ ] `PaymentMethod.QRIS` dan `StoreSettings.acceptQris` sengaja dipertahankan (generik) — dipakai sebagai flag "online payment" di UI
- [ ] Rotasi/nonaktifkan API key RajaOngkir, Komerce, QRISLY di dashboard masing-masing
- [ ] Set Webhook URL Pakasir ke `https://<domain>/api/webhooks/pakasir`

---

# Perbaikan Pasca-Deploy: `POST /api/payments` 500 (30 Sep 2026, sore)

Gejala: `POST https://kafiloo.com/api/payments 500 (Internal Server Error)`,
QRIS tidak muncul di halaman checkout.

## Akar Masalah
- [x] **Tabel `pakasir_payments` belum ada di DB production (Neon)** — migrasi
  `20260930073131_add_pakasir_payments` belum pernah di-deploy. `createTransaction()`
  sukses ke Pakasir, tapi `prisma.pakasirPayment.create()` gagal (P2021) → 500,
  sehingga `payment` tidak pernah kembali ke client → QR tidak tampil.
- [x] Diperparah oleh: catch di `POST /api/payments` **tidak mencatat** error env
  dan mengubah semua error jadi pesan generik `"Gagal membuat pembayaran."`,
  jadi penyebabnya tidak terlihat di log maupun di UI.
- [x] Jadwal deploy: `npm run build` tidak pernah menjalankan migrasi.

## Perbaikan
- [x] `npx prisma migrate deploy` dijalankan ke DB production → tabel
  `pakasir_payments` (+ enum + 4 index + FK) kini ada; `prisma migrate status`
  = "Database schema is up to date"
- [x] `package.json`: `"build": "prisma migrate deploy && next build --webpack"`
  + script `db:deploy` → deploy berikutnya selalu menyinkronkan schema
- [x] `src/lib/payment-api-error.ts` (baru): `classifyPaymentError()` +
  `logPaymentError()` → response 400/500/502/503 dengan `reason` + `detail`
  (secret di-redact): `ENV_MISSING`, `DB_MIGRATION_REQUIRED`, `DB_UNREACHABLE`,
  `PAKASIR_REJECTED` (+`pakasirStatus`), `PAKASIR_UNREACHABLE`,
  `AMOUNT_OUT_OF_RANGE`, `INTERNAL`
- [x] `src/app/api/payments/{route,[orderId]/route,[orderId]/cancel/route,fees/route}.ts`
  memakai classifier tersebut; semua error (termasuk env) sekarang **selalu** di-log
- [x] `src/lib/env.ts`: `MissingEnvError` (membawa daftar var yang hilang) +
  `getPakasirEnvStatus()` + `REQUIRED_PAYMENT_ENV`
- [x] `GET /api/payments/health` (baru): diagnosa `env` / `db` / `pakasir` tanpa
  membocorkan secret — dibuka langsung dari browser production
- [x] `src/stores/checkout-store.ts`: error checkout kini menampilkan `detail`
  dan menulis `{reason, missing, pakasirStatus, detail}` ke console browser
- [x] `src/lib/pakasir.ts` + picker + store: tambah metode `atm_bersama_va`
  (dilaporkan API `payment-fee` tapi sebelumnya tidak ada di allow-list)
- [x] `src/app/(customer)/[tableId]/checkout/page.tsx`: pesanan online kini
  dibuat dengan `paymentMethod: 'QRIS'` (sebelumnya selalu tersimpan `CASH`)
- [x] `src/lib/pakasir-fulfillment.ts`: sandbox di production diberi
  `console.warn` + opsi `PAKASIR_ALLOW_SANDBOX_FULFILLMENT="true"` untuk testing

## Verifikasi (end-to-end ke Pakasir asli)
- [x] `npx tsc --noEmit` OK, `npx eslint` OK, `npm run build` EXIT=0
- [x] `GET /api/payments/health` → `ok: true` (env lengkap, tabel ada, Pakasir reachable, 10 fee)
- [x] `POST /api/payments {method:"qris", planId:"starter"}` → **201** +
  `qrString`, `txnId`, `fee`, `totalPayment`
- [x] `GET /api/payments/[orderId]` → 200, `synced: true`
- [x] `POST /api/payments/[orderId]/cancel` → 502 `PAKASIR_REJECTED`
  (`pakasirStatus: 503`) — Pakasir sendiri yang sedang error nginx; classifier
  melaporkan penyebab aslinya, tidak lagi pesan generik
- [x] Baris transaksi uji coba dihapus dari DB (sisa 0 baris)

## Temuan Penting
- [ ] **API key Pakasir yang dipakai masih SANDBOX** (`isSandbox: true`,
  `qrString: "lorem-ipsum-pakasir-qris-example"`, tidak bisa di-scan). Untuk
  pembayaran nyata ganti ke API key production Pakasir.
- [ ] Selama key masih sandbox, pesanan di production **tidak** otomatis menjadi
  `BEING_PREPARED` (pengaman `isSandbox && isProd`). Set
  `PAKASIR_ALLOW_SANDBOX_FULFILLMENT="true"` bila memang uji coba di production.