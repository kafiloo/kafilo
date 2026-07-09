// =============================================================
// Prisma Seed — Seeding Categories, Products, Users, & Orders
// =============================================================

import { PrismaClient, Role, PaymentMethod, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database...");
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
    data: { name: "Alex Morgan", username: "superadmin", password: hashedPassword, role: Role.SUPER_ADMIN },
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