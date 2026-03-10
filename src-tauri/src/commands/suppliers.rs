// src-tauri/src/commands/suppliers.rs
use crate::db::conn;
use crate::models::{DbResult, Supplier, SupplierInput};
use rusqlite::params;

fn fetch_supplier(id: i64) -> rusqlite::Result<Supplier> {
    let db = conn();
    db.query_row(
        "SELECT id, name, contact_name, email, phone, address, notes, status, created_at
         FROM suppliers WHERE id = ?1",
        params![id],
        |row| Ok(Supplier {
            id:           row.get(0)?,
            name:         row.get(1)?,
            contact_name: row.get(2)?,
            email:        row.get(3)?,
            phone:        row.get(4)?,
            address:      row.get(5)?,
            notes:        row.get(6)?,
            status:       row.get(7)?,
            created_at:   row.get(8)?,
        }),
    )
}

#[tauri::command]
pub fn get_suppliers() -> DbResult<Vec<Supplier>> {
    let db = conn();
    let mut stmt = match db.prepare(
        "SELECT id, name, contact_name, email, phone, address, notes, status, created_at
         FROM suppliers ORDER BY name ASC",
    ) {
        Ok(s) => s,
        Err(e) => return DbResult::err(e.to_string()),
    };
    let items: Result<Vec<Supplier>, _> = stmt
        .query_map([], |row| Ok(Supplier {
            id:           row.get(0)?,
            name:         row.get(1)?,
            contact_name: row.get(2)?,
            email:        row.get(3)?,
            phone:        row.get(4)?,
            address:      row.get(5)?,
            notes:        row.get(6)?,
            status:       row.get(7)?,
            created_at:   row.get(8)?,
        }))
        .and_then(|r| r.collect());
    match items {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn create_supplier(input: SupplierInput) -> DbResult<Supplier> {
    let new_id = {
        let db = conn();
        match db.execute(
            "INSERT INTO suppliers (name, contact_name, email, phone, address, notes, status)
             VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![input.name, input.contact_name, input.email, input.phone,
                    input.address, input.notes, input.status],
        ) {
            Ok(_) => db.last_insert_rowid(),
            Err(e) => return DbResult::err(e.to_string()),
        }
    };
    match fetch_supplier(new_id) {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn update_supplier(id: i64, input: SupplierInput) -> DbResult<Supplier> {
    {
        let db = conn();
        if let Err(e) = db.execute(
            "UPDATE suppliers SET name=?1, contact_name=?2, email=?3, phone=?4,
             address=?5, notes=?6, status=?7 WHERE id=?8",
            params![input.name, input.contact_name, input.email, input.phone,
                    input.address, input.notes, input.status, id],
        ) {
            return DbResult::err(e.to_string());
        }
    }
    match fetch_supplier(id) {
        Ok(v) => DbResult::ok(v),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_supplier(id: i64) -> DbResult<()> {
    let db = conn();
    match db.execute("DELETE FROM suppliers WHERE id = ?1", params![id]) {
        Ok(_) => DbResult::ok(()),
        Err(e) => DbResult::err(e.to_string()),
    }
}