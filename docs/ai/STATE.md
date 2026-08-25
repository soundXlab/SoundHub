# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Рабочий агент: `fcc-claude` через `fcc-server`
- Основная модель: MiMo 2.5
- Язык отчётов: русский

## Текущий фокус
- Telegram-бот (`openrouter-bot`) полностью работает.
- API contract guard: OpenAPI snapshot, diff и CI workflow.
- Следующий инфраструктурный шаг: достоверный auth inventory по зарегистрированным FastAPI routes.

## Подтверждённые артефакты
### OpenAPI / CI
- Генератор OpenAPI snapshot: `scripts/openapi_snapshot.py`.
- CI workflow: `.github/workflows/openapi-contract.yml`.
- Baseline: `openapi_baseline.json`.
- Diff-отчёт: `OPENAPI_DIFF.md`.

### Telegram-бот (`/home/scatter/openrouter-bot`)
- **Режим:** long-polling (getUpdates, timeout=60)
- **Конфликт в логах** — нормальное поведение при webhook overlap, бот retry'ится каждые 3 сек и работает
- **Команды:** /start, /help, /get_models, /set_model, /reset, /stats, /stop, /state
- **CLAUDE.md + STATE.md** загружаются в SystemPrompt через `config/config.go:loadProjectContext()`
- **Голос:** транскрипция через Vosk (`/home/scatter/.venvs/hf/bin/python3`)
- **Vision:** описание картинок через OpenRouter (gemini-2.0-flash-exp:free)
- **Системный промпт:** читает CLAUDE.md + STATE.md при старте
- **Баг исправлен:** `LANG=C.UTF-8` из системного окружения перезаписывал `lang: RU` из config.yaml через `viper.AutomaticEnv()`. Фикс: `readLangFromConfig()` + `godotenv.Load()` до viper.
- **Коммиты:**
  - `a8e558a` — webhook + project context + /state command
  - `09e59c2` — fix LANG override via viper.AutomaticEnv
- **Telegram webhook (порт 8443)** — настроен но не работает из-за WSL2 port forwarding. Оставлен polling.

### Проектная память
- `CLAUDE.md` — постоянные правила проекта (закоммичен `19672aa`)
- `docs/ai/STATE.md` — рабочая память сессий (этот файл)

### Voice Bot (`/home/scatter/SoundHub/voice_bot`)
- `buffy_watcher.py` — Python-версия бота (не используется, systemd buffy-watcher отключён)
- Добавлены: CLAUDE.md+STATE.md в system prompt, команда /state, обработка картинок по URL
- **Не использовать** — основной бот это `openrouter-bot` (Go)

## Правила работы
- Сначала показать план и список файлов.
- Перед изменениями проверить `git status`.
- После изменений показать `git diff --check`, `git diff` и результаты релевантных тестов.
- Не делать commit, push, миграции, удаление файлов или изменения `.env` без явного разрешения.
- Любой security/API вывод подтверждать точными местами в коде и тестами.
- Не трогать `.env` файлы — секреты и токены там хранятся.
- Основной Telegram-бот: `openrouter-bot` (Go). Python `voice_bot` — deprecated.

## Известные ограничения
- WSL2: входящие порты не работают без Windows port forwarding (`netsh interface portproxy`).
- Telegram webhook на порту 8443 — настроен, но Telegram не может достучаться из WSL2.
- Conflict в логах openrouter-bot — нормальное поведение, не мешает работе.
- Бесплатные модели OpenRouter иногда возвращают пустой ответ.

## Последняя сессия
- Дата: 2026-08-25
- Исправлен баг LANG=C.UTF-8 → теперь `Lang: RU`
- Добавлены CLAUDE.md + STATE.md в SystemPrompt бота
- Добавлена команда /state
- Бот отвечает в Telegram: подтверждено сообщением "Я Buffy — AI‑ассистент для разработки"
- Webhook (порт 8443) настроен но не работает — оставлен polling
- Python buffy-watcher отключён и удалён из автозапуска
- Следующий шаг: auth inventory по FastAPI routes.
