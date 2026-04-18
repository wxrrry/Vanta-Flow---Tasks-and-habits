import React, { useState, useEffect, useCallback } from 'react';
import {
  getArchiveSnapshot,
  loadArchiveTodos,
  loadArchiveHabits,
  restoreTodoFromArchive,
  restoreHabitFromArchive,
  deleteArchiveTodoForever,
  deleteArchiveHabitForever,
} from '../lib/trashArchive';
import { APP_DATA_CHANGED } from '../lib/dataEvents';

const ArchiveView: React.FC = () => {
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev(x => x + 1), []);

  useEffect(() => {
    window.addEventListener(APP_DATA_CHANGED, bump);
    return () => window.removeEventListener(APP_DATA_CHANGED, bump);
  }, [bump]);

  void rev;
  const { todos, habits } = getArchiveSnapshot();

  return (
    <div className="archive-page panel-block">
      <div className="content-shell">
      <h2>Архив</h2>
      <p className="archive-lead">
        Задачи и привычки, перенесённые сюда вручную, не мешают в основных списках, но сохраняют историю и заметки.
      </p>

      <section className="archive-section">
        <h3>Задачи ({todos.length})</h3>
        {todos.length === 0 ? (
          <p className="empty-hint">Архив задач пуст — сюда попадают карточки, перенесённые из списка вручную.</p>
        ) : (
          <ul className="archive-list">
            {todos.map(e => (
              <li key={`${e.item.id}-${e.archivedAt}`} className="archive-row">
                <div className="archive-row__main">
                  <span className={`archive-title ${e.item.completed ? 'completed' : ''}`}>{e.item.text}</span>
                  <span className="archive-meta">
                    В архиве с {new Date(e.archivedAt).toLocaleString('ru-RU')}
                    {e.item.completed ? ' · была выполнена' : ''}
                  </span>
                </div>
                <div className="archive-row__actions">
                  <button
                    type="button"
                    onClick={() => {
                      const t = loadArchiveTodos();
                      const idx = t.findIndex(x => x.archivedAt === e.archivedAt && x.item.id === e.item.id);
                      if (idx >= 0) restoreTodoFromArchive(idx);
                    }}
                  >
                    Вернуть в список
                  </button>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => {
                      const t = loadArchiveTodos();
                      const idx = t.findIndex(x => x.archivedAt === e.archivedAt && x.item.id === e.item.id);
                      if (idx >= 0) deleteArchiveTodoForever(idx);
                    }}
                  >
                    Удалить навсегда
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="archive-section">
        <h3>Привычки ({habits.length})</h3>
        {habits.length === 0 ? (
          <p className="empty-hint">Архив привычек пуст — отложенные привычки появятся здесь после переноса из основного списка.</p>
        ) : (
          <ul className="archive-list">
            {habits.map(e => (
              <li key={`${e.item.id}-${e.archivedAt}`} className="archive-row">
                <div className="archive-row__main">
                  <span className="archive-title">{e.item.name}</span>
                  <span className="archive-meta">
                    Серия {e.item.streak} · рекорд {e.item.bestStreak ?? 0} · в архиве с{' '}
                    {new Date(e.archivedAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="archive-row__actions">
                  <button
                    type="button"
                    onClick={() => {
                      const h = loadArchiveHabits();
                      const idx = h.findIndex(x => x.archivedAt === e.archivedAt && x.item.id === e.item.id);
                      if (idx >= 0) restoreHabitFromArchive(idx);
                    }}
                  >
                    Вернуть в трекер
                  </button>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => {
                      const h = loadArchiveHabits();
                      const idx = h.findIndex(x => x.archivedAt === e.archivedAt && x.item.id === e.item.id);
                      if (idx >= 0) deleteArchiveHabitForever(idx);
                    }}
                  >
                    Удалить навсегда
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
};

export default ArchiveView;
