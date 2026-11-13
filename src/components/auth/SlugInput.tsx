"use client";

import { useEffect, useState } from "react";
import { normalizeBusinessName } from "@/lib/tenant-slug";

type Props = { businessName: string; value: string; onChange: (value: string) => void; onStatusChange?: (available: boolean) => void };
export function SlugInput({ businessName, value, onChange, onStatusChange }: Props) {
  const [manual, setManual] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [suggestion, setSuggestion] = useState("");
  useEffect(() => { onStatusChange?.(status === "available"); }, [status, onStatusChange]);

  useEffect(() => {
    if (!manual) onChange(normalizeBusinessName(businessName));
  }, [businessName, manual, onChange]);

  useEffect(() => {
    setSuggestion("");
    if (!value) { setStatus("idle"); return; }
    setStatus("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/check-slug?slug=${encodeURIComponent(value)}`, { signal: controller.signal });
        const payload = await response.json();
        setStatus(payload.available ? "available" : payload.suggestion ? "taken" : "invalid");
        setSuggestion(payload.suggestion || "");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("invalid");
      }
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [value]);

  const statusText = { idle: "Masukkan nama bisnis", checking: "Memeriksa ketersediaan…", available: "Alamat toko tersedia", taken: "Alamat sudah digunakan", invalid: "Format slug tidak valid" }[status];
  return <div>
    <label htmlFor="slug" className="mb-1 block text-sm font-semibold text-slate-700">Alamat toko</label>
    <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-amber-700">
      <span className="whitespace-nowrap pl-3 text-sm text-slate-500">app.kafiloo.com/</span>
      <input id="slug" value={value} onChange={(event) => { setManual(true); onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }} className="min-w-0 flex-1 rounded-r-xl px-2 py-3 outline-none" autoComplete="off" required />
    </div>
    <div className={`mt-1 min-h-5 text-xs ${status === "available" ? "text-green-700" : status === "taken" || status === "invalid" ? "text-red-600" : "text-slate-500"}`} aria-live="polite">
      {statusText}{status === "taken" && suggestion && <button type="button" onClick={() => { setManual(true); onChange(suggestion); }} className="ml-2 font-bold underline">Gunakan {suggestion}</button>}
    </div>
  </div>;
}
