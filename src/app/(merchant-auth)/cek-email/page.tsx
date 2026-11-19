"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CekEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "email Anda";

  const [cooldown, setCooldown] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0) return;

    // TODO: Sambungkan ke POST /api/auth/resend-verification saat backend siap
    setCooldown(60);
    setStatusMsg("Link verifikasi baru telah dikirim. Periksa kotak masuk atau folder spam.");
  };

  return (
    <div className="max-w-md w-full mx-auto my-8 bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FCF3EA] text-[#E58B55] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#1a1f36] mb-3">
        Cek kotak masuk <span className="italic font-normal">email Anda.</span>
      </h1>

      <p className="text-gray-500 text-[14px] leading-relaxed mb-6 font-medium">
        Kami telah mengirimkan tautan aktivasi akun ke{" "}
        <strong className="text-[#1a1f36] break-all">{email}</strong>. Klik tautan tersebut untuk mengaktifkan dashboard kedai Anda.
      </p>

      {statusMsg && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] font-semibold">
          {statusMsg}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full py-3.5 rounded-2xl border border-gray-200 hover:border-gray-400 text-[#1a1f36] font-bold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cooldown > 0
            ? `Kirim Ulang dalam ${cooldown} detik`
            : "Kirim Ulang Email Verifikasi"}
        </button>

        <Link
          href="/masuk"
          className="block w-full py-4 rounded-2xl bg-[#18181b] hover:bg-black text-white font-bold text-[14px] transition-all shadow-sm"
        >
          Kembali ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
}

export default function CekEmailPage() {
  return (
    <div className="min-h-screen bg-[#FEFAF1] text-[#1a1f36] flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#E58B55]"></div>
          </div>
          <span className="font-bold text-[18px] tracking-tight text-[#1a1f36]">Kafiloo</span>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center text-sm text-gray-400">Memuat halaman...</div>}>
        <CekEmailContent />
      </Suspense>

      <div className="text-center text-[12px] text-gray-400 font-medium">
        © {new Date().getFullYear()} Kafiloo. All rights reserved.
      </div>
    </div>
  );
}