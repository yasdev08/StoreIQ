import { create } from "zustand";
import { db, dbPO, dbSales } from "@/db";
import type {
  Product, ProductInput, Supplier, SupplierInput, StockAlert, SaleInput, SaleRecord,
  PurchaseOrder, PurchaseOrderInput, PurchaseOrderItem, PurchaseOrderItemInput
} from "@/types";

function computeAlerts(products: Product[]): StockAlert[] {
  return products
    .filter(p => p.stock <= p.threshold)
    .map(p => ({ product: p, level: p.stock === 0 ? ("critical" as const) : ("low" as const) }))
    .sort(a => a.level === "critical" ? -1 : 1);
}

export interface DailySummary    { day: string; revenue: number; units: number; profit: number; }
export interface CategorySummary { category: string; revenue: number; units: number; }

type Store = {
  // Products
  products: Product[]; alerts: StockAlert[]; productsLoading: boolean;
  fetchProducts:  () => Promise<void>;
  createProduct:  (i: ProductInput) => Promise<void>;
  updateProduct:  (id: number, i: ProductInput) => Promise<void>;
  deleteProduct:  (id: number) => Promise<void>;
  adjustStock:    (id: number, delta: number) => Promise<void>;
  // Suppliers
  suppliers: Supplier[]; suppliersLoading: boolean;
  fetchSuppliers:  () => Promise<void>;
  createSupplier:  (i: SupplierInput) => Promise<void>;
  updateSupplier:  (id: number, i: SupplierInput) => Promise<void>;
  deleteSupplier:  (id: number) => Promise<void>;
  // Sales
  weeklySummary: DailySummary[]; categorySummary: CategorySummary[];
  recentSales: SaleRecord[]; salesLoading: boolean;
  fetchSalesSummary: () => Promise<void>;
  recordSale: (i: SaleInput) => Promise<void>;
  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  orderItems: Record<number, PurchaseOrderItem[]>;
  ordersLoading: boolean;
  fetchOrders:       () => Promise<void>;
  createOrder:       (i: PurchaseOrderInput) => Promise<PurchaseOrder | null>;
  updateOrderStatus: (id: number, status: string) => Promise<void>;
  addOrderItem:      (i: PurchaseOrderItemInput) => Promise<void>;
  receiveOrderItem:  (itemId: number, qty: number) => Promise<void>;
  deleteOrder:       (id: number) => Promise<void>;
  fetchOrderItems:   (orderId: number) => Promise<void>;
  // UI
  activePage: string; setActivePage: (p: string) => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
};

export const useStore = create<Store>((set, get) => ({
  // ── Products ────────────────────────────────────────────────────────────────
  products: [], alerts: [], productsLoading: false,

  fetchProducts: async () => {
    set({ productsLoading: true });
    try { const products = await db.products.getAll(); set({ products, alerts: computeAlerts(products) }); }
    catch(e) { console.error("[store] fetchProducts:", e); }
    finally { set({ productsLoading: false }); }
  },
  createProduct:  async (i) => { await db.products.create(i);         await get().fetchProducts(); },
  updateProduct:  async (id,i) => { await db.products.update(id,i);   await get().fetchProducts(); },
  deleteProduct:  async (id) => { await db.products.delete(id);       await get().fetchProducts(); },
  adjustStock:    async (id,d) => { await db.products.adjustStock(id,d); await get().fetchProducts(); },

  // ── Suppliers ───────────────────────────────────────────────────────────────
  suppliers: [], suppliersLoading: false,

  fetchSuppliers: async () => {
    set({ suppliersLoading: true });
    try { const suppliers = await db.suppliers.getAll(); set({ suppliers }); }
    catch(e) { console.error("[store] fetchSuppliers:", e); }
    finally { set({ suppliersLoading: false }); }
  },
  createSupplier:  async (i) => { await db.suppliers.create(i);        await get().fetchSuppliers(); },
  updateSupplier:  async (id,i) => { await db.suppliers.update(id,i);  await get().fetchSuppliers(); },
  deleteSupplier:  async (id) => { await db.suppliers.delete(id);      await get().fetchSuppliers(); },

  // ── Sales ───────────────────────────────────────────────────────────────────
  weeklySummary: [], categorySummary: [], recentSales: [], salesLoading: false,

  fetchSalesSummary: async () => {
    set({ salesLoading: true });
    try {
      const [weeklySummary, categorySummary, recentSales] = await Promise.all([
        db.sales.getWeeklySummary(),
        db.sales.getCategorySummary(),
        dbSales.getRecent(20),
      ]);
      set({ weeklySummary, categorySummary, recentSales });
    } catch(e) { console.error("[store] fetchSalesSummary:", e); }
    finally { set({ salesLoading: false }); }
  },

  recordSale: async (i) => {
    await db.sales.record(i);
    await Promise.all([get().fetchProducts(), get().fetchSalesSummary()]);
  },

  // ── Purchase Orders ─────────────────────────────────────────────────────────
  purchaseOrders: [], orderItems: {}, ordersLoading: false,

  fetchOrders: async () => {
    set({ ordersLoading: true });
    try { const purchaseOrders = await dbPO.getAll(); set({ purchaseOrders }); }
    catch(e) { console.error("[store] fetchOrders:", e); }
    finally { set({ ordersLoading: false }); }
  },

  fetchOrderItems: async (orderId) => {
    try {
      const items = await dbPO.getItems(orderId);
      set(s => ({ orderItems: { ...s.orderItems, [orderId]: items } }));
    } catch(e) { console.error("[store] fetchOrderItems:", e); }
  },

  createOrder: async (i) => {
    try {
      const order = await dbPO.create(i);
      await get().fetchOrders();
      return order;
    } catch(e) { console.error("[store] createOrder:", e); return null; }
  },

  updateOrderStatus: async (id, status) => {
    await dbPO.updateStatus(id, status);
    await get().fetchOrders();
  },

  addOrderItem: async (i) => {
    await dbPO.addItem(i);
    await get().fetchOrderItems(i.purchase_order_id);
  },

  receiveOrderItem: async (itemId, qty) => {
    await dbPO.receiveItem(itemId, qty);
    await get().fetchProducts(); // stock updated
  },

  deleteOrder: async (id) => {
    await dbPO.delete(id);
    await get().fetchOrders();
  },

  // ── UI ──────────────────────────────────────────────────────────────────────
  activePage: "dashboard",
  setActivePage: p => set({ activePage: p }),
  searchQuery: "",
  setSearchQuery: q => set({ searchQuery: q }),
}));