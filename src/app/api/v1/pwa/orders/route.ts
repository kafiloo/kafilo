// =============================================================
// API: POST /api/v1/pwa/orders
// Submit pesanan dari PWA ke backend
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearerToken, verifyPwaToken } from "@/lib/pwa-jwt";

export async function POST(req: NextRequest) {
  try {
    // --- Autentikasi ---
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ message: "Unauthorized: Token tidak ditemukan" }, { status: 401 });

    let customerPayload;
    try {
      customerPayload = await verifyPwaToken(token);
    } catch {
      return NextResponse.json({ message: "Unauthorized: Token tidak valid atau expired" }, { status: 401 });
    }

    // --- Validasi Body ---
    const body = await req.json();
    const { tableId, items, paymentMethod } = body as {
      tableId?: string;
      paymentMethod?: string;
      items?: Array<{
        productId: string;
        id?: string;
        name: string;
        price: number;
        quantity: number;
        variants?: string;
        isReward?: boolean;
      }>;
    };

    if (!tableId || typeof tableId !== "string") return NextResponse.json({ message: "tableId wajib diisi" }, { status: 400 });
    if (!items || !Array.isArray(items) || items.length === 0) return NextResponse.json({ message: "Keranjang kosong" }, { status: 400 });

    // 🔒 Validasi ketat tiap item
    for (const item of items) {
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json({ message: `Quantity untuk ${item.name || "item"} tidak valid` }, { status: 400 });
      }
      if (typeof item.price !== "number" || item.price < 0) {
        return NextResponse.json({ message: `Harga untuk ${item.name || "item"} tidak valid` }, { status: 400 });
      }
    }

    const normalIds: string[] = [];
    const rewardIds: string[] = [];

    // Memilah ID
    items.forEach((item) => {
      const rawId = item.productId || item.id || "";
      const realId = rawId.split('-')[0];
      
      if (item.isReward === true || rawId.includes('-reward') || (item.price === 0 && item.name.includes('Reward'))) {
        rewardIds.push(realId);
      } else {
        normalIds.push(realId);
      }
    });

    const uniqueNormalIds = [...new Set(normalIds)];
    const uniqueRewardIds = [...new Set(rewardIds)];

    let productPriceMap = new Map<string, number>();
    
    // A. Cek produk biasa
    if (uniqueNormalIds.length > 0) {
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: uniqueNormalIds }, isAvailable: true },
        select: { id: true, price: true, name: true },
      });

      if (dbProducts.length !== uniqueNormalIds.length) {
        return NextResponse.json({ message: "Beberapa menu berbayar tidak tersedia" }, { status: 400 });
      }
      dbProducts.forEach(p => productPriceMap.set(p.id, p.price));
    }

    // B. Cek produk reward
    if (uniqueRewardIds.length > 0) {
      const dbRewards = await prisma.rewardProduct.findMany({
        where: { id: { in: uniqueRewardIds } },
        select: { id: true, name: true },
      });

      if (dbRewards.length !== uniqueRewardIds.length) {
        return NextResponse.json({ message: "Beberapa menu penukaran (reward) tidak ditemukan" }, { status: 400 });
      }
      dbRewards.forEach(r => productPriceMap.set(r.id, 0)); 
    }

    // 🔥 AMBIL SETTING DARI SUPERADMIN (DATABASE) 🔥
    const storeSetting = await prisma.storeSetting.findUnique({
      where: { id: "kofilo-store-1" },
    });

    let subTotalAmount = 0; 
    
    const itemsSnapshot = items.map((item) => {
      const rawId = item.productId || item.id || "";
      const realId = rawId.split('-')[0];
      const isRewardItem = item.isReward === true || rawId.includes('-reward') || (item.price === 0 && item.name.includes('Reward'));
      
      const dbPrice = productPriceMap.get(realId) ?? 0;
      
      // Mengambil harga dari frontend (yang wajar)
      const basePrice = isRewardItem ? 0 : (item.price >= dbPrice ? item.price : dbPrice);
      const subTotal = basePrice * item.quantity;
      
      subTotalAmount += subTotal;

      return {
        productId: realId, 
        name: item.name + (isRewardItem && !item.name.includes('Reward') ? " (Reward)" : ""), 
        price: basePrice, // Menyimpan harga asli murni (misal 32.000)
        quantity: item.quantity,
        variants: item.variants ?? null,
        subTotal: subTotal,
        isReward: isRewardItem
      };
    });

    // 🔥 HITUNG PAJAK & TOTAL MUTLAK DARI SISI SERVER (SUPERADMIN) 🔥
    const taxRate = storeSetting?.taxRate ?? 0;
    const serviceCharge = storeSetting?.serviceCharge ?? 0;
    
    const taxAmount = Math.round(subTotalAmount * (taxRate / 100));
    const serviceAmount = Math.round(subTotalAmount * (serviceCharge / 100));
    
    // Total Akhir = Subtotal + Pajak + Layanan
    const finalTotalAmount = subTotalAmount + taxAmount + serviceAmount;

    // --- Loyalty: Hitung & tambah poin ---
    try {
      const loyaltyEnabled = storeSetting?.loyaltyEnabled ?? true;
      const rewardPerAmount = Math.max(storeSetting?.rewardPerAmount ?? 10000, 1);
      const pointsEarnedSetting = storeSetting?.pointsEarned ?? 1;

      if (loyaltyEnabled && customerPayload.phone) {
        // Hitung poin dari total belanja akhir
        const earnedPoints = Math.floor(finalTotalAmount / rewardPerAmount) * pointsEarnedSetting;
        
        let cleanPhone = customerPayload.phone.replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
        else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;

        if (cleanPhone.length >= 10 && cleanPhone.length <= 14) {
          const now = new Date();
          const registrationBonus = storeSetting?.registrationPoints ?? 0;
          
          await prisma.customer.upsert({
            where: { phone: cleanPhone },
            update: { points: { increment: earnedPoints }, updatedAt: now },
            create: {
              phone: cleanPhone,
              name: customerPayload.name || "-",
              points: earnedPoints + registrationBonus,
              createdAt: now,
              updatedAt: now,
            }
          });
        }
      }
    } catch (loyaltyErr) {
      console.warn("[loyalty] Gagal update poin:", loyaltyErr);
    }

    // 🔒 Validasi customerId sebelum create
    if (!customerPayload.sub) {
      return NextResponse.json({ message: "Customer tidak valid" }, { status: 400 });
    }

    // --- Buat PwaOrder ---
    const pwaOrder = await prisma.pwaOrder.create({
      data: {
        tableId,
        customerId: customerPayload.sub,
        totalAmount: finalTotalAmount, // Menggunakan total hitungan Server
        status: "PENDING_CONFIRMATION",
        paymentMethod: paymentMethod === "QRIS" || paymentMethod === "CASH" || paymentMethod === "TRANSFER" ? paymentMethod : "CASH",
        items: itemsSnapshot, 
      },
    });

    return NextResponse.json(
      {
        message: "Pesanan berhasil dibuat",
        orderId: pwaOrder.id,
        status: pwaOrder.status,
        totalAmount: pwaOrder.totalAmount, 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/v1/pwa/orders] FATAL:", error);
    return NextResponse.json({ message: "Internal server error", error: error?.message || String(error) }, { status: 500 });
  }
}