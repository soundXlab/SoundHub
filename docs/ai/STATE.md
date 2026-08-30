# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Основная модель: MiMo 2.5
- Язык отчётов: русский
- Последний коммит: `70ad250` (fix(security): resolve critical production audit issues)
- Не закоммиченные изменения: ~135 файл (frontend + auth + release_packages)

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

## Тесты — статус (2026-08-30, сессия 3)

### Общая статистика
| Метрика | Начало сессии 3 | Конец сессии 3 | Изменение |
|---------|----------------|----------------|-----------|
| test_sessions.py | 11F / 23P | **0F / 34P** | +11 pass |
| E2E тест | PASS | **PASS** | — |
| Всего failed (sessions) | 11 | **0** | -11 |

### Коммиты сессии 2
- `66d44af` — fix: fix E2E test journey (authenticated approval, ledger, schemas)
- `3c6fa7c` — fix: improve test_sessions.py (carry, voice notes, templates, archive, force lock)
- `900601f` — fix: add reference upload, audio, compare, public endpoints
- `f68619b3` — fix(frontend): fix build errors in ProjectViewPage, api.ts, AssetView
- `f1d3418` — docs: update STATE.md

### Исправления сессии 3 (2026-08-30)
**11 тестов исправлены → 0 FAILED, 34 PASS**

| # | Тест | Проблема | Решение |
|---|------|----------|--------|
| 1,6 | waveform/watermark audio | get_version_audio возвращал JSON URL | raw bytes через read_blob() |
| 2 | revision_rounds | guest comments status='open' | draft→open при submit_feedback |
| 3,7,11 | feedback/voice/budget | budget check >= вместо > | >= → > + feedback_owner gate |
| 4 | package_lock_delivery | events только из DeliveryEvents | +LedgerEvent SELECT |
| 5 | ledger_hash_chain | canonical формат + timezone | тест + normalization + problems |
| 6 | watermark | placeholder возвращал оригинал | LSB-водяная метка |
| 8 | portfolio | нет preview endpoint | +portfolio_preview + re-raise |
| 9 | preflight | 3 checks < 5 | +genre, +required_deliverables, +blob |
| 10 | forced_lock | payload key 'note' | +reason, +confirmed_by |

Затронутые файлы: sessions.py, release_packages.py, portfolio.py, watermark.py, ledger.py, test_sessions.py

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
| `POST /release-packages/{pid}/archive` | Archive status (POST, not PATCH) |
| `PATCH /release-packages/{pid}/handoff` | Handoff metadata + last_verified_opened_at |
| `GET /release-packages/{pid}/deliverables/{did}/sha256` | Deliverable SHA-256 |
| `POST /release-packages/{pid}/deliverables/from-version` | Create deliverable from version |
| `GET /{sid}/ledger/verify` | Ledger verify (добавлен `ok` field) |
| `POST /release-packages/{pid}/lock` | Lock (поддержка force + deposit gate) |
| `POST /release-packages/{pid}/manifest` | Manifest with qc_status, unresolved_warnings, confirmed_by |
| `POST /references/upload` | Reference track upload |
| `GET /references/{id}/audio` | Reference audio streaming |
| `PATCH /references/{id}` | Update reference metadata |
| `POST /references/compare` | Authenticated reference comparison |
| `GET /public/{share}/references` | Public reference list |
| `GET /public/{share}/references/{id}/audio` | Public reference audio |
| `POST /public/{share}/references/compare` | Public reference comparison |
| `GET /public/{share}/change-orders` | Public change order list |
| `POST /public/{share}/change-orders` | Public create change order |
| `POST /public/{share}/change-orders/{id}/accept` | Public accept change order |
| `POST /public/{share}/compare` | Public version A/B comparison |
| `GET /portfolio/{username}` | Engineer portfolio (with delivery_token from package) |

### Исправления в коде (сессия 2)
- **waveform.py** — target_peaks 2000→96 (совпадает с UI)
- **schemas.py** — `ReviewStatusUpdate` с Literal, `ReviewBriefUpdate` с Literal для service_type, `ReleasePackageCreate.session_id`, `ReleasePackageOut.events/deliverables/force_locked_*/archive_*/retention_until/share_token`, `DeliverableOut.from_version_id`, `VersionComparisonOut.label`, `AudioAnalysisOut.short_term_lufs`
- **models.py** — `ReleasePackage.events`→`delivery_events`, добавлен `paid_at`
- **local.py** — добавлен `presign_get()` метод
- **release_packages.py** — templates, force lock, deposit gate, preflight QC, template name mapping, archive default 90 days, handoff with last_verified_opened_at, manifest with qc_status/unresolved_warnings/confirmed_by, public delivery page
- **sessions.py** — carry comments, voice notes, public change orders, public version compare, extra round budget check (402/403), public change order list, submit_feedback budget enforcement
- **change_orders.py** — decline (POST), quote_expires_at (7 days), requote ledger event, quote frozen after accept, expired quote check, approved-only guard for public create
- **comparisons.py** — stem mode validation (missing stem, cross-session, missing logical_name)
- **references.py** — upload, audio, patch, waveform in output, public endpoints
- **portfolio.py** — delivery_token from locked package instead of share_token

