# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Основная модель: MiMo 2.5
- Язык отчётов: русский
- Последний коммит: `3c6fa7c` (fix: improve test_sessions.py — add missing endpoints and fix schemas)

## Текущий фокус
- SoundHub задеплоен на Cloud Run ✅
- Telegram-бот работает ✅
- SPA fallback работает на Cloud Run ✅
- GCS download работает ✅
- **ALP спецификация завершена** (1356 строк, 42 главы Ableton Manual)
- **Cubase/Nuendo спецификация завершена** (582 строки, Steinberg documentation)
- **Ключевой вывод:** Ableton .alp — XML парсится, Cubase .cpr — binary не парсится
- **C++ streaming ALP worker** ✅ (commit `697b7cb`)
- **PROJECT-AWARE SOUND LIBRARY** ✅ (vertical slice implementation complete, verified)

## Тесты — статус (2026-08-29)

### Общая статистика
| Метрика | До сессии | После сессии | Изменение |
|---------|-----------|-------------|-----------|
| E2E тест | FAIL | **PASS** | +1 |
| test_sessions.py | 30F / 5P | **26F / 8P** | +3 pass |
| Всего failed | 91 | **86** | -5 |

### Коммиты сессии
- `66d44af` — fix: fix E2E test journey (authenticated approval, ledger, schemas)
- `3c6fa7c` — fix: improve test_sessions.py (carry, voice notes, templates, archive, force lock)

### Добавленные эндпоинты (сессия 2026-08-29)
| Эндпоинт | Описание |
|----------|----------|
| `POST /{sid}/versions/{vid}/approvals` | Authenticated approval |
| `POST /{sid}/versions/{vid}/carry` | Carry unresolved comments to next version |
| `POST /{sid}/versions/{vid}/comments/voice` | Voice note (owner) |
| `GET /{sid}/versions/{vid}/comments/{cid}/voice` | Stream voice comment audio (owner) |
| `POST /public/{share}/versions/{vid}/comments/voice` | Voice note (guest) |
| `GET /public/{share}/versions/{vid}/comments/{cid}/voice` | Stream voice comment audio (guest) |
| `POST /{pid}/preflight` | QC preflight with template checks |
| `GET /release-packages/templates` | Template catalog |
| `PATCH /release-packages/{pid}/archive` | Archive status update |
| `PATCH /release-packages/{pid}/handoff` | Handoff metadata |
| `GET /release-packages/{pid}/deliverables/{did}/sha256` | Deliverable SHA-256 |
| `GET /{sid}/ledger/verify` | Ledger verify (добавлен `ok` field) |

### Исправления в коде
- **waveform.py** — target_peaks 2000→96 (совпадает с UI)
- **schemas.py** — `ReviewStatusUpdate` с Literal validation, `ReleasePackageCreate.session_id`, `ReleasePackageOut.events/deliverables`
- **models.py** — `ReleasePackage.events`→`delivery_events`, добавлен `paid_at`
- **local.py** — добавлен `presign_get()` метод
- **release_packages.py** — templates, force lock, preflight с template checks, template name mapping

### Оставшиеся падения (26 тестов)
Требуют полноценных фич — не баги:
- reference upload/URL endpoints
- loudness analysis (pending→done)
- comparison engine
- stem comparison
- change orders flow (courtesy/decline)
- deposit gate (402 status)
- watermark preview
- brief schema compatibility
- engineer portfolio
- public version compare

## Frontend — полный редизайн ✅

### Дизайн-система
- Обновлены дизайн-токены (цвета, отступы, радиусы, тени, типографика, компоненты, layout) для светлой и тёмной темы, вдохновлённые DaVinci Resolve 21.
- Исправлен ThemeContext.ts для корректной работы с Storybook (использование React.createElement вместо JSX для предотвращения ошибок парсинга).
- Добавлена поддержка переключения темы через хук useTheme и контекст.
- Обновлён компонент AssetCard для использования дизайн-токенов и темы, а также добавлены истории в Storybook для состояний Grid, List, Playing.
- Добавлены типы TypeScript для новых функциональностей (Вики, Спринты, Ретроспективы, Тестовые планы) и обновлены соответствующие эндпоинты в api.ts для уменьшения использования any.

