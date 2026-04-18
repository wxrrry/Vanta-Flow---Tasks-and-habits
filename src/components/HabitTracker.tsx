import React, { useState, useEffect, useCallback } from 'react';

function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Целое число дней между датами YYYY-MM-DD (вторая минус первая). */
function calendarDaysBetween(fromYmd: string, toYmd: string): number {
  const a = new Date(fromYmd + 'T12:00:00');
  const b = new Date(toYmd + 'T12:00:00');
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export interface Habit {
  id: number;
  name: string;
  streak: number;
  lastCompletedDate?: string;
  bestStreak?: number;
  completedDates?: string[];
}

const STORAGE_KEY = 'habits';

const getInitialHabits = (): Habit[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as Habit[];
    return parsed.map(h => {
      const hadLegacyCounter = !h.lastCompletedDate && (h.streak || 0) > 0;
      const bestStreak = Math.max(typeof h.bestStreak === 'number' ? h.bestStreak : 0, h.streak || 0);
      return {
        ...h,
        bestStreak,
        streak: hadLegacyCounter ? 0 : h.streak || 0,
      };
    });
  } catch {
    return [];
  }
};

const persistHabits = (next: Habit[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

interface HabitTrackerProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  templateText?: string;
  onTemplateConsumed?: () => void;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ inputRef, templateText, onTemplateConsumed }) => {
  const [habits, setHabits] = useState<Habit[]>(getInitialHabits);
  const [input, setInput] = useState('');
  const [today, setToday] = useState(localDateString);

  useEffect(() => {
    const id = window.setInterval(() => {
      const n = localDateString();
      setToday(t => (t !== n ? n : t));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (templateText === undefined) return;
    setInput(templateText);
    onTemplateConsumed?.();
  }, [templateText, onTemplateConsumed]);

  const updateHabits = useCallback((updater: (prev: Habit[]) => Habit[]) => {
    setHabits(prev => {
      const next = updater(prev);
      persistHabits(next);
      return next;
    });
  }, []);

  const addHabit = () => {
    if (!input.trim()) return;
    updateHabits(prev => [...prev, { id: Date.now(), name: input.trim(), streak: 0, bestStreak: 0 }]);
    setInput('');
  };

  const markDoneToday = (id: number) => {
    updateHabits(prev =>
      prev.map(habit => {
        if (habit.id !== id) return habit;
        if (habit.lastCompletedDate === today) return habit;

        let streak = 1;
        if (habit.lastCompletedDate) {
          const gap = calendarDaysBetween(habit.lastCompletedDate, today);
          if (gap < 0) return habit;
          if (gap === 1) streak = habit.streak + 1;
          else if (gap > 1) streak = 1;
          else return habit;
        }

        const bestStreak = Math.max(habit.bestStreak ?? 0, streak);
        return { ...habit, streak, lastCompletedDate: today, bestStreak };
      })
    );
  };

  const removeHabit = (id: number) => {
    updateHabits(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="habit-tracker">
      <h2>Трекер привычек</h2>
      <p className="habit-subtitle">Отмечайте выполнение раз в день — серия растёт подряд, при пропуске дня сбрасывается.</p>
      <div className="habit-input">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHabit()}
          placeholder="Новая привычка..."
          aria-label="Название привычки"
        />
        <button type="button" onClick={addHabit}>
          Добавить
        </button>
      </div>
      <ul className="habit-cards">
        {habits.map(habit => {
          const doneToday = habit.lastCompletedDate === today;
          return (
            <li key={habit.id} className="habit-card">
              <div className="habit-card__main">
                <span className="habit-name">{habit.name}</span>
                <div className="habit-stats">
                  <span className="habit-streak" title="Текущая серия дней подряд">
                    Серия: <strong>{habit.streak}</strong>
                  </span>
                  <span className="habit-best" title="Лучшая серия за всё время">
                    Рекорд: <strong>{habit.bestStreak ?? habit.streak}</strong>
                  </span>
                </div>
              </div>
              <div className="habit-card__actions">
                <button
                  type="button"
                  className={doneToday ? 'habit-done habit-done--active' : 'habit-done'}
                  onClick={() => markDoneToday(habit.id)}
                  disabled={doneToday}
                  aria-pressed={doneToday}
                  aria-label={doneToday ? 'Уже отмечено на сегодня' : 'Отметить выполнение на сегодня'}
                >
                  {doneToday ? 'Сегодня ✓' : 'Сегодня'}
                </button>
                <button type="button" className="icon-btn danger" onClick={() => removeHabit(habit.id)} aria-label="Удалить привычку">
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {habits.length === 0 && <p className="empty-hint">Добавьте первую привычку или выберите шаблон.</p>}
    </div>
  );
};

export default HabitTracker;