// src/views/Returns.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/components/ui/Badge";
import { Icon, Icons } from "@/components/ui/Icon";
import type { ReturnRecord } from "@/types";

function ReturnModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { products, recentSales } = useStore();
  const [step, setStep] = useState<"find" | "confirm">("find");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{
    productId: number;
    productName: string;
    unitPrice: number;
    unitCost: number;
    saleId: number | null;
  } | null>(null);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inp =
    "w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors";

  // Search recent sales OR product list
  const saleMatches = (recentSales ?? [])
    .filter((s) => s.product_name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6);

  const productMatches =
    query.length > 1
      ? products
          .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 4)
      : [];

  const selectFromSale = (s: (typeof recentSales)[0]) => {
    setSelected({
      productId: s.product_id,
      productName: s.product_name,
      unitPrice: s.unit_price,
      unitCost: s.unit_cost,
      saleId: s.id,
    });
    setQty(s.quantity);
    setStep("confirm");
  };

  const selectFromProduct = (p: (typeof products)[0]) => {
    setSelected({
      productId: p.id,
      productName: p.name,
      unitPrice: p.price,
      unitCost: p.cost,
      saleId: null,
    });
    setQty(1);
    setStep("confirm");
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setErr(null);
    try {
      await invoke("create_return", {
        input: {
          sale_id: selected.saleId,
          product_id: selected.productId,
          product_name: selected.productName,
          quantity: qty,
          unit_price: selected.unitPrice,
          unit_cost: selected.unitCost,
          reason: reason || null,
          restock,
        },
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const REASONS = [
    "Customer changed mind",
    "Damaged/defective",
    "Wrong item",
    "Expired",
    "Other",
  ];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[500px] max-w-[95vw]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[18px] font-bold">
            Process Return / Refund
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

        {step === "find" && (
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-2">
              Search product or recent sale
            </label>
            <input
              className={inp}
              autoFocus
              placeholder="Type product name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {saleMatches.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                  Recent Sales
                </div>
                <div className="space-y-1">
                  {saleMatches.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectFromSale(s)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1A1D2A] border border-[#252836] hover:border-[#F59E0B] transition-colors text-left"
                    >
                      <div>
                        <div className="text-[13px] font-semibold">
                          {s.product_name}
                        </div>
                        <div className="text-[11px] text-[#4A5068] font-mono">
                          {new Date(s.sold_at).toLocaleDateString()} ·{" "}
                          {s.quantity}×
                        </div>
                      </div>
                      <span className="text-[13px] font-bold font-mono text-[#F59E0B]">
                        ${Number(s.total_revenue).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {productMatches.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                  Products (no sale record)
                </div>
                <div className="space-y-1">
                  {productMatches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectFromProduct(p)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1A1D2A] border border-[#252836] hover:border-[#F59E0B] transition-colors text-left"
                    >
                      <div className="text-[13px] font-semibold">{p.name}</div>
                      <span className="text-[12px] font-mono text-[#8B90A8]">
                        ${Number(p.price).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length > 0 &&
              saleMatches.length === 0 &&
              productMatches.length === 0 && (
                <div className="mt-4 text-center text-[12px] text-[#4A5068]">
                  No matches found
                </div>
              )}
          </div>
        )}

        {step === "confirm" && selected && (
          <div>
            <button
              onClick={() => setStep("find")}
              className="text-[12px] text-[#8B90A8] hover:text-white mb-4 flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="bg-[#0C0E14] rounded-xl p-4 border border-[#252836] mb-4">
              <div className="font-display text-[16px] font-bold mb-1">
                {selected.productName}
              </div>
              <div className="text-[12px] text-[#8B90A8] font-mono">
                ${selected.unitPrice.toFixed(2)} / unit
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                  Return Quantity
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#0C0E14] border border-[#2E3248] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-[#8B90A8] hover:text-white hover:bg-[#1A1D2A] text-[16px]"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-mono font-bold">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="px-3 py-2 text-[#8B90A8] hover:text-white hover:bg-[#1A1D2A] text-[16px]"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[13px] font-mono text-[#F59E0B] font-bold">
                    Refund: ${(selected.unitPrice * qty).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                  Reason
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                        reason === r
                          ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]"
                          : "bg-[#1A1D2A] text-[#8B90A8] border-[#252836] hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  className={inp}
                  placeholder="Or type custom reason…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0C0E14] border border-[#252836]">
                <div>
                  <div className="text-[13px] font-semibold">Restock item</div>
                  <div className="text-[11px] text-[#4A5068]">
                    Add quantity back to inventory
                  </div>
                </div>
                <button
                  onClick={() => setRestock((r) => !r)}
                  className={`w-11 h-6 rounded-full transition-all relative ${restock ? "bg-[#10B981]" : "bg-[#2E3248]"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${restock ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-4 border-t border-[#252836]">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#2E3248] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#EF4444] text-white hover:bg-[#DC2626] disabled:opacity-50"
              >
                {saving
                  ? "Processing…"
                  : `✓ Refund $${(selected.unitPrice * qty).toFixed(2)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Returns() {
  const { fetchProducts } = useStore();
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [todayRefunds, setTodayRefunds] = useState(0);

  const load = async () => {
    try {
      const result = await invoke<{ ok: boolean; data: ReturnRecord[] }>(
        "get_returns",
        { limit: 50 },
      );
      if (result.ok) setRecords(result.data ?? []);
      const today = await invoke<{ ok: boolean; data: ReturnRecord[] }>(
        "get_returns_today",
        {},
      );
      if (today.ok) {
        const total = (today.data ?? []).reduce(
          (s, r) => s + r.total_refund,
          0,
        );
        setTodayRefunds(total);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-4 text-[13px]">
          <div className="bg-[#13151E] border border-[#252836] rounded-xl px-5 py-3">
            <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-0.5">
              Today's Refunds
            </div>
            <div className="text-[20px] font-bold font-mono text-[#EF4444]">
              ${todayRefunds.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#13151E] border border-[#252836] rounded-xl px-5 py-3">
            <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-0.5">
              Total Returns
            </div>
            <div className="text-[20px] font-bold font-mono">
              {records.length}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#EF4444] text-white hover:bg-[#DC2626]"
        >
          <Icon d={Icons.plus} size={14} /> New Return
        </button>
      </div>

      <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
        {records.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#4A5068]">
            No returns recorded yet
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {[
                  "Product",
                  "Qty",
                  "Refund",
                  "Reason",
                  "Restocked",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3.5 py-3 text-left text-[10px] tracking-widest uppercase text-[#4A5068] font-mono border-b border-[#252836] font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-[#1A1D2A] transition-colors">
                  <td className="px-3.5 py-3 border-b border-[#252836] font-semibold">
                    {r.product_name}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono">
                    {r.quantity}×
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono font-bold text-[#EF4444]">
                    ${Number(r.total_refund).toFixed(2)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] text-[12px] text-[#8B90A8]">
                    {r.reason ?? "—"}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836]">
                    {r.restock ? (
                      <Badge variant="green">Yes</Badge>
                    ) : (
                      <Badge variant="gray">No</Badge>
                    )}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] text-[12px] text-[#8B90A8]">
                    {fmtDate(r.returned_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ReturnModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            load();
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
