// =============================================================
// Contoh integrasi checkout Pakasir di halaman customer.
// dipakai oleh:
// - src/app/(customer)/[tableId]/checkout/page.tsx (pwaOrderId)
// - src/app/landingpage/checkout/page.tsx memakai komponen
//   terpisah (PakasirMethodPicker + PakasirPaymentView) dengan planId.
// =============================================================

"use client";

import { useEffect } from "react";
import { useCheckoutStore } from "@/stores/checkout-store";
import PakasirPaymentView from "@/components/customer/PakasirPaymentView";

interface Props {
  /** Estimasi total dari client; total resmi diambil server dari PwaOrder. */
  amount: number;
  /** Id PwaOrder yang sudah dibuat di server. */
  pwaOrderId: string | null;
  onPaid?: () => void;
}

export default function PakasirCheckoutPanel({ amount, pwaOrderId, onPaid }: Props) {
  const { createPayment, status, payment } =
    useCheckoutStore();

  useEffect(() => {
    if (!pwaOrderId || payment || status === "creating" || status === "pending") return;
    void createPayment({ method: "qris", pwaOrderId });
  }, [createPayment, payment, pwaOrderId, status]);

  return (
    <div className="flex flex-col gap-4">
      {!payment && (
        <div className="rounded-2xl border border-[#7a5c43]/20 bg-[#7a5c43]/5 p-5 text-center">
          <h2 className="text-lg font-extrabold">QRIS</h2>
          <p className="mt-1 text-sm text-gray-500">
            QRIS sedang disiapkan untuk Rp {amount.toLocaleString("id-ID")}. QR akan langsung tampil di layar ini.
          </p>
          {status === "error" && (
            <button
              type="button"
              onClick={() => void createPayment({ method: "qris", pwaOrderId: pwaOrderId ?? undefined })}
              className="mt-4 rounded-xl bg-[#7a5c43] px-5 py-3 text-sm font-bold text-white"
            >
              Coba lagi
            </button>
          )}
        </div>
      )}
      {payment && <PakasirPaymentView onPaid={onPaid} />}
    </div>
  );
}
