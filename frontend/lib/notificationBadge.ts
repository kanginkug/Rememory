const STORAGE_KEY = 'fcm_has_notification';
const BADGE_EVENT = 'fcm-badge-update';

export function setNotificationBadge() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, '1');
  window.dispatchEvent(new CustomEvent(BADGE_EVENT));
}

export function clearNotificationBadge() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(BADGE_EVENT));
}

export function getNotificationBadge(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export { BADGE_EVENT };
