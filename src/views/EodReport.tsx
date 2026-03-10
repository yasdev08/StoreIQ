// src/views/EodReport.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { exportSalesCSV } from "@/utils/export";
import { useStore } from "@/hooks/useStore";
import type { EodReport } from "@/types";

const fmt = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function EodReportView() {
  const { recentSales } = useStore();
  const [reports, setReports] = useState<EodReport[]>([]);
  const [today, setToday] = useState<EodReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const load = async () => {
    try {
      const r = await invoke<{ ok: boolean; data: EodReport[] }>(
        "get_eod_reports",
        { limit: 30 },
      );
      if (r.ok) {
        setReports(r.data ?? []);
        const t = (r.data ?? []).find(
          (x) => x.report_date === new Date().toISOString().split("T")[0],
        );
        setToday(t ?? null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await invoke<{
        ok: boolean;
        data: EodReport;
        error: string | null;
      }>("generate_eod_report", { date: selectedDate });
      if (r.ok) {
        await load();
      } else alert(r.error ?? "Failed");
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const margin = (r: EodReport) =>
    r.total_revenue > 0
      ? Math.round((r.total_profit / r.total_revenue) * 100)
      : 0;

  return (
    <div className="max-w-[900px]">
      {/* Generate bar */}
      <div className="flex items-center gap-3 mb-5 bg-[#13151E] border border-[#252836] rounded-xl px-5 py-4">
        <span className="text-[13px] text-[#8B90A8]">Generate report for:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-[#0C0E14] border border-[#2E3248] rounded-lg px-3 py-2 text-[13px] text-[#E8EAF0] outline-none focus:border-[#F59E0B]"
        />
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F59E0B] text-[#0C0E14] hover:bg-[#FBBF24] disabled:opacity-50"
        >
          {generating ? "Generating…" : "⚡ Generate"}
        </button>
        <button
          onClick={() => exportSalesCSV(recentSales ?? []).catch(console.error)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#1A1D2A] text-[#8B90A8] border border-[#252836] hover:text-white ml-auto"
        >
          ↓ Export Sales CSV
        </button>
      </div>

      {/* Today's report — big card */}
      {today && (
        <div className="bg-[#13151E] border border-[#F59E0B]/30 rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#252836] flex items-center justify-between">
            <div>
              <span className="font-display text-[15px] font-bold">
                Today — {fmtDate(today.report_date)}
              </span>
              <span className="ml-3 text-[11px] font-mono text-[#4A5068]">
                {today.transactions} transactions
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#F59E0B] bg-[rgba(245,158,11,0.1)] px-2.5 py-1 rounded-md border border-[rgba(245,158,11,0.2)]">
              TODAY
            </span>
          </div>
          <div className="p-5 grid grid-cols-5 gap-4">
            {[
              ["Revenue", fmt(today.total_revenue), "text-[#E8EAF0]"],
              ["Cost", fmt(today.total_cost), "text-[#8B90A8]"],
              ["Refunds", fmt(today.total_refunds), "text-[#EF4444]"],
              ["Profit", fmt(today.total_profit), "text-[#10B981]"],
              ["Margin", `${margin(today)}%`, "text-[#F59E0B]"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="bg-[#0C0E14] rounded-xl p-4 border border-[#252836]"
              >
                <div className="text-[10px] tracking-widest uppercase text-[#4A5068] font-mono mb-1.5">
                  {label}
                </div>
                <div className={`text-[22px] font-bold font-mono ${color}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          {today.top_product && (
            <div className="px-5 pb-4 text-[12px] text-[#8B90A8]">
              🏆 Top product today:{" "}
              <span className="text-[#E8EAF0] font-semibold">
                {today.top_product}
              </span>
            </div>
          )}
        </div>
      )}

      {/* History table */}
      <div className="bg-[#13151E] border border-[#252836] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#252836]">
          <span className="font-display text-[14px] font-bold">
            Report History
          </span>
        </div>
        {reports.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#4A5068]">
            No reports yet. Select a date and click Generate.
          </div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {[
                  "Date",
                  "Transactions",
                  "Revenue",
                  "Cost",
                  "Refunds",
                  "Profit",
                  "Margin",
                  "Top Product",
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
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-[#1A1D2A] transition-colors">
                  <td className="px-3.5 py-3 border-b border-[#252836] font-semibold">
                    {fmtDate(r.report_date)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono text-[#8B90A8]">
                    {r.transactions}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono">
                    {fmt(r.total_revenue)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono text-[#8B90A8]">
                    {fmt(r.total_cost)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono text-[#EF4444]">
                    {fmt(r.total_refunds)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] font-mono text-[#10B981] font-bold">
                    {fmt(r.total_profit)}
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836]">
                    <span
                      className={`font-mono font-bold ${margin(r) > 30 ? "text-[#10B981]" : margin(r) > 15 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}
                    >
                      {margin(r)}%
                    </span>
                  </td>
                  <td className="px-3.5 py-3 border-b border-[#252836] text-[12px] text-[#8B90A8] truncate max-w-[140px]">
                    {r.top_product ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
