-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    status      TEXT NOT NULL DEFAULT 'draft'
                CHECK(status IN ('draft','sent','partial','received','cancelled')),
    notes       TEXT,
    ordered_at  TEXT,
    expected_at TEXT,
    received_at TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id        INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name      TEXT NOT NULL,
    quantity_ordered  INTEGER NOT NULL DEFAULT 1,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_cost         REAL NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_po_supplier  ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_poi_order    ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_product  ON purchase_order_items(product_id);