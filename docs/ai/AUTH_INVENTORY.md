# SoundHub — Auth Inventory

Сгенерировано: 2026-08-25
Всего эндпоинтов: 448 (46 open + 402 protected)

## Open (без auth) — 46

| Метод | Путь | Тег |
|-------|------|-----|
| POST | /api/auth/login | auth |
| POST | /api/auth/register | auth |
| POST | /api/auth/wallet/login | auth |
| POST | /api/auth/wallet/nonce | auth |
| GET | /api/auth/me | auth (ошибка в security: нет Depends) |
| GET | /api/demo/review | demo |
| GET | /api/sessions/public/{share_token} | review sessions |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/audio | review sessions |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/diff | review sessions |
| POST | /api/sessions/public/{share_token}/submit-feedback | review sessions |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/comments | review sessions |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/approvals | review sessions |
| GET | /api/sessions/public/{share_token}/requests/export | review sessions |
| GET | /api/release-packages/public/{delivery_token} | release packages |
| GET | /api/release-packages/public/{delivery_token}/download/{id} | release packages |
| GET | /api/portfolio | portfolio |
| GET | /api/portfolio/{username} | portfolio |
| GET | /api/assets | assets |
| GET | /api/assets/recommend | assets |
| GET | /api/assets/{id}/download | assets |
| GET | /api/assets/{id}/download64 | assets |
| GET | /api/assets/{id}/preview | assets |
| POST | /api/assets/{id}/receipt | assets |
| GET | /api/gists/{gid} | packages/gist |
| GET | /api/packages/{pkg_id} | packages |
| POST | /api/packages/{pkg_id}/download | packages |
| GET | /api/users/{username}/sponsors | sponsors |
| GET | /api/metadata/isrc/{isrc} | metadata |
| GET | /api/metadata/isrc/{isrc}/enrich | metadata |
| GET | /api/metadata/search | metadata |
| GET | /api/extensions | code search |
| GET | /api/unified-search/popular | search engine |
| GET | /api/unified-search/quick | search engine |
| GET | /api/unified-search/suggest | search engine |
| GET | /api/unified-search/{entity_type} | search engine |
| GET | /api/sessions/{id}/roles/presets | roles |
| GET | /api/projects/{pid}/commits/{cid}/checks | audio checks |
| POST | /api/projects/{pid}/commits/{cid}/checks | audio checks |
| POST | /api/projects/{pid}/commits/{cid}/checks/run | audio checks |
| GET | /api/integrations/events | integrations |
| POST | /api/2fa/validate | 2fa |
| GET | /api/ai/presets | ai mix |
| GET | /api/ai/quick-check | ai mix |
| POST | /graphql | graphql |
| GET | /graphql | graphql |
| GET | /api/graphql | workflows |

## Замечания по безопасности

1. **`/api/auth/me`** — помечен как protected в security schemes, но некоторые роуты используют `Depends(get_current_user)`, другие — нет. Проверить каждый роут вручную.
2. **`/api/assets/*`** — файлы доступны без auth. Если проект приватный, это может быть утечкой.
3. **`/api/projects/{pid}/commits/{cid}/checks/*`** — проверки аудио открыты без auth.
4. **`/api/extensions`** — список расширений открыты.
5. **GraphQL** (`/graphql`, `/api/graphql`) — полностью открыт.