### Архитектура
- **FullPageLayout** — единый layout для всех авторизованных страниц (sidebar + topbar)
- **App.tsx** — SiteHeader скрыт для full-page routes, SidebarLayout убан
- **Sidebar** — единый для всех страниц (Dashboard, Projects, Marketplace, Reviews, Upload, Analytics, Calendar, Settings)
- **TopBar** — поиск, уведомления, профиль пользователя
- **Design tokens** — DaVinci Resolve 21 стиль (оранжевый #E85D2A, серые фоны)

### Страницы (11/11 работают, TypeScript 0 ошибок)

| Страница | Роут | Строк | Данные | Описание |
|----------|------|-------|--------|----------|
| **Dashboard** | `/dashboard` | ~270 | API | Welcome hero, stats cards (4), projects list, active reviews, quick actions, timeline, system status |
| **Projects** | `/projects` | ~207 | API | Карточки проектов, create/delete, storage lifecycle, пустое состояние |
| **Marketplace** | `/market` | ~823 | API | Каталог ассетов, фильтры, аудио-плеер |
| **Reviews** | `/reviews` | ~215 | API | Список sessions, статусы, фильтр, создание |
| **Upload** | `/upload` | ~278 | API | Выбор проекта, drag-n-drop, реальная загрузка через `api.createCommit()` |
| **Analytics** | `/analytics` | ~572 | API | Графики по месяцам, waveform, LUFS, таблицы projects/sessions |
| **Calendar** | `/calendar` | ~433 | API | Месячный вид, события из sessions/projects, навигация, quick links |
| **Settings** | `/settings` | ~865 | API | 8 секций: Profile, Appearance, Security, Notifications, Billing, Storage, API Keys, Danger Zone |
| **Login** | `/login` | ~180 | — | Центрированная карточка, wallet + form auth |
| **Docs/Kettle** | `/docs`, `/kettle` | ~200 | — | Документация, glossary |
| **Project View** | `/projects/:id` | ~350 | API | Project overview, assets tab with project-aware sound library, branches, commits |

### UI компоненты (обновлены)
- **Button** — добавлен вариант `outline`
- **Badge** — добавлены `style`, `className`, варианты `secondary`/`ghost`
- **Input** — поддержка `helperText`, `leftIcon`, `rightIcon`
- **Card** — CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Sidebar** — SidebarNavItem, SidebarSection, SidebarDivider

## Backend
- FastAPI + SQLAlchemy (Python 3.12)
- systemd: `soundhub-backend.service` на автозапуске (порт 8000)
- Seed: demo/demo123
- ~500+ эндпоинтов

## Frontend Dev Server
- Vite dev server на порту 5173
- systemd: `soundhub-frontend.service` на автозапуске
- Proxy: `/api/*` → `http://127.0.0.1:8000`

## Cloud Run
- **URL:** https://soundhub-634858473264.europe-west1.run.app
- **Проект:** project-e9ee982d-db84-440b-ba1 (Free Trial $300)
- **Образ:** us-docker.pkg.dev/project-e9ee982d-db84-440b-ba1/docker/soundhub
- **Dockerfile:** multi-stage (frontend build + backend), корневой `Dockerfile`
- **Env vars:** STORAGE_PROVIDER=gcs, GCS_BUCKET=soundhub-assets-project-e9ee982d-db84-440b-ba1, ENV=production, SECRET_KEY (auto-generated), CORS_ORIGINS=*
- **Seed:** demo/demo123 при старте контейнера
- **Деплой:** локально `docker build` + `docker push` + `gcloud run deploy`

## Auth Inventory (2026-08-29)
- Всего эндпоинтов: 500+
- Open: auth login/register, demo, public reviews, public sessions, assets, gists, metadata, search, GraphQL, templates
- Protected: все проектные эндпоинты, jobs, storage, workflows, IAM, monitoring, compute, notifications, project asset management, project-aware sound library endpoints
- Детали: `docs/ai/AUTH_INVENTORY.md`

## Telegram-бот (`/home/scatter/openrouter-bot`)
- **Режим:** long-polling (getUpdates, timeout=60)
- **Команды:** /start, /help, /get_models, /set_model, /reset, /stats, /stop, /state
- **CLAUDE.md + STATE.md** загружаются в SystemPrompt
- **Голос:** транскрипция через Vosk
- **Vision:** описание картинок через OpenRouter

## Telegram-отчёты
- Все отчёты отправляются в Telegram через `python voice_bot/send_buffy.py`
- Chat ID: 748628857
- Записано в CLAUDE.md как постоянная инструкция

## ALP Upload
- Uploaded CyclicWaves_r29169_v9.0.alp (256.8 MB) to project ID 5
- File stored in GCS bucket
- Project access: https://soundhub-634858473264.europe-west1.run.app/projects/5

## Следующий шаг
- Исправить оставшиеся 26 тестов в test_sessions.py (reference, loudness, comparison, change orders)
- Мониторинг продакшена и сбор обратной связи по PROJECT-AWARE SOUND LIBRARY
- Подготовка к аудиту безопасности и подготовке к основному релизу
