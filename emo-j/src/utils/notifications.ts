export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
}

export function notifyMattingComplete(count: number): void {
  showNotification('抠图完成', {
    body: `成功处理 ${count} 张图片`,
    tag: 'matting-complete'
  });
}

export function notifyMattingFailed(count: number): void {
  showNotification('抠图失败', {
    body: `${count} 张图片处理失败`,
    tag: 'matting-failed'
  });
}

export function notifyMattingPartial(completed: number, failed: number): void {
  showNotification('抠图完成', {
    body: `成功 ${completed} 张，失败 ${failed} 张`,
    tag: 'matting-partial'
  });
}
