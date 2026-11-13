"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckEmailContent() {
  const params = useSearchParams(); const token = params.get("token"); const email = params.get("email") || "email Anda";
  const [verification, setVerification] = useState<"checking" | "success" | "error" | "none">(token ? "checking" : "none");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => { if (active) { setVerification(ok ? "success" : "error"); setMessage(ok ? "Email berhasil diverifikasi. Silakan masuk." : data.error?.message || "Tautan verifikasi tidak berlaku."); } })
      .catch(() => { if (active) { setVerification("error"); setMessage("Tidak dapat memverifikasi email saat ini."); } });
    return () => { active = false; };
  }, [token]);
  async function resend() {
    if (busy || email === "email Anda") return;
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); setMessage(response.ok ? "Jika akun belum diverifikasi, tautan baru akan dikirim." : "Email belum dapat dikirim. Coba beberapa saat lagi."); }
    catch { setMessage("Tidak dapat menghubungi server."); }
    finally { setBusy(false); }
  }
  return <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/60">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">✉</div>
    <h1 className="mt-5 text-2xl font-black text-slate-900">{verification === "success" ? "Email terverifikasi" : verification === "checking" ? "Memverifikasi email…" : verification === "error" ? "Verifikasi gagal" : "Cek email Anda"}</h1>
    <p className="mt-3 text-slate-600">{verification === "none" ? <>Kami mengirim tautan verifikasi ke <strong>{email}</strong>. Klik tautan tersebut untuk mengaktifkan akun.</> : null}</p>
    {message && verification !== "none" && <p aria-live="polite" className="mt-3 text-sm text-slate-600">{message}</p>}
    {verification === "none" && <button onClick={resend} disabled={busy || email === "email Anda"} className="mt-6 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">{busy ? "Mengirim…" : "Kirim ulang email"}</button>}
    {verification !== "checking" && <p className="mt-6"><Link href="/masuk" className="font-bold text-amber-800">Kembali ke halaman masuk</Link></p>}
  </section>;
}

export default function CekEmailPage() { return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"><Suspense fallback={<div>Memuat…</div>}><CheckEmailContent /></Suspense></main>; }
