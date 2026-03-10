// ─── Core domain types ────────────────────────────────────────────────────────

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  threshold: number;         // low-stock alert level
  supplier_id: number | null;
  barcode: string | null;
  image_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;

export interface Supplier {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export type SupplierInput = Omit<Supplier, "id" | "created_at">;

export interface SaleRecord {
  id: number;
  product_id: number;
  product_name: string;       // denormalised for reporting speed
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_revenue: number;
  total_cost: number;
  sold_at: string;            // ISO datetime
}

export type SaleInput = Omit<SaleRecord, "id">;

// ─── View / UI types ─────────────────────────────────────────────────────────

export type AlertLevel = "critical" | "low" | "ok";

export interface StockAlert {
  product: Product;
  level: AlertLevel;
}

export interface DailyStat {
  day: string;      // e.g. "Mon"
  date: string;     // ISO date
  revenue: number;
  units: number;
  profit: number;
}

export interface CategoryStat {
  category: string;
  revenue: number;
  units: number;
  pct: number;
}

// ─── DB command payloads (sent to Tauri backend) ──────────────────────────────

export interface DbResult<T> {
  data: T | null;
  ok: boolean;
  error?: string | null;
}

// ── Purchase Orders ───────────────────────────────────────────────────────────

export interface PurchaseOrder {
  id:            number;
  supplier_id:   number | null;
  status:        "draft" | "sent" | "partial" | "received" | "cancelled";
  notes:         string | null;
  ordered_at:    string | null;
  expected_at:   string | null;
  received_at:   string | null;
  created_at:    string;
  supplier_name: string | null;
  items_count:   number;
  total_cost:    number;
}

export interface PurchaseOrderInput {
  supplier_id: number | null;
  notes:       string | null;
  expected_at: string | null;
}

export interface PurchaseOrderItem {
  id:                number;
  purchase_order_id: number;
  product_id:        number | null;
  product_name:      string;
  quantity_ordered:  number;
  quantity_received: number;
  unit_cost:         number;
  created_at:        string;
}

export interface PurchaseOrderItemInput {
  purchase_order_id: number;
  product_id:        number | null;
  product_name:      string;
  quantity_ordered:  number;
  unit_cost:         number;
}

// ── Returns ───────────────────────────────────────────────────────────────────
export interface ReturnRecord {
  id:           number;
  sale_id:      number | null;
  product_id:   number;
  product_name: string;
  quantity:     number;
  unit_price:   number;
  unit_cost:    number;
  total_refund: number;
  reason:       string | null;
  restock:      boolean;
  returned_at:  string;
}

// ── EOD Report ────────────────────────────────────────────────────────────────
export interface EodReport {
  id:            number;
  report_date:   string;
  total_revenue: number;
  total_cost:    number;
  total_profit:  number;
  total_refunds: number;
  transactions:  number;
  top_product:   string | null;
  notes:         string | null;
  created_at:    string;
}