import type { Todo } from '../components/TodoList';
import type { Habit } from '../components/HabitTracker';

export const TODOS_KEY = 'todos';
export const HABITS_KEY = 'habits';

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Habit[];
    return parsed.map(h => ({
      ...h,
      completedDates: Array.isArray(h.completedDates) ? h.completedDates : undefined,
    }));
  } catch {
    return [];
  }
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
