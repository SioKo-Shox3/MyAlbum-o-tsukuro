use serde::{Deserialize, Serialize};

/// スキャンされた画像ファイルの情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageInfo {
    /// ファイルの絶対パス
    pub path: String,
    /// ファイル名
    pub name: String,
    /// 拡張子（小文字）
    pub extension: String,
    /// ファイルサイズ（バイト）
    pub size: u64,
    /// 最終更新日時（UNIXタイムスタンプ ミリ秒）
    pub modified: u64,
}

/// サブフォルダ情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubfolderInfo {
    /// サブフォルダの絶対パス
    pub path: String,
    /// サブフォルダ名
    pub name: String,
    /// 含まれる画像ファイル数
    pub image_count: usize,
}

/// EPUB生成設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EpubConfig {
    /// 書籍タイトル
    pub title: String,
    /// 著者名
    pub author: String,
    /// 画像ファイルのパスリスト（順序付き）
    pub images: Vec<String>,
    /// 表紙に使用する画像のインデックス（None: 最初の画像）
    pub cover_index: Option<usize>,
    /// 出力先パス
    pub output_path: String,
    /// リサイズ有効化（デフォルト: false、元画像を使用）
    pub resize_enabled: bool,
    /// リサイズ時の最大幅
    pub max_image_width: Option<u32>,
    /// EPUBバージョン ("2.0" or "3.0")
    pub epub_version: String,
    /// ページ方向 ("ltr" or "rtl")
    pub page_direction: String,
}

/// 一括EPUB生成設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchEpubConfig {
    /// 親フォルダのパス
    pub parent_path: String,
    /// 著者名
    pub author: String,
    /// 出力先ディレクトリ
    pub output_dir: String,
    /// リサイズ有効化
    pub resize_enabled: bool,
    /// リサイズ時の最大幅
    pub max_image_width: Option<u32>,
    /// EPUBバージョン
    pub epub_version: String,
    /// ページ方向
    pub page_direction: String,
}

/// EPUB生成進捗イベント
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    /// 進捗率（0〜100）
    pub progress: u32,
    /// 現在の処理対象
    pub current_file: String,
    /// 処理済みファイル数
    pub processed: usize,
    /// 総ファイル数
    pub total: usize,
    /// メッセージ
    pub message: String,
}

/// 一括生成進捗イベント
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProgressEvent {
    /// 全体の進捗率
    pub overall_progress: u32,
    /// 現在処理中のフォルダ名
    pub current_folder: String,
    /// 処理済みフォルダ数
    pub processed_folders: usize,
    /// 総フォルダ数
    pub total_folders: usize,
    /// 個別ファイル進捗
    pub file_progress: u32,
    /// メッセージ
    pub message: String,
}
