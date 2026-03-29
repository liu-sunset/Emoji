export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface MattingTask {
  id: string;
  blob: Blob;
  index: number;
  status: TaskStatus;
  progress: number;
  result?: Blob;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export type TaskEventType = 'add' | 'start' | 'progress' | 'complete' | 'fail' | 'cancel';
export type TaskEventCallback = (task: MattingTask, event: TaskEventType) => void;

interface WorkerResponse {
  taskId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: Blob;
  error?: string;
}

export class TaskQueueManager {
  private queue: MattingTask[] = [];
  private workers: Worker[] = [];
  private maxConcurrent: number;
  private eventListeners: Map<TaskEventType, Set<TaskEventCallback>> = new Map();
  private taskWorkerMap: Map<string, Worker> = new Map();
  private workerUrl: string | null = null;
  
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }
  
  private async initWorkers(): Promise<void> {
    if (this.workers.length > 0) return;
    
    this.workerUrl = new URL(
      '../workers/mattingWorker.ts',
      import.meta.url
    ).href;
    
    for (let i = 0; i < this.maxConcurrent; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = (err) => {
        console.error('Worker error:', err);
      };
      this.workers.push(worker);
    }
  }
  
  async addTask(blob: Blob, index: number): Promise<string> {
    await this.initWorkers();
    
    const task: MattingTask = {
      id: `task_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      blob,
      index,
      status: 'pending',
      progress: 0
    };
    this.queue.push(task);
    this.emit(task, 'add');
    this.processQueue();
    return task.id;
  }
  
  async addTasks(tasks: Array<{ blob: Blob; index: number }>): Promise<string[]> {
    const ids: string[] = [];
    for (const t of tasks) {
      const id = await this.addTask(t.blob, t.index);
      ids.push(id);
    }
    return ids;
  }
  
  cancelTask(taskId: string): void {
    const task = this.queue.find(t => t.id === taskId);
    if (task && task.status === 'processing') {
      const worker = this.taskWorkerMap.get(taskId);
      if (worker) {
        worker.postMessage({ type: 'cancel', taskId });
      }
    } else if (task && task.status === 'pending') {
      task.status = 'cancelled';
      task.endTime = Date.now();
      this.emit(task, 'cancel');
    }
  }
  
  cancelAll(): void {
    this.queue.forEach(task => {
      if (task.status === 'pending' || task.status === 'processing') {
        this.cancelTask(task.id);
      }
    });
  }
  
  getProgress(): { total: number; completed: number; percentage: number; processing: number; failed: number } {
    const total = this.queue.length;
    const completed = this.queue.filter(t => t.status === 'completed').length;
    const processing = this.queue.filter(t => t.status === 'processing').length;
    const failed = this.queue.filter(t => t.status === 'failed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage, processing, failed };
  }
  
  getTask(taskId: string): MattingTask | undefined {
    return this.queue.find(t => t.id === taskId);
  }
  
  getAllTasks(): MattingTask[] {
    return [...this.queue];
  }
  
  getCompletedTasks(): MattingTask[] {
    return this.queue.filter(t => t.status === 'completed');
  }
  
  clearCompleted(): void {
    this.queue = this.queue.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  }
  
  reset(): void {
    this.queue = [];
    this.taskWorkerMap.clear();
  }
  
  on(event: TaskEventType, callback: TaskEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }
  
  off(event: TaskEventType, callback: TaskEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }
  
  private emit(task: MattingTask, event: TaskEventType): void {
    this.eventListeners.get(event)?.forEach(cb => cb(task, event));
  }
  
  private processQueue(): void {
    const pendingTasks = this.queue.filter(t => t.status === 'pending');
    const busyWorkerIds = new Set(this.taskWorkerMap.values());
    const idleWorkers = this.workers.filter(w => !busyWorkerIds.has(w));
    
    while (pendingTasks.length > 0 && idleWorkers.length > 0) {
      const task = pendingTasks.shift()!;
      const worker = idleWorkers.shift()!;
      
      task.status = 'processing';
      task.startTime = Date.now();
      this.taskWorkerMap.set(task.id, worker);
      this.emit(task, 'start');
      
      worker.postMessage({
        type: 'process',
        taskId: task.id,
        blob: task.blob
      });
    }
  }
  
  private handleWorkerMessage(e: MessageEvent<WorkerResponse>): void {
    const { taskId, status, progress, result, error } = e.data;
    const task = this.queue.find(t => t.id === taskId);
    
    if (!task) return;
    
    if (status === 'processing') {
      task.progress = progress ?? task.progress;
      this.emit(task, 'progress');
    } else if (status === 'completed') {
      task.status = 'completed';
      task.result = result;
      task.endTime = Date.now();
      this.taskWorkerMap.delete(taskId);
      this.emit(task, 'complete');
      this.processQueue();
    } else if (status === 'failed') {
      task.status = 'failed';
      task.error = error;
      task.endTime = Date.now();
      this.taskWorkerMap.delete(taskId);
      this.emit(task, 'fail');
      this.processQueue();
    } else if (status === 'cancelled') {
      task.status = 'cancelled';
      task.endTime = Date.now();
      this.taskWorkerMap.delete(taskId);
      this.emit(task, 'cancel');
      this.processQueue();
    }
  }
  
  destroy(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.queue = [];
    this.taskWorkerMap.clear();
    this.eventListeners.clear();
  }
  
  isProcessing(): boolean {
    return this.queue.some(t => t.status === 'processing' || t.status === 'pending');
  }
}
