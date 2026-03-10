// src/views/Expiry.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/components/ui/Badge";

interface ExpiryProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  expiry_date: string;
  days_until_expiry: number;
}

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0)
    return <Badge variant="red">Expired {Math.abs(days)}d ago</Badge>;
  if (days === 0) return <Badge variant="red">Expires today</Badge>;
  if (days <= 7) return <Badge variant="red">{days}d left</Badge>;
  if (days <= 30) return <Badge variant="amber">{days}d left</Badge>;
  return <Badge variant="green">{days}d left</Badge>;
}

function SetExpiryModal({
  productId,
  productName,
  current,
  onClose,
  onSaved,
}: {
  productId: number;
  productName: string;
  current: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(current ?? "");
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke("set_expiry_date", {
        productId,
        expiryDate: date || null,
        alertDays: days,
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B]";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#13151E] border border-[#2E3248] rounded-2xl p-7 w-[400px]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-[16px] font-bold">
            Set Expiry — {productName}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Expiry Date
            </label>
            <input
              type="date"
              className={inp}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
              Alert me when within (days)
            </label>
            <div className="flex gap-2">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-mono font-semibold border transition-all ${
                    days === d
                      ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]"
                      : "bg-[#1A1D2A] text-[#8B90A8] border-[#252836] hover:text-white"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5 pt-4 border-t border-[#252836]">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] disabled:opacity-50"
          >
            {saving ? "Saving…" : "✓ Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ExpiryTracking() {
  const { products } = useStore();
  const [expiring, setExpiring] = useState<ExpiryProduct[]>([]);
  const [editTarget, setEditTarget] = useState<{
    id: number;
    name: string;
    current: string | null;
  } | null>(null);
  const [withinDays, setWithinDays] = useState(60);

  const load = async () => {
    try {
      const r = await invoke<{ ok: boolean; data: ExpiryProduct[] }>(
        "get_expiring_products",
        { withinDays },
      );
      if (r.ok) setExpiring(r.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, [withinDays]);

  // Products without any expiry set
  const noExpiry = products.filter((p) => !(p as any).expiry_date);

  const expired = expiring.filter((p) => p.days_until_expiry < 0);
  const expiresoon = expiring.filter(
    (p) => p.days_until_expiry >= 0 && p.days_until_expiry <= 7,
  );
  const expiring30 = expiring.filter((p) => p.days_until_expiry > 7);

  return (
    <div>
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          ["Expired", expired.length, "text-[#EF4444]"],
          ["Expires ≤7d", expiresoon.length, "text-[#EF4444]"],
          ["Expires ≤60d", expiring30.length, "text-[#F59E0B]"],
          ["No date set", noExpiry.length, "text-[#8B90A8]"],
        ].map(([label, val, color]) => (
          <div
            key={label as string}
            className="bg-[#13151E] border border-[#252836] rounded-xl p-4"
          >
            <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-1">
              {label}
            </div>
            <div className={`text-[24px] font-bold font-mono ${color}`}>
              {val}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[12px] text-[#8B90A8]">
          Show expiring within:
        </span>
        {[30, 60, 90, 180].map((d) => (
          <button
            key={d}
            onClick={() => setWithinDays(d)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-mono font-semibold border transition-all ${
              withinDays === d
                ? "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]"
                : "bg-[#1A1D2A] text-[#8B90A8] border-[#252836] hover:text-white"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Expiring products table */}
      <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#252836]">
          <span className="font-display text-[14px] font-bold">
            Products with Expiry Dates
          </span>
        </div>
        {expiring.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#4A5068]">
            No products expiring within {withinDays} days
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {[
                  "Product",
                  "SKU",
                  "Category",
                  "Stock",
                  "Expiry Date",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3.5 py-3 text-left text-[10px] tracking-widests uppercase text-[#4A5068] font-mono border-b border-[#252836] font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expiring.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-[#1A1D2A] transition-colors ${p.days_until_expiry < 0 ? "bg-[rgba(239,68,68,0.03)]" : ""}`}
                >
                  <td className="px-3.5 py-3 border-b border-[#252836] font-semibold">
                    {p.name}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono text-[11px] text-[#8B90A8]">
                    {p.sku}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] text-[#8B90A8]">
                    {p.category}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono">
                    {p.stock}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono">
                    {new Date(p.expiry_date + "T00:00:00").toLocaleDateString()}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836]">
                    <ExpiryBadge days={p.days_until_expiry} />
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836]">
                    <button
                      onClick={() =>
                        setEditTarget({
                          id: p.id,
                          name: p.name,
                          current: p.expiry_date,
                        })
                      }
                      className="text-[11px] px-2.5 py-1 rounded bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-white"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Products without expiry date set */}
      {noExpiry.length > 0 && (
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between">
            <span className="font-display text-[14px] font-bold">
              No Expiry Date Set
            </span>
            <span className="text-[12px] text-[#4A5068] font-mono">
              {noExpiry.length} products
            </span>
          </div>
          <div className="divide-y divide-[#252836]">
            {noExpiry.slice(0, 20).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-[#1A1D2A]"
              >
                <div>
                  <span className="text-[13px] font-semibold">{p.name}</span>
                  <span className="text-[11px] text-[#4A5068] font-mono ml-2">
                    {p.sku}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setEditTarget({ id: p.id, name: p.name, current: null })
                  }
                  className="text-[11px] px-2.5 py-1 rounded bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] text-[#F59E0B] hover:bg-[rgba(245,158,11,0.2)]"
                >
                  + Set Date
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {editTarget && (
        <SetExpiryModal
          productId={editTarget.id}
          productName={editTarget.name}
          current={editTarget.current}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            load();
          }}
        />
      )}
    </div>
  );
}
