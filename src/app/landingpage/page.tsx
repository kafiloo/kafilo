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
          
          {/* KIRI (Logo) - Diberi flex-1 agar porsinya sama */}
          <div className="flex-1 flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover group-hover:scale-105 transition-all duration-300" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300 relative">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              </div>
            )}
            <span className="font-bold text-[18px] tracking-tight">{storeInfo.name}</span>
          </div>
          
          {/* TENGAH (Menu) - Diberi flex-1 dan justify-center agar presisi di tengah */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-8">
            {['Fitur', 'Showcase', 'Review', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={(e) => scrollToSection(e, item.toLowerCase().replace(' ', '-'))} 
                 className="text-[14px] font-medium text-gray-500 hover:text-[#1a1f36] transition-colors duration-300">
                {item}
              </a>
            ))}
          </div>

          {/* KANAN (Button Daftar) - Diberi flex-1 dan justify-end agar tetap menempel di kanan */}
          <div className="flex-1 flex items-center justify-end gap-3">
             <a 
               href="#harga"
               onClick={(e) => scrollToSection(e, 'harga')}
               className="bg-[#18181b] hover:bg-black text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-sm cursor-pointer"
             >
                Daftar Sekarang
             </a>
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
          <div id="showcase" className="mt-20 scroll-mt-24 relative w-full max-w-6xl mx-auto h-[550px] md:h-[800px] perspective-1000">
            <div className="absolute inset-0 bg-[#F6F4EC] rounded-[24px] md:rounded-[32px] p-2 md:p-3 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[20px] md:rounded-[24px] overflow-hidden flex flex-col border border-gray-200/80 shadow-inner">
                
                {/* Browser Header */}
                <div className="h-12 bg-[#FDFCF8] border-b border-gray-100 flex items-center px-4 md:px-6 gap-4 shrink-0">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white border border-gray-100/80 rounded-full px-10 py-1.5 text-[11px] text-gray-400 font-medium tracking-wide shadow-sm">
                      app.kafiloo.com/dashboard
                    </div>
                  </div>
                  <div className="w-12"></div>
                </div>
                
                {/* App Body */}
                <div className="flex-1 flex overflow-hidden bg-[#F9F9FB] text-[#1a1f36]">
                  
                  {/* Sidebar */}
                  <div className="hidden md:flex w-64 bg-white border-r border-gray-100 p-5 flex-col shrink-0 justify-between z-10">
                    <div>
                      {/* Logo Area */}
                      <div className="flex items-center gap-3 mb-10 px-2 mt-2">
                        <div className="w-10 h-10 rounded-full bg-[#FCF3EA] flex items-center justify-center">
                          <div className="w-3 h-3 bg-[#E58B55] rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-black text-[15px] leading-tight">Kofilo</p>
                          <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Workspace</p>
                        </div>
                      </div>

                      {/* Menu List */}
                      <div className="flex flex-col gap-1.5">
                        <div className="h-11 w-full bg-white border border-[#1a1f36] shadow-[0_2px_10px_rgba(0,0,0,0.04)] rounded-xl flex items-center px-4 gap-3 cursor-pointer">
                          <svg className="w-4 h-4 text-[#1a1f36]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          <span className="font-bold text-[13px] text-[#1a1f36]">Dashboard</span>
                        </div>
                        
                        {[
                          { icon: "M4 6h16M4 10h16M4 14h16M4 18h16", label: "Menu Management" },
                          { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Report" },
                          { icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z", label: "Loyalty Hub", arrow: true },
                          { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", label: "Store Settings", arrow: true },
                          { icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", label: "User Access" }
                        ].map((item, i) => (
                          <div key={i} className="h-10 w-full flex items-center justify-between px-4 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                              <span className="font-medium text-[13px]">{item.label}</span>
                            </div>
                            {item.arrow && (
                              <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Profile */}
                    <div className="bg-gray-50 rounded-[20px] p-4 border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-black text-gray-500">
                           AM
                         </div>
                         <div>
                           <p className="font-bold text-[13px] text-[#1a1f36]">Alex Morgan</p>
                           <p className="text-[11px] text-gray-400 font-medium">Super Admin</p>
                         </div>
                      </div>
                      <div className="w-full h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-red-100 hover:bg-red-100 transition-colors">
                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                         <span className="text-[12px] font-bold">Logout</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
                     
                     {/* Header Dashboard */}
                     <div className="flex justify-between items-start mb-8">
                       <div>
                         <h2 className="text-[24px] md:text-[28px] font-black mb-1.5 tracking-tight text-[#1a1f36]">Welcome back, Alex</h2>
                         <p className="text-gray-400 text-[13px] font-medium">Here's what's happening at your stores on this selected date.</p>
                       </div>
                       <div className="hidden md:flex gap-3">
                         <div className="h-10 bg-white border border-gray-200 rounded-xl flex items-center px-4 gap-2 text-[12px] font-bold text-gray-500 shadow-sm cursor-pointer hover:bg-gray-50">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Tue, Jun 30, 2026
                         </div>
                         <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 shadow-sm cursor-pointer hover:bg-gray-50 relative">
                            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                         </div>
                       </div>
                     </div>

                     {/* Stats Row */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                        <div className="bg-white rounded-[24px] shadow-sm p-6 md:p-8 border border-gray-100 hover:shadow-md transition-shadow">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Gross Revenue</p>
                          <h3 className="text-[32px] font-black text-[#1a1f36] mb-2 tracking-tight">Rp 0</h3>
                          <p className="text-[12px] text-gray-400 font-medium">Total revenue generated today</p>
                        </div>
                        <div className="bg-white rounded-[24px] shadow-sm p-6 md:p-8 border border-gray-100 hover:shadow-md transition-shadow">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Completed Orders</p>
                          <h3 className="text-[32px] font-black text-[#1a1f36] mb-2 tracking-tight">0</h3>
                          <p className="text-[12px] text-gray-400 font-medium">Total orders processed</p>
                        </div>
                        <div className="bg-white rounded-[24px] shadow-sm p-6 md:p-8 border border-gray-100 hover:shadow-md transition-shadow">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Total Items Sold</p>
                          <h3 className="text-[32px] font-black text-[#1a1f36] mb-2 tracking-tight">0</h3>
                          <p className="text-[12px] text-gray-400 font-medium">Cups / items prepared today</p>
                        </div>
                     </div>

                     {/* Divider Product Performance */}
                     <div className="flex items-center gap-4 mb-8">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Product Performance</span>
                       <div className="h-[1px] w-full bg-gray-200"></div>
                     </div>

                     {/* Tables Row */}
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
                        
                        {/* Best Sellers Table */}
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 md:p-8">
                          <h3 className="text-[18px] font-black text-[#1a1f36] mb-6">Top 5 Best Sellers</h3>
                          
                          <div className="flex items-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4 px-2">
                             <div className="w-8">No</div>
                             <div className="flex-1">Menu Name</div>
                             <div className="w-16 text-right">Qty</div>
                             <div className="w-28 text-right">Revenue</div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {[
                              { no: 1, name: "Almond Milk Substitute", cat: "For You", qty: "1278", rev: "Rp 3.633.000" },
                              { no: 2, name: "Americano", cat: "Coffee", qty: "302", rev: "Rp 7.216.500" },
                              { no: 3, name: "Peach", cat: "Mocktail", qty: "183", rev: "Rp 6.136.300" },
                              { no: 4, name: "Iced Caramel Macchiato", cat: "Coffee", qty: "97", rev: "Rp 3.094.600" },
                              { no: 5, name: "Artisan Latte", cat: "Coffee", qty: "43", rev: "Rp 1.249.400" }
                            ].map((item) => (
                              <div key={item.no} className="flex items-center px-2 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="w-8 text-[12px] font-bold text-gray-400">{item.no}</div>
                                <div className="flex-1 flex items-center gap-3">
                                  {item.no === 1 ? (
                                     <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[14px]">🍯</div>
                                  ) : (
                                     <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100"></div>
                                  )}
                                  <div>
                                    <p className="text-[13px] font-bold text-[#1a1f36]">{item.name}</p>
                                    <p className="text-[11px] text-gray-400 font-medium">{item.cat}</p>
                                  </div>
                                </div>
                                <div className="w-16 text-right text-[13px] font-bold text-[#1a1f36]">{item.qty}</div>
                                <div className="w-28 text-right text-[13px] font-bold text-[#1a1f36]">{item.rev}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Slow Movers Table */}
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 md:p-8">
                          <h3 className="text-[18px] font-black text-[#1a1f36] mb-6">Bottom 5 Slow Movers</h3>
                          
                          <div className="flex items-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4 px-2">
                             <div className="w-8">No</div>
                             <div className="flex-1">Menu Name</div>
                             <div className="w-16 text-right">Qty</div>
                             <div className="w-28 text-right">Status</div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {[
                              { no: 1, name: "Kentang Goreng", cat: "Snack", qty: "0", status: "Zero Sales", type: "danger" },
                              { no: 2, name: "asdasd", cat: "For You", qty: "0", status: "Zero Sales", type: "danger" },
                              { no: 3, name: "asdasd", cat: "For You", qty: "0", status: "Zero Sales", type: "danger" },
                              { no: 4, name: "Butter Croissant", cat: "Pastry", qty: "11", status: "Low Demand", type: "warning" },
                              { no: 5, name: "Vegan Brownie", cat: "Pastry", qty: "11", status: "Low Demand", type: "warning" }
                            ].map((item) => (
                              <div key={item.no} className="flex items-center px-2 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="w-8 text-[12px] font-bold text-gray-400">{item.no}</div>
                                <div className="flex-1 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100"></div>
                                  <div>
                                    <p className="text-[13px] font-bold text-[#1a1f36]">{item.name}</p>
                                    <p className="text-[11px] text-gray-400 font-medium">{item.cat}</p>
                                  </div>
                                </div>
                                <div className="w-16 text-right text-[13px] font-black text-[#1a1f36] pr-4">{item.qty}</div>
                                <div className="w-28 flex justify-end">
                                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 ${item.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'danger' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                                    {item.status}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
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
      <section id="fitur" className="py-32 scroll-mt-20 relative z-10 bg-[#FEFAF1]">
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
      <section id="impact" className="py-32 bg-[#FEFAF1] relative z-10">
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

      {/* ── KOMPATIBILITAS DEVICE ── */}
      <section className="py-32 bg-[#FEFAF1] overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-16">
          
          {/* Kolom Kiri: Teks & Ikon */}
          <Reveal className="w-full lg:w-1/2">
            {/* Label Oren Tambahan */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-5 h-[1.5px] bg-[#E58B55]"></div>
              <span className="text-[11px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">KOMPATIBILITAS</span>
            </div>
            
            <h2 className="text-[36px] md:text-[48px] lg:text-[52px] font-bold tracking-tight mb-6 text-[#1a1f36] leading-[1.1]">
              Jalankan Kofilo di Perangkat Apapun.
            </h2>
            <p className="text-gray-500 text-[16px] md:text-[18px] mb-12 leading-relaxed max-w-lg">
              Anda tidak perlu membeli mesin kasir besar yang mahal. Kofilo berbasis web responsif penuh yang berjalan sangat mulus di iPad, Tablet Android, Laptop, maupun HP kasir Anda.
            </p>
            
            {/* Ikon Device Custom SVG */}
            <div className="flex gap-6 md:gap-8">
               {/* Mobile */}
               <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-center transition-transform hover:-translate-y-1">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="2" width="14" height="20" rx="3" fill="#6366f1" />
                      <rect x="8" y="6" width="3" height="3" rx="0.5" fill="#f472b6" />
                      <rect x="13" y="6" width="3" height="3" rx="0.5" fill="#fbbf24" />
                      <rect x="8" y="11" width="3" height="3" rx="0.5" fill="#34d399" />
                      <rect x="13" y="11" width="3" height="3" rx="0.5" fill="#60a5fa" />
                      <rect x="10" y="17" width="4" height="1.5" rx="0.75" fill="#c7d2fe" />
                    </svg>
                 </div>
                 <span className="text-[14px] font-bold text-[#1a1f36]">Mobile</span>
               </div>
               
               {/* Tablet */}
               <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-center transition-transform hover:-translate-y-1">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="5" width="20" height="14" rx="3" fill="#10b981" />
                      <rect x="4" y="7" width="14" height="10" rx="1" fill="#ecfdf5" />
                      <rect x="5" y="8" width="3" height="2" rx="0.5" fill="#f43f5e" />
                      <rect x="9" y="8" width="3" height="2" rx="0.5" fill="#3b82f6" />
                      <rect x="19" y="10.5" width="2" height="3" rx="1" fill="#047857" />
                    </svg>
                 </div>
                 <span className="text-[14px] font-bold text-[#1a1f36]">Tablet</span>
               </div>
               
               {/* Desktop */}
               <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-center transition-transform hover:-translate-y-1">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="20" height="13" rx="2" fill="#3b82f6" />
                      <rect x="4" y="6" width="16" height="9" rx="1" fill="#eff6ff" />
                      <path d="M8 21h8v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2z" fill="#93c5fd" />
                    </svg>
                 </div>
                 <span className="text-[14px] font-bold text-[#1a1f36]">Desktop</span>
               </div>
            </div>
          </Reveal>

          {/* Kolom Kanan: Mockup UI Bersih */}
          <Reveal delay={200} type="slide" direction="left" className="w-full lg:w-1/2">
            <div className="w-full aspect-[4/3] md:aspect-[16/11] bg-[#F4F4F5]/80 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-4 md:p-6 flex items-center justify-center relative overflow-hidden border border-gray-200/50 hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] transition-shadow duration-500">
               
               <div className="w-full h-full bg-white rounded-[24px] md:rounded-[28px] overflow-hidden flex shadow-sm border border-gray-200">
                  
                  {/* Sidebar Gelap */}
                  <div className="w-[35%] max-w-[140px] h-full bg-[#27272a] p-5 md:p-6 flex flex-col gap-4">
                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] bg-[#3f3f46] mb-4"></div>
                     <div className="w-[80%] h-3 bg-[#3f3f46] rounded-full"></div>
                     <div className="w-[50%] h-3 bg-[#3f3f46] rounded-full"></div>
                  </div>
                  
                  {/* Konten Utama Putih */}
                  <div className="flex-1 bg-white p-6 md:p-8 flex gap-4 md:gap-5 content-start flex-wrap">
                     <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-white rounded-[16px] shadow-sm border-[1.5px] border-gray-200/80"></div>
                     <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-white rounded-[16px] shadow-sm border-[1.5px] border-gray-200/80"></div>
                     <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] bg-white rounded-[16px] shadow-sm border-[1.5px] border-gray-200/80 hidden sm:block"></div>
                  </div>

               </div>

            </div>
          </Reveal>

        </div>
      </section>

{/* ── TESTIMONIAL / REVIEW (BARU) ── */}
      <section id="review" className="py-32 relative bg-[#FEFAF1] text-[#1a1f36] overflow-hidden scroll-mt-10">
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
        <div className="relative max-w-[1400px] mx-auto group">
          {/* Gradient Edges untuk efek fade di ujung kiri & kanan */}
          <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-[#FEFAF1] to-transparent pointer-events-none z-10"></div>
          <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-[#FEFAF1] to-transparent pointer-events-none z-10"></div>
          
          <Reveal delay={200} type="slide" direction="up" className="w-full">
            {/* Pembungkus utama untuk efek Infinite Marquee */}
            {/* group-hover akan menghentikan animasi saat mouse masuk */}
            <div className="flex w-full overflow-hidden py-4 group-hover:[&>div]:[animation-play-state:paused]">
              
              {/* Set 1 */}
              <div className="animate-marquee flex gap-6 shrink-0 pl-6">
                {[
                  { name: "Rizky K.", role: "Owner, Kopi Sanggar", initial: "RK", quote: "Sangat premium, mudah dimengerti dari pertama lihat." },
                  { name: "Nadia P.", role: "Barista Lead, Beans Lab", initial: "NP", quote: "Visualnya bersih dan modern, terasa lebih terpercaya." },
                  { name: "Farhan M.", role: "Owner, Daily Roast", initial: "FM", quote: "Navigasinya enak dan keseluruhan tampilannya lebih engaging." },
                  { name: "Sinta W.", role: "Owner, Brew & Bake", initial: "SW", quote: "Detail kecilnya rapi, terasa dibuat oleh orang yang paham operasional." },
                  { name: "Rizky K.", role: "Owner, Kopi Sanggar", initial: "RK", quote: "Sangat premium, mudah dimengerti dari pertama lihat." },
                  { name: "Nadia P.", role: "Barista Lead, Beans Lab", initial: "NP", quote: "Visualnya bersih dan modern, terasa lebih terpercaya." },
                  { name: "Farhan M.", role: "Owner, Daily Roast", initial: "FM", quote: "Navigasinya enak dan keseluruhan tampilannya lebih engaging." },
                  { name: "Sinta W.", role: "Owner, Brew & Bake", initial: "SW", quote: "Detail kecilnya rapi, terasa dibuat oleh orang yang paham operasional." }
                ].map((review, i) => (
                  <div key={`set1-${i}`} className="min-w-[300px] md:min-w-[360px] bg-white rounded-[24px] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
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

              {/* Set 2 (Duplikat untuk ilusi scrolling tanpa akhir) */}
              <div className="animate-marquee flex gap-6 shrink-0 pl-6">
                {[
                  { name: "Rizky K.", role: "Owner, Kopi Sanggar", initial: "RK", quote: "Sangat premium, mudah dimengerti dari pertama lihat." },
                  { name: "Nadia P.", role: "Barista Lead, Beans Lab", initial: "NP", quote: "Visualnya bersih dan modern, terasa lebih terpercaya." },
                  { name: "Farhan M.", role: "Owner, Daily Roast", initial: "FM", quote: "Navigasinya enak dan keseluruhan tampilannya lebih engaging." },
                  { name: "Sinta W.", role: "Owner, Brew & Bake", initial: "SW", quote: "Detail kecilnya rapi, terasa dibuat oleh orang yang paham operasional." },
                  { name: "Rizky K.", role: "Owner, Kopi Sanggar", initial: "RK", quote: "Sangat premium, mudah dimengerti dari pertama lihat." },
                  { name: "Nadia P.", role: "Barista Lead, Beans Lab", initial: "NP", quote: "Visualnya bersih dan modern, terasa lebih terpercaya." },
                  { name: "Farhan M.", role: "Owner, Daily Roast", initial: "FM", quote: "Navigasinya enak dan keseluruhan tampilannya lebih engaging." },
                  { name: "Sinta W.", role: "Owner, Brew & Bake", initial: "SW", quote: "Detail kecilnya rapi, terasa dibuat oleh orang yang paham operasional." }
                ].map((review, i) => (
                  <div key={`set2-${i}`} className="min-w-[300px] md:min-w-[360px] bg-white rounded-[24px] p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
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

            </div>
          </Reveal>
        </div>
      </section>

{/* ── PRICING SECTION ── */}
      <section id="harga" className="py-32 max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-20 relative">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          
          {/* ── CARD 1: STARTER ── */}
          <Reveal delay={100} direction="right" className="h-full w-full">
            <div className="bg-[#FCFBF7] border border-gray-200/80 rounded-[40px] p-8 md:p-10 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-4 transition-all duration-500 ease-out h-full flex flex-col justify-between w-full group cursor-pointer">
              <div>
                <h3 className="text-[32px] font-serif font-bold text-[#1a1f36] mb-2 tracking-tight">Starter</h3>
                <p className="text-gray-500 text-[14px] mb-8 font-medium">Bisnis dasar atau 1 outlet</p>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">MULAI DARI</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] md:text-[44px] font-bold text-[#1a1f36] tracking-tighter leading-none">Rp 199.000</span>
                    <span className="text-gray-500 text-[14px] font-medium">/ bulan</span>
                  </div>
                  <p className="text-gray-500 text-[14px] mt-4 leading-relaxed font-medium">Solusi POS esensial untuk operasional harian yang rapi dan efisien.</p>
                </div>

                <div className="w-full h-[1px] bg-gray-200/60 my-8"></div>

                <ul className="space-y-4 mb-8 text-[14px] font-medium text-gray-600">
                  {[
                    "Transaksi penjualan",
                    "Manajemen produk",
                    "Cetak struk / invoice",
                    "Laporan penjualan dasar",
                    "Multi role",
                    "Dashboard operasional sederhana"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 text-[#D5B9A1] mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  {[
                    "Tidak ada Loyalty Hub",
                    "Tidak ada advanced stock management",
                    "Tidak ada Customer CRM",
                    "Tidak ada management promo",
                    "Tidak ada multi store"
                  ].map((feature, i) => (
                    <li key={`min-${i}`} className="flex items-start gap-3 text-gray-400">
                      <svg className="w-5 h-5 shrink-0 text-gray-200 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/landingpage/checkout?plan=starter" className="block w-full py-4 text-center rounded-full border border-gray-200/80 bg-transparent hover:border-gray-400 text-[#1a1f36] font-bold text-[15px] transition-all duration-300">
                Mulai Starter →
              </Link>
            </div>
          </Reveal>

          {/* ── CARD 2: PRO (MOST POPULAR) ── */}
          <Reveal delay={200} direction="up" className="h-full w-full">
            <div className="relative bg-[#FCFBF7] border border-gray-200/80 rounded-[40px] p-8 md:p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] transition-all duration-500 ease-out h-full flex flex-col justify-between w-full lg:-translate-y-4 hover:-translate-y-4 lg:hover:-translate-y-8 group cursor-pointer">
              
              {/* Badge Most Popular */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a1f36] text-[#E58B55] text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-lg flex items-center gap-2">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
                </svg>
                MOST POPULAR
              </div>

              <div>
                <h3 className="text-[32px] font-serif font-bold text-[#1a1f36] mb-2 tracking-tight mt-2">Pro</h3>
                <p className="text-gray-500 text-[14px] mb-8 font-medium">Bisnis yang sudah ramai dan sering antre</p>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">MULAI DARI</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] md:text-[44px] font-bold text-[#1a1f36] tracking-tighter leading-none">Rp 249.000</span>
                    <span className="text-gray-500 text-[14px] font-medium">/ bulan</span>
                  </div>
                  <p className="text-gray-500 text-[14px] mt-4 leading-relaxed font-medium">Paket lengkap untuk bisnis yang berkembang dan butuh loyalitas pelanggan, kontrol stok, dan promosi yang lebih baik.</p>
                </div>

                <div className="w-full h-[1px] bg-gray-200/60 my-8"></div>

                <ul className="space-y-4 mb-8 text-[14px] font-bold text-[#1a1f36]">
                  {[
                    "Semua fitur Starter",
                    "Loyalty Hub",
                    "Stock Management",
                    "Customer CRM",
                    "Management Promo",
                    "Laporan lebih lengkap / insight penjualan",
                    "Multi store maksimal 3 outlet",
                    "Support prioritas"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 text-[#1a1f36] mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/landingpage/checkout?plan=pro" className="block w-full py-4 text-center rounded-full bg-[#1a1f36] text-white font-bold text-[15px] hover:bg-black transition-all duration-300 shadow-md">
                Pilih Pro →
              </Link>
            </div>
          </Reveal>

          {/* ── CARD 3: ENTERPRISE ── */}
          <Reveal delay={300} direction="left" className="h-full w-full">
            <div className="bg-[#FCFBF7] border border-gray-200/80 rounded-[40px] p-8 md:p-10 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-4 transition-all duration-500 ease-out h-full flex flex-col justify-between w-full group cursor-pointer">
              <div>
                <h3 className="text-[32px] font-serif font-bold text-[#1a1f36] mb-2 tracking-tight">Enterprise</h3>
                <p className="text-gray-500 text-[14px] mb-8 font-medium">Banyak outlet atau kebutuhan khusus</p>
                
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">HARGA</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] md:text-[44px] font-bold text-[#1a1f36] tracking-tighter leading-none">Custom</span>
                  </div>
                  <p className="text-gray-500 text-[14px] mt-4 leading-relaxed font-medium">Solusi fleksibel untuk bisnis multi outlet dan kebutuhan operasional yang lebih kompleks.</p>
                </div>

                <div className="w-full h-[1px] bg-gray-200/60 my-8"></div>

                <ul className="space-y-4 mb-8 text-[14px] font-medium text-gray-600">
                  {[
                    "Semua fitur Pro",
                    "Multi store tanpa batas",
                    "Custom fitur sesuai kebutuhan",
                    "Penyesuaian flow operasional",
                    "Support prioritas tinggi",
                    "Setup konsultatif"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 text-[#D5B9A1] mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <a href="https://wa.me/6285799854015?text=Halo%20Tim%20Kofilo,%20saya%20tertarik%20dengan%20paket%20Enterprise%20Custom." target="_blank" rel="noopener noreferrer" className="block w-full py-4 text-center rounded-full border border-gray-200/80 bg-transparent hover:border-gray-400 text-[#1a1f36] font-bold text-[15px] transition-all duration-300">
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
      <section className="py-32 max-w-7xl mx-auto px-6 lg:px-8 relative overflow-hidden z-10">
        <Reveal type="scale" className="w-full">
          <div className="bg-[#120d09] rounded-[40px] py-24 px-6 md:px-16 text-center relative overflow-hidden shadow-2xl border border-[#3b2716]/40">
            
            {/* Ambient Glows (Efek Nyala) */}
            <div className="absolute -bottom-40 -left-20 md:-left-40 w-[600px] h-[600px] bg-[#8B5024]/40 blur-[130px] rounded-full pointer-events-none animate-[pulse_5s_ease-in-out_infinite] delay-1000"></div>
            <div className="absolute -top-40 -right-20 md:-right-40 w-[600px] h-[600px] bg-[#8B5024]/40 blur-[130px] rounded-full pointer-events-none animate-pulse"></div>
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