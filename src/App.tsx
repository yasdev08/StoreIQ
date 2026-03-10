import { useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { Sidebar } from "@/components/ui/Sidebar";
import { Topbar } from "@/components/ui/Topbar";
import { Dashboard } from "@/views/Dashboard";
import { Products } from "@/views/Products";
import { Alerts } from "@/views/Alerts";
import { Suppliers } from "@/views/Suppliers";
import { PurchaseOrders } from "@/views/PurchaseOrders";
import { Scanner } from "@/views/Scanner";
import { Sales } from "@/views/Sales";
import { Returns } from "@/views/Returns";
import { EodReportView } from "@/views/EodReport";
import { ExpiryTracking } from "@/views/Expiry";

const VIEWS: Record<string, JSX.Element> = {
  dashboard: <Dashboard />,
  products: <Products />,
  alerts: <Alerts />,
  suppliers: <Suppliers />,
  "purchase-orders": <PurchaseOrders />,
  scanner: <Scanner />,
  sales: <Sales />,
  returns: <Returns />,
  "eod-report": <EodReportView />,
  expiry: <ExpiryTracking />,
};

const TITLES: Record<string, string> = {
  dashboard: "Overview",
  products: "Products",
  alerts: "Stock Alerts",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  scanner: "POS Terminal",
  sales: "Sales Dashboard",
  returns: "Returns & Refunds",
  "eod-report": "End-of-Day Report",
  expiry: "Expiry Tracking",
};

export default function App() {
  const {
    activePage,
    fetchProducts,
    fetchSuppliers,
    fetchSalesSummary,
    fetchOrders,
  } = useStore();

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchSalesSummary();
    fetchOrders();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0C0E14]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar pageTitle={TITLES[activePage] ?? "Overview"} />
        <main className="flex-1 overflow-y-auto p-7">
          {VIEWS[activePage] ?? <Dashboard />}
        </main>
      </div>
    </div>
  );
}
