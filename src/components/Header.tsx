import type { AppStep } from '../types';
import './Header.css';

interface HeaderProps {
  currentStep: AppStep;
  imageCount: number;
}

const STEPS: { key: AppStep; label: string; icon: string }[] = [
  { key: 'select', label: 'フォルダ選択', icon: '📁' },
  { key: 'preview', label: 'プレビュー', icon: '🖼️' },
  { key: 'generate', label: 'EPUB生成', icon: '📖' },
];

export function Header({ currentStep, imageCount }: HeaderProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <header className="header" data-tauri-drag-region>
      <div className="header-content">
        <div className="header-brand">
          <span className="header-logo">📚</span>
          <h1 className="header-title">MyAlbum</h1>
          <span className="header-subtitle">アルバムをつくろう</span>
        </div>

        <nav className="header-stepper">
          {STEPS.map((step, idx) => (
            <div
              key={step.key}
              className={`stepper-item ${
                idx < currentIdx
                  ? 'stepper-completed'
                  : idx === currentIdx
                  ? 'stepper-active'
                  : 'stepper-pending'
              }`}
            >
              <div className="stepper-indicator">
                {idx < currentIdx ? (
                  <span className="stepper-check">✓</span>
                ) : (
                  <span className="stepper-icon">{step.icon}</span>
                )}
              </div>
              <span className="stepper-label">{step.label}</span>
              {idx < STEPS.length - 1 && <div className="stepper-connector" />}
            </div>
          ))}
        </nav>

        {imageCount > 0 && (
          <div className="header-info">
            <span className="badge badge-accent">{imageCount} 枚</span>
          </div>
        )}
      </div>
    </header>
  );
}
