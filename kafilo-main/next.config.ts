// =============================================================
// next.config.ts — Next.js + PWA Configuration
// =============================================================

import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// next-pwa tidak punya ESM default export yang mulus di Next.js 15,
// import dengan require untuk kompatibilitas
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",           // service worker di-output ke /public
  register: true,           // auto-register service worker
  skipWaiting: true,        // langsung aktifkan SW baru tanpa tunggu
  disable: process.env.NODE_ENV === "development", // nonaktifkan di dev
  runtimeCaching: [
    {
      // Cache API calls (produk, order)
      urlPattern: /^\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 menit
        },
      },
    },
    {
      // Cache static assets
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // Izinkan gambar dari domain eksternal jika pakai URL gambar
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Matikan X-Powered-By header
  poweredByHeader: false,
};

export default withPWA(nextConfig);
