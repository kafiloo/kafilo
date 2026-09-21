'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Transaction = {
  transactionId: string;
  plan: 'starter' | 'pro';
  price: number;
  tax: number;
  total: number;
  paymentMethod: 'qris' | 'transfer' | 'ewallet';
  customer: { name: string; email: string; phone: string; cafe: string };
  createdAt: string;
};

const fallbackTransaction: Transaction = {
  transactionId: 'KF-DEMO-001', plan: 'pro', price: 500000, tax: 55000, total: 555000,
  paymentMethod: 'qris', customer: { name: 'Pelanggan Kafilo', email: '-', phone: '-', cafe: 'Bisnis F&B Anda' }, createdAt: new Date().toISOString(),
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

export default function InvoicePage() {
  const [invoiceData, setInvoiceData] = useState<Transaction | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kafilo-last-transaction');
      setInvoiceData(saved ? JSON.parse(saved) as Transaction : fallbackTransaction);
    } catch {
      setInvoiceData(fallbackTransaction);
    }
  }, []);

  if (!invoiceData) return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-sm font-bold text-gray-500">Memuat nota...</div>;

  const planLabel = invoiceData.plan === 'pro' ? 'Kafilo Pro Plan' : 'Kafilo Starter Plan';
  const paymentLabel = invoiceData.paymentMethod === 'qris' ? 'QRIS' : invoiceData.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-wallet';
  const formattedDate = new Date(invoiceData.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:w-full print:max-w-full">
        
        {/* Header Nota */}
        <div className="p-10 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1a1f36] text-white">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">KAFILO<span className="text-[#d4a373]">.</span></h1>
            <p className="text-gray-400 text-sm">Sistem Enterprise untuk Kafe Anda</p>
          </div>
          <div className="mt-6 md:mt-0 text-left md:text-right">
            <div className="text-2xl font-bold tracking-widest text-[#d4a373] uppercase mb-1">INVOICE</div>
            <p className="text-gray-300 font-medium">#{invoiceData.transactionId}</p>
          </div>
        </div>

        {/* Informasi Detail */}
        <div className="p-10">
          <div className="flex flex-col md:flex-row justify-between mb-12">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ditagihkan Kepada</p>
              <h3 className="font-bold text-gray-900 text-lg">{invoiceData.customer.name}</h3>
              <p className="text-gray-600">{invoiceData.customer.cafe}</p>
              <p className="text-sm text-gray-500">{invoiceData.customer.email}</p>
            </div>
            <div className="mt-6 md:mt-0 text-left md:text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Pembayaran</p>
              <h3 className="font-bold text-gray-900">{formattedDate}</h3>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full uppercase tracking-wide">
                LUNAS
              </span>
            </div>
          </div>

          {/* Tabel Pembelian */}
          <table className="w-full text-left mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 font-bold text-gray-600 text-sm uppercase tracking-wider">Deskripsi</th>
                <th className="py-3 font-bold text-gray-600 text-sm uppercase tracking-wider text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-5">
                  <p className="font-bold text-gray-900">{planLabel} (1 Bulan)</p>
                  <p className="text-sm text-gray-500 mt-1">{invoiceData.plan === 'pro' ? 'Akses Superadmin, PWA QR Ordering, dan Loyalty Hub' : 'Akses POS, manajemen menu, stok dasar, dan struk thermal'}</p>
                </td>
                <td className="py-5 text-right font-medium text-gray-900">
                  {formatRupiah(invoiceData.price)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Kalkulasi Total */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2">
              <div className="flex justify-between py-2 text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{formatRupiah(invoiceData.price)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
                <span>PPN (11%)</span>
                <span className="font-medium text-gray-900">{formatRupiah(invoiceData.tax)}</span>
              </div>
              <div className="flex justify-between py-4 text-xl font-black text-[#1a1f36]">
                <span>Total</span>
                <span>{formatRupiah(invoiceData.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Actions */}
        <div className="bg-gray-50 p-6 flex flex-col md:flex-row justify-between items-center print:hidden">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">Dibayar melalui {paymentLabel}. Terima kasih telah memilih Kafilo.</p>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition-colors">
              Cetak PDF
            </button>
            <Link href="/landingpage" className="px-6 py-2 bg-[#1a1f36] text-white rounded-lg font-bold hover:bg-gray-900 transition-colors">
              Ke Beranda
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}