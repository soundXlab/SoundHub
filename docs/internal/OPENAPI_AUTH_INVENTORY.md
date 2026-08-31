# OpenAPI Auth Inventory Report
Generated at: 2026-08-25T06:33:42.350161
Total routes analyzed: 452
Mutating routes (POST, PUT, PATCH, DELETE): 255

## Executive Summary
- **authenticated**: 402
- **public-none**: 41
- **public-token**: 9

### Mutating Endpoints Summary
- **authenticated**: 243
- **public-none**: 9
- **public-token**: 3

## Public-None and Public-Token Operations
| Method | Path | Auth Class | Reason | Tags | Summary |
|--------|------|------------|--------|------|---------|
| GET | / | public-none | No authentication indicators detected |  | Docs Home |
| POST | /api/2fa/validate | public-none | No authentication indicators detected | 2fa | Validate 2Fa Code |
| GET | /api/ai/presets | public-none | No authentication indicators detected | ai mix assistant | Get Presets |
| GET | /api/ai/quick-check | public-none | No authentication indicators detected | ai mix assistant | Quick Check |
| GET | /api/assets | public-none | No authentication indicators detected | assets | List Assets |
| GET | /api/assets/recommend | public-none | No authentication indicators detected | assets | Recommend Assets |
| GET | /api/assets/{asset_id}/download | public-none | No authentication indicators detected | assets | Download Asset |
| GET | /api/assets/{asset_id}/download64 | public-none | No authentication indicators detected | assets | Download Asset Base64 |
| GET | /api/assets/{asset_id}/preview | public-none | No authentication indicators detected | assets | Get Asset Preview |
| POST | /api/assets/{asset_id}/receipt | public-none | No authentication indicators detected | assets | Get Asset Receipt |
| POST | /api/auth/login | public-none | No authentication indicators detected | auth | Login |
| POST | /api/auth/register | public-none | No authentication indicators detected | auth | Register |
| POST | /api/auth/wallet/login | public-none | No authentication indicators detected | auth | Wallet Login |
| POST | /api/auth/wallet/nonce | public-none | No authentication indicators detected | auth | Wallet Nonce |
| GET | /api/demo/review | public-none | No authentication indicators detected | demo | Demo Review |
| GET | /api/extensions | public-none | No authentication indicators detected | code search, insights, mirroring, extensions | List Extensions |
| GET | /api/gists/{gid} | public-none | No authentication indicators detected | packages, gist, sponsors, teams | Get Gist |
| GET | /api/graphql | public-none | No authentication indicators detected | workflows, security, graphql | Graphql Playground |
| GET | /api/graphql/schema | public-none | No authentication indicators detected | workflows, security, graphql | Graphql Schema |
| GET | /api/health | public-none | No authentication indicators detected |  | Health |
| GET | /api/integrations/events | public-none | No authentication indicators detected | integrations | List Event Types |
| GET | /api/metadata/isrc/{isrc} | public-none | No authentication indicators detected | metadata | Validate Isrc Endpoint |
| GET | /api/metadata/isrc/{isrc}/enrich | public-none | No authentication indicators detected | metadata | Enrich From Isrc Endpoint |
| GET | /api/metadata/search | public-none | No authentication indicators detected | metadata | Search Tracks |
| GET | /api/packages/{pkg_id} | public-none | No authentication indicators detected | packages, gist, sponsors, teams | Get Package |
| POST | /api/packages/{pkg_id}/download | public-none | No authentication indicators detected | packages, gist, sponsors, teams | Download Package |
| GET | /api/portfolio | public-none | No authentication indicators detected | portfolio | List Public Portfolios |
| GET | /api/portfolio/{username} | public-none | No authentication indicators detected | portfolio | Get Portfolio |
| GET | /api/projects/{project_id}/commits/{commit_id}/checks | public-none | No authentication indicators detected | audio checks | List Checks |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks | public-none | No authentication indicators detected | audio checks | Create Check |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks/run | public-none | No authentication indicators detected | audio checks | Run Checks |
| GET | /api/release-packages/public/{delivery_token} | public-token | Token/share/delivery indicator detected | release packages | Public Delivery |
| GET | /api/release-packages/public/{delivery_token}/download/{deliverable_id} | public-token | Token/share/delivery indicator detected | release packages | Public Download |
| GET | /api/sessions/public/{share_token} | public-token | Token/share/delivery indicator detected | review sessions | Public Session |
| GET | /api/sessions/public/{share_token}/requests/export | public-token | Token/share/delivery indicator detected | review sessions | Export Requests Public |
| POST | /api/sessions/public/{share_token}/submit-feedback | public-token | Token/share/delivery indicator detected | review sessions | Submit Feedback |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/approvals | public-token | Token/share/delivery indicator detected | review sessions | Guest Approve |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/audio | public-token | Token/share/delivery indicator detected | review sessions | Public Download Audio |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/comments | public-token | Token/share/delivery indicator detected | review sessions | Guest Comment |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/diff | public-token | Token/share/delivery indicator detected | review sessions | Public Version Diff |
| GET | /api/sessions/{session_id}/roles/presets | public-none | No authentication indicators detected | roles | List Presets |
| GET | /api/unified-search/popular | public-none | No authentication indicators detected | search engine | Popular Queries |
| GET | /api/unified-search/quick | public-none | No authentication indicators detected | search engine | Quick Search |
| GET | /api/unified-search/suggest | public-none | No authentication indicators detected | search engine | Suggest |
| GET | /api/unified-search/{entity_type} | public-none | No authentication indicators detected | search engine | Search By Type |
| GET | /api/users/{username}/sponsors | public-none | No authentication indicators detected | packages, gist, sponsors, teams | List Sponsors |
| GET | /docs | public-none | No authentication indicators detected |  |  |
| GET | /docs/oauth2-redirect | public-none | No authentication indicators detected |  |  |
| GET | /openapi.json | public-none | No authentication indicators detected |  |  |
| GET | /redoc | public-none | No authentication indicators detected |  |  |

