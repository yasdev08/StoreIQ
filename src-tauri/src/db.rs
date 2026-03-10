use anyhow::Result;
use once_cell::sync::OnceCell;
use rusqlite::Connection;
use std::sync::Mutex;

pub static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn init(path: &str) -> Result<()> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    DB.set(Mutex::new(conn))
        .map_err(|_| anyhow::anyhow!("DB already initialised"))?;
    Ok(())
}

pub fn conn() -> std::sync::MutexGuard<'static, Connection> {
    DB.get().expect("DB not initialised").lock().expect("DB mutex poisoned")
}

fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id     INTEGER PRIMARY KEY,
            name   TEXT NOT NULL UNIQUE,
            ran_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )?;

    let migrations: &[(&str, &str)] = &[
        ("001_initial",          include_str!("../migrations/001_initial.sql")),
        ("002_purchase_orders",  include_str!("../migrations/002_purchase_orders.sql")),
        ("003_new_features",     include_str!("../migrations/003_new_features.sql")),
    ];

    for (name, sql) in migrations {
        let already_ran: bool = conn
            .query_row("SELECT COUNT(*) FROM _migrations WHERE name=?1", [name], |r| r.get::<_,i64>(0))
            .unwrap_or(0) > 0;
        if !already_ran {
            conn.execute_batch(sql)?;
            conn.execute("INSERT INTO _migrations (name) VALUES (?1)", [name])?;
        }
    }
    Ok(())
}