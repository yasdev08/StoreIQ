// src/views/Products.tsx
import { useMemo, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { StockBar } from "@/components/ui/StockBar";
import { Badge } from "@/components/ui/Badge";
import { Icon, Icons } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { exportProductsCSV, exportInventoryCSV } from "@/utils/export";
import { saveProductImage } from "@/db";
import { open as openDialog } from "@tauri-apps/api/dialog";
import { useImage } from "@/hooks/useImage";
import type { Product, ProductInput } from "@/types";

const DEFAULT_CATEGORIES = [
  "Sneakers",
  "Caps",
  "T-Shirts",
  "Jackets",
  "Accessories",
  "General",
];

// ── Image picker + preview component ─────────────────────────────────────────
function ImagePicker({
  sku,
  value,
  onChange,
}: {
  sku: string;
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const previewDataUrl = useImage(value);

  const handlePick = async () => {
    setErr(null);
    try {
      const selected = (await openDialog({
        title: "Select Product Image",
        filters: [
          { name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
        ],
        multiple: false,
      })) as string | null;

      if (!selected) return;
      setUploading(true);

      const stored = await saveProductImage(selected, sku || "product");
      onChange(stored);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Preview */}
      <div
        className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-[#2E3248] overflow-hidden flex-shrink-0 cursor-pointer hover:border-[#F59E0B] transition-colors relative bg-[#0C0E14]"
        onClick={handlePick}
      >
        {previewDataUrl ? (
          <img
            src={previewDataUrl}
            alt="Product"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <Icon d={Icons.download} size={20} className="text-[#2E3248]" />
            <span className="text-[9px] text-[#4A5068] font-mono">UPLOAD</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <button
          onClick={handlePick}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-[#E8EAF0] transition-colors disabled:opacity-50"
        >
          <Icon d={Icons.download} size={13} />
          {uploading ? "Uploading…" : value ? "Change Image" : "Upload Image"}
        </button>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="mt-1 text-[11px] text-[#EF4444] hover:underline block"
          >
            Remove image
          </button>
        )}
        {err && <div className="text-[11px] text-[#EF4444] mt-1">{err}</div>}
        <div className="text-[10px] text-[#4A5068] mt-1">
          JPG, PNG, WEBP — stored locally
        </div>
      </div>
    </div>
  );
}

// ── Product thumbnail (used in table) ─────────────────────────────────────────
function ProductThumb({
  imagePath,
  name,
}: {
  imagePath: string | null;
  name: string;
}) {
  const src = useImage(imagePath);
  if (!imagePath || !src) {
    return (
      <div className="w-9 h-9 rounded-lg bg-[#1A1D2A] border border-[#252836] flex items-center justify-center flex-shrink-0">
        <Icon d={Icons.box} size={16} className="text-[#2E3248]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-[#252836]"
    />
  );
}

// ── Product Form (modal) ──────────────────────────────────────────────────────
function ProductForm({
  product,
  categories,
  onAddCategory,
  supplierList,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: string[];
  onAddCategory: (category: string) => void;
  supplierList: { id: number; name: string }[];
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ProductInput>(
    product
      ? {
          sku: product.sku,
          name: product.name,
          category: product.category,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          threshold: product.threshold,
          supplier_id: product.supplier_id,
          barcode: product.barcode,
          image_path: product.image_path,
          notes: product.notes,
        }
      : {
          sku: "",
          name: "",
          category: "General",
          price: 0,
          cost: 0,
          stock: 0,
          threshold: 5,
          supplier_id: null,
          barcode: null,
          image_path: null,
          notes: null,
        },
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryErr, setCategoryErr] = useState<string | null>(null);
  const { products } = useStore();

  const set = (k: keyof ProductInput, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Live SKU duplicate check — skip current product when editing
  const currentId = product?.id ?? null;
  const skuTaken =
    form.sku.trim().length > 0 &&
    products.some(
      (p) =>
        p.sku.toLowerCase() === form.sku.trim().toLowerCase() &&
        p.id !== currentId,
    );

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErr("Name is required");
      return;
    }
    if (!form.sku.trim()) {
      setErr("SKU is required");
      return;
    }
    if (skuTaken) {
      setErr(`SKU "${form.sku}" is already used by another product.`);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    const value = newCategory.trim();
    if (!value) {
      setCategoryErr("Enter a category name");
      return;
    }
    if (value.toLowerCase() === "all") {
      setCategoryErr('"All" is reserved for filtering');
      return;
    }

    const existing = categories.find(
      (category) => category.toLowerCase() === value.toLowerCase(),
    );
    if (existing) {
      set("category", existing);
      setNewCategory("");
      setCategoryErr(null);
      return;
    }

    onAddCategory(value);
    set("category", value);
    setNewCategory("");
    setCategoryErr(null);
  };

  const inp =
    "w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[520px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-bold">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-white"
          >
            ✕
          </button>
        </div>

        {err && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#EF4444] text-[12px]">
            {err}
          </div>
        )}

        {/* Image upload — top of form */}
        <div className="mb-5 p-4 bg-[#0C0E14] rounded-xl border border-[#252836]">
          <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-2.5">
            Product Image
          </label>
          <ImagePicker
            sku={form.sku}
            value={form.image_path}
            onChange={(path) => set("image_path", path)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Product Name *
            </label>
            <input
              className={inp}
              placeholder="e.g. Air Max 90 White"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              SKU *
            </label>
            <input
              className={`${inp} ${skuTaken ? "border-[#EF4444] focus:border-[#EF4444]" : ""}`}
              placeholder="e.g. SNK-001"
              value={form.sku}
              onChange={(e) => {
                set("sku", e.target.value);
                setErr(null);
              }}
            />
            {skuTaken && (
              <div className="mt-1 text-[11px] text-[#EF4444]">
                ⚠ SKU already exists
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Category
            </label>
            <select
              className={inp}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder="New category"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setCategoryErr(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-[#E8EAF0] transition-colors"
              >
                Add
              </button>
            </div>
            {categoryErr && (
              <div className="mt-1 text-[11px] text-[#EF4444]">{categoryErr}</div>
            )}
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Sell Price ($)
            </label>
            <input
              className={inp}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Cost Price ($)
            </label>
            <input
              className={inp}
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => set("cost", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Stock Qty
            </label>
            <input
              className={inp}
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Alert Threshold
            </label>
            <input
              className={inp}
              type="number"
              min="0"
              value={form.threshold}
              onChange={(e) => set("threshold", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Supplier
            </label>
            <select
              className={inp}
              value={form.supplier_id ?? ""}
              onChange={(e) =>
                set(
                  "supplier_id",
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
            >
              <option value="">No supplier</option>
              {supplierList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Barcode
            </label>
            <input
              className={inp}
              placeholder="Scan or type barcode…"
              value={form.barcode ?? ""}
              onChange={(e) => set("barcode", e.target.value || null)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              className={`${inp} resize-none`}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || null)}
            />
          </div>
        </div>

        <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-[#252836]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || skuTaken}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] disabled:opacity-50"
          >
            {saving ? "Saving…" : "✓ Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function Products() {
  const store = useStore();
  const products = store.products ?? [];
  const suppliers = store.suppliers ?? [];
  const searchQuery = store.searchQuery ?? "";

  const [cat, setCat] = useState("All");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [modal, setModal] = useState<"add" | Product | null>(null);
  const [delTarget, setDelTarget] = useState<Product | null>(null);

  const supplierList = suppliers.map((s) => ({ id: s.id, name: s.name }));

  const categoryOptions = useMemo(() => {
    const unique = new Map<string, string>();
    const add = (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      const key = value.toLowerCase();
      if (key === "all") return;
      if (!unique.has(key)) unique.set(key, value);
    };

    DEFAULT_CATEGORIES.forEach(add);
    products.forEach((p) => add(p.category));
    customCategories.forEach(add);
    return Array.from(unique.values());
  }, [customCategories, products]);

  const filterCategories = useMemo(
    () => ["All", ...categoryOptions],
    [categoryOptions],
  );

  const handleAddCategory = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (categoryOptions.some((c) => c.toLowerCase() === value.toLowerCase()))
      return;
    setCustomCategories((prev) => [...prev, value]);
  };

  const filtered = products.filter((p) => {
    const matchCat = cat === "All" || p.category === cat;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleSave = async (input: ProductInput) => {
    if (modal && modal !== "add")
      await store.updateProduct((modal as Product).id, input);
    else await store.createProduct(input);
  };

  return (
    <ErrorBoundary name="Products">
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {filterCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold font-mono border transition-all ${
                  cat === c
                    ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]"
                    : "bg-[#1A1D2A] text-[#8B90A8] border-[#252836] hover:text-[#E8EAF0]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportProductsCSV(products).catch(console.error)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836] hover:text-white transition-colors"
            >
              ↓ CSV
            </button>
            <button
              onClick={() => exportInventoryCSV(products).catch(console.error)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836] hover:text-white transition-colors"
            >
              ↓ Inventory
            </button>
            <button
              onClick={() => setModal("add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] transition-all"
            >
              <Icon d={Icons.plus} size={14} /> Add Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr>
                  {[
                    "",
                    "Product",
                    "SKU",
                    "Category",
                    "Price",
                    "Cost",
                    "Stock",
                    "Supplier",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-3.5 py-3 text-left text-[10px] tracking-widest uppercase text-[#4A5068] font-mono border-b border-[#252836] font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3.5 py-12 text-center text-[13px] text-[#4A5068]"
                    >
                      No products yet. Click "Add Product" to get started.
                    </td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#1A1D2A] transition-colors group"
                  >
                    {/* Thumbnail */}
                    <td className="px-3 py-2 border-b border-[#252836] w-12">
                      <ProductThumb imagePath={p.image_path} name={p.name} />
                    </td>
                    <td className="px-3.5 py-3 font-semibold border-b border-[#252836]">
                      {p.name}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <span className="font-mono text-[11px] text-[#8B90A8]">
                        {p.sku}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <Badge variant="blue">{p.category}</Badge>
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <span className="font-mono">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <span className="font-mono text-[#8B90A8]">
                        ${Number(p.cost).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836] w-[140px]">
                      <StockBar
                        stock={Number(p.stock)}
                        threshold={Number(p.threshold)}
                      />
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836] text-[12px] text-[#8B90A8]">
                      {suppliers.find((s) => s.id === p.supplier_id)?.name ??
                        "—"}
                    </td>
                    <td className="px-3.5 py-3 border-b border-[#252836]">
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 rounded-md bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-white"
                        >
                          <Icon d={Icons.edit} size={13} />
                        </button>
                        <button
                          onClick={() => setDelTarget(p)}
                          className="p-1.5 rounded-md bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[#EF4444]"
                        >
                          <Icon d={Icons.trash} size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal !== null && (
          <ErrorBoundary name="ProductForm">
            <ProductForm
              product={modal === "add" ? null : (modal as Product)}
              categories={categoryOptions}
              onAddCategory={handleAddCategory}
              supplierList={supplierList}
              onClose={() => setModal(null)}
              onSave={handleSave}
            />
          </ErrorBoundary>
        )}

        {delTarget && (
          <ConfirmDialog
            title="Delete Product"
            message={`Delete "${delTarget.name}"? This cannot be undone.`}
            confirmLabel="Delete"
            danger
            onConfirm={async () => {
              await store.deleteProduct(delTarget.id);
              setDelTarget(null);
            }}
            onCancel={() => setDelTarget(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
