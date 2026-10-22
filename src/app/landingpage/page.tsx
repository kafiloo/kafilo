"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── KOMPONEN REVEAL ──
const Reveal = ({ 
  children, 
  delay = 0, 
  direction = "up", 
  type = "slide",
  className = "" 
}: { 
  children: React.ReactNode, 
  delay?: number, 
  direction?: "up" | "down" | "left" | "right", 
  type?: "slide" | "scale" | "blur",
  className?: string 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const baseClasses = "transition-all duration-[1000ms] cubic-bezier(0.25, 1, 0.5, 1)";
  const opacityClass = isVisible ? "opacity-100" : "opacity-0";
  
  let effectClass = "";
  if (!isVisible) {
    if (type === "slide") {
      if (direction === "up") effectClass = "translate-y-16";
      if (direction === "down") effectClass = "-translate-y-16";
      if (direction === "left") effectClass = "translate-x-16";
      if (direction === "right") effectClass = "-translate-x-16";
    }
    if (type === "scale") effectClass = "scale-90 translate-y-10";
    if (type === "blur") effectClass = "blur-xl translate-y-12 scale-95";
  } else {
    effectClass = "translate-y-0 translate-x-0 scale-100 blur-0";
  }

  return (
    <div ref={ref} className={`${baseClasses} ${opacityClass} ${effectClass} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

export default function KofiloLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // State Profil Toko
  const [storeInfo, setStoreInfo] = useState({ name: "Kafiloo", logo: "" });

  // Fetch data nama dan logo
  useEffect(() => {
    fetch("/api/public/store")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setStoreInfo({
            name: data.settings.storeName || "Kafiloo",
            logo: data.settings.logo || ""
          });
        }
      }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const faqs = [
    { q: "Apakah Kofilo membutuhkan alat kasir khusus yang mahal?", a: "Sama sekali tidak. Kofilo berbasis Cloud & Web. Anda bisa menggunakannya di iPad, Tablet Android, Laptop, PC kasir, bahkan Smartphone yang sudah Anda miliki saat ini." },
    { q: "Bagaimana cara kerja PWA Self-Order untuk pelanggan?", a: "Pelanggan cukup scan QR Code yang ada di meja mereka. Menu interaktif akan langsung terbuka di browser HP tanpa perlu repot mendownload aplikasi apa pun." },
    { q: "Apakah poin loyalty otomatis bertambah ke akun pelanggan?", a: "Tentu! Setiap pelanggan melakukan pembayaran dan memasukkan nomor HP, sistem akan menghitung dan menambahkan poin secara otomatis sesuai nominal belanja." },
    { q: "Bisakah Kofilo memantau banyak cabang sekaligus?", a: "Bisa. Dengan Kofilo Pro, Anda mendapatkan akses Super Admin untuk memantau laporan penjualan, stok, dan kasir dari berbagai cabang dalam satu layar secara real-time." },
    { q: "Bagaimana jika internet di kafe sedang mati?", a: "Kofilo dirancang dengan sistem PWA yang memiliki cache lokal sementara. Anda tetap bisa melihat menu, meski sinkronisasi transaksi harus menunggu koneksi kembali." }
  ];

  const storeInitial = storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : "K";

  return (
    <div className="min-h-screen bg-[#FEFAF1] text-[#1a1f36] font-sans selection:bg-[#1a1f36] selection:text-white overflow-hidden relative">
      
      {/* ── CSS KEYFRAMES ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: flex; animation: marquee 30s linear infinite; }
      `}} />

      {/* ── NAVBAR ── */}
      <div className="fixed top-0 w-full z-50 p-4 transition-all duration-500 pointer-events-none">
        <nav className={`max-w-7xl mx-auto pointer-events-auto transition-all duration-500 rounded-full px-6 py-3 flex items-center justify-between ${scrolled ? "bg-[#FCFBF7]/90 backdrop-blur-md shadow-sm" : "bg-transparent py-4"}`}>
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-all duration-300" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300 relative">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              </div>
            )}
            <span className="font-bold text-[18px] tracking-tight">{storeInfo.name}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {['Fitur', 'Showcase', 'Review', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={(e) => scrollToSection(e, item.toLowerCase().replace(' ', '-'))} 
                 className="text-[14px] font-medium text-gray-500 hover:text-[#1a1f36] transition-colors duration-300">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
             <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white hover:text-black transition-all bg-transparent shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
             </button>
          </div>
        </nav>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-16 lg:pt-48 lg:pb-24 px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center z-10">
        
        <Reveal type="scale" delay={150}>
          <h1 className="text-[44px] md:text-[64px] lg:text-[76px] font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto text-[#1a1f36]">
            Operasional kedai,<br />
            terasa <span className="italic font-normal">refined.</span>
          </h1>
        </Reveal>

        <Reveal type="slide" delay={300}>
          <p className="text-[15px] md:text-[17px] text-gray-500 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Kafiloo adalah platform kasir & operasional premium untuk kedai kopi dan restoran modern. Cepat, tenang, dan dibuat untuk tim yang serius soal detail.
          </p>
        </Reveal>

        <Reveal type="scale" delay={450}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/landingpage/checkout?plan=starter" className="w-full sm:w-auto bg-[#18181b] hover:bg-black text-white px-8 py-3.5 rounded-full text-[14.5px] font-medium transition-all flex items-center justify-center gap-2 group shadow-md hover:shadow-lg">
              Coba Demo Gratis
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>
            </Link>
            <a href="#harga" onClick={(e) => scrollToSection(e, 'harga')} className="w-full sm:w-auto bg-white text-[#1a1f36] px-8 py-3.5 rounded-full text-[14.5px] font-medium hover:bg-gray-50 transition-all border border-gray-200 shadow-sm">
              Lihat Paket & Harga
            </a>
          </div>
        </Reveal>

        {/* ── UI MOCKUP DASHBOARD ── */}
        <Reveal type="slide" delay={600} className="w-full">
          <div className="mt-20 relative w-full max-w-5xl mx-auto h-[450px] md:h-[650px] perspective-1000">
            <div className="absolute inset-0 bg-[#F6F4EC] rounded-[24px] md:rounded-[32px] p-2 md:p-3 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col border border-gray-100 shadow-inner">
                {/* Browser Header */}
                <div className="h-12 bg-[#FDFCF8] border-b border-gray-100 flex items-center px-4 md:px-6 gap-4 shrink-0">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white border border-gray-100 rounded-full px-8 py-1.5 text-[10px] text-gray-400 font-medium tracking-wide">
                      app.kafiloo.com/dashboard
                    </div>
                  </div>
                  <div className="w-10"></div>
                </div>
                
                {/* App Body */}
                <div className="flex-1 flex overflow-hidden bg-[#F8F9FA] text-[#1a1f36]">
                  {/* Sidebar */}
                  <div className="hidden md:flex w-64 bg-white border-r border-gray-100 p-6 flex-col shrink-0">
                    <div className="flex items-center gap-3 mb-10">
                       <div className="w-10 h-10 rounded-full bg-[#FCF3EA] flex items-center justify-center">
                         <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                       </div>
                       <div>
                         <p className="font-black text-[14px] leading-tight">Kofilo</p>
                         <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Workspace</p>
                       </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-11 w-full bg-white border-2 border-gray-800 shadow-sm rounded-xl flex items-center px-4 gap-3">
                        <svg className="w-4 h-4 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span className="font-bold text-[12px]">Dashboard</span>
                      </div>
                      <div className="h-10 w-full flex items-center px-4 gap-3 text-gray-400">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                         <span className="font-medium text-[12px]">Menu Management</span>
                      </div>
                      <div className="h-10 w-full flex items-center px-4 gap-3 text-gray-400">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                         <span className="font-medium text-[12px]">Report</span>
                      </div>
                    </div>
                  </div>
                  {/* Main Content (Mockup Details) */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
                     <div className="flex justify-between items-start">
                       <div>
                         <h2 className="text-[22px] font-black mb-1">Welcome back, Alex</h2>
                         <p className="text-gray-400 text-[12px]">Here's what's happening at your stores on this selected date.</p>
                       </div>
                     </div>
                     {/* Stats Row */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-[20px] shadow-sm p-6 border border-gray-100">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">Gross Revenue</p>
                          <h3 className="text-[28px] font-black text-[#1a1f36] mb-1">Rp 0</h3>
                        </div>
                        <div className="bg-white rounded-[20px] shadow-sm p-6 border border-gray-100">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">Completed Orders</p>
                          <h3 className="text-[28px] font-black text-[#1a1f36] mb-1">0</h3>
                        </div>
                        <div className="bg-white rounded-[20px] shadow-sm p-6 border border-gray-100">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">Total Items Sold</p>
                          <h3 className="text-[28px] font-black text-[#1a1f36] mb-1">0</h3>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── KLIEN / INFINITE MARQUEE ── */}
      <section className="py-12 border-y border-gray-200/40 overflow-hidden relative z-10 bg-[#FAF2E6]">
        <div className="max-w-7xl mx-auto px-6 text-center mb-10">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em]">Dipercaya Oleh 500+ Kedai Kopi Indonesia</p>
        </div>
        <div className="flex w-full overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-16 md:gap-32 pl-16 md:pl-32 opacity-60 hover:opacity-100 transition-all duration-700">
            {['DAILY ROAST', 'BREW & BAKE', 'CUP + CULTURE', 'BEANS LAB', 'ROASTERY', 'RUANG SEDUH', 'DAILY ROAST', 'BREW & BAKE', 'CUP + CULTURE', 'BEANS LAB', 'ROASTERY', 'RUANG SEDUH'].map((klien, i) => (
              <h2 key={i} className="text-[14px] md:text-[18px] font-bold text-gray-400 tracking-[0.2em]">{klien}</h2>
            ))}
          </div>
        </div>
      </section>

      {/* ── EKOSISTEM / FITUR GRID ── */}
      <section id="fitur" className="pt-32 pb-16 scroll-mt-20 relative z-10 bg-[#FEFAF1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="mb-16 max-w-3xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
                  <span className="text-[11px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">Ekosistem</span>
               </div>
               <h2 className="text-[40px] md:text-[56px] font-bold tracking-tight mb-6 text-[#1a1f36]">
                 Satu platform, <span className="italic font-normal">segala kendali.</span>
               </h2>
               <p className="text-gray-500 font-medium text-[16px] md:text-[18px] leading-relaxed max-w-xl">
                 Setiap fitur dirancang untuk terasa tenang di jam sibuk — cepat saat dibutuhkan, tidak berisik saat tidak.
               </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { tag: "REALTIME", num: "01", title: "Dashboard operasional", desc: "Pantau revenue, order, dan performa menu tiap outlet dalam satu layar tenang." },
              { tag: "PWA", num: "02", title: "Self-order tanpa install", desc: "Pelanggan scan QR, pilih menu, dan bayar dalam hitungan detik dari browser." },
              { tag: "LOYALTY", num: "03", title: "Program poin otomatis", desc: "Setiap transaksi menumbuhkan komunitas pelanggan setia Anda tanpa kerja manual." },
              { tag: "INVENTORY", num: "04", title: "Stok yang jujur", desc: "Bahan berkurang otomatis setiap penjualan. Alert stok tipis sebelum kehabisan." },
              { tag: "MULTI-OUTLET", num: "05", title: "Sinkron antar cabang", desc: "Menu, harga, dan promo diubah sekali — berlaku serentak di semua lokasi." },
              { tag: "OFFLINE", num: "06", title: "Selalu jalan, kapanpun", desc: "Transaksi tetap berjalan tanpa internet dan sinkron otomatis saat online." }
            ].map((item, index) => (
              <Reveal key={index} delay={index * 100} direction="up" className="h-full">
                <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 h-full flex flex-col group cursor-pointer">
                  <div className="flex justify-between items-center mb-16">
                    <span className="px-3 py-1 bg-[#FCFBF7] border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] group-hover:border-orange-500/30 group-hover:text-orange-500 transition-colors">
                      {item.tag}
                    </span>
                    <span className="text-[12px] font-bold text-gray-300 group-hover:text-gray-400 transition-colors">{item.num}</span>
                  </div>
                  <h3 className="text-[18px] md:text-[20px] font-bold text-[#1a1f36] mb-4">{item.title}</h3>
                  <p className="text-gray-500 font-medium text-[15px] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT SECTION (BARU SESUAI GAMBAR) ── */}
      <section id="impact" className="py-36 md:py-44 bg-[#FEFAF1] relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left Content (Text & Button) */}
            <Reveal delay={100} className="w-full lg:w-5/12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
                <span className="text-[11px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">Impact</span>
              </div>
              <h2 className="text-[40px] md:text-[48px] lg:text-[56px] font-bold tracking-tight mb-6 text-[#1a1f36] leading-[1.1]">
                Angka yang lahir dari <span className="italic font-normal">operasional yang rapi.</span>
              </h2>
              <p className="text-gray-500 font-medium text-[15px] md:text-[17px] leading-relaxed mb-10 max-w-lg">
                Kafiloo memangkas gesekan di setiap titik — dari pesanan pertama hingga laporan akhir hari. Tim Anda punya waktu lebih untuk membuat kopi yang lebih baik.
              </p>
              <Link href="#" className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-gray-300 text-[14px] md:text-[15px] font-bold text-[#1a1f36] hover:bg-white hover:border-gray-400 transition-all group shadow-sm bg-transparent">
                Baca studi kasus
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </Reveal>

            {/* Right Content (Cards Grid) */}
            <Reveal delay={300} type="slide" direction="left" className="w-full lg:w-7/12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                {[
                  { value: "40%", label: "kenaikan omset rata-rata" },
                  { value: "30%", label: "turnover meja lebih cepat" },
                  { value: "500+", label: "kedai aktif di Indonesia" },
                  { value: "99.9%", label: "uptime layanan cloud" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-center min-h-[180px]">
                    <h3 className="text-[48px] md:text-[56px] font-medium text-[#1a1f36] tracking-tighter mb-1 md:mb-2 leading-none">{stat.value}</h3>
                    <p className="text-gray-500 font-medium text-[14px] md:text-[15px]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ── CARA KERJA (ALUR) ── */}
      <section id="cara-kerja" className="py-32 bg-[#FEFAF1] text-[#1a1f36] relative overflow-hidden scroll-mt-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="mb-20 text-center md:text-left">
              <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight mb-6">Alur Kerja Tanpa Gesekan.</h2>
              <p className="text-gray-400 font-medium text-[18px] max-w-2xl mx-auto md:mx-0">Dari pelanggan duduk hingga hidangan tersaji, semuanya tersinkronisasi dalam hitungan detik.</p>
            </div>
          </Reveal>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-gray-600 to-transparent -translate-y-1/2 opacity-50"></div>
            
            <Reveal delay={100} className="flex-1 w-full">
              <div className="bg-[#27272a] rounded-[32px] p-10 border border-white/5 relative z-10 flex flex-col h-full hover:-translate-y-4 transition-all duration-500 cursor-pointer group shadow-lg">
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform origin-left">📱</div>
                <h3 className="text-[20px] font-bold mb-4 text-white">1. Scan & Pesan</h3>
                <p className="text-gray-400 text-[15px] leading-relaxed">Pelanggan scan QR di meja menggunakan kamera HP, melihat menu digital interaktif, dan langsung checkout.</p>
              </div>
            </Reveal>

            <Reveal delay={300} className="flex-1 w-full">
              <div className="bg-gradient-to-b from-gray-800 to-[#18181b] rounded-[32px] p-10 border border-gray-600/50 relative z-10 flex flex-col h-full md:-translate-y-6 hover:-translate-y-10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500 shadow-2xl cursor-pointer group">
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform origin-left">💻</div>
                <h3 className="text-[20px] font-bold mb-4 text-white">2. Kasir Konfirmasi</h3>
                <p className="text-gray-300 text-[15px] leading-relaxed">Pesanan masuk ke dasbor kasir diiringi bunyi notifikasi. Cukup klik "Terima", struk dapur otomatis tercetak.</p>
              </div>
            </Reveal>

            <Reveal delay={500} className="flex-1 w-full">
              <div className="bg-[#27272a] rounded-[32px] p-10 border border-white/5 relative z-10 flex flex-col h-full hover:-translate-y-4 transition-all duration-500 cursor-pointer group shadow-lg">
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform origin-left">🍳</div>
                <h3 className="text-[20px] font-bold mb-4 text-white">3. Dapur Menyiapkan</h3>
                <p className="text-gray-400 text-[15px] leading-relaxed">Dapur membaca struk pesanan yang jelas tanpa salah baca tulisan tangan. Pesanan dihidangkan tepat waktu.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID MEGA FEATURES (Opsional: Tetap dipertahankan untuk Showcase visual) ── */}
      <section id="showcase" className="py-32 max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-20">
        <Reveal>
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-tight mb-6 text-[#1a1f36]">Ekspansi Tanpa Batas.</h2>
            <p className="text-gray-500 font-medium text-[18px] leading-relaxed">Visualisasi fitur unggulan kami. Menggantikan tiga sistem sekaligus dengan antarmuka yang modern dan responsif.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 auto-rows-[minmax(280px,auto)]">
          
          {/* Card 1: PWA Ordering (Large) */}
          <Reveal delay={100} className="md:col-span-2 md:row-span-2 w-full h-full">
            <div className="bg-[#1a1f36] rounded-[48px] p-12 h-full relative overflow-hidden group cursor-pointer hover:-translate-y-6 hover:shadow-[0_40px_80px_rgba(26,31,54,0.3)] transition-all duration-500 border border-gray-800 flex flex-col justify-center">
              <div className="relative z-10 max-w-sm">
                <div className="w-16 h-16 bg-white/10 rounded-[20px] flex items-center justify-center text-white mb-8 border border-white/20 backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform">📱</div>
                <h3 className="text-[32px] md:text-[44px] font-black text-white mb-6 tracking-tight leading-tight">PWA Self-Order <br/>Masa Depan.</h3>
                <p className="text-gray-400 text-[16px] leading-relaxed mb-8">Tanpa repot instal aplikasi. Pelanggan buka browser, pilih menu dengan foto yang menggugah selera, dan langsung checkout.</p>
                <div className="inline-flex gap-2 text-emerald-400 font-bold text-sm bg-emerald-400/10 px-5 py-2.5 rounded-full border border-emerald-400/20">✔ Konversi naik 50%</div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-[350px] h-[350px] border-[24px] border-white/5 rounded-full group-hover:scale-150 transition-transform duration-[1.5s]"></div>
            </div>
          </Reveal>

          {/* Card 2: Analitik Pintar */}
          <Reveal delay={200} className="md:col-span-2 md:row-span-1 w-full h-full">
            <div className="bg-white border border-gray-200 rounded-[40px] p-10 h-full flex flex-col justify-center group cursor-pointer hover:-translate-y-6 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[20px] flex items-center justify-center mb-6 border border-blue-100 text-3xl group-hover:scale-110 transition-transform shadow-sm">📈</div>
                <h3 className="text-[26px] font-black text-[#1a1f36] mb-3">Analitik Pintar</h3>
                <p className="text-gray-500 text-[16px] leading-relaxed max-w-sm">Pantau menu terlaris, pendapatan kotor, dan jam sibuk kafe Anda lewat grafik cantik.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-48 h-48 bg-gradient-to-tl from-blue-100/50 to-transparent opacity-50 rounded-tl-full pointer-events-none"></div>
            </div>
          </Reveal>

          {/* Card 3: Loyalty Hub */}
          <Reveal delay={300} className="md:col-span-2 md:row-span-1 w-full h-full">
            <div className="bg-gradient-to-br from-[#6C4E31] to-[#4a3420] text-white rounded-[40px] p-10 h-full relative overflow-hidden group cursor-pointer hover:-translate-y-6 hover:shadow-[0_40px_80px_rgba(108,78,49,0.4)] transition-all duration-500 border border-[#856140] flex flex-col justify-center">
               <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center mb-6 backdrop-blur-md text-3xl group-hover:rotate-12 transition-transform shadow-sm">🎁</div>
               <h3 className="text-[26px] font-black mb-3 text-white">Loyalty & Poin Otomatis</h3>
               <p className="text-white/80 text-[16px] leading-relaxed max-w-sm">Poin pelanggan bertambah instan. Mereka bisa klaim reward secara digital tanpa kartu member fisik.</p>
               <div className="absolute right-8 top-10 bg-amber-400/20 text-amber-300 font-bold px-4 py-1.5 rounded-full text-sm border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse">+50 Pts</div>
            </div>
          </Reveal>

          {/* Card 4: Multi Pembayaran */}
          <Reveal delay={400} className="md:col-span-1 md:row-span-1 w-full h-full">
            <div className="bg-white border border-gray-200 rounded-[40px] p-8 h-full shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-center text-center items-center group cursor-pointer hover:-translate-y-6 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500">
               <div className="text-5xl mb-6 group-hover:scale-125 transition-transform">💳</div>
               <h3 className="text-[20px] font-black text-[#1a1f36] mb-3">Multi Payment</h3>
               <p className="text-gray-500 text-[14px] px-2">Terima QRIS, Cash, & Bank Transfer.</p>
            </div>
          </Reveal>

          {/* Card 5: Live CMS */}
          <Reveal delay={500} className="md:col-span-2 md:row-span-1 w-full h-full">
            <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-[40px] p-10 h-full shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-center relative overflow-hidden group cursor-pointer hover:-translate-y-6 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-500">
               <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-56 h-56 bg-emerald-100/50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="relative z-10">
                 <div className="w-16 h-16 bg-gray-800 text-white rounded-[20px] flex items-center justify-center mb-6 text-3xl group-hover:rotate-90 transition-transform duration-700 shadow-md">⚙️</div>
                 <h3 className="text-[26px] font-black text-[#1a1f36] mb-3">Live Cloud CMS</h3>
                 <p className="text-gray-500 text-[16px] max-w-sm leading-relaxed">Atur PPN, kosongkan stok menu, hingga atur jam buka tutup toko secara real-time dari mana saja.</p>
               </div>
            </div>
          </Reveal>

          {/* Card 6: Kustomisasi Struk */}
          <Reveal delay={600} className="md:col-span-1 md:row-span-1 w-full h-full">
             <div className="bg-white border border-gray-200 rounded-[40px] p-8 h-full shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative group cursor-pointer hover:-translate-y-6 hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col items-center text-center justify-center overflow-hidden">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center mb-6 border border-amber-100 text-3xl group-hover:scale-110 transition-transform shadow-sm relative z-10">🧾</div>
                <h3 className="text-[20px] font-black text-[#1a1f36] mb-3 relative z-10">Struk Custom</h3>
                <p className="text-gray-500 text-[14px] px-2 relative z-10">Sisipkan Password WiFi & pesan di struk pelanggan.</p>
             </div>
          </Reveal>

        </div>
      </section>

      {/* ── KOMPATIBILITAS DEVICE ── */}
      <section className="py-32 bg-[#FEFAF1] border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-16">
          <Reveal className="w-full md:w-1/2">
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-tight mb-6 text-[#1a1f36] leading-[1.1]">Jalankan Kofilo di Perangkat Apapun.</h2>
            <p className="text-gray-500 text-[18px] mb-10 leading-relaxed">
              Anda tidak perlu membeli mesin kasir besar yang mahal. Kofilo berbasis web responsif penuh yang berjalan sangat mulus di iPad, Tablet Android, Laptop, maupun HP kasir Anda.
            </p>
            <div className="flex gap-6">
               <div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-2xl">📱</div><span className="text-[13px] font-bold text-gray-500">Mobile</span></div>
               <div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-2xl">📟</div><span className="text-[13px] font-bold text-gray-500">Tablet</span></div>
               <div className="flex flex-col items-center gap-3"><div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-2xl">💻</div><span className="text-[13px] font-bold text-gray-500">Desktop</span></div>
            </div>
          </Reveal>
          <Reveal delay={200} className="w-full md:w-1/2">
            <div className="w-full aspect-[4/3] bg-gray-100 rounded-[40px] shadow-inner border-[8px] border-white flex items-center justify-center p-8 relative overflow-hidden">
               <div className="w-full h-full bg-[#18181b] rounded-[24px] shadow-2xl relative overflow-hidden flex shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-gray-700">
                  <div className="w-1/4 h-full bg-[#27272a] border-r border-gray-700 p-5"><div className="w-8 h-8 rounded-lg bg-gray-600 mb-6"></div><div className="w-full h-4 bg-gray-700 rounded mb-4"></div><div className="w-3/4 h-4 bg-gray-700 rounded mb-4"></div></div>
                  <div className="w-3/4 h-full bg-gray-50 p-6 flex flex-wrap gap-4 content-start">
                     <div className="w-[30%] h-24 bg-white rounded-xl shadow-sm border border-gray-200"></div><div className="w-[30%] h-24 bg-white rounded-xl shadow-sm border border-gray-200"></div><div className="w-[30%] h-24 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                  </div>
               </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIAL / REVIEW (BARU) ── */}
      <section id="review" className="relative py-32 bg-[#FEFAF1] text-[#1a1f36] overflow-hidden scroll-mt-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
                  <span className="text-[11px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">SUARA PENGGUNA</span>
                </div>
                <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight text-[#1a1f36] leading-[1.1]">
                  Dipakai harian oleh <span className="italic font-normal text-gray-500">tim yang teliti.</span>
                </h2>
              </div>
              <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                <div className="flex gap-1 text-[#E58B55] text-[16px]">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-gray-200">★</span>
                </div>
                <span className="text-[14px] font-bold text-[#1a1f36]">4.0 / 5.0</span>
                <span className="text-[12px] text-gray-400 font-medium">· 320+ review</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-[1400px] mx-auto">
          {/* Gradient Edges untuk efek fade di ujung kiri & kanan */}
          <div className="absolute top-0 left-0 w-12 md:w-32 h-full bg-gradient-to-r from-[#FCFBF7] to-transparent pointer-events-none z-10"></div>
          <div className="absolute top-0 right-0 w-12 md:w-32 h-full bg-gradient-to-l from-[#FCFBF7] to-transparent pointer-events-none z-10"></div>
          
          <Reveal delay={200} type="slide" direction="right">
            {/* Class penyembunyi scrollbar standar Tailwind ada di sini */}
            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 md:px-32 pb-12 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {[
                { name: "Rizky K.", role: "Owner, Kopi Sanggar", initial: "RK", quote: "Sangat premium, mudah dimengerti dari pertama lihat." },
                { name: "Nadia P.", role: "Barista Lead, Beans Lab", initial: "NP", quote: "Visualnya bersih dan modern, terasa lebih terpercaya." },
                { name: "Farhan M.", role: "Owner, Daily Roast", initial: "FM", quote: "Navigasinya enak dan keseluruhan tampilannya lebih engaging." },
                { name: "Sinta W.", role: "Owner, Brew & Bake", initial: "SW", quote: "Detail kecilnya rapi, terasa dibuat oleh orang yang paham operasional." }
              ].map((review, i) => (
                <div key={i} className="min-w-[300px] md:min-w-[360px] bg-white rounded-[24px] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 snap-center flex flex-col hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                  <div className="flex gap-1 text-[#E58B55] text-[18px] mb-6">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-gray-200">★</span>
                  </div>
                  <p className="text-gray-600 text-[15px] leading-relaxed mb-8 flex-1">
                    "{review.quote}"
                  </p>
                  <div className="border-t border-gray-100 pt-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1a1f36] text-white flex items-center justify-center text-[12px] font-bold">
                      {review.initial}
                    </div>
                    <div>
                      <p className="font-bold text-[14px] text-[#1a1f36]">{review.name}</p>
                      <p className="text-[12px] text-gray-400">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="harga" className="py-40 max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-20 relative">
        <Reveal>
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
              <span className="text-[11px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">PRICING</span>
              <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
            </div>
            <h2 className="text-[36px] md:text-[52px] font-bold tracking-tight mb-6 text-[#1a1f36]">
              Harga yang jujur, <span className="italic font-normal">skala sesuai bisnis.</span>
            </h2>
            <p className="text-gray-500 font-medium text-[16px] md:text-[18px] leading-relaxed">
              Pilih paket yang cocok dengan tahap bisnismu. Semua paket bisa di-upgrade kapan saja, tanpa migrasi ulang.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          
          {/* ── CARD 1: STARTER ── */}
          <Reveal delay={100} direction="right" className="h-full w-full">
            <div className="bg-[#FAF8F5] border border-gray-200/80 rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-md transition-all duration-500 h-full flex flex-col justify-between w-full">
              <div>
                <h3 className="text-[24px] font-bold text-[#1a1f36] mb-2">Starter</h3>
                <p className="text-gray-500 text-[14px] mb-8">Bisnis dasar atau 1 outlet</p>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MULAI DARI</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] md:text-[38px] font-bold text-[#1a1f36] tracking-tight">Rp 350.000</span>
                    <span className="text-gray-500 text-[14px]">/ bulan</span>
                  </div>
                  <p className="text-gray-500 text-[13px] mt-2 leading-relaxed">Solusi POS esensial untuk operasional harian yang rapi dan efisien.</p>
                </div>

                <div className="w-full h-[1px] bg-gray-200/60 my-6"></div>

                <ul className="space-y-3.5 mb-8 text-[14px] font-medium text-gray-600">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Transaksi penjualan
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Manajemen produk & stok dasar
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Struk thermal standar
                  </li>
                  <li className="flex items-center gap-3 text-gray-400">
                    <span className="text-gray-300 font-bold">−</span> Tanpa Fitur PWA (QR Order)
                  </li>
                  <li className="flex items-center gap-3 text-gray-400">
                    <span className="text-gray-300 font-bold">−</span> Tanpa Loyalty Hub Otomatis
                  </li>
                </ul>
              </div>

              <Link href="/landingpage/checkout?plan=starter" className="block w-full py-4 text-center rounded-full bg-[#F3EFEA] hover:bg-[#1a1f36] hover:text-white text-[#1a1f36] font-bold text-[15px] transition-all duration-300 border border-gray-200/60">
                Mulai Starter →
              </Link>
            </div>
          </Reveal>

          {/* ── CARD 2: PRO (MOST POPULAR) ── */}
          <Reveal delay={200} direction="up" className="h-full w-full">
            <div className="relative bg-[#FAF8F5] border-2 border-[#1a1f36]/20 rounded-[32px] p-8 md:p-10 shadow-xl transition-all duration-500 h-full flex flex-col justify-between w-full md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a1f36] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-md">
                ✦ MOST POPULAR
              </div>

              <div>
                <h3 className="text-[24px] font-bold text-[#1a1f36] mb-2">Pro</h3>
                <p className="text-gray-500 text-[14px] mb-8">Bisnis yang sudah ramai dan sering antre</p>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">MULAI DARI</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] md:text-[38px] font-bold text-[#1a1f36] tracking-tight">Rp 500.000</span>
                    <span className="text-gray-500 text-[14px]">/ bulan</span>
                  </div>
                  <p className="text-gray-500 text-[13px] mt-2 leading-relaxed">Paket lengkap untuk bisnis yang berkembang dan butuh loyalitas pelanggan & kontrol stok.</p>
                </div>

                <div className="w-full h-[1px] bg-gray-200/60 my-6"></div>

                <ul className="space-y-3.5 mb-8 text-[14px] font-medium text-gray-700">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Semua fitur Starter
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> PWA QR Ordering (Self-Order)
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Loyalty Hub & Poin Otomatis
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Akses Multi-User (Super Admin)
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Kustomisasi Struk Lengkap
                  </li>
                </ul>
              </div>

              <Link href="/landingpage/checkout?plan=pro" className="block w-full py-4 text-center rounded-full bg-[#1a1f36] text-white font-bold text-[15px] hover:bg-black transition-all duration-300 shadow-lg">
                Pilih Pro →
              </Link>
            </div>
          </Reveal>

          {/* ── CARD 3: ENTERPRISE ── */}
          <Reveal delay={300} direction="left" className="h-full w-full">
            <div className="bg-[#FAF8F5] border border-gray-200/80 rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-md transition-all duration-500 h-full flex flex-col justify-between w-full">
              <div>
                <h3 className="text-[24px] font-bold text-[#1a1f36] mb-2">Enterprise</h3>
                <p className="text-gray-500 text-[14px] mb-8">Banyak outlet atau kebutuhan khusus</p>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">HARGA</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] md:text-[38px] font-bold text-[#1a1f36] tracking-tight">Custom</span>
                  </div>
                  <p className="text-gray-500 text-[13px] mt-2 leading-relaxed">Solusi fleksibel untuk bisnis multi outlet dan kebutuhan operasional yang lebih kompleks.</p>
                </div>

                <div className="w-full h-[1px] bg-gray-200/60 my-6"></div>

                <ul className="space-y-3.5 mb-8 text-[14px] font-medium text-gray-600">
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Semua fitur Pro
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Multi store tanpa batas
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Custom fitur sesuai kebutuhan
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">✓</span> Support prioritas tinggi 24/7
                  </li>
                </ul>
              </div>

              <a href="https://wa.me/6285799854015?text=Halo%20Tim%20Kofilo,%20saya%20tertarik%20dengan%20paket%20Enterprise%20Custom." target="_blank" rel="noopener noreferrer" className="block w-full py-4 text-center rounded-full bg-[#F3EFEA] hover:bg-[#1a1f36] hover:text-white text-[#1a1f36] font-bold text-[15px] transition-all duration-300 border border-gray-200/60">
                Konsultasi Sekarang →
              </a>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="py-32 bg-[#FEFAF1] scroll-mt-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          
          {/* Kolom Kiri: Judul & Keterangan */}
          <Reveal className="w-full lg:w-5/12 lg:sticky lg:top-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
              <span className="text-[11px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">FAQ</span>
            </div>
            <h2 className="text-[40px] md:text-[52px] font-bold tracking-tight mb-6 text-[#1a1f36] leading-[1.1]">
              Pertanyaan yang <span className="italic font-normal">sering muncul.</span>
            </h2>
            <p className="text-gray-500 font-medium text-[16px] md:text-[18px] leading-relaxed max-w-sm">
              Belum ketemu jawabannya? Tim kami siap membantu via email atau WhatsApp.
            </p>
          </Reveal>

          {/* Kolom Kanan: Accordion Container */}
          <Reveal delay={200} type="slide" direction="up" className="w-full lg:w-7/12">
            <div className="bg-white rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-100 last:border-b-0 w-full group">
                  <div 
                    className="w-full text-left p-6 md:p-8 flex justify-between items-center focus:outline-none cursor-pointer hover:bg-gray-50/50 transition-colors" 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-bold text-[16px] md:text-[17px] text-[#1a1f36] pr-8">{faq.q}</span>
                    
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openFaq === index ? 'bg-[#18181b] text-white' : 'bg-transparent text-gray-400 group-hover:text-[#1a1f36]'}`}>
                      {openFaq === index ? (
                        /* Ikon Silang (X) saat terbuka */
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        /* Ikon Tambah (+) saat tertutup */
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  <div className={`px-6 md:px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === index ? 'max-h-96 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-gray-500 text-[15px] leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-8 relative overflow-hidden z-10">
        <Reveal type="scale" className="w-full">
          <div className="bg-[#120d09] rounded-[40px] py-24 px-6 md:px-16 text-center relative overflow-hidden shadow-2xl border border-[#3b2716]/40">
            
            {/* Ambient Glows (Efek Nyala) */}
            {/* Cahaya di KIRI (Baru ditambahkan) */}
            <div className="absolute -bottom-40 -left-20 md:-left-40 w-[600px] h-[600px] bg-[#8B5024]/40 blur-[130px] rounded-full pointer-events-none animate-[pulse_5s_ease-in-out_infinite] delay-1000"></div>

            {/* Cahaya di KANAN atas */}
            <div className="absolute -top-40 -right-20 md:-right-40 w-[600px] h-[600px] bg-[#8B5024]/40 blur-[130px] rounded-full pointer-events-none animate-pulse"></div>
            
            {/* Cahaya berkedip halus di TENGAH belakang teks */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#E58B55]/15 blur-[120px] rounded-full pointer-events-none animate-[pulse_4s_ease-in-out_infinite]"></div>

            <h2 className="text-[36px] md:text-[56px] font-bold tracking-tight text-white mb-6 leading-[1.15] relative z-10">
              Siap membuat operasional <br className="hidden md:block"/>
              kedai <br className="hidden md:block"/>
              terasa <span className="italic font-normal text-[#E58B55] drop-shadow-[0_0_15px_rgba(229,139,85,0.4)]">refined?</span>
            </h2>
            
            <p className="text-[#d4bca8] font-medium text-[16px] md:text-[18px] max-w-2xl mx-auto mb-10 leading-relaxed relative z-10">
              Coba Kafiloo gratis 14 hari. Tanpa kartu kredit, tanpa komitmen.
            </p>
            
            <div className="flex justify-center relative z-10">
              <Link href="/landingpage/checkout?plan=starter" className="inline-flex items-center gap-3 bg-white text-[#1a1f36] px-8 py-3.5 rounded-full text-[15px] font-bold hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] group">
                Mulai Sekarang
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#18181b] text-white pt-20 pb-10 relative z-10 rounded-t-[40px] md:rounded-t-[60px]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {storeInfo.logo ? (
                <img src={storeInfo.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover bg-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white text-xl font-bold border border-gray-700">{storeInitial}</div>
              )}
              <span className="font-bold text-[24px] tracking-tight">{storeInfo.name}.</span>
            </div>
            <p className="text-gray-400 text-[15px] max-w-sm leading-relaxed">Platform kasir & operasional premium untuk kedai kopi dan restoran modern. Cepat, tenang, dan dapat diandalkan.</p>
          </div>
          <div>
            <h4 className="font-bold text-[16px] mb-6 text-white">Produk</h4>
            <ul className="space-y-4 text-gray-400 text-[14px] font-medium">
              <li><a href="#fitur" className="hover:text-white transition-colors">PWA Ordering App</a></li>
              <li><a href="#fitur" className="hover:text-white transition-colors">Loyalty System</a></li>
              <li><a href="#fitur" className="hover:text-white transition-colors">Cloud Dashboard</a></li>
              <li><a href="#harga" className="hover:text-white transition-colors">Harga & Paket</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[16px] mb-6 text-white">Bantuan</h4>
            <ul className="space-y-4 text-gray-400 text-[14px] font-medium">
              <li><a href="#faq" className="hover:text-white transition-colors">Pusat Bantuan (FAQ)</a></li>
              <li>
                <a href="https://wa.me/6285799854015?text=Halo%20Tim%20Sales%20Kofilo,%20saya%20ingin%20bertanya..." target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Hubungi Sales
                </a>
              </li>
              <li><a href="/landingpage/syarat-ketentuan" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="/landingpage/kebijakan-privasi" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[13px] text-gray-500 font-medium">© {new Date().getFullYear()} {storeInfo.name}. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all">IG</a>
            <a href="#" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-all">X</a>
          </div>
        </div>
      </footer>

    </div>
  );
}