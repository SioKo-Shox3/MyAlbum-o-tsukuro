import { useState, useMemo } from 'react';
import type { ImageItem, SortType, SortDirection } from '../types';
import { ImageCard } from './ImageCard';
import './ImageGrid.css';

interface ImageGridProps {
  images: ImageItem[];
  onToggleExclude: (index: number) => void;
  onSetCover: (index: number) => void;
}

export function ImageGrid({ images, onToggleExclude, onSetCover }: ImageGridProps) {
  const [sortType, setSortType] = useState<SortType>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [extensionFilter, setExtensionFilter] = useState<string>('all');

  // 使用可能な拡張子リスト
  const availableExtensions = useMemo(() => {
    const exts = new Set(images.map((img) => img.extension));
    return Array.from(exts).sort();
  }, [images]);

  // フィルタ・ソート済みの画像リスト
  const filteredImages = useMemo(() => {
    let result = images.map((img, originalIndex) => ({ img, originalIndex }));

    // 検索フィルタ
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(({ img }) => img.name.toLowerCase().includes(q));
    }

    // 拡張子フィルタ
    if (extensionFilter !== 'all') {
      result = result.filter(({ img }) => img.extension === extensionFilter);
    }

    // ソート
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortType) {
        case 'name':
          cmp = a.img.name.localeCompare(b.img.name, 'ja', { numeric: true });
          break;
        case 'date':
          cmp = a.img.modified - b.img.modified;
          break;
        case 'size':
          cmp = a.img.size - b.img.size;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [images, sortType, sortDirection, searchQuery, extensionFilter]);

  const activeCount = images.filter((img) => !img.excluded).length;
  const excludedCount = images.filter((img) => img.excluded).length;

  return (
    <div className="image-grid-container">
      {/* ツールバー */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="input toolbar-input"
              placeholder="ファイル名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="toolbar-right">
          <select
            className="select toolbar-select"
            value={extensionFilter}
            onChange={(e) => setExtensionFilter(e.target.value)}
          >
            <option value="all">すべての形式</option>
            {availableExtensions.map((ext) => (
              <option key={ext} value={ext}>
                {ext.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            className="select toolbar-select"
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
          >
            <option value="name">ファイル名順</option>
            <option value="date">日時順</option>
            <option value="size">サイズ順</option>
          </select>

          <button
            className="btn btn-ghost btn-sm sort-direction-btn"
            onClick={() =>
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            title={sortDirection === 'asc' ? '昇順' : '降順'}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* ステータスバー */}
      <div className="grid-status">
        <span className="status-count">
          表示: {filteredImages.length} / {images.length} 枚
        </span>
        <span className="status-active">
          選択中: {activeCount} 枚
        </span>
        {excludedCount > 0 && (
          <span className="status-excluded">除外: {excludedCount} 枚</span>
        )}
      </div>

      {/* グリッド */}
      <div className="image-grid">
        {filteredImages.map(({ img, originalIndex }) => (
          <ImageCard
            key={img.path}
            image={img}
            index={originalIndex}
            onToggleExclude={onToggleExclude}
            onSetCover={onSetCover}
          />
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="grid-empty">
          <p>条件に一致する画像がありません</p>
        </div>
      )}
    </div>
  );
}
