'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { usePwaAuthStore } from '@/store/usePwaAuthStore';
import AuthDrawer from '@/components/customer/AuthDrawer';
import PakasirCheckoutPanel from '@/components/customer/PakasirCheckoutPanel';
import { useCheckoutStore } from '@/stores/checkout-store';

export default function CustomerCheckoutPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { customer, setCustomer } = usePwaAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [pwaOrderId, setPwaOrderId] = useState<string | null>(null);
  const [orderCreating, setOrderCreating] = useState(false);

  // 🔥 State Keuangan & Settings 🔥
  const [storeSettings, setStoreSettings] = useState({ 
    taxRate: 0, serviceCharge: 0, acceptCash: true, acceptQris: true 
  });

  useEffect(() => {
    fetch('/api/public/store').then(res => res.json()).then(data => {
      if(data.settings) {
        setStoreSettings({
          taxRate: data.settings.taxRate || 0,
          serviceCharge: data.settings.serviceCharge || 0,
          acceptCash: data.settings.acceptCash ?? true,
          acceptQris: data.settings.acceptQris ?? true
        });
        // Default select first available method
        if (data.settings.acceptCash !== false) setPaymentMethod('CASH');
        else if (data.settings.acceptQris !== false) setPaymentMethod('PAKASIR');
      }
    }).catch(() => {});
  }, []);

  const refreshCustomerPoints = async () => {
    if (!customer?.token) return;
    try {
      const res = await fetch('/api/v1/pwa/customer/points', {
        headers: { Authorization: `Bearer ${customer.token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.customer) {
        setCustomer({
          ...customer,
          points: data.customer.points,
          name: data.customer.name,
          phone: data.customer.phone,
        });
      }
    } catch { }
  };

  // Bersihkan state Pakasir saat meja berubah agar tidak reuse order lain.
  // (key pada PakasirCheckoutPanel juga me-reset state saat pwaOrderId berubah.)
  useEffect(() => {
    useCheckoutStore.getState().reset();
  }, [tableId]);

  // 🔥 HITUNGAN KEUNGAN DINAMIS (estimasi client; total resmi dari server) 🔥
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = Math.round(subtotal * (storeSettings.taxRate / 100));
  const serviceAmount = Math.round(subtotal * (storeSettings.serviceCharge / 100));
  const total = subtotal + taxAmount + serviceAmount;

  // Buat PwaOrder di server (nominal resmi dihitung server dari database).
  const ensurePwaOrder = async (): Promise<string | null> => {
    if (pwaOrderId) return pwaOrderId;
    if (!customer?.token) {
      setShowAuthDrawer(true);
      return null;
    }
    setOrderCreating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/pwa/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customer.token}`,
        },
        body: JSON.stringify({ tableId, items: cart, paymentMethod: 'QRIS' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Gagal membuat pesanan. Silakan coba lagi.');
        return null;
      }
      setPwaOrderId(data.orderId as string);
      return data.orderId as string;
    } catch {
      setError('Koneksi gagal. Silakan coba lagi.');
      return null;
    } finally {
      setOrderCreating(false);
    }
  };

  // Saat pembayaran Pakasir lunas -> PwaOrder sudah BEING_PREPARED via
  // webhook/sync (pakasir-fulfillment). Tinggal bersihkan cart & redirect.
  const handlePaid = async () => {
    await refreshCustomerPoints();
    clearCart();
    router.push(`/${tableId}/order-status?orderId=${pwaOrderId}`);
  };

  // (Integrasi pembayaran lama sudah dibersihkan — file ini murni Pakasir.)

  const handleConfirmPayment = async () => {
    if (!customer) {
      setShowAuthDrawer(true);
      return;
    }
    if (paymentMethod === 'PAKASIR') {
      // Alur online: buat PwaOrder dulu, lalu panel Pakasir membuat pembayaran.
      await ensurePwaOrder();
      return;
    }

    if (paymentMethod === 'CASH') {
      setIsProcessing(true);
      setError('');

      try {
        const items = cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variants: item.variants ?? null,
          isReward: item.isReward,
        }));

        const res = await fetch('/api/v1/pwa/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customer.token}`,
          },
          body: JSON.stringify({ tableId, items, paymentMethod: 'CASH' }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            setShowAuthDrawer(true);
            setIsProcessing(false);
            return;
          }
          setError(data.message || 'Gagal mengirim pesanan');
          setIsProcessing(false);
          return;
        }

        clearCart();
        await refreshCustomerPoints();
        router.push(`/${tableId}/order-status?orderId=${data.orderId}`);
      } catch {
        setError('Koneksi gagal. Silakan coba lagi.');
        setIsProcessing(false);
      }
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const formattedTime = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const txNumber = `TX-${tableId}-${cart.length}`;

  if (cart.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[#1a1f36] flex flex-col pb-24">
      <header className="bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/${tableId}/cart`} className="text-gray-500 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h1 className="font-extrabold text-xl leading-tight">Payment</h1>
        </div>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 max-w-md mx-auto w-full">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-medium rounded-xl p-4 border border-red-100 text-center">
            {error}
          </div>
        )}

        {paymentMethod === 'PAKASIR' && pwaOrderId && (
          <PakasirCheckoutPanel amount={total} pwaOrderId={pwaOrderId} onPaid={handlePaid} />
        )}

        {paymentMethod !== 'PAKASIR' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
            <div className="text-center mb-6">
              <h2 className="font-extrabold text-lg tracking-wide">CRAFT COFFEE</h2>
              <p className="text-xs text-gray-500 mt-1">Jl. Senopati No. 42, Jakarta<br/>Tel: (021) 555-0123</p>
            </div>

            <div className="border-t border-dashed border-gray-300 py-3 flex justify-between text-[11px] text-gray-500 font-medium">
              <div>
                <p>Date: {formattedDate}</p>
                <p>Time: {formattedTime}</p>
              </div>
              <div className="text-right">
                <p>TX: {txNumber}</p>
                <p>Table: {tableId}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 py-4 flex flex-col gap-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-bold text-[#1a1f36]">{item.quantity}x {item.name}</p>
                    {item.variants && (
                      <div className="text-[11px] text-gray-500 mt-0.5 ml-4">
                        {item.variants.split(', ').map((v, i) => <p key={i}>- {v}</p>)}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-[#1a1f36]">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 py-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-medium text-gray-500">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {/* 🔥 TAMPILKAN JIKA LEBIH DARI 0 🔥 */}
              {serviceAmount > 0 && (
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Service Charge ({storeSettings.serviceCharge}%)</span>
                  <span>Rp {serviceAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>Tax ({storeSettings.taxRate}%)</span>
                  <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="font-extrabold text-base">TOTAL</span>
                <span className="font-extrabold text-base">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {paymentMethod !== 'PAKASIR' && (
          <div>
            <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Select Payment Method</h3>
            
            {/* 🔥 PROTEKSI: JIKA SEMUA METODE PEMBAYARAN DIMATIKAN ADMIN 🔥 */}
            {!storeSettings.acceptCash && !storeSettings.acceptQris ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50 text-red-500 animate-in fade-in duration-300">
                <span className="text-4xl mb-3">⚠️</span>
                <h3 className="font-extrabold text-[#1a1f36] text-lg mb-1 text-center">Metode Pembayaran Tidak Tersedia</h3>
                <p className="text-sm font-medium text-red-400 text-center">Semua metode pembayaran sedang dinonaktifkan.<br/>Harap hubungi Admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* 🔥 SEMBUNYIKAN JIKA DI-DISABLE DI ADMIN 🔥 */}
                {storeSettings.acceptCash && (
                  <button 
                    onClick={() => { setPaymentMethod('CASH'); useCheckoutStore.getState().reset(); setPwaOrderId(null); }}
                    className={`py-5 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'CASH' 
                      ? 'border-[#7a5c43] bg-[#7a5c43]/5 text-[#7a5c43]' 
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V4.242c0-.754-.727-1.294-1.453-1.096a60.07 60.07 0 01-15.797 2.101c-.727.198-1.453.342-1.453 1.096V18.75z" />
                    </svg>
                    <span className="font-bold text-sm">Pay at Cashier</span>
                  </button>
                )}

                {storeSettings.acceptQris && (
                  <button 
                    onClick={() => { setPaymentMethod('PAKASIR'); }}
                    className={`py-5 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'PAKASIR' 
                      ? 'border-[#7a5c43] bg-[#7a5c43]/5 text-[#7a5c43]' 
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                    </svg>
                    <span className="font-bold text-sm">Online (QRIS / VA)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      <AuthDrawer 
        isOpen={showAuthDrawer} 
        onClose={() => setShowAuthDrawer(false)}
        context="checkout"
        onSuccess={async () => {
          await refreshCustomerPoints();
          setShowAuthDrawer(false);
        }}
      />

      {/* CTA bawah disembunyikan saat panel Pakasir aktif (panel punya
          tombol "Bayar Sekarang" sendiri + tampilan QR/VA). */}
      {!(paymentMethod === 'PAKASIR' && pwaOrderId) && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 z-20">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleConfirmPayment}
              disabled={!paymentMethod || isProcessing || orderCreating || (!storeSettings.acceptCash && !storeSettings.acceptQris)}
              className={`w-full py-4 rounded-xl font-bold text-[15px] transition-all flex justify-center items-center gap-2 ${
                isProcessing || orderCreating || (!storeSettings.acceptCash && !storeSettings.acceptQris) ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' :
                paymentMethod 
                  ? 'bg-[#7a5c43] text-white shadow-md hover:bg-[#634832] active:scale-95' 
                  : 'bg-[#e8e2d9] text-white cursor-not-allowed'
              }`}
            >
              {isProcessing || orderCreating
                ? 'Memproses...'
                : paymentMethod === 'PAKASIR' && !pwaOrderId
                  ? `Buat Pesanan - Rp ${total.toLocaleString('id-ID')}`
                  : `Confirm Payment - Rp ${total.toLocaleString('id-ID')}`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}