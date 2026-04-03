import { save } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';
import type { AppMode } from '../types';
import './MetadataForm.css';

interface MetadataFormProps {
  mode: AppMode;
  folderPath: string;
  imageCount: number;
  onGenerate: (config: MetadataConfig) => void;
  onBack: () => void;
  isGenerating: boolean;
}

export interface MetadataConfig {
  title: string;
  author: string;
  outputPath: string;
  resizeEnabled: boolean;
  maxImageWidth: number;
  epubVersion: string;
  pageDirection: string;
}

export function MetadataForm({
  mode,
  folderPath,
  imageCount,
  onGenerate,
  onBack,
  isGenerating,
}: MetadataFormProps) {
  // フォルダ名からデフォルトタイトルを生成
  const defaultTitle = folderPath.split(/[\\/]/).pop() || 'マイアルバム';

  const [title, setTitle] = useState(defaultTitle);
  const [author, setAuthor] = useState('');
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [maxImageWidth, setMaxImageWidth] = useState(1600);
  const [epubVersion, setEpubVersion] = useState('3.0');
  const [pageDirection, setPageDirection] = useState('ltr');

  const handleGenerate = async () => {
    let outputPath: string;

    if (mode === 'single') {
      const selected = await save({
        title: 'EPUBの保存先を選択',
        defaultPath: `${title}.epub`,
        filters: [{ name: 'EPUB', extensions: ['epub'] }],
      });
      if (!selected) return;
      outputPath = selected;
    } else {
      // バッチモード: フォルダ選択
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        title: 'EPUBの出力先フォルダを選択',
      });
      if (!selected || typeof selected !== 'string') return;
      outputPath = selected;
    }

    onGenerate({
      title,
      author,
      outputPath,
      resizeEnabled,
      maxImageWidth,
      epubVersion,
      pageDirection,
    });
  };

  return (
    <div className="metadata-form">
      <div className="form-card card">
        <h2 className="form-title">📝 メタデータ設定</h2>

        <div className="form-grid">
          <div className="form-group">
            <label className="label" htmlFor="input-title">タイトル</label>
            <input
              id="input-title"
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="書籍タイトルを入力"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="input-author">著者</label>
            <input
              id="input-author"
              className="input"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="著者名を入力"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="select-version">EPUBバージョン</label>
            <select
              id="select-version"
              className="select"
              value={epubVersion}
              onChange={(e) => setEpubVersion(e.target.value)}
            >
              <option value="3.0">EPUB 3.0（推奨）</option>
              <option value="2.0">EPUB 2.0</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="select-direction">ページ方向</label>
            <select
              id="select-direction"
              className="select"
              value={pageDirection}
              onChange={(e) => setPageDirection(e.target.value)}
            >
              <option value="ltr">左から右（左綴じ）</option>
              <option value="rtl">右から左（右綴じ）</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">画像処理設定</h3>

          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={resizeEnabled}
              onChange={(e) => setResizeEnabled(e.target.checked)}
            />
            <span>自動リサイズを有効にする</span>
          </label>

          {resizeEnabled && (
            <div className="form-group resize-options">
              <label className="label" htmlFor="input-maxwidth">最大幅 (px)</label>
              <input
                id="input-maxwidth"
                className="input"
                type="number"
                value={maxImageWidth}
                onChange={(e) => setMaxImageWidth(Number(e.target.value))}
                min={320}
                max={4096}
                step={100}
              />
            </div>
          )}
        </div>

        <div className="form-summary">
          <div className="summary-item">
            <span className="summary-label">画像数</span>
            <span className="summary-value">{imageCount} 枚</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">フォルダ</span>
            <span className="summary-value summary-path" title={folderPath}>
              {folderPath}
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onBack} disabled={isGenerating}>
            ← 戻る
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim()}
          >
            {mode === 'single' ? '📖 EPUBを生成' : '📚 一括生成'}
          </button>
        </div>
      </div>
    </div>
  );
}
