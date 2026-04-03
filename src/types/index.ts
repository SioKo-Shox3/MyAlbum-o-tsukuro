/** スキャンされた画像ファイル情報 */
export interface ImageInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  modified: number;
}

/** サブフォルダ情報 */
export interface SubfolderInfo {
  path: string;
  name: string;
  image_count: number;
}

/** EPUB生成設定 */
export interface EpubConfig {
  title: string;
  author: string;
  images: string[];
  cover_index: number | null;
  output_path: string;
  resize_enabled: boolean;
  max_image_width: number | null;
  epub_version: string;
  page_direction: string;
}

/** 一括EPUB生成設定 */
export interface BatchEpubConfig {
  parent_path: string;
  author: string;
  output_dir: string;
  resize_enabled: boolean;
  max_image_width: number | null;
  epub_version: string;
  page_direction: string;
}

/** 進捗イベント */
export interface ProgressEvent {
  progress: number;
  current_file: string;
  processed: number;
  total: number;
  message: string;
}

/** 一括生成進捗イベント */
export interface BatchProgressEvent {
  overall_progress: number;
  current_folder: string;
  processed_folders: number;
  total_folders: number;
  file_progress: number;
  message: string;
}

/** アプリのワークフローステップ */
export type AppStep = 'select' | 'preview' | 'generate';

/** ソート種別 */
export type SortType = 'name' | 'date' | 'size';

/** ソート方向 */
export type SortDirection = 'asc' | 'desc';

/** 動作モード */
export type AppMode = 'single' | 'batch';

/** 画像アイテム（UI上で管理する画像情報） */
export interface ImageItem extends ImageInfo {
  /** サムネイルのBase64データURI */
  thumbnail?: string;
  /** 除外されているか */
  excluded: boolean;
  /** 表紙として選択されているか */
  isCover: boolean;
}
