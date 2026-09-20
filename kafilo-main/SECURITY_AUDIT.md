# 🔐 Security Audit Report — Kofilo POS-FNB

**Tanggal Audit:** 29 Juni 2026  
**Tipe Audit:** Static Code Review (Source Code)  
**Target:** Proyek POS-FNB (Next.js + Prisma + PostgreSQL)

---

## 📋 RINGKASAN EKSEKUTIF

| Level | Jumlah |
|-------|--------|
| 🔴 **CRITICAL** | 1 |
| 🟠 **HIGH** | 4 |
| 🟡 **MEDIUM** | 5 |
| 🔵 **LOW** | 3 |

**TOTAL KERENTANAN:** 13

---

## 🔴 CRITICAL

### C-01: Session Cookie Tidak di-Sign (Plain JSON Tamper-able)

**Lokasi:** `src/lib/auth.ts` (line 52-54), `src/middleware.ts` (line 65-71), `src/app/api/auth/login/route.ts` (line 50-68)

**Deskripsi:**
Session cookie `pos_session` disimpan sebagai **plain JSON string** TANPA signature kriptografis. Siapa pun yang memiliki akses ke cookie bisa memodifikasi nilai-nya (misalnya mengganti `role: "CASHIER"` menjadi `role: "SUPER_ADMIN"`) dan server akan menerimanya sebagai valid.

```typescript
// auth.ts line 52-54 — TIDAK ADA ENKRIPSI ATAU SIGNATURE
export function serializeSession(user: SessionUser): string {
  return JSON.stringify(user);  // ❌ Plain JSON, bisa diedit siapa saja
}
```

**Dampak:**
- Privillege Escalation: User CASHIER bisa mengubah cookie menjadi SUPER_ADMIN
- Akses penuh ke semua halaman CMS dan data sensitif
- Bisa membuat user baru, menghapus data, mengubah setting toko

**Rekomendasi:**
1. Gunakan JWT signing untuk session cookie
2. Implementasi: `jose` sudah ada di dependencies, bisa digunakan untuk sign `pos_session`
3. Verifikasi signature di middleware dan server-side

---

## 🟠 HIGH

### H-01: Tidak Ada Rate Limiting / Brute Force Protection

**Lokasi:** `src/app/api/auth/login/route.ts`, `src/app/api/v1/pwa/auth/login/route.ts`

**Deskripsi:**
Endpoint login (POS maupun PWA) tidak memiliki mekanisme rate limiting atau account lockout. Attacker bisa melakukan **brute force attack** tanpa batasan.

**Dampak:**
- Brute force password / credential stuffing
- Akun bisa diambil alih jika password lemah
- Tidak ada logging failed attempt yang bisa dipantau

**Rekomendasi:**
1. Implementasi rate limiting (contoh: Upstash Ratelimit, atau database-based)
2. Lockout setelah N failed attempts
3. Log semua failed login attempt
4. Minimum password complexity

### H-02: Debug Endpoint Mengekspos Session + Cookie

**Lokasi:** `src/app/api/auth/debug/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const session = await getSession();
  return NextResponse.json({
    hasSession: !!session,
    session,
    cookies: req.headers.get("cookie") || "no cookies",  // ❌ Ekspos cookie mentah
  });
}
```

**Deskripsi:**
Endpoint `/api/auth/debug` mengembalikan session user beserta raw cookie header. Ini bisa menjadi **information disclosure** jika endpoint ini tidak dilindungi dengan otentikasi atau ter-expose di production.

**Dampak:**
- Attacker bisa mencuri session cookie dari response
- Informasi sensitif tentang user dan session ter-expose

**Rekomendasi:**
1. Hapus endpoint debug di production
2. Atau proteksi dengan environment variable `NODE_ENV !== 'production'`
3. Jangan kembalikan cookies mentah

### H-03: JWT_SECRET Lemah & Hardcoded di .env File

**Lokasi:** `.env` (line 4)

```
JWT_SECRET="kofilo-pwa-jwt-secret-2026-randomsalt-change-in-production"
```

**Deskripsi:**
JWT_SECRET masih menggunakan placeholder/development value. Jika .env tercatat di git atau ter-expose, semua JWT token yang ada bisa di-forge (dipalsukan).

