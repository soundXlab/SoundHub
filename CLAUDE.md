# SoundHub — правила проекта

## Что такое SoundHub

SoundHub — маркетплейс звуковых ассетов для музыкантов. Платформа включает:
- **Backend**: FastAPI + SQLAlchemy (Python 3.12), SQLite/PostgreSQL
- **Frontend**: React + TypeScript (Vite)
- **Смарт-контракты**: Solidity (Hardhat), Base Sepolia
- **DAW-интеграция**: Max for Live (Ableton), FL Studio, REAPER
- **CLI**: `snd` — push/pull/project management
- **Cloud-фичи**: фоновая обработка, мониторинг, API Gateway, IAM, уведомления

## Основные каталоги

| Каталог | Назначение |
|---------|-----------|
| `backend/` | FastAPI-приложение, роутеры, сервисы, тесты |
| `frontend/` | React-приложение (Vite) |
| `contracts/` | Solidity смарт-контракты (Hardhat) |
| `m4l/` | Max for Live устройство для Ableton |
| `scripts/` | Утилиты: OpenAPI snapshot, auth inventory |
| `reaper/` | REAPER-интеграция (ReaScript Lua) |
| `docs/` | Документация, whitepaper, аудит |

## Стек

- Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2
- Node 20, React 18, TypeScript, Vite
- Solidity 0.8, Hardhat, ethers.js v6
- SQLite (dev), PostgreSQL (prod)
- GitHub Actions (CI)

## Обязательные тесты

Перед коммитом:
```bash
cd backend && python -m pytest tests/ -x -q
```

## Правила Git

- Ветка `main` — стабильная
- Коммиты: conventional commits (`feat:`, `fix:`, `chore:`, и т.д.)
- Не делать `git push` без явного разрешения
- Не делать `git rebase` на общей ветке без разрешения

## Язык отчётов

Русский язык для всех отчётов, комментариев к PR и документации.

## Запреты

- ❌ Не трогать `.env`, секреты, production-data без явного указания
- ❌ Не коммитить токены, пароли, приватные ключи
- ❌ Не делать deploy без разрешения
- ❌ Не удалять файлы без подтверждения

## Рабочий контекст

Перед началом существенной работы:
1. Прочитай `docs/ai/STATE.md`.
2. Проверь `git status`.
3. Сначала покажи план и дождись подтверждения перед изменениями.

В конце существенной задачи:
1. Обнови `docs/ai/STATE.md` только проверенными фактами.
2. Не записывай секреты, токены, содержимое `.env` или персональные данные.
3. Покажи diff STATE.md.
4. Не делай commit/push без явного разрешения.
