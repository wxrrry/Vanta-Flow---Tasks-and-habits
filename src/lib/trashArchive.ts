import { notifyAppDataChanged } from './dataEvents';
import { TODOS_KEY, HABITS_KEY, loadTodos, loadHabits } from './appStorage';
import type { Todo } from '../components/TodoList';
import type { Habit } from '../components/HabitTracker';

export const TRASH_TODOS_KEY = 'todos-trash';
export const TRASH_HABITS_KEY = 'habits-trash';
export const ARCHIVE_TODOS_KEY = 'todos-archive';
export const ARCHIVE_HABITS_KEY = 'habits-archive';
export const RETENTION_KEY = 'trash-retention-days';

export interface TrashEntryTodo {
  item: Todo;
  deletedAt: string;
}

export interface TrashEntryHabit {
  item: Habit;
  deletedAt: string;
}

export interface ArchiveEntryTodo {
  item: Todo;
  archivedAt: string;
}

export interface ArchiveEntryHabit {
  item: Habit;
  archivedAt: string;
}

export function getTrashRetentionDays(): number {
  try {
    const v = localStorage.getItem(RETENTION_KEY);
    const n = v ? parseInt(v, 10) : 30;
    if (!Number.isFinite(n)) return 30;
    return Math.min(365, Math.max(1, n));
  } catch {
    return 30;
  }
}

export function setTrashRetentionDays(days: number): void {
  localStorage.setItem(RETENTION_KEY, String(Math.min(365, Math.max(1, Math.floor(days)))));
}

function loadTrashTodos(): TrashEntryTodo[] {
  try {
    const raw = localStorage.getItem(TRASH_TODOS_KEY);
    return raw ? (JSON.parse(raw) as TrashEntryTodo[]) : [];
  } catch {
    return [];
  }
}

function saveTrashTodos(entries: TrashEntryTodo[]) {
  localStorage.setItem(TRASH_TODOS_KEY, JSON.stringify(entries));
}

function loadTrashHabits(): TrashEntryHabit[] {
  try {
    const raw = localStorage.getItem(TRASH_HABITS_KEY);
    return raw ? (JSON.parse(raw) as TrashEntryHabit[]) : [];
  } catch {
    return [];
  }
}

function saveTrashHabits(entries: TrashEntryHabit[]) {
  localStorage.setItem(TRASH_HABITS_KEY, JSON.stringify(entries));
}

export function loadArchiveTodos(): ArchiveEntryTodo[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_TODOS_KEY);
    return raw ? (JSON.parse(raw) as ArchiveEntryTodo[]) : [];
  } catch {
    return [];
  }
}

function saveArchiveTodos(entries: ArchiveEntryTodo[]) {
  localStorage.setItem(ARCHIVE_TODOS_KEY, JSON.stringify(entries));
}

export function loadArchiveHabits(): ArchiveEntryHabit[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_HABITS_KEY);
    return raw ? (JSON.parse(raw) as ArchiveEntryHabit[]) : [];
  } catch {
    return [];
  }
}

function saveArchiveHabits(entries: ArchiveEntryHabit[]) {
  localStorage.setItem(ARCHIVE_HABITS_KEY, JSON.stringify(entries));
}

/** Удаляет из корзины записи старше срока хранения. */
export function purgeExpiredTrash(): void {
  const days = getTrashRetentionDays();
  const cutoff = Date.now() - days * 86400000;
  const keepTodo = (e: TrashEntryTodo) => new Date(e.deletedAt).getTime() >= cutoff;
  const keepHabit = (e: TrashEntryHabit) => new Date(e.deletedAt).getTime() >= cutoff;
  saveTrashTodos(loadTrashTodos().filter(keepTodo));
  saveTrashHabits(loadTrashHabits().filter(keepHabit));
}

