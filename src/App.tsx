import React, { useState, useLayoutEffect, useEffect } from 'react';
import TodoList from './components/TodoList';
import HabitTracker from './components/HabitTracker';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import SettingsPanel from './components/SettingsPanel';
import TrashView from './components/TrashView';
import ArchiveView from './components/ArchiveView';
import FlowView from './components/FlowView';
import CompassView from './components/CompassView';
import { applyTheme, getStoredTheme } from './lib/theme';
import { replaceUrlTab, parseTabFromSearch } from './lib/urlTab';
import type { AppTabId } from './lib/appTabId';
import { TAB_ICONS } from './tabIcons';
import './App.css';

export type { AppTabId };

const TABS: { id: AppTabId; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'flow', label: 'Поток' },
  { id: 'compass', label: 'Компас' },
  { id: 'todo', label: 'Задачи' },
  { id: 'habits', label: 'Привычки' },
  { id: 'calendar', label: 'Календарь' },
  { id: 'archive', label: 'Архив' },
  { id: 'trash', label: 'Корзина' },
  { id: 'settings', label: 'Настройки' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTabId>(() => parseTabFromSearch(window.location.search) ?? 'overview');

  useLayoutEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    replaceUrlTab(activeTab);
  }, [activeTab]);

  /** Alt+Shift+V — перейти на «Обзор», когда фокус не в поле ввода (как быстрый «виджет» внутри окна) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      if (e.code !== 'KeyV' && e.key !== 'v' && e.key !== 'V') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) {
        return;
      }
      e.preventDefault();
      setActiveTab('overview');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className="app-container">
        <header className="app-header">
          <p className="app-brand">Vanta Flow</p>
          <h1 className="app-title">Задачи и привычки</h1>
        </header>
        <div className="main-content" role="tabpanel">
          {activeTab === 'overview' && <Dashboard />}
          {activeTab === 'flow' && <FlowView />}
          {activeTab === 'compass' && <CompassView />}
          {activeTab === 'todo' && <TodoList />}
          {activeTab === 'habits' && <HabitTracker />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'archive' && <ArchiveView />}
          {activeTab === 'trash' && <TrashView />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
        <footer className="app-footer">
          <p className="app-credit">\\ digital piece by ESLL</p>
        </footer>
      </div>
      <div className="bottom-nav-dock">
        <nav className="bottom-nav" role="navigation" aria-label="Основные разделы">
          <div className="bottom-nav__scroll" role="tablist">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`bottom-nav__btn${isActive ? ' bottom-nav__btn--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="bottom-nav__icon">{TAB_ICONS[tab.id]}</span>
                  <span className="bottom-nav__label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default App;
