# Sprint 5 — План на неделю 08.09–12.09.2026

## Приоритеты

### ПН — User Testing Review Player
- Провести тестирование с 3 участниками (Buffy, Scatter, Claude)
- Сценарии: создание сессии, публичная ссылка, A/B сравнение, approve, ledger
- Метрики: время на шаг, ошибки, NPS, UX комментарии
- Результаты: отчёт в Telegram + обновление STATE.md

### ВТ — Деплой на Cloud Run
- Нужен sudo для Docker push (permission denied на artifact registry)
- Проверить SPA fallback работает корректно
- Smoke test: все routes, API endpoints, аудио streaming

### СР — DAW Integration (Max for Live)
- Claude: доработать M4L пуш-кнопку (snd push --audio master.wav)
- Buffy: проверить backend endpoints для M4L
- Тест: отправка из Ableton → review session → публичная ссылка

### Чт — Payment Integration (Stripe)
- Claude: интегрировать Stripe checkout для paid revisions
- Buffy: проверить deposit gate, extra round pricing
- Тест: создание сессии → оплата → доступ к версиям

### Пт — Analytics Dashboard
- Claude: дашборд с метриками (views, comments, approvals, revenue)
- Buffy: проверить API endpoints для аналитики
- Тест: отображение данных в реальном времени

## Ресурсы
- Buffy: backend, тесты, деплой, ревью
- Claude: frontend, DAW integration, payment, analytics
- Scatter: user testing, принятие решений

## Риски
- Docker push требует sudo (нужно настроить artifact registry permissions)
- Stripe требует API ключ (нужно получить в Stripe Dashboard)
- M4L требует Ableton Live (нужно установить для тестирования)
