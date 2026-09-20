// =============================================================
// API: POST /api/v1/pwa/payment/create
// Wrapper untuk customer PWA — memanggil Komerce Payment API
// dari backend (server-side), tanpa perlu JWT kasir/admin.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/komerce-payment";
import { extractBearerToken, verifyPwaToken } from "@/lib/pwa-jwt";

export async function POST(req: NextRequest) {
  try {
    // Autentikasi customer PWA
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ message: "Unauthorized: Token tidak ditemukan" }, { status: 401 });
    }

    let customerPayload;
    try {
      customerPayload = await verifyPwaToken(token);
    } catch {
      return NextResponse.json({ message: "Unauthorized: Token tidak valid atau sudah expired" }, { status: 401 });
    }

    const body = await req.json();
    const { payment_type, amount, items } = body as {
      payment_type?: "bank_transfer" | "qris";
      amount?: number;
      items?: Array<{ name: string; quantity: number; price: number }>;
    };

    if (!payment_type || !["bank_transfer", "qris"].includes(payment_type)) {
      return NextResponse.json({ message: "payment_type harus 'bank_transfer' atau 'qris'" }, { status: 400 });
    }

    if (typeof amount !== "number" || amount < 10000) {
      return NextResponse.json({ message: "amount minimal Rp 10.000" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "items wajib diisi dan tidak boleh kosong" }, { status: 400 });
    }

    // Untuk QRIS, Komerce tidak butuh channel_code
    const requestBody: any = {
      order_id: `PWA-${Date.now()}`,
      payment_type,
      amount,
      customer: {
        name: customerPayload.name || "Customer",
        email: `${customerPayload.phone}@guest.local`,
        phone: customerPayload.phone,
      },
      items,
    };

    // Jika bank_transfer, minta channel_code dari body
    if (payment_type === "bank_transfer") {
      const { channel_code } = body as { channel_code?: string };
      if (!channel_code) {
        return NextResponse.json({ message: "channel_code wajib diisi untuk VA" }, { status: 400 });
      }
      requestBody.channel_code = channel_code;
      requestBody.expiry_duration = 3600;
    }

    const result = await createPayment(requestBody);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/v1/pwa/payment/create]", error);
    const message = error?.message || "Gagal membuat pembayaran";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}