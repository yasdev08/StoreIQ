-- Migration 001: Initial schema
-- StoreIQ Database

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Suppliers ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  notes        TEXT,
  status       TEXT    NOT NULL DEFAULT 'active'  -- 'active' | 'inactive'
                CHECK(status IN ('active', 'inactive')),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  sku          TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'General',
  price        REAL    NOT NULL DEFAULT 0,
  cost         REAL    NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  threshold    INTEGER NOT NULL DEFAULT 5,       -- low-stock alert level
  supplier_id  INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  barcode      TEXT    UNIQUE,
  image_path   TEXT,
  notes        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- auto-update updated_at
CREATE TRIGGER IF NOT EXISTS products_updated_at
  AFTER UPDATE ON products
  FOR EACH ROW
  BEGIN
    UPDATE products SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

-- ── Sales ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name  TEXT    NOT NULL,   -- denormalised for reporting
  quantity      INTEGER NOT NULL,
  unit_price    REAL    NOT NULL,
  unit_cost     REAL    NOT NULL,
  total_revenue REAL    GENERATED ALWAYS AS (quantity * unit_price) STORED,
  total_cost    REAL    GENERATED ALWAYS AS (quantity * unit_cost)  STORED,
  sold_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_supplier   ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_stock      ON products(stock);
CREATE INDEX IF NOT EXISTS idx_sales_product       ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at       ON sales(sold_at);
