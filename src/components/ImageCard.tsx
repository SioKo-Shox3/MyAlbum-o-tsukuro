import type { ImageItem } from '../types';
import './ImageCard.css';

interface ImageCardProps {
  image: ImageItem;
  index: number;
  onToggleExclude: (index: number) => void;
  onSetCover: (index: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageCard({ image, index, onToggleExclude, onSetCover }: ImageCardProps) {
  return (
    <div
      className={`image-card ${image.excluded ? 'image-card-excluded' : ''} ${
        image.isCover ? 'image-card-cover' : ''
      }`}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="image-card-preview">
        {image.thumbnail ? (
          <img
            src={image.thumbnail}
            alt={image.name}
            className="image-card-img"
            loading="lazy"
          />
        ) : (
          <div className="image-card-placeholder">
            <div className="placeholder-shimmer" />
          </div>
        )}

        {/* バッジ */}
        <div className="image-card-badges">
          {image.isCover && (
            <span className="badge badge-accent">表紙</span>
          )}
          {image.excluded && (
            <span className="badge badge-error">除外</span>
          )}
        </div>

        {/* ホバーオーバーレイ */}
        <div className="image-card-overlay">
          <button
            className="overlay-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSetCover(index);
            }}
            title="表紙に設定"
          >
            📖
          </button>
          <button
            className="overlay-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExclude(index);
            }}
            title={image.excluded ? '復元' : '除外'}
          >
            {image.excluded ? '♻️' : '🚫'}
          </button>
        </div>
      </div>

      <div className="image-card-info">
        <p className="image-card-name" title={image.name}>
          {image.name}
        </p>
        <p className="image-card-meta">
          <span>{image.extension.toUpperCase()}</span>
          <span className="meta-dot">·</span>
          <span>{formatFileSize(image.size)}</span>
        </p>
      </div>
    </div>
  );
}
