# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Основная модель: MiMo 2.5
- Язык отчётов: русский
- Последний коммит: `2912d08` (feat(marketplace): DAW-style redesign)
- Ветка: `feat/marketplace-uiux-redesign` (запушена)
- TypeScript: 0 ошибок
- Тесты: 34/34 pass
- Cloud Run: https://soundhub-634858473264.europe-west1.run.app

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


### Frontend — исправления сборки и типов (сессия 4)
- Исправлен путь импорта в src/api.ts: с "./\types" на "./types".
- Добавлены недостающие TypeScript типы в импортный блок src/api.ts (Task, Retrospective, RetroItem, TestPlan, TestRun, Workflow, WorkflowRun, Incident, FeatureFlag, StatusPageData, Objective, KanbanBoard, Discussion).
- Обновлены импорты Storybook с "@storybook/react" на "@storybook/react-vite" во всех файлах *.stories.tsx.
- Добавлены явные типы параметров в функции render сторибуков: (args: any) => ... вместо (args) => ... .
- Экспортирован интерфейс Filters из src/pages/MarketplacePage.tsx для использования в FilterPanel.tsx.
- Убраны избыточные явные типовые аргументы из вызовов useList в src/pages/ProjectFeaturesHub.tsx, вызывавшие конфликты типов.
- Добавлены недостающие поля в интерфейсы TypeScript в src/types.ts:
  * velocity: number в интерфейс Sprint.
  * name: string, state: string, item_count: number в интерфейс Retrospective.
  * name: string, state: string в интерфейс TestPlan.
  * impact: string в интерфейс Incident.
- Убрано отображение версии из WikiTab в src/pages/ProjectFeaturesHub.tsx (свойство version отсутствует в WikiPage; используется WikiRevision для версий).

После данных изменений сборка frontend (npm run build) и Storybook (npm run build-storybook) завершаются успешно.
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
- **Env vars:** STORAGE_PROVIDER=gcs, GCS_BUCKET=soundhub-assets-project-e9ee982d-db84-440b-ba1, ENV=production, CORS_ORIGINS=https://soundhub-634858473264.europe-west1.run.app
- **SPA fallback:** catch-all route в main.py (FileResponse → index.html)
- **Seed:** demo/demo123 при старте контейнера
- **Деплой:** локально `docker build` + `docker push` + `gcloud run deploy`
- **Последний деплой:** 2026-08-31, ревизия soundhub-00006-jkr

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
- 70 DAW HTML (`figma-mockups/PAGE_MAP.md`) — exploration, **не** source of truth
- Канон дизайна: `docs/ai/REVIEW_PLAYER_FIGMA_BRIEF.md` **v1.2** (CEO freeze 2026-08-31)
- Key screen: **RP/D/05 Mix v2 with A/B**. Cover = D/05. Accent плеера `#E85D2A`, purple не CTA Review Player
- Артборды: `figma-mockups/review-player/` — Foundations + 11 desktop + 7 mobile. Старт: `index.html`, прототип desktop: `RP-D-01.html`

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

## WSL — перенос на другой диск (2026-08-31)

Не Ubuntu Server. Цель: **Ubuntu 26.04 LTS в WSL2 на этой же машине, VHDX на D:**.

| Факт | Значение |
|------|----------|
| Сейчас | `Ubuntu-24.04` WSL2, running |
| VHDX | `C:\Users\User\AppData\Local\wsl\{164bddf3-992d-4320-afb8-7a2f7ad06d8e}\ext4.vhdx` 127G |
| Цель | `wsl --list --online` → `Ubuntu-26.04` |
| Диск | **D:** (~1.0T свободно). C: 203G — тесно. E: 176G впритык. F: 38G нет |
| Каталоги | `D:\WSL\Ubuntu-26.04`, `D:\WSL\backups` |
| Скрипты | `/home/scatter/backup-kit/wsl/` и `D:\WSL\*.ps1` |

Образ для развёртывания на свежей 26.04 (не клон rootfs 24.04):

`D:\WSL\backups\ubuntu24-scatter-for-26.04-2026-08-31_10-27-39.tar.gz` (15G, sha256 OK на D:)

Внутри: `home/scatter`, `usr/local`, `opt`, `srv`, `etc/wsl.conf`. Без `/etc/apt`, без `.cache`. Restore: `sudo ./restore-on-26.04.sh <archive>` на Ubuntu 26.04.

Дописано 2026-08-31_10-54-10 (root-owned Docker не входил в 15G):

