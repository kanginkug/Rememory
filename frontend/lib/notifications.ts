export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
}

const STORAGE_KEY = 'fcm_notification_list';
const MAX_ITEMS = 30;

export function addNotification(item: Omit<NotificationItem, 'id'>) {
  if (typeof window === 'undefined') return;
  const list = getNotifications();
  const updated = [{ ...item, id: Date.now().toString() }, ...list].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function clearNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}
