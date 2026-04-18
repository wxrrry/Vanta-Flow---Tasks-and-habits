import React, { useState, useRef, useCallback } from 'react';
import TodoList from './components/TodoList';
import HabitTracker from './components/HabitTracker';
import TemplatesModal from './components/TemplatesModal';
import './App.css';

const TABS = [
  { id: 'todo' as const, label: 'ToDo-лист' },
  { id: 'habits' as const, label: 'Трекер привычек' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'habits'>('todo');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'todo' | 'habit'>('todo');
  const [todoTemplateText, setTodoTemplateText] = useState<string | undefined>(undefined);
  const [habitTemplateText, setHabitTemplateText] = useState<string | undefined>(undefined);

  const todoInputRef = useRef<HTMLInputElement | null>(null);
  const habitInputRef = useRef<HTMLInputElement | null>(null);

  const clearTodoTemplate = useCallback(() => setTodoTemplateText(undefined), []);
  const clearHabitTemplate = useCallback(() => setHabitTemplateText(undefined), []);

  const handleTemplateSelect = (text: string) => {
    if (modalType === 'todo') {
      setTodoTemplateText(text);
      requestAnimationFrame(() => todoInputRef.current?.focus());
    } else {
      setHabitTemplateText(text);
      requestAnimationFrame(() => habitInputRef.current?.focus());
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Задачи и привычки</h1>
        <p className="app-tagline">Локальное хранение в браузере — без регистрации</p>
      </header>
      <div className="tabs" role="tablist" aria-label="Разделы приложения">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          className="tab template-btn"
          onClick={() => {
            setModalType(activeTab === 'todo' ? 'todo' : 'habit');
            setModalOpen(true);
          }}
        >
          Шаблоны
        </button>
      </div>
      <div className="main-content" role="tabpanel">
        {activeTab === 'todo' && (
          <TodoList inputRef={todoInputRef} templateText={todoTemplateText} onTemplateConsumed={clearTodoTemplate} />
        )}
        {activeTab === 'habits' && (
          <HabitTracker inputRef={habitInputRef} templateText={habitTemplateText} onTemplateConsumed={clearHabitTemplate} />
        )}
      </div>
      <TemplatesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleTemplateSelect}
        type={modalType}
      />
    </div>
  );
};

export default App;
