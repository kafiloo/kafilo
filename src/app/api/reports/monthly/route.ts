// =============================================================
// API Reports Monthly — /api/reports/monthly/route.ts
// Agregasi data Order per bulan untuk Calendar & Report page
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month"); // format: YYYY-MM, untuk daily detail

    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    if (monthParam) {
      // Mode: Daily breakdown untuk bulan tertentu
      const [y, m] = monthParam.split("-").map(Number);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);

      const orders = await prisma.order.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by day
      const dailyMap: Record<string, { date: string; count: number; revenue: number }> = {};
      orders.forEach((order) => {
        const day = order.createdAt.toISOString().slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { date: day, count: 0, revenue: 0 };
        dailyMap[day].count += 1;
        dailyMap[day].revenue += order.totalAmount;
      });

      return NextResponse.json({
        mode: "daily",
        month: monthParam,
        totalOrders: orders.length,
        totalRevenue: orders.reduce((s, o) => s + o.totalAmount, 0),
        data: Object.values(dailyMap),
      });
    }

    // Mode: Monthly summary untuk satu tahun
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Group by month (0-11)
    const monthlyMap: Record<number, { month: number; count: number; revenue: number }> = {};
    for (let i = 0; i < 12; i++) monthlyMap[i] = { month: i + 1, count: 0, revenue: 0 };

    orders.forEach((order) => {
      const m = order.createdAt.getMonth();
      monthlyMap[m].count += 1;
      monthlyMap[m].revenue += order.totalAmount;
    });

    const yearlyTotal = orders.reduce((s, o) => s + o.totalAmount, 0);
    const avgTicket = orders.length > 0 ? Math.floor(yearlyTotal / orders.length) : 0;

    return NextResponse.json({
      mode: "monthly",
      year,
      totalOrders: orders.length,
      totalRevenue: yearlyTotal,
      avgTicket,
      data: Object.values(monthlyMap),
    });
  } catch (error) {
    console.error("[GET /api/reports/monthly]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
