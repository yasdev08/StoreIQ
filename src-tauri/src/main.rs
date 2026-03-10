#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path_resolver().app_data_dir()
                .expect("Could not resolve app data directory");
            std::fs::create_dir_all(&app_dir).expect("Could not create app data dir");
            let db_path = app_dir.join("storeiq.db");
            db::init(db_path.to_str().expect("Invalid db path"))
                .expect("Failed to initialise database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Products
            commands::products::get_products,
            commands::products::get_product,
            commands::products::get_product_by_barcode,
            commands::products::create_product,
            commands::products::update_product,
            commands::products::delete_product,
            commands::products::adjust_stock,
            // Suppliers
            commands::suppliers::get_suppliers,
            commands::suppliers::create_supplier,
            commands::suppliers::update_supplier,
            commands::suppliers::delete_supplier,
            // Sales
            commands::sales::get_sales_range,
            commands::sales::record_sale,
            commands::sales::get_weekly_summary,
            commands::sales::get_category_summary,
            commands::sales::get_recent_sales,
            // Purchase Orders
            commands::purchase_orders::get_purchase_orders,
            commands::purchase_orders::get_order_items,
            commands::purchase_orders::create_purchase_order,
            commands::purchase_orders::update_order_status,
            commands::purchase_orders::add_order_item,
            commands::purchase_orders::receive_order_item,
            commands::purchase_orders::delete_purchase_order,
            // Returns
            commands::returns::get_returns,
            commands::returns::get_returns_today,
            commands::returns::create_return,
            // Reports & Expiry
            commands::reports::generate_eod_report,
            commands::reports::get_eod_reports,
            commands::reports::get_expiring_products,
            commands::reports::set_expiry_date,
            // Backup & Images
            commands::backup::backup_database,
            commands::backup::restore_database,
            commands::backup::save_product_image,
            commands::backup::get_image_base64,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running StoreIQ");
}