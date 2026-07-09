// =============================================================
// Calendar & Monthly Report — /cms/calendar/page.tsx
// Superadmin: Agregasi laporan per bulan + export PDF placeholder
// =============================================================

"use client";

import { useState, useEffect, useCallback } from "react";

interface MonthlyData {
  month: number;
  count: number;
  revenue: number;
}

interface DailyData {
  date: string;
  count: number;
  revenue: number;
}

interface MonthlyReport {
  mode: "monthly";
  year: number;
  totalOrders: number;
  totalRevenue: number;
  avgTicket: number;
  data: MonthlyData[];
}

interface DailyReport {
  mode: "daily";
  month: string;
  totalOrders: number;
  totalRevenue: number;
  data: DailyData[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?year=${year}`);
      if (res.ok) { const data = await res.json(); setMonthlyReport(data); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [year]);

  const fetchDaily = useCallback(async (monthStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${monthStr}`);
      if (res.ok) { const data = await res.json(); setDailyReport(data); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMonthly(); setSelectedMonth(null); setDailyReport(null); }, [fetchMonthly]);

  const handleMonthClick = (monthIndex: number) => {
    const monthStr = `${year}-${String(monthIndex).padStart(2, "0")}`;
    setSelectedMonth(monthIndex);
    fetchDaily(monthStr);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const monthStr = selectedMonth ? `${year}-${String(selectedMonth).padStart(2, "0")}` : `${year}`;
      const res = await fetch(`/api/reports/export-pdf?month=${monthStr}`);
      const data = await res.json();
      alert(`Export PDF: ${data.message}\n\nFitur ini sedang dalam pengembangan dan akan segera tersedia.`);
    } catch { alert("Gagal menghubungi server export."); }
    finally { setExporting(false); }
  };

  const maxRevenue = monthlyReport ? Math.max(...monthlyReport.data.map(d => d.revenue), 1) : 1;
  const todayStr = today.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Calendar & Report</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Analisis performa penjualan per bulan dan ekspor laporan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white px-5 py-2.5 border border-gray-200/80 rounded-2xl text-[13px] font-bold text-gray-600 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
            Today, {todayStr}
          </div>
          <button onClick={handleExportPdf} disabled={exporting}
            className="flex items-center gap-2 bg-[#6C4E31] hover:bg-[#583f27] text-white px-5 py-2.5 rounded-2xl text-[13px] font-bold shadow-[0_4px_14px_rgba(108,78,49,0.25)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:translate-y-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setYear(y => y - 1)} className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <span className="text-[24px] font-black text-[#1a1f36] tracking-tight w-20 text-center">{year}</span>
        <button onClick={() => setYear(y => y + 1)} disabled={year >= today.getFullYear()}
          className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
        {selectedMonth && (
          <button onClick={() => { setSelectedMonth(null); setDailyReport(null); }}
            className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold rounded-xl transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Kembali ke Tahunan
          </button>
        )}
      </div>

      {!selectedMonth && monthlyReport && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
            <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Total Revenue {year}</p>
            <h2 className="text-[30px] font-black text-[#1a1f36] tracking-tight">Rp {monthlyReport.totalRevenue.toLocaleString("id-ID")}</h2>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
            <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Total Orders {year}</p>
            <h2 className="text-[30px] font-black text-[#1a1f36] tracking-tight">{monthlyReport.totalOrders.toLocaleString("id-ID")}</h2>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
            <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Avg. Ticket Size</p>
            <h2 className="text-[30px] font-black text-[#1a1f36] tracking-tight">Rp {monthlyReport.avgTicket.toLocaleString("id-ID")}</h2>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-[24px] p-20 flex flex-col items-center justify-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="font-bold text-sm text-gray-400">Memuat data laporan...</span>
        </div>
      ) : !selectedMonth ? (
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] p-8">
          <h3 className="text-[17px] font-black text-[#1a1f36] mb-6">Klik bulan untuk melihat detail harian</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(monthlyReport?.data || []).map((d) => {
              const isCurrentMonth = year === today.getFullYear() && d.month === today.getMonth() + 1;
              const barHeight = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 8 : 0) : 0;
              return (
                <button key={d.month} onClick={() => handleMonthClick(d.month)}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group ${isCurrentMonth ? "border-[#6C4E31] bg-[#6C4E31]/5" : "border-gray-100 hover:border-[#6C4E31]/30 bg-white"}`}>
                  <p className={`text-[13px] font-extrabold uppercase tracking-wider mb-3 ${isCurrentMonth ? "text-[#6C4E31]" : "text-gray-400"}`}>{MONTH_NAMES[d.month - 1]}</p>
                  <div className="flex items-end gap-0.5 h-8 mb-3">
                    <div className="w-full bg-gray-100 rounded-sm overflow-hidden h-full flex items-end">
                      <div className="w-full bg-[#6C4E31]/20 group-hover:bg-[#6C4E31]/40 transition-colors rounded-sm" style={{ height: `${barHeight}%` }} />
                    </div>
                  </div>
                  <p className="font-black text-[15px] text-[#1a1f36]">Rp {(d.revenue / 1000).toFixed(0)}k</p>
                  <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{d.count} orders</p>
                  {isCurrentMonth && <span className="absolute top-3 right-3 w-2 h-2 bg-[#6C4E31] rounded-full animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-[17px] font-black text-[#1a1f36]">Detail Harian — {MONTH_FULL[selectedMonth - 1]} {year}</h3>
              {dailyReport && <p className="text-[13px] text-gray-400 font-medium mt-0.5">{dailyReport.totalOrders} orders · Rp {dailyReport.totalRevenue.toLocaleString("id-ID")}</p>}
            </div>
          </div>
          {!dailyReport || dailyReport.data.length === 0 ? (
            <div className="p-16 text-center text-gray-400 font-medium">Tidak ada transaksi di bulan {MONTH_FULL[selectedMonth - 1]} {year}.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50/30">
                    <th className="py-4 pl-8 pr-4">Tanggal</th>
                    <th className="py-4 px-4 text-center">Jumlah Order</th>
                    <th className="py-4 px-8 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dailyReport.data.map((d) => (
                    <tr key={d.date} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pl-8 pr-4 font-bold text-[14px] text-[#1a1f36]">
                        {new Date(d.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-700 font-black text-[12px] px-3 py-1.5 rounded-xl min-w-[50px]">{d.count}</span>
                      </td>
                      <td className="py-3.5 px-8 text-right font-black text-[14px] text-[#6C4E31]">Rp {d.revenue.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}