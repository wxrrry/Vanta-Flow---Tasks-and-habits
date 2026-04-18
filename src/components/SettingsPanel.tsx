import React, { useRef, useState, useEffect } from 'react';
import {
  TODOS_KEY,
  HABITS_KEY,
  loadTodos,
  loadHabits,
} from '../lib/appStorage';
import {
  TRASH_TODOS_KEY,
  TRASH_HABITS_KEY,
  ARCHIVE_TODOS_KEY,
  ARCHIVE_HABITS_KEY,
  RETENTION_KEY,
  getTrashRetentionDays,
  setTrashRetentionDays,
} from '../lib/trashArchive';
import { notifyAppDataChanged } from '../lib/dataEvents';
import { applyTheme, getStoredTheme, type ThemePreference } from '../lib/theme';
import type { BeforeInstallPromptEvent } from '../lib/pwaTypes';

type ExportV2 = {
  version: 2;
  exportDate: string;
  todos: unknown[];
  habits: unknown[];
  todosTrash: unknown[];
  habitsTrash: unknown[];
  todosArchive: unknown[];
  habitsArchive: unknown[];
  trashRetentionDays: number;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

const SettingsPanel: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme());
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [retentionInput, setRetentionInput] = useState(() => String(getTrashRetentionDays()));
  const [deferredInstall, setDeferredInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(isStandaloneDisplay);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onData = () => setRetentionInput(String(getTrashRetentionDays()));
    window.addEventListener('todo-app-data-changed', onData);
    return () => window.removeEventListener('todo-app-data-changed', onData);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const sync = () => setStandalone(isStandaloneDisplay());
    mq.addEventListener('change', sync);
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredInstall(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferredInstall(null);
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const runInstall = async () => {
    if (!deferredInstall) return;
    await deferredInstall.prompt();
    setDeferredInstall(null);
  };

  const applyRetention = () => {
    const n = parseInt(retentionInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > 365) {
      setImportMsg('Срок корзины: целое число от 1 до 365 дней.');
      return;
    }
    setTrashRetentionDays(n);
    notifyAppDataChanged();
    setImportMsg('Срок хранения корзины сохранён.');
  };

  const exportData = () => {
    const payload: ExportV2 = {
      version: 2,
      exportDate: new Date().toISOString(),
      todos: loadTodos(),
      habits: loadHabits(),
      todosTrash: JSON.parse(localStorage.getItem(TRASH_TODOS_KEY) || '[]') as unknown[],
      habitsTrash: JSON.parse(localStorage.getItem(TRASH_HABITS_KEY) || '[]') as unknown[],
      todosArchive: JSON.parse(localStorage.getItem(ARCHIVE_TODOS_KEY) || '[]') as unknown[],
      habitsArchive: JSON.parse(localStorage.getItem(ARCHIVE_HABITS_KEY) || '[]') as unknown[],
      trashRetentionDays: getTrashRetentionDays(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `todo-habit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onPickImport = () => fileRef.current?.click();

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const data = JSON.parse(text) as {
          todos?: unknown;
          habits?: unknown;
          version?: number;
          todosTrash?: unknown;
          habitsTrash?: unknown;
          todosArchive?: unknown;
          habitsArchive?: unknown;
          trashRetentionDays?: number;
        };
        if (!Array.isArray(data.todos) || !Array.isArray(data.habits)) {
          setImportMsg('Файл должен содержать массивы todos и habits.');
          return;
        }
        if (!window.confirm('Заменить текущие данные приложения содержимым файла?')) {
          setImportMsg('Импорт отменён.');
          return;
        }
        localStorage.setItem(TODOS_KEY, JSON.stringify(data.todos));
        localStorage.setItem(HABITS_KEY, JSON.stringify(data.habits));
        if (data.version === 2) {
          localStorage.setItem(TRASH_TODOS_KEY, JSON.stringify(Array.isArray(data.todosTrash) ? data.todosTrash : []));
          localStorage.setItem(TRASH_HABITS_KEY, JSON.stringify(Array.isArray(data.habitsTrash) ? data.habitsTrash : []));
          localStorage.setItem(ARCHIVE_TODOS_KEY, JSON.stringify(Array.isArray(data.todosArchive) ? data.todosArchive : []));
          localStorage.setItem(ARCHIVE_HABITS_KEY, JSON.stringify(Array.isArray(data.habitsArchive) ? data.habitsArchive : []));
          if (typeof data.trashRetentionDays === 'number' && data.trashRetentionDays >= 1 && data.trashRetentionDays <= 365) {
            setTrashRetentionDays(data.trashRetentionDays);
          }
        }
        notifyAppDataChanged();
        setImportMsg('Импорт выполнен. Страница перезагрузится.');
        window.setTimeout(() => window.location.reload(), 600);
      } catch {
        setImportMsg('Не удалось прочитать JSON.');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!window.confirm('Удалить все задачи, привычки, корзину и архив без восстановления?')) return;
    localStorage.removeItem(TODOS_KEY);
    localStorage.removeItem(HABITS_KEY);
    localStorage.removeItem(TRASH_TODOS_KEY);
    localStorage.removeItem(TRASH_HABITS_KEY);
    localStorage.removeItem(ARCHIVE_TODOS_KEY);
    localStorage.removeItem(ARCHIVE_HABITS_KEY);
    localStorage.removeItem(RETENTION_KEY);
    window.location.reload();
  };

  return (
    <div className="settings-page panel-block">
      <div className="content-shell">
      <h2>Настройки</h2>
      <p className="settings-lead">Данные хранятся только в этом браузере. Регулярно делайте резервную копию.</p>
      <p className="section-tip">Изменения темы и импорта действуют сразу; отдельной кнопки «Сохранить» нет (кроме срока корзины).</p>

      <section className="settings-section">
        <h3>Тема</h3>
        <p className="settings-muted">Режим «Как в системе» подстраивается под тёмную/светлую тему ОС.</p>
        <div className="settings-row settings-row--theme">
          <label className="settings-label">
            <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Тёмная
          </label>
          <label className="settings-label">
            <input type="radio" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')} /> Светлая
          </label>
          <label className="settings-label">
            <input type="radio" name="theme" checked={theme === 'system'} onChange={() => setTheme('system')} /> Как в системе
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3>Приложение (PWA)</h3>
        <p className="settings-muted">
          Установите как отдельное окно без адресной строки: в Chrome или Edge нажмите значок установки в адресной строке или кнопку ниже. После
          установки в меню приложения появятся быстрые ссылки на «Задачи», «Календарь» и «Поток».
        </p>
        {standalone && <p className="settings-msg">Сейчас открыто как установленное приложение.</p>}
        {deferredInstall && (
          <div className="settings-inline">
            <button type="button" onClick={runInstall}>
              Установить Vanta Flow
            </button>
          </div>
        )}
        {!deferredInstall && !standalone && (
          <p className="settings-muted">
            Если кнопки нет: приложение уже установлено, открыт режим инкогнито или браузер не поддерживает установку с этого адреса (нужен HTTPS или
            localhost).
          </p>
        )}
        <p className="settings-muted">
          <strong>Горячая клавиша в Windows:</strong> после установки откройте ярлык приложения → правый клик → «Свойства» → вкладка «Ярлык» → поле «Быстрый
          вызов» (например, <kbd className="settings-kbd">Ctrl+Alt+V</kbd>). Глобальную клавишу из веб-страницы задать нельзя — только через ярлык ОС.
        </p>
        <p className="settings-muted">
          Внутри окна: <kbd className="settings-kbd">Alt+Shift+V</kbd> переключает на «Обзор», если фокус не в поле ввода.
        </p>
      </section>

      <section className="settings-section">
        <h3>Корзина</h3>
        <p className="settings-muted">Автоудаление из корзины через указанное число дней (1–365).</p>
        <div className="settings-inline">
          <input
            type="number"
            min={1}
            max={365}
            className="settings-num"
            value={retentionInput}
            onChange={e => setRetentionInput(e.target.value)}
            aria-label="Дней хранения в корзине"
          />
          <button type="button" onClick={applyRetention}>
            Сохранить срок
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Данные</h3>
        <p className="settings-muted">Экспорт v2 включает задачи, привычки, корзину, архив и срок корзины.</p>
        <div className="settings-actions">
          <button type="button" onClick={exportData}>
            Экспорт JSON
          </button>
          <button type="button" onClick={onPickImport}>
            Импорт JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
        </div>
        {importMsg && <p className="settings-msg">{importMsg}</p>}
      </section>

      <section className="settings-section settings-danger-zone">
        <h3>Опасная зона</h3>
        <button type="button" className="settings-clear" onClick={clearAll}>
          Очистить все данные
        </button>
      </section>

      <section className="settings-section settings-about">
        <h3>О приложении</h3>
        <p className="settings-muted">Vanta Flow — задачи и привычки, хранятся локально в браузере.</p>
        <a
          href="https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="settings-release-link"
          onClick={e => {
            const api = (window as Window & { electronAPI?: { openExternal?: (url: string) => void } }).electronAPI;
            if (api?.openExternal) {
              e.preventDefault();
              api.openExternal('https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/releases');
            }
          }}
        >
          🚀 Следить за обновлениями на GitHub →
        </a>
      </section>
      </div>
    </div>
  );
};

export default SettingsPanel;