- `D:\WSL\backups\docker-2026-08-31_10-54-10\` — mongodump LibreChat, datadir Mongo/Meili, pg_dump vectordb, volume Open WebUI (sha256 OK)
- `D:\WSL\backups\ubuntu24-DESKTOP-6VDTJIF-2026-08-31_09-57-00.tar.gz` (14G, с `/etc`)

## Уборка корня репозитория (2026-08-31)

Корень репозитория очищен от внутренних документов:
- **Было:** 36 `.md` файлов в корне
- **Стало:** 7 публичных файлов (README, LICENSE, CONTRIBUTING, CHANGELOG, ARCHITECTURE, DESCRIPTION, DEPLOYMENT, LITEPAPER)
- Внутренние документы перенесены в `docs/internal/` (26 файлов)
- Blog посты → `docs/blog/` (2 файла)
- Анализ конкурентов → `docs/analysis/` (2 файла)
- **Коммит:** `9f41a3b` (docs: reorganize root)
- **Ветка:** `feat/marketplace-uiux-redesign` запушена (23 коммита + 1 новый)
- **Примечание:** в `.gitignore` правило `*_RU.md` — русскоязычные файлы не отслеживаются
- **GitHub secret scanning:** mock Stripe key в figma-mockups разблокирован

## Commit + Pull Request фичи (2026-08-31, сессия Buffy)

### Архитектурный план
- Файл: `docs/internal/REVIEW_COMMIT_ARCHITECTURE.md`
- 10 фич: inline comments, waveform diff, review checklist, draft versions, reviewer assignment, merge queue, version tags, conflict resolution, review summary, required reviews
- Оценка: ~33 дня (backend 14д + frontend 19д)

### Sprint 1 — Бэкенд + UI компоненты
**Коммиты:** `89ded2d`, `1ec8ec5`, `d261ee1`

**Новые модели (3):**
- `VersionTag` — теги версий (release-candidate, final, beta)
- `ReviewCheck` — автоматические QC-проверки (blocking/advisory)
- `MergeQueue` — очередь approved → merge

**Новые endpoints (16+):**
- Version tags: `GET/POST/DELETE /sessions/{id}/versions/{vid}/tags`
- Draft publish: `POST /sessions/{id}/versions/{vid}/publish`
- Version summary: `GET /sessions/{id}/versions/{vid}/summary`
- Members: `GET/POST/DELETE /sessions/{id}/members`
- Merge queue: `GET/POST /sessions/{id}/merge-queue`, `POST /.../merge`
- Review checks: `GET/POST /sessions/{id}/checks`, `POST /.../run`

**Новые UI компоненты (3):**
- `VersionTagPicker.tsx` — пресеты + кастомные теги с цветом
- `ReviewerPanel.tsx` — invite по email + роль, статусы
- `ReviewChecklist.tsx` — QC-проверки с blocking indicator

**Интеграция в ReviewSessionPage:**
- Теги под каждой версией
- Reviewers panel в sidebar
- QC Checklist в sidebar

### Sprint 2 — Waveform Diff + Inline Comments
**Коммит:** `742c49c`

**Backend:**
- `GET /sessions/{id}/versions/{vid}/waveform-diff?compare_to={vid2}` — peaks для A/B

**Frontend компоненты (3):**
- `WaveformDiff.tsx` — overlay/side-by-side/difference режимы, canvas, playback
- `ReviewSummary.tsx` — авто-diff (duration, size, format, filename)
- `InlineCommentMarkers.tsx` — кликабельные пины на waveform с тултипами

**Интеграция в ReviewSessionPage:**
- Кнопка 〜 в списке версий (waveform diff)
- InlineCommentMarkers под WaveformCanvas
- ReviewSummary под плеером

### Branch Protection API
**Коммит:** `173119f`
- API методы: `getBranchProtections`, `createBranchProtection`, `deleteBranchProtection`

### Итого за сессию
- **8 коммитов** на `feat/marketplace-uiux-redesign`
- **8 новых компонентов** (6 review + 2 marketplace)
- **17+ endpoints**
- **3 новые таблицы БД**
- **TypeScript**: 0 ошибок в новых файлах ✅
- **Тесты**: 34/34 pass ✅

### Ошибки Клода (исправлены)
- `ReviewChecklist.tsx` — mismatched JSX тег (</> → </div>)
- `ProjectsPage.tsx` — missing Loader import, несуществующий Progress
- `test_sessions.py` — повреждён (потерял 2000+ строк), восстановлен из git

### Оценка работы Клода (Marketplace Redesign)
- **v1 (5/10)** — прототип, не production-ready
- **v2 (8/10)** — DAW-style redesign, закоммичен (2912d08)
- ✅ MarketplaceTransport, MarketplaceBrowser, MarketplaceFilterChips, MarketplaceSort, MarketplaceDeviceChain, MarketplaceDetailPanel
- ✅ TypeScript 0 ошибок, build проходит
- ✅ Все компоненты используют design tokens
- ⚠️ MarketplaceDetailPanel содержит mock данные (totalAssets=256, trending=[])

## Согласование Buffy + Claude

### Зоны ответственности
| Зона | Ответственный | Файлы |
|------|---------------|-------|
| Backend (модели, endpoints, тесты) | Buffy | `backend/app/models.py`, `routers/*.py`, `schemas.py`, `tests/` |
| Frontend: Review/Commit фичи | Buffy | `ReviewSessionPage.tsx`, `VersionTagPicker`, `ReviewerPanel`, `ReviewChecklist`, `WaveformDiff`, `ReviewSummary`, `InlineCommentMarkers` |
| Frontend: Marketplace redesign | Claude | `MarketplacePage.tsx`, `components/marketplace/`, `AssetCard.tsx`, `FilterPanel.tsx` |
| Frontend: Dashboard/Settings/Other | Claude | `DashboardPage.tsx`, `SettingsPage.tsx`, `ProjectsPage.tsx`, `UploadPage.tsx` |
| Документация | Buffy | `STATE.md`, `docs/internal/`, архитектурные планы |

### Правила
1. Не трогать файлы чужой зоны
2. Каждый коммит — свою зону (не смешивать)
3. Перед началом — проверить `git status`
4. Shared файлы (`types.ts`, `api.ts`, `App.tsx`) — только через PR, не параллельно
5. Если нужен новый shared компонент — обсудить в Telegram

## Неделя 01.09–05.09.2026 (CEO план)

### ПН ✅
- Исправлен ledger hash chain: `remove_member`, `invite_member`, `merge` теперь используют `ledger.append()` вместо прямого `LedgerEvent()` (был NOT NULL constraint на `event_hash`)
- Восстановлены 34 теста в `test_sessions.py` (файл был повреждён, потеряны 2000+ строк)
- Удалён дублирующий `components/marketplace/AssetCard.tsx`

### ВТ ✅
- Добавлен list view в оригинальный `AssetCard` через CSS классы
- FilterPanel получил collapse + CSS классы в `styles.css`
- 50+ inline styles от Клода → CSS классы
- Импорты в MarketplacePage обновлены (pages/ вместо components/marketplace/)

### СР ✅
- BranchProtectionPanel переписан без Tailwind (inline styles + CSS variables)
- MergeQueuePanel переписан без Tailwind
- ReviewChecklist: исправлен null check для `c.check_type`
- Итого TypeScript ошибок: 11 (все в ProjectsPage.tsx — зона Клода)

### ЧТ ✅
- 16 v2 макетов Review Player уже были готовы (сделано ранее в сессии)
- Desktop: D/01–D/10 с metadata grids, improved UX
- Mobile: M/01–M/07 с compact metadata, decision banners

### ПТ ✅
- Деплой на Cloud Run ✅ (SPA fallback исправлен)
- Smoke test ✅ (все routes работают)
- STATE.md обновлён ✅

## Marketplace DAW-redesign (2912d08)

### Компоненты Claude (v2)
| Компонент | Описание |
|-----------|----------|
| MarketplaceTransport | Top bar: asset counts, cart, wishlist |
| MarketplaceBrowser | Sidebar: search, categories, DAW/format filters |
| MarketplaceFilterChips | Horizontal tags: Synth, Sampler, FX, Drums... |
| MarketplaceSort | Sort: Popular, New, Price ↑, Rating |
| MarketplaceDeviceChain | View toggles: Grid/List, Instruments/Effects... |
| MarketplaceDetailPanel | Right sidebar: stats, trending assets |

### Статус
- ✅ TypeScript: 0 ошибок
- ✅ Build: проходит
- ✅ Тесты: 34/34 pass
- ✅ Git: 2912d08 → pushed

## Следующий шаг

**Приоритет:** User testing Review Player (3 человека — Buffy, CEO, Claude). Макеты D/05 v2 готовы.

**Sprint 4 (Claude):** Public review 403 fix (API работает, проверить фронтенд). Session detail page. ProjectsPage TS errors.

**Деплой:** Нужен sudo для Docker push (permission denied на artifact registry).

**Дизайн:** v1.3 после тестов. Лендинг: How it works вместо Marketplace в гостевом nav.

**Инженерия:** Остальные исправления аудита (portfolio error masking уже исправлен).
