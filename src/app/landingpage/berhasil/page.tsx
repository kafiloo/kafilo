"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadOrder, formatRpFull, type KofiloOrder } from "@/lib/plans";

export default function BerhasilPage() {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState<KofiloOrder | null>(null);

  useEffect(() => {
    setOrder(loadOrder());
  }, []);

  // Auto-redirect kembali ke landing page
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (count <= 0) {
      router.push("/landingpage");
    }
  }, [count, router]);

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans text-[#1a1f36] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .bg-grid-pattern { background-image: radial-gradient(rgba(108, 78, 49, 0.15) 1px, transparent 1px); background-size: 40px 40px; }
      ` }} />
      <div className="absolute inset-0 bg-grid-pattern opacity-60 -z-10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-200/30 rounded-full blur-[150px] -z-10 animate-pulse pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-[40px] p-10 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] border border-gray-100 relative">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 text-[12px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
          Payment Berhasil
        </span>

        <h1 className="text-3xl font-black tracking-tight mb-2">Terima kasih!</h1>
        <p className="text-gray-500 font-medium text-[15px] mb-8">
          Pembayaran paket <strong className="text-[#1a1f36]">{order?.planName}</strong> senilai{" "}
          <strong className="text-[#1a1f36]">{order ? formatRpFull(order.amount) : ""}</strong> telah
          dikonfirmasi. Akun Super Admin Anda sedang diaktifkan.
        </p>

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-8 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">No. Pesanan</span><strong className="font-mono">{order?.orderId || "—"}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Metode</span><strong>{order?.methodLabel || "—"}</strong></div>
          <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><strong>{order ? `${order.date} · ${order.time}` : "—"}</strong></div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/landingpage/nota"
            className="block w-full py-4 text-center rounded-full bg-[#1a1f36] hover:bg-[#6C4E31] text-white font-black shadow-lg transition-all"
          >
            Lihat Nota Pembelian
          </Link>
          <Link
            href="/landingpage"
            className="block w-full py-4 text-center rounded-full bg-gray-50 border border-gray-200 text-[#1a1f36] font-bold hover:bg-gray-100 transition-all"
          >
            Kembali ke Landing Page
          </Link>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-8 flex items-center gap-2">
        <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-[#6C4E31] rounded-full animate-spin"></span>
        Dialihkan ke landing page dalam {count}s...
      </p>
    </div>
  );
}