'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ReceiptTicket, { ReceiptData } from '@/components/shared/ReceiptTicket';

export default function EReceiptPage({ params }: { params: Promise<{ tableId: string, orderId: string }> }) {
  const { tableId, orderId } = use(params);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const storeRes = await fetch("/api/public/store");
        const storeData = await storeRes.json();
        const settings = storeData.settings || {};

        const orderRes = await fetch(`/api/pos/history/${orderId}`);
        const orderData = await orderRes.json();
        
        if (orderRes.ok && orderData.order) {
          const o = orderData.order;
          const orderDate = new Date(o.createdAt);
          
          const total = o.totalAmount;
          const subtotal = Math.floor(total / 1.1);
          const tax = total - subtotal;

          setReceiptData({
            storeName: settings.storeName || "Kofilo",
            date: orderDate.toLocaleDateString('id-ID'),
            time: orderDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            txId: o.txId,
            cashierName: o.cashierName.split(' ')[0],
            subtotal,
            tax,
            total,
            paymentMethod: o.paymentMethod,
            wifiName: settings.wifiName,
            wifiPassword: settings.wifiPassword,
            footerMessage: settings.receiptFooter,
            items: o.items.map((item: any) => ({
              id: item.id,
              name: item.productName,
              quantity: item.quantity,
              price: item.unitPrice,
              subTotal: item.subTotal
            }))
          });
        }
      } catch (err) {
        console.error("Gagal memuat e-receipt", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-[#0f1222] flex flex-col items-center p-6 py-12">
      <Link href={`/${tableId}/menu`} className="mb-6 text-white/80 font-bold text-sm flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
        ← Kembali ke Menu
      </Link>

      {loading ? (
        <div className="animate-pulse flex flex-col items-center mt-20">
          <div className="w-10 h-10 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4 text-sm font-bold tracking-widest uppercase">Memuat Struk...</p>
        </div>
      ) : receiptData ? (
        <div className="animate-in slide-in-from-bottom-10 fade-in duration-700 w-full max-w-sm">
          <ReceiptTicket data={receiptData} />
        </div>
      ) : (
        <p className="text-white mt-20">Struk tidak ditemukan.</p>
      )}
    </div>
  );
}