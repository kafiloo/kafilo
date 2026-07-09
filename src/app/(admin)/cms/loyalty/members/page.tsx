"use client";

// =============================================================
// Loyalty Hub — Members Page  /cms/loyalty/members/page.tsx
// Tabel list member existing dari model Customer
// =============================================================

import { useState, useEffect } from "react";

interface LoyaltyMember {
  id: string;
  memberId: string;
  name: string | null;
  phone: string;
  points: number;
  lastTransaction: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const formatPhoneDisplay = (phone: string) => {
  if (!phone) return "-";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  if (digits.startsWith("62")) {
    const local = digits.substring(2);
    if (local.length <= 3) return `+62 ${local}`;
    if (local.length <= 7) return `+62 ${local.slice(0, 3)}-${local.slice(3)}`;
    return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
  }
  return phone;
};

const DUMMY_MEMBERS: LoyaltyMember[] = [
  { id: "1", memberId: "LOY-0192", name: "Sarah Connor", phone: "+62 812-3456-7890", points: 1200, lastTransaction: "Today, 14:20" },
  { id: "2", memberId: "LOY-0193", name: "Michael Tan", phone: "+62 813-9876-5432", points: 350, lastTransaction: "Yesterday, 18:45" },
  { id: "3", memberId: "LOY-0194", name: "-", phone: "+62 811-1222-3333", points: 0, lastTransaction: "Today, 09:15" },
  { id: "4", memberId: "LOY-0195", name: "Jessica Lim", phone: "+62 819-4444-5555", points: 2450, lastTransaction: "May 28, 10:30" },
];

export default function LoyaltyMembersPage() {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All Members");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", points: 0 });
  const [pagination, setPagination] = useState<PaginationData>({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });

  // 🔥 STATE UNTUK TOAST NOTIFICATION 🔥
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  // 🔥 STATE UNTUK MODAL HAPUS MEMBER 🔥
  const [memberToDelete, setMemberToDelete] = useState<LoyaltyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchTerm); setPagination((p) => ({ ...p, currentPage: 1 })); }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchLoyaltyData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/loyalty?page=${pagination.currentPage}&search=${encodeURIComponent(debouncedSearch)}&filter=${activeFilter}`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members);
          setPagination(data.pagination);
        } else { throw new Error("API not ready"); }
      } catch {
        let filtered = DUMMY_MEMBERS.filter(m =>
          (m.name?.toLowerCase() || "").includes(debouncedSearch.toLowerCase()) ||
          m.phone.includes(debouncedSearch) ||
          m.memberId.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
        if (activeFilter === "Has Points") filtered = filtered.filter(m => m.points > 0);
        if (activeFilter === "Zero Points") filtered = filtered.filter(m => m.points === 0);
        setMembers(filtered);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: filtered.length, itemsPerPage: 10 });
      } finally { setLoading(false); }
    }
    fetchLoyaltyData();
  }, [debouncedSearch, pagination.currentPage, activeFilter]);

  // 🔥 FUNGSI EKSEKUSI HAPUS DARI MODAL 🔥
  const executeDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/loyalty?id=${memberToDelete.id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      showToast("success", "Member berhasil dihapus!");
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal menghapus member.");
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
    }
  };

  const openAddModal = () => { setFormData({ name: "", phone: "", points: 0 }); setEditId(null); setIsModalOpen(true); };
  const openEditModal = (member: LoyaltyMember) => { setFormData({ name: member.name || "", phone: member.phone, points: member.points }); setEditId(member.id); setIsModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return alert("Nomor HP wajib diisi!");
    setIsModalOpen(false);
    try {
      if (editId) {
        setMembers((prev) => prev.map((m) => m.id === editId ? { ...m, ...formData } : m));
        fetch(`/api/loyalty?id=${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      } else {
        let cleanPhone = formData.phone.replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
        else if (cleanPhone.startsWith("8")) cleanPhone = "62" + cleanPhone;
        const newMember: LoyaltyMember = { id: Math.random().toString(), memberId: `LOY-0${Math.floor(Math.random() * 900) + 100}`, name: formData.name || "-", phone: cleanPhone, points: formData.points, lastTransaction: new Date().toISOString() };
        setMembers((prev) => [newMember, ...prev]);
        fetch("/api/loyalty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMember) });
      }
    } catch (err) { console.error(err); }
  };

  const handlePageChange = (newPage: number) => { if (newPage >= 1 && newPage <= pagination.totalPages) setPagination((p) => ({ ...p, currentPage: newPage })); };

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white relative">
      
      {/* 🔥 TOAST NOTIFICATION 🔥 */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-2xl p-4 shadow-xl border flex items-center gap-3 min-w-[300px] bg-white ${toast.type === "success" ? "border-emerald-100" : "border-rose-100"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>
              {toast.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <p className="text-[14px] font-bold text-[#1a1f36]">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Member</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Monitor customer loyalty database, points distribution, and transaction histories.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white px-5 py-2.5 border border-gray-200/80 rounded-2xl text-[13px] font-bold text-gray-600 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
            Today, {todayStr}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 absolute left-4 top-3.5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search member by name, ID, or phone..."
            className="w-full bg-white border border-gray-200 text-[#1a1f36] font-semibold rounded-[16px] pl-12 pr-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-400 shadow-sm" />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <button onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-between gap-3 bg-white border border-gray-200 hover:border-[#6C4E31]/40 text-[#1a1f36] px-5 py-3.5 rounded-[16px] text-[14px] font-bold shadow-sm transition-all duration-200 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
                Filter: {activeFilter}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isFilterOpen ? "rotate-180 text-[#6C4E31]" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white border border-gray-100 rounded-[20px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-[0.96] slide-in-from-top-1">
                  {["All Members", "Has Points", "Zero Points"].map((opt) => (
                    <button key={opt} onClick={() => { setActiveFilter(opt); setIsFilterOpen(false); }}
                      className={`w-full text-left px-5 py-3 text-[13.5px] transition-colors ${activeFilter === opt ? "bg-[#6C4E31]/5 text-[#6C4E31] font-extrabold" : "text-gray-600 font-semibold hover:bg-gray-50 hover:text-[#1a1f36]"}`}>{opt}</button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={openAddModal}
            className="bg-[#1a1f36] hover:bg-[#2a314d] text-white px-6 py-3.5 rounded-[16px] text-[14px] font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(74,59,50,0.25)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex-1 lg:flex-none whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Add Member
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex flex-col">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <svg className="animate-spin h-8 w-8 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="font-bold text-sm">Loading members...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            <p className="text-sm font-medium">No members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead>
                <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/30">
                  <th className="py-5 pl-8 pr-4 w-40">Customer ID</th>
                  <th className="py-5 px-4 min-w-[180px]">Customer Name</th>
                  <th className="py-5 px-4 w-48">WhatsApp / Phone</th>
                  <th className="py-5 px-4 w-32">Points Balance</th>
                  <th className="py-5 px-4 w-48">Last Transaction</th>
                  <th className="py-5 px-8 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {members.map((m) => (
                  <tr key={m.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="py-4 pl-8 pr-4 align-middle font-semibold text-gray-500 text-[14px]">{m.memberId}</td>
                    <td className="py-4 px-4 align-middle">
                      {!m.name || m.name === "-" ? <span className="inline-block w-3 h-[2px] bg-gray-300 rounded-full"></span> : <span className="font-extrabold text-[14.5px] text-[#1a1f36] group-hover:text-[#6C4E31] transition-colors">{m.name}</span>}
                    </td>
                    <td className="py-4 px-4 align-middle font-medium text-gray-500 text-[14px] tracking-wide">{formatPhoneDisplay(m.phone)}</td>
                    <td className="py-4 px-4 align-middle font-black text-[14.5px] text-[#4A3B32]">{m.points.toLocaleString("en-US")} pts</td>
                    <td className="py-4 px-4 align-middle font-medium text-[13px] text-gray-500">
                      {m.lastTransaction && !m.lastTransaction.includes("Today") && !m.lastTransaction.includes("Yesterday") && !m.lastTransaction.includes("May") && !m.lastTransaction.includes("Just") ?
                        new Date(m.lastTransaction).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : m.lastTransaction || "-"}
                    </td>
                    <td className="py-4 px-8 align-middle text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => openEditModal(m)} className="p-2.5 rounded-xl text-gray-400 hover:text-[#6C4E31] hover:bg-[#6C4E31]/10 transition-all duration-200" title="Edit Member">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        {/* 🔥 UBAHAN: Tombol Hapus memanggil Modal Pop-up 🔥 */}
                        <button onClick={() => setMemberToDelete(m)} className="p-2.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200" title="Delete Member">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && members.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 rounded-b-[24px]">
            <span className="text-[13px] font-semibold text-gray-500">Showing <span className="text-[#1a1f36] font-bold">1</span> to <span className="text-[#1a1f36] font-bold">{members.length}</span> of <span className="text-[#1a1f36] font-bold">{pagination.totalItems}</span> entries</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}
                className="px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Prev</button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all ${pagination.currentPage === page ? "bg-[#1a1f36] text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>{page}</button>
              ))}
              <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}
                className="px-3.5 py-2 rounded-xl border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1f36]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in-[0.96] duration-300 ease-out">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#1a1f36] tracking-tight">{editId ? "Edit Member" : "Add New Member"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Customer Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe"
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Phone <span className="text-rose-400">*</span></label>
                <div className="flex items-center bg-gray-50/50 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-[#6C4E31]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#6C4E31]/10 transition-all duration-300">
                  <span className="px-4 py-3.5 bg-gray-50 border-r border-gray-200 text-[#1a1f36] font-bold text-[14px]">+62</span>
                  <input type="text" value={formData.phone.replace("+62 ", "")}
                    onChange={(e) => {
                      const rawDigits = e.target.value.replace(/\D/g, "").slice(0, 12);
                      let formatted = "";
                      if (rawDigits.length <= 3) formatted = rawDigits;
                      else if (rawDigits.length <= 7) formatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3)}`;
                      else formatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 7)}-${rawDigits.slice(7)}`;
                      setFormData({ ...formData, phone: rawDigits ? `+62 ${formatted}` : "" });
                    }}
                    placeholder="8xx-xxxx-xxxx"
                    className="w-full bg-transparent px-4 py-3.5 text-[14px] font-bold text-[#1a1f36] focus:outline-none placeholder-gray-300" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Points Balance</label>
                <div className="relative">
                  <input type="number" value={formData.points === 0 ? "" : formData.points}
                    onChange={(e) => { const val = parseInt(e.target.value, 10); setFormData({ ...formData, points: isNaN(val) ? 0 : val }); }}
                    className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 pr-12 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300"
                    min="0" placeholder="0" />
                  <span className="absolute right-4 top-3.5 text-[14px] font-bold text-gray-400">pts</span>
                </div>
              </div>
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 rounded-2xl text-[14px] font-extrabold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98]">Cancel</button>
                <button type="submit" className="flex-[2] bg-[#1a1f36] text-white py-4 rounded-2xl font-extrabold text-[14px] shadow-[0_8px_20px_-6px_rgba(26,31,54,0.3)] hover:bg-[#2a314d] hover:-translate-y-0.5 active:scale-[0.98] transition-all">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 MODAL KONFIRMASI HAPUS KHUSUS MEMBER 🔥 */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[120] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-[#1a1f36] mb-2">Hapus Member?</h3>
            <p className="text-gray-500 text-[13px] font-medium mb-6">
              Yakin hapus <strong className="text-gray-800">{memberToDelete.name && memberToDelete.name !== "-" ? memberToDelete.name : memberToDelete.phone}</strong>? Data poin akan ikut terhapus.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeDeleteMember}
                disabled={isDeleting}
                className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}