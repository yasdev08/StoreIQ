// src/components/ui/Icon.tsx

interface IconProps {
  d: string;
  size?: number;
  stroke?: string;
  className?: string;
}

export function Icon({
  d,
  size = 20,
  stroke = "currentColor",
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export const Icons = {
  dashboard:
    "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3a4 4 0 100 8 4 4 0 000-8z",
  box: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  alert:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01",
  suppliers:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  chart: "M18 20V10M12 20V4M6 20v-6",
  scan: "M3 5h2M7 3v2M17 3v2M19 5h2M3 19h2M7 21v-2M17 21v-2M19 19h2M7 7h10v10H7z",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  backup:
    "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  chevron: "M9 18l6-6-6-6",
  order:
    "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  undo: "M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13",
  report:
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8m8 4H8m2-8H8",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
};
