'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePwaAuthStore } from '@/store/usePwaAuthStore';
import { useCartStore } from '@/store/useCartStore';

export default function RedeemPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();
  const { customer, setCustomer, isLoggedIn } = usePwaAuthStore();
  const { cart, redeemedRewards, addRedeemedReward, removeRedeemedReward, addToCart } = useCartStore();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' });

  useEffect(() => {
    if (!isLoggedIn()) { router.push(`/${tableId}/menu`); return; }

    const fetchRewards = async () => {
      try {
        const res = await fetch('/api/v1/pwa/rewards/list');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.rewards || []);
        }
      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchRewards();
  }, [isLoggedIn, router, tableId]);

  const showToast = (title: string, message: string) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast({ show: false, title: '', message: '' }), 3000);
  };

  const handleTukarkan = async (product: any) => {
    if ((customer?.points || 0) < product.pointCost) return;
    setLoadingId(product.id);

    try {
      const res = await fetch('/api/v1/pwa/rewards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customer?.token}` 
        },
        body: JSON.stringify({ 
          productId: product.id, 
          pointsCost: product.pointCost 
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        setCustomer({ ...customer!, points: data.customer.points });
        
        // 🔥 UPDATE LOKAL: Kurangi stok 1 di layar agar tombol langsung berubah jika sisa 0
        setProducts(prev => prev.map(p => 
          p.id === product.id ? { ...p, qtyExchange: p.qtyExchange - 1 } : p
        ));

        addRedeemedReward({
          id: product.id, 
          name: product.name, 
          originalPrice: 0, 
          pointsCost: product.pointCost, 
          image: null
        });
        showToast('Berhasil Ditukar!', `${product.name} siap digunakan ke keranjang.`);
      } else {
        alert(data.message);
      }
    } catch (err) { 
      alert('Gagal menukar poin'); 
    } finally { 
      setLoadingId(null); 
    }
  };

  const handleGunakan = (reward: any) => {
    addToCart({
      id: reward.id + '-reward', 
      name: reward.name + ' (Reward)',
      price: 0, 
      originalPrice: reward.originalPrice,
      quantity: 1,
      isReward: true
    });
    removeRedeemedReward(reward.id);
    showToast('Dimasukkan!', `${reward.name} masuk ke Keranjang.`);
    setTimeout(() => { router.push(`/${tableId}/cart`); }, 1000);
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-bold text-[#A67B5B]">Memuat Rewards...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans pb-24 text-[#1C1917]">
      <div className="bg-[#1C1917] px-6 pt-10 pb-12 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <button onClick={() => router.push(`/${tableId}/menu`)} className="absolute top-6 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <div className="text-center mt-6">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px] mb-2">Poin Tersedia</p>
          <h1 className="text-white font-black text-5xl tracking-tight mb-2">{customer?.points || 0}</h1>
          <p className="text-[#A67B5B] text-[14px] font-semibold">Tukarkan dengan menu favoritmu!</p>
        </div>
      </div>

      <div className="px-5 mt-8 flex flex-col gap-4">
        {products.length === 0 ? (
          <div className="text-center bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
             <span className="text-4xl block mb-3">🎁</span>
             <p className="text-gray-500 font-bold text-[13px]">Belum ada reward yang tersedia saat ini.</p>
          </div>
        ) : (
          products.map((product) => {
            const isRedeemed = redeemedRewards.find(r => r.id === product.id);
            const canAfford = (customer?.points || 0) >= product.pointCost;
            const isInCart = cart.find((c: any) => c.id === product.id + '-reward');
            
            // 🔥 LOGIKA BARU: Cek apakah stok habis
            const isOutOfStock = product.qtyExchange <= 0;

            return (
              <div key={product.id} className="bg-white rounded-[24px] p-4 flex gap-4 shadow-sm border border-gray-100">
                <div className="w-24 h-24 rounded-[16px] bg-gray-50 flex-shrink-0 overflow-hidden">
                   <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <h3 className="font-extrabold text-[15px] leading-tight mb-1">{product.name}</h3>
                  <p className="text-[#A67B5B] font-black text-[14px] mb-3">{product.pointCost} Poin</p>
                  
                  {isInCart ? (
                    <button disabled className="bg-gray-100 text-gray-400 text-[12px] font-black py-2.5 rounded-xl uppercase tracking-wider w-full cursor-not-allowed border border-gray-200">
                      Di Keranjang
                    </button>
                  ) : isRedeemed ? (
                    <button onClick={() => handleGunakan(isRedeemed)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-black py-2.5 rounded-xl uppercase tracking-wider w-full shadow-[0_4px_15px_-3px_rgba(16,185,129,0.5)] transition-all">
                      Gunakan
                    </button>
                  ) : isOutOfStock ? ( // 🔥 RENDER TOMBOL KUOTA HABIS JIKA STOK 0
                    <button disabled className="bg-gray-200 text-gray-400 text-[12px] font-black py-2.5 rounded-xl uppercase tracking-wider w-full cursor-not-allowed border border-gray-300">
                      Kuota Habis
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleTukarkan(product)} 
                      disabled={!canAfford || loadingId === product.id}
                      className={`text-[12px] font-black py-2.5 rounded-xl uppercase tracking-wider w-full transition-all flex justify-center items-center ${canAfford ? 'bg-[#1C1917] text-white hover:bg-[#6C4E31] active:scale-95 shadow-md' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {loadingId === product.id ? "Memproses..." : "Tukarkan"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white rounded-[20px] p-4 pr-6 shadow-xl border border-emerald-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex justify-center items-center font-bold">✓</div>
            <div>
              <h4 className="font-black text-[15px] text-emerald-600">{toast.title}</h4>
              <p className="text-[13px] text-gray-500 font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}