// =============================================================
// lib/env.ts — Validasi environment variable terpusat
// Semua akses env Pakasir HANYA dari server. File ini diimpor
// oleh server-only code (lib/pakasir.ts & route handlers).
// Melempar error jelas jika ada yang kosong.
// =============================================================

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] ${name} belum di-set. Tambahkan ke .env / .env.local lalu restart server.`
    );
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") return fallback;
  return value.trim();
}

export interface PakasirEnv {
  slug: string;
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
}

/**
 * Ambil & validasi env Pakasir. Panggil hanya dari server
 * (route handler / server action / lib server-only).
 * @throws Error jika PAKASIR_SLUG / PAKASIR_API_KEY /
 * PAKASIR_WEBHOOK_SECRET kosong.
 */
export function getPakasirEnv(): PakasirEnv {
  return {
    slug: required("PAKASIR_SLUG"),
    apiKey: required("PAKASIR_API_KEY"),
    webhookSecret: required("PAKASIR_WEBHOOK_SECRET"),
    baseUrl: optional("PAKASIR_BASE_URL", "https://app.pakasir.com").replace(
      /\/+$/,
      ""
    ),
  };
}

/**
 * Validasi env inti saat boot server. Hanya mewajibkan variabel
 * yang benar-benar dipakai: DATABASE_URL, JWT_SECRET, PAKASIR_*.
 */
export function assertServerEnv(): void {
  required("DATABASE_URL");
  required("JWT_SECRET");
  getPakasirEnv();
}
