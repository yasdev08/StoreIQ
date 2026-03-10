// src/components/charts/ChartTooltip.tsx

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

export function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg px-3.5 py-2.5 text-[12px] font-mono">
      <div className="text-[#4A5068] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="font-medium">
          {p.name}:{" "}
          {p.name === "revenue" || p.name === "profit"
            ? "$" + p.value.toLocaleString()
            : p.value}
        </div>
      ))}
    </div>
  );
}
