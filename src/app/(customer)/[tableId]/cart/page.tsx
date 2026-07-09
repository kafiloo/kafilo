'use client';

// =============================================================
// Page: /{tableId}/cart
// Halaman keranjang belanja PWA
// PERUBAHAN: Hitungan Tax & Service Charge menjadi dinamis dari Database
// =============================================================

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { usePwaAuthStore } from '@/store/usePwaAuthStore';
import AuthDrawer from '@/components/customer/AuthDrawer';

export default function CustomerCartPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();
  
  const { cart, updateQuantity, removeFromCart, addRedeemedReward } = useCartStore();
  const { isLoggedIn } = usePwaAuthStore();

  const [showAuthDrawer, setShowAuthDrawer] = useState(false);

  // 🔥 STATE UNTUK FINANCE & TAXES 🔥
  const [storeSettings, setStoreSettings] = useState({ 
    taxRate: 0, serviceCharge: 0 
  });

  // 🔥 RADAR PENGECEKAN TOKO & FETCH SETTINGS (Setiap 10 Detik) 🔥
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStoreStatus = async () => {
      try {
        const res = await fetch("/api/public/store", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const s = data.settings;
            
            // 1. Update Tax & Service Charge
            setStoreSettings({
              taxRate: s.taxRate || 0,
              serviceCharge: s.serviceCharge || 0,
            });

            // 2. Cek Jam Buka/Tutup (konversi ke menit biar presisi)
            const timeToMinutes = (t: string) => {
              const parts = t.split(/[:.]/);
              return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const openMinutes = timeToMinutes(s.openTime || "07:00");
            const closeMinutes = timeToMinutes(s.closeTime || "22:00");

            let openStatus = false;
            if (s.storeMode === "FORCE_OPEN") {
              openStatus = true;
            } else if (s.storeMode === "FORCE_CLOSE") {
              openStatus = false;
            } else {
              if (openMinutes <= closeMinutes) openStatus = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
              else openStatus = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
            }

            // 3. Jika toko tutup, langsung tendang ke Halaman Penyambut
            if (!openStatus) {
              router.replace(`/${tableId}`);
            }
          }
        }
      } catch (error) {
        console.error("Gagal load info toko:", error);
      }
    };

    // Eksekusi saat pertama kali buka keranjang
    checkStoreStatus();
    
    // Ulangi pengecekan setiap 10 detik
    intervalId = setInterval(checkStoreStatus, 10000);

    return () => clearInterval(intervalId);
  }, [tableId, router]);

  // 🔥 PERHITUNGAN DINAMIS 🔥
  const subtotal = cart.reduce((acc, item) => {
    if (item.isReward) return acc;
    return acc + item.price * item.quantity;
  }, 0);
  
  const taxAmount = Math.round(subtotal * (storeSettings.taxRate / 100));
  const serviceAmount = Math.round(subtotal * (storeSettings.serviceCharge / 100));
  const total = subtotal + taxAmount + serviceAmount;

  // 🔥 PERBAIKAN LOGIKA: Ekstrak ID asli dengan aman
  const handleRemoveItem = (item: any) => {
    if (item.isReward) {
      // 1. Ambil ID asli dengan membuang '-reward' dan varian lainnya
      const originalId = item.id.split('-')[0];
      
      // 2. Kembalikan ke memori agar tombol "Gunakan" aktif lagi
      addRedeemedReward({
        id: originalId,
        name: item.name.replace(' (Reward)', ''), // Bersihkan teks (Reward)
        originalPrice: item.originalPrice || 0,
        pointsCost: 0, 
        image: null    
      });
    }
    
    // 3. Hapus dari keranjang (Zustand)
    removeFromCart(item.id);
  };

  const handleDecrease = (item: any) => {
    if (item.isReward || item.quantity <= 1) {
      handleRemoveItem(item);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleCheckout = () => {
    if (!isLoggedIn()) {
      setShowAuthDrawer(true);
    } else {
      router.push(`/${tableId}/checkout`);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthDrawer(false);
    router.push(`/${tableId}/checkout`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 flex flex-col">
      {/* HEADER */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href={`/${tableId}/menu`} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="font-extrabold text-base text-gray-900">Keranjang</h1>
          <p className="text-xs text-gray-500">Meja {tableId}</p>
        </div>
      </header>

      {/* KONTEN */}
      <main className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
            <span className="text-5xl mb-3">🛒</span>
            <p className="text-sm font-medium">Keranjang kosong</p>
            <Link href={`/${tableId}/menu`} className="mt-4 text-[#7a5c43] text-sm font-bold">Kembali ke Menu</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-lg mx-auto">
            {cart.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900">{item.name}</p>
                  {item.variants && <p className="text-xs text-gray-400 mt-0.5">{item.variants}</p>}
                  
                  {item.isReward ? (
                     <div className="mt-1 flex items-center gap-2">
                       <span className="text-xs text-gray-400 line-through">Rp {item.originalPrice?.toLocaleString('id-ID')}</span>
                       <span className="text-emerald-500 font-bold text-sm">Gratis (Rp 0)</span>
                     </div>
                  ) : (
                    <p className="text-[#7a5c43] font-bold text-sm mt-1">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* TOMBOL SILANG (X) */}
                  <button 
                    onClick={() => handleRemoveItem(item)} 
                    className="text-gray-300 hover:text-red-500 text-sm"
                  >
                    ✕
                  </button>
                  
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-2 py-1">
                    {/* TOMBOL MINUS (-) */}
                    <button 
                      onClick={() => handleDecrease(item)} 
                      className="w-6 h-6 flex items-center justify-center font-bold text-gray-500 text-base"
                    >
                      −
                    </button>
                    
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    
                    {/* TOMBOL PLUS (+) TERKUNCI UNTUK REWARD */}
                    <button 
                      onClick={() => {
                        if (!item.isReward) updateQuantity(item.id, item.quantity + 1);
                      }} 
                      disabled={item.isReward}
                      className={`w-6 h-6 flex items-center justify-center font-bold text-base transition-colors ${
                        item.isReward ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTTOM SUMMARY & CHECKOUT */}
      {cart.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-5 rounded-t-3xl shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-2 mb-5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            {/* 🔥 TAMPILKAN PAJAK & LAYANAN JIKA LEBIH DARI 0 🔥 */}
            {serviceAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Layanan ({storeSettings.serviceCharge}%)</span><span>Rp {serviceAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Pajak ({storeSettings.taxRate}%)</span><span>Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            
            <div className="border-t border-dashed border-gray-200 my-1" />
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-base text-gray-900">Total</span>
              <span className="font-extrabold text-base text-gray-900">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-4 rounded-xl font-bold text-sm transition-all bg-[#7a5c43] text-white hover:bg-[#634832] active:scale-95"
          >
            Lanjut ke Checkout
          </button>
          {!isLoggedIn() && (
            <p className="text-center text-xs text-gray-400 mt-2">Anda perlu memasukkan nomor HP untuk checkout</p>
          )}
        </div>
      )}

      {/* AUTH DRAWER */}
      <AuthDrawer
        isOpen={showAuthDrawer}
        onClose={() => setShowAuthDrawer(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}