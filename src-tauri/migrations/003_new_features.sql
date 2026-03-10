-- Migration 003: Returns, Expiry dates, EOD reports

-- ── Returns ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id       INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name  TEXT    NOT NULL,
  quantity      INTEGER NOT NULL,
  unit_price    REAL    NOT NULL,
  unit_cost     REAL    NOT NULL,
  total_refund  REAL    GENERATED ALWAYS AS (quantity * unit_price) STORED,
  reason        TEXT,
  restock       INTEGER NOT NULL DEFAULT 1 CHECK(restock IN (0,1)),
  returned_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_returns_product ON returns(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_date    ON returns(returned_at);

-- ── Expiry dates ──────────────────────────────────────────────────────────────
ALTER TABLE products ADD COLUMN expiry_date TEXT;   -- ISO date e.g. "2025-06-01"
ALTER TABLE products ADD COLUMN expiry_alert_days INTEGER NOT NULL DEFAULT 30;

-- ── EOD reports (cached, one per day) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eod_reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date     TEXT NOT NULL UNIQUE,   -- "YYYY-MM-DD"
  total_revenue   REAL NOT NULL DEFAULT 0,
  total_cost      REAL NOT NULL DEFAULT 0,
  total_profit    REAL NOT NULL DEFAULT 0,
  total_refunds   REAL NOT NULL DEFAULT 0,
  transactions    INTEGER NOT NULL DEFAULT 0,
  top_product     TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);