export function appendTrashTodo(item: Todo): void {
  purgeExpiredTrash();
  const trash = loadTrashTodos();
  trash.push({ item: { ...item }, deletedAt: new Date().toISOString() });
  saveTrashTodos(trash);
  notifyAppDataChanged();
}

export function appendTrashHabit(item: Habit): void {
  purgeExpiredTrash();
  const trash = loadTrashHabits();
  trash.push({ item: { ...item }, deletedAt: new Date().toISOString() });
  saveTrashHabits(trash);
  notifyAppDataChanged();
}

export function appendArchiveTodo(item: Todo): void {
  const arch = loadArchiveTodos();
  arch.push({ item: { ...item }, archivedAt: new Date().toISOString() });
  saveArchiveTodos(arch);
  notifyAppDataChanged();
}

export function appendArchiveHabit(item: Habit): void {
  const arch = loadArchiveHabits();
  arch.push({ item: { ...item }, archivedAt: new Date().toISOString() });
  saveArchiveHabits(arch);
  notifyAppDataChanged();
}

export function getTrashSnapshot(): { todos: TrashEntryTodo[]; habits: TrashEntryHabit[] } {
  purgeExpiredTrash();
  return { todos: loadTrashTodos(), habits: loadTrashHabits() };
}

export function getArchiveSnapshot(): { todos: ArchiveEntryTodo[]; habits: ArchiveEntryHabit[] } {
  return { todos: loadArchiveTodos(), habits: loadArchiveHabits() };
}

export function restoreTodoFromTrash(index: number): void {
  const trash = loadTrashTodos();
  const [removed] = trash.splice(index, 1);
  if (!removed) return;
  saveTrashTodos(trash);
  const todos = loadTodos();
  if (!todos.some(t => t.id === removed.item.id)) {
    localStorage.setItem(TODOS_KEY, JSON.stringify([...todos, removed.item]));
  }
  notifyAppDataChanged();
}

export function restoreHabitFromTrash(index: number): void {
  const trash = loadTrashHabits();
  const [removed] = trash.splice(index, 1);
  if (!removed) return;
  saveTrashHabits(trash);
  const habits = loadHabits();
  if (!habits.some(h => h.id === removed.item.id)) {
    localStorage.setItem(HABITS_KEY, JSON.stringify([...habits, removed.item]));
  }
  notifyAppDataChanged();
}

export function deleteTodoTrashForever(index: number): void {
  const trash = loadTrashTodos();
  trash.splice(index, 1);
  saveTrashTodos(trash);
  notifyAppDataChanged();
}

export function deleteHabitTrashForever(index: number): void {
  const trash = loadTrashHabits();
  trash.splice(index, 1);
  saveTrashHabits(trash);
  notifyAppDataChanged();
}

export function restoreTodoFromArchive(index: number): void {
  const arch = loadArchiveTodos();
  const [removed] = arch.splice(index, 1);
  if (!removed) return;
  saveArchiveTodos(arch);
  const todos = loadTodos();
  if (!todos.some(t => t.id === removed.item.id)) {
    localStorage.setItem(TODOS_KEY, JSON.stringify([...todos, removed.item]));
  }
  notifyAppDataChanged();
}

export function restoreHabitFromArchive(index: number): void {
  const arch = loadArchiveHabits();
  const [removed] = arch.splice(index, 1);
  if (!removed) return;
  saveArchiveHabits(arch);
  const habits = loadHabits();
  if (!habits.some(h => h.id === removed.item.id)) {
    localStorage.setItem(HABITS_KEY, JSON.stringify([...habits, removed.item]));
  }
  notifyAppDataChanged();
}

export function deleteArchiveTodoForever(index: number): void {
  const arch = loadArchiveTodos();
  arch.splice(index, 1);
  saveArchiveTodos(arch);
  notifyAppDataChanged();
}

export function deleteArchiveHabitForever(index: number): void {
  const arch = loadArchiveHabits();
  arch.splice(index, 1);
  saveArchiveHabits(arch);
  notifyAppDataChanged();
}
