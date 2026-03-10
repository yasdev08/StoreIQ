/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        bg: "#0C0E14",
        surface: "#13151E",
        surface2: "#1A1D2A",
        border: "#252836",
        border2: "#2E3248",
        amber: {
          DEFAULT: "#F59E0B",
          dim: "rgba(245,158,11,0.12)",
          glow: "rgba(245,158,11,0.25)",
        },
        emerald: {
          DEFAULT: "#10B981",
          dim: "rgba(16,185,129,0.12)",
        },
        danger: {
          DEFAULT: "#EF4444",
          dim: "rgba(239,68,68,0.12)",
        },
        indigo: {
          DEFAULT: "#6366F1",
          dim: "rgba(99,102,241,0.12)",
        },
      },
    },
  },
  plugins: [],
};
