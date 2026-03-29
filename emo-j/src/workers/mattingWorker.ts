import { removeBackground } from '@imgly/background-removal';

interface WorkerMessage {
  type: 'process' | 'cancel';
  taskId: string;
  blob?: Blob;
}

interface WorkerResponse {
  taskId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: Blob;
  error?: string;
}

let isCancelled = false;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, taskId, blob } = e.data;

  if (type === 'cancel') {
    isCancelled = true;
    return;
  }

  if (type === 'process' && blob) {
    isCancelled = false;
    
    try {
      self.postMessage({ taskId, status: 'processing', progress: 0 } as WorkerResponse);
      
      const result = await removeBackground(blob, {
        progress: (_key, current, total) => {
          if (isCancelled) {
            throw new Error('AbortError');
          }
          if (total > 0) {
            const progress = Math.round((current / total) * 100);
            self.postMessage({ taskId, status: 'processing', progress } as WorkerResponse);
          }
        }
      });
      
      if (isCancelled) {
        self.postMessage({ taskId, status: 'cancelled' } as WorkerResponse);
      } else {
        self.postMessage({ taskId, status: 'completed', result } as WorkerResponse);
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === 'AbortError' || error.name === 'AbortError') {
        self.postMessage({ taskId, status: 'cancelled' } as WorkerResponse);
      } else {
        self.postMessage({ taskId, status: 'failed', error: error.message || '未知错误' } as WorkerResponse);
      }
    }
  }
};

export {};
