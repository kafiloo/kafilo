// =============================================================
// Lib: PWA JWT Helpers
// Sign & verify JWT untuk Customer (pelanggan PWA)
// Menggunakan `jose` yang kompatibel dengan Next.js Edge Runtime
// =============================================================

import { SignJWT, jwtVerify } from "jose";

// Payload yang disimpan di dalam token
export interface PwaTokenPayload {
  sub: string;   // customerId
  phone: string;
  name: string;
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tidak di-set di environment variables!");
  }
  return new TextEncoder().encode(secret);
};

/**
 * Sign JWT untuk customer PWA
 * Expire: 30 hari
 */
export async function signPwaToken(payload: PwaTokenPayload): Promise<string> {
  return await new SignJWT({ phone: payload.phone, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

/**
 * Verify JWT dan kembalikan payload
 * Throw error jika token tidak valid / expired
 */
export async function verifyPwaToken(token: string): Promise<PwaTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());

  return {
    sub: payload.sub as string,
    phone: payload.phone as string,
    name: payload.name as string,
  };
}

/**
 * Ambil token dari Authorization header: "Bearer <token>"
 * Return null jika tidak ada
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
