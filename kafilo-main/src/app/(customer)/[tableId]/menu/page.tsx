'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { usePwaAuthStore } from '@/store/usePwaAuthStore';
import AuthDrawer from '@/components/customer/AuthDrawer';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  sku: string | null;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
  isDrink: boolean;
  sold?: number;
}

interface MenuCategory {
  categoryName: string;
  items: MenuItem[];
}

export default function CustomerMenuPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter(); 
  
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  
  const [quantity, setQuantity] = useState(1);
  const [cupSize, setCupSize] = useState('Regular');
  const [sweetness, setSweetness] = useState('Normal Sugar');
  const [iceLevel, setIceLevel] = useState('Normal Ice');
  const [itemNote, setItemNote] = useState('');

  const [toast, setToast] = useState<{ show: boolean; title: string; message: string }>({ 
    show: false, title: '', message: '' 
  });

  const { cart, addToCart } = useCartStore();
  const { customer, isLoggedIn, setCustomer } = usePwaAuthStore();

  const [isMounted, setIsMounted] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const [storeInfo, setStoreInfo] = useState({ 
    name: "Kofilo", logo: "", 
    pwaBanners: [] as any[]
  });
  
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── RADAR TOKO ──
  useEffect(() => {
    setIsMounted(true);
    let intervalId: NodeJS.Timeout;

    const checkStoreAndFetchInfo = async () => {
      try {
        const res = await fetch("/api/public/store", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setStoreInfo({
              name: data.settings.storeName || "Kofilo",
              logo: data.settings.logo || "",
              pwaBanners: data.settings.pwaBanners || []
            });

            const openTime = data.settings.openTime || "07:00";
            const closeTime = data.settings.closeTime || "22:00";
            const storeMode = data.settings.storeMode || "AUTO";

            // 🔥 KONVERSI KE MENIT UNTUK PERBANDINGAN PRESISI 🔥
            const timeToMinutes = (t: string) => {
              const parts = t.split(/[:.]/);
              return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const openMinutes = timeToMinutes(openTime);
            const closeMinutes = timeToMinutes(closeTime);

            let isStoreOpen = false;
            if (storeMode === "FORCE_OPEN") {
              isStoreOpen = true;
            } else if (storeMode === "FORCE_CLOSE") {
              isStoreOpen = false;
            } else {
              if (openMinutes <= closeMinutes) {
                // Jam normal (misal 07:00 sampai 22:00)
                isStoreOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
              } else {
                // Shift malam/subuh (misal 09:00 sampai 01:00)
                isStoreOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
              }
            }

            if (!isStoreOpen) {
              router.replace(`/${tableId}`); 
            }
          }
        }
      } catch (error) {
        console.error("Gagal load info toko:", error);
      }
    };

    checkStoreAndFetchInfo();
    intervalId = setInterval(checkStoreAndFetchInfo, 10000);

    return () => clearInterval(intervalId);
  }, [tableId, router]);

  const activeBanners = storeInfo.pwaBanners.filter((b: any) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  // ── FETCH MENU & SET INITIAL CATEGORY ──
  useEffect(() => {
    let isMounted = true; 
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/v1/pwa/menus', { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return; 

        const data = await res.json();
        if (!isMounted) return;

        const menuCategories: MenuCategory[] = data.categories || [];
        setCategories(menuCategories);
        
        if (menuCategories.length > 0) {
          const allItems = menuCategories.flatMap(cat => cat.items);
          
          // 🔥 UBAHAN DI SINI: Tambahkan .sort() untuk mengurutkan berdasarkan penjualan (Best Seller)
          const top4 = allItems
            .filter(item => item.isAvailable)
            .sort((a, b) => (b.sold || 0) - (a.sold || 0))
            .slice(0, 4);
            
          setRecommendedItems(top4);

          // 🔥 Default aktif ke Recommended jika ada, jika tidak ke kategori pertama
          if (top4.length > 0) {
            setActiveCategory('Recommended');
          } else {
            setActiveCategory(menuCategories[0].categoryName);
          }
        }
      } catch (err) {
        if (isMounted) console.error('Fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMenu();
    return () => { isMounted = false; };
  }, []);

  // ── AUTO-UPDATE POIN ──
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchFreshPoints = async () => {
      const currentCustomer = usePwaAuthStore.getState().customer;
      if (!currentCustomer?.token) return;

      try {
        const res = await fetch('/api/v1/pwa/customer/points', {
          headers: { Authorization: `Bearer ${currentCustomer.token}` },
          cache: 'no-store'
        });
        
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.customer) {
            if (data.customer.points !== currentCustomer.points || data.customer.name !== currentCustomer.name) {
              usePwaAuthStore.getState().setCustomer({
                ...data.customer,
                token: currentCustomer.token
              });
            }
          }
        }
      } catch (error) {
        console.error("Gagal auto-update poin:", error);
      }
    };

    if (isLoggedIn()) {
      fetchFreshPoints(); 
      intervalId = setInterval(fetchFreshPoints, 10000); 
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (justLoggedIn === "true") {
      setToast({ show: true, title: 'Selamat Datang!', message: `Anda berhasil masuk ke ${storeInfo.name} Loyalty.` });
      sessionStorage.removeItem("justLoggedIn");
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  }, [storeInfo.name]);

  // ── SCROLL SPY LOGIC (TERMASUK RECOMMENDED) ──
  useEffect(() => {
    const handleScroll = () => {
      if (categories.length === 0 && recommendedItems.length === 0) return;

      // 🔥 Gabungkan Recommended ke dalam pengecekan jika ada
      const sectionsToCheck = recommendedItems.length > 0 
        ? ['Recommended', ...categories.map(c => c.categoryName)]
        : categories.map(c => c.categoryName);

      let currentActive = sectionsToCheck[0];
      const detectionLine = window.innerHeight * 0.4; 

      for (const secName of sectionsToCheck) {
        const section = document.getElementById(`section-${secName}`);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= detectionLine) {
            currentActive = secName;
          }
        }
      }
      
      if (Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 5) {
        currentActive = sectionsToCheck[sectionsToCheck.length - 1];
      }

      if (activeCategory !== currentActive) {
        setActiveCategory(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, activeCategory, recommendedItems]);

  useEffect(() => {
    if (!activeCategory || !navRef.current) return;
    const activeBtn = document.getElementById(`nav-cat-${activeCategory}`);
    if (activeBtn) {
      const container = navRef.current;
      const scrollLeft = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeCategory]);

  const scrollToCategory = (categoryName: string) => {
    const el = document.getElementById(`section-${categoryName}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveCategory(categoryName); 
    }
  };

  const closeModal = () => {
    setSelectedProduct(null); setQuantity(1); setCupSize('Regular');
    setSweetness('Normal Sugar'); setIceLevel('Normal Ice'); setItemNote('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const isDrink = selectedProduct.isDrink; 
    const finalPrice = selectedProduct.price + (isDrink && cupSize === 'Large' ? 5000 : 0);
    const cleanNote = itemNote.replace(/,/g, ' ').trim();
    const variantString = isDrink ? `${cupSize}, ${sweetness}, ${iceLevel}${cleanNote ? `, Note: ${cleanNote}` : ''}` : (cleanNote ? `Note: ${cleanNote}` : '');
    const uniqueIdSuffix = isDrink ? `-${cupSize}-${sweetness}-${iceLevel}-${cleanNote}` : `-${cleanNote}`;

    addToCart({
      id: selectedProduct.id + (variantString ? uniqueIdSuffix : ''),
      name: selectedProduct.name + (variantString ? ` (${variantString})` : ''),
      price: finalPrice, quantity, variants: variantString || undefined,
    });
    closeModal();
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isSelectedProductDrink = selectedProduct?.isDrink === true;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#1C1917] pb-32 selection:bg-[#A67B5B] selection:text-white">
      <header className="px-5 pt-6 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {storeInfo.logo && <img src={storeInfo.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm bg-white" />}
          <h1 className="font-black text-[28px] tracking-tight text-[#1C1917] leading-none flex items-baseline gap-1">
            {storeInfo.name}<span className="w-2 h-2 rounded-full bg-[#A67B5B] inline-block mb-1"></span>
          </h1>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#1C1917] hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 py-2 animate-in fade-in zoom-in-[0.95] duration-200">
                <Link 
                  href={`/${tableId}/history`} 
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 w-full text-left px-5 py-3 text-[13px] font-extrabold text-gray-700 hover:bg-gray-50 hover:text-[#A67B5B] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  History Transaksi
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="px-5 pb-6 flex flex-col gap-5">
        {activeBanners.length > 0 && (
          <div className="relative w-full h-[280px] rounded-[24px] overflow-hidden shadow-[0_12px_30px_-10px_rgba(0,0,0,0.15)] group">
            {activeBanners.map((banner: any, idx: number) => (
              <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[4000ms] ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url('${banner.image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                  {banner.badge && <span className="w-fit bg-[#A67B5B] text-white px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-3 shadow-md">{banner.badge}</span>}
                  <h2 className="text-white font-black text-[32px] leading-tight drop-shadow-lg mb-1">{banner.title}</h2>
                  {banner.subtitle && <p className="text-[#E3C39D] font-serif italic text-[20px] drop-shadow-md">{banner.subtitle}</p>}
                </div>
              </div>
            ))}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                {activeBanners.map((_: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentSlide(idx)} 
                    className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-white w-6 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/40 w-2 hover:bg-white/70'}`} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => {
            if (!isLoggedIn()) {
              setShowAuthDrawer(true);
            } else {
              router.push(`/${tableId}/redeem`);
            }
          }}
          className={`w-full rounded-[24px] p-5 relative overflow-hidden active:scale-[0.98] transition-all duration-500 text-left flex items-center justify-between group ${
            isLoggedIn() ? 'bg-gradient-to-br from-[#6C4E31] to-[#4A3B32]' : 'bg-gradient-to-br from-[#1C1917] to-[#271C19]'
          }`}
        >
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute right-10 -bottom-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#CDA373] to-[#E3C39D] rounded-full flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#1C1917]">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-[14.5px] font-black text-white tracking-wide leading-tight">
                {isMounted && isLoggedIn() ? `Member ${customer?.name?.split(" ")[0] || storeInfo.name}` : `${storeInfo.name} Loyalty`}
              </h3>
              {isLoggedIn() && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-[12px] text-white/90 font-bold">{customer?.points || 0} Poin</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative z-10">
            {isLoggedIn() ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/${tableId}/redeem`);
                }}
                className="bg-white/20 text-white backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-white/30 transition-colors"
              >
                Tukarkan
              </button>
            ) : (
              <span className="bg-[#A67B5B] text-white px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                Daftar
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="sticky top-0 z-40 bg-[#FDFBF7]">
        <div ref={navRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-5 py-3.5 scroll-smooth">
          {/* 🔥 TOMBOL NAVIGASI RECOMMENDED HARUS SELALU PALING DEPAN 🔥 */}
          {recommendedItems.length > 0 && (
            <button 
              id="nav-cat-Recommended" 
              onClick={() => scrollToCategory('Recommended')}
              className={`px-5 py-2.5 rounded-full text-[13.5px] font-extrabold whitespace-nowrap transition-all duration-300 ${
                activeCategory === 'Recommended' 
                  ? 'bg-[#6C4E31] text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:text-[#1C1917] hover:bg-gray-50'
              }`}
            >
              Recommended
            </button>
          )}

          {/* BARULAH MAP KATEGORI YANG LAIN DI SINI */}
          {categories.map((cat) => (
            <button key={cat.categoryName} id={`nav-cat-${cat.categoryName}`} onClick={() => scrollToCategory(cat.categoryName)}
              className={`px-5 py-2.5 rounded-full text-[13.5px] font-extrabold whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat.categoryName 
                  ? 'bg-[#6C4E31] text-white shadow-md' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:text-[#1C1917] hover:bg-gray-50'
              }`}>
              {cat.categoryName}
            </button>
          ))}
        </div>
      </div>

      <main className="px-5 py-8 max-w-2xl mx-auto flex flex-col gap-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-[#A67B5B]">
            <div className="animate-spin w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full mb-3"></div>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase">Memuat Menu...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-10">
              <p className="text-gray-400 font-medium">Belum ada menu yang tersedia.</p>
          </div>
        ) : (
          <>
            {/* 🔥 BAGIAN KONTEN RECOMMENDED DENGAN SCROLL-MT & ID 🔥 */}
            {recommendedItems.length > 0 && (
              <section id="section-Recommended" className="scroll-mt-[80px] mb-2">
                <h2 className="text-[22px] font-black text-[#1C1917] mb-5 tracking-tight px-1">Recommended</h2>
                <div className="grid grid-cols-2 gap-4">
                  {recommendedItems.map((product) => (
                    <button 
                      key={`rec-${product.id}`} 
                      onClick={() => { setSelectedProduct(product); setQuantity(1); }} 
                      disabled={!product.isAvailable}
                      className={`bg-white rounded-[20px] p-3 text-left shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] border border-transparent hover:border-gray-100 transition-all duration-300 active:scale-[0.98] flex flex-col group ${product.isAvailable ? '' : 'opacity-50 grayscale-[50%]'}`}
                    >
                      <div className="w-full aspect-square rounded-[14px] bg-gray-50 mb-3 relative overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300 bg-gray-100">☕</div>
                        )}
                        {!product.isAvailable && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-[#1C1917] text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Habis</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 w-full">
                        <p className="text-[14px] font-extrabold text-[#1C1917] leading-snug mb-1.5 line-clamp-1">{product.name}</p>
                        <div className="flex justify-between items-center mt-auto pt-1 w-full">
                          <p className="text-[#A67B5B] font-black text-[14px]">Rp {product.price.toLocaleString('id-ID')}</p>
                          
                          {/* 🔥 TOMBOL PLUS DISAMAKAN DENGAN MENU BAWAH 🔥 */}
                          {product.isAvailable && (
                            <div className="w-8 h-8 rounded-full bg-gray-50 text-[#1C1917] flex items-center justify-center font-bold text-lg group-hover:bg-[#A67B5B] group-hover:text-white transition-colors shrink-0">
                              +
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {categories.map((cat) => (
              <section key={cat.categoryName} id={`section-${cat.categoryName}`} className="scroll-mt-[80px]">
                <h2 className="text-[22px] font-black text-[#1C1917] mb-5 tracking-tight px-1 flex items-center gap-3">
                  {cat.categoryName}
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                </h2>
                <div className="flex flex-col gap-4">
                  {cat.items.map((product) => (
                    <button key={product.id} onClick={() => { setSelectedProduct(product); setQuantity(1); }} disabled={!product.isAvailable}
                      className={`bg-white rounded-[20px] p-3 flex gap-4 text-left overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] border border-transparent hover:border-gray-100 transition-all duration-300 active:scale-[0.98] ${product.isAvailable ? '' : 'opacity-50 grayscale-[50%]'}`}>
                      <div className="w-24 h-24 rounded-[14px] bg-gray-50 flex-shrink-0 relative overflow-hidden">
                        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300 bg-gray-100">☕</div>}
                        {!product.isAvailable && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-[#1C1917] text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Habis</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center flex-1 py-1 pr-2">
                        <p className="text-[15px] font-extrabold text-[#1C1917] leading-snug mb-1.5 line-clamp-2">{product.name}</p>
                        {product.description && (
                          <p className="text-[12px] text-gray-400 font-medium line-clamp-2 mb-2 leading-tight">
                            {product.description}
                          </p>
                        )}
                        <p className="text-[#A67B5B] font-black text-[14px]">Rp {product.price.toLocaleString('id-ID')}</p>
                      </div>
                      {product.isAvailable && (
                        <div className="self-end pb-1 pr-1">
                          <div className="w-8 h-8 rounded-full bg-gray-50 text-[#1C1917] flex items-center justify-center font-bold text-lg group-hover:bg-[#A67B5B] group-hover:text-white transition-colors">+</div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1C1917]/50 backdrop-blur-sm transition-all duration-300">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="bg-white w-full max-w-lg rounded-t-[32px] p-6 pb-8 relative z-10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300" style={{ maxHeight: '92vh' }}>
            <div className="flex justify-between items-start mb-6">
              <div className="pr-4">
                <h2 className="font-black text-[22px] text-[#1a1f36] leading-tight tracking-tight mb-1">{selectedProduct.name}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[#A67B5B] font-extrabold text-[16px]">Rp {selectedProduct.price.toLocaleString('id-ID')}</p>
                  <span className="text-gray-400 font-medium text-[12px]">Base Price</span>
                </div>
              </div>
              <button onClick={closeModal} className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold active:scale-90 transition-transform">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-7 pb-4 scrollbar-hide">
              {isSelectedProductDrink && (
                <>
                  <div>
                    <h3 className="font-extrabold text-[12px] text-gray-400 uppercase tracking-wider mb-3">Cup Size</h3>
                    <div className="flex flex-col gap-3">
                      {['Regular', 'Large'].map((size) => (
                        <label key={size} className={`relative flex items-center justify-between p-4 rounded-[16px] border-2 cursor-pointer transition-all active:scale-[0.99] ${cupSize === size ? 'border-[#A67B5B] bg-[#A67B5B]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-[22px] h-[22px] rounded-full border-[2.5px] flex items-center justify-center transition-colors ${cupSize === size ? 'border-[#A67B5B]' : 'border-gray-300'}`}>
                              {cupSize === size && <div className="w-[10px] h-[10px] bg-[#A67B5B] rounded-full"></div>}
                            </div>
                            <span className={`text-[15px] font-black ${cupSize === size ? 'text-[#A67B5B]' : 'text-[#1C1917]'}`}>{size}</span>
                          </div>
                          <span className={`text-[14px] font-extrabold ${cupSize === size ? 'text-[#A67B5B]' : 'text-gray-500'}`}>{size === 'Large' ? '+Rp 5.000' : 'Rp 0'}</span>
                          <input type="radio" name="cupsize" value={size} checked={cupSize === size} onChange={() => setCupSize(size)} className="hidden" />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[12px] text-gray-400 uppercase tracking-wider mb-3">Sweetness Level</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['Normal Sugar', 'Low Sugar', 'No Sugar'].map((s) => (
                        <button key={s} onClick={() => setSweetness(s)} className={`py-3.5 rounded-[16px] border-2 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 ${sweetness === s ? 'border-[#A67B5B] text-[#A67B5B] bg-[#A67B5B]/5' : 'border-gray-100 bg-white text-[#1C1917] hover:border-gray-300'}`}>
                          <span className="text-[13.5px] font-black">{s.split(' ')[0]}</span>
                          <span className={`text-[11px] font-bold ${sweetness === s ? 'text-[#A67B5B]/70' : 'text-gray-400'}`}>{s.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[12px] text-gray-400 uppercase tracking-wider mb-3">Ice Level</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['Normal Ice', 'Less Ice', 'No Ice'].map((i) => (
                        <button key={i} onClick={() => setIceLevel(i)} className={`py-3.5 rounded-[16px] border-2 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 ${iceLevel === i ? 'border-[#A67B5B] text-[#A67B5B] bg-[#A67B5B]/5' : 'border-gray-100 bg-white text-[#1C1917] hover:border-gray-300'}`}>
                          <span className="text-[13.5px] font-black">{i.split(' ')[0]}</span>
                          <span className={`text-[11px] font-bold ${iceLevel === i ? 'text-[#A67B5B]/70' : 'text-gray-400'}`}>{i.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <h3 className="font-extrabold text-[12px] text-gray-400 uppercase tracking-wider">Catatan Tambahan</h3>
                  <span className="text-[10px] text-gray-400 font-bold">{itemNote.length}/50</span>
                </div>
                <textarea value={itemNote} onChange={(e) => setItemNote(e.target.value.slice(0, 50))} placeholder="Misal: Ekstra panas, less foam..." className="w-full bg-white border-2 border-gray-100 rounded-[16px] px-5 py-4 text-[14px] font-semibold text-[#1a1f36] focus:outline-none focus:border-[#A67B5B]/40 focus:ring-4 focus:ring-[#A67B5B]/10 transition-all duration-300 resize-none h-24 placeholder-gray-300"></textarea>
              </div>
            </div>

            <div className="mt-2 pt-5 border-t border-gray-100 flex gap-4">
              <div className="flex items-center bg-gray-50/80 border border-gray-100 rounded-[16px] px-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center font-black text-gray-400 text-lg hover:text-[#1a1f36] transition-colors">−</button>
                <span className="font-black text-[16px] w-6 text-center text-[#1a1f36]">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center font-black text-gray-400 text-lg hover:text-[#1a1f36] transition-colors">+</button>
              </div>
              <button onClick={handleAddToCart} className="flex-1 bg-[#6C4E31] text-white py-3.5 rounded-[16px] active:scale-[0.98] transition-transform flex flex-col items-center justify-center shadow-[0_8px_20px_-6px_rgba(28,25,23,0.4)]">
                <span className="font-extrabold text-[15px]">Add to Cart</span>
                <span className="text-[11px] font-semibold text-white/80 mt-0.5">Rp {((selectedProduct.price + (isSelectedProductDrink && cupSize === 'Large' ? 5000 : 0)) * quantity).toLocaleString('id-ID')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthDrawer isOpen={showAuthDrawer} onClose={() => setShowAuthDrawer(false)} context="loyalty" />

      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white rounded-[20px] p-4 pr-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-emerald-100 flex items-center gap-4 min-w-[300px]">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className="font-black text-[15px] text-emerald-600 leading-none mb-1">{toast.title}</h4>
              <p className="text-[13px] text-gray-500 font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 z-40 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-lg mx-auto bg-[#1C1917]/95 backdrop-blur-xl rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-4 px-6 flex justify-between items-center border border-white/10">
            <div>
              <p className="text-gray-400 text-[11px] font-extrabold uppercase tracking-widest mb-0.5">{totalCartItems} Items Selected</p>
              <p className="text-white text-xl font-black">Rp {totalCartPrice.toLocaleString('id-ID')}</p>
            </div>
            <Link href={`/${tableId}/cart`} className="bg-[#A67B5B] text-white px-7 py-3.5 rounded-full font-black text-[14px] active:scale-95 transition-transform flex items-center gap-2 shadow-[0_8px_20px_-6px_rgba(166,123,91,0.5)]">
              Checkout
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}