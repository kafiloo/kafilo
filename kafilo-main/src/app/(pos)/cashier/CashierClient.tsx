'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import ReceiptTicket from '@/components/shared/ReceiptTicket';

interface Category {
  id: string;
  name: string;
  isDrink?: boolean;
}
interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  sku: string | null;
  isAvailable: boolean;
  categoryId: string;
  category?: Category | null;
  isDrink?: boolean; 
}

interface PwaOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variants?: string | null;
  subTotal: number;
}

interface PwaOrder {
  id: string;
  tableId: string;
  totalAmount: number;
  status: 'PENDING_CONFIRMATION' | 'BEING_PREPARED' | 'READY_FOR_PICKUP' | 'CANCELLED';
  items: PwaOrderItem[];
  createdAt: string;
  customer?: { id: string; name: string; phone: string } | null;
}

export default function CashierClient({ cashierName }: { cashierName: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  // 🔥 UBAHAN 1: Tambahkan state categories untuk menyimpan urutan dari database
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cupSize, setCupSize] = useState('Regular');
  const [sweetness, setSweetness] = useState('Normal Sugar');
  const [iceLevel, setIceLevel] = useState('Normal Ice');
  const [itemNote, setItemNote] = useState('');

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashAmount, setCashAmount] = useState<number | 'EXACT' | null>('EXACT');
  const [transactionId, setTransactionId] = useState('');
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [storeInfo, setStoreInfo] = useState({ 
    name: "Kofilo", 
    logo: "", 
    wifiName: "", 
    wifiPassword: "", 
    receiptFooter: "",
    taxRate: 0,
    serviceCharge: 0,
    acceptCash: true,
    acceptQris: true
  });

  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message?: string; 
    txId?: string;    
    total?: number;   
  }>({ show: false, type: 'success', title: '' });

  const [activeRightPanel, setActiveRightPanel] = useState<'order' | 'online'>('order');
  const [onlineOrders, setOnlineOrders] = useState<PwaOrder[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Today's History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryOrderId, setSelectedHistoryOrderId] = useState<string | null>(null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const router = useRouter();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCartStore();

  // 🔥 Fetch Data Profil Toko
  useEffect(() => {
    fetch("/api/public/store")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setStoreInfo({
            name: data.settings.storeName || "Kofilo",
            logo: data.settings.logo || "",
            wifiName: data.settings.wifiName || "",
            wifiPassword: data.settings.wifiPassword || "",
            receiptFooter: data.settings.receiptFooter || "Terima kasih atas kunjungannya!",
            taxRate: data.settings.taxRate || 0,
            serviceCharge: data.settings.serviceCharge || 0,
            acceptCash: data.settings.acceptCash ?? true,
            acceptQris: data.settings.acceptQris ?? true
          });
          // Default selection if one is disabled
          if (data.settings.acceptCash === false) setPaymentMethod('QRIS');
        }
      }).catch(console.error);
  }, []);

  const fetchOnlineOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/pos/orders/incoming');
      if (!res.ok) return;
      const data = await res.json();
      setOnlineOrders(data.orders ?? []);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchOnlineOrders(); 
    const interval = setInterval(fetchOnlineOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOnlineOrders]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'BEING_PREPARED' | 'READY_FOR_PICKUP' | 'CANCELLED'
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/v1/pos/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchOnlineOrders();
      }
    } catch {
      alert('Gagal update status. Coba lagi.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const fetchHistoryOrders = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/pos/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryOrders(data.orders || []);
        if (data.orders && data.orders.length > 0) {
          setSelectedHistoryOrderId(data.orders[0].id);
          const detailRes = await fetch(`/api/pos/history/${data.orders[0].id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setSelectedHistoryOrder(detailData.order || null);
          }
        } else {
          setSelectedHistoryOrderId(null);
          setSelectedHistoryOrder(null);
        }
      }
    } catch (error) {
      console.error("[fetchHistoryOrders]", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleSelectHistoryOrder = async (id: string) => {
    setSelectedHistoryOrderId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/pos/history/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedHistoryOrder(data.order || null);
      }
    } catch (error) {
      console.error("[handleSelectHistoryOrder]", error);
    } finally {
      setDetailLoading(false);
    }
  };

  // 🔥 UBAHAN 2: Fetch kategori dan produk bersamaan dari API untuk menjamin urutan
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products")
        ]);
        
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        
        const fetchedCategories = catData.categories?.map((c: any) => c.name) || [];
        setCategories(fetchedCategories);

        const rawProducts = prodData.products ?? [];
        const processedProducts = rawProducts.map((p: any) => {
          const isItDrink = p.category?.isDrink === true;
          return {
            ...p,
            isDrink: isItDrink 
          };
        });

        setProducts(processedProducts);
      } catch (error) {
        console.error("Gagal ambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (justLoggedIn === "true") {
      setToast({
        show: true,
        type: 'success',
        title: 'Login Berhasil!',
        message: `Selamat bertugas, ${cashierName.split(' ')[0]}!`
      });
      
      sessionStorage.removeItem("justLoggedIn"); 
      
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  }, [cashierName]);

  // 🔥 UBAHAN 3: Otomatis pilih tab pertama tanpa merusak urutan asli
  useEffect(() => {
     if (categories.length > 0 && !activeCategory) {
         setActiveCategory(categories[0]);
     }
  }, [categories, activeCategory]);

  const filteredProducts = products.filter(
    (p) => (p.category?.name || "Lainnya").toLowerCase() === activeCategory.toLowerCase()
  );

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = Math.round(subtotal * (storeInfo.taxRate / 100));
  const serviceAmount = Math.round(subtotal * (storeInfo.serviceCharge / 100));
  const total = subtotal + taxAmount + serviceAmount;

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCupSize('Regular');
    setSweetness('Normal Sugar');
    setIceLevel('Normal Ice');
    setItemNote('');
  };

  const handleAddToCartConfirm = () => {
    if (!selectedProduct) return;

    const isDrink = selectedProduct.isDrink === true;
    const additionalPrice = (isDrink && cupSize === 'Large') ? 5000 : 0;
    const finalPrice = selectedProduct.price + additionalPrice;

    let uniqueId = selectedProduct.id;
    let variantName = selectedProduct.name;
    const cleanNote = itemNote.replace(/,/g, ' ').trim();

    if (isDrink) {
      const noteStr = cleanNote ? `, Catatan: ${cleanNote}` : '';
      uniqueId = `${selectedProduct.id}-${cupSize}-${sweetness}-${iceLevel}-${cleanNote}`;
      variantName = `${selectedProduct.name} (${cupSize}, ${sweetness}, ${iceLevel}${noteStr})`;
    } else {
      if (cleanNote) {
        uniqueId = `${selectedProduct.id}-${cleanNote}`;
        variantName = `${selectedProduct.name} (Catatan: ${cleanNote})`;
      }
    }

    addToCart({
      id: uniqueId,
      name: variantName,
      price: finalPrice,
      quantity: quantity,
    });

    setSelectedProduct(null);
  };

  const openCheckoutModal = () => {
    setTransactionId(`TX${Math.floor(Math.random() * 100000000)}`);
    setShowCheckoutModal(true);
    setPaymentMethod('CASH');
    setCashAmount('EXACT');
  };

  const confirmPayment = async () => {
    try {
      const apiItems = cart.map((item) => ({
        productId: item.id.split('-')[0],
        quantity: item.quantity,
      }));

      let cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : undefined;
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: apiItems,
          totalAmount: total,
          paymentMethod: paymentMethod,
          customerPhone: cleanPhone,
          customerName: cleanPhone ? "-" : undefined, 
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to process payment in backend");
      }

      setShowCheckoutModal(false);
      cart.forEach(item => removeFromCart(item.id));
      setPhoneNumber('');

      setToast({
        show: true,
        type: 'success',
        title: 'Payment Successful!',
        txId: transactionId,
        total: total
      });

      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);

    } catch (err: any) {
      console.error("[confirmPayment]", err);
      setToast({
        show: true,
        type: 'error',
        title: 'Payment Failed',
        message: err.message || "Terjadi kesalahan saat memproses pembayaran" 
      });
      
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  const parseItemName = (fullName: string) => {
    const match = fullName.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    const baseName = match ? match[1] : fullName;
    const variantString = match && match[2] ? match[2] : "";
    const variants = variantString ? variantString.split(', ') : [];
    return { baseName, variants };
  };

  const storeInitial = storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : "K";

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] font-sans relative selection:bg-[#6C4E31] selection:text-white">
      
      {/* ==========================================
          SISI KIRI: MENU & KATEGORI 
          ========================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="px-8 py-6 bg-white/80 backdrop-blur-md flex justify-between items-center shrink-0 border-b border-gray-100 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="w-11 h-11 rounded-2xl object-cover bg-white shadow-lg border border-gray-100" />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C4E31] to-[#583f27] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[#6C4E31]/20">
                {storeInitial}
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-xl leading-none text-[#1a1f36] tracking-tight">{storeInfo.name}</h1>
              <p className="text-[13px] text-gray-500 mt-1 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cashier: {cashierName}
              </p>
            </div>
          </div>
          
          <div className="relative w-80 group">
            <input 
              type="text" 
              placeholder="Search menu..." 
              className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-[#6C4E31]/30 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/5 transition-all duration-300 placeholder-gray-400"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-4 top-3.5 text-gray-400 group-focus-within:text-[#6C4E31] transition-colors duration-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </header>

        <div className="px-8 py-6 flex gap-3 overflow-x-auto scrollbar-hide shrink-0 items-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ease-out border ${
                activeCategory === cat
                  ? "bg-[#6C4E31] text-white border-[#6C4E31] shadow-lg shadow-[#6C4E31]/25 -translate-y-0.5"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#6C4E31]/40 hover:text-[#6C4E31] hover:shadow-md hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-[280px] animate-pulse shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                  <div className="w-full h-48 bg-gray-100"></div>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => openModal(product)}
                  disabled={!product.isAvailable}
                  className={`bg-white rounded-3xl text-left overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_12px_30px_-10px_rgba(108,78,49,0.2)] hover:-translate-y-1.5 hover:border-[#6C4E31]/20 flex flex-col active:scale-[0.97] group ${
                    product.isAvailable ? '' : 'opacity-40 grayscale-[50%]'
                  }`}
                >
                  <div className="w-full h-48 bg-gray-50 relative overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200 group-hover:scale-110 transition-transform duration-500">☕</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-5 flex flex-col">
                    <h3 className="text-[15px] font-extrabold text-[#1a1f36] leading-tight mb-2 line-clamp-2 group-hover:text-[#6C4E31] transition-colors">{product.name}</h3>
                    <p className="text-[#6C4E31] font-extrabold text-[14px]">Rp {product.price.toLocaleString('id-ID')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
          SISI KANAN: ORDER PANEL (Current Order / Pesanan Online)
          ========================================== */}
      <div className="w-[400px] bg-white border-l border-gray-100 flex flex-col h-full shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] relative z-20">
        <header className="px-5 py-4 flex justify-between items-center shrink-0 border-b border-gray-100 bg-white">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveRightPanel('order')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeRightPanel === 'order' ? 'bg-white text-[#1a1f36] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Order
            </button>
            <button
              onClick={() => { setActiveRightPanel('online'); fetchOnlineOrders(); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRightPanel === 'online' ? 'bg-white text-[#1a1f36] shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Pesanan Online
              {onlineOrders.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {onlineOrders.length > 9 ? '9+' : onlineOrders.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-1 text-gray-400 relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 hover:bg-gray-50 hover:text-gray-800 rounded-xl transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-10 mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 py-2">
                <button onClick={() => {
                  setShowDropdown(false);
                  setShowHistoryModal(true);
                  fetchHistoryOrders();
                }} className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#6C4E31]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  History Transaksi
                </button>
                <button onClick={() => {
                  setShowDropdown(false);
                  setShowLogoutModal(true);
                }} className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ---- PANEL: PESANAN ONLINE ---- */}
        {activeRightPanel === 'online' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#fcfcfc] flex flex-col gap-3 scrollbar-hide">
            {onlineOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-20">
                <span className="text-4xl mb-3">📭</span>
                <p className="text-sm font-bold text-gray-400">Belum ada pesanan online</p>
                <p className="text-xs text-gray-300 mt-1">Auto-update setiap 10 detik</p>
              </div>
            ) : (
              onlineOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[11px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md">Meja {order.tableId}</span>
                      {order.customer && (
                        <p className="text-xs text-gray-400 mt-1">{order.customer.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#1a1f36]">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'PENDING_CONFIRMATION' ? 'Menunggu' : 'Sedang Dibuat'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4">
                    {(order.items as PwaOrderItem[]).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">{item.quantity}x {item.name}</span>
                        <span className="text-gray-500">Rp {item.subTotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                    
                    {/* 🔥 TAMBAHAN: Munculkan Rincian Pajak & Layanan agar tidak bingung 🔥 */}
                    {(() => {
                      const itemsSubtotal = (order.items as PwaOrderItem[]).reduce((sum, item) => sum + item.subTotal, 0);
                      const extraFee = order.totalAmount - itemsSubtotal;
                      
                      if (extraFee > 0) {
                        return (
                          <div className="flex justify-between text-[11px] text-gray-400 border-t border-dashed border-gray-200 pt-1.5 mt-0.5">
                            <span className="font-bold">Pajak & Layanan</span>
                            <span className="font-bold">+ Rp {extraFee.toLocaleString('id-ID')}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'PENDING_CONFIRMATION' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'BEING_PREPARED')}
                        disabled={updatingOrderId === order.id}
                        className="flex-1 bg-[#6C4E31] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-[#583f27] active:scale-95 transition-all"
                      >
                        {updatingOrderId === order.id ? '...' : 'Konfirmasi'}
                      </button>
                    )}
                    {order.status === 'BEING_PREPARED' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                        disabled={updatingOrderId === order.id}
                        className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        {updatingOrderId === order.id ? '...' : 'Pesanan Selesai'}
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                      disabled={updatingOrderId === order.id}
                      className="px-3 py-2.5 border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 active:scale-95 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ))
            )}

            <p className="text-center text-[10px] text-gray-300 py-2 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
              Auto-refresh setiap 10 detik
            </p>
          </div>
        )}

        {/* ---- PANEL: CURRENT ORDER ---- */}
        {activeRightPanel === 'order' && (
          <div className="flex-1 overflow-y-auto p-7 bg-[#fcfcfc] flex flex-col scrollbar-hide">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                 <p className="font-bold text-sm text-gray-400">Cart is empty</p>
                 <p className="text-xs text-gray-300 mt-1">Select items from the menu to add.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {cart.map((item) => {
                  const { baseName, variants } = parseItemName(item.name);
                  return (
                    <div key={item.id} className="flex justify-between items-start pb-5 border-b border-gray-100 last:border-0 animate-in slide-in-from-right-4 fade-in duration-300 ease-out">
                      <div className="flex-1 pr-3">
                        <h3 className="font-extrabold text-[#1a1f36] text-[14px] leading-snug mb-1.5">{baseName}</h3>
                        {variants.length > 0 && (
                          <div className="flex flex-col gap-1.5 mb-3 mt-2">
                            {variants.map((v, i) => (
                              <span key={i} className="text-[11.5px] text-gray-500 font-semibold flex items-start gap-1.5 leading-tight">
                                <span className="text-gray-300">•</span> {v}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="font-extrabold text-[#6C4E31] text-[13px]">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                        <button onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeFromCart(item.id);
                            }
                          }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors font-bold text-lg leading-none">−</button>
                        <span className="font-extrabold text-[13px] w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors font-bold text-lg leading-none">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="px-7 pb-7 pt-4 bg-white shrink-0 border-t border-gray-100 relative shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex justify-between text-[13px] font-bold text-gray-400">
              <span>Subtotal</span><span className="text-gray-600">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {/* 🔥 TAMPILKAN JIKA LEBIH DARI 0 🔥 */}
            {serviceAmount > 0 && (
              <div className="flex justify-between text-[13px] font-bold text-gray-400">
                <span>Service Charge ({storeInfo.serviceCharge}%)</span><span className="text-gray-600">Rp {serviceAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-[13px] font-bold text-gray-400">
                <span>Tax ({storeInfo.taxRate}%)</span><span className="text-gray-600">Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-200 my-1"></div>
            <div className="flex justify-between items-end mt-1">
              <span className="text-sm font-extrabold text-gray-400 mb-0.5">Total</span>
              <span className="text-[22px] font-black text-[#1a1f36] leading-none">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0} 
            onClick={() => {
              setPhoneNumber(''); 
              setShowLoyaltyModal(true);
            }}
            className={`w-full py-4 rounded-2xl font-extrabold text-[15px] transition-all duration-300 flex justify-center items-center gap-2 ${
              cart.length > 0 
                ? 'bg-[#6C4E31] text-white shadow-[0_8px_20px_-6px_rgba(108,78,49,0.4)] hover:bg-[#583f27] hover:-translate-y-0.5 active:scale-[0.98]' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Proceed to Checkout Rp {total.toLocaleString('id-ID')}
            {cart.length > 0 && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>}
          </button>
        </div>
      </div>

      {/* ==========================================
          MODAL 1: KUSTOMISASI MENU & NOTE
          ========================================== */}
      {selectedProduct && !showCheckoutModal && (
        <div className="fixed inset-0 z-[60] bg-[#1a1f36]/40 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[28px] w-full max-w-[420px] shadow-2xl flex flex-col animate-in fade-in zoom-in-[0.96] duration-300 ease-out max-h-[85vh] overflow-hidden">
            
            <div className="flex justify-between items-start p-7 pb-4 shrink-0 bg-white z-10">
              <div>
                <h2 className="text-[22px] font-black text-[#1a1f36] leading-tight mb-1">{selectedProduct.name}</h2>
                <p className="text-[15px] font-bold text-[#6C4E31]">Rp {selectedProduct.price.toLocaleString('id-ID')} <span className="text-gray-400 font-medium text-xs ml-1">Base Price</span></p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors active:scale-90 shrink-0 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-6 scrollbar-hide">
              {selectedProduct.isDrink === true && (
                <div className="flex flex-col gap-6">
                  
                  <div className="flex flex-col gap-3">
                    <h3 className="font-bold text-[13px] text-gray-400 uppercase tracking-wider">Cup Size</h3>
                    <div className="flex flex-col gap-2.5">
                      <label className={`relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${cupSize === 'Regular' ? 'border-[#6C4E31] bg-[#6C4E31]/5 ring-4 ring-[#6C4E31]/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${cupSize === 'Regular' ? 'border-[#6C4E31]' : 'border-gray-300'}`}>
                            {cupSize === 'Regular' && <div className="w-2.5 h-2.5 bg-[#6C4E31] rounded-full animate-in zoom-in"></div>}
                          </div>
                          <span className={`text-[14px] font-bold ${cupSize === 'Regular' ? 'text-[#6C4E31]' : 'text-gray-600'}`}>Regular</span>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-400">Rp 0</span>
                        <input type="radio" name="cupsize" value="Regular" checked={cupSize === 'Regular'} onChange={() => setCupSize('Regular')} className="hidden" />
                      </label>
                      
                      <label className={`relative flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.99] ${cupSize === 'Large' ? 'border-[#6C4E31] bg-[#6C4E31]/5 ring-4 ring-[#6C4E31]/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${cupSize === 'Large' ? 'border-[#6C4E31]' : 'border-gray-300'}`}>
                            {cupSize === 'Large' && <div className="w-2.5 h-2.5 bg-[#6C4E31] rounded-full animate-in zoom-in"></div>}
                          </div>
                          <span className={`text-[14px] font-bold ${cupSize === 'Large' ? 'text-[#6C4E31]' : 'text-gray-600'}`}>Large</span>
                        </div>
                        <span className="text-[13px] font-extrabold text-[#6C4E31]">+Rp 5.000</span>
                        <input type="radio" name="cupsize" value="Large" checked={cupSize === 'Large'} onChange={() => setCupSize('Large')} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="font-bold text-[13px] text-gray-400 uppercase tracking-wider">Sweetness Level</h3>
                    <div className="flex gap-2">
                      {['Normal Sugar', 'Low Sugar', 'No Sugar'].map((level) => (
                        <button key={level} onClick={() => setSweetness(level)} className={`flex-1 py-3 rounded-xl border-2 text-[13px] font-bold transition-all ${sweetness === level ? 'border-[#6C4E31] text-[#6C4E31] bg-[#6C4E31]/5' : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}>
                          {level.split(' ')[0]} <span className="block text-[10px] text-gray-400">{level.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="font-bold text-[13px] text-gray-400 uppercase tracking-wider">Ice Level</h3>
                    <div className="flex gap-2">
                      {['Normal Ice', 'Less Ice', 'No Ice'].map((level) => (
                        <button key={level} onClick={() => setIceLevel(level)} className={`flex-1 py-3 rounded-xl border-2 text-[13px] font-bold transition-all ${iceLevel === level ? 'border-[#6C4E31] text-[#6C4E31] bg-[#6C4E31]/5' : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}>
                          {level.split(' ')[0]} <span className="block text-[10px] text-gray-400">{level.split(' ')[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex justify-between items-end">
                  <h3 className="font-bold text-[13px] text-gray-400 uppercase tracking-wider">Catatan Tambahan</h3>
                  <span className="text-[10px] text-gray-400 font-bold">{itemNote.length}/50</span>
                </div>
                <textarea
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value.slice(0, 50))}
                  placeholder="Misal: Tolong dipanaskan / Susunya dikurangi"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-4 py-3 text-[14px] font-semibold text-[#1a1f36] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 resize-none h-20 placeholder-gray-400"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 items-center p-7 pt-5 border-t border-gray-100 shrink-0 bg-white z-10">
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-2 border border-gray-200">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-xl shadow-sm transition-all font-bold text-xl active:scale-95">−</button>
                <span className="font-black text-[17px] w-5 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded-xl shadow-sm transition-all font-bold text-xl active:scale-95">+</button>
              </div>
              <button onClick={handleAddToCartConfirm} className="flex-1 bg-[#6C4E31] text-white py-4 rounded-2xl font-extrabold text-[15px] shadow-[0_8px_20px_-6px_rgba(108,78,49,0.4)] hover:bg-[#583f27] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex flex-col items-center justify-center">
                <span>Add to Cart</span>
                <span className="text-[11px] font-medium opacity-80 mt-0.5">Rp {((selectedProduct.price + ((selectedProduct.isDrink === true) && cupSize === 'Large' ? 5000 : 0)) * quantity).toLocaleString('id-ID')}</span>
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: WHATSAPP LOYALTY VALIDATION
          ========================================== */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-[55] bg-[#1a1f36]/40 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-[440px] p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-[0.96] duration-300 ease-out">
            
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#6C4E31] border border-gray-100 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </div>

            <h2 className="text-[22px] font-black text-[#6C4E31] tracking-tight leading-tight mb-2">
              Masukkan Nomor WhatsApp
            </h2>
            <p className="text-sm font-medium text-gray-500 max-w-[320px] mb-6 leading-relaxed">
              Kumpulkan poin loyalty otomatis dan terima nota digital langsung di WhatsApp Anda.
            </p>

            <div className="w-full text-left">
              <div className="flex items-center bg-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-[#6C4E31]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#6C4E31]/5 transition-all duration-300">
                <span className="px-4 py-4 bg-gray-50 border-r border-gray-200 text-[#1a1f36] font-black text-[15px] select-none">
                  +62
                </span>
                <input
                  type="text"
                  value={phoneNumber.replace('+62 ', '')}
                  onChange={(e) => {
                    let rawDigits = e.target.value.replace(/\D/g, '');
                    
                    if (rawDigits.startsWith('62')) {
                      rawDigits = rawDigits.slice(2);
                    } else if (rawDigits.startsWith('0')) {
                      rawDigits = rawDigits.slice(1);
                    }
                    
                    rawDigits = rawDigits.slice(0, 14);
                    
                    let formatted = "";
                    if (rawDigits.length <= 3) {
                      formatted = rawDigits;
                    } else if (rawDigits.length <= 7) {
                      formatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3)}`;
                    } else {
                      formatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 7)}-${rawDigits.slice(7)}`;
                    }
                    
                    setPhoneNumber(rawDigits ? `+62 ${formatted}` : "");
                  }}
                  placeholder="8xx-xxxx-xxxx"
                  className="w-full bg-transparent px-4 py-4 text-[15px] font-bold text-[#1a1f36] focus:outline-none placeholder-gray-300"
                />
              </div>
              <p className="text-[11px] font-semibold text-gray-400 mt-2.5 ml-1">
                Nomor handphone harus terdiri dari 10 - 14 angka.
              </p>
            </div>

            <div className="flex gap-4 w-full mt-8">
              <button
                type="button"
                onClick={() => {
                  setPhoneNumber('');
                  setShowLoyaltyModal(false);
                  openCheckoutModal();
                }}
                className="flex-1 py-4 border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 rounded-2xl font-bold text-[14.5px] transition-all active:scale-[0.98]"
              >
                Lewati
              </button>
              
              <button
                type="button"
                disabled={(() => {
                  const digits = phoneNumber.replace(/\D/g, '');
                  return digits.length > 0 && (digits.length < 10 || digits.length > 16);
                })()}
                onClick={() => {
                  setShowLoyaltyModal(false);
                  openCheckoutModal();
                }}
                className={`flex-1 py-4 rounded-2xl font-bold text-[14.5px] transition-all flex items-center justify-center ${
                  (() => {
                    const digits = phoneNumber.replace(/\D/g, '');
                    return digits.length >= 10 && digits.length <= 16;
                  })()
                    ? 'bg-[#6C4E31] text-white hover:bg-[#583f27] hover:-translate-y-0.5 shadow-md active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                Lanjutkan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: CHECKOUT & PAYMENT
          ========================================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[70] bg-[#1a1f36]/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-[0.96] duration-300 ease-out max-h-[90vh]">
            
            {/* KIRI: METODE PEMBAYARAN */}
            <div className="flex-1 p-10 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-[#1a1f36] tracking-tight">Payment</h2>
                <button onClick={() => setShowCheckoutModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* 🔥 PROTEKSI: JIKA SEMUA METODE PEMBAYARAN DIMATIKAN ADMIN 🔥 */}
              {!storeInfo.acceptCash && !storeInfo.acceptQris ? (
                <div className="mb-auto flex flex-col items-center justify-center p-10 border-2 border-dashed border-red-200 rounded-3xl bg-red-50/50 text-red-500 animate-in fade-in duration-300">
                  <span className="text-4xl mb-3">⚠️</span>
                  <h3 className="font-extrabold text-[#1a1f36] text-lg mb-1 text-center">Metode Pembayaran Tidak Tersedia</h3>
                  <p className="text-sm font-medium text-red-400 text-center">Semua metode pembayaran sedang dinonaktifkan.<br/>Harap hubungi Admin.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-8">
                    {/* 🔥 SEMBUNYIKAN JIKA DI-DISABLE DI ADMIN 🔥 */}
                    {storeInfo.acceptCash && (
                      <button 
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex-1 py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 font-extrabold transition-all ${paymentMethod === 'CASH' ? 'border-[#6C4E31] text-[#6C4E31] bg-[#6C4E31]/5 ring-4 ring-[#6C4E31]/10' : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V4.22a.75.75 0 00-.75-.75h-13.5a.75.75 0 00-.75.75v14.53zM15.75 18.75v-1.5a.75.75 0 00-1.5 0v1.5m-3-1.5v1.5m-3-1.5v1.5m10.5-12.75h-10.5M10.5 9h-3m3 3h-3m3 3h-3m3 0v1.5" /></svg>
                        CASH
                      </button>
                    )}
                    {storeInfo.acceptQris && (
                      <button 
                        onClick={() => setPaymentMethod('QRIS')}
                        className={`flex-1 py-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 font-extrabold transition-all ${paymentMethod === 'QRIS' ? 'border-[#6C4E31] text-[#6C4E31] bg-[#6C4E31]/5 ring-4 ring-[#6C4E31]/10' : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5h.008v.008h-.008v-.008zM16.5 19.5h.008v.008h-.008v-.008zM19.5 16.5h.008v.008h-.008v-.008zM19.5 19.5h.008v.008h-.008v-.008zM16.5 13.5h.008v.008h-.008v-.008zM13.5 16.5h.008v.008h-.008v-.008zM13.5 19.5h.008v.008h-.008v-.008zM19.5 13.5h.008v.008h-.008v-.008z" /></svg>
                        QRIS / E-Wallet
                      </button>
                    )}
                  </div>

                  {paymentMethod === 'CASH' && storeInfo.acceptCash && (
                    <div className="mb-auto animate-in fade-in duration-300">
                      <h3 className="font-bold text-[13px] text-gray-400 uppercase tracking-wider mb-4">Quick Cash</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setCashAmount('EXACT')}
                          className={`py-4 rounded-2xl border-2 text-[14px] font-bold transition-all ${cashAmount === 'EXACT' ? 'border-[#6C4E31] text-[#6C4E31] bg-[#6C4E31]/5' : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
                        >
                          Exact Amount
                        </button>
                        {[50000, 100000, 150000, 200000].map((amount) => (
                          <button 
                            key={amount}
                            onClick={() => setCashAmount(amount)}
                            className={`py-4 rounded-2xl border-2 text-[14px] font-bold transition-all ${cashAmount === amount ? 'border-[#6C4E31] text-[#6C4E31] bg-[#6C4E31]/5' : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
                          >
                            Rp {amount.toLocaleString('id-ID')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'QRIS' && storeInfo.acceptQris && (
                    <div className="mb-auto flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 animate-in fade-in duration-300">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#6C4E31]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5h.008v.008h-.008v-.008zM16.5 19.5h.008v.008h-.008v-.008zM19.5 16.5h.008v.008h-.008v-.008zM19.5 19.5h.008v.008h-.008v-.008zM16.5 13.5h.008v.008h-.008v-.008zM13.5 16.5h.008v.008h-.008v-.008zM13.5 19.5h.008v.008h-.008v-.008zM19.5 13.5h.008v.008h-.008v-.008z" /></svg>
                      </div>
                      <h3 className="font-extrabold text-[#1a1f36] text-lg mb-1">Awaiting Payment</h3>
                      <p className="text-sm font-medium text-gray-500 text-center">Please scan the QR code displayed on<br/>the EDC machine to complete.</p>
                    </div>
                  )}
                </>
              )}

              <button 
                onClick={confirmPayment}
                disabled={!storeInfo.acceptCash && !storeInfo.acceptQris}
                className={`mt-8 w-full py-5 rounded-2xl font-black text-[16px] transition-all ${
                  (!storeInfo.acceptCash && !storeInfo.acceptQris) 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#6C4E31] text-white shadow-[0_8px_25px_-8px_rgba(108,78,49,0.5)] hover:bg-[#583f27] hover:-translate-y-0.5 active:scale-[0.98]'
                }`}
              >
                Confirm Payment - Rp {total.toLocaleString('id-ID')}
              </button>
            </div>

            {/* KANAN: RECEIPT PREVIEW */}
            <div className="w-[380px] bg-[#f4f5f7] border-l border-gray-200 p-10 flex justify-center items-start overflow-y-auto hidden md:flex">
              <ReceiptTicket
                data={{
                  storeName: storeInfo.name,
                  date: new Date().toLocaleDateString('id-ID'),
                  time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                  txId: transactionId || "TX00000000",
                  cashierName: cashierName.split(' ')[0],
                  subtotal: subtotal,
                  tax: taxAmount,
                  taxRate: storeInfo.taxRate,
                  serviceCharge: serviceAmount,
                  serviceRate: storeInfo.serviceCharge,
                  total: total,
                  paymentMethod: paymentMethod,
                  wifiName: storeInfo.wifiName,
                  wifiPassword: storeInfo.wifiPassword,
                  footerMessage: storeInfo.receiptFooter,
                  items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subTotal: item.price * item.quantity
                  }))
                }}
              />
            </div>

          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-[20px] p-4 pr-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border flex items-start gap-4 min-w-[320px] ${
            toast.type === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {toast.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <div className="flex-1 pt-1">
              <h4 className={`font-black text-[16px] leading-none mb-1.5 ${
                toast.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {toast.title}
              </h4>
              
              {toast.type === 'success' && toast.txId ? (
                <div className="text-[13px] text-gray-500 font-medium">
                  <p>Tx ID: <span className="text-[#1a1f36] font-bold">{toast.txId}</span></p>
                  <p>Total: <span className="text-[#6C4E31] font-black">Rp {toast.total?.toLocaleString('id-ID')}</span></p>
                </div>
              ) : (
                <p className="text-[13px] text-gray-500 font-medium line-clamp-2">{toast.message}</p>
              )}
            </div>

            <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="text-gray-300 hover:text-gray-500 pt-1 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL LOGOUT 🔥 */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[24px] w-full max-w-[320px] p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-[0.96] duration-300 ease-out">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            <h3 className="text-[18px] font-black text-[#1a1f36] mb-2">Keluar dari Kasir?</h3>
            <p className="text-[13px] text-gray-500 mb-6 font-medium">Sesi Anda akan diakhiri dan harus login kembali untuk masuk.</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-[13px] hover:bg-gray-50 hover:border-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => window.location.href = '/api/auth/logout'} 
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-[13px] hover:bg-red-600 shadow-[0_4px_12px_-4px_rgba(239,68,68,0.5)] transition-all active:scale-95"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==========================================
          MODAL: HISTORY TRANSAKSI HARI INI (Split-Screen Master-Detail)
          ========================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[80] bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-[0.96] duration-300 ease-out h-[85vh]">
            
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-[#1a1f36] tracking-tight flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-[#6C4E31]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  History Transaksi Hari Ini
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">Daftar penjualan dan struk transaksi khusus hari ini.</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* SISI KIRI: DAFTAR TRANSAKSI (MASTER) */}
              <div className="flex-1 border-r border-gray-100 flex flex-col overflow-y-auto bg-gray-50/30">
                {historyLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <svg className="animate-spin h-8 w-8 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="font-bold text-xs text-gray-400">Memuat transaksi...</span>
                  </div>
                ) : historyOrders.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-10">
                    <div className="text-4xl">🧾</div>
                    <p className="text-sm font-bold text-gray-500">Belum ada transaksi hari ini</p>
                    <p className="text-xs text-gray-400 max-w-[200px] text-center leading-relaxed">Transaksi baru yang sukses diselesaikan kasir akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100/60">
                    {historyOrders.map((order) => {
                      const isSelected = selectedHistoryOrderId === order.id;
                      return (
                        <button
                          key={order.id}
                          onClick={() => handleSelectHistoryOrder(order.id)}
                          className={`w-full text-left p-5 flex items-center justify-between transition-all duration-200 border-l-4 ${
                            isSelected
                              ? 'bg-white border-[#6C4E31] shadow-sm'
                              : 'border-transparent hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex-1 pr-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-extrabold text-[14px] text-[#1a1f36]">{order.txId}</span>
                              <span className="text-[11px] font-bold text-gray-400 font-mono">• {order.time}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                order.paymentMethod === 'QRIS' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {order.paymentMethod}
                              </span>
                              <span className="text-[12px] font-medium text-gray-400">Kasir: {order.cashierName.split(' ')[0]}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-[14.5px] text-[#1a1f36]">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {order.status === 'COMPLETED' ? 'Sukses' : order.status === 'CANCELLED' ? 'Batal' : 'Pending'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SISI KANAN: RECEIPT DETAIL (DETAIL) */}
              <div className="w-[420px] bg-gray-50 flex flex-col justify-start items-center p-8 overflow-y-auto min-h-0 shrink-0">
                {detailLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <svg className="animate-spin h-6 w-6 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="font-bold text-xs text-gray-400">Memuat detail struk...</span>
                  </div>
                ) : selectedHistoryOrder ? (
                  
                  <div className="w-full flex flex-col items-center gap-4">
                    <ReceiptTicket
                      data={{
                        storeName: storeInfo.name,
                        date: new Date(selectedHistoryOrder.createdAt).toLocaleDateString('id-ID'),
                        time: new Date(selectedHistoryOrder.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        txId: selectedHistoryOrder.txId,
                        cashierName: selectedHistoryOrder.cashierName.split(' ')[0],
                        subtotal: Math.floor(selectedHistoryOrder.totalAmount / 1.1),
                        tax: Math.floor(selectedHistoryOrder.totalAmount - (selectedHistoryOrder.totalAmount / 1.1)),
                        total: selectedHistoryOrder.totalAmount,
                        paymentMethod: selectedHistoryOrder.paymentMethod,
                        wifiName: storeInfo.wifiName,
                        wifiPassword: storeInfo.wifiPassword,
                        footerMessage: storeInfo.receiptFooter,
                        items: selectedHistoryOrder.items.map((item: any) => ({
                          id: item.id,
                          name: item.productName,
                          quantity: item.quantity,
                          price: item.unitPrice,
                          subTotal: item.subTotal
                        }))
                      }}
                    />
                    <button
                      onClick={() => window.print()}
                      className="w-full max-w-[400px] mt-2 py-3 bg-[#1a1f36] text-white rounded-xl font-bold hover:bg-[#6C4E31] transition-colors shadow-sm flex justify-center items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.11 1.227H7.221c-.636 0-1.12-.556-1.11-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v2.796c0 1.18.91 2.164 2.09 2.201a51.964 51.964 0 006.32 0c1.18-.037 2.09-1.022 2.09-2.201V9.289z" /></svg>
                      Print Struk
                    </button>
                  </div>

                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-20 text-center">
                    <div className="text-3xl mb-2">👈</div>
                    <p className="text-xs font-bold text-gray-400">Pilih transaksi di sebelah kiri</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">Struk digital lengkap akan tampil di sini.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}