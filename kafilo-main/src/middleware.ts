// =============================================================
// Middleware -- RBAC (Role-Based Access Control)
// File ini dijalankan SEBELUM setiap request masuk ke halaman/API
// Menggunakan JWT verify untuk memvalidasi session cookie
// =============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// --- Route Configuration ---

/** Route yang hanya bisa diakses oleh SUPER_ADMIN & MANAGER */
const ADMIN_ROUTES = ["/cms"];

/** Route yang hanya bisa diakses oleh CASHIER (atau semua role yang login) */
const CASHIER_ROUTES = ["/cashier"];

/**
 * Route publik -- tidak perlu autentikasi POS sama sekali.
 * Termasuk semua route PWA pelanggan dan API publik PWA.
 */
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  // API PWA publik
  "/api/v1/pwa/menus",
  "/api/v1/pwa/auth",
  "/api/v1/pwa/orders",
  // 🔥 PERBAIKAN: Buka akses API master data agar PWA Customer bisa mengambil menu
  "/api/products",
  "/api/categories",
  "/api/public"
];

// --- JWT Verify Helper ---

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "kofilo-pwa-jwt-secret-2026-randomsalt-change-in-production";
  return new TextEncoder().encode(secret);
}

async function verifySessionCookie(cookieValue: string): Promise<{ role: string } | null> {
  try {
    const { payload } = await jwtVerify(cookieValue, getSecret());
    return { role: payload.role as string };
  } catch {
    return null;
  }
}

// --- Middleware Function ---

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati semua route API PWA publik
  if (pathname.startsWith("/api/v1/pwa")) return NextResponse.next();

  // Lewati halaman customer (dinamis /{tableId}/menu, /{tableId}/cart, dll)
  // Pola: segment pertama bukan keyword admin/cashier/cms/login/api
  const firstSegment = pathname.split("/")[1];
  const SYSTEM_SEGMENTS = ["cms", "cashier", "api", "login", "_next", "favicon.ico", "icons", "public"];
  if (firstSegment && !SYSTEM_SEGMENTS.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Lewati route publik
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isPublicRoute) return NextResponse.next();

  // Cek session cookie POS
  const sessionCookie = request.cookies.get("pos_session")?.value;

  // Jika tidak ada session -- redirect ke login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify JWT session — jika tamper/expired, redirect ke login
  const session = await verifySessionCookie(sessionCookie);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.role;

  // 🔥 Guard Admin Routes (Untuk Super Admin & Manager) 🔥
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  if (isAdminRoute) {
    // 1. Jika bukan Super Admin atau Manager, tendang ke halaman kasir
    if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
      return NextResponse.redirect(new URL("/cashier", request.url));
    }

    // 2. Khusus MANAGER: Jika mencoba mengakses User Access (/cms/users), tendang ke dashboard
    if (pathname.startsWith("/cms/users") && role === "MANAGER") {
      return NextResponse.redirect(new URL("/cms/dashboard", request.url));
    }
  }

  // Guard Cashier Routes (Semua role boleh jadi kasir)
  const isCashierRoute = CASHIER_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isCashierRoute && role !== "CASHIER" && role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Matcher -- jalankan middleware untuk semua route kecuali static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-).*)",
  ],
};
