import { useStore } from "@/hooks/useStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon, Icons } from "./Icon";

export function Topbar({ pageTitle }: { pageTitle?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { activePage, searchQuery, setSearchQuery } = useStore();
  const showSearch = activePage === "products" || activePage === "dashboard";
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="h-[60px] min-h-[60px] border-b border-[#252836] px-7 flex items-center justify-between bg-[#13151E]">
      <h1 className="font-display text-[18px] font-bold tracking-tight">
        {pageTitle ?? "Overview"}
      </h1>
      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4A5068] pointer-events-none">
              <Icon d={Icons.search} size={15} />
            </span>
            <input
              className="bg-[#1A1D2A] border border-[#2E3248] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[#E8EAF0] outline-none w-[220px] focus:border-[#F59E0B] transition-colors placeholder:text-[#4A5068]"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1D2A] border border-[#252836] text-[#8B90A8] hover:text-[#E8EAF0] transition-colors text-[14px]"
          title={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <span className="text-[12px] text-[#4A5068] font-mono">{dateStr}</span>
      </div>
    </header>
  );
}
