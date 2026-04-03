import type { ProgressEvent, BatchProgressEvent } from '../types';
import './ProgressOverlay.css';

interface ProgressOverlayProps {
  progress: ProgressEvent | null;
  batchProgress: BatchProgressEvent | null;
  isComplete: boolean;
  generatedPath: string | null;
  generatedPaths: string[];
  onClose: () => void;
}

export function ProgressOverlay({
  progress,
  batchProgress,
  isComplete,
  generatedPath,
  generatedPaths,
  onClose,
}: ProgressOverlayProps) {
  const currentProgress = batchProgress?.overall_progress ?? progress?.progress ?? 0;
  const message = batchProgress?.message ?? progress?.message ?? '準備中...';

  return (
    <div className="progress-overlay">
      <div className="progress-modal card">
        {isComplete ? (
          <div className="progress-success">
            <div className="success-icon">✓</div>
            <h2 className="success-title">生成完了！</h2>
            {generatedPath && (
              <p className="success-path" title={generatedPath}>
                📄 {generatedPath.split(/[\\/]/).pop()}
              </p>
            )}
            {generatedPaths.length > 0 && (
              <div className="success-list">
                <p className="success-count">{generatedPaths.length} 冊のEPUBを生成しました</p>
                <ul className="generated-files">
                  {generatedPaths.slice(0, 10).map((p, i) => (
                    <li key={i} className="generated-file" title={p}>
                      📄 {p.split(/[\\/]/).pop()}
                    </li>
                  ))}
                  {generatedPaths.length > 10 && (
                    <li className="generated-file more">
                      ...他 {generatedPaths.length - 10} 件
                    </li>
                  )}
                </ul>
              </div>
            )}
            <button className="btn btn-primary btn-lg" onClick={onClose}>
              完了
            </button>
          </div>
        ) : (
          <div className="progress-content">
            <h2 className="progress-title">
              {batchProgress ? '📚 一括生成中...' : '📖 EPUB生成中...'}
            </h2>

            <div className="progress-bar-container">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <span className="progress-percent">{currentProgress}%</span>
            </div>

            <p className="progress-message">{message}</p>

            {batchProgress && (
              <div className="batch-info">
                <span className="batch-label">
                  フォルダ: {batchProgress.processed_folders}/{batchProgress.total_folders}
                </span>
                <div className="progress-bar progress-bar-sub">
                  <div
                    className="progress-bar-fill progress-bar-fill-sub"
                    style={{ width: `${batchProgress.file_progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
