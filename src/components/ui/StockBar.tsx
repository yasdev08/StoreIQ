// src/components/ui/StockBar.tsx

interface StockBarProps {
  stock: number;
  threshold: number;
  max?: number;
}

export function StockBar({ stock, threshold, max = 50 }: StockBarProps) {
  const pct = Math.min((stock / max) * 100, 100);
  const color =
    stock === 0        ? "#EF4444"
    : stock <= threshold ? "#F59E0B"
    : "#10B981";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#1A1D2A] rounded-full overflow-hidden min-w-[50px]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="font-mono text-[12px] font-semibold min-w-[20px] text-right"
        style={{ color }}
      >
        {stock}
      </span>
    </div>
  );
}
