"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function CustomerLandingPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  // Karena ini Client Component di Next.js 15, params harus di-unwrap dengan use()
  const { tableId } = use(params);

  const [storeInfo, setStoreInfo] = useState({
    name: "Kafiloo",
    logo: null as string | null,
    openTime: "07:00",
    closeTime: "22:00",
  });
  
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStoreStatus = async () => {
      try {
        const res = await fetch("/api/public/store", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const s = data.settings;
            
            setStoreInfo({
              name: s.storeName || "Kafiloo",
              logo: s.logo || null,
              openTime: s.openTime || "07:00",
              closeTime: s.closeTime || "22:00",
            });

            // 🔥 KONVERSI KE MENIT UNTUK PERBANDINGAN PRESISI 🔥
            const timeToMinutes = (t: string) => {
              const parts = t.split(/[:.]/);
              return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const openMinutes = timeToMinutes(s.openTime || "07:00");
            const closeMinutes = timeToMinutes(s.closeTime || "22:00");

            // 🔥 LOGIKA TIGA MODE & PERBAIKAN JAM LEWAT TENGAH MALAM 🔥
            let openStatus = false;
            
            if (s.storeMode === "FORCE_OPEN") {
              openStatus = true;
            } else if (s.storeMode === "FORCE_CLOSE") {
              openStatus = false;
            } else {              
              if (openMinutes <= closeMinutes) {
                // Jam normal (misal 07:00 sampai 22:00)
                openStatus = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
              } else {
                // Shift malam/subuh (misal 09:00 sampai 00:00 atau 02:00)
                openStatus = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
              }
            }

            setIsStoreOpen(openStatus);
          }
        }
      } catch (error) {
        console.error("Gagal load info toko:", error);
      } finally {
        setLoading(false);
      }
    };

    // Eksekusi pertama kali
    checkStoreStatus();
    
    // Pasang radar pengecekan setiap 10 detik
    intervalId = setInterval(checkStoreStatus, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Tampilkan loading spinner yang elegan saat mengecek status pertama kali
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #EAE4D9 0%, #F9F7F3 30%, #FCFBF9 100%)' }}>
         <div className="animate-spin w-8 h-8 border-4 border-[#3d2c20] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col p-6 overflow-hidden font-sans selection:bg-[#3d2c20] selection:text-white"
         style={{ background: 'linear-gradient(160deg, #EAE4D9 0%, #F9F7F3 30%, #FCFBF9 100%)' }}>
      
      {/* ── HEADER (KIRI ATAS) ── */}
      <div className="relative z-20 flex items-center gap-3 pt-6 pb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        {storeInfo.logo ? (
          <img src={storeInfo.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover bg-[#3d2c20]" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#3d2c20] flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 3a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3.75A.75.75 0 017.5 3zM16.5 3a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3.75a.75.75 0 01.75-.75z" />
              <path fillRule="evenodd" d="M3 8.25A1.5 1.5 0 014.5 6.75h15a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5h-1.5a.75.75 0 00-.75.75v.52a8.251 8.251 0 01-5.748 7.922 4.5 4.5 0 01-5.004 0A8.251 8.251 0 016.75 12.02v-.52a.75.75 0 00-.75-.75H4.5a1.5 1.5 0 01-1.5-1.5v-1.5zm6.75 2.25a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-1.5z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <span className="font-semibold text-[20px] text-[#1A1A1A] tracking-tight">{storeInfo.name}</span>
      </div>

      {/* ── KONTEN UTAMA ── */}
      <div className="relative z-20 flex flex-col flex-1 animate-in fade-in duration-1000 delay-150">
        
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
          MENTENG • JAKARTA
        </p>

        <h1 className="text-[48px] leading-[1.1] text-[#1A1A1A] tracking-tight mb-6">
          <span className="font-bold">Slow coffee,</span><br />
          <span className="font-serif italic text-[#B57C54]">served kindly.</span>
        </h1>

        <p className="text-[#555555] text-[16px] leading-[1.6] max-w-md mb-10">
          A quieter way to order. Pick a drink, adjust it to how you like it, and skip the queue. Fresh brews, made this morning.
        </p>

        {/* ── INFO CARDS ── */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-transparent border border-gray-200/80 rounded-[20px] p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">OPEN</span>
            <span className="text-[13px] font-semibold text-[#1A1A1A]">{storeInfo.openTime} — {storeInfo.closeTime}</span>
          </div>
          <div className="bg-transparent border border-gray-200/80 rounded-[20px] p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PREP</span>
            <span className="text-[13px] font-semibold text-[#1A1A1A]">~ 6 min</span>
          </div>
          <div className="bg-transparent border border-gray-200/80 rounded-[20px] p-4 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TABLE</span>
            <span className="text-[13px] font-semibold text-[#1A1A1A] break-all">Seat {tableId}</span>
          </div>
        </div>
      </div>

      {/* ── BAGIAN BAWAH (CTA & FOOTER) ── */}
      <div className="relative z-20 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        
        {isStoreOpen ? (
          <Link 
            href={`/${tableId}/menu`}
            className="w-full bg-[#3d2c20] text-white py-5 px-6 rounded-[28px] font-medium text-[16px] transition-transform active:scale-[0.98] flex justify-between items-center shadow-lg group"
          >
            <span>View menu & order</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        ) : (
          <div className="w-full bg-[#e6ded5] text-[#3d2c20] py-5 px-6 rounded-[28px] flex justify-between items-center opacity-80 cursor-not-allowed transition-all">
            <div className="flex flex-col">
              <span className="font-semibold text-[15px]">Toko Sedang Tutup</span>
              <span className="text-[12px] opacity-70">Pemesanan online tidak tersedia.</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#3d2c20]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>
        )}

        <p className="text-[#888888] text-[11px] text-center mt-6 tracking-wide">
          No account needed - Pay at the counter or via QRIS
        </p>
      </div>

    </div>
  );
}