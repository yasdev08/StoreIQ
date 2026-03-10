import { useStore } from "@/hooks/useStore";
import { Icon, Icons } from "./Icon";
import { db } from "@/db";
import { save } from "@tauri-apps/api/dialog";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "scanner", label: "POS Terminal", icon: Icons.scan, badge: false },
  { id: "products", label: "Products", icon: Icons.box },
  { id: "alerts", label: "Alerts", icon: Icons.alert, badge: true },
  { id: "suppliers", label: "Suppliers", icon: Icons.suppliers },
  { id: "purchase-orders", label: "Purchase Orders", icon: Icons.order },
  { id: "sales", label: "Sales", icon: Icons.chart },
  { id: "returns", label: "Returns", icon: Icons.undo },
  { id: "eod-report", label: "EOD Report", icon: Icons.report },
  { id: "expiry", label: "Expiry Tracking", icon: Icons.calendar },
];

export function Sidebar() {
  const { activePage, setActivePage, alerts, fetchOrders } = useStore();
  const alertCount = alerts.length;

  const handleNav = (id: string) => {
    setActivePage(id);
    if (id === "purchase-orders") fetchOrders();
  };

  const handleBackup = async () => {
    try {
      const dest = await save({
        defaultPath: "storeiq-backup.db",
        filters: [{ name: "Database", extensions: ["db"] }],
      });
      if (dest) await db.backup.export(dest);
    } catch (e) {
      console.error("Backup failed:", e);
    }
  };

  return (
    <aside className="relative w-[220px] min-w-[220px] bg-[#13151E] border-r border-[#252836] flex flex-col overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F59E0B] to-transparent" />
      <div className="px-5 pt-6 pb-5 border-b border-[#252836]">
        <div className="font-display text-[22px] font-extrabold tracking-tight">
          Store<span className="text-[#F59E0B]">IQ</span>
        </div>
        <div className="text-[10px] tracking-[1.5px] text-[#4A5068] uppercase font-mono mt-0.5">
          Inventory System
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => handleNav(n.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium w-full text-left transition-all border ${
              activePage === n.id
                ? "text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.2)]"
                : "text-[#8B90A8] bg-transparent border-transparent hover:text-[#E8EAF0] hover:bg-[#1A1D2A]"
            }`}
          >
            <Icon d={n.icon} size={15} />
            {n.label}
            {n.badge && alertCount > 0 && (
              <span className="ml-auto bg-[#EF4444] text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-[#252836] pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#1A1D2A] border border-[#252836]">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
          <div className="overflow-hidden">
            <div className="text-[12px] font-semibold truncate">
              Client Store
            </div>
            <div className="text-[10px] text-[#10B981] font-mono">● Online</div>
          </div>
        </div>
        <button
          onClick={handleBackup}
          className="flex items-center justify-center gap-2 w-full mt-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-[#8B90A8] bg-[#1A1D2A] border border-[#252836] hover:text-[#E8EAF0] transition-all"
        >
          <Icon d={Icons.backup} size={13} /> Backup Data
        </button>
      </div>
    </aside>
  );
}
