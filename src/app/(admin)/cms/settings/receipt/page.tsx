"use client";

import { useState, useEffect } from "react";

export default function ReceiptSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });
  
  const [storeName, setStoreName] = useState("Craft Coffee"); 

  const [formData, setFormData] = useState({
    receiptFooter: "Terima kasih atas kunjungannya!",
    wifiName: "",       // 🔥 State Baru
    wifiPassword: "",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  useEffect(() => {
    const fetchReceiptSettings = async () => {
      try {
        const res = await fetch("/api/settings/receipt");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setStoreName(data.settings.storeName || "Craft Coffee");
            setFormData({
              receiptFooter: data.settings.receiptFooter || "Terima kasih atas kunjungannya!",
              wifiName: data.settings.wifiName || "", // 🔥 Set Data
              wifiPassword: data.settings.wifiPassword || "",
            });
          }
        }
      } catch (error) {
        console.error("Gagal load pengaturan struk", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceiptSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/receipt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      showToast("success", "Pengaturan struk berhasil disimpan!");
    } catch (error: any) {
      showToast("error", error.message || "Gagal menyimpan perubahan");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center text-[#6C4E31] gap-4 h-full">
        <div className="w-8 h-8 border-4 border-[#6C4E31] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold animate-pulse">Memuat Konfigurasi Struk...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans">
      
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Receipt Config</h1>
        <p className="text-[15px] font-medium text-gray-500 mt-1">Sesuaikan informasi tambahan yang akan tercetak di struk kasir pelanggan.</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        
        {/* ── BAGIAN KIRI: FORMULIR ── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-[24px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
            <h2 className="text-[16px] font-black mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-lg">🖨️</span>
              Detail Cetakan
            </h2>

            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Pesan Penutup (Footer)</label>
                <textarea value={formData.receiptFooter} onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all min-h-[100px]" 
                  placeholder="Terima kasih atas kunjungannya! Follow IG kami @kofilo.id" required></textarea>
                <p className="text-[11px] text-gray-400 font-medium">Pesan ini akan muncul di bagian paling bawah struk.</p>
              </div>

              {/* 🔥 TAMBAHAN UI: Nama WiFi 🔥 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Nama WiFi (SSID)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-[14px] text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                    </span>
                    <input type="text" value={formData.wifiName} onChange={(e) => setFormData({ ...formData, wifiName: e.target.value })}
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl pl-12 pr-4 py-3.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" 
                      placeholder="Kofilo_Guest" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Password WiFi</label>
                  <div className="relative">
                    <span className="absolute left-4 top-[14px] text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                    <input type="text" value={formData.wifiPassword} onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl pl-12 pr-4 py-3.5 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#6C4E31]/10 focus:border-[#6C4E31]/40 transition-all" 
                      placeholder="Password..." />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">Otomatis mencetak informasi WiFi di struk jika Password diisi.</p>

            </div>

            <div className="flex justify-end pt-8 mt-4 border-t border-gray-100">
              <button type="submit" disabled={submitting}
                className="bg-[#1a1f36] text-white px-8 py-4 rounded-2xl font-extrabold text-[15px] shadow-[0_8px_20px_-6px_rgba(26,31,54,0.3)] hover:bg-[#2a314d] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:translate-y-0 w-full sm:w-auto">
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* ── BAGIAN KANAN: LIVE PREVIEW STRUK ── */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[320px] sticky top-8">
            <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Live Preview</h3>
            
            <div className="bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-repeat-x bg-[length:10px_10px] bg-gradient-to-b from-[#fafbfc] to-transparent" style={{ backgroundImage: 'radial-gradient(circle at 5px 0, transparent 5px, white 6px)' }}></div>
              
              <div className="font-mono text-[13px] text-gray-800 flex flex-col gap-3 pt-2">
                
                <div className="text-center">
                  <h2 className="font-black text-[18px] uppercase tracking-wider">{storeName}</h2>
                  <p className="text-[11px] text-gray-500 mt-1">Jl. Senopati No. 42, Jakarta</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-1"></div>

                <div className="flex justify-between text-[11px]">
                  <span>{today} {time}</span>
                  <span>Kasir: Admin</span>
                </div>
                <div className="text-[11px]">No: TX99827361</div>

                <div className="border-b-2 border-dashed border-gray-300 my-1"></div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <span>2x Artisan Latte<br/><span className="text-[10px] ml-4 text-gray-500">- Ice, Less Sugar</span></span>
                    <span>56.000</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span>1x Croissant</span>
                    <span>25.000</span>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-1"></div>

                <div className="flex justify-between font-bold text-[14px]">
                  <span>TOTAL</span>
                  <span>Rp 81.000</span>
                </div>

                <div className="border-b-2 border-dashed border-gray-300 my-1"></div>

                {/* 🔥 UBAHAN: Live Preview membaca wifiName */}
                {formData.wifiPassword && (
                  <div className="text-center text-[11px] bg-gray-100/50 py-2.5 rounded-lg border border-gray-200">
                    <span className="font-bold">Wi-Fi:</span> {formData.wifiName || "Guest_WiFi"}<br/>
                    <span className="font-bold text-[#6C4E31]">Pass: {formData.wifiPassword}</span>
                  </div>
                )}

                <div className="text-center mt-2 text-[12px] whitespace-pre-wrap leading-relaxed text-gray-500">
                  {formData.receiptFooter || "Terima kasih atas kunjungannya!"}
                </div>

              </div>

              <div className="absolute bottom-0 left-0 right-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 5px 10px, transparent 5px, white 6px)', transform: 'rotate(180deg)' }}></div>
            </div>
            
            <div className="w-[90%] h-4 bg-gray-200/50 mx-auto rounded-full blur-md mt-2"></div>
          </div>
        </div>
      </div>

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