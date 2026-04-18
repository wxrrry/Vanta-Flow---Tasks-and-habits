# Vanta Flow

Локальное приложение для задач, привычек, компаса недели и календаря: веб (PWA) и десктоп для Windows (Electron).

**Автор:** ESLL · digital piece

## Возможности

- Списки задач и привычки с сохранением в браузере (IndexedDB / локальное хранилище)
- Календарь, архив, корзина, темы оформления
- Установка как PWA в браузере или через установщик Windows (`.exe`)

## Требования

- [Node.js](https://nodejs.org/) 18+ и npm

## Разработка

```bash
npm install
npm start
```

Откроется dev-сервер с hot reload.

### Сборка веб-версии

```bash
npm run build
```

Результат в каталоге `dist/` — можно отдавать любым статическим хостингом (GitHub Pages, Netlify и т.д.).

### Сборка десктопа (Windows)

```bash
npm run dist:win
```

Установщик NSIS: `release/Vanta Flow Setup <версия>.exe` (версия берётся из `package.json`).

Локальный запуск Electron после сборки:

```bash
npm run electron
```

Для разработки с `webpack serve` в отдельном терминале задайте `VANTA_DEV=1` и запустите `electron .` (см. `electron/main.cjs`).

## Публикация на GitHub

### 1. Создайте репозиторий

На [github.com/new](https://github.com/new) создайте пустой репозиторий **без** README, `.gitignore` и лицензии (они уже есть в проекте).

### 2. Подключите remote и отправьте код

Замените `YOUR_USER` и `YOUR_REPO` на свой логин и имя репозитория:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 3. Первый релиз

**Вариант A — через Git (рекомендуется с CI):**

1. Убедитесь, что в репозитории включены **GitHub Actions** (Settings → Actions → разрешить workflows).
2. Создайте тег версии (совпадает с `"version"` в `package.json`, например `1.0.0`):

   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

3. Откройте вкладку **Actions**: workflow **Release (Windows)** соберёт установщик и прикрепит `.exe` к [Releases](https://github.com/YOUR_USER/YOUR_REPO/releases).

**Вариант B — вручную:**

1. Локально выполните `npm run dist:win`.
2. На GitHub: **Releases → Create a new release**, укажите тег `v1.0.0`, заголовок и описание, прикрепите файл `release/Vanta Flow Setup 1.0.0.exe`.

### Секреты и токены

Для описанного выше релиза через Actions **дополнительный токен не нужен**: `GITHUB_TOKEN` выдаётся автоматически.

## Структура проекта

| Путь | Назначение |
|------|------------|
| `src/` | React, TypeScript, стили |
| `public/` | `index.html`, PWA manifest, service worker, иконки |
| `electron/` | Точка входа Electron |
| `scripts/` | Вспомогательные скрипты (генерация `app-icon.png` из SVG) |
| `.github/workflows/` | CI и релиз |

## Лицензия

MIT — см. файл [LICENSE](LICENSE).
