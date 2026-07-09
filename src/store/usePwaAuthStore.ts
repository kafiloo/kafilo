// =============================================================
// Store: usePwaAuthStore
// Zustand store untuk session pelanggan PWA (login via nomor HP)
// Persisted ke localStorage agar tidak hilang saat refresh
// =============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PwaCustomer {
  id: string;
  name: string;
  phone: string;
  points: number;
  token: string;
}

interface PwaAuthStore {
  customer: PwaCustomer | null;
  setCustomer: (customer: PwaCustomer) => void;
  clearCustomer: () => void;
  isLoggedIn: () => boolean;
}

export const usePwaAuthStore = create<PwaAuthStore>()(
  persist(
    (set, get) => ({
      customer: null,

      setCustomer: (customer) => set({ customer }),

      clearCustomer: () => set({ customer: null }),

      isLoggedIn: () => !!get().customer?.token,
    }),
    {
      name: "pwa-auth", // key di localStorage
    }
  )
);
