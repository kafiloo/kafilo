"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { SlugInput } from "@/components/auth/SlugInput";

function Field({ label, id, type = "text", value, onChange, autoComplete }: { label: string; id: string; type?: string; value: string; onChange: (value: string) => void; autoComplete?: string }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100" /></label>;
}

export function LoginForm() {
  const router = useRouter(); const search = useSearchParams(); const { refresh } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setError(""); setBusy(true);
    try {
      const identifier = email.trim();
      const credentials = identifier.includes("@") ? { email: identifier } : { username: identifier };
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...credentials, password }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.error?.code === "email_not_verified") { router.push(`/cek-email?email=${encodeURIComponent(email.trim())}`); return; }
        setError(data.error?.message || data.message || "Email atau password salah."); return;
      }
      sessionStorage.setItem("justLoggedIn", "true");
      const user = await refresh();
      if (user?.role === "OWNER") {
        if (!user.tenantSlug) { setError("Akun belum terhubung ke toko. Hubungi administrator."); return; }
        const base = process.env.NEXT_PUBLIC_MERCHANT_APP_URL || (window.location.hostname === "localhost" ? window.location.origin : "https://app.kafiloo.com");
        window.location.assign(`${base.replace(/\/$/, "")}/${encodeURIComponent(user.tenantSlug)}/dashboard`);
      } else if (user?.role === "SUPER_ADMIN" || user?.role === "MANAGER") router.push("/cms/dashboard");
      else router.push("/cashier");
    } catch { setError("Tidak dapat terhubung ke server. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
    <p className="text-sm font-bold uppercase tracking-widest text-amber-800">Kafiloo</p><h1 className="mt-3 text-3xl font-black text-slate-900">Masuk ke akun</h1><p className="mt-2 text-slate-500">Kelola toko dan pesanan Anda.</p>
    {search.get("registered") && <p className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800">Pendaftaran berhasil. Verifikasi email untuk melanjutkan.</p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
      <Field label="Email atau username" id="email" value={email} onChange={setEmail} autoComplete="username" />
      <Field label="Password" id="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <button disabled={busy || !email.trim() || !password} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Memproses…" : "Masuk"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-600">Belum punya akun? <Link className="font-bold text-amber-800" href="/daftar">Daftar</Link></p>
  </section>;
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [businessName, setBusinessName] = useState(""); const [slug, setSlug] = useState(""); const [slugAvailable, setSlugAvailable] = useState(false); const [showPassword, setShowPassword] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  function validate() {
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Masukkan alamat email yang valid.";
    if (password.length < 8 || password.length > 128) next.password = "Password harus terdiri dari 8–128 karakter.";
    if (businessName.trim().length < 2 || businessName.trim().length > 120) next.business_name = "Nama bisnis harus terdiri dari 2–120 karakter.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 30) next.slug = "Gunakan 3–30 karakter: huruf kecil, angka, dan tanda hubung.";
    else if (!slugAvailable) next.slug = "Pastikan alamat toko tersedia sebelum mendaftar.";
    setErrors(next); return Object.keys(next).length === 0;
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy || !validate()) return; setBusy(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password, business_name: businessName.trim(), slug }) });
      const data = await response.json();
      if (!response.ok) { setErrors({ form: data.error?.message || "Pendaftaran gagal. Periksa kembali data Anda." }); return; }
      router.push(`/cek-email?email=${encodeURIComponent(email.trim())}`);
    } catch { setErrors({ form: "Tidak dapat terhubung ke server. Coba lagi." }); }
    finally { setBusy(false); }
  }
  return <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60">
    <p className="text-sm font-bold uppercase tracking-widest text-amber-800">Kafiloo</p><h1 className="mt-3 text-3xl font-black text-slate-900">Buat akun toko</h1><p className="mt-2 text-slate-500">Mulai kelola bisnis Anda dalam beberapa langkah.</p>
    {errors.form && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors.form}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <div><Field label="Nama bisnis" id="business_name" value={businessName} onChange={setBusinessName} autoComplete="organization" />{errors.business_name && <p className="mt-1 text-xs text-red-600">{errors.business_name}</p>}</div>
      <div><SlugInput businessName={businessName} value={slug} onChange={setSlug} onStatusChange={setSlugAvailable} />{errors.slug && <p className="text-xs text-red-600">{errors.slug}</p>}</div>
      <div><Field label="Email" id="email" type="email" value={email} onChange={setEmail} autoComplete="email" />{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}</div>
      <div><label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label><div className="mt-1 flex rounded-xl border border-slate-300 focus-within:border-amber-700"><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="min-w-0 flex-1 rounded-l-xl px-4 py-3 font-normal outline-none" /><button type="button" onClick={() => setShowPassword((show) => !show)} className="px-4 text-sm font-bold text-amber-800">{showPassword ? "Sembunyikan" : "Lihat"}</button></div>{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}</div>
      <button disabled={busy} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Mendaftarkan…" : "Daftar toko"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-600">Sudah punya akun? <Link className="font-bold text-amber-800" href="/masuk">Masuk</Link></p>
  </section>;
}
