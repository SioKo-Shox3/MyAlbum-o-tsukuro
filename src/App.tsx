import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { FolderSelector } from './components/FolderSelector';
import { ImageGrid } from './components/ImageGrid';
import { MetadataForm } from './components/MetadataForm';
import type { MetadataConfig } from './components/MetadataForm';
import { ProgressOverlay } from './components/ProgressOverlay';
import { useEpubGenerator } from './hooks/useEpubGenerator';
import type { AppStep, AppMode, EpubConfig, BatchEpubConfig } from './types';
import './App.css';

function App() {
  const [step, setStep] = useState<AppStep>('select');
  const [mode, setMode] = useState<AppMode>('single');
  const [folderPath, setFolderPath] = useState('');
  const [showProgress, setShowProgress] = useState(false);

  const {
    images,
    subfolders,
    isScanning,
    isGenerating,
    progress,
    batchProgress,
    error,
    generatedPath,
    generatedPaths,
    scanFolder,
    scanSubfolders,
    loadThumbnails,
    setCover,
    toggleExclude,
    generateEpub,
    batchGenerateEpub,
    clearError,
    reset,
  } = useEpubGenerator();

  // フォルダが選択された時の処理
  const handleFolderSelected = useCallback(
    async (path: string) => {
      setFolderPath(path);
      clearError();

      if (mode === 'single') {
        const items = await scanFolder(path, false);
        if (items.length > 0) {
          setStep('preview');
          // サムネイルをバックグラウンドでロード
          loadThumbnails(items);
        }
      } else {
        const folders = await scanSubfolders(path);
        if (folders.length > 0) {
          setStep('generate');
        }
      }
    },
    [mode, scanFolder, scanSubfolders, loadThumbnails, clearError]
  );

  // EPUB生成実行
  const handleGenerate = useCallback(
    async (config: MetadataConfig) => {
      setShowProgress(true);

      if (mode === 'single') {
        const activeImages = images
          .filter((img) => !img.excluded)
          .map((img) => img.path);

        const coverIdx = images.findIndex((img) => img.isCover && !img.excluded);

        const epubConfig: EpubConfig = {
          title: config.title,
          author: config.author,
          images: activeImages,
          cover_index: coverIdx >= 0 ? coverIdx : 0,
          output_path: config.outputPath,
          resize_enabled: config.resizeEnabled,
          max_image_width: config.resizeEnabled ? config.maxImageWidth : null,
          epub_version: config.epubVersion,
          page_direction: config.pageDirection,
        };

        await generateEpub(epubConfig);
      } else {
        const batchConfig: BatchEpubConfig = {
          parent_path: folderPath,
          author: config.author,
          output_dir: config.outputPath,
          resize_enabled: config.resizeEnabled,
          max_image_width: config.resizeEnabled ? config.maxImageWidth : null,
          epub_version: config.epubVersion,
          page_direction: config.pageDirection,
        };

        await batchGenerateEpub(batchConfig);
      }
    },
    [mode, images, folderPath, generateEpub, batchGenerateEpub]
  );

  // 最初に戻る
  const handleReset = useCallback(() => {
    setStep('select');
    setFolderPath('');
    setShowProgress(false);
    reset();
  }, [reset]);

  // プレビューからフォームへ
  const handleProceedToGenerate = useCallback(() => {
    setStep('generate');
  }, []);

  // フォームからプレビューに戻る
  const handleBackToPreview = useCallback(() => {
    if (mode === 'single') {
      setStep('preview');
    } else {
      setStep('select');
    }
  }, [mode]);

  // 進捗オーバーレイを閉じて最初に戻る
  const handleProgressClose = useCallback(() => {
    setShowProgress(false);
    handleReset();
  }, [handleReset]);

  const isComplete =
    !isGenerating &&
    showProgress &&
    (generatedPath !== null || generatedPaths.length > 0);

  const activeImageCount = images.filter((img) => !img.excluded).length;

  // エラー表示を自動クリア
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 8000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="app">
      <Header
        currentStep={step}
        imageCount={mode === 'single' ? activeImageCount : subfolders.reduce((sum, f) => sum + f.image_count, 0)}
      />

      <main className="app-main">
        {/* エラー通知 */}
        {error && (
          <div className="error-toast" onClick={clearError}>
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <span className="error-dismiss">✕</span>
          </div>
        )}

        {/* ステップ1: フォルダ選択 */}
        {step === 'select' && (
          <FolderSelector
            onFolderSelected={handleFolderSelected}
            mode={mode}
            onModeChange={setMode}
            isScanning={isScanning}
          />
        )}

        {/* ステップ2: プレビュー（単一モードのみ） */}
        {step === 'preview' && mode === 'single' && (
          <div className="preview-step">
            <ImageGrid
              images={images}
              onToggleExclude={toggleExclude}
              onSetCover={setCover}
            />
            <div className="preview-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                ← フォルダ選択
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleProceedToGenerate}
                disabled={activeImageCount === 0}
              >
                次へ: メタデータ設定 →
              </button>
            </div>
          </div>
        )}

        {/* ステップ3: メタデータ & 生成 */}
        {step === 'generate' && (
          <MetadataForm
            mode={mode}
            folderPath={folderPath}
            imageCount={
              mode === 'single'
                ? activeImageCount
                : subfolders.reduce((sum, f) => sum + f.image_count, 0)
            }
            onGenerate={handleGenerate}
            onBack={handleBackToPreview}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* 進捗オーバーレイ */}
      {showProgress && (
        <ProgressOverlay
          progress={progress}
          batchProgress={batchProgress}
          isComplete={isComplete}
          generatedPath={generatedPath}
          generatedPaths={generatedPaths}
          onClose={handleProgressClose}
        />
      )}
    </div>
  );
}

export default App;
