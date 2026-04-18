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

function ProgressRing({ value, max, size = 88, stroke = 7, color = '#00fff0', label }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; label: string;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - ratio);
  const pct = Math.round(ratio * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 10px ${color}44)` }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          fill="#fff" fontSize="1.1rem" fontWeight="700">{pct}%</text>
      </svg>
      <span style={{ color: '#8aa', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
    </div>
  );
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
    const habitsDoneToday = habits.filter(h =>
      h.lastCompletedDate === today || (h.completedDates ?? []).includes(today)
    ).length;
    const subtasksTotal = todos.reduce((n, t) => n + (t.subtasks?.length || 0), 0);
    const subtasksDone = todos.reduce(
      (n, t) => n + (t.subtasks?.filter(s => s.completed).length || 0), 0,
    );

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
        marks, max: habits.length, date: key,
      });
    }

    const byPriority = { high: 0, medium: 0, low: 0 };
    active.forEach(t => {
      const p = (t.priority || 'medium') as keyof typeof byPriority;
      if (p in byPriority) byPriority[p]++;
    });

    const recentCompleted = completed.slice(-5).reverse().map(t => t.text);
    const quoteSeed = today.split('-').reduce((a, b) => a + parseInt(b, 10), 0);
    const quote = QUOTES[quoteSeed % QUOTES.length];
    const completionRate = todos.length === 0 ? 0 : Math.round((100 * completed.length) / todos.length);

    return {
      todosTotal: todos.length, activeCount: active.length, completedCount: completed.length,
      overdueCount: overdue.length, dueTodayCount: dueToday.length,
      habitsDoneToday, habitsTotal: habits.length,
      subtasksTotal, subtasksDone,
      weekDays, byPriority, recentCompleted,
      quote, completionRate,
    };
  }, [rev, today]);

  const greeting = time.getHours() < 6 ? 'Доброй ночи' :
    time.getHours() < 12 ? 'Доброе утро' :
    time.getHours() < 18 ? 'Добрый день' : 'Добрый вечер';

  const S = {
    dashboard: {
      display: 'flex', flexDirection: 'column' as const, gap: 20,
      width: '100%', boxSizing: 'border-box' as const,
      overflow: 'hidden' as const,
      background: 'rgba(255,255,255,0.09)', borderRadius: 22,
      boxShadow: '0 4px 32px rgba(0,0,0,0.22)', padding: '28px 20px 32px 20px',
      border: '1.5px solid rgba(0,255,255,0.10)',
    },
    hero: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      textAlign: 'center' as const, gap: 20,
      width: '100%', boxSizing: 'border-box' as const, overflow: 'hidden' as const,
      background: 'linear-gradient(135deg,rgba(0,255,240,0.12),rgba(167,139,250,0.10) 50%,rgba(251,191,36,0.06))',
      border: '1.5px solid rgba(0,255,255,0.15)', borderRadius: 18, padding: '24px 20px',
    },
    heroText: { width: '100%' },
    greeting: {
      fontSize: '1.7rem', fontWeight: 700, margin: '0 0 8px 0',
      background: 'linear-gradient(135deg,#fff,#00fff0)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    quote: { color: '#9bb', fontStyle: 'italic' as const, fontSize: '0.93rem', margin: '0 0 10px 0', lineHeight: 1.5 },
    date: { color: '#667', fontSize: '0.85rem', margin: 0, textTransform: 'capitalize' as const },
    rings: {
      display: 'flex', flexDirection: 'row' as const, alignItems: 'center',
      justifyContent: 'space-around', gap: 8, width: '100%',
      flexWrap: 'nowrap' as const, boxSizing: 'border-box' as const,
    },
    ringWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 },
    ringLabel: { color: '#8aa', fontSize: '0.78rem', textTransform: 'uppercase' as const, letterSpacing: 1 },
    cards: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      width: '100%', boxSizing: 'border-box' as const,
    },
    card: (extra?: React.CSSProperties): React.CSSProperties => ({
      display: 'flex', flexDirection: 'row' as const, alignItems: 'center', gap: 14,
      background: 'rgba(255,255,255,0.06)', border: '1.2px solid rgba(255,255,255,0.09)',
      borderRadius: 16, padding: '16px 16px',
      ...extra,
    }),
    cardBody: { display: 'flex', flexDirection: 'column' as const },
    cardNum: { fontSize: '1.5rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 },
    cardLbl: { fontSize: '0.8rem', color: '#7aa', marginTop: 3 },
    section: {
      background: 'rgba(255,255,255,0.04)', border: '1.2px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px 18px',
      width: '100%', boxSizing: 'border-box' as const, overflow: 'hidden' as const,
    },
    sectionTitle: {
      fontSize: '0.8rem', fontWeight: 600, color: '#bcc', margin: '0 0 14px 0',
      textTransform: 'uppercase' as const, letterSpacing: '0.8px',
    },
    pbars: { display: 'flex', flexDirection: 'column' as const, gap: 10, width: '100%' },
    pbar: { display: 'flex', flexDirection: 'row' as const, alignItems: 'center', gap: 10, width: '100%' },
    pbarLabel: { width: 110, fontSize: '0.85rem', color: '#9ab', flexShrink: 0 as const },
    pbarTrack: { flex: 1, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden' as const },
    pbarCount: { width: 26, textAlign: 'right' as const, fontSize: '0.9rem', fontWeight: 600, color: '#cdd' },
    week: {
      display: 'flex', flexDirection: 'row' as const, alignItems: 'flex-end',
      justifyContent: 'space-between', gap: 4, width: '100%',
      boxSizing: 'border-box' as const, overflow: 'hidden' as const,
    },
    weekCol: (isToday: boolean): React.CSSProperties => ({
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
      flex: '1 1 0', minWidth: 0,
      borderRadius: 10, padding: '6px 2px 6px 2px',
      background: isToday ? 'rgba(0,255,240,0.05)' : undefined,
      border: isToday ? '1px solid rgba(0,255,240,0.15)' : '1px solid transparent',
    }),
    barBg: {
      width: '100%', maxWidth: 32, height: 56, background: 'rgba(255,255,255,0.04)',
      borderRadius: 8, display: 'flex', alignItems: 'flex-end' as const, overflow: 'hidden' as const,
    },
    barFill: (h: number, opacity: number): React.CSSProperties => ({
      width: '100%', height: h, background: 'linear-gradient(180deg,#a78bfa,#00fff0)',
      borderRadius: '8px 8px 0 0', minHeight: 4, opacity,
    }),
    weekCount: { fontSize: '0.72rem', color: '#8aa', fontWeight: 500 },
    weekDay: (isToday: boolean): React.CSSProperties => ({
      fontSize: '0.73rem', color: isToday ? '#00fff0' : '#667',
      textTransform: 'capitalize' as const, fontWeight: isToday ? 600 : 500,
    }),
    recent: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 8 },
    recentItem: {
      display: 'flex', flexDirection: 'row' as const, alignItems: 'center', gap: 12,
      padding: '10px 14px', background: 'rgba(0,255,240,0.03)',
      borderRadius: 12, border: '1px solid rgba(0,255,240,0.06)', color: '#9ab', fontSize: '0.9rem',
    },
  };

  return (
    <div style={S.dashboard}>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroText}>
          <h2 style={S.greeting}>{greeting}!</h2>
          <p style={S.quote}>«{snap.quote}»</p>
          <p style={S.date}>
            {time.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={S.rings}>
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
      <div style={S.cards}>
        <div style={S.card()}>
          <span style={{ fontSize: '1.6rem' }}>✅</span>
          <div style={S.cardBody}>
            <span style={S.cardNum}>{snap.activeCount}</span>
            <span style={S.cardLbl}>Активных задач</span>
          </div>
        </div>
        <div style={S.card(snap.overdueCount ? { borderColor: 'rgba(255,59,59,0.30)', background: 'rgba(255,59,59,0.07)' } : undefined)}>
          <span style={{ fontSize: '1.6rem' }}>⚠️</span>
          <div style={S.cardBody}>
            <span style={{ ...S.cardNum, color: snap.overdueCount ? '#ff5c5c' : '#fff' }}>{snap.overdueCount}</span>
            <span style={S.cardLbl}>Просрочено</span>
          </div>
        </div>
        <div style={S.card(snap.dueTodayCount ? { borderColor: 'rgba(0,255,240,0.25)', background: 'rgba(0,255,240,0.06)' } : undefined)}>
          <span style={{ fontSize: '1.6rem' }}>📅</span>
          <div style={S.cardBody}>
            <span style={{ ...S.cardNum, color: snap.dueTodayCount ? '#00fff0' : '#fff' }}>{snap.dueTodayCount}</span>
            <span style={S.cardLbl}>На сегодня</span>
          </div>
        </div>
        <div style={S.card({ borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.05)' })}>
          <span style={{ fontSize: '1.6rem' }}>🔥</span>
          <div style={S.cardBody}>
            <span style={{ ...S.cardNum, color: '#fbbf24' }}>
              {snap.habitsDoneToday}<span style={{ fontSize: '0.82rem', color: '#7aa' }}> / {snap.habitsTotal || '—'}</span>
            </span>
            <span style={S.cardLbl}>Привычки сегодня</span>
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      {snap.activeCount > 0 && (
        <div style={S.section}>
          <p style={S.sectionTitle}>Приоритеты активных задач</p>
          <div style={S.pbars}>
            {([
              { label: '🔴 Высокий', key: 'high', grad: 'linear-gradient(90deg,#ff3b3b,#ff6b6b)' },
              { label: '🟡 Средний', key: 'medium', grad: 'linear-gradient(90deg,#fbbf24,#fcd34d)' },
              { label: '🟢 Низкий',  key: 'low',    grad: 'linear-gradient(90deg,#34d399,#6ee7b7)' },
            ] as const).map(({ label, key, grad }) => (
              <div key={key} style={S.pbar}>
                <span style={S.pbarLabel}>{label}</span>
                <div style={S.pbarTrack}>
                  <div style={{ height: '100%', borderRadius: 8, background: grad, width: `${snap.activeCount ? (snap.byPriority[key] / snap.activeCount) * 100 : 0}%`, transition: 'width 0.5s ease' }} />
                </div>
                <span style={S.pbarCount}>{snap.byPriority[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week heatmap */}
      <div style={S.section}>
        <p style={S.sectionTitle}>Привычки за 7 дней</p>
        <div style={S.week}>
          {snap.weekDays.map((d, i) => {
            const ratio = d.max ? Math.min(1, d.marks / d.max) : 0;
            const isToday = d.date === today;
            return (
              <div key={i} style={S.weekCol(isToday)} title={`${d.label}: ${d.marks} из ${d.max}`}>
                <div style={S.barBg}>
                  <div style={S.barFill(8 + ratio * 52, 0.3 + ratio * 0.7)} />
                </div>
                <span style={S.weekCount}>{d.marks}/{d.max || 0}</span>
                <span style={S.weekDay(isToday)}>{d.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent completed */}
      {snap.recentCompleted.length > 0 && (
        <div style={S.section}>
          <p style={S.sectionTitle}>Недавно выполнено</p>
          <ul style={S.recent}>
            {snap.recentCompleted.map((txt, i) => (
              <li key={i} style={S.recentItem}>
                <span style={{ color: '#00fff0', fontWeight: 700, fontSize: '1.1rem' }}>✓</span>
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
