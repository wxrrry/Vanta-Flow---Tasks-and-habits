import { loadTodos, loadHabits, ymd } from './appStorage';

const NOTIF_LAST_KEY = 'vanta-notif-last';
const CHECK_INTERVAL = 60_000; // check every minute

let timerId: ReturnType<typeof setInterval> | null = null;

function permissionGranted(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export function requestNotificationPermission(): void {
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
  if (!permissionGranted()) return;
  if (alreadyNotifiedToday()) return;

  const today = todayStr();
  const todos = loadTodos();
  const habits = loadHabits();

  // Overdue tasks
  const overdue = todos.filter(
    t => !t.completed && t.deadline && t.deadline.slice(0, 10) < today,
  );

  // Tasks due today
  const dueToday = todos.filter(
    t => !t.completed && t.deadline && t.deadline.slice(0, 10) === today,
  );

  // Incomplete habits today
  const incompleteHabits = habits.filter(
    h => !(h.completedDates ?? []).includes(today),
  );

  const lines: string[] = [];
  if (overdue.length > 0) {
    lines.push(`\u26A0 Просрочено задач: ${overdue.length}`);
  }
  if (dueToday.length > 0) {
    lines.push(`\uD83D\uDCC5 На сегодня задач: ${dueToday.length}`);
  }
  if (incompleteHabits.length > 0) {
    lines.push(`\uD83D\uDD25 Привычек не выполнено: ${incompleteHabits.length}`);
  }

  if (lines.length === 0) return;

  new Notification('Vanta Flow', {
    body: lines.join('\n'),
    icon: '/icons/icon-192.png',
    silent: false,
  });

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
