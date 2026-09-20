'use client';

// =============================================================
// Component: LoyaltyWidget
// Floating widget di sudut bawah kanan PWA
// - Belum login: tampilkan icon + teks, klik buka AuthDrawer
// - Sudah login: tampilkan nama customer + poin
// =============================================================

import { usePwaAuthStore } from '@/store/usePwaAuthStore';

interface LoyaltyWidgetProps {
  onOpenAuth: () => void;
}

export default function LoyaltyWidget({ onOpenAuth }: LoyaltyWidgetProps) {
  const { customer, isLoggedIn } = usePwaAuthStore();
  const loggedIn = isLoggedIn();

  if (loggedIn && customer) {
    return (
      <div className="fixed bottom-20 right-4 z-30 bg-[#7a5c43] text-white rounded-2xl px-4 py-3 shadow-lg flex flex-col items-end max-w-[160px]">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">Loyalty</span>
        <span className="text-sm font-extrabold leading-tight truncate w-full text-right">{customer.name.replace('Guest ', '')}</span>
        <span className="text-[11px] font-semibold opacity-80">{customer.points} Poin</span>
      </div>
    );
  }

  return (
    <button
      onClick={onOpenAuth}
      className="fixed bottom-20 right-4 z-30 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
    >
      <span className="text-lg">🎁</span>
      <div className="text-left">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Loyalty</p>
        <p className="text-xs font-extrabold text-gray-700">Masuk & Kumpul Poin</p>
      </div>
    </button>
  );
}
