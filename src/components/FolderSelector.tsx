import { open } from '@tauri-apps/plugin-dialog';
import type { AppMode } from '../types';
import './FolderSelector.css';

interface FolderSelectorProps {
  onFolderSelected: (path: string) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isScanning: boolean;
}

export function FolderSelector({
  onFolderSelected,
  mode,
  onModeChange,
  isScanning,
}: FolderSelectorProps) {
  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'フォルダを選択してください',
    });

    if (selected && typeof selected === 'string') {
      onFolderSelected(selected);
    }
  };

  return (
    <div className="folder-selector">
      <div className="folder-selector-bg-glow" />

      <div className="folder-selector-content">
        <div className="mode-switcher">
          <button
            className={`mode-btn ${mode === 'single' ? 'mode-btn-active' : ''}`}
            onClick={() => onModeChange('single')}
          >
            <span className="mode-icon">📖</span>
            <span className="mode-label">単一EPUB</span>
            <span className="mode-desc">フォルダの画像を1冊にまとめる</span>
          </button>
          <button
            className={`mode-btn ${mode === 'batch' ? 'mode-btn-active' : ''}`}
            onClick={() => onModeChange('batch')}
          >
            <span className="mode-icon">📚</span>
            <span className="mode-label">一括生成</span>
            <span className="mode-desc">サブフォルダごとに1冊ずつ生成</span>
          </button>
        </div>

        <button
          className="folder-dropzone"
          onClick={handleSelectFolder}
          disabled={isScanning}
        >
          {isScanning ? (
            <div className="scanning-indicator">
              <div className="scanning-spinner" />
              <span className="scanning-text">スキャン中...</span>
            </div>
          ) : (
            <>
              <div className="dropzone-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <div className="dropzone-text">
                <p className="dropzone-title">
                  {mode === 'single'
                    ? '画像フォルダを選択'
                    : 'サブフォルダを含む親フォルダを選択'
                  }
                </p>
                <p className="dropzone-hint">
                  クリックしてフォルダを選択してください
                </p>
                <p className="dropzone-formats">
                  対応形式: JPG, PNG, WebP, GIF, BMP, TIFF
                </p>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
