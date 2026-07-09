"use client";

// =============================================================
// Sidebar Component — /components/admin/Sidebar.tsx
// Navigasi CMS untuk SUPER_ADMIN (Premium Craft Coffee Theme)
// =============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/lib/auth";

interface Props {
  user: SessionUser;
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });
  
  // State untuk Dropdown Menu
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // State Profil Toko
  const [storeInfo, setStoreInfo] = useState({ name: "Kofilo", logo: "" });

  // Fetch Data Toko Dinamis
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

  // Auto-expand Dropdown jika sedang berada di dalam halamannya
  useEffect(() => {
    if (pathname.startsWith("/cms/loyalty")) setLoyaltyOpen(true);
    if (pathname.startsWith("/cms/settings")) setSettingsOpen(true);
  }, [pathname]);

  // Menangkap sinyal "justLoggedIn" dari halaman Login
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (justLoggedIn === "true") {
      setToast({ show: true, message: `Welcome back, ${user.name.split(" ")[0]}!` });
      sessionStorage.removeItem("justLoggedIn");
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    }
  }, [user.name]);

  const navLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14.5px] transition-all duration-200 ease-out group ${
      isActive
        ? "bg-[#F7F7F8] text-[#1a1f36] font-extrabold border-2 border-[#1a1f36] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]"
        : "text-[#6B7280] font-medium border-2 border-transparent hover:text-[#1a1f36] hover:bg-gray-50"
    }`;
  };

  const iconClass = (href: string) => {
    const isActive = pathname === href;
    return `transition-colors duration-200 ${isActive ? "text-[#1a1f36]" : "text-gray-400 group-hover:text-[#1a1f36]"}`;
  };

  const storeInitial = storeInfo.name ? storeInfo.name.charAt(0).toUpperCase() : "K";

  return (
    <>
      <aside className="w-[260px] bg-white border-r border-gray-100 flex flex-col h-screen text-[#1a1f36] sticky top-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">

        {/* ── Brand Header ───────────────────────────────────── */}
        <div className="px-7 py-8 flex items-center gap-3">
          {storeInfo.logo ? (
            <img src={storeInfo.logo} alt="Logo" className="w-11 h-11 rounded-2xl object-cover bg-white shadow-[0_4px_12px_rgba(108,78,49,0.1)] border border-gray-100" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6C4E31] to-[#583f27] flex items-center justify-center text-white text-xl shadow-[0_4px_12px_rgba(108,78,49,0.3)] relative">
              <span className="font-black text-xl tracking-tighter">{storeInitial}</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 rounded-2xl"></div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-[17px] leading-tight tracking-tight text-[#1a1f36] truncate">{storeInfo.name}</h1>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-0.5 truncate">Workspace</p>
          </div>
        </div>

        {/* ── Navigation Menu ────────────────────────────────── */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {/* Dashboard */}
          <Link href="/cms/dashboard" className={navLinkClass("/cms/dashboard")}>
            <span className={iconClass("/cms/dashboard")}>
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>

          {/* Menu Management */}
          <Link href="/cms/products" className={navLinkClass("/cms/products")}>
            <span className={iconClass("/cms/products")}>
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </span>
            <span>Menu Management</span>
          </Link>

          {/* Report */}
          <Link href="/cms/calendar" className={navLinkClass("/cms/calendar")}>
            <span className={iconClass("/cms/calendar")}>
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <span>Report</span>
          </Link>

          {/* Loyalty Hub — Collapsible */}
          <div>
            <button
              onClick={() => setLoyaltyOpen(!loyaltyOpen)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14.5px] transition-all duration-200 ease-out group border-2 ${
                pathname.startsWith("/cms/loyalty")
                  ? "bg-[#F7F7F8] text-[#1a1f36] font-extrabold border-[#1a1f36] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]"
                  : "text-[#6B7280] font-medium border-transparent hover:text-[#1a1f36] hover:bg-gray-50"
              }`}
            >
              <span className={`transition-colors duration-200 ${pathname.startsWith("/cms/loyalty") ? "text-[#1a1f36]" : "text-gray-400 group-hover:text-[#1a1f36]"}`}>
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </span>
              <span className="flex-1 text-left">Loyalty Hub</span>
              <svg
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                className={`w-4 h-4 transition-transform duration-300 ${loyaltyOpen ? "rotate-180" : "rotate-0"}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {loyaltyOpen && (
              <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-1">
                <Link href="/cms/loyalty/members"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/loyalty/members" || pathname === "/cms/loyalty"
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  Member
                </Link>
                <Link href="/cms/loyalty/rewards"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/loyalty/rewards"
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  Menu Penukaran
                </Link>
              </div>
            )}
          </div>

          {/* Store Settings — Collapsible */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14.5px] transition-all duration-200 ease-out group border-2 ${
                pathname.startsWith("/cms/settings")
                  ? "bg-[#F7F7F8] text-[#1a1f36] font-extrabold border-[#1a1f36] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]"
                  : "text-[#6B7280] font-medium border-transparent hover:text-[#1a1f36] hover:bg-gray-50"
              }`}
            >
              <span className={`transition-colors duration-200 ${pathname.startsWith("/cms/settings") ? "text-[#1a1f36]" : "text-gray-400 group-hover:text-[#1a1f36]"}`}>
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span className="flex-1 text-left">Store Settings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                className={`w-4 h-4 transition-transform duration-300 ${settingsOpen ? "rotate-180" : "rotate-0"}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {settingsOpen && (
              <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-1">
                {/* 1. Store Profile */}
                <Link href="/cms/settings/profile"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/settings/profile" || (pathname === "/cms/settings")
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  Store Profile
                </Link>
                <Link href="/cms/settings/pwa"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/settings/pwa"
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                  PWA
                </Link>
                <Link href="/cms/settings/financial"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/settings/financial"
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                  Finance & Taxes
                </Link>
                <Link href="/cms/settings/points"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/settings/points"
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Points Rule
                </Link>
                <Link href="/cms/settings/receipt"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                    pathname === "/cms/settings/receipt"
                      ? "bg-[#6C4E31]/10 text-[#6C4E31] font-extrabold"
                      : "text-gray-500 font-medium hover:text-[#1a1f36] hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Receipt Config
                </Link>
              </div>
            )}
          </div>

          {/* User Access */}
          <Link href="/cms/users" className={navLinkClass("/cms/users")}>
            <span className={iconClass("/cms/users")}>
              <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>User Access</span>
          </Link>

        </nav>

        {/* ── Bottom Widget (Profile Card & Logout) ──────────── */}
        <div className="mt-auto p-4 mb-2">
          <div className="bg-white border border-gray-100 rounded-[24px] p-3 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3 px-2 pt-1">
              <div className="w-[42px] h-[42px] rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-black text-[#1a1f36] text-[14px]">
                {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14.5px] font-black text-[#1a1f36] leading-tight truncate">{user.name}</h4>
                <p className="text-[12px] font-bold text-gray-400 capitalize mt-0.5">{user.role.toLowerCase().replace("_", " ")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center justify-center gap-2.5 w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-[14px] transition-colors duration-200 font-extrabold text-[13px] group"
            >
              <svg className="w-[18px] h-[18px] group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MODAL LOGOUT SUPERADMIN ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-[24px] w-full max-w-[320px] p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-[0.96] duration-300 ease-out">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            <h3 className="text-[18px] font-black text-[#1a1f36] mb-2">Keluar dari Workspace?</h3>
            <p className="text-[13px] text-gray-500 mb-6 font-medium">Sesi Anda akan diakhiri dan Anda harus memasukkan kredensial lagi untuk masuk.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-[13px] hover:bg-gray-50 hover:border-gray-200 transition-colors">Batal</button>
              <button onClick={() => { window.location.href = "/api/auth/logout"; }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-[13px] hover:bg-red-600 shadow-[0_4px_12px_-4px_rgba(239,68,68,0.5)] transition-all active:scale-95">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST LOGIN BERHASIL SUPERADMIN ── */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white border border-emerald-100 rounded-[20px] p-4 pr-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] flex items-center gap-4 min-w-[300px]">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className="font-black text-[15px] text-emerald-600 leading-none mb-1">Login Berhasil!</h4>
              <p className="text-[13px] text-gray-500 font-medium">{toast.message}</p>
            </div>
            <button onClick={() => setToast((prev) => ({ ...prev, show: false }))} className="text-gray-300 hover:text-gray-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}