## High-Priority Review (Mutating & Unclear Protection)
| Method | Path | Auth Class | Reason | Tags | Summary |
|--------|------|------------|--------|------|---------|
| POST | /api/2fa/validate | public-none | No authentication indicators detected | 2fa | Validate 2Fa Code |
| POST | /api/assets/{asset_id}/receipt | public-none | No authentication indicators detected | assets | Get Asset Receipt |
| POST | /api/auth/login | public-none | No authentication indicators detected | auth | Login |
| POST | /api/auth/register | public-none | No authentication indicators detected | auth | Register |
| POST | /api/auth/wallet/login | public-none | No authentication indicators detected | auth | Wallet Login |
| POST | /api/auth/wallet/nonce | public-none | No authentication indicators detected | auth | Wallet Nonce |
| POST | /api/packages/{pkg_id}/download | public-none | No authentication indicators detected | packages, gist, sponsors, teams | Download Package |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks | public-none | No authentication indicators detected | audio checks | Create Check |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks/run | public-none | No authentication indicators detected | audio checks | Run Checks |

## Token-Scoped Mutating Operations
| Method | Path | Auth Class | Detected Token Type | Tags | Summary |
|--------|------|------------|---------------------|------|---------|
| POST | /api/sessions/public/{share_token}/submit-feedback | public-token | Share token (path) | review sessions | Submit Feedback |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/approvals | public-token | Share token (path) | review sessions | Guest Approve |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/comments | public-token | Share token (path) | review sessions | Guest Comment |

## Privileged/Admin Operations
No privileged operations found.

## Static-Analysis Limitations
1. OpenAPI `security` field may not capture custom token validation or middleware.
2. Dependency analysis is based on callable names/modules; complex wrappers may be misclassified.
3. Router-level dependencies are flattened into routes; we rely on the final dependant tree.
4. Dynamic or conditional security (based on flags) is not represented statically.
5. Global middleware from `app.user_middleware` is listed but not inferred as auth.

## Source Files and Dependencies Inspected
- FastAPI app: `backend/app/main.py` (imported as `backend.app.main:app`)
- All route objects collected via recursive traversal of `app.routes`
- OpenAPI schema via `app.openapi()` for security/tags/responses
- Dependency walk via `route.dependant.dependencies` (recursive) and `route.dependencies`
- Global middleware: `app.user_middleware` (listed for reference)
