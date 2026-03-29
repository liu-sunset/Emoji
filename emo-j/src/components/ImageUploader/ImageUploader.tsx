import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import './ImageUploader.css';

export interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  uploadedImage: string | null;
  disabled: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({ onImageUpload, uploadedImage, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 JPG/PNG/WebP 格式';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '文件大小不能超过 5MB';
    }
    return null;
  };

  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setError(null);
      onImageUpload(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleReupload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className="image-uploader">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${uploadedImage ? 'has-image' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
          className="file-input"
          disabled={disabled}
        />

        {uploadedImage ? (
          <div className="preview-container">
            <img src={uploadedImage} alt="预览" className="preview-image" />
            <div className="reupload-overlay">
              <button
                className="reupload-button"
                onClick={handleReupload}
                disabled={disabled}
                type="button"
              >
                重新上传
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              {isDragging ? '释放以上传图片' : '拖拽图片到此处或点击选择'}
            </p>
            <p className="upload-hint">支持 JPG/PNG/WebP，最大 5MB</p>
          </div>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}