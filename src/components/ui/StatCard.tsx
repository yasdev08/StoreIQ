// src/components/ui/StatCard.tsx

type CardAccent = "amber" | "green" | "red" | "blue";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: CardAccent;
}

const accentColor: Record<CardAccent, string> = {
  amber: "#F59E0B",
  green: "#10B981",
  red:   "#EF4444",
  blue:  "#6366F1",
};

export function StatCard({ label, value, sub, accent = "blue" }: StatCardProps) {
  const color = accentColor[accent];
  return (
    <div className="relative bg-[#13151E] border border-[#252836] rounded-xl p-5 overflow-hidden hover:border-[#2E3248] transition-colors">
      {/* bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: color }}
      />
      <div className="text-[11px] tracking-widest uppercase text-[#4A5068] font-mono mb-2">
        {label}
      </div>
      <div
        className="font-display text-[32px] font-extrabold leading-none tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[12px] text-[#8B90A8] mt-1.5">{sub}</div>
      )}
    </div>
  );
}
