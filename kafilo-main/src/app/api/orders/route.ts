// =============================================================
// API Orders — /api/orders/route.ts
// GET: Riwayat order | POST: Buat order baru
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const skip = (page - 1) * limit;

    const where = session.role === "CASHIER" ? { cashierId: session.id } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          cashier: { select: { name: true } },
          orderItems: {
            include: { product: { select: { name: true, price: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, paymentMethod, customerPhone } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Cart tidak boleh kosong" }, { status: 400 });
    }

    const productIds = items.map((i: any) => (i.productId || "").replace('-reward', ''));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { message: "Beberapa produk tidak tersedia atau tidak ditemukan" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    
    // Hitung Subtotal Murni
    const subTotalAmount = items.reduce((sum: number, item: any) => {
      const realId = (item.productId || "").replace('-reward', '');
      const product = productMap.get(realId);
      const isReward = item.isReward === true || (item.productId || "").includes('-reward') || item.price === 0;
      const priceToUse = isReward ? 0 : (product?.price ?? 0);
      return sum + priceToUse * item.quantity;
    }, 0);

    const now = new Date();

    const order = await prisma.$transaction(async (tx) => {
      // Ambil konfigurasi toko (Tax & Service)
      const storeSetting = await tx.storeSetting.findUnique({
        where: { id: "kofilo-store-1" },
      });

      // 🔥 HITUNG TAX & SERVICE DINAMIS 🔥
      const taxRate = storeSetting?.taxRate ?? 0;
      const serviceCharge = storeSetting?.serviceCharge ?? 0;
      const taxAmount = Math.round(subTotalAmount * (taxRate / 100));
      const serviceAmount = Math.round(subTotalAmount * (serviceCharge / 100));
      const calculatedTotal = subTotalAmount + taxAmount + serviceAmount;

      if (customerPhone && typeof customerPhone === "string") {
        let cleanPhone = customerPhone.replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
        else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;

        if (cleanPhone.length >= 10 && cleanPhone.length <= 14) {
          const loyaltyEnabled = storeSetting?.loyaltyEnabled ?? true;
          const rewardPerAmount = Math.max(storeSetting?.rewardPerAmount ?? 10000, 1);
          const pointsEarnedSetting = storeSetting?.pointsEarned ?? 1;
          
          let earnedPoints = 0;
          if (loyaltyEnabled) {
             earnedPoints = Math.floor(calculatedTotal / rewardPerAmount) * pointsEarnedSetting;
          }

          const existingCustomer = await tx.customer.findUnique({
            where: { phone: cleanPhone },
          });

          if (existingCustomer) {
            await tx.customer.update({
              where: { id: existingCustomer.id },
              data: { points: existingCustomer.points + earnedPoints, updatedAt: now },
            });
          } else {
            const registrationBonus = storeSetting?.registrationPoints ?? 0;
            await tx.customer.create({
              data: {
                phone: cleanPhone,
                name: "-",
                points: earnedPoints + registrationBonus,
                createdAt: now,
                updatedAt: now,
              },
            });
          }
        }
      }

      // 🔥 KURANGI STOCK BAHAN BAKU BERDASARKAN RECIPE 🔥
      // Ambil semua recipe items untuk produk yang dibeli (kecuali reward)
      const paidProductIds = items
        .filter((item: any) => !(item.isReward === true || (item.productId || "").includes('-reward') || item.price === 0))
        .map((item: any) => (item.productId || "").replace('-reward', ''));

      if (paidProductIds.length > 0) {
        const recipeItems = await tx.recipeItem.findMany({
          where: { productId: { in: [...new Set(paidProductIds)] } },
          include: { inventory: { select: { id: true, currentStock: true } } },
        });

        // Kelompokkan quantity product per productId
        const productQtyMap = new Map<string, number>();
        items.forEach((item: any) => {
          const realId = (item.productId || "").replace('-reward', '');
          const isReward = item.isReward === true || (item.productId || "").includes('-reward') || item.price === 0;
          if (!isReward) {
            productQtyMap.set(realId, (productQtyMap.get(realId) || 0) + item.quantity);
          }
        });

        // Hitung total pengurangan per inventory item
        const stockDeduction = new Map<string, number>();
        for (const recipe of recipeItems) {
          const qtySold = productQtyMap.get(recipe.productId) || 0;
          const totalNeeded = recipe.quantityNeeded * qtySold;
          if (totalNeeded > 0) {
            stockDeduction.set(
              recipe.inventoryId,
              (stockDeduction.get(recipe.inventoryId) || 0) + totalNeeded
            );
          }
        }

        // Eksekusi pengurangan stock
        for (const [inventoryId, deductQty] of stockDeduction) {
          await tx.inventoryItem.update({
            where: { id: inventoryId },
            data: { currentStock: { decrement: deductQty } },
          });
        }
      }

      return await tx.order.create({
        data: {
          totalAmount: calculatedTotal,
          paymentMethod: paymentMethod ?? "CASH",
          status: "COMPLETED",
          cashierId: session.id,
          createdAt: now,
          orderItems: {
            create: items.map((item: any) => {
              const realId = (item.productId || "").replace('-reward', '');
              const product = productMap.get(realId);
              const isReward = item.isReward === true || (item.productId || "").includes('-reward') || item.price === 0;
              const priceToUse = isReward ? 0 : (product?.price ?? 0);
              return {
                productId: realId,
                quantity: item.quantity,
                subTotal: priceToUse * item.quantity, // Hanya simpan Subtotal murni tanpa pajak
              };
            }),
          },
        },
        include: {
          orderItems: { include: { product: { select: { name: true } } } },
          cashier: { select: { name: true } },
        },
      });
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}