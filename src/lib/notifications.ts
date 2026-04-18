import { loadTodos, loadHabits, ymd } from './appStorage';

const NOTIF_LAST_KEY = 'vanta-notif-last';
const CHECK_INTERVAL = 60_000; // check every minute

let timerId: ReturnType<typeof setInterval> | null = null;

type ElectronAPI = {
  showNotification: (title: string, body: string) => void;
  openExternal?: (url: string) => void;
};

function getElectronAPI(): ElectronAPI | null {
  const w = window as Window & { electronAPI?: ElectronAPI };
  return w.electronAPI ?? null;
}

function sendNotification(title: string, body: string): void {
  // Try Electron native first (works in .exe, shows proper Windows toasts)
  const api = getElectronAPI();
  if (api) {
    api.showNotification(title, body);
    return;
  }
  // Web Notification API fallback (browser / PWA)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, silent: false });
  }
}

export function requestNotificationPermission(): void {
  // In Electron the preload handles it; in browser request permission normally
  if (getElectronAPI()) return;
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function todayStr(): string {
  return ymd(new Date());
}

function alreadyNotifiedToday(): boolean {
  try {
    return localStorage.getItem(NOTIF_LAST_KEY) === todayStr();
  } catch {
    return false;
  }
}

function markNotifiedToday(): void {
  try {
    localStorage.setItem(NOTIF_LAST_KEY, todayStr());
  } catch { /* ignore */ }
}

function checkAndNotify(): void {
  // Need either Electron API or web permission
  const hasElectron = !!getElectronAPI();
  const hasWebNotif = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  if (!hasElectron && !hasWebNotif) return;
  if (alreadyNotifiedToday()) return;

  const today = todayStr();
  const todos = loadTodos();
  const habits = loadHabits();

  const overdue = todos.filter(
    t => !t.completed && t.deadline && t.deadline.slice(0, 10) < today,
  );
  const dueToday = todos.filter(
    t => !t.completed && t.deadline && t.deadline.slice(0, 10) === today,
  );
  const incompleteHabits = habits.filter(
    h => !(h.completedDates ?? []).includes(today),
  );

  const lines: string[] = [];
  if (overdue.length > 0)        lines.push(`⚠ Просрочено задач: ${overdue.length}`);
  if (dueToday.length > 0)       lines.push(`📅 На сегодня задач: ${dueToday.length}`);
  if (incompleteHabits.length > 0) lines.push(`🔥 Привычек не выполнено: ${incompleteHabits.length}`);

  if (lines.length === 0) return;

  sendNotification('Vanta Flow', lines.join('\n'));
  markNotifiedToday();
}

export function startNotificationScheduler(): void {
  if (timerId !== null) return;
  checkAndNotify();
  timerId = setInterval(checkAndNotify, CHECK_INTERVAL);
}

export function stopNotificationScheduler(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}
