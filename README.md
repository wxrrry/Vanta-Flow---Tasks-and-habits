# Vanta Flow — Tasks & Habits

> Современное приложение для управления задачами, привычками и целями, собранное с любовью.

[![CI](https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/actions/workflows/ci.yml/badge.svg)](https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/actions/workflows/ci.yml)
[![Release](https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/actions/workflows/release.yml/badge.svg)](https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Скачать

**[⬇ Скачать последнюю версию для Windows](https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/releases/latest)**

Скачайте `Vanta Flow Setup x.x.x.exe`, запустите установщик и готово.
Не требует .NET, Java или других зависимостей.

---

## Возможности

| Раздел | Что умеет |
|---|---|
| **ToDo** | Задачи с подзадачами, приоритеты, категории, сроки, drag-and-drop |
| **Привычки** | Серии и статус (streak), heatmap, быстрое выполнение |
| **Цели** | Compass: визуальный обзор целей и прогресс по каждой |
| **Flow** | Режим фокуса, таймер Помодоро и настройки фокуса |
| **Архив** | Архивные завершённые записи + дата завершения |
| **Настройки** | Выбор темы оформления и настройки по вкусу |
| **Архив / Корзина** | Удалённые записи временно хранятся в корзине |
| **Параметры** | Тема, настройки приложения |
| **Дашборд** | Сводная статистика задач и привычек по текущей неделе |

- Все данные хранятся в `localStorage` — без сервера, без регистрации
- Тёмная тема с glassmorphism-дизайном
- Electron-приложение: работает как нативная программа, без браузера

---

## Разработка

### Зависимости

- Node.js 18+
- npm 9+

### Запуск в режиме разработки

```bash
# Установить зависимости
npm install

# Запустить webpack dev-сервер (веб-версия)
npm start
```

### Сборка веб-версии

```bash
npm run build
```

### Сборка Electron-приложения (Windows)

```bash
# Создать .exe-установщик для Windows
npm run dist:win
```

Готовый установщик появится в папке `release/`.

---

## Структура проекта

```
src/
  App.tsx                  — корневой компонент, роутинг по вкладкам
  components/
    TodoList.tsx           — список задач
    HabitTracker.tsx       — трекер привычек
    Dashboard.tsx          — дашборд / сводка
    FlowView.tsx           — режим фокуса
    CompassView.tsx        — трекер целей
    CalendarView.tsx       — календарь и heatmap
    ArchiveView.tsx        — архив
    TrashView.tsx          — корзина
    SettingsPanel.tsx      — настройки
  lib/
    appStorage.ts          — чтение/запись localStorage
    theme.ts               — управление темой
    trashArchive.ts        — логика архива и корзины
electron/
  main.cjs                 — точка входа Electron
```

---

## Релиз

Новую версию можно опубликовать автоматически для всех пользователей:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions соберёт установщик и опубликует его на вкладке [Releases](https://github.com/wxrrry/Vanta-Flow---Tasks-and-habits/releases).

---

## Стек

- **React 18** + **TypeScript**
- **Webpack 5**
- **Electron 33**
- **electron-builder** (NSIS-установщик для Windows)

---

## Лицензия

[MIT](LICENSE) © ESLL