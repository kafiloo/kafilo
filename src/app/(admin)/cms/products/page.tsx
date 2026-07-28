"use client";

// =============================================================
// Menu Management Page — (admin)/cms/products/page.tsx
// CRUD Produk + BOM Recipe Integration + Modal CRUD Category + DND
// =============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  isDrink: boolean;
  sortOrder?: number;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
}

interface RecipeIngredient {
  inventoryId: string;
  quantityNeeded: number;
  inventory?: InventoryItem;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
  sold?: number;
  recipeItems?: RecipeIngredient[];
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

function SortableCategoryRow({ cat, openEditCatForm, setCatToDelete }: { cat: Category, openEditCatForm: any, setCatToDelete: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.9 : 1
  };

  return (
    <tr ref={setNodeRef} style={style} className={`group transition-colors ${isDragging ? 'bg-gray-50 shadow-lg relative' : 'hover:bg-gray-50/50'}`}>
      <td className="py-3.5 align-middle pl-2 w-10">
        <button {...attributes} {...listeners} className="p-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>
        </button>
      </td>
      <td className="py-3.5 align-middle">
        <span className="font-bold text-[14px] text-[#1a1f36]">{cat.name}</span>
      </td>
      <td className="py-3.5 align-middle text-center">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cat.isDrink ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
          {cat.isDrink ? "Minuman" : "Makanan"}
        </span>
      </td>
      <td className="py-3.5 align-middle text-right">
        <div className="flex justify-end items-center gap-1">
          <button onClick={() => openEditCatForm(cat)} className="p-2 rounded-xl text-gray-400 hover:text-[#6C4E31] hover:bg-[#6C4E31]/10 transition-all" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
          </button>
          <button onClick={() => setCatToDelete(cat)} className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all" title="Hapus">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ show: false, type: "success" as "success" | "error", message: "" });
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isProductDeleting, setIsProductDeleting] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ── Product Modal State ──
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [image, setImage] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // ── Recipe / Ingredients State ──
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [openIngredientDropdownId, setOpenIngredientDropdownId] = useState<number | null>(null);
  const [ingredientSearchTerms, setIngredientSearchTerms] = useState<Record<number, string>>({});

  // ── Category Modal State ──
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [catSuccess, setCatSuccess] = useState("");
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);
  const [isCatDeleting, setIsCatDeleting] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catIsDrink, setCatIsDrink] = useState(false);
  const [isAddCatFormOpen, setIsAddCatFormOpen] = useState(false);
  const [catSubmitting, setCatSubmitting] = useState(false);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });

  const showCatMessage = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') setCatSuccess(msg);
    else setCatError(msg);
    setTimeout(() => { setCatSuccess(""); setCatError(""); }, 3500);
  };

  const fetchCategories = useCallback(async () => {
    const resCat = await fetch("/api/categories");
    const dataCat = await resCat.json();
    return dataCat.categories || [];
  }, []);

  const fetchInventoryItems = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/list");
      const data = await res.json();
      setInventoryItems(data.items || []);
    } catch (err) {
      console.error("Gagal load inventory:", err);
    }
  }, []);

  useEffect(() => {
    async function initData() {
      try {
        const [catData, resProd] = await Promise.all([
          fetchCategories(),
          fetch("/api/products").then((r) => r.json()),
        ]);
        setCategories(catData);
        setProducts(resProd.products || []);
        if (catData.length > 0) setSelectedCategoryName(catData[0].name);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initData();
    fetchInventoryItems();
  }, [fetchCategories, fetchInventoryItems]);

  const filteredProducts = products.filter(
    (p) => p.category?.name.toLowerCase() === selectedCategoryName.toLowerCase()
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  async function handleToggleAvailable(id: string, currentVal: boolean) {
    const updatedVal = !currentVal;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isAvailable: updatedVal } : p)));
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: updatedVal }),
      });
      if (!res.ok) throw new Error("Gagal update");
      showToast("success", updatedVal ? "Produk tersedia!" : "Produk disembunyikan!");
    } catch {
      showToast("error", "Gagal mengupdate ketersediaan");
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isAvailable: currentVal } : p)));
    }
  }

  async function executeDeleteProduct() {
    if (!productToDelete) return;
    setIsProductDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${productToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        showToast("success", "Produk berhasil dihapus!");
      } else {
        showToast("error", "Gagal menghapus produk");
      }
    } catch { showToast("error", "Terjadi kesalahan jaringan"); }
    finally { setIsProductDeleting(false); setProductToDelete(null); }
  }

  function openAddModal() {
    setName(""); setDescription(""); setPrice("");
    setCategoryId(categories[0]?.id || "");
    setIsAvailable(true); setImage(""); setEditId(null);
    setIsCategoryDropdownOpen(false);
    setIngredients([]);
    setIngredientSearchTerms({});
    setOpenIngredientDropdownId(null);
    setIsOpen(true);
  }

  function openEditModal(p: Product) {
    setName(p.name); setDescription(p.description || ""); setPrice(p.price.toString());
    setCategoryId(p.categoryId); setIsAvailable(p.isAvailable);
    setImage(p.image || ""); setEditId(p.id);
    setIsCategoryDropdownOpen(false);
    // Load existing recipe
    if (p.recipeItems && p.recipeItems.length > 0) {
      setIngredients(p.recipeItems.map(r => ({
        inventoryId: r.inventoryId,
        quantityNeeded: r.quantityNeeded,
        inventory: r.inventory,
      })));
    } else {
      setIngredients([]);
    }
    setIngredientSearchTerms({});
    setOpenIngredientDropdownId(null);
    setIsOpen(true);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── Ingredient handlers ──
  function addIngredientRow() {
    setIngredients((prev) => [...prev, { inventoryId: "", quantityNeeded: 0 }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    setIngredientSearchTerms((prev) => {
      const next = { ...prev };
      delete next[index];
      // Shift terms if needed
      const newTerms: Record<number, string> = {};
      Object.entries(next).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki > index) newTerms[ki - 1] = v;
        else newTerms[ki] = v;
      });
      return newTerms;
    });
  }

  function updateIngredientInventory(index: number, inventoryId: string) {
    const inv = inventoryItems.find((i) => i.id === inventoryId);
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { inventoryId, quantityNeeded: updated[index].quantityNeeded, inventory: inv };
      return updated;
    });
    setOpenIngredientDropdownId(null);
  }

  function updateIngredientQty(index: number, quantityNeeded: number) {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantityNeeded };
      return updated;
    });
  }

  function getFilteredInventory(index: number) {
    const searchTerm = (ingredientSearchTerms[index] || "").toLowerCase();
    let filtered = inventoryItems;
    if (searchTerm) {
      filtered = filtered.filter((inv) =>
        inv.name.toLowerCase().includes(searchTerm) || inv.sku.toLowerCase().includes(searchTerm)
      );
    }
    // Exclude already selected
    const selectedIds = ingredients.map((ing, i) => i !== index ? ing.inventoryId : null).filter(Boolean);
    return filtered.filter((inv) => !selectedIds.includes(inv.id)).slice(0, 20);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price || !categoryId) {
      showToast("error", "Nama, harga, dan kategori wajib diisi");
      return;
    }

    // Validasi ingredients
    for (let i = 0; i < ingredients.length; i++) {
      if (!ingredients[i].inventoryId) {
        showToast("error", `Baris bahan #${i + 1}: pilih bahan baku terlebih dahulu`);
        return;
      }
      if (!ingredients[i].quantityNeeded || ingredients[i].quantityNeeded <= 0) {
        showToast("error", `Baris bahan #${i + 1}: takaran harus lebih dari 0`);
        return;
      }
    }

    const payload: any = {
      name,
      description,
      price: Number(price),
      categoryId,
      isAvailable,
      image: image || null,
    };

    // Only send ingredients if any exist
    if (ingredients.length > 0) {
      payload.ingredients = ingredients.map((ing) => ({
        inventoryId: ing.inventoryId,
        quantityNeeded: ing.quantityNeeded,
      }));
    }

    try {
      if (editId) {
        const res = await fetch(`/api/products?id=${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setProducts((prev) => prev.map((p) => (p.id === editId ? { ...data.product, sold: p.sold } : p)));
          setIsOpen(false);
          showToast("success", "Perubahan produk berhasil disimpan!");
        } else {
          const err = await res.json();
          showToast("error", err.message || "Gagal menyimpan perubahan");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setProducts((prev) => [...prev, { ...data.product, sold: 0 }]);
          setIsOpen(false);
          showToast("success", "Produk baru berhasil ditambahkan!");
        } else {
          const err = await res.json();
          showToast("error", err.message || "Gagal menambahkan produk");
        }
      }
    } catch { showToast("error", "Terjadi kesalahan jaringan"); }
  }

  // ── Category Modal Actions ──
  function openCategoryModal() {
    setCatError(""); setCatSuccess("");
    setIsAddCatFormOpen(false);
    resetCatForm();
    setIsCatModalOpen(true);
  }
  function resetCatForm() { setCatEditId(null); setCatName(""); setCatIsDrink(false); }
  function openEditCatForm(cat: Category) {
    setCatEditId(cat.id); setCatName(cat.name); setCatIsDrink(cat.isDrink);
    setIsAddCatFormOpen(true); setCatError(""); setCatSuccess("");
  }

  async function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) { showCatMessage("error", "Nama kategori wajib diisi"); return; }
    setCatSubmitting(true); setCatError(""); setCatSuccess("");
    try {
      let res: Response;
      if (catEditId) {
        res = await fetch(`/api/categories?id=${catEditId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName.trim(), isDrink: catIsDrink }),
        });
      } else {
        res = await fetch("/api/categories", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName.trim(), isDrink: catIsDrink }),
        });
      }
      const data = await res.json();
      if (!res.ok) { showCatMessage("error", data.message || "Terjadi kesalahan"); return; }
      const refreshed = await fetchCategories();
      setCategories(refreshed);
      showCatMessage("success", catEditId ? "Kategori berhasil diperbarui!" : "Kategori berhasil ditambahkan!");
      resetCatForm(); setIsAddCatFormOpen(false);
    } catch { showCatMessage("error", "Terjadi kesalahan jaringan"); }
    finally { setCatSubmitting(false); }
  }

  async function executeCatDelete() {
    if (!catToDelete) return;
    setIsCatDeleting(true);
    try {
      const res = await fetch(`/api/categories?id=${catToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showCatMessage("error", data.message); return; }
      const refreshed = await fetchCategories();
      setCategories(refreshed);
      if (selectedCategoryName === catToDelete.name && refreshed.length > 0) setSelectedCategoryName(refreshed[0].name);
      showCatMessage("success", "Kategori berhasil dihapus.");
      showToast("success", "Kategori beserta isinya berhasil dihapus.");
    } catch { showCatMessage("error", "Terjadi kesalahan jaringan"); }
    finally { setIsCatDeleting(false); setCatToDelete(null); }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        saveCategoryReorder(newArray);
        return newArray;
      });
    }
  }

  async function saveCategoryReorder(newCategories: Category[]) {
    const reorderedPayload = newCategories.map((c, index) => ({ id: c.id, sortOrder: index }));
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, categories: reorderedPayload })
      });
      if (!res.ok) showCatMessage("error", "Gagal menyimpan urutan menu");
    } catch { showCatMessage("error", "Terjadi kesalahan saat menyimpan urutan"); }
  }

  return (
    <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] text-[#1a1f36] font-sans selection:bg-[#6C4E31] selection:text-white relative">

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

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#1a1f36]">Menu Management</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Configure your digital store products, pricing, recipe, and stock.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white px-5 py-2.5 border border-gray-200/80 rounded-2xl text-[13px] font-bold text-gray-600 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
            Today, {todayStr}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-start justify-between gap-6 mb-8 w-full">
        <div ref={scrollContainerRef}
          onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
          className={`flex-1 overflow-x-auto scrollbar-hide pt-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
          <div className="flex items-center gap-2.5 pb-3 w-max pr-8">
            {categories.map((cat) => {
              const isActive = selectedCategoryName.toLowerCase() === cat.name.toLowerCase();
              return (
                <button key={cat.id} onClick={() => setSelectedCategoryName(cat.name)}
                  className={`px-5 py-2.5 rounded-full text-[13.5px] font-extrabold whitespace-nowrap transition-all duration-300 ${isActive ? "bg-[#6C4E31] text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:text-[#1C1917] hover:bg-gray-50 shadow-sm"}`}>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 pt-1">
          <button onClick={openCategoryModal}
            className="bg-white hover:bg-gray-50 text-[#1a1f36] border border-gray-200 px-5 py-3 rounded-2xl text-[14px] font-bold flex items-center gap-2 hover:border-[#6C4E31]/40 shadow-sm transition-all duration-300 whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#6C4E31]"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
            Category
          </button>
          <button onClick={openAddModal}
            className="bg-[#1a1f36] hover:bg-[#2a314d] text-white px-6 py-3 rounded-2xl text-[14px] font-extrabold flex items-center gap-2.5 shadow-[0_8px_20px_-6px_rgba(26,31,54,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            Add New Item
          </button>
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div className="bg-white border border-gray-100 rounded-[24px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <svg className="animate-spin h-8 w-8 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="font-bold text-sm">Loading products...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            <p className="text-sm font-medium">No products found in <strong className="text-gray-600">{selectedCategoryName}</strong>.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/30">
                  <th className="py-5 pl-8 pr-4 w-24">Image</th>
                  <th className="py-5 pl-14 pr-8">Product Name</th>
                  <th className="py-5 px-10">SKU / Code</th>
                  <th className="py-5 px-10">Price</th>
                  <th className="py-5 px-8">Status</th>
                  <th className="py-5 px-8 text-center">Qty Sold</th>
                  <th className="py-5 pr-8 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="py-4 pl-8 pr-4 align-middle">
                      <div className="w-[52px] h-[52px] rounded-[14px] bg-white border border-gray-100 overflow-hidden flex items-center justify-center text-xl font-bold text-gray-300 shadow-sm group-hover:shadow-md transition-shadow">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : "☕"}
                      </div>
                    </td>
                    <td className="py-4 pl-14 pr-8 align-middle">
                      <div className="font-extrabold text-[14.5px] text-[#1a1f36] leading-tight group-hover:text-[#6C4E31] transition-colors">{p.name}</div>
                      <div className="text-[12px] font-medium text-gray-400 mt-0.5">{p.category?.name || selectedCategoryName}</div>
                      {p.recipeItems && p.recipeItems.length > 0 && (
                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /></svg>
                          {p.recipeItems.length} bahan baku
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-10 align-middle">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 font-bold text-[11px] tracking-wider font-mono">{p.sku || "N/A"}</span>
                    </td>
                    <td className="py-4 px-10 align-middle font-black text-[14.5px] text-[#1a1f36]">Rp {p.price.toLocaleString("id-ID")}</td>
                    <td className="py-4 px-8 align-middle">
                      <div className="flex items-center gap-3">
                        <button type="button"
                          onClick={() => handleToggleAvailable(p.id, p.isAvailable)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${p.isAvailable ? "bg-[#6C4E31]" : "bg-gray-200"}`}>
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${p.isAvailable ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <span className={`text-[12px] font-extrabold ${p.isAvailable ? "text-[#6C4E31]" : "text-gray-400"}`}>{p.isAvailable ? "In Stock" : "Sold Out"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8 align-middle text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-[12px] px-3 py-1.5 rounded-xl min-w-[50px]">{p.sold || 0}</span>
                    </td>
                    <td className="py-4 pr-8 pl-4 align-middle text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => openEditModal(p)} className="p-2.5 rounded-xl text-gray-400 hover:text-[#6C4E31] hover:bg-[#6C4E31]/10 transition-all duration-200" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={() => setProductToDelete(p)} className="p-2.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200" title="Delete">
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

      {/* ── DELETE PRODUCT MODAL ── */}
      {productToDelete && (
        <div className="fixed inset-0 z-[120] bg-[#1a1f36]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </div>
            <h3 className="text-xl font-black text-[#1a1f36] mb-2">Hapus Produk?</h3>
            <p className="text-gray-500 text-[13px] font-medium mb-6">Yakin hapus <strong className="text-gray-800">{productToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setProductToDelete(null)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
              <button onClick={executeDeleteProduct} disabled={isProductDeleting} className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all disabled:opacity-50">{isProductDeleting ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT PRODUCT (with Recipe Section)
          ============================================================ */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1f36]/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-[0.96] duration-300 ease-out flex flex-col max-h-[90vh]">

            {/* ── HEADER ── */}
            <div className="flex justify-between items-center px-8 pt-8 pb-5 shrink-0 border-b border-transparent">
              <h3 className="text-2xl font-black text-[#1a1f36] tracking-tight">{editId ? "Edit Item" : "Add New Item"}</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* ── FORM (Scrollable) ── */}
            <div className="flex-1 overflow-hidden px-8 pb-8 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-3 -mr-3">
                <form onSubmit={handleSubmit} className="space-y-5 pr-1 pb-2">

                  {/* PRODUCT NAME */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Artisan Latte"
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" required />
                  </div>

                  {/* DESCRIPTION */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Description <span className="text-gray-300 lowercase font-medium tracking-normal">(Optional)</span></label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Authentic blend, Double ristretto..."
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" />
                  </div>

                  {/* PRICE */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Price (Rp)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="28000"
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all duration-300 placeholder-gray-300" required />
                  </div>

                  {/* CATEGORY DROPDOWN */}
                  <div className="space-y-1.5 relative">
                    <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <div onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3.5 text-[14px] flex justify-between items-center cursor-pointer hover:border-[#6C4E31]/40 transition-all duration-300 ${isCategoryDropdownOpen ? "border-[#6C4E31]/40 ring-4 ring-[#6C4E31]/10 bg-white" : ""}`}>
                      <span>{categoryId ? categories.find(c => c.id === categoryId)?.name : <span className="text-gray-400 font-medium">Select category...</span>}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isCategoryDropdownOpen ? "rotate-180 text-[#6C4E31]" : "rotate-0"}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                    {isCategoryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setIsCategoryDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 bottom-full mb-2 z-[120] bg-white border border-gray-100 rounded-[20px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 animate-in fade-in zoom-in-[0.96] slide-in-from-bottom-1 duration-200 overflow-hidden">
                          <div className="max-h-[160px] overflow-y-auto scrollbar-hide">
                            {categories.map((cat) => (
                              <div key={cat.id} onClick={() => { setCategoryId(cat.id); setIsCategoryDropdownOpen(false); }}
                                className={`px-5 py-3.5 text-[14px] cursor-pointer transition-all duration-200 flex items-center justify-between mx-2 rounded-xl ${categoryId === cat.id ? "bg-[#6C4E31]/5 text-[#6C4E31] font-extrabold" : "text-gray-500 font-bold hover:bg-gray-50 hover:text-[#1a1f36]"}`}>
                                {cat.name}
                                {cat.isDrink && <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold">Minuman</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* IMAGE UPLOAD */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Product Image <span className="text-gray-300 lowercase font-medium tracking-normal">(Optional)</span></label>
                    <div className="flex items-center gap-4">
                      {image ? (
                        <div className="relative w-[52px] h-[52px] rounded-[14px] border border-gray-200 overflow-hidden shrink-0 group shadow-sm">
                          <img src={image} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setImage("")}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-[52px] h-[52px] rounded-[14px] border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <input type="file" id="image-upload" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleImageUpload} className="hidden" />
                        <label htmlFor="image-upload" className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-[14px] text-[14px] flex justify-center items-center cursor-pointer hover:border-[#6C4E31]/40 hover:bg-white transition-all duration-300">{image ? "Change Image" : "Upload File"}</label>
                      </div>
                    </div>
                  </div>

                  {/* ── TOGGLE AVAILABLE ── */}
                  <div className="flex items-center justify-between pt-2 pb-2">
                    <div>
                      <h4 className="text-[14px] font-extrabold text-[#1a1f36]">Item is Active</h4>
                      <p className="text-[12px] text-gray-400 font-medium">Customer can see and order this item</p>
                    </div>
                    <button type="button" onClick={() => setIsAvailable(!isAvailable)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isAvailable ? "bg-[#6C4E31]" : "bg-gray-200"}`}>
                      <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${isAvailable ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* ── RECIPE / INGREDIENTS SECTION ── */}
                  <div className="pt-4 border-t-2 border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-[14px] font-extrabold text-[#1a1f36]">Recipe / Ingredients</h4>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Define the bill of materials for this menu item.</p>
                      </div>
                      <button type="button" onClick={addIngredientRow}
                        className="text-[12px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        Add Ingredient
                      </button>
                    </div>

                    {ingredients.length === 0 ? (
                      <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl py-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-gray-300 mb-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-3-3m3 3l3-3" /></svg>
                        <p className="text-[13px] text-gray-400 font-medium">Belum ada bahan baku. Klik "Add Ingredient" untuk menambahkan.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ingredients.map((ing, idx) => {
                          const filtered = getFilteredInventory(idx);
                          const isOpen = openIngredientDropdownId === idx;
                          return (
                            <div key={idx} className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 relative">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Bahan #{idx + 1}</span>
                                <button type="button" onClick={() => removeIngredientRow(idx)}
                                  className="p-1 text-gray-300 hover:text-rose-500 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>

                              {/* Searchable Dropdown */}
                              <div className="mb-3 relative">
                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5">Bahan Baku</label>
                                <div onClick={() => {
                                  setOpenIngredientDropdownId(isOpen ? null : idx);
                                  setIngredientSearchTerms((prev) => ({ ...prev, [idx]: "" }));
                                }}
                                  className="w-full bg-white border border-gray-200 text-[#1a1f36] font-bold rounded-xl px-3.5 py-2.5 text-[13px] flex justify-between items-center cursor-pointer hover:border-[#6C4E31]/40 transition-all">
                                  <span className={ing.inventoryId ? "" : "text-gray-400 font-medium"}>
                                    {ing.inventory ? ing.inventory.name : (ing.inventoryId ? "Loading..." : "Pilih bahan baku...")}
                                  </span>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                </div>

                                {isOpen && (
                                  <>
                                    <div className="fixed inset-0 z-[110]" onClick={() => setOpenIngredientDropdownId(null)} />
                                    <div className="absolute left-0 right-0 z-[120] mt-1 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-1.5 animate-in fade-in zoom-in-[0.96] duration-150 overflow-hidden">
                                      {/* Search inside dropdown */}
                                      <div className="px-3 pb-2 border-b border-gray-50">
                                        <div className="relative">
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                          <input
                                            type="text"
                                            value={ingredientSearchTerms[idx] || ""}
                                            onChange={(e) => setIngredientSearchTerms((prev) => ({ ...prev, [idx]: e.target.value }))}
                                            placeholder="Cari bahan..."
                                            className="w-full pl-8 pr-3 py-2 text-[12px] font-medium bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-[#6C4E31]/40"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      </div>
                                      <div className="max-h-[160px] overflow-y-auto scrollbar-hide">
                                        {filtered.length === 0 ? (
                                          <div className="px-4 py-3 text-[12px] text-gray-400 font-medium text-center">Tidak ditemukan</div>
                                        ) : (
                                          filtered.map((inv) => (
                                            <div key={inv.id} onClick={() => updateIngredientInventory(idx, inv.id)}
                                              className={`px-4 py-2.5 text-[13px] cursor-pointer transition-all flex items-center justify-between mx-1.5 rounded-lg ${ing.inventoryId === inv.id ? "bg-[#6C4E31]/5 text-[#6C4E31] font-extrabold" : "text-gray-600 font-medium hover:bg-gray-50 hover:text-[#1a1f36]"}`}>
                                              <div className="flex-1 min-w-0">
                                                <span className="truncate block">{inv.name}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">{inv.sku}</span>
                                              </div>
                                              <span className="text-[10px] text-gray-400 ml-2 shrink-0">{UNIT_LABELS[inv.unit] || inv.unit}</span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Quantity Input + Unit Label */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-0.5">Takaran</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    value={ing.quantityNeeded || ""}
                                    onChange={(e) => updateIngredientQty(idx, Number(e.target.value))}
                                    placeholder="0"
                                    className="flex-1 bg-white border border-gray-200 text-[#1a1f36] font-bold rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#6C4E31]/40 focus:ring-4 focus:ring-[#6C4E31]/10 transition-all"
                                  />
                                  <span className="text-sm font-bold text-gray-400 min-w-[30px]">
                                    {ing.inventory ? (UNIT_LABELS[ing.inventory.unit] || ing.inventory.unit) : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100">
                    <button type="button" onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-4 rounded-2xl text-[14px] font-extrabold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98]">Cancel</button>
                    <button type="submit"
                      className="flex-[2] bg-[#1a1f36] text-white py-4 rounded-2xl font-extrabold text-[14px] hover:bg-[#2a314d] hover:-translate-y-0.5 active:scale-[0.98] transition-all">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: CATEGORY MANAGEMENT
          ============================================================ */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1f36]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-[0.96] duration-300 ease-out flex flex-col max-h-[85vh] relative">
            <div className="flex justify-between items-center px-8 pt-8 pb-5 shrink-0">
              <div>
                <h3 className="text-[22px] font-black text-[#1a1f36] tracking-tight">Manage Categories</h3>
                <p className="text-[13px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">Geser ikon <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg> untuk mengubah urutan menu.</p>
              </div>
              <button onClick={() => setIsCatModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {catError && (
              <div className="mx-8 mb-4 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-[13px] font-semibold text-rose-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                {catError}
              </div>
            )}
            {catSuccess && (
              <div className="mx-8 mb-4 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[13px] font-semibold text-emerald-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {catSuccess}
              </div>
            )}
            <div className="overflow-y-auto flex-1 px-8 relative">
              {catLoading ? (
                <div className="py-10 flex justify-center"><svg className="animate-spin h-6 w-6 text-[#6C4E31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
              ) : categories.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-[14px] font-medium">Belum ada kategori. Tambahkan kategori baru di bawah.</div>
              ) : (
                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <table className="w-full text-left mb-4">
                      <thead>
                        <tr className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <th className="pb-3 w-10"></th>
                          <th className="pb-3">Nama Category</th>
                          <th className="pb-3 text-center w-28">Type</th>
                          <th className="pb-3 text-right w-28">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {categories.map((cat) => (
                          <SortableCategoryRow key={cat.id} cat={cat} openEditCatForm={openEditCatForm} setCatToDelete={setCatToDelete} />
                        ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>
              )}
            </div>
            <div className="px-8 pb-8 pt-4 shrink-0 border-t border-gray-100">
              {!isAddCatFormOpen ? (
                <button onClick={() => { resetCatForm(); setIsAddCatFormOpen(true); setCatError(""); setCatSuccess(""); }}
                  className="w-full py-3.5 border-2 border-dashed border-[#6C4E31]/30 hover:border-[#6C4E31]/60 text-[#6C4E31] font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#6C4E31]/5 active:scale-[0.98]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                  Tambah Category Baru
                </button>
              ) : (
                <form onSubmit={handleCatSubmit} className="space-y-4">
                  <h4 className="text-[14px] font-black text-[#1a1f36]">{catEditId ? "Edit Kategori" : "Tambah Kategori Baru"}</h4>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                    <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Espresso, Minuman Buah..."
                      className="w-full bg-gray-50/50 border border-gray-200 text-[#1a1f36] font-bold rounded-2xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C4E31]/40 focus:bg-white focus:ring-4 focus:ring-[#6C4E31]/10 transition-all placeholder-gray-300" autoFocus required />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <p className="text-[14px] font-bold text-[#1a1f36]">Ini adalah kategori Minuman?</p>
                      <p className="text-[12px] text-gray-400 font-medium">Jika ya, kasir bisa pilih pilihan cup size & es.</p>
                    </div>
                    <button type="button" onClick={() => setCatIsDrink(!catIsDrink)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ${catIsDrink ? "bg-[#6C4E31]" : "bg-gray-200"}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ${catIsDrink ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { resetCatForm(); setIsAddCatFormOpen(false); }} className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98]">Batal</button>
                    <button type="submit" disabled={catSubmitting} className="flex-[2] bg-[#1a1f36] text-white py-3 rounded-2xl font-extrabold text-[13px] hover:bg-[#2a314d] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:translate-y-0">{catSubmitting ? "Menyimpan..." : (catEditId ? "Simpan Perubahan" : "Tambah Kategori")}</button>
                  </div>
                </form>
              )}
            </div>
            {catToDelete && (
              <div className="absolute inset-0 z-[120] bg-transparent backdrop-blur-md rounded-[32px] flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-[#1a1f36] mb-2">Hapus Kategori?</h3>
                  <p className="text-gray-500 text-[13px] font-medium mb-6">Yakin hapus <strong className="text-gray-800">{catToDelete.name}</strong>? Pastikan tidak ada produk di dalamnya.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setCatToDelete(null)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                    <button onClick={executeCatDelete} disabled={isCatDeleting} className="flex-1 py-3 text-white font-bold bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all disabled:opacity-50">{isCatDeleting ? 'Menghapus...' : 'Ya, Hapus'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}