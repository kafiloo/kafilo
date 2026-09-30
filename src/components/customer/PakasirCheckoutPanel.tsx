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
import PakasirMethodPicker from "@/components/customer/PakasirMethodPicker";
import PakasirPaymentView from "@/components/customer/PakasirPaymentView";

interface Props {
  /** Estimasi total dari client; total resmi diambil server dari PwaOrder. */
  amount: number;
  /** Id PwaOrder yang sudah dibuat di server. */
  pwaOrderId: string | null;
  onPaid?: () => void;
}

export default function PakasirCheckoutPanel({ amount, pwaOrderId, onPaid }: Props) {
  const { method, setMethod, fees, feesLoading, loadFees, createPayment, status, payment } =
    useCheckoutStore();

  useEffect(() => {
    if (amount > 0) void loadFees(amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  return (
    <div className="flex flex-col gap-4">
      {!payment && (
        <>
          <PakasirMethodPicker
            amount={amount}
            method={method}
            fees={fees}
            feesLoading={feesLoading}
            onSelect={setMethod}
          />
          <button
            type="button"
            disabled={!method || !pwaOrderId || status === "creating"}
            onClick={() => {
              if (method && pwaOrderId) void createPayment({ method, pwaOrderId });
            }}
            className="w-full rounded-xl bg-[#7a5c43] py-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {status === "creating" ? "Membuat pembayaran…" : "Bayar Sekarang"}
          </button>
        </>
      )}
      {payment && <PakasirPaymentView onPaid={onPaid} />}
    </div>
  );
}
