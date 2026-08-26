# Разговор 2026-08-26 — C++/C# модернизация SoundHub

## Участники
- scatter (владелец проекта)
- Claude (аналитик)
- Buffy (агент, текущая сессия)

## Контекст
SoundHub — маркетплейс звуковых ассетов для музыкантов.
- Backend: FastAPI + SQLAlchemy (Python 3.12)
- Frontend: React + TypeScript (Vite)
- Деплой: Cloud Run (GCP)
- GCS bucket: soundhub-assets-project-e9ee982d-db84-440b-ba1

## Итог разговора с Claude

### Что НЕ делать
- ❌ Полный rewrite backend на C++ — огромный объём работа, потеря существующего функционала
- ❌ C# для core backend — избыточно, неправильный инструмент для web API
- ❌ pythonnet/pybind11 для текущих Python-модулей — overkill

### Что ДЕЛАТЬ (точечная оптимизация)
- ✅ Оставить Python/FastAPI как продуктовый слой (API, auth, storage, workflow)
- ✅ Вынести CPU-bound аудио-операции в отдельный C++ worker
- ✅ C# рассмотреть только для Windows desktop companion (в будущем)

### Кандидаты на перенос в C++
| Модуль | Причина |
|--------|---------|
| Waveform generation | Большие WAV, millions of samples, intensity I/O + DSP |
| Loudness/true-peak/LUFS | CPU-heavy DSP, FFT на больших буферах |
| Preview транскодирование | Интеграция с FFmpeg/libsndfile |
| Audio fingerprinting | Низкие задержки, большая вычислительная нагрузка |
| ALP parsing (если >1GB) | Распаковка ZIP-архивов с сотнями файлов |
| Local DAW sync-agent | Надёжный доступ к файлам, watcher |

### Архитектура C++ worker
```
FastAPI API
  → создаёт ProcessingJob
  → очередь / worker dispatcher
  → soundhub-audio-engine (C++ container / binary)
  → object storage
  → JSON result
  → StorageObject.metadata_json
  → webhook: job.completed
```

### Первый этап (когда начнём)
1. Профилирование текущей Python-реализации
2. Выбор самого тяжёлого pipeline (вероятно waveform + audio analysis)
3. C++ worker как CLI-программа с JSON Lines
4. Python обёртка через subprocess с fallback
5. Бенчмарк и валидация

### Ожидаемые выигрыши (по оценке Claude)
- ALP parsing: 2-3x ускорение
- Loudness: 1.5-2x ускорение  
- Waveform: ~2x ускорение
- Общее время коммита: ~30-40% снижение

## Решение
**Завтра (2026-08-27) начать C++/C# модернизацию.**
Buffy будет заниматься шлифовкой существующего кода.

## Текущее состояние проекта (2026-08-26)

### Задеплоено
- Cloud Run: https://soundhub-xescefoxlq-uc.a.run.app
- Ревизия: soundhub-00035-dps
- Аккаунт buffy: buffy/buffy123
- Проект: TheForgebyHecq_r29189_v9.0 (871MB ALP файл)
- Download URL работает (GCS direct)

### Исправлено сегодня
1. `.gcloudignore`: `*.py` → `/*.py` (не исключал backend из Cloud Build)
2. `main.py`: SPA fallback + `init_db()` на startup
3. `storage.py`: proxy download endpoint
4. `gcs.py`: прямые GCS URL для скачивания
5. IAM: `roles/iam.serviceAccountTokenCreator` на compute SA
6. GCS bucket: `allUsers:objectViewer` для публичных скачиваний

### Коммиты
- `4ffd24a` fix(deploy): SPA fallback, GCS download, .gcloudignore fix
- `8870e4e` chore: update STATE.md
- `1315d9d` chore: remove old storage.py module
