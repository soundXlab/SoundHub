# SoundHub — Полная карта страниц

> **CEO 2026-08-31:** этот файл — exploration HTML, **не** source of truth.
> Канон: [`docs/ai/REVIEW_PLAYER_FIGMA_BRIEF.md`](../docs/ai/REVIEW_PLAYER_FIGMA_BRIEF.md) v1.2.
> Не развивать остальные DAW-страницы, пока Review Player не пройдёт 3 пользовательских теста.

## Статус: ✅ = HTML готов, ❌ = не сделано

---

## PUBLIC (маркетинг)

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| P01 | Landing | ✅ (старый SVG) | Hero, features, pricing, CTA, footer |
| P02 | Sign In | ✅ | Email/wallet auth |
| P03 | Sign Up | ✅ | Регистрация + email verify |
| P04 | Forgot Password | ✅ | Сброс пароля |
| P05 | Pricing | ✅ | 3 тира, FAQ |
| P06 | Docs / Guide | ✅ | Документация |
| P07 | Changelog | ✅ | История обновлений |
| P08 | Blog | ✅ | Блог/новости |
| P09 | Careers | ✅ | Вакансии |
| P10 | About | ✅ | О компании |
| P11 | Contact | ✅ | Контактная форма |
| P12 | Terms of Service | ✅ | Условия использования |
| P13 | Privacy Policy | ✅ | Политика конфиденциальности |

## APP — Dashboard & Navigation

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A01 | Dashboard | ✅ | Stats, projects, activity |
| A02 | Search Results | ✅ | Глобальный поиск — `A02-search-results.html` |
| A03 | Keyboard Shortcuts | ✅ | Справочник шорткатов — `A03-keyboard-shortcuts.html` |

## APP — Projects

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A04 | Projects List | ✅ | Grid/list, фильтры |
| A05 | New Project Modal | ✅ | Создание проекта — `A05-new-project-modal.html` |
| A06 | Project Overview | ✅ | Tabs, waveform, meta |
| A07 | Versions & Branches | ✅ | Timeline, branch tree |
| A08 | Files | ✅ | File table |
| A09 | Project Settings | ✅ | Name, description, delete — `A09-project-settings.html` |
| A10 | Project Activity Log | ✅ | Полная история — `A10-project-activity.html` |

## APP — Reviews & Feedback

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A11 | Reviews List | ✅ | Sessions with status |
| A12 | Review + Audio Player | ✅ | Waveform, comments |
| A13 | A/B Compare | ✅ | Dual waveforms |
| A14 | Create Review Modal | ✅ | Выбор версии + рецензентов — `A14-create-review-modal.html` |
| A15 | Review Settings | ✅ | Настройки раундов — `A15-review-settings.html` |
| A16 | Public Review (guest) | ✅ | Без авторизации — `A16-public-review-guest.html` |
| A17 | Approval Confirmation | ✅ | Статус approve/decline — `A17-approval-confirmation.html` |

## APP — Upload & Publish

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A18 | Upload | ✅ | Drag-drop, processing |
| A19 | Publish to Marketplace | ✅ | Listing creation |
| A20 | Upload History | ✅ | Все загрузки — `A20-upload-history.html` |
| A21 | DAW Import Status | ✅ | Парсинг .als/.flp — `A21-daw-import-status.html` |

## APP — Audio CI

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A22 | Audio CI Report | ✅ | Loudness, peak, metadata |
| A23 | Audio CI History | ✅ | История анализов — `A23-audio-ci-history.html` |
| A24 | Audio CI Settings | ✅ | Пороги, правила — `A24-audio-ci-settings.html` |

## APP — Marketplace (logged-in)

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A25 | Marketplace | ✅ (DAW) | Каталог, фильтры — `18-marketplace-daw.html` |
| A26 | Asset Detail | ✅ (DAW) | Player, metadata, license — `22-asset-detail-daw.html` |
| A27 | My Listings | ✅ (DAW) | Мои ассеты на маркетплейсе — `40-my-listings-daw.html` |
| A28 | Sales Dashboard | ✅ (DAW) | Продажи, доходы — `41-sales-dashboard-daw.html` |
| A29 | Payouts | ✅ (DAW) | Выплаты, история — `46-payouts-daw.html` |
| A30 | Download History | ✅ (DAW) | История скачиваний — `47-download-history-daw.html` |
| A31 | Wishlist / Saved | ✅ (DAW) | Сохранённые ассеты — `48-wishlist-daw.html` |
| A32 | Creator Profile (public) | ✅ | Публичный профиль |

## APP — Collaboration

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A33 | Collaborators | ✅ | Invite, roles |
| A34 | Notifications | ✅ | Activity feed |
| A35 | Messages / Chat | ✅ | Conversations |
| A36 | Activity Feed (global) | ✅ | Вся активность — `A36-activity-feed-global.html` |
| A37 | Share Link Settings | ✅ | Настройки публичных ссылок — `A37-share-link-settings.html` |

