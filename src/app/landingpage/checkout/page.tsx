"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPlan,
  saveOrder,
  formatRpFull,
  type KofiloOrder,
} from "@/lib/plans";
import { useCheckoutStore, type CheckoutMethod } from "@/stores/checkout-store";
import PakasirMethodPicker from "@/components/customer/PakasirMethodPicker";
import PakasirPaymentView from "@/components/customer/PakasirPaymentView";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "starter";
  const plan = getPlan(planId) ?? getPlan("starter")!;

  const router = useRouter();
  const {
    method,
    setMethod,
    fees,
    feesLoading,
    loadFees,
    createPayment,
    status,
    payment,
    error: payError,
    reset,
  } = useCheckoutStore();

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  useEffect(() => {
    if (plan.price > 0) void loadFees(plan.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.price]);

  // Saat pembayaran Pakasir COMPLETED: simpan order langganan & ke halaman berhasil.
  useEffect(() => {
    if (status === "completed" && payment) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const order: KofiloOrder = {
        orderId: payment.orderId,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        method: payment.method,
        methodLabel: payment.method,
        date: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        customerName: "Owner Kafe",
        status: "PAID",
      };
      saveOrder(order);
      reset();
      router.push("/landingpage/berhasil");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleConfirm = async () => {
    if (!method || !plan) return;
    await createPayment({
      method: method as CheckoutMethod,
      planId: plan.id,
      redirectUrl:
        typeof window !== "undefined" ? `${window.location.origin}/landingpage/berhasil` : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans text-[#1a1f36]">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); }
      ` }} />

      {/* ── Header ── */}
      <header className="sticky top-0 w-full z-40 p-4">
        <nav className="max-w-5xl mx-auto pointer-events-auto rounded-full px-6 py-3 flex items-center justify-between glass-panel shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
          <Link href="/landingpage" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1a1f36] flex items-center justify-center text-white text-lg shadow-lg">
              <span className="font-black tracking-tighter">K</span>
            </div>
            <span className="font-black text-[22px] tracking-tight">Kofilo.</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#6C4E31]/10 text-[#6C4E31] text-[13px] font-extrabold">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-[#6C4E31] opacity-60 animate-ping"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6C4E31]"></span></span>
            Secure Checkout
          </div>
        </nav>
      </header>
<main className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── KOLOM KIRI: Form & Metode ── */}
          <div className="w-full lg:flex-1 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <Link href="/landingpage/#harga" className="text-[#6C4E31] hover:text-[#1a1f36] font-bold text-sm rounded-full border border-gray-200 px-4 py-2 transition-all">← Kembali</Link>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Checkout Pembelian</h1>
                <p className="text-gray-500 font-medium text-sm mt-1">Konfirmasi paket & metode pembayaran untuk aktivasi Kofilo.</p>
              </div>
            </div>

            {/* Metode Pembayaran Pakasir */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h2 className="font-black text-xl mb-1">Metode Pembayaran</h2>
              <p className="text-gray-500 font-medium text-sm mb-6">Silakan pilih cara pembayaran yang paling mudah untuk Anda.</p>

              {!payment ? (
                <>
                  <PakasirMethodPicker
                    amount={plan.price}
                    method={method}
                    fees={fees}
                    feesLoading={feesLoading}
                    onSelect={(m) => setMethod(m)}
                  />
                  {payError && (
                    <div className="mt-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl p-3 border border-red-100">{payError}</div>
                  )}
                </>
              ) : (
                <PakasirPaymentView />
              )}
            </div>
          </div>
{/* ── KOLOM KANAN: Ringkasan Order ── */}
          <aside className="w-full lg:w-[400px] h-max lg:sticky lg:top-24 bg-[#1a1f36] text-white rounded-[36px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.25)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#6C4E31] blur-[120px] rounded-full opacity-40 pointer-events-none"></div>
            <h2 className="font-black text-xl mb-1 relative z-10">Ringkasan Pesanan</h2>
            <p className="text-gray-400 font-medium text-xs mb-6 relative z-10">Kofilo Subscription · Bulanan</p>

            <div className="flex items-center justify-between relative z-10 mb-6">
              <div>
                <p className="font-black text-lg">{plan.name}</p>
                <p className="text-gray-400 text-xs">{plan.highlight ? "Akses Super Admin" : "Akses POS saja"}</p>
              </div>
              <span className="bg-gradient-to-r from-[#d4a373] to-[#6C4E31] text-[11px] font-black uppercase px-3 py-1.5 rounded-full">
                {plan.highlight ? "Paling Laris" : "Paket"}
              </span>
            </div>

            <ul className="space-y-2.5 text-sm relative z-10 text-gray-300">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-white"><svg className="w-5 h-5 text-[#d4a373] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {f}</li>
              ))}
            </ul>

            <div className="border-t border-dashed border-gray-600 my-6"></div>
            <div className="flex justify-between text-sm relative z-10">
              <span className="text-gray-400">Subtotal ({plan.name})</span>
              <span>{formatRpFull(plan.price)}</span>
            </div>
            <div className="flex justify-between text-sm relative z-10">
              <span className="text-gray-400">Tax</span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between text-2xl font-black mt-4 relative z-10">
              <span>Total</span>
              <span>{formatRpFull(plan.price)}</span>
            </div>

            {payError && !payment && (
              <div className="mt-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl p-3 border border-red-100 relative z-10">{payError}</div>
            )}

            {!payment && (
            <button
              onClick={handleConfirm}
              disabled={!method || status === "creating"}
              className={`mt-6 block w-full py-4 text-center rounded-full relative z-10 transition-all ${
                status === "creating"
                  ? "bg-gray-500 text-white cursor-wait"
                  : method
                    ? "bg-gradient-to-r from-[#6C4E31] to-[#583f27] text-white font-black shadow-[0_10px_20px_rgba(108,78,49,0.4)] hover:scale-[1.02]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {status === "creating" ? "Memproses Pembayaran..." : `Konfirmasi & Bayar ${formatRpFull(plan.price)}`}
            </button>
            )}

            <p className="text-[11px] text-gray-400 mt-3 relative z-10 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 013 3v1h2a1 1 0 011 1v11a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1h2V5a3 3 0 013-3zm0 2a1 1 0 00-1 1v1h2V5a1 1 0 00-1-1z" /></svg>
              Secure SSL-Encrypted · Pembayaran via Pakasir
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf7f2]" />}>
      <CheckoutContent />
    </Suspense>
  );
}