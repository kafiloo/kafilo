This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Pembayaran Online — Pakasir API v2

Integrasi server-side ke Pakasir v2 (QRIS, Virtual Account bank,
payment link). API key tidak pernah masuk ke client bundle.

### 1. Isi environment variable

Salin ke `.env` / `.env.local` (jangan commit file berisi secret):

```bash
PAKASIR_SLUG="slug-project-anda"
PAKASIR_API_KEY="api-key-anda"
PAKASIR_WEBHOOK_SECRET="webhook-secret-anda"
PAKASIR_BASE_URL="https://app.pakasir.com"
```

Validasi terpusat di `src/lib/env.ts` — server melempar error jelas
bila ada yang kosong.

### 2. Jalankan migrasi Prisma

```bash
npx prisma migrate dev     # lokal: menerapkan 20260930073131_add_pakasir_payments
npx prisma migrate deploy  # DB tujuan yang sudah ada (production/Neon)
npx prisma generate
```

`npm run build` juga otomatis menjalankan `prisma migrate deploy` lebih dulu,
jadi setiap deploy ke Vercel akan menyinkronkan tabel `pakasir_payments`.
Tanpa langkah ini, `POST /api/payments` akan gagal 500
(`reason: "DB_MIGRATION_REQUIRED"`).

### 3. Set Webhook URL di dashboard Pakasir

1. Buka dashboard Pakasir → pengaturan webhook/notifikasi.
2. Isi Webhook URL dengan:
   `https://<domain-anda>/api/webhooks/pakasir`
3. Salin secret yang tampil ke `PAKASIR_WEBHOOK_SECRET`.
4. Pastikan header `X-Secret` dikirim Pakasir di setiap webhook.

### 4. Uji lokal (webhook butuh URL publik)

Jalankan dev server lalu expose lewat tunnel agar Pakasir bisa
memanggil webhook lokal:

```bash
npm run dev
# opsi A (ngrok): ngrok http 3000
# opsi B (cloudflared): cloudflared tunnel --url http://localhost:3000
```

Lalu set Webhook URL di dashboard ke
`https://<url-tunnel>/api/webhooks/pakasir` dan buat pembayaran
sandbox. Cek log server + `npx prisma studio` (tabel
`pakasir_payments`) untuk memastikan status berubah COMPLETED.

### Endpoint internal

| Method | Path | Keterangan |
| ------ | ---- | ---------- |
| GET | `/api/payments/health` | **Diagnosa**: status env, tabel DB, dan koneksi Pakasir. Buka di browser. |
| POST | `/api/payments` | Buat transaksi. Body: `{ method, pwaOrderId }` (checkout PWA, nominal = totalAmount PwaOrder) atau `{ method, planId }` (checkout langganan, nominal = harga paket di server). Tidak ada `amount` dari client. |
| GET | `/api/payments/[orderId]` | Status dari DB + sinkronisasi max 1x/4 dtk |
| POST | `/api/payments/[orderId]/cancel` | Batalkan bila masih PENDING |
| GET | `/api/payments/fees?amount=` | Estimasi biaya per metode |
| POST | `/api/webhooks/pakasir` | Webhook (verifikasi `X-Secret`, balas 200) |

### Alur checkout PWA (meja)

1. Pelanggan isi keranjang → halaman `/{tableId}/checkout`.
2. Pilih **Pay at Cashier** (CASH): `POST /api/v1/pwa/orders` langsung, selesai.
3. Pilih **Online (QRIS / VA)**:
   a. Aplikasi memanggil `POST /api/v1/pwa/orders` dulu untuk membuat
      `PwaOrder` (status `PENDING_CONFIRMATION`, nominal dihitung server).
   b. `PakasirCheckoutPanel` memanggil `POST /api/payments`
      (`{ method, pwaOrderId }`) → tampilkan QR / nomor VA / payment link.
   c. Pelanggan membayar. `PwaOrder` otomatis menjadi `BEING_PREPARED`
      lewat webhook (`POST /api/webhooks/pakasir`) atau sinkronisasi
      `GET /api/payments/[orderId]` — keduanya via
      `src/lib/pakasir-fulfillment.ts` (kurangi stok + update status atomik).
   d. Frontend redirect ke `/{tableId}/order-status?orderId=...`.

### Alur checkout langganan (landing page)

Halaman `/landingpage/checkout?plan=starter|pro` memakai `POST /api/payments`
dengan `{ method, planId }` (harga dari `src/lib/plans.ts` di server).
Saat status `completed`, order disimpan ke localStorage dan pengguna
diarahkan ke `/landingpage/berhasil`.

Variabel env yang dipakai hanya: `DATABASE_URL`, `JWT_SECRET`, `PAKASIR_*`.
Tidak ada ongkir — total pesanan = subtotal item + pajak/biaya toko.

### Cek sehat / troubleshooting

Buka `https://<domain-anda>/api/payments/health` di browser. Contoh hasil normal:

```json
{
  "ok": true,
  "env": { "PAKASIR_SLUG": true, "PAKASIR_API_KEY": true, "PAKASIR_WEBHOOK_SECRET": true,
           "DATABASE_URL": true, "JWT_SECRET": true, "missing": [] },
  "db": { "reachable": true, "pakasirPaymentsTable": true, "pendingPayments": 0 },
  "pakasir": { "reachable": true, "feeCount": 10 }
}
```

Jika `ok: false`, cocokkan dengan tabel berikut:

| Gejala di `/health` | Penyebab | Tindakan |
| --- | --- | --- |
| `env.missing` berisi nama variabel | Env belum di-set di server | Set di Vercel → Settings → Environment Variables, lalu redeploy |
| `db.pakasirPaymentsTable: false` | Migrasi belum di-deploy | `npx prisma migrate deploy` (atau deploy ulang, `build` sudah otomatis migrate) |
| `db.reachable: false` | `DATABASE_URL` salah / DB mati | Periksa connection string & status Neon |
| `pakasir.reachable: false` | Base URL / jaringan | Periksa `PAKASIR_BASE_URL` (default `https://app.pakasir.com`) |

`POST /api/payments` juga mengembalikan field `reason` + `detail` agar penyebab
langsung terbaca: `ENV_MISSING`, `DB_MIGRATION_REQUIRED`, `DB_UNREACHABLE`,
`PAKASIR_REJECTED` (beserta `pakasirStatus`), `PAKASIR_UNREACHABLE`,
`AMOUNT_OUT_OF_RANGE`. Detail teknis juga muncul di console browser (prefix
`[checkout]`) dan di log server Vercel.

> **Penting — API key sandbox.** Pakasir mengembalikan `isSandbox: true` bila
> key yang dipakai masih sandbox. Dampaknya: `qrString` hanya contoh
> (`lorem-ipsum-pakasir-qris-example`, tidak bisa di-scan) dan pembayaran
> **tidak** memenuhi pesanan di production (pengaman anti "uang palsu").
> Untuk terima pembayaran nyata, ganti ke API key **production** Pakasir.
> Kalau memang sedang uji coba di production, set
> `PAKASIR_ALLOW_SANDBOX_FULFILLMENT="true"` supaya pesanan tetap diproses.

### Komponen frontend

- `src/stores/checkout-store.ts` — state checkout (Zustand).
- `src/components/customer/PakasirMethodPicker.tsx` — pilih metode + fee.
- `src/components/customer/PakasirPaymentView.tsx` — QR/VA/link + polling 5 dtk.
- `src/components/customer/PakasirCheckoutPanel.tsx` — contoh panel siap pakai.

