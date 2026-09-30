// =============================================================
// stores/checkout-store.ts — state checkout Pakasir (client)
// Metode terpilih, data pembayaran, status, error, loading.
// Polling ke endpoint internal /api/payments (min 4 dtk).
// =============================================================

"use client";

import { create } from "zustand";

export type CheckoutMethod =
  | "payment_link"
  | "qris"
  | "bri_va"
  | "bni_va"
  | "cimb_niaga_va"
  | "permata_va"
  | "maybank_va"
  | "bnc_va"
  | "artha_graha_va"
  | "atm_bersama_va"
  | "sampoerna_va";

export interface CheckoutPayment {
  orderId: string;
  pwaOrderId: string | null;
  txnId: string;
  method: string;
  amount: number;
  fee: number;
  totalPayment: number;
  status: "PENDING" | "COMPLETED" | "CANCELED";
  paymentLink: string | null;
  qrString: string | null;
  vaNumber: string | null;
  expiredAt: string | null;
  isSandbox: boolean;
  completedAt: string | null;
}

export type CheckoutStatus = "idle" | "creating" | "pending" | "completed" | "canceled" | "error";

interface CheckoutState {
  method: CheckoutMethod | null;
  payment: CheckoutPayment | null;
  status: CheckoutStatus;
  error: string | null;
  fees: Record<string, number>;
  feesLoading: boolean;
  setMethod: (m: CheckoutMethod | null) => void;
  loadFees: (amount: number) => Promise<void>;
  createPayment: (args: {
    method: CheckoutMethod;
    pwaOrderId?: string;
    planId?: string;
    qrisOnly?: boolean;
    redirectUrl?: string;
  }) => Promise<CheckoutPayment | null>;
  refreshStatus: () => Promise<void>;
  cancelPayment: () => Promise<void>;
  reset: () => void;
}

const POLL_MIN_MS = 4_000;
let lastPollAt = 0;

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  method: null,
  payment: null,
  status: "idle",
  error: null,
  fees: {},
  feesLoading: false,

  setMethod: (m) => set({ method: m, error: null }),

  loadFees: async (amount) => {
    if (!Number.isInteger(amount) || amount <= 0) return;
    set({ feesLoading: true });
    try {
      const res = await fetch(`/api/payments/fees?amount=${amount}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.fees && typeof data.fees === "object") {
        set({ fees: data.fees as Record<string, number> });
      }
    } catch {
      // fees opsional — abaikan agar checkout tetap jalan
    } finally {
      set({ feesLoading: false });
    }
  },

  createPayment: async ({ method, pwaOrderId, planId, qrisOnly, redirectUrl }) => {
    set({ status: "creating", error: null, method });
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, pwaOrderId, planId, qrisOnly, redirectUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message: string = data.message ?? "Gagal membuat pembayaran.";
        const detail: string | null = typeof data.detail === "string" ? data.detail : null;
        const reason: string | null = typeof data.reason === "string" ? data.reason : null;
        // Jejak teknis untuk developer/owner (buka console browser).
        console.error("[checkout] gagal membuat pembayaran", {
          reason,
          missing: data.missing,
          pakasirStatus: data.pakasirStatus,
          detail,
        });
        set({
          status: "error",
          error: detail ? `${message} — ${detail}` : message,
        });
        return null;
      }
      const payment = data.payment as CheckoutPayment;
      set({
        payment,
        status: payment.status === "PENDING" ? "pending" : "idle",
      });
      lastPollAt = Date.now();
      return payment;
    } catch {
      set({ status: "error", error: "Koneksi gagal. Silakan coba lagi." });
      return null;
    }
  },

  refreshStatus: async () => {
    const { payment } = get();
    if (!payment) return;
    // Patuhi rate limit sinkronisasi (min 4 detik).
    if (Date.now() - lastPollAt < POLL_MIN_MS) return;
    lastPollAt = Date.now();
    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(payment.orderId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const updated = data.payment as CheckoutPayment;
      set({
        payment: updated,
        status:
          updated.status === "COMPLETED"
            ? "completed"
            : updated.status === "CANCELED"
              ? "canceled"
              : "pending",
      });
    } catch {
      // polling gagal sekali — biarkan interval berikutnya mencoba lagi
    }
  },

  cancelPayment: async () => {
    const { payment } = get();
    if (!payment) return;
    try {
      const res = await fetch(
        `/api/payments/${encodeURIComponent(payment.orderId)}/cancel`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        set({ error: data.message ?? "Gagal membatalkan pembayaran." });
        return;
      }
      set({ status: "canceled" });
      await get().refreshStatus();
    } catch {
      set({ error: "Koneksi gagal saat membatalkan." });
    }
  },

  reset: () =>
    set({
      method: null,
      payment: null,
      status: "idle",
      error: null,
      fees: {},
    }),
}));
