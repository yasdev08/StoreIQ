// src-tauri/src/commands/products.rs
use crate::db::conn;
use crate::models::{DbResult, Product, ProductInput};
use rusqlite::params;

fn fetch_product(id: i64) -> rusqlite::Result<Product> {
    let db = conn();
    db.query_row(
        "SELECT id, sku, name, category, price, cost, stock, threshold,
                supplier_id, barcode, image_path, notes, created_at, updated_at
         FROM products WHERE id = ?1",
        params![id],
        |row| Ok(Product {
            id:          row.get(0)?,
            sku:         row.get(1)?,
            name:        row.get(2)?,
            category:    row.get(3)?,
            price:       row.get(4)?,
            cost:        row.get(5)?,
            stock:       row.get(6)?,
            threshold:   row.get(7)?,
            supplier_id: row.get(8)?,
            barcode:     row.get(9)?,
            image_path:  row.get(10)?,
            notes:       row.get(11)?,
            created_at:  row.get(12)?,
            updated_at:  row.get(13)?,
        }),
    )
}

#[tauri::command]
pub fn get_products() -> DbResult<Vec<Product>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, sku, name, category, price, cost, stock, threshold,
                supplier_id, barcode, image_path, notes, created_at, updated_at
         FROM products ORDER BY name ASC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let products: Result<Vec<Product>, _> = stmt
        .query_map([], |row| Ok(Product {
            id:          row.get(0)?,
            sku:         row.get(1)?,
            name:        row.get(2)?,
            category:    row.get(3)?,
            price:       row.get(4)?,
            cost:        row.get(5)?,
            stock:       row.get(6)?,
            threshold:   row.get(7)?,
            supplier_id: row.get(8)?,
            barcode:     row.get(9)?,
            image_path:  row.get(10)?,
            notes:       row.get(11)?,
            created_at:  row.get(12)?,
            updated_at:  row.get(13)?,
        }))
        .and_then(|rows| rows.collect());
    match products {
        Ok(p) => DbResult::ok(p),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_product(id: i64) -> DbResult<Product> {
    match fetch_product(id) {
        Ok(p) => DbResult::ok(p),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn get_product_by_barcode(barcode: String) -> DbResult<Option<Product>> {
    let db = conn();
    let result = db.query_row(
        "SELECT id, sku, name, category, price, cost, stock, threshold,
                supplier_id, barcode, image_path, notes, created_at, updated_at
         FROM products WHERE barcode = ?1",
        params![barcode],
        |row| Ok(Product {
            id:          row.get(0)?,
            sku:         row.get(1)?,
            name:        row.get(2)?,
            category:    row.get(3)?,
            price:       row.get(4)?,
            cost:        row.get(5)?,
            stock:       row.get(6)?,
            threshold:   row.get(7)?,
            supplier_id: row.get(8)?,
            barcode:     row.get(9)?,
            image_path:  row.get(10)?,
            notes:       row.get(11)?,
            created_at:  row.get(12)?,
            updated_at:  row.get(13)?,
        }),
    );
    match result {
        Ok(p) => DbResult::ok(Some(p)),
        Err(rusqlite::Error::QueryReturnedNoRows) => DbResult::ok(None),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_product(input: ProductInput) -> DbResult<Product> {
    // ── Step 1: insert (hold lock, then DROP it) ──────────────────────────
    let new_id = {
        let db = conn();
        match db.execute(
            "INSERT INTO products (sku, name, category, price, cost, stock, threshold,
                                   supplier_id, barcode, image_path, notes)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![
                input.sku, input.name, input.category, input.price, input.cost,
                input.stock, input.threshold, input.supplier_id, input.barcode,
                input.image_path, input.notes
            ],
        ) {
            Ok(_) => db.last_insert_rowid(),
            Err(e) => {
                let msg = e.to_string();
                return if msg.contains("products.sku") {
                    DbResult::err(format!("SKU \"{}\" already exists — every product must have a unique SKU.", input.sku))
                } else if msg.contains("products.barcode") {
                    DbResult::err(format!("Barcode \"{}\" is already linked to another product.", input.barcode.as_deref().unwrap_or("")))
                } else {
                    DbResult::err(msg)
                };
            }
        }
    }; // ← lock released here

    // ── Step 2: fetch (new lock acquisition is safe now) ─────────────────
    match fetch_product(new_id) {
        Ok(p) => DbResult::ok(p),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn update_product(id: i64, input: ProductInput) -> DbResult<Product> {
    {
        let db = conn();
        if let Err(e) = db.execute(
            "UPDATE products SET sku=?1, name=?2, category=?3, price=?4, cost=?5,
             stock=?6, threshold=?7, supplier_id=?8, barcode=?9, image_path=?10, notes=?11
             WHERE id=?12",
            params![
                input.sku, input.name, input.category, input.price, input.cost,
                input.stock, input.threshold, input.supplier_id, input.barcode,
                input.image_path, input.notes, id
            ],
        ) {
            let msg = e.to_string();
            return if msg.contains("products.sku") {
                DbResult::err(format!("SKU \"{}\" is already used by another product.", input.sku))
            } else if msg.contains("products.barcode") {
                DbResult::err(format!("Barcode \"{}\" is already linked to another product.", input.barcode.as_deref().unwrap_or("")))
            } else {
                DbResult::err(msg)
            };
        }
    } // ← lock released here

    match fetch_product(id) {
        Ok(p) => DbResult::ok(p),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_product(id: i64) -> DbResult<()> {
    let db = conn();
    match db.execute("DELETE FROM products WHERE id = ?1", params![id]) {
        Ok(_) => DbResult::ok(()),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn adjust_stock(id: i64, delta: i64) -> DbResult<Product> {
    {
        let db = conn();
        if let Err(e) = db.execute(
            "UPDATE products SET stock = MAX(0, stock + ?1) WHERE id = ?2",
            params![delta, id],
        ) {
            return DbResult::err(e.to_string());
        }
    } // ← lock released here

    match fetch_product(id) {
        Ok(p) => DbResult::ok(p),
        Err(e) => DbResult::err(e.to_string()),
    }
}