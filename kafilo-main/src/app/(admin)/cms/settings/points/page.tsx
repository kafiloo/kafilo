"use client";

import { useState, useEffect } from "react";

export default function PointsRuleSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });

  const [formData, setFormData] = useState({
    loyaltyEnabled: true,
    rewardPerAmount: "10000",
    pointsEarned: "1",
    registrationPoints: "0",
    pointsExpiryDays: "365", // Tambahan default 1 tahun
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  useEffect(() => {
    const fetchPointsSettings = async () => {
      try {
        const res = await fetch("/api/settings/points");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setFormData({
              loyaltyEnabled: data.settings.loyaltyEnabled ?? true,
              rewardPerAmount: data.settings.rewardPerAmount?.toString() || "10000",
              pointsEarned: data.settings.pointsEarned?.toString() || "1",
              registrationPoints: data.settings.registrationPoints?.toString() || "0",
              pointsExpiryDays: data.settings.pointsExpiryDays?.toString() || "365", // Tarik data dari DB
            });
          }
        }
      } catch (error) {
        console.error("Gagal load pengaturan poin", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPointsSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        loyaltyEnabled: formData.loyaltyEnabled,
        rewardPerAmount: parseInt(formData.rewardPerAmount),
        pointsEarned: parseInt(formData.pointsEarned),
        registrationPoints: parseInt(formData.registrationPoints),
        pointsExpiryDays: parseInt(formData.pointsExpiryDays), // Kirim payload ke API
      };

      const res = await fetch("/api/settings/points", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      showToast("success", "Aturan poin berhasil disimpan!");
    } catch (error: any) {
      showToast("error", error.message || "Gagal menyimpan perubahan");
    } finally {
      setSubmitting(false);
    }
  };

  // Kalkulasi Simulasi
  const sampleAmount = 55000;
  const simulatedPoints = Math.floor(sampleAmount / (parseInt(formData.rewardPerAmount) || 1)) * (parseInt(formData.pointsEarned) || 0);

  if (loading) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center text-[#6C4E31] gap-4 h-full">
        <div className="w-8 h-8 border-4 border-[#6C4E31] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold animate-pulse">Memuat Aturan Poin...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans">
      
      {/* ── HEADER ── */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Points Rule</h1>
        <p className="text-[15px] font-medium text-gray-500 mt-1">Konfigurasi sistem poin pelanggan untuk Loyalty Hub Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
        
        {/* ── SECTION 1: MASTER SWITCH ── */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-[16px] font-black flex items-center gap-2 mb-1">
                <span className="w-8 h-8 bg-[#6C4E31]/10 text-[#6C4E31] rounded-xl flex items-center justify-center text-lg">🎁</span>
                Aktifkan Program Loyalty
              </h2>
              <p className="text-[13px] text-gray-500 font-medium">Jika dimatikan, pelanggan tidak akan mendapat poin baru saat transaksi.</p>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, loyaltyEnabled: !formData.loyaltyEnabled })}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${formData.loyaltyEnabled ? "bg-[#6C4E31]" : "bg-gray-200"}`}>
              <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${formData.loyaltyEnabled ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* ── SECTION 2: SKEMA PERHITUNGAN POIN ── */}
        <div className={`transition-all duration-300 ${!formData.loyaltyEnabled ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
          <div className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
            <h2 className="text-[16px] font-black mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-lg">🧮</span>
              Skema Konversi Transaksi
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <div className="space-y-2 flex-1 w-full">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Setiap Belanja Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-[14px] font-black text-gray-400">Rp</span>
                  <input type="number" value={formData.rewardPerAmount} onChange={(e) => setFormData({ ...formData, rewardPerAmount: e.target.value })}
                    className="w-full bg-white border border-gray-200 text-[#1a1f36] font-bold rounded-2xl pl-12 pr-4 py-3.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" min="1" required />
                </div>
              </div>

              <div className="hidden md:flex mt-6 text-gray-300 font-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
              </div>

              <div className="space-y-2 flex-1 w-full">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Mendapatkan Berapa Poin?</label>
                <div className="relative">
                  <input type="number" value={formData.pointsEarned} onChange={(e) => setFormData({ ...formData, pointsEarned: e.target.value })}
                    className="w-full bg-white border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 pr-14 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all text-center" min="1" required />
                  <span className="absolute right-4 top-[14px] font-black text-gray-400">pts</span>
                </div>
              </div>
            </div>

            {/* Simulasi Pintar */}
            <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-blue-500 uppercase tracking-widest">Simulasi Transaksi</p>
                <p className="text-[14px] font-medium text-[#1a1f36] mt-1">Jika pelanggan belanja <strong className="font-black">Rp {sampleAmount.toLocaleString('id-ID')}</strong></p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-gray-500 font-medium line-through">Dapat Poin:</p>
                <p className="text-[20px] font-black text-blue-600">+{simulatedPoints} Pts</p>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: KADALUARSA & BONUS ── */}
          <div className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] mt-6">
            <h2 className="text-[16px] font-black mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center text-lg">⏳</span>
              Masa Berlaku & Bonus Poin
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expiry Input */}
              <div className="space-y-2">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Masa Kadaluarsa Poin</label>
                <div className="relative">
                  <input type="number" value={formData.pointsExpiryDays} onChange={(e) => setFormData({ ...formData, pointsExpiryDays: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl pl-4 pr-16 py-3.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" min="0" />
                  <span className="absolute right-4 top-[14px] font-black text-gray-400">Hari</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">Berapa lama poin bisa disimpan. <strong className="text-rose-500">Isi 0 jika tidak ada kadaluarsa.</strong></p>
              </div>

              {/* Welcome Bonus Input */}
              <div className="space-y-2">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Welcome Poin (Pengguna Baru)</label>
                <div className="relative">
                  <input type="number" value={formData.registrationPoints} onChange={(e) => setFormData({ ...formData, registrationPoints: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl pl-4 pr-12 py-3.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" min="0" />
                  <span className="absolute right-4 top-[14px] font-black text-gray-400">pts</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium">Bonus poin gratis untuk pelanggan saat pertama mendaftar via PWA.</p>
              </div>
            </div>
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