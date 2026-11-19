"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MerchantMasukPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg("");
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const rawUsers = localStorage.getItem("kafiloo_users");
      const users = rawUsers ? JSON.parse(rawUsers) : [];

      const matchedUser = users.find(
        (u: { email: string; password: string }) =>
          u.email === normalizedEmail && u.password === password
      );

      if (!matchedUser) {
        setErrorMsg("Email belum terdaftar atau password tidak sesuai.");
        setIsLoading(false);
        return;
      }

      // Simpan sesi login aktif
      localStorage.setItem(
        "kafiloo_session",
        JSON.stringify({
          businessName: matchedUser.businessName,
          slug: matchedUser.slug,
          email: matchedUser.email,
        })
      );

      // Redirect kembali ke landing page
      router.push("/");
    } catch {
      setErrorMsg("Terjadi kesalahan saat memeriksa akun.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFAF1] text-[#1a1f36] flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 font-sans selection:bg-[#1a1f36] selection:text-white">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-2 h-2 rounded-full bg-[#E58B55]"></div>
          </div>
          <span className="font-bold text-[18px] tracking-tight text-[#1a1f36]">Kafiloo</span>
        </Link>
        <Link href="/daftar" className="text-[13px] font-bold text-gray-500 hover:text-[#1a1f36] transition-colors">
          Belum punya kedai? <span className="text-[#E58B55] underline underline-offset-4">Daftar</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-8 bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-[1.5px] bg-[#E58B55]"></div>
            <span className="text-[10px] font-bold text-[#E58B55] uppercase tracking-[0.25em]">Merchant Portal</span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#1a1f36] leading-tight">
            Selamat datang <span className="italic font-normal">kembali.</span>
          </h1>
          <p className="text-gray-500 text-[14px] mt-2 font-medium">
            Masuk untuk memantau penjualan dan operasional kedai Anda.
          </p>
        </div>

        {/* Tombol Google (Segera Hadir) */}
        <button
          type="button"
          disabled
          className="w-full py-3.5 px-4 rounded-2xl border border-gray-200 bg-gray-50/60 text-gray-400 font-bold text-[14px] flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
            <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
          </svg>
          Masuk dengan Google (Segera Hadir)
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-gray-100 w-full"></div>
          <span className="bg-white px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
            masuk dengan email
          </span>
          <div className="border-t border-gray-100 w-full"></div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-[#1a1f36] mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              required
              placeholder="owner@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[14px] font-medium text-[#1a1f36] placeholder:text-gray-300 focus:border-[#1a1f36] focus:ring-2 focus:ring-[#1a1f36]/10 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-bold text-[#1a1f36]">
                Password
              </label>
              <span className="text-[12px] font-semibold text-gray-400">
                Lupa password?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-gray-200 text-[14px] font-medium text-[#1a1f36] placeholder:text-gray-300 focus:border-[#1a1f36] focus:ring-2 focus:ring-[#1a1f36]/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#1a1f36] transition-colors"
                aria-label="Tampilkan atau sembunyikan password"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 rounded-2xl bg-[#18181b] hover:bg-black text-white font-bold text-[14.5px] transition-all shadow-md hover:shadow-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? "Memeriksa Akun..." : "Masuk Sekarang →"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-[12px] text-gray-400 font-medium">
        © {new Date().getFullYear()} Kafiloo. All rights reserved.
      </div>
    </div>
  );
}