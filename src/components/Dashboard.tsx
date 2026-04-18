import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { loadTodos, loadHabits, ymd } from '../lib/appStorage';
import { APP_DATA_CHANGED } from '../lib/dataEvents';

const QUOTES = [
  'Маленький шаг каждый день — это уже маршрут к большой цели.',
  'Сегодняшняя дисциплина — завтрашняя свобода.',
  'Не идеал, а прогресс: отметьте одно важное действие.',
];

function useDataRevision(): number {
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev(x => x + 1), []);
  useEffect(() => {
    window.addEventListener(APP_DATA_CHANGED, bump);
    return () => window.removeEventListener(APP_DATA_CHANGED, bump);
  }, [bump]);
  return rev;
}

const Dashboard: React.FC = () => {
  const rev = useDataRevision();
  const today = ymd(new Date());

  const snapshot = useMemo(() => {
    void rev;
    const todos = loadTodos();
    const habits = loadHabits();
    const active = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    const now = new Date();
    const overdue = active.filter(t => t.deadline && new Date(t.deadline) < now);
    const dueToday = active.filter(t => t.deadline && t.deadline.slice(0, 10) === today);
    const habitsDoneToday = habits.filter(h => h.lastCompletedDate === today).length;
    const subtasksTotal = todos.reduce((n, t) => n + (t.subtasks?.length || 0), 0);
    const subtasksDone = todos.reduce(
      (n, t) => n + (t.subtasks?.filter(s => s.completed).length || 0),
      0
    );

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekDays: { label: string; habitMarks: number; maxHabits: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = ymd(d);
      const marks = habits.filter(h => (h.completedDates || []).includes(key)).length;
      weekDays.push({
        label: d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
        habitMarks: marks,
        maxHabits: habits.length,
      });
    }

    const quoteSeed = today.split('-').reduce((a, b) => a + parseInt(b, 10), 0);
    const quote = QUOTES[quoteSeed % QUOTES.length];

    const completionRate =
      todos.length === 0 ? 0 : Math.round((100 * completed.length) / todos.length);

    return {
      todos,
      habits,
      activeCount: active.length,
      completedCount: completed.length,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      habitsDoneToday,
      habitsTotal: habits.length,
      subtasksTotal,
      subtasksDone,
      weekDays,
      quote,
      completionRate,
    };
  }, [rev, today]);

  return (
    <div className="dashboard panel-block">
      <div className="content-shell">
        <h2>Обзор</h2>
        <p className="dashboard-quote">{snapshot.quote}</p>
        {snapshot.todos.length === 0 && snapshot.habits.length === 0 && (
          <p className="empty-hint empty-hint--panel">
            Здесь появятся цифры, когда добавите задачи и привычки — начните с вкладок «Задачи» и «Привычки».
          </p>
        )}

        <div className="dashboard-grid">
        <section className="dash-card" aria-label="Задачи">
          <h3>Задачи</h3>
          <ul className="dash-stat-list">
            <li>
              Всего: <strong>{snapshot.todos.length}</strong>
            </li>
            <li>
              Активных: <strong>{snapshot.activeCount}</strong>
            </li>
            <li>
              Выполнено: <strong>{snapshot.completedCount}</strong> ({snapshot.completionRate}%)
            </li>
            <li className={snapshot.overdueCount ? 'dash-warn' : ''}>
              Просрочено: <strong>{snapshot.overdueCount}</strong>
            </li>
            <li className={snapshot.dueTodayCount ? 'dash-accent' : ''}>
              На сегодня: <strong>{snapshot.dueTodayCount}</strong>
            </li>
          </ul>
        </section>

        <section className="dash-card" aria-label="Подзадачи">
          <h3>Подзадачи</h3>
          <p className="dash-big">
            {snapshot.subtasksDone}
            <span className="dash-big-muted"> / {snapshot.subtasksTotal}</span>
          </p>
          <p className="dash-muted">выполнено из отмеченных в списках</p>
        </section>

        <section className="dash-card" aria-label="Привычки сегодня">
          <h3>Привычки сегодня</h3>
          <p className="dash-big">
            {snapshot.habitsDoneToday}
            <span className="dash-big-muted"> / {snapshot.habitsTotal || '—'}</span>
          </p>
          <p className="dash-muted">
            {snapshot.habitsTotal === 0 ? 'Добавьте привычки во вкладке «Привычки»' : 'отмечено на сегодня'}
          </p>
        </section>
      </div>

      <section className="dash-week" aria-label="Неделя привычек">
        <h3>7 дней: привычки</h3>
        <p className="dash-muted">Доля отмеченных привычек по дням (высота столбца)</p>
        <div className="dash-week-bars">
          {snapshot.weekDays.map((d, i) => {
            const ratio = d.maxHabits ? Math.min(1, d.habitMarks / d.maxHabits) : 0;
            const h = 8 + Math.round(ratio * 40);
            return (
              <div key={i} className="dash-week-col" title={`${d.habitMarks} из ${d.maxHabits || 0}`}>
                <div className="dash-week-bar" style={{ height: `${h}px` }} />
                <span className="dash-week-label">{d.label}</span>
              </div>
            );
          })}
        </div>
      </section>
      </div>
    </div>
  );
};

export default Dashboard;
