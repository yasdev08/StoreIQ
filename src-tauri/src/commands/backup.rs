// src-tauri/src/commands/backup.rs
use crate::models::DbResult;
use std::path::Path;

#[tauri::command]
pub fn backup_database(dest_path: String) -> DbResult<()> {
    let src = dirs::data_dir().unwrap_or_default().join("storeiq").join("storeiq.db");
    match std::fs::copy(&src, Path::new(&dest_path)) {
        Ok(_)  => DbResult::ok(()),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn restore_database(src_path: String) -> DbResult<()> {
    let dest = dirs::data_dir().unwrap_or_default().join("storeiq").join("storeiq.db");
    match std::fs::copy(Path::new(&src_path), &dest) {
        Ok(_)  => DbResult::ok(()),
        Err(e) => DbResult::err(e.to_string()),
    }
}

#[tauri::command]
pub fn save_product_image(src_path: String, sku: String) -> DbResult<String> {
    let images_dir = dirs::data_dir().unwrap_or_default().join("storeiq").join("images");
    if let Err(e) = std::fs::create_dir_all(&images_dir) {
        return DbResult::err(format!("Could not create images dir: {}", e));
    }
    let ext = Path::new(&src_path)
        .extension().and_then(|e| e.to_str()).unwrap_or("jpg").to_lowercase();
    let safe_sku: String = sku.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let dest = images_dir.join(format!("{}.{}", safe_sku, ext));
    match std::fs::copy(Path::new(&src_path), &dest) {
        Ok(_)  => DbResult::ok(dest.to_string_lossy().to_string()),
        Err(e) => DbResult::err(e.to_string()),
    }
}

/// Read an image and return a base64 data URL.
/// Pure-Rust base64 — no external crate, guaranteed to compile.
#[tauri::command]
pub fn get_image_base64(path: String) -> DbResult<String> {
    let bytes = match std::fs::read(&path) {
        Ok(b)  => b,
        Err(e) => return DbResult::err(format!("Cannot read image file: {}", e)),
    };

    let mime = if bytes.starts_with(&[0xFF, 0xD8]) {
        "image/jpeg"
    } else if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        "image/png"
    } else if bytes.len() >= 12 && &bytes[8..12] == b"WEBP" {
        "image/webp"
    } else if bytes.starts_with(b"GIF") {
        "image/gif"
    } else {
        "image/jpeg"
    };

    let b64 = encode_base64(&bytes);
    DbResult::ok(format!("data:{};base64,{}", mime, b64))
}

// Pure-Rust base64 encoder — no external crate needed
fn encode_base64(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(CHARS[(n >> 18) & 0x3F] as char);
        out.push(CHARS[(n >> 12) & 0x3F] as char);
        out.push(if chunk.len() > 1 { CHARS[(n >> 6) & 0x3F] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[n & 0x3F] as char } else { '=' });
    }
    out
}