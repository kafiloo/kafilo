// =============================================================
// API: POST /api/v1/payment/create
// Buat transaksi pembayaran via Komerce Payment API
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/komerce-payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      payment_type,
      channel_code,
      amount,
      customer,
      items,
      expiry_duration,
      callback_url,
      callback_API_KEY,
    } = body as {
      order_id?: string;
      payment_type?: "bank_transfer" | "qris";
      channel_code?: string;
      amount?: number;
      customer?: { name: string; email: string; phone: string };
      items?: Array<{ name: string; quantity: number; price: number }>;
      expiry_duration?: number;
      callback_url?: string;
      callback_API_KEY?: string;
    };

    if (!order_id || typeof order_id !== "string") {
      return NextResponse.json(
        { message: "order_id wajib diisi" },
        { status: 400 }
      );
    }

    if (!payment_type || !["bank_transfer", "qris"].includes(payment_type)) {
      return NextResponse.json(
        { message: "payment_type harus 'bank_transfer' atau 'qris'" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 10000) {
      return NextResponse.json(
        { message: "amount minimal Rp 10.000" },
        { status: 400 }
      );
    }

    if (!customer || !customer.name || !customer.email || !customer.phone) {
      return NextResponse.json(
        { message: "customer (name, email, phone) wajib diisi" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "items wajib diisi dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (payment_type === "bank_transfer" && !channel_code) {
      return NextResponse.json(
        { message: "channel_code wajib diisi untuk pembayaran bank_transfer" },
        { status: 400 }
      );
    }

    if (callback_url && !callback_API_KEY) {
      return NextResponse.json(
        { message: "callback_API_KEY wajib diisi jika callback_url diisi" },
        { status: 400 }
      );
    }

    const result = await createPayment({
      order_id,
      payment_type,
      channel_code,
      amount,
      customer,
      items,
      expiry_duration,
      callback_url,
      callback_API_KEY,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/v1/payment/create]", error);
    return NextResponse.json(
      { message: error?.message || "Gagal membuat transaksi pembayaran" },
      { status: 500 }
    );
  }
}