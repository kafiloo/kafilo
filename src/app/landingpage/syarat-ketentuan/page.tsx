"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const sections = [
  { id: "definisi", title: "Definisi" },
  { id: "pengguna", title: "Pengguna & Syarat Pengguna Platform" },
  { id: "penggunaan", title: "Penggunaan Platform" },
  { id: "ketentuan", title: "Ketentuan Platform" },
  { id: "penyalahgunaan", title: "Penyalahgunaan Platform" },
  { id: "lainnya", title: "Ketentuan Lainnya" },
];

export default function TermsAndConditions() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [scrolled, setScrolled] = useState(false);
  const [storeInfo, setStoreInfo] = useState({ name: "Kofilo", logo: "" });

  useEffect(() => {
    fetch("/api/public/store")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setStoreInfo({
            name: data.settings.storeName || "Kofilo",
            logo: data.settings.logo || "",
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const scrollPosition = window.scrollY + 180;
      let current = sections[0].id;

      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          current = section.id;
        }
      });

      if (Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 20) {
        current = sections[sections.length - 1].id;
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  const storeInitial = storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : "K";

  return (
    <div className="min-h-screen bg-[#Fdfbf9] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob { 0%, 100% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        .animate-blob { animation: blob 15s infinite alternate; }
        .animate-blob-delayed { animation: blob 15s infinite alternate; animation-delay: 4s; }
        .bg-grid-pattern { background-image: radial-gradient(rgba(108, 78, 49, 0.15) 1px, transparent 1px); background-size: 40px 40px; }
      `}} />

      {/* ── BACKGROUND ORBS & GRID ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-60"></div>
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-orange-200/30 rounded-full blur-[150px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-[#6C4E31]/10 rounded-full blur-[150px] animate-blob-delayed mix-blend-multiply"></div>
      </div>

      {/* ── NAVBAR (Persis Landing Page) ── */}
      <div className="fixed top-0 w-full z-50 p-4 transition-all duration-500 pointer-events-none">
        <nav className={`max-w-6xl mx-auto pointer-events-auto transition-all duration-500 rounded-full px-6 py-3 flex items-center justify-between ${scrolled ? "bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]" : "bg-transparent py-4"}`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/landingpage')}>
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
            <button onClick={() => router.push('/landingpage')} className="px-4 py-2 text-[14px] font-bold text-gray-500 hover:text-[#1a1f36] hover:bg-gray-100/50 rounded-full transition-all duration-300">
              Kembali ke Beranda
            </button>
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

      {/* ── KONTEN HALAMAN ── */}
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-24 flex flex-col md:flex-row gap-8 relative z-10 items-start min-h-screen">
        
        {/* ── SIDEBAR ── */}
        <aside className="w-full md:w-1/4 h-fit sticky top-32">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] p-4 border border-white/50">
            <nav className="flex flex-col space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`text-left px-4 py-3.5 text-[14px] rounded-xl transition-all duration-300 font-medium ${
                    activeSection === sec.id
                      ? "bg-gray-50 text-[#1a1f36] border-l-[4px] border-[#6C4E31] shadow-sm font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-[4px] border-transparent"
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── KONTEN UTAMA ── */}
        <main className="w-full md:w-3/4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-white/50 p-8 md:p-14">
            <h1 className="text-[36px] md:text-[42px] font-black text-[#1a1f36] tracking-tight mb-3">
              Syarat dan Ketentuan
            </h1>
            <p className="text-gray-500 text-[14px] font-semibold mb-10 pb-10 border-b border-gray-100">
              Terakhir Diperbarui: 16 Januari 2026
            </p>

            <div className="prose prose-gray max-w-none text-[15px] leading-[1.8] text-gray-600">
              <p className="mb-6">
                Syarat dan ketentuan di bawah ini mengatur penggunaan layanan jasa yang ditawarkan oleh 
                Kofilo terkait penyedia platform kasir (POS) dan pengelolaan pesanan online (PWA) dari mulai 
                penginputan data barang, pesanan pelanggan, sampai dengan proses riwayat transaksi. 
                Syarat dan ketentuan ini dapat mempengaruhi hak dan kewajiban pengguna jasa Kofilo
                di bawah ketentuan hukum yang berlaku.
              </p>
              <p className="mb-10">
                Dengan menggunakan layanan kami, Anda dianggap telah membaca, mengerti, dan menyetujui serta 
                terikat dan tunduk dengan segala syarat dan ketentuan yang berlaku di sini. Syarat dan ketentuan 
                ini dapat diubah oleh kami dengan pemberitahuan terlebih dahulu.
              </p>

              <div id="definisi" className="scroll-mt-40 mb-12">
                <h2 className="text-[20px] font-black text-[#1a1f36] mb-4 uppercase tracking-wide">1. Definisi</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Kofilo</strong> adalah platform perangkat lunak kasir dan pemesanan mandiri untuk bisnis F&B.</li>
                  <li><strong>Pengguna</strong> adalah pihak (pemilik bisnis atau kasir) yang menggunakan layanan Kofilo.</li>
                  <li><strong>Pelanggan</strong> adalah pembeli yang melakukan pemesanan melalui sistem PWA Kofilo.</li>
                </ul>
              </div>

              <div id="pengguna" className="scroll-mt-40 mb-12">
                <h2 className="text-[20px] font-black text-[#1a1f36] mb-4 uppercase tracking-wide">2. Pengguna & Syarat Pengguna Platform</h2>
                <p>Pengguna wajib memberikan informasi bisnis yang akurat dan sah saat mendaftar. Pengguna bertanggung jawab penuh atas keamanan akun dan kata sandi yang digunakan untuk mengakses Superadmin Kofilo.</p>
              </div>

              <div id="penggunaan" className="scroll-mt-40 mb-12">
                <h2 className="text-[20px] font-black text-[#1a1f36] mb-4 uppercase tracking-wide">3. Penggunaan Platform</h2>
                <p>Platform ini disediakan "sebagaimana adanya". Kofilo tidak menjamin bahwa platform akan selalu bebas dari gangguan, namun kami berkomitmen untuk menjaga waktu aktif (uptime) server sebaik mungkin untuk kelancaran operasional kafe Anda.</p>
              </div>

              <div id="ketentuan" className="scroll-mt-40 mb-12">
                <h2 className="text-[20px] font-black text-[#1a1f36] mb-4 uppercase tracking-wide">4. Ketentuan Platform</h2>
                <p>Pengguna setuju untuk tidak menggunakan platform ini untuk tujuan ilegal, mengunggah materi yang melanggar hak cipta, atau melakukan rekayasa balik (reverse engineering) pada perangkat lunak Kofilo.</p>
              </div>

              <div id="penyalahgunaan" className="scroll-mt-40 mb-12">
                <h2 className="text-[20px] font-black text-[#1a1f36] mb-4 uppercase tracking-wide">5. Penyalahgunaan Platform</h2>
                <p>Kofilo berhak untuk menangguhkan atau menghapus akun pengguna tanpa pemberitahuan sebelumnya apabila ditemukan bukti kuat adanya manipulasi sistem, penipuan transaksi, atau pelanggaran berat terhadap syarat ini.</p>
              </div>

              <div id="lainnya" className="scroll-mt-40">
                <h2 className="text-[20px] font-black text-[#1a1f36] mb-4 uppercase tracking-wide">6. Ketentuan Lainnya</h2>
                <p>Syarat dan ketentuan ini diatur dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia. Segala perselisihan akan diselesaikan secara musyawarah mufakat.</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── SUPER FOOTER (Persis Landing Page) ── */}
      <footer className="bg-[#1a1f36] text-white pt-24 pb-10 relative z-10 rounded-t-[50px] md:rounded-t-[80px]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-8">
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
              <li><Link href="/landingpage#fitur" className="hover:text-white hover:translate-x-1 inline-block transition-all">PWA Ordering App</Link></li>
              <li><Link href="/landingpage#fitur" className="hover:text-white hover:translate-x-1 inline-block transition-all">Loyalty Reward System</Link></li>
              <li><Link href="/landingpage#fitur" className="hover:text-white hover:translate-x-1 inline-block transition-all">Cloud Admin Dashboard</Link></li>
              <li><Link href="/landingpage#harga" className="hover:text-white hover:translate-x-1 inline-block transition-all">Harga & Paket</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[18px] mb-8 text-white">Bantuan & Info</h4>
            <ul className="space-y-5 text-gray-400 text-[15px] font-medium">
              <li><Link href="/landingpage#faq" className="hover:text-white hover:translate-x-1 inline-block transition-all">Pusat Bantuan (FAQ)</Link></li>
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
              <li><Link href="/landingpage/syarat-ketentuan" className="hover:text-white hover:translate-x-1 inline-block transition-all">Syarat & Ketentuan</Link></li>
              <li><Link href="/landingpage/kebijakan-privasi" className="hover:text-white hover:translate-x-1 inline-block transition-all">Kebijakan Privasi</Link></li>
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