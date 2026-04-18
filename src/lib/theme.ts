const THEME_KEY = 'todo-app-theme';

/** Выбор пользователя: явно тёмная/светлая или следовать за ОС */
export type ThemePreference = 'dark' | 'light' | 'system';

function systemIsLight(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

/** Фактическая тема для стилей `body.theme-light` */
export function getEffectiveTheme(preference: ThemePreference): 'dark' | 'light' {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemIsLight() ? 'light' : 'dark';
}

let mediaListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null = null;

function applyBodyClass(effective: 'dark' | 'light'): void {
  document.body.classList.toggle('theme-light', effective === 'light');
}

export function getStoredTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
    return 'system';
  } catch {
    return 'system';
  }
}

/** Сохраняет предпочтение и применяет класс на `body`; при `system` подписывается на `prefers-color-scheme`. */
export function applyTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    /* ignore */
  }

  const mq = window.matchMedia('(prefers-color-scheme: light)');
  if (mediaListener) {
    mq.removeEventListener('change', mediaListener);
    mediaListener = null;
  }

  applyBodyClass(getEffectiveTheme(preference));

  if (preference === 'system') {
    mediaListener = () => {
      applyBodyClass(mq.matches ? 'light' : 'dark');
    };
    mq.addEventListener('change', mediaListener);
  }
}
