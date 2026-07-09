"use client";

// =============================================================
// Login Page — (auth)/login/page.tsx
// Diakses oleh semua role (SUPER_ADMIN & CASHIER)
// =============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 TAMBAHAN: State untuk menyimpan profil toko dinamis
  const [storeInfo, setStoreInfo] = useState({
    name: "Kofilo",
    logo: "",
    desc: "Manage your daily operations, track orders, and deliver the best coffee experience seamlessly."
  });

  // 🔥 TAMBAHAN: Fetch data toko saat halaman dibuka
  useEffect(() => {
    fetch("/api/public/store")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setStoreInfo({
            name: data.settings.storeName || "Kofilo",
            logo: data.settings.logo || "",
            desc: data.settings.description || "Manage your daily operations, track orders, and deliver the best coffee experience seamlessly."
          });
        }
      })
      .catch((err) => console.error("Gagal load profil toko", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

      // 🔥 KUNCI PERBAIKAN: Set flag justLoggedIn agar Toast muncul di halaman tujuan
      sessionStorage.setItem("justLoggedIn", "true");

      if (data.user.role === "SUPER_ADMIN" || data.user.role === "MANAGER") {
        router.push("/cms/dashboard");
      } else {
        router.push("/cashier");
      }
    } catch {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 TAMBAHAN: Helper untuk inisial nama toko (jika logo tidak ada)
  const storeInitial = storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : "K";

  return (
    <main className="min-h-screen flex bg-[#FAFAFA] font-sans selection:bg-[#6C4E31] selection:text-white">
      
      {/* SISI KIRI: BRANDING & IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1a1f36] flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop" 
            alt="Coffee Shop Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f36] via-[#1a1f36]/80 to-transparent"></div>
        </div>

        <div className="relative z-10 p-12 pt-16">
          {/* 🔥 UBAHAN: Menampilkan Logo Dinamis */}
          {storeInfo.logo ? (
            <img src={storeInfo.logo} alt="Logo" className="w-12 h-12 rounded-2xl object-cover bg-white shadow-lg shadow-[#1a1f36]/50" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#6C4E31] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#6C4E31]/30">
              {storeInitial}
            </div>
          )}
        </div>

        <div className="relative z-10 p-12 pb-16">
          {/* 🔥 UBAHAN: Menampilkan Nama dan Deskripsi Dinamis */}
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
            {storeInfo.name.split(' ')[0]} <br />
            <span className="text-[#6C4E31]">
              {storeInfo.name.split(' ').slice(1).join(' ') || "Workspace."}
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md font-medium">
            {storeInfo.desc}
          </p>
        </div>
      </div>

      {/* SISI KANAN: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative overflow-hidden bg-white">
        
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[#6C4E31]/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#1a1f36]/5 blur-3xl"></div>

        <div className="w-full max-w-md relative z-10">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            {/* 🔥 UBAHAN: Logo Dinamis Mobile */}
            {storeInfo.logo ? (
              <img src={storeInfo.logo} alt="Logo" className="w-10 h-10 rounded-xl object-cover bg-white shadow-md border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#6C4E31] text-white flex items-center justify-center font-bold text-xl shadow-md">
                {storeInitial}
              </div>
            )}
            <h1 className="text-xl font-black text-[#1a1f36]">{storeInfo.name}</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-[#1a1f36] tracking-tight mb-2">Welcome back</h2>
            <p className="text-gray-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm font-bold rounded-2xl p-4 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider ml-1">
                Username
              </label>
              <div className="relative group">
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-gray-200 text-gray-900 rounded-2xl px-4 py-3.5 text-[15px] font-medium focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 peer"
                  placeholder="Enter your username"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute right-4 top-3.5 text-gray-400 peer-focus:text-[#6C4E31] transition-colors duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-gray-700 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#f8f9fa] border border-gray-200 text-gray-900 rounded-2xl px-4 py-3.5 text-[15px] font-medium focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 peer"
                  placeholder="••••••••"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 absolute right-4 top-3.5 text-gray-400 peer-focus:text-[#6C4E31] transition-colors duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1f36] hover:bg-[#2a314d] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold text-[15px] py-4 rounded-2xl transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(26,31,54,0.3)] hover:-translate-y-0.5 active:scale-[0.98] mt-6 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Dev Info Area */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="bg-[#6C4E31]/5 border border-[#6C4E31]/10 rounded-2xl p-4 flex gap-3 items-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#6C4E31] shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              <div>
                <p className="text-[12px] font-bold text-[#6C4E31] uppercase tracking-wider mb-1">Development Access</p>
                <div className="flex gap-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> 
                    superadmin
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> 
                    admin123
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}