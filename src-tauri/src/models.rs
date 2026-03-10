// src-tauri/src/models.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: i64,
    pub sku: String,
    pub name: String,
    pub category: String,
    pub price: f64,
    pub cost: f64,
    pub stock: i64,
    pub threshold: i64,
    pub supplier_id: Option<i64>,
    pub barcode: Option<String>,
    pub image_path: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct ProductInput {
    pub sku: String,
    pub name: String,
    pub category: String,
    pub price: f64,
    pub cost: f64,
    pub stock: i64,
    pub threshold: i64,
    pub supplier_id: Option<i64>,
    pub barcode: Option<String>,
    pub image_path: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Supplier {
    pub id: i64,
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SupplierInput {
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaleRecord {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub unit_cost: f64,
    pub total_revenue: f64,
    pub total_cost: f64,
    pub sold_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SaleInput {
    pub product_id: i64,
    pub product_name: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub unit_cost: f64,
    pub sold_at: String,
}

/// Generic response wrapper sent back to the frontend
#[derive(Debug, Serialize)]
pub struct DbResult<T: Serialize> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> DbResult<T> {
    pub fn ok(data: T) -> Self {
        Self { ok: true, data: Some(data), error: None }
    }
    pub fn err(msg: impl Into<String>) -> Self {
        Self { ok: false, data: None, error: Some(msg.into()) }
    }
}

// ── Purchase Orders ───────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PurchaseOrder {
    pub id:          i64,
    pub supplier_id: Option<i64>,
    pub status:      String,
    pub notes:       Option<String>,
    pub ordered_at:  Option<String>,
    pub expected_at: Option<String>,
    pub received_at: Option<String>,
    pub created_at:  String,
    // joined from supplier
    pub supplier_name: Option<String>,
    // aggregated
    pub items_count:   i64,
    pub total_cost:    f64,
}

#[derive(Debug, Deserialize)]
pub struct PurchaseOrderInput {
    pub supplier_id: Option<i64>,
    pub notes:       Option<String>,
    pub ordered_at:  Option<String>,
    pub expected_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PurchaseOrderItem {
    pub id:                i64,
    pub purchase_order_id: i64,
    pub product_id:        Option<i64>,
    pub product_name:      String,
    pub quantity_ordered:  i64,
    pub quantity_received: i64,
    pub unit_cost:         f64,
    pub created_at:        String,
}

#[derive(Debug, Deserialize)]
pub struct PurchaseOrderItemInput {
    pub purchase_order_id: i64,
    pub product_id:        Option<i64>,
    pub product_name:      String,
    pub quantity_ordered:  i64,
    pub unit_cost:         f64,
}

// ── Returns ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReturnRecord {
    pub id:           i64,
    pub sale_id:      Option<i64>,
    pub product_id:   i64,
    pub product_name: String,
    pub quantity:     i64,
    pub unit_price:   f64,
    pub unit_cost:    f64,
    pub total_refund: f64,
    pub reason:       Option<String>,
    pub restock:      bool,
    pub returned_at:  String,
}

#[derive(Debug, Deserialize)]
pub struct ReturnInput {
    pub sale_id:    Option<i64>,
    pub product_id: i64,
    pub product_name: String,
    pub quantity:   i64,
    pub unit_price: f64,
    pub unit_cost:  f64,
    pub reason:     Option<String>,
    pub restock:    bool,
}

// ── EOD Report ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EodReport {
    pub id:            i64,
    pub report_date:   String,
    pub total_revenue: f64,
    pub total_cost:    f64,
    pub total_profit:  f64,
    pub total_refunds: f64,
    pub transactions:  i64,
    pub top_product:   Option<String>,
    pub notes:         Option<String>,
    pub created_at:    String,
}