// =============================================================
// Prisma Seed — Seeding Categories, Products, Users, & Orders
// =============================================================

import { PrismaClient, Role, PaymentMethod, OrderStatus, UnitOfMeasure } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database...");
  await prisma.recipeItem.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.pwaOrder.deleteMany({});
  await prisma.storeSetting.deleteMany({});

  console.log("🌱 Seeding Users...");
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superadmin = await prisma.user.create({
    data: { name: "Owner", username: "superadmin", password: hashedPassword, role: Role.SUPER_ADMIN },
  });
  const cashierA = await prisma.user.create({
    data: { name: "Budi Santoso", username: "budi", password: hashedPassword, role: Role.CASHIER },
  });
  const cashierB = await prisma.user.create({
    data: { name: "Siti Rahma", username: "siti", password: hashedPassword, role: Role.CASHIER },
  });

  console.log("🌱 Seeding Store Setting...");
  await prisma.storeSetting.create({
    data: {
      id: "kofilo-store-1",
      storeName: "Craft Coffee",
      loyaltyEnabled: true,
      rewardPerAmount: 10000,
      pointsEarned: 1,
      pointsExpiryDays: 365,
      taxRate: 10,
      serviceCharge: 10,
      acceptCash: true,
      acceptQris: true,
      acceptTransfer: true,
    },
  });

  console.log("🌱 Seeding Customers...");
  const cust1 = await prisma.customer.create({
    data: { phone: "6281234567890", name: "Alex Morgan", points: 50 },
  });
  const cust2 = await prisma.customer.create({
    data: { phone: "6289876543210", name: "Budi Santoso", points: 120 },
  });

  console.log("🌱 Seeding Categories...");
  const catCoffee = await prisma.category.create({ data: { name: "Coffee" } });
  const catNonCoffee = await prisma.category.create({ data: { name: "Non-Coffee" } });
  const catPastry = await prisma.category.create({ data: { name: "Pastry" } });
  const catDessert = await prisma.category.create({ data: { name: "Dessert" } });
  const catAddon = await prisma.category.create({ data: { name: "Add-on" } });

  console.log("🌱 Seeding Products...");
  const productsData = [
    { name: "Artisan Latte", price: 27000, sku: "COF-001", isAvailable: true, categoryId: catCoffee.id },
    { name: "Malty Latte", price: 30000, sku: "COF-002", isAvailable: true, categoryId: catCoffee.id },
    { name: "Iced Caramel Macchiato", price: 32000, sku: "COF-003", isAvailable: true, categoryId: catCoffee.id },
    { name: "Cold Brew", price: 25000, sku: "COF-004", isAvailable: false, categoryId: catCoffee.id },
    { name: "Americano", price: 20000, sku: "COF-005", isAvailable: true, categoryId: catCoffee.id },
    { name: "Matcha Frappe", price: 35000, sku: "NCF-001", isAvailable: true, categoryId: catNonCoffee.id },
    { name: "Earl Grey Tea", price: 22000, sku: "NCF-002", isAvailable: true, categoryId: catNonCoffee.id },
    { name: "Almond Milk Substitute", price: 10000, sku: "ADD-001", isAvailable: true, categoryId: catAddon.id },
    { name: "Butter Croissant", price: 20000, sku: "PAS-001", isAvailable: true, categoryId: catPastry.id },
    { name: "Vegan Brownie", price: 24000, sku: "PAS-002", isAvailable: true, categoryId: catPastry.id },
    { name: "Cascara Fizz", price: 28000, sku: "SPC-001", isAvailable: true, categoryId: catNonCoffee.id },
    { name: "Matcha Cookies", price: 15000, sku: "DES-001", isAvailable: true, categoryId: catDessert.id },
  ];

  const products: any[] = [];
  for (const p of productsData) {
    const created = await prisma.product.create({ data: p });
    products.push(created);
  }

  console.log("🌱 Seeding Inventory Items...");
  const inventoryItems = [
    { name: "Susu UHT Full Cream", category: "Susu", unit: "MILLILITER", currentStock: 15000, minThreshold: 5000 },
    { name: "Biji Kopi Arabika", category: "Kopi", unit: "GRAM", currentStock: 8000, minThreshold: 2000 },
    { name: "Biji Kopi Robusta", category: "Kopi", unit: "GRAM", currentStock: 3000, minThreshold: 1000 },
    { name: "Gula Pasir", category: "Bahan Kering", unit: "GRAM", currentStock: 20000, minThreshold: 5000 },
    { name: "Sirup Karamel", category: "Sirup", unit: "MILLILITER", currentStock: 2000, minThreshold: 500 },
    { name: "Matcha Bubuk", category: "Bubuk", unit: "GRAM", currentStock: 500, minThreshold: 200 },
    { name: "Tepung Terigu", category: "Bahan Kering", unit: "GRAM", currentStock: 10000, minThreshold: 3000 },
    { name: "Mentega", category: "Bahan Kering", unit: "GRAM", currentStock: 3000, minThreshold: 1000 },
    { name: "Coklat Bubuk", category: "Bubuk", unit: "GRAM", currentStock: 1500, minThreshold: 500 },
    { name: "Susu Almond", category: "Susu", unit: "MILLILITER", currentStock: 5000, minThreshold: 2000 },
    { name: "Es Batu", category: "Bahan Dingin", unit: "BAG", currentStock: 10, minThreshold: 3 },
    { name: "Cup 16oz", category: "Kemasan", unit: "PIECE", currentStock: 200, minThreshold: 50 },
    { name: "Cup 22oz", category: "Kemasan", unit: "PIECE", currentStock: 50, minThreshold: 50 },
    { name: "Tissue", category: "Perlengkapan", unit: "PACK", currentStock: 5, minThreshold: 2 },
    { name: "Sedotan", category: "Perlengkapan", unit: "PIECE", currentStock: 500, minThreshold: 100 },
  ];

  for (let i = 0; i < inventoryItems.length; i++) {
    const inv = inventoryItems[i];
    await prisma.inventoryItem.create({
      data: {
        name: inv.name,
        category: inv.category,
        unit: inv.unit as UnitOfMeasure,
        currentStock: inv.currentStock,
        minThreshold: inv.minThreshold,
        sku: `INV-${String(i + 1).padStart(4, "0")}`,
      },
    });
  }

  console.log(`✅ ${inventoryItems.length} inventory items seeded`);

  console.log("🌱 Seeding Mock Sales/Orders...");
  const totalOrdersToCreate = 150;
  const targetRevenue = 4500000;
  const basePricePerOrder = Math.floor(targetRevenue / totalOrdersToCreate);

  const ordersData: any[] = [];
  for (let i = 1; i <= totalOrdersToCreate; i++) {
    const cashier = i % 2 === 0 ? cashierA : cashierB;
    const paymentMethod = i % 3 === 0 ? PaymentMethod.QRIS : i % 3 === 1 ? PaymentMethod.TRANSFER : PaymentMethod.CASH;
    const finalPrice = i === totalOrdersToCreate ? targetRevenue - (basePricePerOrder * (totalOrdersToCreate - 1)) : basePricePerOrder;

    ordersData.push({
      totalAmount: finalPrice,
      paymentMethod,
      status: OrderStatus.COMPLETED,
      cashierId: cashier.id,
      createdAt: new Date(Date.now() - (totalOrdersToCreate - i) * 10 * 60 * 1000),
    });
  }

  for (let idx = 0; idx < ordersData.length; idx++) {
    const oData = ordersData[idx];
    await prisma.order.create({
      data: {
        totalAmount: oData.totalAmount,
        paymentMethod: oData.paymentMethod,
        status: oData.status,
        cashierId: oData.cashierId,
        createdAt: oData.createdAt,
        orderItems: {
          create: {
            productId: products[idx % products.length].id,
            quantity: 1,
            subTotal: oData.totalAmount,
          }
        }
      }
    });
  }

  console.log("✅ Super Admin: superadmin / admin123");
  console.log("✅ Cashier: budi / admin123, siti / admin123");
  console.log("✅ Customers seeded with points:", cust1.phone, "->", cust1.points, "pts |", cust2.phone, "->", cust2.points, "pts");
  console.log("✅ StoreSetting seeded (loyalty: Rp 10.000 = 1 poin)");
  console.log(`✅ Categories: ${products.length} products, ${totalOrdersToCreate} orders`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });