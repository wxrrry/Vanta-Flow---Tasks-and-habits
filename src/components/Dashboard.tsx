import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { loadTodos, loadHabits, ymd } from '../lib/appStorage';
import { APP_DATA_CHANGED } from '../lib/dataEvents';

const QUOTES = [
  'Маленький шаг каждый день — это уже маршрут к большой цели.',
  'Сегодняшняя дисциплина — завтрашняя свобода.',
  'Не идеал, а прогресс: отметьте одно важное действие.',
  'Привычка — это мост между целью и результатом.',
  'Лучшее время начать — вчера. Второе лучшее — сейчас.',
  'Фокус на прогрессе, а не на совершенстве.',
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

/** Circular progress ring */
function ProgressRing({ value, max, size = 90, stroke = 7, color = '#00fff0', label }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; label: string;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - ratio);
  const pct = Math.round(ratio * 100);

  return (
    <div className="dash-ring-wrap">
      <svg width={size} height={size} className="dash-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          fill="#fff" fontSize="1.15rem" fontWeight="700">{pct}%</text>
      </svg>
      <span className="dash-ring-label">{label}</span>
    </div>
  );
}

/** Streak counter for habits */
function streakFor(dates: string[], today: string): number {
  if (!dates.includes(today)) return 0;
  const sorted = [...dates].sort().reverse();
  let streak = 0;
  const d = new Date(today + 'T12:00:00');
  for (let i = 0; i < 365; i++) {
    const key = ymd(d);
    if (sorted.includes(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

const Dashboard: React.FC = () => {
  const rev = useDataRevision();
  const today = ymd(new Date());
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const snap = useMemo(() => {
    void rev;
    const todos = loadTodos();
    const habits = loadHabits();
    const active = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    const now = new Date();
    const overdue = active.filter(t => t.deadline && new Date(t.deadline) < now);
    const dueToday = active.filter(t => t.deadline && t.deadline.slice(0, 10) === today);
    const habitsDoneToday = habits.filter(h => (h.completedDates ?? []).includes(today)).length;
    const subtasksTotal = todos.reduce((n, t) => n + (t.subtasks?.length || 0), 0);
    const subtasksDone = todos.reduce(
      (n, t) => n + (t.subtasks?.filter(s => s.completed).length || 0), 0,
    );

    // Week heatmap
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekDays: { label: string; short: string; marks: number; max: number; date: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = ymd(d);
      const marks = habits.filter(h => (h.completedDates || []).includes(key)).length;
      weekDays.push({
        label: d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }),
        short: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        marks,
        max: habits.length,
        date: key,
      });
    }

    // Best streak across all habits
    let bestStreak = 0;
    let bestHabitName = '';
    habits.forEach(h => {
      const s = streakFor(h.completedDates ?? [], today);
      if (s > bestStreak) { bestStreak = s; bestHabitName = h.name; }
    });

    // Priority breakdown
    const byPriority = { high: 0, medium: 0, low: 0 };
    active.forEach(t => {
      const p = t.priority || 'medium';
      if (p in byPriority) byPriority[p as keyof typeof byPriority]++;
    });

    // Recent completed (last 5)
    const recentCompleted = completed
      .slice(-5)
      .reverse()
      .map(t => t.text);

    const quoteSeed = today.split('-').reduce((a, b) => a + parseInt(b, 10), 0);
    const quote = QUOTES[quoteSeed % QUOTES.length];
    const completionRate = todos.length === 0 ? 0 : Math.round((100 * completed.length) / todos.length);

    return {
      todosTotal: todos.length, activeCount: active.length, completedCount: completed.length,
      overdueCount: overdue.length, dueTodayCount: dueToday.length,
      habitsDoneToday, habitsTotal: habits.length,
      subtasksTotal, subtasksDone,
      weekDays, bestStreak, bestHabitName,
      byPriority, recentCompleted,
      quote, completionRate,
    };
  }, [rev, today]);

  const greeting = time.getHours() < 6 ? 'Доброй ночи' :
    time.getHours() < 12 ? 'Доброе утро' :
    time.getHours() < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="dashboard">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h2 className="dash-greeting">{greeting}!</h2>
          <p className="dash-quote">«{snap.quote}»</p>
          <p className="dash-date">
            {time.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="dash-rings">
          <ProgressRing value={snap.completedCount} max={snap.todosTotal} color="#00fff0" label="Задачи" />
          <ProgressRing value={snap.habitsDoneToday} max={snap.habitsTotal} color="#a78bfa" label="Привычки" />
          <ProgressRing value={snap.subtasksDone} max={snap.subtasksTotal} color="#fbbf24" label="Подзадачи" />
        </div>
      </div>

      {snap.todosTotal === 0 && snap.habitsTotal === 0 && (
        <p className="empty-hint">
          Начните с вкладок «Задачи» и «Привычки» — здесь появится полная статистика.
        </p>
      )}

      {/* Stats cards */}
      <div className="dash-cards">
        <div className="dash-card dash-card--tasks">
          <div className="dash-card-icon">✅</div>
          <div className="dash-card-body">
            <span className="dash-card-number">{snap.activeCount}</span>
            <span className="dash-card-label">Активных задач</span>
          </div>
        </div>
        <div className={`dash-card ${snap.overdueCount ? 'dash-card--danger' : 'dash-card--ok'}`}>
          <div className="dash-card-icon">⚠️</div>
          <div className="dash-card-body">
            <span className="dash-card-number">{snap.overdueCount}</span>
            <span className="dash-card-label">Просрочено</span>
          </div>
        </div>
        <div className={`dash-card ${snap.dueTodayCount ? 'dash-card--accent' : 'dash-card--ok'}`}>
          <div className="dash-card-icon">📅</div>
          <div className="dash-card-body">
            <span className="dash-card-number">{snap.dueTodayCount}</span>
            <span className="dash-card-label">На сегодня</span>
          </div>
        </div>
        <div className="dash-card dash-card--streak">
          <div className="dash-card-icon">🔥</div>
          <div className="dash-card-body">
            <span className="dash-card-number">{snap.bestStreak}<span className="dash-card-unit"> дн.</span></span>
            <span className="dash-card-label">{snap.bestHabitName ? `Серия: ${snap.bestHabitName}` : 'Лучшая серия'}</span>
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      {snap.activeCount > 0 && (
        <div className="dash-section">
          <h3 className="dash-section-title">Приоритеты активных задач</h3>
          <div className="dash-priority-bars">
            <div className="dash-pbar">
              <span className="dash-pbar-label">🔴 Высокий</span>
              <div className="dash-pbar-track">
                <div className="dash-pbar-fill dash-pbar--high"
                  style={{ width: `${snap.activeCount ? (snap.byPriority.high / snap.activeCount) * 100 : 0}%` }} />
              </div>
              <span className="dash-pbar-count">{snap.byPriority.high}</span>
            </div>
            <div className="dash-pbar">
              <span className="dash-pbar-label">🟡 Средний</span>
              <div className="dash-pbar-track">
                <div className="dash-pbar-fill dash-pbar--med"
                  style={{ width: `${snap.activeCount ? (snap.byPriority.medium / snap.activeCount) * 100 : 0}%` }} />
              </div>
              <span className="dash-pbar-count">{snap.byPriority.medium}</span>
            </div>
            <div className="dash-pbar">
              <span className="dash-pbar-label">🟢 Низкий</span>
              <div className="dash-pbar-track">
                <div className="dash-pbar-fill dash-pbar--low"
                  style={{ width: `${snap.activeCount ? (snap.byPriority.low / snap.activeCount) * 100 : 0}%` }} />
              </div>
              <span className="dash-pbar-count">{snap.byPriority.low}</span>
            </div>
          </div>
        </div>
      )}

      {/* Week heatmap */}
      <div className="dash-section">
        <h3 className="dash-section-title">Привычки за 7 дней</h3>
        <div className="dash-week">
          {snap.weekDays.map((d, i) => {
            const ratio = d.max ? Math.min(1, d.marks / d.max) : 0;
            const isToday = d.date === today;
            return (
              <div key={i} className={`dash-week-col ${isToday ? 'dash-week-col--today' : ''}`}
                title={`${d.label}: ${d.marks} из ${d.max}`}>
                <div className="dash-week-bar-bg">
                  <div className="dash-week-bar-fill"
                    style={{ height: `${8 + ratio * 52}px`, opacity: 0.3 + ratio * 0.7 }} />
                </div>
                <span className="dash-week-count">{d.marks}/{d.max || 0}</span>
                <span className="dash-week-day">{d.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent completed */}
      {snap.recentCompleted.length > 0 && (
        <div className="dash-section">
          <h3 className="dash-section-title">Недавно выполнено</h3>
          <ul className="dash-recent">
            {snap.recentCompleted.map((txt, i) => (
              <li key={i} className="dash-recent-item">
                <span className="dash-recent-check">✓</span>
                <span>{txt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
