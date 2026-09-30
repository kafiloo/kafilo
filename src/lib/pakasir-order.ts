// =============================================================
// lib/pakasir-order.ts — helper order_id unik untuk Pakasir
// Format: KF-<yyyymmddHHMMss>-<6 random alnum uppercase>
// Idempotent: order_id + body sama -> respons sama di Pakasir.
// =============================================================

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function generatePakasirOrderId(prefix = "KF"): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}-${stamp}-${randomSuffix(6)}`;
}
