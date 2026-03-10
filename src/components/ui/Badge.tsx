// src/components/ui/Badge.tsx

type BadgeVariant = "green" | "amber" | "red" | "blue" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
}

const styles: Record<BadgeVariant, string> = {
  green: "bg-[rgba(16,185,129,0.12)] text-[#10B981]",
  amber: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
  red:   "bg-[rgba(239,68,68,0.12)]  text-[#EF4444]",
  blue:  "bg-[rgba(99,102,241,0.12)] text-[#6366F1]",
  gray:  "bg-[#1A1D2A] text-[#8B90A8]",
};

export function Badge({ variant = "gray", dot = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide ${styles[variant]}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      )}
      {children}
    </span>
  );
}
