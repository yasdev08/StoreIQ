// src/views/Suppliers.tsx
import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/components/ui/Badge";
import { Icon, Icons } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SupplierModal } from "@/components/modals/SupplierModal";
import type { Supplier, SupplierInput } from "@/types";

export function Suppliers() {
  const { suppliers, products, createSupplier, updateSupplier, deleteSupplier } = useStore();
  const [modal, setModal]     = useState<"add" | Supplier | null>(null);
  const [delTarget, setDelTarget] = useState<Supplier | null>(null);

  const productCount = (supplierId: number) =>
    products.filter((p) => p.supplier_id === supplierId).length;

  const handleSave = async (input: SupplierInput) => {
    if (modal && modal !== "add") {
      await updateSupplier((modal as Supplier).id, input);
    } else {
      await createSupplier(input);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] hover:-translate-y-px transition-all"
        >
          <Icon d={Icons.plus} size={14} />
          Add Supplier
        </button>
      </div>

      {/* Card grid */}
      {suppliers.length === 0 ? (
        <div className="bg-[#13151E] border border-[#252836] rounded-xl p-12 text-center text-[13px] text-[#4A5068]">
          No suppliers yet. Add your first one.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3.5">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-[#1A1D2A] border border-[#252836] rounded-xl p-5 hover:border-[#2E3248] transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="font-display text-[14px] font-bold leading-tight">{s.name}</div>
                <Badge variant={s.status === "active" ? "green" : "red"} dot>
                  {s.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-1.5 mb-4">
                {s.contact_name && <Field label="Contact" value={s.contact_name} />}
                {s.email && (
                  <Field label="Email">
                    <span className="text-[#F59E0B] truncate">{s.email}</span>
                  </Field>
                )}
                {s.phone && <Field label="Phone" value={s.phone} />}
                <Field label="Products" value={`${productCount(s.id)} linked`} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-[#252836] pt-3">
                <button
                  onClick={() => setModal(s)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#13151E] text-[#8B90A8] border border-[#252836] hover:text-[#E8EAF0] transition-colors"
                >
                  <Icon d={Icons.edit} size={12} /> Edit
                </button>
                <button
                  onClick={() => setDelTarget(s)}
                  className="flex items-center justify-center px-3 py-1.5 rounded-lg text-[12px] bg-[rgba(239,68,68,0.08)] text-[#EF4444] border border-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
                >
                  <Icon d={Icons.trash} size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal !== null && (
        <SupplierModal
          supplier={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {delTarget && (
        <ConfirmDialog
          title="Delete Supplier"
          message={`Delete "${delTarget.name}"? Products linked to this supplier will be unlinked (not deleted).`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => { await deleteSupplier(delTarget.id); setDelTarget(null); }}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="text-[12px] text-[#8B90A8] flex gap-1.5">
      <span className="shrink-0">{label}:</span>
      {children ?? <span className="text-[#E8EAF0] truncate">{value}</span>}
    </div>
  );
}
