'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type PlanKey = 'starter' | 'pro';
type PaymentMethod = 'qris' | 'transfer' | 'ewallet';

type CheckoutData = {
  transactionId: string;
  plan: PlanKey;
  price: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  customer: { name: string; email: string; phone: string; cafe: string };
  createdAt: string;
};

const PLAN_DATA: Record<PlanKey, { label: string; price: number; description: string }> = {
  starter: { label: 'Kafilo Starter', price: 350000, description: 'POS, menu, stok dasar, dan struk thermal standar' },
  pro: { label: 'Kafilo Pro', price: 500000, description: 'POS lengkap dengan Superadmin, PWA Order, dan Loyalty Hub' },
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPlan = searchParams.get('plan') === 'starter' ? 'starter' : 'pro';
  const plan = PLAN_DATA[requestedPlan];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [form, setForm] = useState({ name: '', email: '', phone: '', cafe: '' });
  const [error, setError] = useState('');
  const tax = Math.round(plan.price * 0.11);
  const total = plan.price + tax;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const transaction: CheckoutData = {
      transactionId: `KF-${Date.now().toString(36).toUpperCase()}`,
      plan: requestedPlan,
      price: plan.price,
      tax,
      total,
      paymentMethod,
      customer: form,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('kafilo-last-transaction', JSON.stringify(transaction));
      router.push(`/landingpage/succes?transaction=${transaction.transactionId}`);
    } catch {
      setError('Transaksi demo tidak dapat disimpan. Silakan coba lagi.');
    }
  };

  const qrPattern = Array.from({ length: 121 }, (_, index) => {
    const row = Math.floor(index / 11);
    const column = index % 11;
    const finder = (startRow: number, startColumn: number) => row >= startRow && row < startRow + 5 && column >= startColumn && column < startColumn + 5;
    const finderPixel = (startRow: number, startColumn: number) => {
      const localRow = row - startRow;
      const localColumn = column - startColumn;
      return localRow === 0 || localRow === 4 || localColumn === 0 || localColumn === 4 || (localRow === 2 && localColumn === 2);
    };
    const inFinder = finder(0, 0) || finder(0, 6) || finder(6, 0);
    return inFinder ? (finderPixel(0, 0) || finderPixel(0, 6) || finderPixel(6, 0)) : (row * 7 + column * 11) % 5 < 2;
  });

  return (
    <div className="min-h-screen bg-[#f6f4f1] text-[#1a1f36]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/landingpage" className="text-2xl font-black tracking-tight">KAFILO<span className="text-[#6C4E31]">.</span></Link>
          <Link href="/landingpage#harga" className="text-sm font-bold text-gray-500 hover:text-[#6C4E31]">Kembali ke paket</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <section className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(26,31,54,0.08)] md:p-10">
          <div className="mb-10">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#6C4E31]">Kafilo checkout</p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Selesaikan pembelian Anda</h1>
            <p className="mt-3 text-gray-500">Lengkapi data bisnis. Ini adalah simulasi pembayaran, jadi tidak ada dana yang benar-benar dipotong.</p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-9">
            <div>
              <h2 className="mb-4 text-lg font-black">1. Data pemilik & bisnis</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {([['name', 'Nama lengkap', 'Budi Santoso'], ['email', 'Email aktif', 'nama@email.com'], ['phone', 'Nomor WhatsApp', '08xxxxxxxxxx'], ['cafe', 'Nama kafe / bisnis', 'Kopi Senja']] as const).map(([field, label, placeholder]) => (
                  <label key={field} className="block text-sm font-bold text-gray-700">
                    {label}
                    <input type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => updateField(field, event.target.value)} placeholder={placeholder} required className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 font-medium outline-none transition focus:border-[#6C4E31] focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10" />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-black">2. Pilih metode pembayaran</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {([['qris', 'QRIS', 'Scan dari m-banking'], ['transfer', 'Transfer bank', 'BCA / BNI / Mandiri'], ['ewallet', 'E-wallet', 'GoPay / OVO / DANA']] as const).map(([value, label, description]) => (
                  <button type="button" key={value} onClick={() => setPaymentMethod(value)} className={`rounded-2xl border p-4 text-left transition ${paymentMethod === value ? 'border-[#6C4E31] bg-[#6C4E31]/5 ring-2 ring-[#6C4E31]/15' : 'border-gray-200 bg-white hover:border-[#6C4E31]/50'}`}>
                    <span className="block font-black text-gray-900">{label}</span>
                    <span className="mt-1 block text-xs font-medium text-gray-500">{description}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'qris' && (
                <div className="mt-5 flex flex-col items-center rounded-2xl bg-[#f7f4ef] p-6 text-center">
                  <div className="grid h-44 w-44 grid-cols-11 gap-1 rounded-xl bg-white p-3 shadow-sm">
                    {qrPattern.map((isDark, index) => <span key={index} className={isDark ? 'bg-[#111827]' : 'bg-white'} />)}
                  </div>
                  <p className="mt-4 font-black text-gray-900">QRIS KAFILO DEMO</p>
                  <p className="mt-1 text-xs text-gray-500">QRIS palsu untuk keperluan demo. Tidak terhubung ke bank.</p>
                </div>
              )}
              {paymentMethod === 'transfer' && <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-sm text-gray-600"><p className="font-black text-gray-900">Rekening demo Kafilo</p><p className="mt-2">Bank BCA · 123 456 7890 · a.n. Kafilo Software</p></div>}
              {paymentMethod === 'ewallet' && <div className="mt-5 rounded-2xl bg-gray-50 p-5 text-sm text-gray-600"><p className="font-black text-gray-900">E-wallet demo</p><p className="mt-2">Pilih GoPay, OVO, atau DANA pada aplikasi Anda. Pembayaran ini hanya simulasi.</p></div>}
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>}
            <button type="submit" className="w-full rounded-2xl bg-[#1a1f36] py-4 text-base font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#6C4E31]">Saya sudah membayar · {formatRupiah(total)}</button>
          </form>
        </section>

        <aside className="h-fit rounded-[28px] bg-[#1a1f36] p-7 text-white shadow-[0_20px_60px_rgba(26,31,54,0.2)] lg:sticky lg:top-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a373]">Ringkasan pesanan</p>
          <div className="mt-6 flex items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div><h2 className="text-2xl font-black">{plan.label}</h2><p className="mt-2 text-sm leading-relaxed text-gray-400">{plan.description}</p></div>
            <span className="whitespace-nowrap font-black">{formatRupiah(plan.price)}</span>
          </div>
          <div className="space-y-4 border-b border-white/10 py-6 text-sm"><div className="flex justify-between text-gray-400"><span>Langganan 1 bulan</span><span>{formatRupiah(plan.price)}</span></div><div className="flex justify-between text-gray-400"><span>PPN 11%</span><span>{formatRupiah(tax)}</span></div></div>
          <div className="flex items-end justify-between pt-6"><span className="text-gray-400">Total pembayaran</span><span className="text-2xl font-black">{formatRupiah(total)}</span></div>
          <div className="mt-8 rounded-2xl bg-white/5 p-4 text-sm text-gray-400"><p className="font-bold text-white">Yang Anda dapatkan</p><p className="mt-2">Akses paket aktif selama 1 bulan, nota digital, dan halaman sukses setelah konfirmasi demo.</p></div>
        </aside>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f6f4f1] text-sm font-bold text-gray-500">Memuat checkout...</div>}><CheckoutContent /></Suspense>;
}