'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePwaAuthStore } from '@/store/usePwaAuthStore';

interface HistoryOrder {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  items: any[];
}

export default function PwaHistoryPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();
  const { customer, isLoggedIn } = usePwaAuthStore();

  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);

  useEffect(() => {
    if (!isLoggedIn() || !customer?.token) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/v1/pwa/history', {
          headers: { Authorization: `Bearer ${customer.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Gagal load history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customer, isLoggedIn]);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] font-sans text-[#1a1f36] flex flex-col pb-10">
      
      {/* ── HEADER ── */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
        <Link href={`/${tableId}/menu`} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="font-extrabold text-[17px] text-gray-900 leading-tight">History Transaksi</h1>
          <p className="text-[11px] text-gray-500 font-medium">Riwayat pesanan Anda</p>
        </div>
      </header>

      {/* ── LIST PESANAN ── */}
      <main className="p-5 flex-1 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-[#6C4E31] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold animate-pulse">Memuat riwayat...</p>
          </div>
        ) : !isLoggedIn() ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔒</span>
            <h2 className="text-lg font-black text-[#1a1f36] mb-1">Belum Login</h2>
            <p className="text-sm text-gray-500 mb-6">Silakan login untuk melihat riwayat pesanan Anda.</p>
            <Link href={`/${tableId}/menu`} className="bg-[#6C4E31] text-white px-6 py-3 rounded-xl font-bold">Kembali ke Menu</Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📭</span>
            <h2 className="text-lg font-black text-[#1a1f36] mb-1">Belum Ada Transaksi</h2>
            <p className="text-sm text-gray-500">Anda belum pernah melakukan pemesanan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const { date, time } = formatDate(order.createdAt);
              return (
                <button 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 text-left w-full hover:border-[#6C4E31]/30 transition-colors active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                    <div>
                      <div className="text-[11px] text-gray-400 font-bold tracking-wider mb-0.5">{date} • {time}</div>
                      <div className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase font-bold inline-block">ID: {order.id.slice(-6)}</div>
                    </div>
                    <div className="font-black text-[15px] text-[#1a1f36]">Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    {order.items.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="text-[13px] font-semibold text-gray-700 truncate">
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-[11px] font-bold text-gray-400 mt-1">
                        + {order.items.length - 3} menu lainnya...
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* ── POP-UP MODAL DETAIL (GAMBAR 3) ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-[#1a1f36]/40 backdrop-blur-sm p-0 sm:p-4">
          <div 
            className="bg-white w-full max-w-md sm:rounded-[32px] rounded-t-[32px] rounded-b-none flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 fade-in duration-300 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-[32px] shrink-0">
              <div>
                <h3 className="font-black text-[16px] text-[#1a1f36]">Detail Nota</h3>
                <p className="text-[11px] font-bold text-gray-400">
                  {formatDate(selectedOrder.createdAt).date} • {formatDate(selectedOrder.createdAt).time}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Items Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {selectedOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  {/* Nomor */}
                  <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center font-black text-[11px] text-gray-500 shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  
                  {/* Detail Item */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-extrabold text-[14px] text-[#1a1f36] leading-snug pr-2">
                        {item.name}
                      </div>
                      <div className="font-black text-[13px] text-[#6C4E31] shrink-0">
                        Rp {item.subTotal.toLocaleString('id-ID')}
                      </div>
                    </div>
                    
                    {/* Varian/Deskripsi jika ada */}
                    {item.variants ? (
                      <div className="text-[11.5px] font-medium text-gray-400 bg-gray-50 p-2.5 rounded-xl mt-1.5 border border-gray-100">
                        {item.variants}
                      </div>
                    ) : (
                      <div className="text-[11px] font-medium text-gray-400 mt-0.5">
                        {item.quantity} pcs @ Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer (Total) */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 rounded-b-[32px] shrink-0">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-500 text-[13px] uppercase tracking-wider">Total Pembayaran</span>
                <span className="font-black text-[20px] text-[#1a1f36]">
                  Rp {selectedOrder.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}