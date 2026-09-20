"use client";

// =============================================================
// Stock Management Page — (admin)/cms/inventory/page.tsx
// CRUD Inventory + Restock + Search + Status Indicators
// =============================================================

import { useState, useEffect, useRef } from "react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  createdAt: string;
  updatedAt: string;
}

const UNIT_LABELS: Record<string, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "L",
  PIECE: "pcs",
  PACK: "pack",
  BOX: "box",
  BOTTLE: "btl",
  CUP: "cup",
  BAG: "bag",
};

const UNIT_OPTIONS = [
  { value: "GRAM", label: "Gram (g)" },
  { value: "KILOGRAM", label: "Kilogram (kg)" },
  { value: "MILLILITER", label: "Milliliter (ml)" },
  { value: "LITER", label: "Liter (L)" },
  { value: "PIECE", label: "Piece (pcs)" },
  { value: "PACK", label: "Pack" },
  { value: "BOX", label: "Box" },
  { value: "BOTTLE", label: "Botol" },
  { value: "CUP", label: "Cup" },
  { value: "BAG", label: "Bag" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Toast
  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  // Kebab menu state
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const kebabRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "Umum", unit: "PIECE", currentStock: 0, minThreshold: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockError, setRestockError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch data ──
  const fetchItems = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(`/api/inventory${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (error) {
      console.error("Gagal load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(debouncedSearch);
  }, [debouncedSearch]);

  // ── Close kebab on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setOpenKebabId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Open Add Modal ──
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: "", category: "Umum", unit: "PIECE", currentStock: 0, minThreshold: 0 });
    setFormError("");
    setShowFormModal(true);
    setOpenKebabId(null);
  };

  // ── Open Edit Modal ──
  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minThreshold: item.minThreshold,
    });
    setFormError("");
    setShowFormModal(true);
    setOpenKebabId(null);
  };

  // ── Submit Add/Edit ──
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Nama barang wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const url = editingItem ? `/api/inventory?id=${editingItem.id}` : "/api/inventory";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal menyimpan data");

      setShowFormModal(false);
      showToast("success", editingItem ? "Item berhasil diperbarui!" : "Item baru berhasil ditambahkan!");
      fetchItems(debouncedSearch);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Open Restock Modal ──
  const openRestockModal = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty(0);
    setRestockError("");
    setShowRestockModal(true);
    setOpenKebabId(null);
  };

  // ── Submit Restock ──
  const handleRestock = async () => {
    if (!restockItem || restockQty <= 0) {
      setRestockError("Jumlah barang masuk harus lebih dari 0");
      return;
    }

    setIsRestocking(true);
    setRestockError("");

    try {
      const res = await fetch(`/api/inventory?id=${restockItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: restockQty }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal melakukan restock");

      setShowRestockModal(false);
      showToast("success", `Stok ${restockItem.name} berhasil ditambahkan!`);
      fetchItems(debouncedSearch);
    } catch (err: any) {
      setRestockError(err.message);
    } finally {
      setIsRestocking(false);
    }
  };

  // ── Open Delete Modal ──
  const openDeleteModal = (item: InventoryItem) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
    setOpenKebabId(null);
  };

  // ── Confirm Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/inventory?id=${deleteItem.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal menghapus item");

      setShowDeleteModal(false);
      showToast("success", `"${deleteItem.name}" berhasil dihapus.`);
      fetchItems(debouncedSearch);
    } catch (err: any) {
      setShowDeleteModal(false);
      showToast("error", err.message);
    } finally {
      setIsDeleting(false);
      setDeleteItem(null);
    }
  };

  // ── Get stock status ──
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minThreshold) {
      return { label: "Low Stock", class: "bg-rose-50 text-rose-600 border-rose-200" };
    }
    return { label: "In Stock", class: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full font-sans text-[#1a1f36]">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Stock Management</h1>
          <p className="text-gray-500 text-sm font-medium">Pantau dan kelola ketersediaan bahan baku inventaris.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#6C4E31] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#583f27] active:scale-95 transition-all flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add New Stock
        </button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama barang atau SKU..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-[#6C4E31]">
            <div className="w-8 h-8 border-4 border-[#6C4E31] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold animate-pulse">Memuat Inventaris...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold text-lg mb-1">
              {debouncedSearch ? "Tidak ada hasil" : "Belum ada item inventaris"}
            </p>
            <p className="text-sm">
              {debouncedSearch ? "Coba kata kunci lain." : "Klik tombol \"Add New Stock\" untuk memulai."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[13px] uppercase tracking-wider">
                <th className="px-6 py-4 font-extrabold">Item Name</th>
                <th className="px-6 py-4 font-extrabold">SKU</th>
                <th className="px-6 py-4 font-extrabold">Kategori</th>
                <th className="px-6 py-4 font-extrabold">Current Stock</th>
                <th className="px-6 py-4 font-extrabold">Status</th>
                <th className="px-6 py-4 font-extrabold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const status = getStockStatus(item);
                const unitLabel = UNIT_LABELS[item.unit] || item.unit;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[15px]">{item.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 font-bold text-[11px] tracking-wider font-mono">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[15px]">
                        {item.currentStock.toLocaleString("id-ID")}{" "}
                        <span className="text-gray-400 font-medium text-sm">{unitLabel}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black border ${status.class}`}>
                        {status.label === "Low Stock" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      {/* Kebab Menu Button */}
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenKebabId(openKebabId === item.id ? null : item.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-[#1a1f36] hover:bg-gray-100 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openKebabId === item.id && (
                          <div ref={kebabRef} className="absolute right-0 mt-1 z-50 w-44 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] py-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => openRestockModal(item)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Restock
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                              Edit Item
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL ADD/EDIT ── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black">{editingItem ? "Edit Item" : "Add New Stock"}</h2>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-700 bg-white shadow-sm p-1.5 rounded-full border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {formError}
                </div>
              )}

              {/* Item Name */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cth: Susu UHT, Kopi Arabika..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all"
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Cth: Susu, Kopi, Bahan Kering..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all"
                />
              </div>

              {/* Base Unit Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Base Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all bg-white"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Current Stock */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Current Stock <span className="text-gray-400 font-medium">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all"
                />
              </div>

              {/* Minimum Stock Threshold */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minThreshold}
                  onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#6C4E31] focus:ring-4 focus:ring-[#6C4E31]/10 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Jika stok mencapai atau di bawah batas ini, status akan berubah menjadi Low Stock.</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#6C4E31] text-white font-bold rounded-xl shadow-md hover:bg-[#583f27] active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RESTOCK ── */}
      {showRestockModal && restockItem && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black">Restock</h2>
              <button onClick={() => setShowRestockModal(false)} className="text-gray-400 hover:text-gray-700 bg-white shadow-sm p-1.5 rounded-full border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {restockError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {restockError}
                </div>
              )}

              {/* Info barang */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">Item</span>
                  <span className="font-bold text-[#1a1f36]">{restockItem.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">SKU</span>
                  <span className="font-mono text-sm font-bold">{restockItem.sku}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Current Stock</span>
                  <span className="font-black text-lg text-[#1a1f36]">
                    {restockItem.currentStock.toLocaleString("id-ID")}{" "}
                    <span className="text-sm font-medium text-gray-400">{UNIT_LABELS[restockItem.unit] || restockItem.unit}</span>
                  </span>
                </div>
              </div>

              {/* Input jumlah */}
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Barang Masuk</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty || ""}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  placeholder="Masukkan jumlah..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  autoFocus
                />
              </div>

              {/* Preview */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-700">Total Stok Baru</span>
                  <span className="font-black text-xl text-emerald-700">
                    {(restockItem.currentStock + (restockQty > 0 ? restockQty : 0)).toLocaleString("id-ID")}{" "}
                    <span className="text-sm font-medium">{UNIT_LABELS[restockItem.unit] || restockItem.unit}</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-500 font-medium mt-1">
                  {restockItem.currentStock.toLocaleString("id-ID")} + {restockQty > 0 ? restockQty : 0} = {(restockItem.currentStock + (restockQty > 0 ? restockQty : 0)).toLocaleString("id-ID")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleRestock}
                  disabled={isRestocking || restockQty <= 0}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isRestocking ? "Menyimpan..." : "Konfirmasi Restock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DELETE ── */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 z-50 bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Hapus Item?</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">
              Anda yakin ingin menghapus <span className="text-gray-800 font-bold">"{deleteItem.name}"</span>? Aksi ini tidak dapat dibatalkan.
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
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
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