"use client";

// =============================================================
// Loyalty Hub — Rewards (Menu Penukaran Poin) Page
// /cms/loyalty/rewards/page.tsx
// =============================================================

import { useState, useEffect, useCallback } from "react";

interface RewardProduct {
  id: string;
  name: string;
  code: string;
  pointCost: number;
  qtyExchange: number;
  createdAt: string;
  updatedAt: string;
}

export default function LoyaltyRewardsPage() {
  const [rewards, setRewards] = useState<RewardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", pointCost: "", qtyExchange: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // 🔥 STATE UNTUK MODAL HAPUS KUSTOM 🔥
  const [rewardToDelete, setRewardToDelete] = useState<RewardProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/rewards?search=${encodeURIComponent(debouncedSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  // CRUD Handlers
  const openAddModal = () => {
    setFormData({ name: "", code: "", pointCost: "", qtyExchange: "" });
    setEditId(null); setFormError(""); setIsModalOpen(true);
  };

  const openEditModal = (r: RewardProduct) => {
    setFormData({ name: r.name, code: r.code, pointCost: r.pointCost.toString(), qtyExchange: r.qtyExchange.toString() });
    setEditId(r.id); setFormError(""); setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pointCost) {
      setFormError("Nama dan point cost wajib diisi."); return;
    }
    setSubmitting(true); setFormError("");
    // Code auto-generate di backend — tidak dikirim manual
    const payload = { name: formData.name, pointCost: Number(formData.pointCost), qtyExchange: Number(formData.qtyExchange || 0) };
    try {
      let res: Response;
      if (editId) {
        res = await fetch(`/api/loyalty/rewards?id=${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        res = await fetch("/api/loyalty/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || "Terjadi kesalahan"); return; }
      setIsModalOpen(false);
      showToast("success", editId ? "Reward berhasil diperbarui!" : "Reward berhasil ditambahkan!");
      fetchRewards();
    } catch { setFormError("Terjadi kesalahan jaringan"); }
    finally { setSubmitting(false); }
  };

  // 🔥 FUNGSI EKSEKUSI HAPUS DARI MODAL 🔥
  const executeDelete = async () => {
    if (!rewardToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/loyalty/rewards?id=${rewardToDelete.id}`, { method: "DELETE" });
      if (res.ok) { 
        showToast("success", "Reward berhasil dihapus."); 
        fetchRewards(); 
      }
      else { 
        const d = await res.json(); 
        showToast("error", d.message || "Gagal menghapus"); 
      }
    } catch { 
      showToast("error", "Terjadi kesalahan jaringan"); 
    } finally {
      setIsDeleting(false);
      setRewardToDelete(null);
    }
  };

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Menu Penukaran Poin</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Kelola menu reward yang dapat ditukarkan oleh pelanggan menggunakan poin loyalty mereka.</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 absolute left-4 top-3.5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari reward berdasarkan nama atau kode..."
            className="w-full bg-white border border-gray-200 text-[#1a1f36] font-semibold rounded-[16px] pl-12 pr-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-400 shadow-sm" />
        </div>
        <button onClick={openAddModal}
          className="bg-[#1a1f36] hover:bg-[#2a314d] text-white px-6 py-3.5 rounded-[16px] text-[14px] font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(74,59,50,0.25)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Tambah Reward
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <svg className="animate-spin h-8 w-8 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="font-bold text-sm">Loading rewards...</span>
          </div>
        ) : rewards.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl">🎁</div>
            <p className="text-sm font-semibold">Belum ada menu penukaran poin.</p>
            <button onClick={openAddModal} className="mt-2 px-5 py-2.5 bg-[#1a1f36] text-white text-[13px] font-bold rounded-xl hover:bg-[#2a314d] transition-colors">Tambah Sekarang</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
              <thead>
                <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/30">
                  <th className="py-5 pl-8 pr-4">Nama Menu</th>
                  <th className="py-5 px-4 w-36">Code Menu</th>
                  <th className="py-5 px-4 w-36">Harga (Poin)</th>
                  <th className="py-5 px-4 w-36 text-center">Qty Penukaran</th>
                  <th className="py-5 px-8 text-right w-32">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {rewards.map((r) => (
                  <tr key={r.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="py-4 pl-8 pr-4 align-middle">
                      <span className="font-extrabold text-[14.5px] text-[#1a1f36] group-hover:text-[#6C4E31] transition-colors">{r.name}</span>
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-600 font-black text-[12px] tracking-wider font-mono">{r.code}</span>
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[12px]">⭐</div>
                        <span className="font-black text-[14.5px] text-[#1a1f36]">{r.pointCost.toLocaleString("id-ID")} pts</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-middle text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-[12px] px-3 py-1.5 rounded-xl min-w-[50px]">{r.qtyExchange}x</span>
                    </td>
                    <td className="py-4 px-8 align-middle text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => openEditModal(r)} className="p-2.5 rounded-xl text-gray-400 hover:text-[#6C4E31] hover:bg-[#6C4E31]/10 transition-all duration-200" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        {/* 🔥 UBAHAN: Tombol Hapus memanggil state Pop-up, bukan confirm() bawaan 🔥 */}
                        <button onClick={() => setRewardToDelete(r)} className="p-2.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200" title="Hapus">
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
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1f36]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in-[0.96] duration-300 ease-out">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#1a1f36] tracking-tight">{editId ? "Edit Reward" : "Tambah Reward Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {formError && (
              <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-[13px] font-semibold text-rose-600">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Nama Menu <span className="text-rose-400">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Artisan Latte Gratis"
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Code Menu <span className="text-gray-300 lowercase font-medium tracking-normal">(Otomatis)</span></label>
                  <div className="w-full bg-gray-100 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                    <span className="text-gray-500">{formData.code || <span className="text-gray-300 italic">Auto-generated</span>}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Harga (Poin) <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <input type="number" value={formData.pointCost} onChange={(e) => setFormData({ ...formData, pointCost: e.target.value })} placeholder="500"
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 pr-10 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" min="1" required />
                    <span className="absolute right-4 top-3.5 text-[13px] font-bold text-gray-400">pts</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Qty Penukaran <span className="text-gray-300 lowercase font-medium tracking-normal">(opsional)</span></label>
                <input type="number" value={formData.qtyExchange} onChange={(e) => setFormData({ ...formData, qtyExchange: e.target.value })} placeholder="0"
                  className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" min="0" />
              </div>
              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 rounded-2xl text-[14px] font-extrabold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98]">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-[2] bg-[#1a1f36] text-white py-4 rounded-2xl font-extrabold text-[14px] shadow-[0_8px_20px_-6px_rgba(26,31,54,0.3)] hover:bg-[#2a314d] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:translate-y-0">
                  {submitting ? "Menyimpan..." : "Simpan Reward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 MODAL KONFIRMASI HAPUS KHUSUS REWARD 🔥 */}
      {rewardToDelete && (
        <div className="fixed inset-0 z-[120] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-[#1a1f36] mb-2">Hapus Reward?</h3>
            <p className="text-gray-500 text-[13px] font-medium mb-6">
              Yakin hapus <strong className="text-gray-800">{rewardToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setRewardToDelete(null)}
                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-[20px] p-4 pr-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border flex items-center gap-4 min-w-[300px] bg-white ${toast.type === "success" ? "border-emerald-100" : "border-rose-100"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>
              {toast.type === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <p className="text-[14px] font-bold text-[#1a1f36] flex-1">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}