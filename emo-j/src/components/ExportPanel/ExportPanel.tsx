import { useCallback, useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { sliceImageOnly, type MattingBounds, type SliceResult } from '../../utils/imageProcessor';
import { TaskQueueManager, type MattingTask } from '../../utils/taskQueueManager';
import { ProgressDisplay } from '../ProgressDisplay/ProgressDisplay';
import { notifyMattingComplete, notifyMattingPartial, requestNotificationPermission } from '../../utils/notifications';
import './ExportPanel.css';

export interface ExportPanelProps {
  imageUrl: string;
  onExportAll: (blob: Blob) => void;
  onExportSingle: (blob: Blob, index: number) => void;
}

const ROWS = 3;
const COLS = 2;

interface MattingPreview {
  index: number;
  bounds: MattingBounds;
  blob: Blob;
}

async function createZipBlob(results: { blob: Blob; index: number }[], prefix: string = 'emoji'): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < results.length; i++) {
    const fileName = `${prefix}_${String(results[i].index + 1).padStart(2, '0')}.png`;
    zip.file(fileName, results[i].blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

function extractBoundsFromCanvas(canvas: HTMLCanvasElement): MattingBounds {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { minX: 0, minY: 0, maxX: canvas.width, maxY: canvas.height };
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { minX: minX || 0, minY: minY || 0, maxX: maxX || width, maxY: maxY || height };
}

async function processMattingResult(blob: Blob): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');

  let finalBlob: Blob = blob;

  if (ctx) {
    ctx.drawImage(img, 0, 0);
    const bounds = extractBoundsFromCanvas(canvas);

    const paddingX = Math.max(20, Math.floor((bounds.maxX - bounds.minX) * 0.05));
    const paddingY = Math.max(20, Math.floor((bounds.maxY - bounds.minY) * 0.05));

    const newMinX = Math.max(0, bounds.minX - paddingX);
    const newMinY = Math.max(0, bounds.minY - paddingY);
    const newMaxX = Math.min(canvas.width, bounds.maxX + paddingX);
    const newMaxY = Math.min(canvas.height, bounds.maxY + paddingY);

    const newWidth = newMaxX - newMinX;
    const newHeight = newMaxY - newMinY;

    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = newWidth;
    resultCanvas.height = newHeight;
    const resultCtx = resultCanvas.getContext('2d');

    if (resultCtx) {
      resultCtx.drawImage(
        canvas,
        newMinX, newMinY, newWidth, newHeight,
        0, 0, newWidth, newHeight
      );

      const croppedBlob = await new Promise<Blob | null>((resolve) => {
        resultCanvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (croppedBlob) {
        finalBlob = croppedBlob;
      }
    }
  }

  URL.revokeObjectURL(img.src);
  return finalBlob;
}

export function ExportPanel({ imageUrl, onExportAll, onExportSingle }: ExportPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [mattingEnabled, setMattingEnabled] = useState(false);
  const [originalSlices, setOriginalSlices] = useState<SliceResult[]>([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [originalPreviewUrls, setOriginalPreviewUrls] = useState<Map<number, string>>(new Map());
  const [mattingPreviewUrls, setMattingPreviewUrls] = useState<Map<number, string>>(new Map());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'original' | 'matting'>('matting');
  const [mattingPreviews, setMattingPreviews] = useState<MattingPreview[]>([]);
  
  const [isMattingProcessing, setIsMattingProcessing] = useState(false);
  const [mattingProgress, setMattingProgress] = useState({ total: 0, completed: 0, processing: 0, failed: 0 });
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number | null>(null);
  
  const taskManagerRef = useRef<TaskQueueManager | null>(null);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!taskManagerRef.current) {
      taskManagerRef.current = new TaskQueueManager(2);
    }
    
    const manager = taskManagerRef.current;
    
    const unsubStart = manager.on('start', (task: MattingTask) => {
      setCurrentProcessingIndex(task.index);
    });
    
    const unsubProgress = manager.on('progress', () => {
      const progress = manager.getProgress();
      setMattingProgress(progress);
    });
    
    const unsubComplete = manager.on('complete', async (task: MattingTask) => {
      if (task.result) {
        try {
          const processedBlob = await processMattingResult(task.result);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = URL.createObjectURL(processedBlob);
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const bounds = extractBoundsFromCanvas(canvas);
            
            setMattingPreviews(prev => {
              const existing = prev.find(p => p.index === task.index);
              if (existing) return prev;
              return [...prev, {
                index: task.index,
                bounds,
                blob: processedBlob
              }].sort((a, b) => a.index - b.index);
            });
          }
          
          URL.revokeObjectURL(img.src);
        } catch (err) {
          console.error('处理抠图结果失败:', err);
        }
      }
      
      const progress = manager.getProgress();
      setMattingProgress(progress);
      
      if (!manager.isProcessing()) {
        setIsMattingProcessing(false);
        setCurrentProcessingIndex(null);
        
        const completed = manager.getCompletedTasks();
        const failed = progress.failed;
        
        if (failed > 0) {
          notifyMattingPartial(completed.length, failed);
        } else {
          notifyMattingComplete(completed.length);
        }
      }
    });
    
    const unsubFail = manager.on('fail', () => {
      const progress = manager.getProgress();
      setMattingProgress(progress);
      
      if (!manager.isProcessing()) {
        setIsMattingProcessing(false);
        setCurrentProcessingIndex(null);
      }
    });
    
    const unsubCancel = manager.on('cancel', () => {
      const progress = manager.getProgress();
      setMattingProgress(progress);
      
      if (!manager.isProcessing()) {
        setIsMattingProcessing(false);
        setCurrentProcessingIndex(null);
      }
    });
    
    return () => {
      unsubStart();
      unsubProgress();
      unsubComplete();
      unsubFail();
      unsubCancel();
    };
  }, []);

  useEffect(() => {
    return () => {
      originalPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      mattingPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      taskManagerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (originalSlices.length > 0) {
      const urlMap = new Map<number, string>();
      originalSlices.forEach((slice) => {
        urlMap.set(slice.index, URL.createObjectURL(slice.blob));
      });
      setOriginalPreviewUrls(urlMap);
      return () => {
        urlMap.forEach((url) => URL.revokeObjectURL(url));
      };
    } else {
      setOriginalPreviewUrls(new Map());
    }
  }, [originalSlices]);

  useEffect(() => {
    if (mattingPreviews.length > 0) {
      const urlMap = new Map<number, string>();
      mattingPreviews.forEach((preview) => {
        urlMap.set(preview.index, URL.createObjectURL(preview.blob));
      });
      setMattingPreviewUrls(urlMap);
      return () => {
        urlMap.forEach((url) => URL.revokeObjectURL(url));
      };
    } else {
      setMattingPreviewUrls(new Map());
    }
  }, [mattingPreviews]);

  useEffect(() => {
    setOriginalSlices([]);
    setHasProcessed(false);
    setPreviewIndex(null);
    setMattingPreviews([]);
    setIsMattingProcessing(false);
    setMattingProgress({ total: 0, completed: 0, processing: 0, failed: 0 });
    taskManagerRef.current?.reset();
  }, [imageUrl]);

  const handleToggleMatting = useCallback(() => {
    setMattingEnabled((prev) => !prev);
    if (mattingEnabled) {
      setMattingPreviews([]);
    }
  }, [mattingEnabled]);

  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewMode(mattingEnabled && mattingPreviews.some((p) => p.index === index) ? 'matting' : 'original');
  }, [mattingEnabled, mattingPreviews]);

  const closePreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  const goToPrevious = useCallback(() => {
    if (previewIndex !== null && previewIndex > 0) {
      const newIndex = previewIndex - 1;
      setPreviewIndex(newIndex);
      if (mattingEnabled && mattingPreviews.some((p) => p.index === newIndex)) {
        setPreviewMode('matting');
      } else {
        setPreviewMode('original');
      }
    }
  }, [previewIndex, mattingEnabled, mattingPreviews]);

  const goToNext = useCallback(() => {
    if (previewIndex !== null && previewIndex < ROWS * COLS - 1) {
      const newIndex = previewIndex + 1;
      setPreviewIndex(newIndex);
      if (mattingEnabled && mattingPreviews.some((p) => p.index === newIndex)) {
        setPreviewMode('matting');
      } else {
        setPreviewMode('original');
      }
    }
  }, [previewIndex, mattingEnabled, mattingPreviews]);

  const generatePreviews = useCallback(async () => {
    if (!imageUrl) return;

    setIsLoading(true);
    setLoadingText('正在分割图片...');

    try {
      const slices = await sliceImageOnly(imageUrl);
      setOriginalSlices(slices);
      setHasProcessed(true);
    } catch (err) {
      console.error('分割失败:', err);
      alert('分割失败，请重试');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, [imageUrl]);

  const handleBatchSetMatting = useCallback(async () => {
    if (!hasProcessed || originalSlices.length === 0 || !taskManagerRef.current) return;

    setIsMattingProcessing(true);
    setMattingProgress({ total: originalSlices.length, completed: 0, processing: 0, failed: 0 });
    setMattingPreviews([]);

    const tasks = originalSlices.map(slice => ({
      blob: slice.blob,
      index: slice.index
    }));

    await taskManagerRef.current.addTasks(tasks);
  }, [hasProcessed, originalSlices]);

  const handleCancelMatting = useCallback(() => {
    if (taskManagerRef.current) {
      taskManagerRef.current.cancelAll();
      setIsMattingProcessing(false);
      setCurrentProcessingIndex(null);
    }
  }, []);

  const handleClearAllMatting = useCallback(() => {
    if (isMattingProcessing) {
      handleCancelMatting();
    }
    setMattingPreviews([]);
  }, [isMattingProcessing, handleCancelMatting]);

  const handleClearSingleMatting = useCallback((index: number) => {
    setMattingPreviews((prev) => prev.filter((p) => p.index !== index));
  }, []);

  const handleExportSingle = useCallback(
    async (index: number) => {
      const mattingPreview = mattingPreviews.find((p) => p.index === index);
      const slice = originalSlices.find((s) => s.index === index);

      if (!slice) return;

      setIsLoading(true);
      setLoadingText(`正在下载第 ${index + 1} 张...`);

      try {
        const blob = mattingPreview ? mattingPreview.blob : slice.blob;
        const fileName = `emoji_${String(index + 1).padStart(2, '0')}.png`;
        saveAs(blob, fileName);
        onExportSingle(blob, index);
      } catch (err) {
        console.error('导出单张失败:', err);
        alert('导出失败，请重试');
      } finally {
        setIsLoading(false);
        setLoadingText('');
      }
    },
    [mattingPreviews, originalSlices, onExportSingle]
  );

  const handleExportAllMatting = useCallback(async () => {
    if (mattingPreviews.length === 0) {
      alert('没有可导出的抠图图像');
      return;
    }

    setIsLoading(true);
    setLoadingText('正在打包抠图图像...');

    try {
      const results = mattingPreviews.map((p) => ({ blob: p.blob, index: p.index }));
      const zipBlob = await createZipBlob(results, 'emoji_matting');
      saveAs(zipBlob, 'emoj_matting.zip');
      onExportAll(zipBlob);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, [mattingPreviews, onExportAll]);

  const handleExportAllOriginal = useCallback(async () => {
    if (originalSlices.length === 0) {
      alert('没有可导出的图像');
      return;
    }

    setIsLoading(true);
    setLoadingText('正在打包原始图像...');

    try {
      const results = originalSlices.map((s) => ({ blob: s.blob, index: s.index }));
      const zipBlob = await createZipBlob(results, 'emoji_original');
      saveAs(zipBlob, 'emoj_original.zip');
      onExportAll(zipBlob);
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, [originalSlices, onExportAll]);

  const getPreviewUrl = useCallback(
    (index: number): string => {
      if (mattingEnabled && previewMode === 'matting') {
        const mattingUrl = mattingPreviewUrls.get(index);
        if (mattingUrl) {
          return mattingUrl;
        }
      }
      return originalPreviewUrls.get(index) || '';
    },
    [mattingEnabled, previewMode, mattingPreviewUrls, originalPreviewUrls]
  );

  const getHasMatting = useCallback(
    (index: number): boolean => {
      return mattingPreviews.some((p) => p.index === index);
    },
    [mattingPreviews]
  );

  return (
    <div className="export-panel">
      <div className="export-header">
        <h3 className="export-title">导出表情包</h3>
        <div className="export-header-actions">
          <button
            className={`matting-toggle ${mattingEnabled ? 'active' : ''}`}
            onClick={handleToggleMatting}
            type="button"
          >
            <span className="matting-toggle-icon">{mattingEnabled ? '✂' : '✂'}</span>
            <span>{mattingEnabled ? '抠图模式' : '抠图模式'}</span>
            <span className={`matting-toggle-switch ${mattingEnabled ? 'on' : 'off'}`}>
              <span className="matting-toggle-knob" />
            </span>
          </button>
        </div>
      </div>

      {mattingEnabled && hasProcessed && (
        <div className="matting-settings-panel">
          <div className="matting-settings-header">
            <span className="matting-settings-title">抠图设置</span>
            <div className="matting-settings-actions">
              <button
                className="matting-batch-button"
                onClick={handleBatchSetMatting}
                disabled={isMattingProcessing}
                type="button"
              >
                {isMattingProcessing ? '处理中...' : '批量自动抠图'}
              </button>
              {mattingPreviews.length > 0 && (
                <button
                  className="matting-clear-button"
                  onClick={handleClearAllMatting}
                  type="button"
                >
                  {isMattingProcessing ? '取消处理' : '清除全部'}
                </button>
              )}
            </div>
          </div>
          <div className="matting-settings-hint">
            点击"批量自动抠图"按钮，AI 将自动移除所有表情包的背景
          </div>
        </div>
      )}

      {mattingEnabled && isMattingProcessing && (
        <ProgressDisplay
          total={mattingProgress.total}
          completed={mattingProgress.completed}
          processing={mattingProgress.processing}
          failed={mattingProgress.failed}
          currentTaskIndex={currentProcessingIndex}
          isProcessing={isMattingProcessing}
          onCancel={handleCancelMatting}
        />
      )}

      <div className="export-grid">
        {isLoading && originalSlices.length === 0 ? (
          <div className="export-loading">
            <div className="loading-spinner" />
            <p>{loadingText || '加载中...'}</p>
          </div>
        ) : (
          <>
            {hasProcessed && originalSlices.length > 0 ? (
              originalSlices.map((slice) => (
                <div
                  key={slice.index}
                  className={`export-grid-item ${getHasMatting(slice.index) ? 'has-matting' : ''}`}
                >
                  <img
                    src={getPreviewUrl(slice.index)}
                    alt={`表情 ${slice.index + 1}`}
                    className="export-grid-image"
                    onClick={() => handlePreview(slice.index)}
                    crossOrigin="anonymous"
                  />
                  {mattingEnabled && (
                    <div className="matting-indicator">
                      {getHasMatting(slice.index) ? (
                        <button
                          className="matting-remove-button"
                          onClick={() => handleClearSingleMatting(slice.index)}
                          type="button"
                          title="移除抠图"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  )}
                  <button
                    className="export-single-button"
                    onClick={() => handleExportSingle(slice.index)}
                    disabled={isLoading || !hasProcessed}
                  >
                    {getHasMatting(slice.index) ? '下载抠图' : '下载原图'}
                  </button>
                </div>
              ))
            ) : (
              Array.from({ length: ROWS * COLS }, (_, index) => (
                <div key={index} className="export-grid-item placeholder">
                  <div className="export-placeholder-box">
                    <span className="export-placeholder-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <button
                    className="export-single-button"
                    disabled={isLoading || !imageUrl}
                  >
                    下载 {String(index + 1).padStart(2, '0')}
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {imageUrl && !hasProcessed && !isLoading && (
        <button className="generate-preview-button" onClick={generatePreviews}>
          生成预览
        </button>
      )}

      {hasProcessed && (
        <div className="export-actions-row">
          <button
            className="export-action-button export-matting-button"
            onClick={handleExportAllMatting}
            disabled={isLoading || mattingPreviews.length === 0}
          >
            一键导出抠图 ({mattingPreviews.length})
          </button>
          <button
            className="export-action-button export-original-button"
            onClick={handleExportAllOriginal}
            disabled={isLoading || originalSlices.length === 0}
          >
            一键导出原图 ({originalSlices.length})
          </button>
        </div>
      )}

      {previewIndex !== null && (
        <div className="preview-modal" onClick={closePreview}>
          <button className="preview-modal-close" onClick={closePreview}>×</button>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            {previewIndex > 0 && (
              <button className="preview-nav-button preview-nav-prev" onClick={goToPrevious}>
                ‹
              </button>
            )}
            <img
              src={getPreviewUrl(previewIndex)}
              alt={`预览 ${previewIndex + 1}`}
              className="preview-modal-image"
              crossOrigin="anonymous"
            />
            {previewIndex < ROWS * COLS - 1 && (
              <button className="preview-nav-button preview-nav-next" onClick={goToNext}>
                ›
              </button>
            )}
            <div className="preview-modal-info">
              <span>表情 {String(previewIndex + 1).padStart(2, '0')} / {String(ROWS * COLS).padStart(2, '0')}</span>
              {mattingEnabled && (
                <div className="preview-mode-toggle">
                  <button
                    className={`preview-mode-button ${previewMode === 'original' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('original')}
                  >
                    原图
                  </button>
                  <button
                    className={`preview-mode-button ${previewMode === 'matting' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('matting')}
                    disabled={!getHasMatting(previewIndex)}
                  >
                    抠图
                  </button>
                </div>
              )}
              <button
                className="preview-modal-download"
                onClick={() => handleExportSingle(previewIndex)}
              >
                {getHasMatting(previewIndex) ? '下载抠图' : '下载原图'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