**Dampak:**
- Attacker bisa membuat token PWA palsu untuk customer mana pun
- Akses tidak sah ke endpoint PWA (order, payment, points)
- Data pelanggan bisa dimanipulasi

**Rekomendasi:**
1. Generate random 256-bit key (64 karakter hex)
2. Gunakan `openssl rand -hex 64` atau `crypto.randomBytes(32).toString('hex')`
3. Pastikan .env **TIDAK** tercatat di git (cek .gitignore)
4. Rotasi key secara berkala

### H-04: API Key Terlihat di .env (Potensi Exposure Git)

**Lokasi:** `.env` (lines 7-16)

```
RAJAONGKIR_API_KEY="NgQgiMwx8f4bb4c4b5b9353blaV3bscI"
KOMERCE_PAYMENT_API_KEY="RAba8JIb8f4bb4c4b5b9353bhw9PjPoz"
QRISLY_API_KEY="RAba8JIb8f4bb4c4b5b9353bhw9PjPoz"
```

**Deskripsi:**
API Key untuk RajaOngkir, Komerce Payment, dan QRISLY hardcoded di file `.env`. Jika file ini tercatat di git history, key akan terekspos publik.

**Dampak:**
- Orang lain bisa menggunakan API key untuk mengakses layanan berbayar
- Penyalahgunaan endpoint shipping/payment
- Biaya tambahan di pihak pemilik API key

**Rekomendasi:**
1. Gunakan environment variable di Vercel dashboard (production)
2. Rotasi semua API key yang sudah terekspos
3. Verifikasi .gitignore sudah include `.env`

---

## 🟡 MEDIUM

### M-01: PWA Order Bisa Dibuat Tanpa Customer Valid (Fallback Unsafe)

**Lokasi:** `src/app/api/v1/pwa/orders/route.ts` (lines 177-188)

```typescript
try {
  pwaOrder = await prisma.pwaOrder.create({ data: { ..., customerId: customerPayload.sub, ... } });
} catch (createErr) {
  // ❌ FALLBACK: Create order WITHOUT customerId jika gagal
  pwaOrder = await prisma.pwaOrder.create({
    data: { ..., customerId: undefined, ... }  // Tanpa identitas customer
  });
}
```

**Deskripsi:**
Jika pembuatan PWA Order gagal (misalnya karena foreign key constraint customer tidak valid), fallback-nya membuat order tanpa `customerId`. Ini berarti order bisa dibuat **tanpa customer terautentikasi**, membuka celah untuk bypass autentikasi.

**Dampak:**
- Attacker bisa membuat order tanpa token valid
- Abuse loyalty points (karena tidak terikat customer)
- Tidak bisa melacak order ke customer tertentu

**Rekomendasi:**
1. Hapus fallback `customerId: undefined`
2. Validasi customerId sebelum create
3. Jangan swallow error — kembalikan 500 jika validasi gagal

### M-02: Tidak Ada CSRF Protection

**Lokasi:** Seluruh aplikasi

**Deskripsi:**
Tidak ada CSRF token atau proteksi terhadap Cross-Site Request Forgery. Semua form dan API endpoint menerima request tanpa memvalidasi asal request.

**Dampak:**
- Attacker bisa membuat user (dengan session valid) melakukan aksi yang tidak diinginkan
- Perubahan data tanpa sepengetahuan user

**Rekomendasi:**
1. Implementasi CSRF token untuk form submission
2. Gunakan `SameSite: "strict"` secara default untuk cookie (saat ini `lax`)
3. Validasi Origin/Referer header di server-side

### M-03: Cookie `secure` Hanya di Production

**Lokasi:** `src/app/api/auth/login/route.ts` (line 64)

```typescript
secure: process.env.NODE_ENV === "production",
```

**Deskripsi:**
Cookie session hanya di-set dengan flag `secure` di production. Di development environment, cookie dikirim via HTTP tanpa enkripsi.

**Dampak:**
- Session bisa di-curi via Man-in-the-Middle (MitM) di jaringan lokal
- Jika development server di-expose ke internet, sangat berbahaya

**Rekomendasi:**
1. Selalu set `secure: true` (kecuali development lokal strict)
2. Atau gunakan `secure: process.env.NODE_ENV === "production" || process.env.FORCE_HTTPS === "true"`

### M-04: Input Items di PWA Order Tidak Validasi Tipe Data Ketat

