/**
 * db/index.ts
 * All SQLite interactions go through Tauri's `invoke` bridge.
 * Each function maps 1-to-1 to a Rust command in src-tauri/src/commands.rs
 *
 * In dev (browser), we fall back to mock data so you can run `npm run dev`
 * without needing the full Tauri environment.
 */

import { invoke } from "@tauri-apps/api/tauri";
import type {
  Product, ProductInput,
  Supplier, SupplierInput,
  SaleRecord, SaleInput,
  DbResult,
} from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────

const isTauri = () =>
  typeof window !== "undefined" && "__TAURI__" in window;

async function call<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!isTauri()) {
    console.warn(`[db] Tauri not available – skipped: ${cmd}`);
    return [] as unknown as T;
  }
  try {
    const res = await invoke<DbResult<T>>(cmd, args);
    if (!res.ok) throw new Error(res.error ?? `Command ${cmd} failed`);
    return res.data as T;
  } catch (e) {
    console.error(`[db] ${cmd} failed:`, e);
    throw e;
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

export const db = {
  products: {
    getAll: () =>
      call<Product[]>("get_products"),

    getById: (id: number) =>
      call<Product>("get_product", { id }),

    getByBarcode: (barcode: string) =>
      call<Product | null>("get_product_by_barcode", { barcode }),

    create: (input: ProductInput) =>
      call<Product>("create_product", { input }),

    update: (id: number, input: Partial<ProductInput>) =>
      call<Product>("update_product", { id, input }),

    delete: (id: number) =>
      call<void>("delete_product", { id }),

    adjustStock: (id: number, delta: number) =>
      call<Product>("adjust_stock", { id, delta }),
  },

  // ── Suppliers ───────────────────────────────────────────────────────────────

  suppliers: {
    getAll: () =>
      call<Supplier[]>("get_suppliers"),

    create: (input: SupplierInput) =>
      call<Supplier>("create_supplier", { input }),

    update: (id: number, input: Partial<SupplierInput>) =>
      call<Supplier>("update_supplier", { id, input }),

    delete: (id: number) =>
      call<void>("delete_supplier", { id }),
  },

  // ── Sales ────────────────────────────────────────────────────────────────────

  sales: {
    getRange: (from: string, to: string) =>
      call<SaleRecord[]>("get_sales_range", { from, to }),

    record: (input: SaleInput) =>
      call<SaleRecord>("record_sale", { input }),

    getWeeklySummary: () =>
      call<{ day: string; revenue: number; units: number; profit: number }[]>("get_weekly_summary"),

    getCategorySummary: () =>
      call<{ category: string; revenue: number; units: number }[]>("get_category_summary"),
  },

  // ── Backup ───────────────────────────────────────────────────────────────────

  backup: {
    export: (destPath: string) =>
      call<void>("backup_database", { destPath }),

    import: (srcPath: string) =>
      call<void>("restore_database", { srcPath }),
  },
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

import type { PurchaseOrder, PurchaseOrderInput, PurchaseOrderItem, PurchaseOrderItemInput } from "@/types";

export const dbPO = {
  getAll: () =>
    call<PurchaseOrder[]>("get_purchase_orders"),

  getItems: (orderId: number) =>
    call<PurchaseOrderItem[]>("get_order_items", { orderId }),

  create: (input: PurchaseOrderInput) =>
    call<PurchaseOrder>("create_purchase_order", { input }),

  updateStatus: (id: number, status: string) =>
    call<PurchaseOrder>("update_order_status", { id, status }),

  addItem: (input: PurchaseOrderItemInput) =>
    call<PurchaseOrderItem>("add_order_item", { input }),

  receiveItem: (itemId: number, quantityReceived: number) =>
    call<void>("receive_order_item", { itemId, quantityReceived }),

  delete: (id: number) =>
    call<void>("delete_purchase_order", { id }),
};

// ── Recent Sales ──────────────────────────────────────────────────────────────
export const dbSales = {
  getRecent: (limit: number) =>
    call<import("@/types").SaleRecord[]>("get_recent_sales", { limit }),
};

// ── Image upload ──────────────────────────────────────────────────────────────
export async function saveProductImage(srcPath: string, sku: string): Promise<string> {
  return call<string>("save_product_image", { srcPath, sku });
}