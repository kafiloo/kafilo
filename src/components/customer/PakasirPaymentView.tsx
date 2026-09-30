// =============================================================
// components/customer/PakasirPaymentView.tsx — QRIS / VA /
// payment_link + countdown + polling (>= 4 dtk, internal API).
// =============================================================

"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useCheckoutStore } from "@/stores/checkout-store";

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function useCountdown(expiredAt: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiredAt) return;
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, [expiredAt]);
  return useMemo(() => {
    if (!expiredAt) return null;
    const diff = new Date(expiredAt).getTime() - now;
    if (diff <= 0) return "Berakhir";
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [expiredAt, now]);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function PakasirPaymentView({ onPaid }: { onPaid?: () => void }) {
  const { payment, status, error, refreshStatus, cancelPayment } = useCheckoutStore();
  const countdown = useCountdown(payment?.expiredAt ?? null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!payment) return;
    if (status === "completed" || status === "canceled") return;
    const t = setInterval(() => {
      void refreshStatus();
    }, 5_000);
    return () => clearInterval(t);
  }, [payment, status, refreshStatus]);

  useEffect(() => {
    if (status === "completed") onPaid?.();
  }, [status, onPaid]);

  if (!payment) return null;
  const isFinal = status === "completed" || status === "canceled";
  const total = payment.totalPayment || payment.amount;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
      {status === "completed" ? (
        <div className="py-4">
          <div className="text-5xl">✅</div>
          <h2 className="mt-3 text-lg font-extrabold text-green-700">Pembayaran Berhasil</h2>
          <p className="mt-1 text-sm text-gray-500">{formatRp(total)} · {payment.method}</p>
        </div>
      ) : status === "canceled" ? (
        <div className="py-4">
          <div className="text-5xl">❌</div>
          <h2 className="mt-3 text-lg font-extrabold text-red-600">Pembayaran Dibatalkan</h2>
          <p className="mt-1 text-sm text-gray-500">Silakan buat pembayaran baru.</p>
        </div>
      ) : payment.method === "payment_link" && payment.paymentLink ? (
        <div className="py-2">
          <h2 className="text-lg font-extrabold">Selesaikan Pembayaran</h2>
          <p className="mt-1 text-sm text-gray-500">Total: <strong>{formatRp(total)}</strong></p>
          <a
            href={payment.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-xl bg-[#7a5c43] py-4 text-center text-[15px] font-bold text-white hover:bg-[#634832]"
          >
            Buka Halaman Pembayaran
          </a>
          <p className="mt-2 text-[11px] text-gray-400">Status terupdate otomatis.</p>
          <button
            type="button"
            onClick={() => void cancelPayment()}
            className="mt-3 w-full rounded-xl bg-gray-200 py-3 text-sm font-bold text-gray-700"
          >
            Batalkan Pembayaran
          </button>
        </div>
      ) : payment.qrString ? (
        <div>
          <h2 className="text-lg font-extrabold tracking-wide">Scan QRIS untuk Bayar</h2>
          <p className="mt-1 text-xs text-gray-500">
            Total: <strong>{formatRp(total)}</strong>
            {payment.fee > 0 && <span> (termasuk biaya {formatRp(payment.fee)})</span>}
          </p>
          <div className="mt-4 inline-block rounded-xl border-2 border-dashed border-gray-200 bg-white p-4">
            <QRCodeSVG value={payment.qrString} size={200} />
          </div>
          {countdown && <p className="mt-3 text-sm font-bold text-amber-600">Berlaku hingga {countdown}</p>}
          <p className="mt-1 animate-pulse text-[11px] text-gray-400">Menunggu pembayaran…</p>
          {!isFinal && (
            <button
              type="button"
              onClick={() => void cancelPayment()}
              className="mt-4 w-full rounded-xl bg-gray-200 py-3 text-sm font-bold text-gray-700"
            >
              Batalkan Pembayaran
            </button>
          )}
        </div>
      ) : payment.vaNumber ? (
        <div>
          <h2 className="text-lg font-extrabold tracking-wide">Transfer ke Virtual Account</h2>
          <p className="mt-1 text-xs text-gray-500">
            Total: <strong>{formatRp(total)}</strong>
            {payment.fee > 0 && <span> (termasuk biaya {formatRp(payment.fee)})</span>}
          </p>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText(payment.vaNumber ?? "");
              setCopied(ok);
              setTimeout(() => setCopied(false), 2_000);
            }}
            className="mt-4 w-full rounded-xl bg-gray-900 py-4 font-mono text-xl font-bold tracking-widest text-white"
          >
            {payment.vaNumber}
          </button>
          <p className="mt-2 text-[11px] text-gray-400">
            {copied ? "Nomor tersalin ✓" : "Ketuk nomor untuk menyalin"}
          </p>
          {countdown && <p className="mt-2 text-sm font-bold text-amber-600">Berlaku hingga {countdown}</p>}
          <button
            type="button"
            onClick={() => void cancelPayment()}
            className="mt-4 w-full rounded-xl bg-gray-200 py-3 text-sm font-bold text-gray-700"
          >
            Batalkan Pembayaran
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Menyiapkan pembayaran…</p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

