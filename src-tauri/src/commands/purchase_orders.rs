// src-tauri/src/commands/purchase_orders.rs
use crate::db::conn;
use crate::models::{DbResult, PurchaseOrder, PurchaseOrderInput, PurchaseOrderItem, PurchaseOrderItemInput};
use rusqlite::params;

fn fetch_order(id: i64) -> rusqlite::Result<PurchaseOrder> {
    let db = conn();
    db.query_row(
        "SELECT po.id, po.supplier_id, po.status, po.notes, po.ordered_at,
                po.expected_at, po.received_at, po.created_at,
                s.name AS supplier_name,
                COUNT(poi.id) AS items_count,
                COALESCE(SUM(poi.quantity_ordered * poi.unit_cost), 0) AS total_cost
         FROM purchase_orders po
         LEFT JOIN suppliers s ON s.id = po.supplier_id
         LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
         WHERE po.id = ?1
         GROUP BY po.id",
        params![id],
        row_to_order,
    )
}

fn row_to_order(row: &rusqlite::Row) -> rusqlite::Result<PurchaseOrder> {
    Ok(PurchaseOrder {
        id:            row.get(0)?,
        supplier_id:   row.get(1)?,
        status:        row.get(2)?,
        notes:         row.get(3)?,
        ordered_at:    row.get(4)?,
        expected_at:   row.get(5)?,
        received_at:   row.get(6)?,
        created_at:    row.get(7)?,
        supplier_name: row.get(8)?,
        items_count:   row.get(9)?,
        total_cost:    row.get(10)?,
    })
}

#[tauri::command]
pub fn get_purchase_orders() -> DbResult<Vec<PurchaseOrder>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT po.id, po.supplier_id, po.status, po.notes, po.ordered_at,
                po.expected_at, po.received_at, po.created_at,
                s.name AS supplier_name,
                COUNT(poi.id) AS items_count,
                COALESCE(SUM(poi.quantity_ordered * poi.unit_cost), 0) AS total_cost
         FROM purchase_orders po
         LEFT JOIN suppliers s ON s.id = po.supplier_id
         LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
         GROUP BY po.id
         ORDER BY po.created_at DESC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<PurchaseOrder>, _> = stmt
        .query_map([], row_to_order)
        .and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn get_order_items(order_id: i64) -> DbResult<Vec<PurchaseOrderItem>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, purchase_order_id, product_id, product_name,
                quantity_ordered, quantity_received, unit_cost, created_at
         FROM purchase_order_items WHERE purchase_order_id=?1 ORDER BY id",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<PurchaseOrderItem>, _> = stmt
        .query_map(params![order_id], |row| Ok(PurchaseOrderItem {
            id:                row.get(0)?,
            purchase_order_id: row.get(1)?,
            product_id:        row.get(2)?,
            product_name:      row.get(3)?,
            quantity_ordered:  row.get(4)?,
            quantity_received: row.get(5)?,
            unit_cost:         row.get(6)?,
            created_at:        row.get(7)?,
        }))
        .and_then(|r| r.collect());
    match items { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn create_purchase_order(input: PurchaseOrderInput) -> DbResult<PurchaseOrder> {
    let new_id = {
        let db = conn();
        match db.execute(
            "INSERT INTO purchase_orders (supplier_id, notes, ordered_at, expected_at)
             VALUES (?1,?2,?3,?4)",
            params![input.supplier_id, input.notes, input.ordered_at, input.expected_at],
        ) {
            Ok(_) => db.last_insert_rowid(),
            Err(e) => return DbResult::err(e.to_string()),
        }
    };
    match fetch_order(new_id) { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn update_order_status(id: i64, status: String) -> DbResult<PurchaseOrder> {
    {
        let db = conn();
        let received_at = if status == "received" { Some("datetime('now')") } else { None };
        let sql = if received_at.is_some() {
            "UPDATE purchase_orders SET status=?1, received_at=datetime('now') WHERE id=?2"
        } else {
            "UPDATE purchase_orders SET status=?1 WHERE id=?2"
        };
        if let Err(e) = db.execute(sql, params![status, id]) {
            return DbResult::err(e.to_string());
        }
    }
    match fetch_order(id) { Ok(v) => DbResult::ok(v), Err(e) => DbResult::err(e.to_string()) }
}

#[tauri::command]
pub fn add_order_item(input: PurchaseOrderItemInput) -> DbResult<PurchaseOrderItem> {
    let new_id = {
        let db = conn();
        match db.execute(
            "INSERT INTO purchase_order_items
             (purchase_order_id, product_id, product_name, quantity_ordered, unit_cost)
             VALUES (?1,?2,?3,?4,?5)",
            params![input.purchase_order_id, input.product_id, input.product_name,
                    input.quantity_ordered, input.unit_cost],
        ) {
            Ok(_) => db.last_insert_rowid(),
            Err(e) => return DbResult::err(e.to_string()),
        }
    };
    let db = conn();
    match db.query_row(
        "SELECT id, purchase_order_id, product_id, product_name,
                quantity_ordered, quantity_received, unit_cost, created_at
         FROM purchase_order_items WHERE id=?1",
        params![new_id],
        |row| Ok(PurchaseOrderItem {
            id: row.get(0)?, purchase_order_id: row.get(1)?,
            product_id: row.get(2)?, product_name: row.get(3)?,
            quantity_ordered: row.get(4)?, quantity_received: row.get(5)?,
            unit_cost: row.get(6)?, created_at: row.get(7)?,
        }),
    ) {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn receive_order_item(item_id: i64, quantity_received: i64) -> DbResult<()> {
    let db = conn();
    // Update received qty on item
    if let Err(e) = db.execute(
        "UPDATE purchase_order_items SET quantity_received=?1 WHERE id=?2",
        params![quantity_received, item_id],
    ) { return DbResult::err(e.to_string()); }

    // Adjust product stock if product_id is set
    let product_id: Option<i64> = db.query_row(
        "SELECT product_id FROM purchase_order_items WHERE id=?1",
        params![item_id],
        |r| r.get(0),
    ).unwrap_or(None);

    if let Some(pid) = product_id {
        if let Err(e) = db.execute(
            "UPDATE products SET stock = stock + ?1 WHERE id = ?2",
            params![quantity_received, pid],
        ) { return DbResult::err(e.to_string()); }
    }

    DbResult::ok(())
}

#[tauri::command]
pub fn delete_purchase_order(id: i64) -> DbResult<()> {
    let db = conn();
    match db.execute("DELETE FROM purchase_orders WHERE id=?1", params![id]) {
        Ok(_) => DbResult::ok(()),
        Err(e) => DbResult::err(e.to_string()),
    }
}