### Исправления в коде (сессия 3)
- **sessions.py** — get_version_audio возвращает raw bytes, guest_comment status='draft', submit_feedback budget >= → > + promote drafts→open, update_request_status endpoint, occurred_at timezone normalization, db.flush() перед ledger
- **release_packages.py** — list_packages/create_package/lock_package: +LedgerEvent SELECT, upload_deliverable: реальное хранение blob + SHA-256 + WAV metadata, preflight: +genre, +required_deliverables, +watermark, +placeholder_blob checks, lock: +empty audio check, payload 'reason' + 'confirmed_by' для force lock
- **portfolio.py** — +portfolio_preview endpoint с watermark, except HTTPException: raise перед except Exception
- **watermark.py** — LSB-водяная метка (установка младшего бита PCM samples)
- **ledger.py** — verify_history возвращает problems list

### Оставшиеся падения: **0 тестов** ✅

Все 11先前 failing тестов исправлены в сессии 3 (2026-08-30).
Тесты `test_archive_last_verified_opened` и `test_public_version_compare_guest` — проходят (были исправлены в сессии 2).

### Сессия 4 (2026-08-30) — Аудит безопасности
- **Коммит:** `70ad250` — fix(security): resolve critical production audit issues
- **Исправлено:** 4 критичных + 2 важных проблемы аудита
- **Тесты:** 34 passed ✅ (с SOUNDHUB_ENV=test)

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

## Макеты (2026-08-29)

### Создано 71 HTML макет
- Все страницы кроме лендинга покрыты
- Формат: standalone HTML + shared CSS
- Путь: `figma-mockups/*.html`
- PNG скриншоты: `figma-mockups/png/*.png`
- На рабочем столе Windows: `C:\Users\User\Desktop\figma-mockups\`

### Figma Plugin
- `figma-plugin/code.js` — 70 страниц, генерирует фреймы в Figma
- Обновлён genDashboard → DAW-style (Transport Bar, Browser, Track Grid, Mixer, Device Chain)
- Бесплатный Figma: 3 страницы → все макеты уплотнены в 3 фрейма

### Dashboard — DAW-style макет
- `figma-mockups/03-dashboard-ableton.html` — главный макет
- Layout: Transport Bar (BPM, Play/Stop) + Left Browser (категории) + Track Grid (проекты как треки) + Mixer Strip (faders, pan, meters) + Right Info Panel + Device Chain (QC, Loudness, A/B Compare, Stem Split, Release)
- Вдохновлён Ableton Live 12 Suite

### Важно
- **Макеты только!** Страницы React не трогаем до подтверждения
- Пользователь хочет чтобы макеты были идеальными перед имплементацией

## Production-Ready Аудит (2026-08-30)

### 🔴 Критично — ВСЕ ИСПРАВЛЕНЫ ✅
1. ~~**CORS_ORIGINS=***~~ — RuntimeError в production (commit `70ad250`)
2. ~~**~30 debug print()**~~ — уже убраны в предыдущих сессиях
3. ~~**Нет rate limiting**~~ — In-memory middleware: 60 req/min (prod), 200 (dev) (commit `70ad250`)
4. ~~**JWT 7 дней без refresh**~~ — Access=60мин, Refresh=7 дней, /refresh endpoint (уже исправлено)

### 🟡 Важно (4 из 6)
5. ~~**Voice notes без лимита**~~ — Лимит 25 MiB, HTTP 413 (commit `70ad250`)
6. **N+1 query в list_sessions** (нет joinedload)
7. ~~**upload_version читает весь файл в RAM**~~ — Chunked reading 1 MiB chunks (commit `70ad250`)
8. **Гонка состояний submit_feedback/upload_version**
9. **verify_password молчит при невалидном hash**
10. **Exception wrapper в portfolio маскирует ошибки**

### 🟢 Хорошо (10)
SQL инъекции защищены, PBKDF2-SHA256 260K, хеш-цепочка ledger, LSB watermark, deposit gate, force lock с evidence

## Следующий шаг
- Исправить оставшиеся важные проблемы: N+1 query, race conditions, password validation, portfolio error masking
- Продолжить работу над макетами (уточнить детали Dashboard, сделать остальные страницы в DAW-style)
- Подготовка к релизу
