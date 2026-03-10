# StoreIQ — Retail Inventory Management Desktop App

A cross-platform desktop inventory system built with **Tauri + React + SQLite**.  
Runs 100% offline. No server. No subscription. Your data stays on the machine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri v1](https://tauri.app) (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | SQLite via `rusqlite` (bundled) |
| Global state | Zustand |
| Barcode scanning | @zxing/browser (webcam) |
| Build tool | Vite |

---

## Project Structure

```
storeiq/
├── src/                        # React frontend
│   ├── App.tsx                 # Root component, page routing
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles + Tailwind
│   ├── types/
│   │   └── index.ts            # All TypeScript types (Product, Supplier, Sale…)
│   ├── db/
│   │   └── index.ts            # DB layer — all Tauri invoke() calls
│   ├── hooks/
│   │   ├── useStore.ts         # Zustand global store
│   │   └── useScanner.ts       # @zxing webcam barcode hook
│   ├── views/                  # One file per page
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Alerts.tsx
│   │   ├── Suppliers.tsx
│   │   ├── Scanner.tsx
│   │   └── Sales.tsx
│   └── components/
│       ├── ui/                 # Reusable UI: Sidebar, Topbar, Badge, StockBar…
│       ├── modals/             # ProductModal, SupplierModal
│       └── charts/             # Chart wrappers
│
├── src-tauri/                  # Rust / Tauri backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── migrations/
│   │   └── 001_initial.sql     # SQLite schema
│   └── src/
│       ├── main.rs             # App entry — sets up DB, registers commands
│       ├── db.rs               # SQLite connection + migration runner
│       ├── models.rs           # Rust structs (Product, Supplier, Sale…)
│       └── commands/
│           ├── mod.rs
│           ├── products.rs     # CRUD + stock adjust
│           ├── suppliers.rs    # CRUD
│           ├── sales.rs        # Record sale, weekly summary, category summary
│           └── backup.rs       # Copy DB file in/out
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Prerequisites

- **Node.js** ≥ 18
- **Rust** (stable) — install via https://rustup.rs
- **Tauri CLI prerequisites** — see https://tauri.app/v1/guides/getting-started/prerequisites

On Ubuntu/Debian you'll also need:
```bash
sudo apt install libwebkit2gtk-4.0-dev build-essential libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```
In case npm install doesn't work use --force 
```bash
npm install --force
```

### 2. Run in dev mode (hot-reload)
```bash
npm run tauri dev
```
This starts the Vite dev server on `localhost:1420` and the Tauri window.

### 3. Build for production
```bash
npm run tauri build
```
Outputs an installer to `src-tauri/target/release/bundle/`.

---

## Database

SQLite file lives at:
- **Windows:** `%APPDATA%\storeiq\storeiq.db`
- **macOS:** `~/Library/Application Support/storeiq/storeiq.db`
- **Linux:** `~/.local/share/storeiq/storeiq.db`

Migrations run automatically on startup. To add a new migration, create `migrations/002_name.sql` and register it in `db.rs`.

---

## Frontend ↔ Backend Bridge

All database operations flow through Tauri's `invoke()` bridge:

```
React component
  → db/index.ts (typed helper)
    → invoke("command_name", { args })
      → Rust command in src-tauri/src/commands/
        → rusqlite query
          → DbResult<T> JSON response
            → React state update via Zustand
```

---

## Adding a New Feature

1. Add the SQL migration if schema changes are needed
2. Add Rust struct to `models.rs`
3. Add Rust command to `commands/`
4. Register command in `main.rs` `invoke_handler!`
5. Add TS type to `src/types/index.ts`
6. Add `db.*` helper in `src/db/index.ts`
7. Wire into Zustand store in `src/hooks/useStore.ts`
8. Build the React view/component

---

## Key Dependencies

```
@tauri-apps/api           Tauri JS bridge
@zxing/browser            Webcam barcode/QR scanner
zustand                   Lightweight global state
recharts                  Charts (bar, line, pie)
date-fns                  Date formatting
rusqlite (bundled)        SQLite — no system lib needed
serde / serde_json        Rust ↔ JSON serialisation
```

---

## Roadmap (Phase 2)

- [ ] CSV / PDF export for inventory and sales reports
- [ ] Multi-user support with role permissions (admin / staff)
- [ ] Purchase order tracking (orders to suppliers)
- [ ] Product image uploads
- [ ] Dark/light theme toggle