## APP — Sessions (reviews+delivery)

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A38 | Sessions List | ✅ (DAW) | Все сессии — `35-sessions-list-daw.html` |
| A39 | Session Detail | ✅ (DAW) | Версии, комментарии — `24-session-detail-daw.html` |
| A40 | Release Package | ✅ (DAW) | Сборка релиза — `27-release-package-daw.html` |
| A41 | Delivery Link (public) | ✅ (DAW) | Скачивание для клиента — `36-delivery-link-daw.html` |

## APP — Settings & Account

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A42 | Settings | ✅ (DAW) | Profile, notifications, API — `20-settings-daw.html` |
| A43 | Profile / Portfolio | ✅ | Avatar, stats, tracks |
| A44 | Billing & Plans | ✅ (DAW) | Подписка, invoice, методы оплаты — `37-billing-daw.html` |
| A45 | Storage Management | ✅ (DAW) | Использование, лимиты — `38-storage-daw.html` |
| A46 | API Keys | ✅ (DAW) | Управление ключами — `39-api-keys-daw.html` |
| A47 | Security | ✅ (DAW) | 2FA, сессии, пароль — `42-security-daw.html` |
| A48 | Connected Accounts | ✅ (DAW) | Wallet, Discord, Google — `43-connected-accounts-daw.html` |
| A49 | Email Preferences | ✅ (DAW) | Тонкая настройка уведомлений — `44-email-prefs-daw.html` |
| A50 | Danger Zone | ✅ (DAW) | Удаление аккаунта — `45-danger-zone-daw.html` |

## APP — Analytics

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A51 | Analytics Overview | ✅ | Графики, метрики — `A50-analytics.html` |
| A52 | Project Analytics | ✅ | Статистика проекта — `A52-project-analytics.html` |
| A53 | Asset Analytics | ✅ | Прослушивания, скачивания — `A53-asset-analytics.html` |

## APP — Calendar & Scheduling

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A54 | Calendar | ✅ | Дедлайны, события — `A54-calendar.html` |
| A55 | Deadlines & Milestones | ✅ | Таймлайн проекта — `A55-deadlines-milestones.html` |

## DAW Integration

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| A56 | DAW Plugin Config | ✅ | Max4Live, REAPER настройки — `A56-daw-plugin-config.html` |
| A57 | CLI Reference | ✅ | snd команды — `A57-cli-reference.html` |
| A58 | VST Instruments Catalog | ✅ | Каталог VST-инструментов — `A58-vst-instruments-catalog.html` |
| A59 | VST Instrument Detail | ✅ | Страница инструмента — `A59-vst-detail.html` |
| A60 | Preset Browser | ✅ | Браузер пресетов — `A60-preset-browser.html` |
| A61 | VST Compare | ✅ | Сравнение инструментов — `A61-vst-compare.html` |

## Admin (если нужен)

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| B01 | Admin Dashboard | ✅ | Обзор платформы — `B01-admin-dashboard.html` |
| B02 | User Management | ✅ | Пользователи — `B02-admin-users.html` |
| B03 | Content Moderation | ✅ | Модерация ассетов — `B03-admin-moderation.html` |
| B04 | Revenue Reports | ✅ | Финансы — `B04-admin-revenue.html` |
| B05 | System Health | ✅ | Мониторинг — `B05-admin-health.html` |

## Mobile (390px)

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| M01 | Mobile Login | ✅ | |
| M02 | Mobile Dashboard | ✅ | |
| M03 | Mobile Marketplace | ✅ | |
| M04 | Mobile Projects | ✅ | `M04-mobile-projects.html` |
| M05 | Mobile Review | ✅ | `M05-mobile-review.html` |
| M06 | Mobile Upload | ✅ | `M06-mobile-upload.html` |
| M07 | Mobile Settings | ✅ | `M07-mobile-settings.html` |
| M08 | Mobile Messages | ✅ | `M08-mobile-messages.html` |

## Special States

| # | Страница | Статус | Описание |
|---|----------|--------|----------|
| S01 | Empty States | ✅ | 6 вариантов |
| S02 | Error States | ✅ | 6 ошибок + toasts |
| S03 | Loading / Skeleton | ✅ (DAW) | Анимации загрузки — `49-loading-daw.html` |
| S04 | Onboarding Flow | ✅ (DAW) | Онбординг нового юзера — `50-onboarding-daw.html` |
| S05 | Maintenance | ✅ (DAW) | Технические работы — `51-maintenance-daw.html` |
| S06 | Rate Limited | ✅ (DAW) | 429 страница — `52-rate-limited-daw.html` |

---

## ИТОГО

| Категория | Всего | Готово | Осталось |
|-----------|-------|--------|----------|
| Public | 13 | 13 | 0 |
| App — Core | 37 | 37 | 0 |
| App — Settings | 9 | 9 | 0 |
| App — Analytics | 3 | 1 | 2 |
| App — Calendar | 2 | 2 | 0 |
| DAW Integration | 2 | 2 | 0 |
| Admin | 5 | 5 | 0 |
| Mobile | 8 | 8 | 0 |
| Special States | 6 | 6 | 0 |
| **TOTAL** | **89** | **89** | **0** |

Все страницы покрыты макетами ✅
