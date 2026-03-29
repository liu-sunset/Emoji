import { useEffect, useState } from 'react';
import './ProgressDisplay.css';

export interface ProgressDisplayProps {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  currentTaskIndex: number | null;
  isProcessing: boolean;
  onCancel: () => void;
  onComplete?: () => void;
}

export function ProgressDisplay({
  total,
  completed,
  processing,
  failed,
  currentTaskIndex,
  isProcessing,
  onCancel,
  onComplete
}: ProgressDisplayProps) {
  const [showNotification, setShowNotification] = useState(false);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  useEffect(() => {
    if (completed === total && total > 0 && !isProcessing) {
      setShowNotification(true);
      onComplete?.();
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [completed, total, isProcessing, onComplete]);
  
  if (!isProcessing && completed === 0 && failed === 0) return null;
  
  return (
    <div className="progress-display">
      <div className="progress-header">
        <span className="progress-title">
          {isProcessing ? '正在处理抠图...' : '处理完成'}
        </span>
        <span className="progress-stats">
          {completed} / {total} ({percentage}%)
        </span>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isProcessing && currentTaskIndex !== null && (
        <div className="progress-current">
          正在处理第 {currentTaskIndex + 1} 张图片...
          {processing > 1 && ` (同时处理 ${processing} 张)`}
        </div>
      )}
      
      {failed > 0 && (
        <div className="progress-failed">
          {failed} 张图片处理失败
        </div>
      )}
      
      <div className="progress-actions">
        {isProcessing && (
          <button className="progress-cancel-button" onClick={onCancel}>
            取消处理
          </button>
        )}
      </div>
      
      {showNotification && (
        <div className="progress-notification">
          ✓ 所有抠图任务已完成！
        </div>
      )}
    </div>
  );
}
