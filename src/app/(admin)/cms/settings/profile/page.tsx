"use client";

import { useState, useEffect } from "react";

export default function StoreProfilePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });

  const [formData, setFormData] = useState({
    storeName: "",
    logo: "",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  // Ambil Data Saat Pertama Kali Render
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/settings/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setFormData({
              storeName: data.settings.storeName || "",
              logo: data.settings.logo || "",
            });
          }
        }
      } catch (error) {
        console.error("Gagal load profil toko", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fungsi Konversi File Gambar ke Base64 (Agar mudah disimpan di database langsung)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("error", "Ukuran gambar maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Simpan Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      showToast("success", "Profil toko berhasil disimpan!");
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
        <p className="text-sm font-bold animate-pulse">Memuat Profil Toko...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans">
      
      {/* ── HEADER ── */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Store Profile</h1>
        <p className="text-[15px] font-medium text-gray-500 mt-1">Atur identitas utama tokomu yang akan dilihat oleh pelanggan di PWA.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
        
        {/* ── SECTION: VISUAL BRANDING & INFORMASI ── */}
        <div className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <h2 className="text-[16px] font-black mb-8 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-lg">✨</span>
            Identitas Toko
          </h2>

          <div className="grid grid-cols-1 gap-8">
            
            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Logo Toko (1:1)</label>
              <div className="flex items-center gap-5 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <div className="w-20 h-20 rounded-[20px] bg-white border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl opacity-40">☕</span>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" id="logo-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <label htmlFor="logo-upload" className="inline-block bg-white border border-gray-200 text-[#1a1f36] font-bold rounded-xl px-5 py-2.5 text-[13px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                    Pilih Logo Baru
                  </label>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">Disarankan format PNG/JPG transparan. Maksimal ukuran file 2MB.</p>
                </div>
              </div>
            </div>

            {/* Nama Toko */}
            <div className="space-y-3">
              <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Nama Toko</label>
              <input 
                type="text" 
                value={formData.storeName} 
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-5 py-4 text-[15px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" 
                placeholder="Masukkan nama tokomu..."
                required 
              />
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