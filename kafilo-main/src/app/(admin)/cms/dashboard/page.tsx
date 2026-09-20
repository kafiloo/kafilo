import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardDatePicker from "./DashboardDatePicker";

export const dynamic = 'force-dynamic';

function getDateRange(dateStr?: string) {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const startDate = new Date(targetDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(targetDate);
  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate, targetDate };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await getSession();
  const role = session?.role as string | undefined;
  if (!role || (role !== "SUPER_ADMIN" && role !== "MANAGER")) redirect("/login");

  // TypeScript guard: after redirect, session is guaranteed non-null
  const safeSession = session!;

  const resolvedParams = await searchParams;
  const { startDate, endDate, targetDate } = getDateRange(resolvedParams.date);

  const [completedOrders, completedPwaOrders, allCompletedOrders, allCompletedPwaOrders, allProducts, totalCustomers, customerPointsAgg] = await Promise.all([
    prisma.order.findMany({ where: { status: "COMPLETED", createdAt: { gte: startDate, lte: endDate } }, include: { orderItems: { include: { product: { include: { category: true } } } } } }),
    prisma.pwaOrder.findMany({ where: { status: "READY_FOR_PICKUP", createdAt: { gte: startDate, lte: endDate } } }),
    prisma.order.findMany({ where: { status: "COMPLETED" }, include: { orderItems: { include: { product: { include: { category: true } } } } } }),
    prisma.pwaOrder.findMany({ where: { status: "READY_FOR_PICKUP" } }),
    prisma.product.findMany({ include: { category: true } }),
    prisma.customer.count(),
    prisma.customer.aggregate({ _sum: { points: true } }),
  ]);

  const totalSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0) + completedPwaOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCompletedOrders = completedOrders.length + completedPwaOrders.length;
  let totalItemsSold = 0;
  completedOrders.forEach(o => o.orderItems.forEach(i => totalItemsSold += i.quantity));
  completedPwaOrders.forEach(o => (o.items as any[]).forEach(i => totalItemsSold += i.quantity));

  const itemSalesMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  allProducts.forEach(p => {
    itemSalesMap[p.id] = { name: p.name, category: p.category?.name || "Lainnya", qty: 0, revenue: 0 };
  });

  allCompletedOrders.forEach(o => o.orderItems.forEach(i => {
    if (i.productId && itemSalesMap[i.productId]) {
      itemSalesMap[i.productId].qty += i.quantity;
      itemSalesMap[i.productId].revenue += i.subTotal;
    }
  }));

  allCompletedPwaOrders.forEach(o => (o.items as any[]).forEach(i => {
    if (itemSalesMap[i.productId]) {
      itemSalesMap[i.productId].qty += i.quantity;
      itemSalesMap[i.productId].revenue += (i.price * i.quantity);
    }
  }));

  const allSalesArray = Object.values(itemSalesMap);
  const topSellers = [...allSalesArray].filter(i => i.qty > 0).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const bottomMovers = [...allSalesArray].sort((a, b) => a.qty - b.qty).slice(0, 5).map(item => ({ ...item, status: item.qty === 0 ? "Zero Sales" : "Low Demand" }));

  const totalActivePoints = customerPointsAgg._sum.points ?? 0;

  const isToday = new Date().toDateString() === targetDate.toDateString();
  const displayDateStr = targetDate.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  const isoDateStr = targetDate.toISOString().split('T')[0];

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">
            Welcome back, {safeSession.name.split(" ")[0]}
          </h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">
            Here's what's happening at your stores on this selected date.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DashboardDatePicker initialDate={isoDateStr} displayDate={displayDateStr} />
          <button className="w-12 h-[46px] bg-white border border-gray-200/80 rounded-2xl flex items-center justify-center text-gray-500 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            <span className="absolute top-2.5 right-3 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-100 p-7 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-[#6C4E31]/20 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Gross Revenue</h3>
          </div>
          <div>
            <h2 className="text-[36px] font-black text-[#1a1f36] tracking-tight leading-none mb-2 group-hover:text-[#6C4E31] transition-colors">
              Rp {totalSales.toLocaleString("id-ID")}
            </h2>
            <p className="text-[13px] font-medium text-gray-400">Total revenue generated {isToday ? "today" : `on ${displayDateStr}`}</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-tl from-[#6C4E31]/5 to-transparent rounded-full blur-2xl"></div>
        </div>

        <div className="bg-white border border-gray-100 p-7 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] hover:border-gray-200 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Completed Orders</h3>
          </div>
          <div>
            <h2 className="text-[36px] font-black text-[#1a1f36] tracking-tight leading-none mb-2">{totalCompletedOrders}</h2>
            <p className="text-[13px] font-medium text-gray-400">Total orders processed</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-7 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] hover:border-gray-200 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Total Items Sold</h3>
          </div>
          <div>
            <h2 className="text-[36px] font-black text-[#1a1f36] tracking-tight leading-none mb-2">{totalItemsSold}</h2>
            <p className="text-[13px] font-medium text-gray-400">Cups / items prepared {isToday ? "today" : "on selected date"}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Performance</h3>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-12">
        <div className="bg-white border border-gray-100 rounded-[24px] p-7 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <h3 className="text-[17px] font-black text-[#1a1f36] mb-6">Top 5 Best Sellers</h3>
          {topSellers.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <span className="text-3xl grayscale opacity-40">☕</span>
              <p className="text-gray-400 font-medium text-[14px]">Belum ada penjualan tercatat di tanggal ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 w-12 text-center">No</th>
                    <th className="pb-3">Menu Name</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {topSellers.map((item, index) => (
                    <tr key={item.name} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 text-center">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs shadow-sm">👑</span>
                        ) : (
                          <span className="text-[13px] font-bold text-gray-400">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="font-bold text-[14px] text-[#1a1f36] group-hover:text-[#6C4E31] transition-colors">{item.name}</div>
                        <div className="text-[12px] font-medium text-gray-400 mt-0.5">{item.category}</div>
                      </td>
                      <td className="py-4 text-right font-black text-[14px] text-[#1a1f36]">{item.qty}</td>
                      <td className="py-4 text-right font-black text-[14px] text-[#6C4E31]">
                        Rp {item.revenue.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-[24px] p-7 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
          <h3 className="text-[17px] font-black text-[#1a1f36] mb-6">Bottom 5 Slow Movers</h3>
          {bottomMovers.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <span className="text-3xl grayscale opacity-40">📭</span>
              <p className="text-gray-400 font-medium text-[14px]">Belum ada produk untuk ditampilkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 w-12 text-center">No</th>
                    <th className="pb-3">Menu Name</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {bottomMovers.map((item, index) => (
                    <tr key={item.name} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 text-center text-[13px] font-bold text-gray-400">{index + 1}</td>
                      <td className="py-4">
                        <div className="font-bold text-[14px] text-[#1a1f36]">{item.name}</div>
                        <div className="text-[12px] font-medium text-gray-400 mt-0.5">{item.category}</div>
                      </td>
                      <td className="py-4 text-right font-black text-[14px] text-[#1a1f36]">{item.qty}</td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wide border ${
                          item.qty === 0 ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 'bg-amber-50 text-amber-600 border-amber-100/50'
                        }`}>
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                          </svg>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Loyalty Hub Monitor</h3>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 p-7 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex items-end justify-between hover:border-[#6C4E31]/20 transition-all duration-300 group">
          <div>
            <span className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#6C4E31]"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
              New Members
            </span>
            <h2 className="text-[36px] font-black text-[#1a1f36] tracking-tight leading-none mb-2">{totalCustomers}</h2>
            <p className="text-[13px] font-medium text-gray-400">Total registered members all time</p>
          </div>
          <div className="w-32 h-16 relative">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <path d="M0,35 C15,35 25,15 45,20 C60,23 75,5 100,2" fill="none" className="stroke-[#6C4E31]/40 group-hover:stroke-[#6C4E31] transition-colors duration-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 6px rgba(108,78,49,0.3))' }} />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-7 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex items-center justify-between hover:border-[#6C4E31]/20 transition-all duration-300">
          <div>
            <span className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
              Points Balance
            </span>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-[36px] font-black text-[#1a1f36] tracking-tight leading-none">{totalActivePoints.toLocaleString('id-ID')}</h2>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100/50">Active</span>
            </div>
            <p className="text-[13px] font-medium text-gray-400">Equivalent to {Math.floor(totalActivePoints / 100)} Free Cups</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-3xl shadow-inner">☕</div>
        </div>
      </div>
    </div>
  );
}