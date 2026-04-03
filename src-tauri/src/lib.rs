mod commands;
mod epub;
mod types;

use commands::epub::{batch_generate_epub, generate_epub};
use commands::preview::generate_thumbnail;
use commands::scan::{scan_folder, scan_subfolders};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_folder,
            scan_subfolders,
            generate_thumbnail,
            generate_epub,
            batch_generate_epub,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
