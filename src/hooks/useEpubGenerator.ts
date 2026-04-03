import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  ImageInfo,
  ImageItem,
  EpubConfig,
  BatchEpubConfig,
  ProgressEvent,
  BatchProgressEvent,
  SubfolderInfo,
} from '../types';

export function useEpubGenerator() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [subfolders, setSubfolders] = useState<SubfolderInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);
  const [generatedPaths, setGeneratedPaths] = useState<string[]>([]);

  // 進捗イベントのリスナー設定
  useEffect(() => {
    const unlistenProgress = listen<ProgressEvent>('epub-progress', (event) => {
      setProgress(event.payload);
    });
    const unlistenBatch = listen<BatchProgressEvent>('batch-progress', (event) => {
      setBatchProgress(event.payload);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenBatch.then((fn) => fn());
    };
  }, []);

  /** フォルダをスキャンして画像一覧を取得 */
  const scanFolder = useCallback(async (path: string, recursive: boolean) => {
    setIsScanning(true);
    setError(null);
    setImages([]);
    try {
      const result = await invoke<ImageInfo[]>('scan_folder', { path, recursive });
      const items: ImageItem[] = result.map((img, idx) => ({
        ...img,
        excluded: false,
        isCover: idx === 0,
      }));
      setImages(items);
      return items;
    } catch (e) {
      setError(String(e));
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  /** サブフォルダ一覧を取得 */
  const scanSubfolders = useCallback(async (path: string) => {
    setIsScanning(true);
    setError(null);
    setSubfolders([]);
    try {
      const result = await invoke<SubfolderInfo[]>('scan_subfolders', { path });
      setSubfolders(result);
      return result;
    } catch (e) {
      setError(String(e));
      return [];
    } finally {
      setIsScanning(false);
    }
  }, []);

  /** サムネイル取得 */
  const loadThumbnail = useCallback(async (path: string, maxSize: number = 200) => {
    try {
      const thumb = await invoke<string>('generate_thumbnail', { path, maxSize });
      return thumb;
    } catch {
      return undefined;
    }
  }, []);

  /** 画像リストのサムネイルをバッチロード */
  const loadThumbnails = useCallback(
    async (items: ImageItem[]) => {
      const batchSize = 5;
      const updatedItems = [...items];

      for (let i = 0; i < updatedItems.length; i += batchSize) {
        const batch = updatedItems.slice(i, i + batchSize);
        const thumbnails = await Promise.all(
          batch.map((item) => loadThumbnail(item.path))
        );

        for (let j = 0; j < batch.length; j++) {
          updatedItems[i + j] = { ...updatedItems[i + j], thumbnail: thumbnails[j] };
        }

        setImages([...updatedItems]);
      }
    },
    [loadThumbnail]
  );

  /** 表紙画像を設定 */
  const setCover = useCallback((index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isCover: i === index,
      }))
    );
  }, []);

  /** 画像の除外/復元をトグル */
  const toggleExclude = useCallback((index: number) => {
    setImages((prev) =>
      prev.map((img, i) => {
        if (i === index) {
          return { ...img, excluded: !img.excluded };
        }
        return img;
      })
    );
  }, []);

  /** 単一EPUB生成 */
  const generateEpub = useCallback(async (config: EpubConfig) => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    setGeneratedPath(null);

    try {
      const result = await invoke<string>('generate_epub', { config });
      setGeneratedPath(result);
      return result;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /** 一括EPUB生成 */
  const batchGenerateEpub = useCallback(async (config: BatchEpubConfig) => {
    setIsGenerating(true);
    setError(null);
    setBatchProgress(null);
    setGeneratedPaths([]);

    try {
      const result = await invoke<string[]>('batch_generate_epub', { config });
      setGeneratedPaths(result);
      return result;
    } catch (e) {
      setError(String(e));
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /** エラーをクリア */
  const clearError = useCallback(() => setError(null), []);

  /** 状態をリセット */
  const reset = useCallback(() => {
    setImages([]);
    setSubfolders([]);
    setProgress(null);
    setBatchProgress(null);
    setError(null);
    setGeneratedPath(null);
    setGeneratedPaths([]);
  }, []);

  return {
    images,
    setImages,
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
    loadThumbnail,
    loadThumbnails,
    setCover,
    toggleExclude,
    generateEpub,
    batchGenerateEpub,
    clearError,
    reset,
  };
}
