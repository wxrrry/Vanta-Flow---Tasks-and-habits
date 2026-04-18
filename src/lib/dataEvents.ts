export const APP_DATA_CHANGED = 'todo-app-data-changed';

export function notifyAppDataChanged(): void {
  window.dispatchEvent(new CustomEvent(APP_DATA_CHANGED));
}
