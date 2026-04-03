use epub_builder::{EpubBuilder, EpubContent, EpubVersion, PageDirection, ReferenceType, ZipLibrary};
use std::io::Cursor;
use std::path::Path;

use super::image_processor;

/// 画像ファイルリストからEPUBを生成する
pub fn build_epub(
    title: &str,
    author: &str,
    images: &[String],
    cover_index: Option<usize>,
    resize_enabled: bool,
    max_image_width: Option<u32>,
    epub_version: &str,
    page_direction: &str,
    on_progress: &dyn Fn(usize, usize, &str),
) -> Result<Vec<u8>, String> {
    let zip = ZipLibrary::new().map_err(|e| format!("ZIPライブラリの初期化に失敗: {}", e))?;
    let mut builder =
        EpubBuilder::new(zip).map_err(|e| format!("EPUBビルダーの初期化に失敗: {}", e))?;

    // EPUBバージョン設定
    match epub_version {
        "3.0" => {
            builder
                .epub_version(EpubVersion::V30)
                .metadata("author", author)
                .map_err(|e| format!("メタデータ設定エラー: {}", e))?
                .metadata("title", title)
                .map_err(|e| format!("メタデータ設定エラー: {}", e))?;
        }
        _ => {
            builder
                .epub_version(EpubVersion::V20)
                .metadata("author", author)
                .map_err(|e| format!("メタデータ設定エラー: {}", e))?
                .metadata("title", title)
                .map_err(|e| format!("メタデータ設定エラー: {}", e))?;
        }
    }

    // ページ方向設定（RTL対応）
    match page_direction {
        "rtl" => {
            builder.epub_direction(PageDirection::Rtl);
        }
        _ => {
            builder.epub_direction(PageDirection::Ltr);
        }
    }

    // CSSスタイルシート
    let css = r#"
body {
    margin: 0;
    padding: 0;
    text-align: center;
    background-color: #000;
}
.page-image {
    max-width: 100%;
    max-height: 100vh;
    object-fit: contain;
    display: block;
    margin: 0 auto;
}
"#;
    builder
        .stylesheet(css.as_bytes())
        .map_err(|e| format!("スタイルシート設定エラー: {}", e))?;

    let total = images.len();
    let cover_idx = cover_index.unwrap_or(0);

    for (i, image_path_str) in images.iter().enumerate() {
        let image_path = Path::new(image_path_str);
        let file_name = image_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("image.jpg");

        on_progress(i, total, file_name);

        // 画像データを読み込み（リサイズはオプション）
        let (image_data, mime_type) =
            image_processor::process_image(image_path, resize_enabled, max_image_width)?;

        let ext = image_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg")
            .to_lowercase();

        let image_filename = format!("images/page_{:04}.{}", i + 1, ext);

        // 表紙画像の設定
        if i == cover_idx {
            builder
                .add_cover_image(&image_filename, &image_data[..], &mime_type)
                .map_err(|e| format!("表紙画像の追加に失敗: {}", e))?;

            // 表紙ページのXHTML
            let cover_xhtml = generate_page_xhtml(&image_filename, title, true);
            builder
                .add_content(
                    EpubContent::new("cover.xhtml", cover_xhtml.as_bytes())
                        .title("表紙")
                        .reftype(ReferenceType::Cover),
                )
                .map_err(|e| format!("表紙ページの追加に失敗: {}", e))?;
        } else {
            // 通常の画像リソースを追加
            builder
                .add_resource(&image_filename, &image_data[..], &mime_type)
                .map_err(|e| format!("画像リソースの追加に失敗: {}", e))?;

            // ページのXHTML
            let page_xhtml = generate_page_xhtml(&image_filename, &format!("ページ {}", i + 1), false);
            let page_filename = format!("page_{:04}.xhtml", i + 1);
            let mut content = EpubContent::new(&page_filename, page_xhtml.as_bytes())
                .title(&format!("ページ {}", i + 1));

            // 最初のコンテンツページをテキスト開始として設定
            if i == 0 || (i == 1 && cover_idx == 0) {
                content = content.reftype(ReferenceType::Text);
            }

            builder
                .add_content(content)
                .map_err(|e| format!("ページの追加に失敗: {}", e))?;
        }
    }

    on_progress(total, total, "EPUBファイルを書き出し中...");

    // EPUBをメモリ上に書き出し
    let mut output = Vec::new();
    let mut cursor = Cursor::new(&mut output);
    builder
        .generate(&mut cursor)
        .map_err(|e| format!("EPUB生成エラー: {}", e))?;

    Ok(output)
}

/// 画像を表示するXHTMLページを生成
fn generate_page_xhtml(image_path: &str, title: &str, _is_cover: bool) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>{title}</title>
    <link rel="stylesheet" type="text/css" href="stylesheet.css"/>
</head>
<body>
    <div class="page-image-container">
        <img class="page-image" src="{image_path}" alt="{title}"/>
    </div>
</body>
</html>"#,
        title = html_escape(title),
        image_path = image_path,
    )
}

/// HTMLエスケープ
fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}
