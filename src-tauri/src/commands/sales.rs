// src-tauri/src/commands/sales.rs
use crate::db::conn;
use crate::models::{DbResult, SaleInput, SaleRecord};
use rusqlite::params;
use serde::Serialize;

#[derive(Serialize)]
pub struct DailySummary {
    pub day: String,
    pub revenue: f64,
    pub units: i64,
    pub profit: f64,
}

#[derive(Serialize)]
pub struct CategorySummary {
    pub category: String,
    pub revenue: f64,
    pub units: i64,
}

#[tauri::command]
pub fn get_sales_range(from: String, to: String) -> DbResult<Vec<SaleRecord>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, product_id, product_name, quantity, unit_price, unit_cost,
                total_revenue, total_cost, sold_at
         FROM sales WHERE sold_at BETWEEN ?1 AND ?2 ORDER BY sold_at DESC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };

    let items: Result<Vec<SaleRecord>, _> = stmt
        .query_map(params![from, to], |row| {
            Ok(SaleRecord {
                id:            row.get(0)?,
                product_id:    row.get(1)?,
                product_name:  row.get(2)?,
                quantity:      row.get(3)?,
                unit_price:    row.get(4)?,
                unit_cost:     row.get(5)?,
                total_revenue: row.get(6)?,
                total_cost:    row.get(7)?,
                sold_at:       row.get(8)?,
            })
        })
        .and_then(|r| r.collect());

    match items {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn record_sale(input: SaleInput) -> DbResult<SaleRecord> {
    let db = conn();

    // Deduct stock atomically
    let deduct = db.execute(
        "UPDATE products SET stock = MAX(0, stock - ?1) WHERE id = ?2",
        params![input.quantity, input.product_id],
    );
    if let Err(e) = deduct {
        return DbResult::err(e.to_string());
    }

    let res = db.execute(
        "INSERT INTO sales (product_id, product_name, quantity, unit_price, unit_cost, sold_at)
         VALUES (?1,?2,?3,?4,?5,?6)",
        params![
            input.product_id, input.product_name, input.quantity,
            input.unit_price, input.unit_cost, input.sold_at
        ],
    );

    match res {
        Ok(_) => {
            let id = db.last_insert_rowid();
            let s = db.query_row(
                "SELECT id, product_id, product_name, quantity, unit_price, unit_cost,
                        total_revenue, total_cost, sold_at
                 FROM sales WHERE id = ?1",
                params![id],
                |row| Ok(SaleRecord {
                    id:            row.get(0)?,
                    product_id:    row.get(1)?,
                    product_name:  row.get(2)?,
                    quantity:      row.get(3)?,
                    unit_price:    row.get(4)?,
                    unit_cost:     row.get(5)?,
                    total_revenue: row.get(6)?,
                    total_cost:    row.get(7)?,
                    sold_at:       row.get(8)?,
                }),
            );
            match s { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
        }
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_weekly_summary() -> DbResult<Vec<DailySummary>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT
            strftime('%w', sold_at)         AS dow,
            ROUND(SUM(total_revenue), 2)    AS revenue,
            SUM(quantity)                   AS units,
            ROUND(SUM(total_revenue - total_cost), 2) AS profit
         FROM sales
         WHERE sold_at >= datetime('now', '-6 days')
         GROUP BY dow
         ORDER BY dow",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };

    let days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let items: Result<Vec<DailySummary>, _> = stmt
        .query_map([], |row| {
            let dow: String = row.get(0)?;
            let idx: usize = dow.parse().unwrap_or(0);
            Ok(DailySummary {
                day:     days.get(idx).unwrap_or(&"?").to_string(),
                revenue: row.get(1)?,
                units:   row.get(2)?,
                profit:  row.get(3)?,
            })
        })
        .and_then(|r| r.collect());

    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn get_category_summary() -> DbResult<Vec<CategorySummary>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT p.category,
                ROUND(SUM(s.total_revenue), 2) AS revenue,
                SUM(s.quantity)                AS units
         FROM sales s
         JOIN products p ON p.id = s.product_id
         WHERE s.sold_at >= datetime('now', '-30 days')
         GROUP BY p.category
         ORDER BY revenue DESC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<CategorySummary>, _> = stmt
        .query_map([], |row| Ok(CategorySummary {
            category: row.get(0)?,
            revenue:  row.get(1)?,
            units:    row.get(2)?,
        }))
        .and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn get_recent_sales(limit: i64) -> DbResult<Vec<SaleRecord>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, product_id, product_name, quantity, unit_price, unit_cost,
                total_revenue, total_cost, sold_at
         FROM sales ORDER BY sold_at DESC LIMIT ?1",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<SaleRecord>, _> = stmt
        .query_map(params![limit], |row| Ok(SaleRecord {
            id: row.get(0)?, product_id: row.get(1)?,
            product_name: row.get(2)?, quantity: row.get(3)?,
            unit_price: row.get(4)?, unit_cost: row.get(5)?,
            total_revenue: row.get(6)?, total_cost: row.get(7)?,
            sold_at: row.get(8)?,
        }))
        .and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}