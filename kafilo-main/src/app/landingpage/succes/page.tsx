'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Transaction = { transactionId: string; plan: 'starter' | 'pro'; total: number; paymentMethod: 'qris' | 'transfer' | 'ewallet'; customer: { cafe: string } };

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

function SuccessContent() {
  const searchParams = useSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kafilo-last-transaction');
      if (saved) setTransaction(JSON.parse(saved) as Transaction);
    } catch {
      setTransaction(null);
    }
  }, []);

  const planLabel = transaction?.plan === 'starter' ? 'Kafilo Starter' : 'Kafilo Pro';
  const paymentLabel = transaction?.paymentMethod === 'qris' ? 'QRIS' : transaction?.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-wallet';

  return (
    <div className="min-h-screen bg-[#f6f4f1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 md:p-10 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-transparent"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600 mb-3">Transaksi {transaction?.transactionId || searchParams.get('transaction') || 'terkonfirmasi'}</p>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Pembayaran berhasil</h1>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            Terima kasih telah memilih {planLabel}. Pesanan untuk {transaction?.customer.cafe || 'bisnis Anda'} sudah tercatat sebagai pembayaran demo.
          </p>

          <div className="mb-8 rounded-2xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between py-1 text-gray-500"><span>Metode pembayaran</span><strong className="text-gray-900">{paymentLabel}</strong></div>
            <div className="flex justify-between py-1 text-gray-500"><span>Total</span><strong className="text-gray-900">{transaction ? formatRupiah(transaction.total) : 'Demo'}</strong></div>
          </div>

          <div className="space-y-4">
            <Link href="/landingpage/nota" className="block w-full py-4 text-center rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all">
              Lihat Nota
            </Link>
            <Link href="/landingpage" className="block w-full py-4 text-center rounded-xl bg-[#1a1f36] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f6f4f1] text-sm font-bold text-gray-500">Memuat status pembayaran...</div>}><SuccessContent /></Suspense>;
}