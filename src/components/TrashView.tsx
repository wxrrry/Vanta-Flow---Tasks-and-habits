import React, { useState, useEffect, useCallback } from 'react';
import {
  getTrashSnapshot,
  getTrashRetentionDays,
  restoreTodoFromTrash,
  restoreHabitFromTrash,
  deleteTodoTrashForever,
  deleteHabitTrashForever,
} from '../lib/trashArchive';
import { APP_DATA_CHANGED } from '../lib/dataEvents';

function daysLeftInTrash(deletedAt: string, retentionDays: number): number {
  const elapsed = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
  return Math.max(0, Math.ceil(retentionDays - elapsed));
}

const TrashView: React.FC = () => {
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev(x => x + 1), []);

  useEffect(() => {
    window.addEventListener(APP_DATA_CHANGED, bump);
    return () => window.removeEventListener(APP_DATA_CHANGED, bump);
  }, [bump]);

  void rev;
  const retention = getTrashRetentionDays();
  const { todos, habits } = getTrashSnapshot();

  return (
    <div className="trash-page panel-block">
      <div className="content-shell">
      <h2>Корзина</h2>
      <p className="trash-lead">
        Удалённые задачи и привычки хранятся <strong>{retention}</strong> дн. (срок в настройках), затем удаляются
        автоматически. Восстановите или удалите вручную.
      </p>

      <section className="trash-section">
        <h3>Задачи ({todos.length})</h3>
        {todos.length === 0 ? (
          <p className="empty-hint">Корзина задач пуста — удалённые карточки будут здесь до истечения срока из настроек.</p>
        ) : (
          <ul className="trash-list">
            {todos.map(e => (
              <li key={`${e.item.id}-${e.deletedAt}`} className="trash-row">
                <div className="trash-row__main">
                  <span className="trash-title">{e.item.text}</span>
                  <span className="trash-meta">
                    Удалено {new Date(e.deletedAt).toLocaleString('ru-RU')} · осталось ~{daysLeftInTrash(e.deletedAt, retention)} дн.
                  </span>
                </div>
                <div className="trash-row__actions">
                  <button
                    type="button"
                    onClick={() => {
                      const { todos: t } = getTrashSnapshot();
                      const idx = t.findIndex(x => x.deletedAt === e.deletedAt && x.item.id === e.item.id);
                      if (idx >= 0) restoreTodoFromTrash(idx);
                    }}
                  >
                    Восстановить
                  </button>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => {
                      const { todos: t } = getTrashSnapshot();
                      const idx = t.findIndex(x => x.deletedAt === e.deletedAt && x.item.id === e.item.id);
                      if (idx >= 0) deleteTodoTrashForever(idx);
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

      <section className="trash-section">
        <h3>Привычки ({habits.length})</h3>
        {habits.length === 0 ? (
          <p className="empty-hint">Корзина привычек пуста — восстановите запись отсюда или удалите навсегда.</p>
        ) : (
          <ul className="trash-list">
            {habits.map(e => (
              <li key={`${e.item.id}-${e.deletedAt}`} className="trash-row">
                <div className="trash-row__main">
                  <span className="trash-title">{e.item.name}</span>
                  <span className="trash-meta">
                    Удалено {new Date(e.deletedAt).toLocaleString('ru-RU')} · осталось ~{daysLeftInTrash(e.deletedAt, retention)} дн.
                  </span>
                </div>
                <div className="trash-row__actions">
                  <button
                    type="button"
                    onClick={() => {
                      const { habits: h } = getTrashSnapshot();
                      const idx = h.findIndex(x => x.deletedAt === e.deletedAt && x.item.id === e.item.id);
                      if (idx >= 0) restoreHabitFromTrash(idx);
                    }}
                  >
                    Восстановить
                  </button>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => {
                      const { habits: h } = getTrashSnapshot();
                      const idx = h.findIndex(x => x.deletedAt === e.deletedAt && x.item.id === e.item.id);
                      if (idx >= 0) deleteHabitTrashForever(idx);
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

export default TrashView;
