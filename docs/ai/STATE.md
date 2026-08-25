# SoundHub — рабочее состояние

## Проект
- Репозиторий: `/home/scatter/SoundHub`
- Рабочий агент: `fcc-claude` через `fcc-server`
- Основная модель: MiMo 2.5
- Язык отчётов: русский

## Текущий фокус
- API contract guard: OpenAPI snapshot, diff и CI workflow.
- Следующий инфраструктурный шаг: достоверный auth inventory по зарегистрированным FastAPI routes.
- Не менять runtime auth/router behavior без отдельной задачи.

## Подтверждённые артефакты
- Генератор OpenAPI snapshot: `scripts/openapi_snapshot.py`.
- CI workflow: `.github/workflows/openapi-contract.yml`.
- Baseline: `openapi_baseline.json`.
- Diff-отчёт: `OPENAPI_DIFF.md`.

## Правила работы
- Сначала показать план и список файлов.
- Перед изменениями проверить `git status`.
- После изменений показать `git diff --check`, `git diff` и результаты релевантных тестов.
- Не делать commit, push, миграции, удаление файлов или изменения `.env` без явного разрешения.
- Любой security/API вывод подтверждать точными местами в коде и тестами.

## Последняя сессия
- Дата: 2026-08-25
- Проверены OpenAPI snapshot и CI gate.
- Следующий шаг: проверить абсолютные пути в `scripts/openapi_snapshot.py` и фактический запуск workflow на CI.
