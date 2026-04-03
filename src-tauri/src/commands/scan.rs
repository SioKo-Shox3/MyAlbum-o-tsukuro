use std::path::Path;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

use crate::types::{ImageInfo, SubfolderInfo};

/// サポートする画像拡張子
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif"];

/// 指定パスの画像ファイルを検出する
fn is_image_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| IMAGE_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// 自然順ソートでファイル名比較
fn natural_sort_key(name: &str) -> Vec<NatOrdPart> {
    let mut parts = Vec::new();
    let mut current_num = String::new();
    let mut current_str = String::new();

    for ch in name.chars() {
        if ch.is_ascii_digit() {
            if !current_str.is_empty() {
                parts.push(NatOrdPart::Str(current_str.clone()));
                current_str.clear();
            }
            current_num.push(ch);
        } else {
            if !current_num.is_empty() {
                parts.push(NatOrdPart::Num(current_num.parse().unwrap_or(0)));
                current_num.clear();
            }
            current_str.push(ch.to_lowercase().next().unwrap_or(ch));
        }
    }

    if !current_num.is_empty() {
        parts.push(NatOrdPart::Num(current_num.parse().unwrap_or(0)));
    }
    if !current_str.is_empty() {
        parts.push(NatOrdPart::Str(current_str));
    }

    parts
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum NatOrdPart {
    Num(u64),
    Str(String),
}

impl PartialOrd for NatOrdPart {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for NatOrdPart {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        match (self, other) {
            (NatOrdPart::Num(a), NatOrdPart::Num(b)) => a.cmp(b),
            (NatOrdPart::Str(a), NatOrdPart::Str(b)) => a.cmp(b),
            (NatOrdPart::Num(_), NatOrdPart::Str(_)) => std::cmp::Ordering::Less,
            (NatOrdPart::Str(_), NatOrdPart::Num(_)) => std::cmp::Ordering::Greater,
        }
    }
}

/// 指定フォルダ内の画像ファイルをスキャンする
#[tauri::command]
pub fn scan_folder(path: String, recursive: bool) -> Result<Vec<ImageInfo>, String> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err(format!("パスが存在しません: {}", path));
    }
    if !root.is_dir() {
        return Err(format!("ディレクトリではありません: {}", path));
    }

    let max_depth = if recursive { usize::MAX } else { 1 };

    let mut images: Vec<ImageInfo> = WalkDir::new(root)
        .max_depth(max_depth)
        .follow_links(true)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type().is_file() && is_image_file(entry.path()))
        .filter_map(|entry| {
            let metadata = entry.metadata().ok()?;
            let modified = metadata
                .modified()
                .ok()?
                .duration_since(UNIX_EPOCH)
                .ok()?
                .as_millis() as u64;

            Some(ImageInfo {
                path: entry.path().to_string_lossy().to_string(),
                name: entry.file_name().to_string_lossy().to_string(),
                extension: entry
                    .path()
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase(),
                size: metadata.len(),
                modified,
            })
        })
        .collect();

    // 自然順ソート
    images.sort_by(|a, b| {
        let key_a = natural_sort_key(&a.name);
        let key_b = natural_sort_key(&b.name);
        key_a.cmp(&key_b)
    });

    Ok(images)
}

/// サブフォルダ一覧を取得する（一括EPUB化モード用）
#[tauri::command]
pub fn scan_subfolders(path: String) -> Result<Vec<SubfolderInfo>, String> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err(format!("パスが存在しません: {}", path));
    }
    if !root.is_dir() {
        return Err(format!("ディレクトリではありません: {}", path));
    }

    let mut subfolders: Vec<SubfolderInfo> = Vec::new();

    // 直下のサブフォルダのみ取得
    let entries = std::fs::read_dir(root).map_err(|e| format!("ディレクトリの読み取りに失敗: {}", e))?;

    for entry in entries.filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if !entry_path.is_dir() {
            continue;
        }

        // そのサブフォルダ内の画像ファイル数をカウント
        let image_count = WalkDir::new(&entry_path)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file() && is_image_file(e.path()))
            .count();

        if image_count > 0 {
            subfolders.push(SubfolderInfo {
                path: entry_path.to_string_lossy().to_string(),
                name: entry_path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                image_count,
            });
        }
    }

    // サブフォルダ名で自然順ソート
    subfolders.sort_by(|a, b| {
        let key_a = natural_sort_key(&a.name);
        let key_b = natural_sort_key(&b.name);
        key_a.cmp(&key_b)
    });

    Ok(subfolders)
}
