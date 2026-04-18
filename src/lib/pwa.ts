/** Регистрация service worker (только production-сборка, нужен HTTPS или localhost). В Electron не используем. */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* тихо */
    });
  });
}