**Lokasi:** `src/app/api/v1/pwa/orders/route.ts` (lines 25-36)

**Deskripsi:**
Data `items` dari body request hanya divalidasi tipenya (array), tapi item individual tidak divalidasi secara ketat. Contoh: `price` bisa berupa string atau angka, `quantity` bisa negatif, `productId` bisa tidak valid.

**Dampak:**
- Harga bisa dimanipulasi jika `item.price >= dbPrice` (line 103)
- Quantity negatif bisa menyebabkan perhitungan total aneh
- Potensi JSON injection atau type confusion

**Rekomendasi:**
1. Validasi tiap field item: `quantity` harus > 0, `price` harus number, `productId` harus string valid
2. Gunakan library seperti zod untuk schema validation
3. Jangan trust `item.price` dari frontend sepenuhnya

### M-05: Tidak Ada Audit Logging

**Lokasi:** Seluruh aplikasi

**Deskripsi:**
Tidak ada sistem logging untuk aktivitas keamanan seperti: login sukses, login gagal, perubahan data sensitif, akses ke debug endpoint, dll.

**Dampak:**
- Tidak bisa mendeteksi serangan brute force secara proaktif
- Tidak ada forensik jika terjadi insiden keamanan
- Sulit melakukan troubleshooting

**Rekomendasi:**
1. Implementasi audit log untuk: login attempt, perubahan role, perubahan store settings
2. Simpan log di database terpisah atau gunakan layanan seperti Logtail/Axiom

---

## 🔵 LOW

### L-01: Tidak Ada Validasi Origin/CORS

**Deskripsi:**
Tidak ada konfigurasi CORS yang membatasi origin mana yang bisa mengakses API. Meskipun Next.js sudah memiliki proteksi dasar, best practice adalah mengkonfigurasi CORS secara eksplisit.

**Rekomendasi:**
1. Di middleware, validasi Origin header untuk API endpoints
2. Atau gunakan konfigurasi CORS di `next.config.ts`

### L-02: Password Complexity Tidak Diterapkan

**Deskripsi:**
Tidak ada validasi minimum password strength untuk user creation atau update password.

**Rekomendasi:**
1. Implementasi minimum password: 8 karakter, kombinasi huruf besar/kecil, angka, simbol
2. Gunakan library seperti zxcvbn untuk password strength estimation

### L-03: Versi Dependencies Perlu Review

**Deskripsi:**
Beberapa dependency mungkin memiliki CVE yang diketahui. Review berkala diperlukan.

**Rekomendasi:**
1. Jalankan `npm audit` secara berkala
2. Update dependency ke versi patch terbaru
3. Pertimbangkan menggunakan Dependabot atau Snyk

---

## ✅ REKOMENDASI PRIORITAS

| Priority | Action | Timeline |
|----------|--------|----------|
| 🔴 **P1** | Ganti session cookie jadi JWT signed | Segera |
| 🟠 **P2** | Hapus / proteksi debug endpoint | Segera |
| 🟠 **P3** | Generate JWT_SECRET baru + rotasi API keys | Hari ini |
| 🟠 **P4** | Implementasi rate limiting login | Hari ini |
| 🟡 **P5** | Perbaiki fallback unsafe di PWA order | Hari ini |
| 🟡 **P6** | CSRF protection + secure cookie hardening | Minggu ini |
| 🟡 **P7** | Input validation dengan schema library | Minggu ini |
| 🔵 **P8** | Audit log + monitoring | Minggu ini |

---

## 📊 KESIMPULAN

Proyek **Kofilo POS-FNB** memiliki kerentanan **KRITIS** pada mekanisme autentikasi yang menggunakan plain JSON untuk session cookie tanpa signature. Ini adalah **celah paling berbahaya** yang memungkinkan privilege escalation total.

Beberapa kerentanan **HIGH** lainnya (no rate limiting, debug endpoint exposure, hardcoded secrets) juga perlu segera ditangani sebelum aplikasi digunakan di production.

**Total: 70% kerentanan bisa diperbaiki dalam 1-2 hari kerja** dengan prioritas pada implementasi JWT signing, rate limiting, dan input validation.

---

*Laporan ini dibuat berdasarkan static code analysis pada 29 Juni 2026. Review tambahan (penetration testing) disarankan setelah perbaikan dilakukan.*