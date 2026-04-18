import type { AppTabId } from './appTabId';
import { ALL_TAB_IDS } from './appTabId';

export function parseTabFromSearch(search: string): AppTabId | null {
  const t = new URLSearchParams(search).get('tab');
  if (!t) return null;
  return ALL_TAB_IDS.includes(t as AppTabId) ? (t as AppTabId) : null;
}

export function replaceUrlTab(tab: AppTabId): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (tab === 'overview') {
    url.searchParams.delete('tab');
  } else {
    url.searchParams.set('tab', tab);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
}
