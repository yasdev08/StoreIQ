// src/views/Alerts.tsx
import { useStore } from "@/hooks/useStore";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Icon, Icons } from "@/components/ui/Icon";

export function Alerts() {
  const { products, suppliers } = useStore();

  const critical = products.filter((p) => p.stock === 0);
  const low      = products.filter((p) => p.stock > 0 && p.stock <= p.threshold);
  const healthy  = products.filter((p) => p.stock > p.threshold);

  const supplierName = (id: number | null) =>
    suppliers.find((s) => s.id === id)?.name ?? "—";

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Out of Stock"  value={critical.length} sub="Needs immediate restock" accent="red" />
        <StatCard label="Low Stock"     value={low.length}      sub="Below alert threshold"   accent="amber" />
        <StatCard label="Healthy Stock" value={healthy.length}  sub="No action needed"        accent="green" />
      </div>

      {/* Critical panel */}
      {critical.length > 0 && (
        <Panel title="🚨 Out of Stock" badge={<Badge variant="red" dot>{critical.length} items</Badge>} className="mb-4">
          {critical.map((p) => (
            <AlertRow
              key={p.id}
              name={p.name}
              detail={`${p.sku} · Supplier: ${supplierName(p.supplier_id)}`}
              level="red"
              stockLabel="0 units"
              cta="Order Now"
            />
          ))}
        </Panel>
      )}

      {/* Low stock panel */}
      {low.length > 0 && (
        <Panel title="⚠️ Low Stock Warning" badge={<Badge variant="amber" dot>{low.length} items</Badge>}>
          {low.map((p) => (
            <AlertRow
              key={p.id}
              name={p.name}
              detail={`${p.sku} · Threshold: ${p.threshold} · Supplier: ${supplierName(p.supplier_id)}`}
              level="amber"
              stockLabel={`${p.stock} left`}
              cta="Reorder"
            />
          ))}
        </Panel>
      )}

      {/* All healthy */}
      {critical.length === 0 && low.length === 0 && (
        <div className="bg-[#13151E] border border-[#252836] rounded-xl p-12 text-center">
          <div className="text-[32px] mb-3">✓</div>
          <div className="text-[14px] text-[#10B981] font-semibold">All stock levels are healthy</div>
          <div className="text-[12px] text-[#4A5068] mt-1">No alerts at this time</div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Panel({ title, badge, children, className = "" }: {
  title: string;
  badge: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between">
        <span className="font-display text-[14px] font-bold">{title}</span>
        {badge}
      </div>
      <div className="px-5 divide-y divide-[#252836]">{children}</div>
    </div>
  );
}

function AlertRow({ name, detail, level, stockLabel, cta }: {
  name: string;
  detail: string;
  level: "red" | "amber";
  stockLabel: string;
  cta: string;
}) {
  const color = level === "red" ? "#EF4444" : "#F59E0B";
  const bg    = level === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)";

  return (
    <div className="flex items-center gap-3.5 py-3.5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: bg, color }}
      >
        <Icon d={Icons.alert} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{name}</div>
        <div className="text-[11px] font-mono text-[#8B90A8] mt-0.5 truncate">{detail}</div>
      </div>
      <span
        className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
        style={{ background: bg, color }}
      >
        {stockLabel}
      </span>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836] hover:text-[#E8EAF0] transition-colors flex-shrink-0">
        <Icon d={Icons.order} size={12} />
        {cta}
      </button>
    </div>
  );
}
