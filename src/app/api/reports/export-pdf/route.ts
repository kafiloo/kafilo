import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface ReportRow {
  period: string;
  count: number;
  revenue: number;
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createReportPdf({
  storeName,
  address,
  periodLabel,
  totalOrders,
  totalRevenue,
  rows,
}: {
  storeName: string;
  address: string | null;
  periodLabel: string;
  totalOrders: number;
  totalRevenue: number;
  rows: ReportRow[];
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: { Title: `Laporan Penjualan - ${periodLabel}`, Author: storeName },
    });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const pageWidth = document.page.width - document.page.margins.left - document.page.margins.right;
    const periodColumnWidth = pageWidth * 0.5;
    const countColumnWidth = pageWidth * 0.2;
    const revenueColumnWidth = pageWidth - periodColumnWidth - countColumnWidth;

    document
      .fillColor("#6C4E31")
      .font("Helvetica-Bold")
      .fontSize(21)
      .text(storeName);
    if (address) {
      document.fillColor("#6B7280").font("Helvetica").fontSize(9).text(address);
    }
    document
      .moveDown(0.8)
      .fillColor("#1A1F36")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("LAPORAN PENJUALAN");
    document
      .moveDown(0.35)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#4B5563")
      .text(`Periode: ${periodLabel}`)
      .text(`Tanggal cetak: ${new Date().toLocaleDateString("id-ID")}`);

    document.moveDown(0.8);
    const summaryY = document.y;
    document
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1A1F36")
      .text(`Total order: ${totalOrders.toLocaleString("id-ID")}`, document.page.margins.left, summaryY)
      .text(`Total pendapatan: ${formatRupiah(totalRevenue)}`, document.page.margins.left, summaryY + 15)
      .text(
        `Rata-rata order: ${formatRupiah(totalOrders ? Math.floor(totalRevenue / totalOrders) : 0)}`,
        document.page.margins.left,
        summaryY + 30,
      );
    document.y = summaryY + 45;
    document.moveDown(0.5);

    const drawTableHeader = () => {
      const y = document.y;
      document.save();
      document.rect(document.page.margins.left, y, pageWidth, 25).fill("#F3F4F6");
      document
        .fillColor("#374151")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Periode", document.page.margins.left + 8, y + 8, { width: periodColumnWidth - 8 })
        .text("Jumlah order", document.page.margins.left + periodColumnWidth, y + 8, {
          width: countColumnWidth - 8,
          align: "right",
        })
        .text("Pendapatan", document.page.margins.left + periodColumnWidth + countColumnWidth, y + 8, {
          width: revenueColumnWidth - 8,
          align: "right",
        });
      document.restore();
      document.y = y + 25;
    };

    drawTableHeader();
    rows.forEach((row) => {
      if (document.y + 26 > document.page.height - document.page.margins.bottom) {
        document.addPage();
        drawTableHeader();
      }

      const y = document.y;
      document
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#1A1F36")
        .text(row.period, document.page.margins.left + 8, y + 8, { width: periodColumnWidth - 8 })
        .text(row.count.toLocaleString("id-ID"), document.page.margins.left + periodColumnWidth, y + 8, {
          width: countColumnWidth - 8,
          align: "right",
        })
        .text(formatRupiah(row.revenue), document.page.margins.left + periodColumnWidth + countColumnWidth, y + 8, {
          width: revenueColumnWidth - 8,
          align: "right",
        });
      document
        .moveTo(document.page.margins.left, y + 26)
        .lineTo(document.page.margins.left + pageWidth, y + 26)
        .lineWidth(0.5)
        .strokeColor("#E5E7EB")
        .stroke();
      document.y = y + 26;
    });

    document.end();
  });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const requestedPeriod = new URL(req.url).searchParams.get("month") ?? String(new Date().getFullYear());
  const periodMatch = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/.exec(requestedPeriod);
  if (!periodMatch) {
    return NextResponse.json({ message: "Periode harus menggunakan format YYYY atau YYYY-MM." }, { status: 400 });
  }

  try {
    const year = Number(periodMatch[1]);
    const month = periodMatch[2] ? Number(periodMatch[2]) : null;
    const startDate = new Date(0);
    startDate.setFullYear(year, month ? month - 1 : 0, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    if (month) endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(year + 1, 0, 1);

    const [orders, settings] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate, lt: endDate },
        },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.storeSetting.findFirst({ select: { storeName: true, address: true } }),
    ]);

    const reportMap = new Map<string, ReportRow>();
    orders.forEach((order) => {
      const date = formatLocalDate(order.createdAt);
      const key = month ? date : date.slice(0, 7);
      const existing = reportMap.get(key) ?? {
        period: month
          ? new Date(order.createdAt.getFullYear(), order.createdAt.getMonth(), order.createdAt.getDate())
              .toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
          : `${MONTH_NAMES[order.createdAt.getMonth()]} ${order.createdAt.getFullYear()}`,
        count: 0,
        revenue: 0,
      };
      existing.count += 1;
      existing.revenue += order.totalAmount;
      reportMap.set(key, existing);
    });

    const rows = month
      ? Array.from(reportMap.values())
      : MONTH_NAMES.map((name, index) => {
          const row = reportMap.get(`${year}-${String(index + 1).padStart(2, "0")}`);
          return row ?? { period: `${name} ${year}`, count: 0, revenue: 0 };
        });
    const totalRevenue = orders.reduce((total, order) => total + order.totalAmount, 0);
    const periodLabel = month ? `${MONTH_NAMES[month - 1]} ${year}` : String(year);
    const pdf = await createReportPdf({
      storeName: settings?.storeName || "Kofilo",
      address: settings?.address || null,
      periodLabel,
      totalOrders: orders.length,
      totalRevenue,
      rows,
    });
    const filename = `laporan-penjualan-${requestedPeriod}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/export-pdf]", error);
    return NextResponse.json({ message: "Gagal membuat PDF laporan." }, { status: 500 });
  }
}
