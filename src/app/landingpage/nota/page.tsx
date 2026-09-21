"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadOrder, formatRpFull, getPlan, type KofiloOrder, type Plan } from "@/lib/plans";

export default function NotaPage() {
  const [order, setOrder] = useState<KofiloOrder | null>(null);
  const [plan, setPlan] = useState<Plan | undefined>(undefined);

  useEffect(() => {
    const o = loadOrder();
    setOrder(o);
    setPlan(o ? getPlan(o.planId) : undefined);
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="min-h-screen bg-[#1a1f36] font-sans text-[#1a1f36] py-10 px-6 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { body { background: #fff !important; } .no-print { display: none !important; } }
      ` }} />

      {/* ── Toolbar atas (tidak ikut cetak) ── */}
      <div className="max-w-lg mx-auto flex justify-between items-center mb-6 no-print">
        <Link href="/landingpage/berhasil" className="text-white/80 hover:text-white text-sm font-bold transition-all flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">←</span> Kembali
        </Link>
        <button
          onClick={handlePrint}
          className="bg-[#6C4E31] hover:bg-[#583f27] text-white px-5 py-2.5 rounded-full text-sm font-black shadow-lg transition-all"
        >
          🖨️ &nbsp;Cetak Nota
        </button>
      </div>

      {/* ── Kartu Nota ── */}
      <div className="max-w-lg mx-auto bg-white rounded-[32px] shadow-2xl overflow-hidden">
        {/* Nota header */}
        <div className="bg-[#1a1f36] text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#6C4E31] blur-[80px] rounded-full opacity-40 pointer-events-none"></div>
          <div className="w-14 h-14 mx-auto rounded-full bg-[#6C4E31] flex items-center justify-center text-2xl font-black mb-3">K</div>
          <p className="font-black text-2xl tracking-tight">Kofilo.</p>
          <p className="text-gray-400 text-xs mt-1">Software F&B · Invoice / Nota Pembelian</p>
          <div className="mt-5 text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">No. Pesanan</p>
            <p className="font-mono text-lg text-[#d4a373]">{order?.orderId || "—"}</p>
          </div>
        </div>

        <div className="p-8">
          {/* Info tanggal & status */}
          <div className="flex justify-between items-center text-sm mb-6">
            <div className="space-y-1">
              <p className="text-gray-500 text-xs">Tanggal</p>
              <p className="font-bold">{order?.date || "—"}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-gray-500 text-xs">Status</p>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 text-[11px] font-black uppercase px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lunas
              </span>
            </div>
          </div>

          {/* Produk / paket */}
          <div className="border-t border-dashed border-gray-200 py-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-black text-lg">{order?.planName || "Paket Kofilo"}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">{plan?.highlight ? "Akses Super Admin" : "Akses POS saja"} · Berlangganan bulanan</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400">Subtotal</p>
                <p className="font-black">{order ? formatRpFull(order.amount) : "—"}</p>
              </div>
            </div>
          </div>

          {/* Rincian pembayaran */}
          <div className="border-t border-dashed border-gray-200 py-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{order ? formatRpFull(order.amount) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pajak</span><span>Gratis</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Metode</span><span className="font-bold">{order?.methodLabel || "—"}</span></div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-black text-base">Total Bayar</span>
              <span className="font-black text-2xl text-[#6C4E31]">{order ? formatRpFull(order.amount) : "—"}</span>
            </div>
          </div>

          {/* TTD / footer */}
          <div className="border-t border-dashed border-gray-200 pt-6 flex justify-between items-end">
            <div className="text-xs text-gray-400">
              <p className="font-black text-[#1a1f36] mb-1">Administrator</p>
              <p>Kofilo. F&B</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1">Nominal diterima</p>
              <svg className="mx-auto w-24 h-10 opacity-70 rotate-[-3deg]" viewBox="0 0 120 40" fill="none"><path d="M10 32 Q 40 20 110 26" stroke="#1a1f36" strokeWidth="2" strokeDasharray="4 3"/></svg>
              <p className="font-serif italic text-sm">Kofilo. Finance</p>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
            12, Jalan Kofilo · Jakarta · <span className="font-mono">web.kofilo@kafilo.com</span><br/>
            Terima kasih telah mempercayakan bisnis Anda pada Kofilo. ☕
          </p>
        </div>
      </div>
    </div>
  );
}