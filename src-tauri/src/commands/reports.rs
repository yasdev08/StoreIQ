// src-tauri/src/commands/reports.rs
use crate::db::conn;
use crate::models::{DbResult, EodReport, Product};
use rusqlite::params;
use serde::Serialize;

#[derive(Serialize)]
pub struct ExpiryProduct {
    pub id:                i64,
    pub name:              String,
    pub sku:               String,
    pub category:          String,
    pub stock:             i64,
    pub expiry_date:       String,
    pub days_until_expiry: i64,
}

// ── EOD Report ────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn generate_eod_report(date: String) -> DbResult<EodReport> {
    let new_id = {
        let db = conn();

        // Aggregate sales for the day
        let sales_row: (f64, f64, i64, Option<String>) = db.query_row(
            "SELECT
               COALESCE(SUM(total_revenue), 0),
               COALESCE(SUM(total_cost), 0),
               COUNT(*),
               (SELECT product_name FROM sales
                WHERE date(sold_at) = ?1
                GROUP BY product_name ORDER BY SUM(quantity) DESC LIMIT 1)
             FROM sales WHERE date(sold_at) = ?1",
            params![date],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        ).unwrap_or((0.0, 0.0, 0, None));

        // Aggregate refunds for the day
        let refunds: f64 = db.query_row(
            "SELECT COALESCE(SUM(total_refund), 0) FROM returns WHERE date(returned_at) = ?1",
            params![date],
            |r| r.get(0),
        ).unwrap_or(0.0);

        let revenue = sales_row.0;
        let cost    = sales_row.1;
        let profit  = (revenue - cost - refunds).max(0.0);

        // Upsert — replace if already generated for this date
        let res = db.execute(
            "INSERT INTO eod_reports (report_date, total_revenue, total_cost, total_profit,
                                      total_refunds, transactions, top_product)
             VALUES (?1,?2,?3,?4,?5,?6,?7)
             ON CONFLICT(report_date) DO UPDATE SET
               total_revenue = excluded.total_revenue,
               total_cost    = excluded.total_cost,
               total_profit  = excluded.total_profit,
               total_refunds = excluded.total_refunds,
               transactions  = excluded.transactions,
               top_product   = excluded.top_product",
            params![date, revenue, cost, profit, refunds, sales_row.2, sales_row.3],
        );

        match res {
            Ok(_) => db.query_row(
                "SELECT id FROM eod_reports WHERE report_date = ?1",
                params![date],
                |r| r.get::<_, i64>(0),
            ).unwrap_or(0),
            Err(e) => return DbResult::err(e.to_string()),
        }
    };

    let db = conn();
    match db.query_row(
        "SELECT id, report_date, total_revenue, total_cost, total_profit,
                total_refunds, transactions, top_product, notes, created_at
         FROM eod_reports WHERE id = ?1",
        params![new_id],
        |r| Ok(EodReport {
            id:            r.get(0)?,
            report_date:   r.get(1)?,
            total_revenue: r.get(2)?,
            total_cost:    r.get(3)?,
            total_profit:  r.get(4)?,
            total_refunds: r.get(5)?,
            transactions:  r.get(6)?,
            top_product:   r.get(7)?,
            notes:         r.get(8)?,
            created_at:    r.get(9)?,
        }),
    ) {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_eod_reports(limit: i64) -> DbResult<Vec<EodReport>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, report_date, total_revenue, total_cost, total_profit,
                total_refunds, transactions, top_product, notes, created_at
         FROM eod_reports ORDER BY report_date DESC LIMIT ?1",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<EodReport>, _> = stmt.query_map(params![limit], |r| Ok(EodReport {
        id: r.get(0)?, report_date: r.get(1)?,
        total_revenue: r.get(2)?, total_cost: r.get(3)?,
        total_profit: r.get(4)?, total_refunds: r.get(5)?,
        transactions: r.get(6)?, top_product: r.get(7)?,
        notes: r.get(8)?, created_at: r.get(9)?,
    })).and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

// ── Expiry ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_expiring_products(within_days: i64) -> DbResult<Vec<ExpiryProduct>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, name, sku, category, stock, expiry_date,
                CAST(julianday(expiry_date) - julianday('now') AS INTEGER) AS days_left
         FROM products
         WHERE expiry_date IS NOT NULL
           AND julianday(expiry_date) - julianday('now') <= ?1
         ORDER BY expiry_date ASC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<ExpiryProduct>, _> = stmt.query_map(params![within_days], |r| {
        Ok(ExpiryProduct {
            id: r.get(0)?, name: r.get(1)?, sku: r.get(2)?,
            category: r.get(3)?, stock: r.get(4)?,
            expiry_date: r.get(5)?, days_until_expiry: r.get(6)?,
        })
    }).and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn set_expiry_date(product_id: i64, expiry_date: Option<String>, alert_days: i64) -> DbResult<()> {
    let db = conn();
    match db.execute(
        "UPDATE products SET expiry_date = ?1, expiry_alert_days = ?2 WHERE id = ?3",
        params![expiry_date, alert_days, product_id],
    ) {
        Ok(_) => DbResult::ok(()),
        Err(e) => DbResult::err(e.to_string()),
    }
}