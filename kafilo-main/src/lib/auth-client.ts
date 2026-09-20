// =============================================================
// Auth Helpers — CLIENT SIDE (untuk Client Components)
// Decode JWT payload tanpa verifikasi (verifikasi di server)
// =============================================================

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

const SESSION_COOKIE = "pos_session";

/**
 * Decode base64url ke string
 */
function base64UrlDecode(str: string): string {
  // Convert base64url ke base64 standard
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Tambah padding jika perlu
  while (base64.length % 4) base64 += "=";
  try {
    return atob(base64);
  } catch {
    return "";
  }
}

/**
 * Ambil session dari cookie JWT (Client Component).
 * Decode payload dari JWT tanpa verify — verify dilakukan di server.
 */
export function getSessionClient(): SessionUser | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SESSION_COOKIE}=`))
      ?.split("=")[1];

    if (!raw) return null;

    // JWT format: header.payload.signature
    const parts = raw.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (bagian ke-2 dari JWT)
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    return {
      id: payload.sub || "",
      name: payload.name || "",
      username: payload.username || "",
      role: payload.role || "",
    };
  } catch {
    return null;
  }
}
