// src-tauri/src/commands/returns.rs
use crate::db::conn;
use crate::models::{DbResult, ReturnRecord, ReturnInput};
use rusqlite::params;

fn row_to_return(row: &rusqlite::Row) -> rusqlite::Result<ReturnRecord> {
    Ok(ReturnRecord {
        id:           row.get(0)?,
        sale_id:      row.get(1)?,
        product_id:   row.get(2)?,
        product_name: row.get(3)?,
        quantity:     row.get(4)?,
        unit_price:   row.get(5)?,
        unit_cost:    row.get(6)?,
        total_refund: row.get(7)?,
        reason:       row.get(8)?,
        restock:      row.get::<_, i64>(9)? != 0,
        returned_at:  row.get(10)?,
    })
}

#[tauri::command]
pub fn get_returns(limit: i64) -> DbResult<Vec<ReturnRecord>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, sale_id, product_id, product_name, quantity, unit_price, unit_cost,
                total_refund, reason, restock, returned_at
         FROM returns ORDER BY returned_at DESC LIMIT ?1",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<ReturnRecord>, _> = stmt
        .query_map(params![limit], row_to_return)
        .and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn create_return(input: ReturnInput) -> DbResult<ReturnRecord> {
    let new_id = {
        let db = conn();
        let res = db.execute(
            "INSERT INTO returns (sale_id, product_id, product_name, quantity,
                                  unit_price, unit_cost, reason, restock)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                input.sale_id, input.product_id, input.product_name,
                input.quantity, input.unit_price, input.unit_cost,
                input.reason, input.restock as i64
            ],
        );
        match res {
            Ok(_) => {
                // Restock: add quantity back to product
                if input.restock {
                    let _ = db.execute(
                        "UPDATE products SET stock = stock + ?1 WHERE id = ?2",
                        params![input.quantity, input.product_id],
                    );
                }
                db.last_insert_rowid()
            }
            Err(e) => return DbResult::err(e.to_string()),
        }
    };

    let db = conn();
    match db.query_row(
        "SELECT id, sale_id, product_id, product_name, quantity, unit_price, unit_cost,
                total_refund, reason, restock, returned_at
         FROM returns WHERE id = ?1",
        params![new_id],
        row_to_return,
    ) {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_returns_today() -> DbResult<Vec<ReturnRecord>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, sale_id, product_id, product_name, quantity, unit_price, unit_cost,
                total_refund, reason, restock, returned_at
         FROM returns WHERE date(returned_at) = date('now') ORDER BY returned_at DESC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<ReturnRecord>, _> = stmt
        .query_map([], row_to_return)
        .and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}