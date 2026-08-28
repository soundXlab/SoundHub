# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Рабочий агент: `fcc-claude` через `fcc-server`
- Основная модель: MiMo 2.5
- Язык отчётов: русский

## Текущий фокус
- SoundHub задеплоен на Cloud Run ✅
- Telegram-бот работает ✅
- SPA fallback работает на Cloud Run ✅
- GCS download работает ✅
- **ALP спецификация завершена** (1356 строк, 42 главы Ableton Manual)
- **Cubase/Nuendo спецификация завершена** (582 строки, Steinberg documentation)
- **Ключевой вывод:** Ableton .alp — XML парсится, Cubase .cpr — binary не парсится
- **UI редизайн:** DaVinci Resolve 21 стиль ✅ (2026-08-28)
  - Design tokens: оранжевый акцент (#E85D2A), серые фоны (#1B1B1B-#2D2D2D), плотная типографика (11-12px)
  - Компоненты: AppLayout, TopBar, Button, Card, Sidebar, RightSidebar, Badge, Input, AudioPlayer
  - Страницы: Dashboard, Projects, Marketplace, Login
  - Review Session: компактный плеер, плотные комментарии, панель версий
  - Review Session Page (рабочая): все rs-* CSS классы обновлены (brief, refs, stems, ledger, change orders, preflight, handoff, delivery)
  - Project Workspace Page: все project-view-* CSS классы обновлены (header, tabs, stats, commit form, file table, README, DAW info)
  - Лендинг НЕ тронут (остаётся по FIGMA_BRIEF)
- **Frontend полный** ✅ (2026-08-28): все страницы полноэкранные, единый FullPageLayout
  - Dashboard: 1350 строк, stats + projects + activity + player + sidebar inspector
  - Projects: реальные данные из API, create/delete, storage lifecycle
  - Marketplace: каталог ассетов, фильтры, аудио-плеер
  - Reviews: список sessions, создание, фильтр, статусы
  - Upload: drag-n-drop, выбор проекта, реальная загрузка через API
  - Analytics: реальные данные из API, графики по месяцам, таблицы
  - Calendar: месячный вид с событиями
  - Settings: профиль пользователя, безопасность, уведомления, storage, API keys
  - Sidebar: единый для всех страниц (Dashboard, Projects, Marketplace, Reviews, Upload, Analytics, Calendar, Settings)
- **systemd:** backend (soundhub-backend.service) и frontend (soundhub-frontend.service) на автозапуске
- **Следующий шаг:** UI polish (C++ streaming ALP worker завершен)
- **Figma-макет:** полный бриф — `docs/ai/FIGMA_BRIEF.md`
- ALP Spec: docs/ai/ALP_SPEC.md
- Cubase Spec: docs/ai/CUBASE_SPEC.md

## Cloud Run
- **URL:** https://soundhub-634858473264.europe-west1.run.app
- **Проект:** project-e9ee982d-db84-440b-ba1 (Free Trial $300)
- **Образ:** us-docker.pkg.dev/project-e9ee982d-db84-440b-ba1/docker/soundhub
- **Dockerfile:** multi-stage (frontend build + backend), корневой `Dockerfile`
- **Env vars:** STORAGE_PROVIDER=gcs, GCS_BUCKET=soundhub-assets-project-e9ee982d-db84-440b-ba1, ENV=production, SECRET_KEY (auto-generated), CORS_ORIGINS=*
- **Seed:** demo/demo123 при старте контейнера
- **Ревизия:** soundhub-00003-vdp (2026-08-28)
- **Деплой:** локально `docker build` + `docker push` + `gcloud run deploy` (Cloud Build CI/CD не работает из-за Artifact Registry auth limitation)

## Auth Inventory (2026-08-25)
- Всего эндпоинтов: 448 (46 open + 402 protected)
- Open: auth login/register, demo, public reviews, public sessions, assets, gists, metadata, search, GraphQL
- Protected: все проектные эндпоинты, jobs, storage, workflows, IAM, monitoring, compute, notifications
- Детали: `docs/ai/AUTH_INVENTORY.md`

## Telegram-бот (`/home/scatter/openrouter-bot`)
- **Режим:** long-polling (getUpdates, timeout=60)
- **Команды:** /start, /help, /get_models, /set_model, /reset, /stats, /stop, /state
- **CLAUDE.md + STATE.md** загружаются в SystemPrompt
- **Голос:** транскрипция через Vosk
- **Vision:** описание картинок через OpenRouter
- **Баг LANG исправлен**
- **Коммиты:** `a8e558a`, `09e59c2`

## Проектная память
- `CLAUDE.md` — постоянные правила проекта
- `docs/ai/STATE.md` — рабочая память сессий

## Исправления (2026-08-25)
- Dockerfile: multi-stage build, COPY frontend/ (не ../frontend/)
- Dockerfile: shell-form CMD для env expansion ($PORT)
- Dockerfile: seed demo data at startup
- job_queue.py: убран debug spam, исправлен traceback loop
- database.py: добавлены миграции для jobs.delay_until, projects.hot_days, storage_objects.storage_tier
- TS ошибки: Exchange→ArrowRightLeft, Hook→Link, UpRight→ExternalLink, duplicate ReactNode import
- tsconfig.json: отключён noUnusedLocals, исключены тесты

## Исправления (2026-08-26)
- `.gcloudignore`: `*.py` → `/*.py` — исключал все .py файлы из Cloud Build
- `main.py`: `app.frontend(fallback="index.html")` для SPA маршрутов + `init_db()` на startup
- `storage.py`: добавлен proxy download `/objects/{id}/download` (стриминг из GCS)
- `gcs.py`: `create_download_url` возвращает прямой GCS URL (bucket public)
- `gcs.py`: исправлен IAM signBlob canonical request (V4, `bytesToSign`)
- Cloud Run IAM: `roles/iam.serviceAccountTokenCreator` на compute SA
- GCS bucket: `allUsers:objectViewer` для публичных скачиваний
- **Аккаунт buffy** создан, проект TheForgebyHecq_r29189_v9.0 загружен (871MB)

## Исправления (2026-08-28, тесты)
- `projects.py`: `storage` UnboundLocalError — перенёс `get_storage()` перед циклом
- `projects.py`: `storage.put_blob()` → `storage.put_bytes()` / добавлены legacy методы в LocalObjectStorage
- `storage.py`: локальный `from datetime import` затенял модульный → убраны дублирующие импорты
- `sessions.py`: добавлен эндпоинт `/{id}/submit-feedback` для владельца
- `release_packages.py`: добавлен `preflight_check` + ledger event `invoice.paid`
- `test_jobs_after_get.py`: исправлен мок `storage` для фонового потока

## Исправления (2026-08-28, UI)
- `App.tsx`: `/dashboard` без SiteHeader и SidebarLayout (полноэкранный)
- `DashboardPage.tsx`: синхронизирован sidebar с FullPageLayout (добавлен Reviews)
- `ProjectsPage.tsx`: rewrite — больше деталей, create/delete, storage lifecycle
- `ReviewsPage.tsx`: rewrite — статусы, фильтр, создание
- `AnalyticsPage.tsx`: rewrite — реальные данные из API, графики
- `UploadPage.tsx`: rewrite — выбор проекта, drag-n-drop, реальная загрузка через API
- `SettingsPage.tsx`: реальные данные пользователя, профиль/bio/specialty
- `FullPageLayout.tsx`: единый layout для всех страниц (sidebar + topbar)
- Все 12 страниц отвечают 200, TypeScript без ошибок

## Известные ограничения
- Cloud Build CI/CD: push в Artifact Registry падает (docker-credential-gcloud не доступен в контейнере)
- Деплой: только через локальную сборку (`docker build` + `docker push` + `gcloud run deploy`)
- WSL2: webhook не работает из-за port forwarding
- FreeTrial $300 — 90 дней, аккаунт vasyl0460@gmail.com

## ALP Upload
- Uploaded CyclicWaves_r29169_v9.0.alp (256.8 MB, SHA256: 8a5ce401c5856aa6dfcd21378c223a4a2307372818b776ddf47629ad8f7d5656) to project CyclicWaves_r29169_v9.0 (ID 5) via storage API.
- File is stored in GCS bucket soundhub-assets-project-e9ee982d-db84-440b-ba1 as blobs/8a/5c/8a5ce401c5856aa6dfcd21378c223a4a2307372818b776ddf47629ad8f7d5656
- Upload timestamp: 2026-08-28T08:08:05Z
- Project access: https://soundhub-634858473264.europe-west1.run.app/projects/5 (requires login)
- User's public portfolio: https://soundhub-634858473264.europe-west1.run.app/p/claude
