// src/components/modals/ProductModal.tsx
import { useState } from "react";
import { Icon, Icons } from "@/components/ui/Icon";
import type { Product, ProductInput } from "@/types";

interface ProductModalProps {
  product?: Product | null;
  suppliers: { id: number; name: string }[];
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
}

const CATEGORIES = [
  "Sneakers",
  "Caps",
  "T-Shirts",
  "Jackets",
  "Accessories",
  "General",
];

const emptyForm = (): ProductInput => ({
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
});

function productToForm(p: Product): ProductInput {
  return {
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    threshold: p.threshold,
    supplier_id: p.supplier_id,
    barcode: p.barcode,
    image_path: p.image_path,
    notes: p.notes,
  };
}

export function ProductModal({
  product,
  suppliers,
  onClose,
  onSave,
}: ProductModalProps) {
  const [form, setForm] = useState<ProductInput>(
    product ? productToForm(product) : emptyForm(),
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.sku) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      style={{ animation: "fadeIn 0.15s" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        style={{ animation: "slideUp 0.2s" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-bold">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-[#E8EAF0] transition-colors"
          >
            <Icon d={Icons.close} size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Name — full width */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Product Name *
            </label>
            <input
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body placeholder:text-[#4A5068]"
              placeholder="e.g. Air Max 90 White"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* SKU */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              SKU *
            </label>
            <input
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body placeholder:text-[#4A5068]"
              placeholder="e.g. SNK-001"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Category
            </label>
            <select
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Sell Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body"
              value={form.price}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Cost */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Cost Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body"
              value={form.cost}
              onChange={(e) => set("cost", parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Stock */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Stock Qty
            </label>
            <input
              type="number"
              min="0"
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body"
              value={form.stock}
              onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Threshold */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Low-Stock Alert At
            </label>
            <input
              type="number"
              min="0"
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body"
              value={form.threshold}
              onChange={(e) => set("threshold", parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Supplier — full width */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Supplier
            </label>
            <select
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body"
              value={form.supplier_id ?? ""}
              onChange={(e) =>
                set(
                  "supplier_id",
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Barcode — full width */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Barcode
            </label>
            <input
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body placeholder:text-[#4A5068] placeholder:font-body"
              placeholder="Scan or type barcode…"
              value={form.barcode ?? ""}
              onChange={(e) => set("barcode", e.target.value || null)}
            />
          </div>

          {/* Notes — full width */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">
              Notes
            </label>
            <textarea
              rows={2}
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body placeholder:text-[#4A5068] resize-none"
              placeholder="Internal notes…"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || null)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-[#252836]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-[#E8EAF0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.sku}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon d={Icons.check} size={14} />
            {saving ? "Saving…" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
