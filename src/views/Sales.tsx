// src/views/Sales.tsx
import { useEffect, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { StatCard } from "@/components/ui/StatCard";
import { exportSalesCSV } from "@/utils/export";
import { Badge } from "@/components/ui/Badge";
import { Icon, Icons } from "@/components/ui/Icon";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const tickStyle = { fill: "#4A5068", fontFamily: "DM Mono", fontSize: 11 };

export function Sales() {
  const {
    products,
    weeklySummary,
    categorySummary,
    salesLoading,
    fetchSalesSummary,
    recordSale,
  } = useStore();

  // Quick-sale modal state
  const [saleProduct, setSaleProduct] = useState<number | "">("");
  const [saleQty, setSaleQty] = useState(1);
  const [saleMsg, setSaleMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSalesSummary();
  }, []);

  // Computed totals from real data
  const totalRevenue = weeklySummary.reduce((s, d) => s + d.revenue, 0);
  const totalUnits = weeklySummary.reduce((s, d) => s + d.units, 0);
  const totalProfit = weeklySummary.reduce((s, d) => s + d.profit, 0);
  const margin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const handleSale = async () => {
    if (!saleProduct) {
      setSaleMsg("Select a product");
      return;
    }
    const product = products.find((p) => p.id === Number(saleProduct));
    if (!product) return;
    if (saleQty > product.stock) {
      setSaleMsg("❌ Not enough stock");
      return;
    }
    setSaving(true);
    setSaleMsg(null);
    try {
      await recordSale({
        product_id: product.id,
        product_name: product.name,
        quantity: saleQty,
        unit_price: product.price,
        unit_cost: product.cost,
        total_revenue: product.price * saleQty,
        total_cost: product.cost * saleQty,
        sold_at: new Date().toISOString(),
      });
      setSaleMsg(
        `✓ Sold ${saleQty}× ${product.name} — $${(product.price * saleQty).toFixed(2)}`,
      );
      setSaleProduct("");
      setSaleQty(1);
    } catch (e) {
      setSaleMsg(`❌ ${e instanceof Error ? e.message : "Error"}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === Number(saleProduct));

  return (
    <div>
      {/* Quick Sale panel */}
      <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between">
          <span className="font-display text-[14px] font-bold">
            Record a Sale
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportSalesCSV([]).catch(console.error)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836] hover:text-white transition-colors"
            >
              ↓ Export Sales CSV
            </button>
            <Badge variant="green" dot>
              Quick Sale
            </Badge>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-3 flex-wrap">
            {/* Product picker */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                Product
              </label>
              <select
                className="w-full bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2.5 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B] transition-colors"
                value={saleProduct}
                onChange={(e) => {
                  setSaleProduct(e.target.value as "" | number);
                  setSaleQty(1);
                  setSaleMsg(null);
                }}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.name} — ${Number(p.price).toFixed(2)} ({p.stock} in
                    stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Qty */}
            <div>
              <label className="block text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                Qty
              </label>
              <div className="flex items-center gap-2 bg-[#0C0E14] border border-[#2E3248] rounded-lg overflow-hidden">
                <button
                  onClick={() => setSaleQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-[#8B90A8] hover:text-white hover:bg-[#1A1D2A] transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-mono font-bold text-[14px]">
                  {saleQty}
                </span>
                <button
                  onClick={() =>
                    setSaleQty((q) =>
                      Math.min(selectedProduct?.stock ?? 99, q + 1),
                    )
                  }
                  className="px-3 py-2.5 text-[#8B90A8] hover:text-white hover:bg-[#1A1D2A] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            {selectedProduct && (
              <div className="text-[13px] text-[#8B90A8] font-mono pb-2.5">
                Total:{" "}
                <span className="text-[#F59E0B] font-bold text-[16px]">
                  ${(selectedProduct.price * saleQty).toFixed(2)}
                </span>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleSale}
              disabled={saving || !saleProduct}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-40 transition-all pb-2.5"
            >
              <Icon d={Icons.check} size={14} />
              {saving ? "Saving…" : "Confirm Sale"}
            </button>
          </div>

          {saleMsg && (
            <div
              className={`mt-3 text-[12px] font-mono px-3 py-2 rounded-lg border ${
                saleMsg.startsWith("✓")
                  ? "bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)] text-[#10B981]"
                  : "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)] text-[#EF4444]"
              }`}
            >
              {saleMsg}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Weekly Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          sub="Last 7 days"
          accent="amber"
        />
        <StatCard
          label="Units Sold"
          value={totalUnits}
          sub="Last 7 days"
          accent="green"
        />
        <StatCard
          label="Gross Profit"
          value={`$${totalProfit.toLocaleString()}`}
          sub="Revenue − cost"
          accent="blue"
        />
        <StatCard
          label="Gross Margin"
          value={`${margin}%`}
          sub="Profit / Revenue"
          accent="green"
        />
      </div>

      {/* Charts */}
      {weeklySummary.length === 0 ? (
        <div className="bg-[#13151E] border border-[#252836] rounded-xl p-12 text-center">
          {salesLoading ? (
            <div className="text-[13px] text-[#4A5068] animate-pulse">
              Loading sales data…
            </div>
          ) : (
            <>
              <div className="text-[32px] mb-3">📊</div>
              <div className="text-[14px] text-[#8B90A8] font-semibold">
                No sales recorded yet
              </div>
              <div className="text-[12px] text-[#4A5068] mt-1">
                Use the Quick Sale panel above to record your first sale
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Revenue line */}
          <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-[#252836]">
              <span className="font-display text-[14px] font-bold">
                Daily Revenue — Last 7 Days
              </span>
            </div>
            <div className="p-5 pt-3">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklySummary}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    tick={tickStyle}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ fill: "#F59E0B", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Units bar */}
            <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#252836]">
                <span className="font-display text-[14px] font-bold">
                  Units Sold by Day
                </span>
              </div>
              <div className="p-5 pt-3">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklySummary} barCategoryGap="35%">
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={tickStyle}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={tickStyle} />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: "rgba(16,185,129,0.05)" }}
                    />
                    <Bar dataKey="units" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#252836]">
                <span className="font-display text-[14px] font-bold">
                  Revenue by Category
                </span>
              </div>
              <div className="px-5 divide-y divide-[#252836]">
                {categorySummary.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-[#4A5068]">
                    No category data yet
                  </div>
                ) : (
                  categorySummary.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <span className="flex-1 text-[13px] font-medium">
                        {c.category}
                      </span>
                      <span className="text-[12px] text-[#8B90A8] font-mono">
                        {c.units}u
                      </span>
                      <span className="text-[12px] text-[#F59E0B] font-bold font-mono w-16 text-right">
                        ${Number(c.revenue).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
