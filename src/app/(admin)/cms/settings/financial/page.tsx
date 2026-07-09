"use client";

import { useState, useEffect } from "react";

export default function FinancialSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });

  const [formData, setFormData] = useState({
    taxRate: "0",
    serviceCharge: "0",
    acceptCash: true,
    acceptQris: true,
    acceptTransfer: false,
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        const res = await fetch("/api/settings/financial");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setFormData({
              taxRate: data.settings.taxRate?.toString() || "0",
              serviceCharge: data.settings.serviceCharge?.toString() || "0",
              acceptCash: data.settings.acceptCash ?? true,
              acceptQris: data.settings.acceptQris ?? true,
              acceptTransfer: data.settings.acceptTransfer ?? false,
            });
          }
        }
      } catch (error) {
        console.error("Gagal load pengaturan keuangan", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancial();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        taxRate: parseFloat(formData.taxRate) || 0,
        serviceCharge: parseFloat(formData.serviceCharge) || 0,
        acceptCash: formData.acceptCash,
        acceptQris: formData.acceptQris,
        acceptTransfer: formData.acceptTransfer,
      };

      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      showToast("success", "Pengaturan keuangan berhasil disimpan!");
    } catch (error: any) {
      showToast("error", error.message || "Gagal menyimpan perubahan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center text-[#6C4E31] gap-4 h-full">
        <div className="w-8 h-8 border-4 border-[#6C4E31] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold animate-pulse">Memuat Pengaturan Keuangan...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans">
      
      {/* ── HEADER ── */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Finance & Taxes</h1>
        <p className="text-[15px] font-medium text-gray-500 mt-1">Atur pajak, biaya layanan, dan metode pembayaran yang diterima tokomu.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
        
        {/* ── SECTION 1: PAJAK & BIAYA TAMBAHAN ── */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <h2 className="text-[16px] font-black mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center text-lg">💰</span>
            Biaya Tambahan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Pajak (PPN / PB1)</label>
              <div className="relative">
                <input type="number" step="0.1" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 pr-12 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" min="0" max="100" />
                <span className="absolute right-4 top-[14px] font-black text-gray-400">%</span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Contoh: 10 atau 11 untuk PPN.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Service Charge</label>
              <div className="relative">
                <input type="number" step="0.1" value={formData.serviceCharge} onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 pr-12 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" min="0" max="100" />
                <span className="absolute right-4 top-[14px] font-black text-gray-400">%</span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Biaya layanan restoran/kafe (kosongkan jika tidak ada).</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: METODE PEMBAYARAN ── */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <h2 className="text-[16px] font-black mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-lg">💳</span>
            Metode Pembayaran
          </h2>
          <p className="text-[13px] text-gray-500 mb-6 font-medium">Aktifkan metode pembayaran yang dapat dipilih oleh pelanggan saat checkout.</p>

          <div className="flex flex-col gap-3">
            {/* Cash */}
            <label className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-colors ${formData.acceptCash ? 'border-[#6C4E31]/20 bg-[#6C4E31]/5' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">💵</div>
                <div>
                  <p className="font-extrabold text-[15px] text-[#1a1f36]">Bayar Tunai (Cash)</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Bayar langsung di kasir</p>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={formData.acceptCash} onChange={(e) => setFormData({...formData, acceptCash: e.target.checked})} />
                <div className={`block w-12 h-7 rounded-full transition-colors ${formData.acceptCash ? 'bg-[#6C4E31]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.acceptCash ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>

            {/* QRIS */}
            <label className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-colors ${formData.acceptQris ? 'border-[#6C4E31]/20 bg-[#6C4E31]/5' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15zM7.5 7.5a1.5 1.5 0 00-1.5 1.5v6a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-6z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <p className="font-extrabold text-[15px] text-[#1a1f36]">QRIS & E-Wallet</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Scan kode QR di kasir</p>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={formData.acceptQris} onChange={(e) => setFormData({...formData, acceptQris: e.target.checked})} />
                <div className={`block w-12 h-7 rounded-full transition-colors ${formData.acceptQris ? 'bg-[#6C4E31]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.acceptQris ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>

            {/* Transfer Bank */}
            <label className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-colors ${formData.acceptTransfer ? 'border-[#6C4E31]/20 bg-[#6C4E31]/5' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg text-emerald-500">🏦</div>
                <div>
                  <p className="font-extrabold text-[15px] text-[#1a1f36]">Transfer Bank</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Pembayaran via virtual account / mutasi</p>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={formData.acceptTransfer} onChange={(e) => setFormData({...formData, acceptTransfer: e.target.checked})} />
                <div className={`block w-12 h-7 rounded-full transition-colors ${formData.acceptTransfer ? 'bg-[#6C4E31]' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.acceptTransfer ? 'transform translate-x-5' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={submitting}
            className="bg-[#1a1f36] text-white px-10 py-4 rounded-2xl font-extrabold text-[15px] shadow-[0_8px_20px_-6px_rgba(26,31,54,0.3)] hover:bg-[#2a314d] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:translate-y-0">
            {submitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {/* ── TOAST NOTIFICATION ── */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-[20px] p-4 pr-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border flex items-center gap-4 min-w-[300px] bg-white ${toast.type === "success" ? "border-emerald-100" : "border-rose-100"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>
              {toast.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <p className="text-[14px] font-bold text-[#1a1f36] flex-1">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}