import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { loadTodos, loadHabits, ymd } from '../lib/appStorage';
import { APP_DATA_CHANGED } from '../lib/dataEvents';
import type { Todo } from './TodoList';

const STORAGE_KEY = 'vanta-compass-v1';

interface CompassState {
  qImportantUrgent: string;
  qImportantNotUrgent: string;
  qNotImportantUrgent: string;
  qNotImportantNotUrgent: string;
  focus1: string;
  focus2: string;
  focus3: string;
  weekNote: string;
}

const defaultState = (): CompassState => ({
  qImportantUrgent: '',
  qImportantNotUrgent: '',
  qNotImportantUrgent: '',
  qNotImportantNotUrgent: '',
  focus1: '',
  focus2: '',
  focus3: '',
  weekNote: '',
});

function loadState(): CompassState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const p = JSON.parse(raw) as Partial<CompassState>;
    return { ...defaultState(), ...p };
  } catch {
    return defaultState();
  }
}

function saveState(s: CompassState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function startOfWeekMonday(d = new Date()): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

const CompassView: React.FC = () => {
  const [rev, setRev] = useState(0);
  const [state, setState] = useState<CompassState>(loadState);

  useEffect(() => {
    const bump = () => setRev(x => x + 1);
    window.addEventListener(APP_DATA_CHANGED, bump);
    return () => window.removeEventListener(APP_DATA_CHANGED, bump);
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday();
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return dt;
    });
  }, []);

  const { todosByDay, habits } = useMemo(() => {
    void rev;
    const todos = loadTodos().filter(t => !t.completed && t.deadline);
    const map = new Map<string, Todo[]>();
    for (const t of todos) {
      const key = t.deadline!.slice(0, 10);
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    }
    return { todosByDay: map, habits: loadHabits() };
  }, [rev]);

  const patch = useCallback((partial: Partial<CompassState>) => {
    setState(prev => {
      const next = { ...prev, ...partial };
      saveState(next);
      return next;
    });
  }, []);

  const compassBlank = useMemo(() => {
    const s = state;
    const empty = (x: string) => !x.trim();
    return (
      empty(s.focus1) &&
      empty(s.focus2) &&
      empty(s.focus3) &&
      empty(s.qImportantUrgent) &&
      empty(s.qImportantNotUrgent) &&
      empty(s.qNotImportantUrgent) &&
      empty(s.qNotImportantNotUrgent) &&
      empty(s.weekNote)
    );
  }, [state]);

  return (
    <div className="compass-page panel-block">
      <div className="content-shell">
      <h2>Компас недели</h2>
      <p className="compass-lead">Матрица Эйзенхауэра, три фокуса и заметка к неделе. Задачи с дедлайном подтягиваются из списка.</p>
      {compassBlank && (
        <p className="empty-hint empty-hint--panel">
          Начните с одного квадранта или трёх фокусов — черновик сохраняется в браузере.
        </p>
      )}

      <section className="compass-focus">
        <h3>Фокус недели</h3>
        <div className="compass-focus-grid">
          <input className="vf-input" type="text" placeholder="Цель 1" value={state.focus1} onChange={e => patch({ focus1: e.target.value })} />
          <input className="vf-input" type="text" placeholder="Цель 2" value={state.focus2} onChange={e => patch({ focus2: e.target.value })} />
          <input className="vf-input" type="text" placeholder="Цель 3" value={state.focus3} onChange={e => patch({ focus3: e.target.value })} />
        </div>
      </section>

      <section className="compass-matrix">
        <h3>Приоритеты</h3>
        <div className="compass-grid">
          <div className="compass-cell compass-cell--iu">
            <span className="compass-cell__label">Важно · Срочно</span>
            <textarea className="vf-textarea" value={state.qImportantUrgent} onChange={e => patch({ qImportantUrgent: e.target.value })} rows={4} placeholder="Сделать в первую очередь…" />
          </div>
          <div className="compass-cell compass-cell--inu">
            <span className="compass-cell__label">Важно · Не срочно</span>
            <textarea className="vf-textarea" value={state.qImportantNotUrgent} onChange={e => patch({ qImportantNotUrgent: e.target.value })} rows={4} placeholder="Планирование, развитие…" />
          </div>
          <div className="compass-cell compass-cell--niu">
            <span className="compass-cell__label">Не важно · Срочно</span>
            <textarea className="vf-textarea" value={state.qNotImportantUrgent} onChange={e => patch({ qNotImportantUrgent: e.target.value })} rows={4} placeholder="Делегировать / укоротить…" />
          </div>
          <div className="compass-cell compass-cell--ninu">
            <span className="compass-cell__label">Не важно · Не срочно</span>
            <textarea className="vf-textarea" value={state.qNotImportantNotUrgent} onChange={e => patch({ qNotImportantNotUrgent: e.target.value })} rows={4} placeholder="Убрать шум…" />
          </div>
        </div>
      </section>

      <section className="compass-week">
        <h3>Неделя и дедлайны</h3>
        <div className="compass-week-strip">
          {weekDays.map(d => {
            const key = ymd(d);
            const list = todosByDay.get(key) || [];
            const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <div key={key} className="compass-day">
                <div className="compass-day__title">{label}</div>
                <ul>
                  {list.map(t => (
                    <li key={t.id}>{t.text}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {habits.length > 0 && (
          <div className="compass-habits-row">
            <span className="compass-habits-label">Привычки:</span>
            {habits.map(h => (
              <span key={h.id} className="compass-habit-chip" title={h.name}>
                {h.name}
              </span>
            ))}
          </div>
        )}
        <p className="compass-hint">Перенос дедлайнов между днями в интерфейсе — в планах.</p>
      </section>

      <section className="compass-note">
        <h3>Заметка к неделе</h3>
        <textarea className="compass-week-textarea vf-textarea" rows={5} value={state.weekNote} onChange={e => patch({ weekNote: e.target.value })} placeholder="Рефлексия, идеи, что убрать с недели…" />
      </section>
      </div>
    </div>
  );
};

export default CompassView;
