import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { loadTodos } from '../lib/appStorage';
import { APP_DATA_CHANGED } from '../lib/dataEvents';
import type { Todo } from './TodoList';
import SelectControl, { type SelectOption } from './SelectControl';

const SESSIONS_KEY = 'vanta-flow-sessions';
const PRESETS = [
  { label: 'Помодоро 25', work: 25 * 60, rest: 5 * 60 },
  { label: 'Глубоко 45', work: 45 * 60, rest: 10 * 60 },
  { label: 'Коротко 15', work: 15 * 60, rest: 3 * 60 },
];

type Phase = 'work' | 'rest';

interface SessionLog {
  at: string;
  seconds: number;
  todoId: number | null;
  phase: Phase;
}

function loadSessions(): SessionLog[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as SessionLog[]) : [];
  } catch {
    return [];
  }
}

function pushSession(entry: SessionLog) {
  const all = loadSessions();
  all.push(entry);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all.slice(-400)));
}

function weekTotalWorkSeconds(): number {
  const start = new Date();
  const d = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - d);
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  return loadSessions()
    .filter(s => s.phase === 'work' && new Date(s.at).getTime() >= t0)
    .reduce((a, s) => a + s.seconds, 0);
}

const FlowView: React.FC = () => {
  const [rev, setRev] = useState(0);
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [presetIdx, setPresetIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].work);
  const [running, setRunning] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<{ stop: () => void } | null>(null);

  const phaseRef = useRef(phase);
  const presetRef = useRef(presetIdx);
  const selectedRef = useRef(selectedId);
  phaseRef.current = phase;
  presetRef.current = presetIdx;
  selectedRef.current = selectedId;

  useEffect(() => {
    const bump = () => {
      setRev(x => x + 1);
      setTodos(loadTodos());
    };
    window.addEventListener(APP_DATA_CHANGED, bump);
    return () => window.removeEventListener(APP_DATA_CHANGED, bump);
  }, []);

  const activeTodos = useMemo(() => todos.filter(t => !t.completed), [todos]);
  const selected = activeTodos.find(t => t.id === selectedId) ?? null;

  const taskOptions = useMemo<SelectOption<string>[]>(() => {
    const rows: SelectOption<string>[] = [{ value: '', label: '— Выберите задачу —' }];
    for (const t of activeTodos) {
      const label = t.text.length > 72 ? `${t.text.slice(0, 72)}…` : t.text;
      rows.push({ value: String(t.id), label });
    }
    return rows;
  }, [activeTodos]);
  const weekMin = useMemo(() => {
    void rev;
    return Math.round(weekTotalWorkSeconds() / 60);
  }, [rev]);

  const work = PRESETS[presetIdx].work;
  const rest = PRESETS[presetIdx].rest;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1;
        const ph = phaseRef.current;
        const pIdx = presetRef.current;
        const w = PRESETS[pIdx].work;
        const r = PRESETS[pIdx].rest;
        if (ph === 'work') {
          pushSession({
            at: new Date().toISOString(),
            seconds: w,
            todoId: selectedRef.current,
            phase: 'work',
          });
          setRev(x => x + 1);
        }
        const nextPhase: Phase = ph === 'work' ? 'rest' : 'work';
        setPhase(nextPhase);
        return nextPhase === 'work' ? w : r;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const applyPreset = (i: number) => {
    setPresetIdx(i);
    setRunning(false);
    setPhase('work');
    setSecondsLeft(PRESETS[i].work);
  };

  const reset = () => {
    setRunning(false);
    setPhase('work');
    setSecondsLeft(PRESETS[presetIdx].work);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const toggleAmbient = useCallback(() => {
    setAmbientOn(on => {
      if (on) {
        noiseRef.current?.stop();
        noiseRef.current = null;
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
        return false;
      }
      try {
        const ctx = new AudioContext();
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.035;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        audioCtxRef.current = ctx;
        noiseRef.current = {
          stop: () => {
            try {
              src.stop();
            } catch {
              /* */
            }
            gain.disconnect();
          },
        };
      } catch {
        /* ignore */
      }
      return true;
    });
  }, []);

  useEffect(() => () => {
    noiseRef.current?.stop();
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  return (
    <div className="flow-page panel-block">
      <div className="content-shell">
        <h2>Поток</h2>
        <p className="flow-lead">Одна задача и таймер. Завершённые интервалы фиксируются в локальной статистике недели.</p>
        {activeTodos.length === 0 && (
          <p className="empty-hint empty-hint--panel">
            Нет активных задач. Добавьте хотя бы одну во вкладке «Задачи», чтобы привязать её к сессии фокуса.
          </p>
        )}

        <div className="flow-shell">
        <div className="flow-task-block">
          <span className="flow-label" id="flow-task-label">
            Задача сессии
          </span>
          <div className="flow-select-wrap">
            <SelectControl
              value={selectedId === null ? '' : String(selectedId)}
              onChange={v => setSelectedId(v === '' ? null : Number(v))}
              options={taskOptions}
              className="flow-task-select"
              ariaLabel="Задача сессии"
            />
          </div>
          {selected && <p className="flow-task-title">{selected.text}</p>}
        </div>

        <div className="flow-timer-ring">
          <div className={`flow-phase flow-phase--${phase}`}>{phase === 'work' ? 'Фокус' : 'Отдых'}</div>
          <div className="flow-time">{fmt(secondsLeft)}</div>
          <div className="flow-presets">
            {PRESETS.map((p, i) => (
              <button key={p.label} type="button" className={i === presetIdx ? 'is-on' : ''} onClick={() => applyPreset(i)} disabled={running}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flow-controls">
            {!running ? (
              <button type="button" className="flow-primary" onClick={() => setRunning(true)}>
                Старт
              </button>
            ) : (
              <button type="button" className="flow-primary" onClick={() => setRunning(false)}>
                Пауза
              </button>
            )}
            <button type="button" onClick={reset}>
              Сброс
            </button>
          </div>
        </div>

        <div className="flow-extra">
          <label className="flow-ambient">
            <input type="checkbox" checked={ambientOn} onChange={toggleAmbient} /> Тихий белый шум (в браузере)
          </label>
          <p className="flow-stat">
            Фокус на этой неделе: <strong>{weekMin}</strong> мин.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default FlowView;
