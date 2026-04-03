use image::imageops::FilterType;
use image::DynamicImage;
use std::io::Cursor;
use std::path::Path;

/// 画像をリサイズする（オプション機能）
pub fn process_image(
    path: &Path,
    resize_enabled: bool,
    max_width: Option<u32>,
) -> Result<(Vec<u8>, String), String> {
    let img = image::open(path).map_err(|e| format!("画像読み込みエラー: {}", e))?;

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg")
        .to_lowercase();

    let mime_type = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "tiff" | "tif" => "image/tiff",
        _ => "image/jpeg",
    };

    if resize_enabled {
        let max_w = max_width.unwrap_or(1600);
        if img.width() > max_w {
            let resized = img.resize(max_w, u32::MAX, FilterType::Lanczos3);
            let bytes = encode_image(&resized, &extension)?;
            return Ok((bytes, mime_type.to_string()));
        }
    }

    // 元画像をそのまま使用
    let bytes = std::fs::read(path).map_err(|e| format!("ファイル読み込みエラー: {}", e))?;
    Ok((bytes, mime_type.to_string()))
}

/// DynamicImageを指定形式でエンコード
fn encode_image(img: &DynamicImage, extension: &str) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    let mut cursor = Cursor::new(&mut buf);

    let format = match extension {
        "png" => image::ImageFormat::Png,
        "webp" => image::ImageFormat::WebP,
        "gif" => image::ImageFormat::Gif,
        "bmp" => image::ImageFormat::Bmp,
        "tiff" | "tif" => image::ImageFormat::Tiff,
        _ => image::ImageFormat::Jpeg,
    };

    img.write_to(&mut cursor, format)
        .map_err(|e| format!("画像エンコードエラー: {}", e))?;

    Ok(buf)
}
