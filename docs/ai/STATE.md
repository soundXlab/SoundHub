# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Рабочий агент: `fcc-claude` через `fcc-server`
- Основная модель: MiMo 2.5
- Язык отчётов: русский

## Текущий фокус
- SoundHub задеплоен на Cloud Run ✅
- Telegram-бот работает ✅
- Следующий шаг: рефакторинг / новые фичи

## Cloud Run
- **URL:** https://soundhub-xescefoxlq-uc.a.run.app (и https://soundhub-634858473264.us-central1.run.app)
- **Проект:** project-e9ee982d-db84-440b-ba1 (Free Trial $300)
- **Образ:** us-docker.pkg.dev/project-e9ee982d-db84-440b-ba1/docker/soundhub
- **Dockerfile:** multi-stage (frontend build + backend), корневой `Dockerfile`
- **Env vars:** STORAGE_PROVIDER=gcs, GCS_BUCKET=soundhub-assets-project-e9ee982d-db84-440b-ba1, ENV=production, SECRET_KEY (auto-generated), CORS_ORIGINS=*
- **Seed:** demo/demo123 при старте контейнера
- **Ревизия:** soundhub-00008-rdh (2026-08-25)
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

## Исправления今天 (2026-08-25)
- Dockerfile: multi-stage build, COPY frontend/ (не ../frontend/)
- Dockerfile: shell-form CMD для env expansion ($PORT)
- Dockerfile: seed demo data at startup
- job_queue.py: убран debug spam, исправлен traceback loop
- database.py: добавлены миграции для jobs.delay_until, projects.hot_days, storage_objects.storage_tier
- TS ошибки: Exchange→ArrowRightLeft, Hook→Link, UpRight→ExternalLink, duplicate ReactNode import
- tsconfig.json: отключён noUnusedLocals, исключены тесты

## Известные ограничения
- Cloud Build CI/CD: push в Artifact Registry падает (docker-credential-gcloud не доступен в контейнере)
- Деплой: только через локальную сборку (`docker build` + `docker push` + `gcloud run deploy`)
- WSL2: webhook не работает из-за port forwarding
- FreeTrial $300 — 90 дней, аккаунт vasyl0460@gmail.com
