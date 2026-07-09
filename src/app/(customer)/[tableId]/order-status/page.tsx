'use client';

// =============================================================
// Page: /{tableId}/order-status
// Halaman status pesanan real-time 
// PERUBAHAN: Emoji sesuai checklist & Short polling 5 detik
// =============================================================

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderStatus {
  id: string;
  status: 'PENDING_CONFIRMATION' | 'BEING_PREPARED' | 'READY_FOR_PICKUP' | 'CANCELLED';
  tableId: string;
  totalAmount: number;
  createdAt: string;
}

const STATUS_STEPS = ['PENDING_CONFIRMATION', 'BEING_PREPARED', 'READY_FOR_PICKUP'] as const;

// Menyesuaikan icon visual dengan checklist
const STATUS_LABELS: Record<string, { label: string; desc: string; emoji: string }> = {
  PENDING_CONFIRMATION: { label: 'Menunggu Konfirmasi', desc: 'Pesananmu sedang dilihat oleh kasir...', emoji: '📝' },
  BEING_PREPARED: { label: 'Sedang Dibuat', desc: 'Barista kami sedang membuatkan pesananmu!', emoji: '☕' },
  READY_FOR_PICKUP: { label: 'Siap Diambil!', desc: 'Pesananmu sudah siap! Silakan ambil di counter.', emoji: '🎉' },
  CANCELLED: { label: 'Dibatalkan', desc: 'Pesanan ini dibatalkan. Silakan hubungi kasir.', emoji: '❌' },
};

export default function OrderStatusPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/v1/pwa/orders/${orderId}/status`);
      if (!res.ok) { setError('Pesanan tidak ditemukan'); return; }
      const data = await res.json();
      setOrder(data.order);
    } catch {
      setError('Gagal memuat status');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pertama kali
  useEffect(() => {
    fetchStatus();
  }, [orderId]);

  // Short polling setiap 5 detik (5000 ms) sesuai instruksi task
  useEffect(() => {
    if (!orderId) return;
    if (order?.status === 'READY_FOR_PICKUP' || order?.status === 'CANCELLED') return;

    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId, order?.status]);

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]) : -1;
  const statusInfo = order ? STATUS_LABELS[order.status] : null;

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-500">ID pesanan tidak ditemukan</p>
        <Link href={`/${tableId}/menu`} className="mt-4 text-[#7a5c43] font-bold text-sm">Kembali ke Menu</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm p-6">

        {/* STATUS UTAMA */}
        {loading ? (
          <div className="text-center py-10">
            <div className="text-4xl animate-pulse mb-3">☕</div>
            <p className="text-gray-400 text-sm">Memuat status pesanan...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : order && statusInfo ? (
          <>
            <div className="text-center mb-6">
              <span className="text-5xl">{statusInfo.emoji}</span>
              <h1 className="text-xl font-extrabold text-gray-900 mt-3">{statusInfo.label}</h1>
              <p className="text-sm text-gray-500 mt-1">{statusInfo.desc}</p>
            </div>

            {/* PROGRESS TRACKER */}
            {order.status !== 'CANCELLED' && (
              <div className="flex items-center justify-center mb-8 w-full px-4">
                {STATUS_STEPS.map((step, i) => [
                  /* Lingkaran Angka/Checkmark */
                  <div key={`circle-${step}`} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    i <= currentStepIndex ? 'bg-[#6C4E31] text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStepIndex ? '✓' : i + 1}
                  </div>,

                  /* Garis Penghubung (Tidak dirender di step terakhir) */
                  i < STATUS_STEPS.length - 1 && (
                    <div key={`line-${step}`} className={`flex-1 h-1 mx-3 rounded-full transition-all ${i < currentStepIndex ? 'bg-[#6C4E31]' : 'bg-gray-100'}`} />
                  )
                ])}
              </div>
            )}

            {/* DETAIL PESANAN */}
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Order ID</span>
                <span className="font-bold text-gray-700 truncate ml-2">{order.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Meja</span>
                <span className="font-bold text-gray-700">{order.tableId}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span className="font-bold text-gray-700">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* POLLING INDICATOR */}
            {order.status !== 'READY_FOR_PICKUP' && order.status !== 'CANCELLED' && (
              <p className="text-center text-[10px] text-gray-400 mt-4 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                Update otomatis setiap 5 detik
              </p>
            )}
          </>
        ) : null}
      </div>

      <Link href={`/${tableId}/menu`} className="mt-6 text-[#7a5c43] font-bold text-sm">
        ← Kembali ke Menu
      </Link>
    </div>
  );
}