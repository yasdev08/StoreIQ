// src/components/modals/SupplierModal.tsx
import { useState } from "react";
import { Icon, Icons } from "@/components/ui/Icon";
import type { Supplier, SupplierInput } from "@/types";

interface SupplierModalProps {
  supplier?: Supplier | null;
  onClose: () => void;
  onSave: (input: SupplierInput) => Promise<void>;
}

const emptyForm = (): SupplierInput => ({
  name: "", contact_name: null, email: null,
  phone: null, address: null, notes: null, status: "active",
});

function supplierToForm(s: Supplier): SupplierInput {
  return {
    name: s.name, contact_name: s.contact_name, email: s.email,
    phone: s.phone, address: s.address, notes: s.notes, status: s.status,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] tracking-[0.8px] uppercase text-[#4A5068] font-mono">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors font-body placeholder:text-[#4A5068]";

export function SupplierModal({ supplier, onClose, onSave }: SupplierModalProps) {
  const [form, setForm] = useState<SupplierInput>(
    supplier ? supplierToForm(supplier) : emptyForm()
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SupplierInput>(k: K, v: SupplierInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name) return;
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
        className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[480px] max-w-[95vw]"
        style={{ animation: "slideUp 0.2s" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-bold">
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-[#E8EAF0] transition-colors">
            <Icon d={Icons.close} size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <Field label="Company Name *">
              <input className={inputCls} placeholder="e.g. Nike Direct" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
          </div>
          <Field label="Contact Person">
            <input className={inputCls} placeholder="Full name" value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value || null)} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as "active" | "inactive")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" placeholder="contact@supplier.com" value={form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} placeholder="+1 800 555 0100" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
          </Field>
          <div className="col-span-2">
            <Field label="Address">
              <input className={inputCls} placeholder="Street, City, Country" value={form.address ?? ""} onChange={(e) => set("address", e.target.value || null)} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Notes">
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Delivery terms, lead time, etc." value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-[#252836]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-[#E8EAF0] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.name} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] transition-all disabled:opacity-50">
            <Icon d={Icons.check} size={14} />
            {saving ? "Saving…" : "Save Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}
