// =============================================================
// Auth Helpers — JWT Signed Session
// Menggunakan `jose` untuk sign & verify session cookie
// =============================================================

import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// ─── Type Definitions ───────────────────────────────────────

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

// ─── Cookie Keys ─────────────────────────────────────────────

const SESSION_COOKIE = "pos_session";

// ─── JWT Secret ──────────────────────────────────────────────

function getSessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "kofilo-pwa-jwt-secret-2026-randomsalt-change-in-production";
  return new TextEncoder().encode(secret);
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Ambil session dari cookie (Server Component / Route Handler).
 * Memverifikasi JWT signature — jika tamper, return null.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) {
      return null;
    }

    // Verify JWT signature
    const { payload } = await jwtVerify(raw, getSessionSecret());
    
    return {
      id: payload.sub as string,
      name: payload.name as string,
      username: payload.username as string,
      role: payload.role as Role,
    };
  } catch (e) {
    // Jika JWT tidak valid / expired / tamper
    console.error("[getSession] JWT verification failed:", e);
    return null;
  }
}

/**
 * Serialize session ke JWT signed string.
 * Expire: 8 jam (sama dengan maxAge cookie)
 */
export async function serializeSession(user: SessionUser): Promise<string> {
  return await new SignJWT({
    name: user.name,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSessionSecret());
}

/**
 * Cek apakah user memiliki role tertentu
 */
export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
