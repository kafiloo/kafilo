// =============================================================
// components/customer/PakasirMethodPicker.tsx — pilih metode
// Pakasir v2 + estimasi biaya. Metode di luar batas nominal
// otomatis nonaktif.
// =============================================================

"use client";

import { useMemo } from "react";
import type { CheckoutMethod } from "@/stores/checkout-store";

export const METHOD_META: Array<{
  id: CheckoutMethod;
  label: string;
  hint: string;
  min: number;
  max: number;
}> = [
  { id: "payment_link", label: "Payment Link", hint: "Semua e-wallet & bank", min: 500, max: 50_000_000 },
  { id: "qris", label: "QRIS", hint: "Scan QR semua e-wallet", min: 500, max: 10_000_000 },
  { id: "bri_va", label: "BRI VA", hint: "Virtual Account BRI", min: 10_000, max: 50_000_000 },
  { id: "bni_va", label: "BNI VA", hint: "Virtual Account BNI", min: 10_000, max: 50_000_000 },
  { id: "cimb_niaga_va", label: "CIMB Niaga VA", hint: "Virtual Account CIMB", min: 10_000, max: 50_000_000 },
  { id: "permata_va", label: "Permata VA", hint: "Virtual Account Permata", min: 10_000, max: 50_000_000 },
  { id: "maybank_va", label: "Maybank VA", hint: "Virtual Account Maybank", min: 10_000, max: 50_000_000 },
  { id: "bnc_va", label: "BNC VA", hint: "Virtual Account BNC", min: 10_000, max: 50_000_000 },
  { id: "artha_graha_va", label: "Artha Graha VA", hint: "Virtual Account AG", min: 10_000, max: 50_000_000 },
  { id: "sampoerna_va", label: "Sampoerna VA", hint: "Virtual Account Sampoerna", min: 10_000, max: 50_000_000 },
];

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface Props {
  amount: number;
  method: CheckoutMethod | null;
  fees: Record<string, number>;
  feesLoading: boolean;
  onSelect: (m: CheckoutMethod) => void;
}

export default function PakasirMethodPicker({ amount, method, fees, feesLoading, onSelect }: Props) {
  const rows = useMemo(
    () =>
      METHOD_META.map((m) => {
        const allowed = amount >= m.min && amount <= m.max;
        const fee = fees[m.id];
        return { ...m, allowed, fee };
      }),
    [amount, fees]
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Metode Pembayaran Online
        </h3>
        {feesLoading && (
          <span className="text-[11px] font-medium text-gray-400">Memuat biaya…</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {rows.map((row) => {
          const active = method === row.id;
          return (
            <button
              key={row.id}
              type="button"
              disabled={!row.allowed}
              onClick={() => onSelect(row.id)}
              className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                !row.allowed
                  ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                  : active
                    ? "border-[#7a5c43] bg-[#7a5c43]/5 text-[#7a5c43]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>
                <span className="block text-sm font-bold">{row.label}</span>
                <span className="block text-[11px] font-medium opacity-70">
                  {row.hint}
                  {!row.allowed &&
                    ` · butuh ${formatRp(row.min)}–${formatRp(row.max)}`}
                </span>
              </span>
              <span className="text-right text-[11px] font-bold">
                {typeof row.fee === "number" ? (
                  <>
                    <span className="block opacity-60">Biaya</span>
                    <span className="block text-sm">{formatRp(row.fee)}</span>
                  </>
                ) : (
                  <span className="opacity-50">—</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Total bayar = {formatRp(amount)} + biaya layanan metode terpilih.
      </p>
    </div>
  );
}
