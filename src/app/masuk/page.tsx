import { Suspense } from "react";
import { LoginForm } from "@/components/auth/MerchantAuthForms";

export default function MasukPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12"><Suspense fallback={<div className="text-slate-500">Memuat…</div>}><LoginForm /></Suspense></main>;
}
