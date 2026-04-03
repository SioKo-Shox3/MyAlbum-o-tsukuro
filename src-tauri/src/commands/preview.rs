use base64::{engine::general_purpose::STANDARD, Engine};
use image::imageops;
use std::io::Cursor;
use std::path::Path;

/// サムネイルを生成してBase64エンコードで返す
#[tauri::command]
pub fn generate_thumbnail(path: String, max_size: u32) -> Result<String, String> {
    let img_path = Path::new(&path);
    if !img_path.exists() {
        return Err(format!("ファイルが存在しません: {}", path));
    }

    let img = image::open(img_path).map_err(|e| format!("画像の読み込みに失敗: {}", e))?;

    let thumbnail = imageops::thumbnail(&img, max_size, max_size);

    let mut buf = Vec::new();
    let mut cursor = Cursor::new(&mut buf);
    thumbnail
        .write_to(&mut cursor, image::ImageFormat::Jpeg)
        .map_err(|e| format!("サムネイルのエンコードに失敗: {}", e))?;

    let base64_str = STANDARD.encode(&buf);
    Ok(format!("data:image/jpeg;base64,{}", base64_str))
}
