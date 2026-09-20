"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── KOMPONEN REVEAL (Diperbaiki: Sekarang mendukung className) ──
const Reveal = ({ 
  children, 
  delay = 0, 
  direction = "up", 
  type = "slide",
  className = "" // PERBAIKAN: Menambahkan dukungan className
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
  
  // 🔥 TAMBAHAN: State Profil Toko
  const [storeInfo, setStoreInfo] = useState({ name: "Kofilo", logo: "" });

  // 🔥 TAMBAHAN: Fetch data nama dan logo
  useEffect(() => {
    fetch("/api/public/store")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setStoreInfo({
            name: data.settings.storeName || "Kofilo",
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

  // Inisial Toko Dinamis
  const storeInitial = storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : "K";

  return (
    <div className="min-h-screen bg-[#Fdfbf9] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white overflow-hidden relative">
      
      {/* ── CSS KEYFRAMES ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes float-reverse { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(20px); } }
        @keyframes blob { 0%, 100% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
        .animate-blob { animation: blob 15s infinite alternate; }
        .animate-blob-delayed { animation: blob 15s infinite alternate; animation-delay: 4s; }
        .animate-marquee { display: flex; animation: marquee 25s linear infinite; }
        
        .bg-grid-pattern { background-image: radial-gradient(rgba(108, 78, 49, 0.15) 1px, transparent 1px); background-size: 40px 40px; }
        .glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); }
      `}} />

      {/* ── BACKGROUND ORBS & GRID ── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 -z-30 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-orange-200/30 rounded-full blur-[150px] -z-20 animate-blob mix-blend-multiply pointer-events-none"></div>
      <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-[#6C4E31]/10 rounded-full blur-[150px] -z-20 animate-blob-delayed mix-blend-multiply pointer-events-none"></div>

      {/* ── NAVBAR (Floating Glass) ── */}
      <div className="fixed top-0 w-full z-50 p-4 transition-all duration-500 pointer-events-none">
        <nav className={`max-w-6xl mx-auto pointer-events-auto transition-all duration-500 rounded-full px-6 py-3 flex items-center justify-between ${scrolled ? "bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]" : "bg-transparent py-4"}`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            {/* 🔥 UBAHAN: Nav Logo Dinamis */}
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-lg group-hover:scale-105 transition-all duration-300 bg-white" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1a1f36] flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-105 group-hover:bg-[#6C4E31] transition-all duration-300">
                <span className="font-black tracking-tighter">{storeInitial}</span>
              </div>
            )}
            <span className="font-black text-[22px] tracking-tight">{storeInfo.name}.</span>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {['Manfaat', 'Cara Kerja', 'Fitur', 'Harga', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={(e) => scrollToSection(e, item.toLowerCase().replace(' ', '-'))} 
                 className="px-4 py-2 text-[14px] font-bold text-gray-500 hover:text-[#1a1f36] hover:bg-gray-100/50 rounded-full transition-all duration-300">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
             <Link href="/cms/dashboard" className="hidden md:block text-[14px] font-bold text-gray-600 hover:text-[#6C4E31] transition-colors">
              Login Owner
            </Link>
             <Link href="/cms/dashboard" className="bg-[#1a1f36] hover:bg-[#6C4E31] text-white px-6 py-2.5 rounded-full text-[14px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                Mulai Gratis
             </Link>
          </div>
        </nav>
      </div>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-48 pb-20 lg:pt-60 lg:pb-32 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        
        <Reveal type="blur" delay={0}>
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-panel text-[#6C4E31] text-[13px] font-extrabold tracking-widest uppercase mb-8 shadow-sm border border-white">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Kofilo Enterprise v2.0 Rilis!
          </div>
        </Reveal>

        <Reveal type="scale" delay={150}>
          <h1 className="text-[52px] md:text-[84px] font-black tracking-tighter leading-[1.05] mb-8 max-w-5xl mx-auto text-[#1a1f36]">
            Sistem Kasir Masa Depan. <br className="hidden md:block"/>
            <span className="relative inline-block mt-2">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#6C4E31] to-[#c78b54]">Dirancang Untuk F&B.</span>
              <div className="absolute bottom-1 left-0 w-full h-4 bg-orange-200/60 -z-10 rounded-full blur-md"></div>
            </span>
          </h1>
        </Reveal>

        <Reveal type="slide" delay={300}>
          <p className="text-[18px] md:text-[22px] text-gray-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            PWA Self-Order, Manajemen Stok, Kasir Cloud, dan Program Loyalty Otomatis. Semua yang Anda butuhkan untuk melipatgandakan omset kafe tanpa menambah beban kerja.
          </p>
        </Reveal>

        <Reveal type="scale" delay={450}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/cms/dashboard" className="relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-[#6C4E31] to-[#583f27] text-white px-10 py-5 rounded-full text-[16px] font-black shadow-[0_15px_30px_-10px_rgba(108,78,49,0.6)] hover:shadow-[0_20px_40px_-10px_rgba(108,78,49,0.8)] hover:-translate-y-1 transition-all duration-500 flex items-center justify-center gap-3 group">
              <span className="relative z-10 flex items-center gap-2">
                Mulai Gratis Sekarang
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </span>
              <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            </Link>
            <a href="#fitur" onClick={(e) => scrollToSection(e, 'fitur')} className="w-full sm:w-auto glass-panel text-[#1a1f36] px-10 py-5 rounded-full text-[16px] font-extrabold hover:bg-white hover:-translate-y-1 transition-all duration-500 shadow-sm hover:shadow-xl flex items-center justify-center gap-3 cursor-pointer border border-gray-200">
              Lihat Demo Fitur
            </a>
          </div>
        </Reveal>

        {/* ── Dekorasi Dashboard UI Float ── */}
        <Reveal type="scale" delay={700} className="w-full">
          <div className="mt-28 relative w-full max-w-5xl mx-auto h-[300px] md:h-[450px] animate-float perspective-1000">
            <div className="absolute inset-0 glass-panel rounded-[24px] md:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-white border-2 p-4 md:p-6 overflow-hidden z-20 flex flex-col">
              {/* Fake UI Header */}
              <div className="flex justify-between items-center mb-4 md:mb-8 border-b border-gray-100 pb-3 md:pb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="w-32 md:w-64 h-2 md:h-3 bg-gray-100 rounded-full"></div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#1a1f36] to-gray-700 rounded-full shadow-md"></div>
              </div>
              {/* Fake UI Body */}
              <div className="flex-1 flex gap-4 md:gap-8">
                <div className="hidden md:flex w-1/4 h-full bg-gray-50/80 rounded-[24px] p-5 flex-col gap-5 border border-white">
                   <div className="w-full h-10 bg-white shadow-sm rounded-xl"></div><div className="w-3/4 h-4 bg-gray-200 rounded-full"></div><div className="w-1/2 h-4 bg-gray-200 rounded-full"></div>
                </div>
                <div className="w-full md:w-3/4 h-full flex flex-col gap-4 md:gap-6">
                   <div className="flex flex-col sm:flex-row gap-4 h-full md:h-auto">
                     <div className="flex-1 h-full md:h-36 bg-white rounded-xl md:rounded-[24px] shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col justify-end relative overflow-hidden">
                       <div className="absolute top-4 right-4 w-8 h-8 md:w-12 md:h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-bold text-xs md:text-base">📈</div>
                       <div className="w-1/2 h-3 md:h-5 bg-gray-200 rounded-full mb-2"></div><div className="w-1/3 h-5 md:h-8 bg-emerald-400 rounded-lg"></div>
                     </div>
                     <div className="flex-1 h-full md:h-36 bg-white rounded-xl md:rounded-[24px] shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col justify-end relative">
                       <div className="absolute top-4 right-4 w-8 h-8 md:w-12 md:h-12 bg-blue-50 rounded-full"></div>
                       <div className="w-2/3 h-3 md:h-5 bg-gray-200 rounded-full mb-2"></div><div className="w-1/2 h-5 md:h-8 bg-blue-400 rounded-lg"></div>
                     </div>
                   </div>
                   <div className="hidden sm:block flex-1 w-full bg-gradient-to-r from-[#6C4E31]/10 to-orange-50 rounded-[24px] border border-white p-6 relative overflow-hidden">
                      <div className="w-1/3 h-6 bg-[#6C4E31]/20 rounded-full mb-4"></div>
                      <div className="w-full h-24 bg-white/50 rounded-xl"></div>
                   </div>
                </div>
              </div>
            </div>
            {/* Background Glow Dashboard */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#6C4E31]/20 blur-[150px] rounded-full z-0"></div>
          </div>
        </Reveal>
      </section>

      {/* ── KLIEN / INFINITE MARQUEE ── */}
      <section className="py-12 bg-white border-y border-gray-100 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center mb-6">
          <p className="text-[13px] font-black text-gray-400 uppercase tracking-[0.2em]">Telah Digunakan Oleh Bisnis F&B Berkembang</p>
        </div>
        <div className="flex w-full overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-16 md:gap-32 pl-16 md:pl-32 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            {['Azalia Coffee', 'Els Koffie', 'BREW & BAKE', '/KopiLokal', 'DailyRoast.', 'Kopi Janji', 'Senja Cafe', 'Azalia Coffee', 'Els Koffie', 'BREW & BAKE', '/KopiLokal', 'DailyRoast.'].map((klien, i) => (
              <h2 key={i} className={`text-[28px] font-black ${i%2===0 ? 'font-serif italic' : 'font-mono'} text-gray-800`}>{klien}</h2>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANFAAT (KENAPA KOFILO) ── */}
      <section id="manfaat" className="py-32 scroll-mt-20 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-24 max-w-3xl mx-auto">
              <h2 className="text-[36px] md:text-[52px] font-black tracking-tight mb-6 text-[#1a1f36]">Solusi Masalah Klasik Kafe Anda.</h2>
              <p className="text-gray-500 font-medium text-[18px] leading-relaxed">Kami memahami rasa sakit antrean panjang, kasir salah input, dan pelanggan yang lupa kembali. Kofilo mengatasi itu semua.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Reveal delay={100} direction="up" className="h-full">
              <div className="bg-white rounded-[40px] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center flex flex-col items-center hover:-translate-y-6 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-all duration-500 cursor-pointer h-full group">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform">⏱️</div>
                <h3 className="text-[22px] font-black text-[#1a1f36] mb-4">Pangkas Antrean</h3>
                <p className="text-gray-500 leading-relaxed text-[15px]">Pelanggan tak perlu berdiri di kasir. Mereka bisa pesan & bayar mandiri dari meja, kasir hanya perlu konfirmasi.</p>
              </div>
            </Reveal>

            <Reveal delay={200} direction="up" className="h-full">
              <div className="bg-white rounded-[40px] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center flex flex-col items-center hover:-translate-y-6 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-all duration-500 cursor-pointer h-full group">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform">📈</div>
                <h3 className="text-[22px] font-black text-[#1a1f36] mb-4">Tingkatkan Retensi</h3>
                <p className="text-gray-500 leading-relaxed text-[15px]">Data membuktikan pelanggan dengan sistem loyalty points akan kembali 3x lebih sering ke kafe Anda.</p>
              </div>
            </Reveal>

            <Reveal delay={300} direction="up" className="h-full">
              <div className="bg-white rounded-[40px] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center flex flex-col items-center hover:-translate-y-6 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-all duration-500 cursor-pointer h-full group">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform">☁️</div>
                <h3 className="text-[22px] font-black text-[#1a1f36] mb-4">Pantau Dari Rumah</h3>
                <p className="text-gray-500 leading-relaxed text-[15px]">Sebagai Owner, Anda bisa mengatur pajak, mematikan menu kosong, dan melihat omset live dari HP Anda di mana saja.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CARA KERJA (ALUR) ── */}
      <section id="cara-kerja" className="py-32 bg-[#1a1f36] text-white relative overflow-hidden scroll-mt-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="mb-20 text-center md:text-left">
              <h2 className="text-[36px] md:text-[52px] font-black tracking-tight mb-6">Alur Kerja Tanpa Gesekan.</h2>
              <p className="text-gray-400 font-medium text-[18px] max-w-2xl mx-auto md:mx-0">Dari pelanggan duduk hingga hidangan tersaji, semuanya tersinkronisasi dalam hitungan detik.</p>
            </div>
          </Reveal>

          <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-gradient-to-r from-transparent via-[#6C4E31] to-transparent -translate-y-1/2 opacity-50"></div>
            
            <Reveal delay={100} className="flex-1 w-full">
              <div className="bg-[#2a314d] rounded-[32px] p-10 border border-white/10 relative z-10 flex flex-col h-full hover:-translate-y-6 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all duration-500 cursor-pointer group">
                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform origin-left">📱</div>
                <h3 className="text-[24px] font-black mb-4 text-white">1. Scan & Pesan</h3>
                <p className="text-gray-400 text-[15px] leading-relaxed">Pelanggan scan QR di meja menggunakan kamera HP, melihat menu digital interaktif, dan langsung checkout.</p>
              </div>
            </Reveal>

            <Reveal delay={300} className="flex-1 w-full">
              <div className="bg-gradient-to-b from-[#6C4E31] to-[#4a3420] rounded-[32px] p-10 border border-amber-900/50 relative z-10 flex flex-col h-full md:-translate-y-6 hover:-translate-y-12 hover:shadow-[0_40px_80px_rgba(108,78,49,0.6)] transition-all duration-500 shadow-2xl cursor-pointer group">
                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform origin-left">💻</div>
                <h3 className="text-[24px] font-black mb-4 text-white">2. Kasir Konfirmasi</h3>
                <p className="text-amber-100/80 text-[15px] leading-relaxed">Pesanan masuk ke dasbor kasir diiringi bunyi notifikasi. Cukup klik "Terima", struk dapur otomatis tercetak.</p>
              </div>
            </Reveal>

            <Reveal delay={500} className="flex-1 w-full">
              <div className="bg-[#2a314d] rounded-[32px] p-10 border border-white/10 relative z-10 flex flex-col h-full hover:-translate-y-6 hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all duration-500 cursor-pointer group">
                <div className="text-6xl mb-8 group-hover:scale-110 transition-transform origin-left">🍳</div>
                <h3 className="text-[24px] font-black mb-4 text-white">3. Dapur Menyiapkan</h3>
                <p className="text-gray-400 text-[15px] leading-relaxed">Dapur membaca struk pesanan yang jelas tanpa salah baca tulisan tangan. Pesanan dihidangkan tepat waktu.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID MEGA FEATURES ── */}
      <section id="fitur" className="py-32 max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-20">
        <Reveal>
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-[36px] md:text-[48px] font-black tracking-tight mb-6 text-[#1a1f36]">Ekosistem Fitur Terlengkap.</h2>
            <p className="text-gray-500 font-medium text-[18px] leading-relaxed">Satu aplikasi untuk menggantikan tiga sistem sekaligus. Kami membangun fitur skala Enterprise yang dibalut antarmuka yang simpel.</p>
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
      <section className="py-32 bg-[#Fdfbf9] border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-16">
          <Reveal className="w-full md:w-1/2">
            <h2 className="text-[36px] md:text-[52px] font-black tracking-tight mb-8 text-[#1a1f36] leading-[1.1]">Jalankan Kofilo di Perangkat Apapun.</h2>
            <p className="text-gray-500 text-[18px] mb-10 leading-relaxed">
              Anda tidak perlu membeli mesin kasir besar yang mahal. Kofilo berbasis web responsif penuh yang berjalan sangat mulus di iPad, Tablet Android, Laptop, maupun HP kasir Anda.
            </p>
            <div className="flex gap-6">
               <div className="flex flex-col items-center gap-3"><div className="w-20 h-20 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-3xl">📱</div><span className="text-[14px] font-bold text-[#1a1f36]">Mobile</span></div>
               <div className="flex flex-col items-center gap-3"><div className="w-20 h-20 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-3xl">📟</div><span className="text-[14px] font-bold text-[#1a1f36]">Tablet</span></div>
               <div className="flex flex-col items-center gap-3"><div className="w-20 h-20 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-3xl">💻</div><span className="text-[14px] font-bold text-[#1a1f36]">Desktop</span></div>
            </div>
          </Reveal>
          <Reveal delay={200} className="w-full md:w-1/2 w-full">
            <div className="w-full aspect-[4/3] bg-gradient-to-tr from-gray-200 to-white rounded-[48px] shadow-inner border-[4px] border-white flex items-center justify-center p-10 relative">
               {/* Abstract iPad Mockup */}
               <div className="w-full h-full bg-black rounded-[32px] border-[12px] border-gray-800 shadow-2xl relative overflow-hidden flex shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
                  {/* iPad Screen */}
                  <div className="w-1/4 h-full bg-[#1a1f36] border-r border-gray-800 p-5"><div className="w-10 h-10 rounded-xl bg-[#6C4E31] mb-8"></div><div className="w-full h-5 bg-gray-800 rounded-md mb-5"></div><div className="w-3/4 h-5 bg-gray-800 rounded-md mb-5"></div></div>
                  <div className="w-3/4 h-full bg-gray-50 p-8 flex flex-wrap gap-5 content-start">
                     <div className="w-[30%] h-28 bg-white rounded-2xl shadow-sm border border-gray-200"></div><div className="w-[30%] h-28 bg-white rounded-2xl shadow-sm border border-gray-200"></div><div className="w-[30%] h-28 bg-white rounded-2xl shadow-sm border border-gray-200"></div>
                  </div>
               </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section id="testimoni" className="relative py-32 bg-[#1a1f36] text-white overflow-hidden scroll-mt-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-gradient-to-r from-[#6C4E31]/30 to-transparent blur-[150px] rounded-full animate-pulse pointer-events-none"></div>
        <Reveal type="scale" className="w-full">
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10 w-full">
            <h2 className="text-[14px] font-black mb-12 uppercase tracking-[0.3em] text-[#d4a373]">Review Klien Nyata</h2>
            <div className="glass-dark rounded-[48px] p-10 md:p-20 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative hover:-translate-y-4 hover:shadow-[0_50px_120px_rgba(0,0,0,0.6)] transition-all duration-500 w-full">
              <span className="absolute -top-6 left-12 text-[150px] opacity-20 font-serif leading-none">"</span>
              <p className="text-[24px] md:text-[36px] font-medium leading-[1.4] mb-12 relative z-10">
                "Sebelumnya antrean selalu mengular di akhir pekan. Sejak pakai PWA Kofilo, pelanggan bisa langsung pesan dari meja. Omset naik 40% dan pelanggan makin loyal karena tukar poin sangat mudah!"
              </p>
              <div className="flex items-center justify-center gap-6">
                <img src="https://ui-avatars.com/api/?name=Faid+N&background=6C4E31&color=fff&size=128" alt="Owner" className="w-20 h-20 rounded-full object-cover border-4 border-[#1a1f36] shadow-lg" />
                <div className="text-left">
                  <p className="font-black text-[22px]">Faid Naziih</p>
                  <p className="text-[16px] text-gray-400 mt-0.5">Owner Els Koffie</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="harga" className="py-40 max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-20 relative">
        <Reveal>
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-[36px] md:text-[52px] font-black tracking-tight mb-6 text-[#1a1f36]">Investasi Terbaik Kafe Anda.</h2>
            <p className="text-gray-500 font-medium text-[18px] leading-relaxed">Sistem Enterprise tanpa harga Enterprise. Mulai gunakan paket gratis untuk tes pasar, tingkatkan ke Pro saat Anda siap meroket.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto items-stretch">
          
          {/* Starter Plan */}
          <Reveal delay={100} direction="right" className="h-full w-full">
            <div className="bg-white border border-gray-200 rounded-[48px] p-12 shadow-[0_15px_40px_rgba(0,0,0,0.05)] hover:-translate-y-6 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-all duration-500 h-full flex flex-col group cursor-pointer w-full">
              <h3 className="text-[28px] font-black text-[#1a1f36] mb-3">Starter</h3>
              <p className="text-gray-500 text-[16px] font-medium mb-10">Sempurna untuk kafe yang baru merintis bisnis.</p>
              <div className="mb-12">
                <span className="text-[64px] font-black text-[#1a1f36] tracking-tighter">Gratis</span>
              </div>
              <ul className="space-y-6 mb-12 text-[16px] font-medium text-gray-600 flex-1">
                {['1 Akses Kasir Utama (Admin)', 'Manajemen Menu & Stok Dasar', 'Struk Thermal Standar'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4"><svg className="w-7 h-7 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {item}</li>
                ))}
                {['Tanpa Fitur PWA (QR Order)', 'Tanpa Loyalty Hub Otomatis'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-gray-400 opacity-60"><svg className="w-7 h-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> {item}</li>
                ))}
              </ul>
              <Link href="/cms/dashboard" className="block w-full py-5 text-center rounded-full bg-gray-50 text-[#1a1f36] font-extrabold text-[18px] border border-gray-200 group-hover:bg-[#1a1f36] group-hover:text-white transition-all duration-300">
                Mulai Gratis
              </Link>
            </div>
          </Reveal>

          {/* Pro Plan */}
          <Reveal delay={300} direction="left" className="h-full w-full">
            <div className="relative h-full w-full rounded-[48px] p-[2px] bg-gradient-to-b from-[#6C4E31] via-[#d4a373] to-[#1a1f36] shadow-[0_30px_60px_rgba(108,78,49,0.3)] md:-mt-8 md:mb-8 group cursor-pointer hover:-translate-y-6 hover:shadow-[0_50px_100px_rgba(108,78,49,0.5)] transition-all duration-500 z-20 md:scale-105">
              <div className="absolute top-8 right-8 bg-gradient-to-r from-[#d4a373] to-[#6C4E31] text-white text-[13px] font-black uppercase tracking-[0.1em] px-5 py-2 rounded-full shadow-lg z-30">Paling Laris</div>
              
              <div className="bg-[#1a1f36] rounded-[46px] p-12 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#6C4E31] blur-[150px] rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"></div>
                <h3 className="text-[28px] font-black text-white mb-3 relative z-10">Kofilo Pro</h3>
                <p className="text-gray-400 text-[16px] font-medium mb-10 relative z-10">Otomatisasi penuh untuk kafe yang sangat ramai.</p>
                <div className="mb-12 relative z-10 flex items-start">
                  <span className="text-gray-400 font-bold text-3xl mt-2 mr-2">Rp</span>
                  <span className="text-[64px] font-black text-white tracking-tighter">149<span className="text-[36px] text-gray-400 tracking-normal">.000</span></span>
                  <span className="text-gray-400 font-medium self-end mb-4 ml-2">/ bulan</span>
                </div>
                <ul className="space-y-6 mb-12 text-[16px] font-medium text-gray-300 flex-1 relative z-10">
                  {['Semua kehebatan Starter', 'PWA QR Ordering (Self-Order)', 'Loyalty Hub & Poin Otomatis', 'Akses Multi-User (Super Admin)', 'Kustomisasi Struk Lengkap', 'Prioritas Support 24/7'].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-white"><svg className="w-7 h-7 text-[#d4a373] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> <strong>{item}</strong></li>
                  ))}
                </ul>
                <Link href="/cms/dashboard" className="block w-full py-5 text-center rounded-full bg-gradient-to-r from-[#6C4E31] to-[#583f27] text-white font-black text-[18px] shadow-[0_10px_20px_rgba(108,78,49,0.4)] group-hover:shadow-[0_15px_30px_rgba(108,78,49,0.6)] group-hover:scale-[1.03] transition-all duration-300 relative z-10">
                  Coba Gratis 14 Hari
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="py-32 bg-white border-t border-gray-200 scroll-mt-10 relative">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
               <h2 className="text-[36px] md:text-[48px] font-black mb-6 text-[#1a1f36] tracking-tight">Pertanyaan Seputar Kofilo</h2>
               <p className="text-gray-500 font-medium text-[18px] max-w-2xl mx-auto">Masih ragu? Berikut jawaban untuk pertanyaan yang paling sering diajukan oleh calon klien kami.</p>
            </div>
          </Reveal>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Reveal key={index} delay={index * 100} direction="up" className="w-full">
                <div className="bg-gray-50 border border-gray-200 rounded-[32px] overflow-hidden hover:bg-white hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 cursor-pointer" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <div className="w-full text-left p-8 flex justify-between items-center focus:outline-none">
                    <span className="font-bold text-[18px] text-[#1a1f36] pr-8">{faq.q}</span>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${openFaq === index ? 'bg-[#6C4E31] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 shadow-sm'}`}>
                       <svg className={`w-6 h-6 transform transition-transform duration-500 ${openFaq === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  <div className={`px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === index ? 'max-h-60 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-gray-500 text-[16px] leading-relaxed border-t border-gray-200 pt-6">{faq.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-40 max-w-7xl mx-auto px-6 text-center border-t border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-50/80 via-transparent to-transparent -z-10"></div>
        <Reveal type="scale" className="w-full">
          <h2 className="text-[44px] md:text-[72px] font-black tracking-tighter text-[#1a1f36] mb-8">Siap Meroketkan Omset Anda?</h2>
          <p className="text-gray-500 font-medium text-[20px] md:text-[24px] max-w-3xl mx-auto mb-14 leading-relaxed">Tinggalkan sistem lama yang membuat kasir Anda pusing. Beralih ke Kofilo hari ini dan nikmati kecanggihan ekosistem bisnis F&B masa depan.</p>
          <Link href="/cms/dashboard" className="inline-flex items-center gap-3 bg-[#1a1f36] text-white px-14 py-6 rounded-full text-[20px] font-black shadow-[0_15px_40px_-10px_rgba(26,31,54,0.6)] hover:bg-[#6C4E31] hover:-translate-y-2 hover:shadow-[0_25px_50px_-10px_rgba(108,78,49,0.7)] transition-all duration-500 group">
            Buat Akun Kofilo Sekarang
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </Reveal>
      </section>

      {/* ── SUPER FOOTER ── */}
      <footer className="bg-[#1a1f36] text-white pt-24 pb-10 relative z-10 rounded-t-[50px] md:rounded-t-[80px]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              {/* 🔥 UBAHAN: Footer Logo Dinamis */}
              {storeInfo.logo ? (
                <img src={storeInfo.logo} alt="Logo" className="w-12 h-12 rounded-[16px] object-cover bg-white shadow-[0_10px_20px_rgba(108,78,49,0.5)]" />
              ) : (
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#6C4E31] to-[#583f27] flex items-center justify-center text-white text-2xl font-black shadow-[0_10px_20px_rgba(108,78,49,0.5)]">{storeInitial}</div>
              )}
              <span className="font-black text-[32px] tracking-tight">{storeInfo.name}.</span>
            </div>
            <p className="text-gray-400 text-[16px] max-w-sm leading-relaxed">Sistem POS & Loyalty Hub modern yang didesain khusus untuk melipatgandakan retensi pelanggan dan omset bisnis F&B Anda secara otomatis.</p>
          </div>
          <div>
            <h4 className="font-black text-[18px] mb-8 text-white">Produk {storeInfo.name}</h4>
            <ul className="space-y-5 text-gray-400 text-[15px] font-medium">
              <li><a href="#fitur" className="hover:text-white hover:translate-x-1 inline-block transition-all">PWA Ordering App</a></li>
              <li><a href="#fitur" className="hover:text-white hover:translate-x-1 inline-block transition-all">Loyalty Reward System</a></li>
              <li><a href="#fitur" className="hover:text-white hover:translate-x-1 inline-block transition-all">Cloud Admin Dashboard</a></li>
              <li><a href="#harga" className="hover:text-white hover:translate-x-1 inline-block transition-all">Harga & Paket</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[18px] mb-8 text-white">Bantuan & Info</h4>
            <ul className="space-y-5 text-gray-400 text-[15px] font-medium">
              <li><a href="#faq" className="hover:text-white hover:translate-x-1 inline-block transition-all">Pusat Bantuan (FAQ)</a></li>
              <li>
                <a 
                  href="https://wa.me/6285799854015?text=Halo%20Tim%20Sales%20Kofilo,%20saya%20ingin%20bertanya%20mengenai%20paket%20sistem%20POS%20dan%20Loyalty." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white hover:translate-x-1 inline-block transition-all"
                >
                  Hubungi Tim Sales
                </a>
              </li>
              <li><a href="/landingpage/syarat-ketentuan" className="hover:text-white hover:translate-x-1 inline-block transition-all">Syarat & Ketentuan</a></li>
              <li><a href="/landingpage/kebijakan-privasi" className="hover:text-white hover:translate-x-1 inline-block transition-all">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[14px] text-gray-500 font-medium">© {new Date().getFullYear()} {storeInfo.name} Software F&B. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#6C4E31] hover:border-transparent hover:-translate-y-1 transition-all shadow-sm">IG</a>
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#6C4E31] hover:border-transparent hover:-translate-y-1 transition-all shadow-sm">X</a>
          </div>
        </div>
      </footer>

    </div>
  );
}