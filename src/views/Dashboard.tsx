// src/views/Dashboard.tsx
import { useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { StatCard } from "@/components/ui/StatCard";
import { StockBar } from "@/components/ui/StockBar";
import { Badge } from "@/components/ui/Badge";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CAT_COLORS = [
  "#F59E0B",
  "#10B981",
  "#6366F1",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
];
const tickStyle = { fill: "#4A5068", fontFamily: "DM Mono", fontSize: 11 };

export function Dashboard() {
  const { products, suppliers, weeklySummary, fetchSalesSummary } = useStore();

  const recentSales: any[] = [];

  useEffect(() => {
    fetchSalesSummary();
  }, []);

  // ── Real computed stats ────────────────────────────────────────────────────
  const totalRevenue = weeklySummary.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = weeklySummary.reduce((s, d) => s + d.profit, 0);
  const weeklyUnits = weeklySummary.reduce((s, d) => s + d.units, 0);
  const lowStock = products.filter((p) => p.stock <= p.threshold);
  const outOfStock = products.filter((p) => p.stock === 0);
  const inventoryValue = products.reduce((s, p) => s + p.stock * p.cost, 0);
  const margin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // Category from products for pie (falls back to sales categorySummary)
  const catMap: Record<string, number> = {};
  products.forEach((p) => {
    catMap[p.category] = (catMap[p.category] ?? 0) + 1;
  });
  const catData = Object.entries(catMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Format date
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
    <div className="space-y-5">
      {/* KPIs — row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Weekly Revenue"
          value={`$${Math.round(totalRevenue).toLocaleString()}`}
          sub={`${weeklyUnits} units sold`}
          accent="amber"
        />
        <StatCard
          label="Gross Profit"
          value={`$${Math.round(totalProfit).toLocaleString()}`}
          sub={`${margin}% margin`}
          accent="green"
        />
        <StatCard
          label="Inventory Value"
          value={`$${Math.round(inventoryValue).toLocaleString()}`}
          sub={`${products.length} products`}
          accent="blue"
        />
        <StatCard
          label="Stock Alerts"
          value={lowStock.length}
          sub={`${outOfStock.length} out of stock`}
          accent="red"
        />
      </div>

      {/* KPIs — row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={products.length}
          sub={`${Object.keys(catMap).length} categories`}
          accent="blue"
        />
        <StatCard
          label="Active Suppliers"
          value={suppliers.filter((s) => s.status === "active").length}
          sub="Linked suppliers"
          accent="green"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStock.length}
          sub="Need immediate restock"
          accent="red"
        />
        <StatCard
          label="Low Stock"
          value={lowStock.length - outOfStock.length}
          sub="Below threshold"
          accent="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        {/* Revenue bar chart — real data */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between">
            <span className="font-display text-[14px] font-bold">
              Weekly Revenue
            </span>
            {weeklySummary.length === 0 ? (
              <Badge variant="gray">No sales yet</Badge>
            ) : (
              <Badge variant="green" dot>
                Live data
              </Badge>
            )}
          </div>
          <div className="p-5 pt-3">
            {weeklySummary.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-[12px] text-[#4A5068]">
                Record your first sale to see revenue data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklySummary} barCategoryGap="30%">
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
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(245,158,11,0.05)" }}
                  />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category pie — from products */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#252836]">
            <span className="font-display text-[14px] font-bold">
              By Category
            </span>
          </div>
          {catData.length === 0 ? (
            <div className="p-5 text-center text-[12px] text-[#4A5068]">
              Add products to see breakdown
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center gap-3">
              <PieChart width={130} height={130}>
                <Pie
                  data={catData}
                  cx={60}
                  cy={60}
                  innerRadius={34}
                  outerRadius={60}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {catData.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="w-full flex flex-col gap-1.5">
                {catData.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}
                    />
                    <span className="flex-1 text-[#8B90A8] truncate">
                      {c.name}
                    </span>
                    <span className="font-mono font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row — recent sales + low stock */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Sales */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#252836]">
            <span className="font-display text-[14px] font-bold">
              Recent Sales
            </span>
          </div>
          {!recentSales || recentSales.length === 0 ? (
            <div className="px-5 py-10 text-center text-[12px] text-[#4A5068]">
              No sales recorded yet
            </div>
          ) : (
            <div className="divide-y divide-[#252836]">
              {recentSales.slice(0, 8).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {sale.product_name}
                    </div>
                    <div className="text-[11px] text-[#4A5068] font-mono">
                      {fmtDate(sale.sold_at)}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#8B90A8] font-mono">
                    {sale.quantity}×
                  </span>
                  <span className="text-[13px] font-bold font-mono text-[#F59E0B]">
                    ${Number(sale.total_revenue).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between">
            <span className="font-display text-[14px] font-bold">
              Stock Alerts
            </span>
            {lowStock.length > 0 && (
              <Badge variant="red" dot>
                {lowStock.length}
              </Badge>
            )}
          </div>
          {lowStock.length === 0 ? (
            <div className="px-5 py-10 text-center text-[12px] text-[#10B981]">
              ✓ All stock levels healthy
            </div>
          ) : (
            <div className="divide-y divide-[#252836]">
              {lowStock.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#4A5068]">
                      {p.sku}
                    </div>
                  </div>
                  <div className="w-[100px]">
                    <StockBar stock={p.stock} threshold={p.threshold} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
