export type ToastType = 'error' | 'success' | 'notification';

export function showToast(message: string, type: ToastType = 'error') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
  }
}
