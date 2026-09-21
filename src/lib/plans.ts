// =============================================================
// Paket Kofilo bertrali untuk landing page checkout / nota
// =============================================================

export type PlanId = "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** harga per bulan (Rp) */
  price: number;
  features: string[];
  unavailable?: string[];
  highlight?: boolean;
  cta?: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Sempurna untuk kafe yang baru merintis bisnis.",
    price: 350000,
    features: [
      "1 Akses Kasir Utama (Admin)",
      "Manajemen Menu & Stok Dasar",
      "Struk Thermal Standar",
    ],
    unavailable: ["Tanpa Fitur PWA (QR Order)", "Tanpa Loyalty Hub Otomatis"],
    cta: "Buy Paket Starter",
  },
  {
    id: "pro",
    name: "Kofilo Pro",
    tagline: "Otomatisasi penuh untuk kafe yang sangat ramai.",
    price: 500000,
    highlight: true,
    features: [
      "Semua kehebatan Starter",
      "PWA QR Ordering (Self-Order)",
      "Loyalty Hub & Poin Otomatis",
      "Akses Multi-User (Super Admin)",
      "Kustomisasi Struk Lengkap",
      "Prioritas Support 24/7",
    ],
    cta: "Buy Kofilo Pro",
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Format Rp tanpa desimal, e.g. 350000 -> "350.000" */
export function formatRp(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** Format dengan Rp prefix: "Rp 500.000" */
export function formatRpFull(amount: number): string {
  return `Rp ${formatRp(amount)}`;
}

// =============================================================
// Tipe pesanan yang di-persist di localStorage (key: kofilo_order)
// =============================================================

export interface KofiloOrder {
  orderId: string;
  planId: PlanId;
  planName: string;
  amount: number;
  /** 'QRIS' | 'BANK' | 'CARD' */
  method: string;
  methodLabel: string;
  date: string;
  time: string;
  customerName?: string;
  email?: string;
  phone?: string;
  status: "PAID";
}

export const ORDER_STORAGE_KEY = "kofilo_order";

export function saveOrder(order: KofiloOrder): void {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // localStorage tidak tersedia — jangan crash
  }
}

export function loadOrder(): KofiloOrder | null {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as KofiloOrder;
  } catch {
    return null;
  }
}

export function clearOrder(): void {
  try {
    localStorage.removeItem(ORDER_STORAGE_KEY);
  } catch {
    // noop
  }
}

export function generateOrderId(): string {
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `KF-${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}-${
    Math.floor(Math.random() * 900000) + 100000
  }`;
}