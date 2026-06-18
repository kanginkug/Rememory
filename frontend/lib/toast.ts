export function showToast(message: string, type: 'error' | 'success' = 'error') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
  }
}
