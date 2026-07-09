import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "POS F&B — Point of Sale",
    template: "%s | POS F&B",
  },
  description: "Aplikasi Point of Sale untuk bisnis Food & Beverage. Kelola produk, kasir, dan transaksi dengan mudah.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS F&B",
  },
  keywords: ["pos", "point of sale", "kasir", "fnb", "food and beverage"],
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={geist.className}>{children}</body>
    </html>
  );
}
