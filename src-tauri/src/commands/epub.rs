use std::path::Path;
use tauri::{AppHandle, Emitter};

use crate::epub::builder;
use crate::types::{BatchEpubConfig, EpubConfig, BatchProgressEvent, ProgressEvent};

/// 単一EPUBを生成する
#[tauri::command]
pub fn generate_epub(app: AppHandle, config: EpubConfig) -> Result<String, String> {
    let output_path = Path::new(&config.output_path);

    // 画像リストが空でないことを確認
    if config.images.is_empty() {
        return Err("画像が選択されていません".to_string());
    }

    let app_clone = app.clone();

    // EPUB生成
    let epub_data = builder::build_epub(
        &config.title,
        &config.author,
        &config.images,
        config.cover_index,
        config.resize_enabled,
        config.max_image_width,
        &config.epub_version,
        &config.page_direction,
        &|processed, total, current_file| {
            let progress = if total > 0 {
                ((processed as f64 / total as f64) * 100.0) as u32
            } else {
                0
            };
            let _ = app_clone.emit(
                "epub-progress",
                ProgressEvent {
                    progress,
                    current_file: current_file.to_string(),
                    processed,
                    total,
                    message: format!("処理中: {} ({}/{})", current_file, processed + 1, total),
                },
            );
        },
    )?;

    // ファイルに書き出し
    std::fs::write(output_path, &epub_data)
        .map_err(|e| format!("ファイルの書き出しに失敗: {}", e))?;

    // 完了通知
    let _ = app.emit(
        "epub-progress",
        ProgressEvent {
            progress: 100,
            current_file: String::new(),
            processed: config.images.len(),
            total: config.images.len(),
            message: "EPUB生成が完了しました".to_string(),
        },
    );

    Ok(config.output_path)
}

/// サブフォルダ一括EPUB生成
#[tauri::command]
pub fn batch_generate_epub(app: AppHandle, config: BatchEpubConfig) -> Result<Vec<String>, String> {
    let parent = Path::new(&config.parent_path);
    if !parent.exists() || !parent.is_dir() {
        return Err("指定されたパスは有効なディレクトリではありません".to_string());
    }

    let output_dir = Path::new(&config.output_dir);
    if !output_dir.exists() {
        std::fs::create_dir_all(output_dir)
            .map_err(|e| format!("出力ディレクトリの作成に失敗: {}", e))?;
    }

    // サブフォルダを取得
    let subfolders = crate::commands::scan::scan_subfolders(config.parent_path.clone())?;
    let total_folders = subfolders.len();

    if total_folders == 0 {
        return Err("画像を含むサブフォルダが見つかりません".to_string());
    }

    let mut generated_files = Vec::new();

    for (folder_idx, subfolder) in subfolders.iter().enumerate() {
        let app_clone = app.clone();

        // 一括進捗通知
        let _ = app.emit(
            "batch-progress",
            BatchProgressEvent {
                overall_progress: ((folder_idx as f64 / total_folders as f64) * 100.0) as u32,
                current_folder: subfolder.name.clone(),
                processed_folders: folder_idx,
                total_folders,
                file_progress: 0,
                message: format!(
                    "フォルダ処理中: {} ({}/{})",
                    subfolder.name,
                    folder_idx + 1,
                    total_folders
                ),
            },
        );

        // フォルダ内の画像をスキャン（非再帰）
        let images = crate::commands::scan::scan_folder(subfolder.path.clone(), false)?;
        let image_paths: Vec<String> = images.iter().map(|img| img.path.clone()).collect();

        if image_paths.is_empty() {
            continue;
        }

        let output_filename = format!("{}.epub", subfolder.name);
        let output_path = output_dir.join(&output_filename);

        // EPUB生成
        let epub_data = builder::build_epub(
            &subfolder.name,
            &config.author,
            &image_paths,
            Some(0), // 最初の画像を表紙に
            config.resize_enabled,
            config.max_image_width,
            &config.epub_version,
            &config.page_direction,
            &|processed, total, current_file| {
                let file_progress = if total > 0 {
                    ((processed as f64 / total as f64) * 100.0) as u32
                } else {
                    0
                };
                let _ = app_clone.emit(
                    "batch-progress",
                    BatchProgressEvent {
                        overall_progress: (((folder_idx as f64 + file_progress as f64 / 100.0)
                            / total_folders as f64)
                            * 100.0) as u32,
                        current_folder: subfolder.name.clone(),
                        processed_folders: folder_idx,
                        total_folders,
                        file_progress,
                        message: format!(
                            "{}: {} ({}/{})",
                            subfolder.name,
                            current_file,
                            processed + 1,
                            total
                        ),
                    },
                );
            },
        )?;

        std::fs::write(&output_path, &epub_data)
            .map_err(|e| format!("ファイルの書き出しに失敗 ({}): {}", subfolder.name, e))?;

        generated_files.push(output_path.to_string_lossy().to_string());
    }

    // 完了通知
    let _ = app.emit(
        "batch-progress",
        BatchProgressEvent {
            overall_progress: 100,
            current_folder: String::new(),
            processed_folders: total_folders,
            total_folders,
            file_progress: 100,
            message: format!("一括生成完了: {}冊のEPUBを生成しました", generated_files.len()),
        },
    );

    Ok(generated_files)
}
