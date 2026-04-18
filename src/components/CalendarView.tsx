import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { loadTodos, loadHabits, ymd } from '../lib/appStorage';
import { APP_DATA_CHANGED } from '../lib/dataEvents';
import type { Todo } from './TodoList';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function monthMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let r = 0; r < cells.length / 7; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

function heatLevel(habitDone: number, habitTotal: number, deadlineCount: number): number {
  let score = 0;
  if (deadlineCount > 0) score += 2;
  if (habitTotal > 0) {
    const r = habitDone / habitTotal;
    if (r >= 1) score += 3;
    else if (r >= 0.5) score += 2;
    else if (r > 0) score += 1;
  }
  return Math.min(4, score);
}

function useDataRevision(): number {
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev(x => x + 1), []);
  useEffect(() => {
    window.addEventListener(APP_DATA_CHANGED, bump);
    return () => window.removeEventListener(APP_DATA_CHANGED, bump);
  }, [bump]);
  return rev;
}

const CalendarView: React.FC = () => {
  const rev = useDataRevision();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });

  const { matrix, todosByDay, habitHeat, todayKey, habitsTotal } = useMemo(() => {
    void rev;
    const todos = loadTodos();
    const habits = loadHabits();
    const todayKeyInner = ymd(new Date());
    const map = new Map<string, Todo[]>();
    for (const t of todos) {
      if (!t.deadline || t.completed) continue;
      const key = t.deadline.slice(0, 10);
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    }

    const habitHeatInner = (key: string) =>
      habits.filter(h => (h.completedDates || []).includes(key)).length;

    const matrixInner = monthMatrix(cursor.y, cursor.m);

    return {
      matrix: matrixInner,
      todosByDay: map,
      habitHeat: habitHeatInner,
      todayKey: todayKeyInner,
      habitsTotal: habits.length,
    };
  }, [rev, cursor.y, cursor.m]);

  const monthHasMarks = useMemo(() => {
    for (const row of matrix) {
      for (const cell of row) {
        if (!cell) continue;
        const key = ymd(cell);
        if ((todosByDay.get(key) || []).length > 0) return true;
        if (habitHeat(key) > 0) return true;
      }
    }
    return false;
  }, [matrix, todosByDay, habitHeat]);

  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    setCursor(c => {
      const d = new Date(c.y, c.m - 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const nextMonth = () => {
    setCursor(c => {
      const d = new Date(c.y, c.m + 1, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const goToday = () => {
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
  };

  return (
    <div className="calendar-page panel-block">
      <div className="content-shell">
      <h2>Календарь</h2>
      <p className="calendar-intro">
        Дедлайны задач и «тепло» по привычкам (чем насыщеннее ячейка, тем больше событий в этот день).
      </p>

      <div className="calendar-toolbar">
        <button type="button" className="calendar-nav" onClick={prevMonth} aria-label="Предыдущий месяц">
          ‹
        </button>
        <h3 className="calendar-title">{title}</h3>
        <button type="button" className="calendar-nav" onClick={nextMonth} aria-label="Следующий месяц">
          ›
        </button>
        <button type="button" className="calendar-today" onClick={goToday}>
          Сегодня
        </button>
      </div>

      <div className="calendar-legend">
        <span>
          <i className="cal-dot cal-dot--deadline" /> дедлайн
        </span>
        <span>
          <i className="cal-dot cal-dot--habit" /> привычки
        </span>
      </div>

      <div className="calendar-grid-head">
        {WEEKDAYS.map(d => (
          <div key={d} className="calendar-wd">
            {d}
          </div>
        ))}
      </div>

      {matrix.map((row, ri) => (
        <div key={ri} className="calendar-grid-row">
          {row.map((cell, ci) => {
            if (!cell) {
              return <div key={`e-${ri}-${ci}`} className="calendar-cell calendar-cell--empty" />;
            }
            const key = ymd(cell);
            const list = todosByDay.get(key) || [];
            const hDone = habitHeat(key);
            const level = heatLevel(hDone, habitsTotal, list.length);
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`calendar-cell heat-${level} ${isToday ? 'calendar-cell--today' : ''}`}
                title={`${cell.toLocaleDateString('ru-RU')}${list.length ? ` — дедлайнов: ${list.length}` : ''}${hDone ? ` — привычек: ${hDone}` : ''}`}
              >
                <span className="calendar-daynum">{cell.getDate()}</span>
                <div className="calendar-cell-marks">
                  {list.length > 0 && <span className="mark mark-deadline">{list.length}</span>}
                  {hDone > 0 && <span className="mark mark-habit">{hDone}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {!monthHasMarks && (
        <p className="empty-hint empty-hint--panel">
          В этом месяце пока нет дедлайнов и отметок привычек — ячейки останутся спокойными.
        </p>
      )}

      <section className="calendar-hint panel-inset">
        <strong>Подсказка:</strong> перетаскивание дедлайнов между днями пока не реализовано — дату можно
        изменить в карточке задачи. История привычек накапливается при нажатии «Сегодня».
      </section>
      </div>
    </div>
  );
};

export default CalendarView;
