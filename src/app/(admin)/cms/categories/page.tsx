'use client';

// =============================================================
// Page: /cms/categories
// Halaman Superadmin untuk manajemen Kategori Menu
// =============================================================

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  isDrink: boolean;
}

export default function CMSCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Form (Tambah/Edit)
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Data Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', isDrink: false });

  // ── TAMBAHAN: State untuk Modal Hapus & Toast ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  // ── FETCH DATA ──
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (error) {
      console.error("Gagal load kategori:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ── BUKA MODAL FORM ──
  const openModal = (category?: Category) => {
    setErrorMsg('');
    if (category) {
      setEditingId(category.id);
      setFormData({ name: category.name, isDrink: category.isDrink });
    } else {
      setEditingId(null);
      setFormData({ name: '', isDrink: false });
    }
    setShowModal(true);
  };

  // ── BUKA MODAL HAPUS ──
  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  // ── SIMPAN DATA (CREATE / UPDATE) ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const url = editingId ? `/api/categories?id=${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan kategori');

      setShowModal(false);
      showToast("success", editingId ? "Kategori berhasil diperbarui!" : "Kategori berhasil ditambahkan!");
      fetchCategories(); 
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── PROSES HAPUS DATA ──
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/categories?id=${deletingCategory.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal menghapus');
      
      setShowDeleteModal(false);
      showToast("success", `Kategori "${deletingCategory.name}" berhasil dihapus.`);
      fetchCategories();
    } catch (err: any) {
      // Jika gagal (misal karena masih ada produk), tampilkan toast error
      setShowDeleteModal(false);
      showToast("error", err.message);
    } finally {
      setIsDeleting(false);
      setDeletingCategory(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full font-sans text-[#1a1f36]">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Kategori Menu</h1>
          <p className="text-gray-500 text-sm font-medium">Kelola kategori makanan dan minuman untuk PWA & Kasir.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[#6C4E31] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#583f27] active:scale-95 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Tambah Kategori
        </button>
      </div>

      {/* ── TABEL DATA ── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-[#6C4E31]">
            <div className="w-8 h-8 border-4 border-[#6C4E31] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold animate-pulse">Memuat Kategori...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="font-bold text-lg mb-1">Belum ada kategori</p>
            <p className="text-sm">Klik tombol "Tambah Kategori" untuk memulai.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[13px] uppercase tracking-wider">
                <th className="px-6 py-4 font-extrabold w-1/2">Nama Kategori</th>
                <th className="px-6 py-4 font-extrabold">Tipe</th>
                <th className="px-6 py-4 font-extrabold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[15px]">{cat.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    {cat.isDrink ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-black">
                        ☕ Minuman
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-black">
                        🍔 Makanan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModal(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                      <button 
                        onClick={() => openDeleteModal(cat)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL FORM TAMBAH/EDIT ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 bg-white shadow-sm p-1.5 rounded-full border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {errorMsg}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kategori</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Cth: Coffee, Pastry, dll..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all"
                />
              </div>

              <div className="mb-8">
                <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#6C4E31]/50 transition-colors">
                  <div>
                    <p className="font-bold text-sm">Kategori Minuman?</p>
                    <p className="text-xs text-gray-500 mt-0.5">Opsi es/gula/cup akan muncul jika ini aktif.</p>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={formData.isDrink}
                      onChange={(e) => setFormData({...formData, isDrink: e.target.checked})}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${formData.isDrink ? 'bg-[#6C4E31]' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.isDrink ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#6C4E31] text-white font-bold rounded-xl shadow-md hover:bg-[#583f27] active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL KONFIRMASI HAPUS ── */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 z-[110] bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Kategori?</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">
              Anda yakin ingin menghapus kategori <span className="text-gray-800 font-bold">"{deletingCategory.name}"</span>? Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
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