import { useCallback, useState } from 'react';
import { saveAs } from 'file-saver';
import './ResultViewer.css';

export interface ResultViewerProps {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ResultViewer({ imageUrl, loading, error, onRetry }: ResultViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!imageUrl) return;

    setIsDownloading(true);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'png';
      saveAs(blob, `emoj_original.${ext}`);
    } catch (err) {
      console.error('下载失败:', err);
      alert('下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  }, [imageUrl]);
  return (
    <div className="result-viewer">
      <div className="result-container">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">正在生成表情包...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <svg
              className="error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="error-text">{error}</p>
            <button className="retry-button" onClick={onRetry} type="button">
              重新生成
            </button>
          </div>
        )}

        {!loading && !error && imageUrl && (
          <div className="success-state">
            <div className="result-image-wrapper">
              <img src={imageUrl} alt="生成的表情包" className="result-image" />
              <button
                className="download-button"
                onClick={handleDownload}
                disabled={isDownloading}
                type="button"
              >
                {isDownloading ? '下载中...' : '下载原图'}
              </button>
            </div>
          </div>
        )}

        {!loading && !error && !imageUrl && (
          <div className="empty-state">
            <svg
              className="empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="empty-text">上传图片并编辑描述词后开始生成</p>
          </div>
        )}
      </div>
    </div>
  );
}