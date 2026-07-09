import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const itemsSnapshot = [
      {
        productId: "dummy-id",
        name: "Test",
        price: 10000,
        quantity: 1,
        variants: null,
        subTotal: 10000,
      }
    ];

    const pwaOrder = await prisma.pwaOrder.create({
      data: {
        tableId: "12",
        customerId: "invalid-id-that-does-not-exist-12345",
        totalAmount: 10000,
        status: "PENDING_CONFIRMATION",
        items: itemsSnapshot,
      },
    });
    console.log("Success:", pwaOrder);
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
