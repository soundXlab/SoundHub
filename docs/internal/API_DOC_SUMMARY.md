# API Documentation Summary

This document summarizes all FastAPI routers and their endpoints.

## activity.py

**Router Prefix:** `/api/activity`

| Method | Path |
|--------|------|
| GET | `` |

---

## agile_delivery.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/sprints` |
| POST | `/api/projects/{pid}/sprints` |
| PATCH | `/api/projects/{pid}/sprints/{sid}` |
| GET | `/api/projects/{pid}/sprints/{sid}/backlog` |
| POST | `/api/projects/{pid}/sprints/{sid}/assign` |
| GET | `/api/projects/{pid}/retros` |
| POST | `/api/projects/{pid}/retros` |
| PATCH | `/api/projects/{pid}/retros/{rid}` |
| GET | `/api/projects/{pid}/retros/{rid}/items` |
| POST | `/api/projects/{pid}/retros/{rid}/items` |
| POST | `/api/projects/{pid}/retro-items/{iid}/vote` |
| GET | `/api/projects/{pid}/release-approvals` |
| POST | `/api/projects/{pid}/release-approvals` |
| POST | `/api/projects/{pid}/release-approvals/{raid}/approve` |
| POST | `/api/projects/{pid}/release-approvals/{raid}/reject` |

---

## ai_mix.py

**Router Prefix:** `/api/ai`

| Method | Path |
|--------|------|
| POST | `/analyze` |
| GET | `/quick-check` |
| GET | `/presets` |

---

## analytics.py

**Router Prefix:** `/api/analytics`

| Method | Path |
|--------|------|
| GET | `` |

---

## api_gateway.py

**Router Prefix:** `/api/gateway`

| Method | Path |
|--------|------|
| POST | `/keys` |
| GET | `/keys` |
| DELETE | `/keys/{key_id}` |
| DELETE | `/keys/{key_id}/permanent` |
| GET | `/keys/{key_id}/usage` |
| POST | `/keys/{key_id}/validate` |
| POST | `/keys/{key_id}/check-limit` |
| POST | `/rules` |
| GET | `/rules` |
| DELETE | `/rules/{rule_id}` |

---

## assets.py

**Router Prefix:** `/api/assets`

| Method | Path |
|--------|------|
| GET | `` |
| GET | `/{asset_id}/preview` |
| GET | `/{asset_id}/download` |
| GET | `/{asset_id}/download64` |
| GET | `/recommend` |
| POST | `/{asset_id}/receipt` |
| POST | `/stems` |

---

## audio_checks.py

**Router Prefix:** `/api/projects/{project_id}/commits/{commit_id}/checks`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| POST | `/run` |

---

## auth.py

**Router Prefix:** `/api/auth`

| Method | Path |
|--------|------|
| POST | `/register` |
| POST | `/login` |
| POST | `/wallet/nonce` |
| POST | `/wallet/login` |
| GET | `/me` |
| PATCH | `/me` |

---

## branch_protection.py

**Router Prefix:** `/api/projects/{project_id}/protection`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| PATCH | `/{branch_name}` |
| DELETE | `/{branch_name}` |

---

## change_orders.py

**Router Prefix:** `/api/sessions/{session_id}/change-orders`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| PATCH | `/{order_id}/quote` |
| PATCH | `/{order_id}/accept` |
| PATCH | `/{order_id}/decline` |

---

## code_search_and_insights.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| POST | `/api/projects/{pid}/code-search/index` |
| GET | `/api/projects/{pid}/code-search` |
| GET | `/api/projects/{pid}/code-insights` |
| POST | `/api/projects/{pid}/code-insights` |
| GET | `/api/projects/{pid}/mirrors` |
| POST | `/api/projects/{pid}/mirrors` |
| POST | `/api/projects/{pid}/mirrors/{mid}/sync` |
| PATCH | `/api/projects/{pid}/mirrors/{mid}` |
| GET | `/api/extensions` |
| POST | `/api/extensions` |
| POST | `/api/projects/{pid}/extensions/{eid}/install` |
| GET | `/api/projects/{pid}/extensions` |

---

## codeowners_milestones.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/codeowners` |
| POST | `/api/projects/{pid}/codeowners` |
| DELETE | `/api/projects/{pid}/codeowners/{owner_id}` |
| GET | `/api/projects/{pid}/milestones` |
| POST | `/api/projects/{pid}/milestones` |
| PATCH | `/api/projects/{pid}/milestones/{mid}` |

---

## comparisons.py

**Router Prefix:** `/api/comparisons`

| Method | Path |
|--------|------|
| POST | `/versions` |
| POST | `/references` |

---

## compute.py

**Router Prefix:** `/api/functions`

| Method | Path |
|--------|------|
| POST | `` |
| GET | `` |
| GET | `/{function_id}` |
| PUT | `/{function_id}` |
| DELETE | `/{function_id}` |
| POST | `/{function_id}/invoke` |
| GET | `/{function_id}/stats` |
| POST | `/{function_id}/triggers` |
| GET | `/{function_id}/triggers` |
| DELETE | `/triggers/{trigger_id}` |
| GET | `/invocations` |
| GET | `/invocations/{invocation_id}` |

---

## dashboard.py

**Router Prefix:** `/api/dashboard`

| Method | Path |
|--------|------|
| GET | `` |
| GET | `/projects/{project_id}` |

---

## demo.py

**Router Prefix:** `/api/demo`

| Method | Path |
|--------|------|
| GET | `/review` |

---

## deployments_artifacts.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/artifact-feeds` |
| POST | `/api/projects/{pid}/artifact-feeds` |
| GET | `/api/projects/{pid}/artifact-feeds/{fid}/packages` |
| POST | `/api/projects/{pid}/artifact-feeds/{fid}/packages` |
| GET | `/api/artifacts/search` |
| GET | `/api/projects/{pid}/artifact-feeds/{fid}/stats` |
| GET | `/api/projects/{pid}/deployments` |
| POST | `/api/projects/{pid}/deployments` |
| PATCH | `/api/projects/{pid}/deployments/{did}` |
| GET | `/api/projects/{pid}/environments/{eid}/approvals` |
| POST | `/api/projects/{pid}/environments/{eid}/approvals/{aid}/approve` |
| POST | `/api/projects/{pid}/environments/{eid}/approvals/{aid}/reject` |
| GET | `/api/projects/{pid}/branch-permissions` |
| POST | `/api/projects/{pid}/branch-permissions` |
| DELETE | `/api/projects/{pid}/branch-permissions/{bid}` |

---

## diffs.py

**Router Prefix:** `/api/diffs`

| Method | Path |
|--------|------|
| GET | `/{session_id}/versions/{version_id}` |

---

## discussions.py

**Router Prefix:** `/api/projects/{project_id}/discussions`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{disc_id}` |
| PATCH | `/{disc_id}` |
| DELETE | `/{disc_id}` |
| POST | `/{disc_id}/comments` |
| GET | `/{disc_id}/comments` |
| PATCH | `/{disc_id}/comments/{comment_id}/accept` |

---

## files.py

**Router Prefix:** `/api/files`

| Method | Path |
|--------|------|
| POST | `/upload` |
| GET | `/{sha}` |

---

## gitlab_features.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/merge-trains` |
| POST | `/api/projects/{pid}/merge-trains/{pr_id}` |
| GET | `/api/projects/{pid}/requirements` |
| POST | `/api/projects/{pid}/requirements` |
| GET | `/api/projects/{pid}/designs` |
| POST | `/api/projects/{pid}/designs` |
| POST | `/api/projects/{pid}/designs/{did}/comments` |
| GET | `/api/projects/{pid}/service-desk` |
| POST | `/api/projects/{pid}/service-desk` |
| PATCH | `/api/projects/{pid}/service-desk/{tid}` |
| GET | `/api/projects/{pid}/security-scans` |
| POST | `/api/projects/{pid}/security-scans` |
| GET | `/api/projects/{pid}/security-scans/{sid}/findings` |
| GET | `/api/projects/{pid}/registry` |
| GET | `/api/projects/{pid}/feature-flags` |
| POST | `/api/projects/{pid}/feature-flags` |
| PATCH | `/api/projects/{pid}/feature-flags/{fid}` |
| GET | `/api/projects/{pid}/errors` |
| PATCH | `/api/projects/{pid}/errors/{eid}` |
| GET | `/api/projects/{pid}/incidents` |
| POST | `/api/projects/{pid}/incidents` |
| PATCH | `/api/projects/{pid}/incidents/{iid}` |
| GET | `/api/projects/{pid}/oncall` |
| POST | `/api/projects/{pid}/oncall` |
| GET | `/api/projects/{pid}/status-page` |
| POST | `/api/projects/{pid}/status-page/components` |
| GET | `/api/projects/{pid}/okrs` |
| POST | `/api/projects/{pid}/okrs` |
| POST | `/api/projects/{pid}/okrs/{oid}/key-results` |
| GET | `/api/projects/{pid}/audit` |

---

## groups.py

**Router Prefix:** `/api/groups`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| PATCH | `/{group_id}` |
| DELETE | `/{group_id}` |
| POST | `/session/{session_id}` |
| DELETE | `/session/{session_id}/{group_id}` |

---

## iam.py

**Router Prefix:** `/api/iam`

| Method | Path |
|--------|------|
| POST | `/roles` |
| GET | `/roles` |
| GET | `/roles/{role_id}` |
| DELETE | `/roles/{role_id}` |
| POST | `/roles/{role_id}/policies` |
| DELETE | `/policies/{policy_id}` |
| POST | `/roles/{role_id}/assign` |
| DELETE | `/assignments/{assignment_id}` |
| GET | `/assignments` |
| POST | `/check-permission` |
| POST | `/audit` |
| POST | `/init-system-roles` |

---

## integrations.py

**Router Prefix:** `/api/integrations`

| Method | Path |
|--------|------|
| GET | `/events` |
| GET | `` |
| POST | `` |
| PATCH | `/{integration_id}` |
| DELETE | `/{integration_id}` |
| POST | `/{integration_id}/test` |

---

## jobs.py

**Router Prefix:** `/api/jobs`

| Method | Path |
|--------|------|
| POST | `` |
| GET | `` |
| GET | `/{job_id}` |
| DELETE | `/{job_id}` |
| POST | `/{job_id}/retry` |
| POST | `/batch` |
| GET | `/dlq` |

---

## kanban.py

**Router Prefix:** `/api/projects/{project_id}/kanban`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{board_id}` |
| POST | `/{board_id}/cards` |
| PATCH | `/{board_id}/cards/{card_id}` |
| DELETE | `/{board_id}/cards/{card_id}` |

---

## metadata.py

**Router Prefix:** `/api/metadata`

| Method | Path |
|--------|------|
| GET | `/isrc/{isrc}` |
| GET | `/isrc/{isrc}/enrich` |
| GET | `/search` |

---

## monitoring.py

**Router Prefix:** `/api/monitoring`

| Method | Path |
|--------|------|
| POST | `/namespaces` |
| GET | `/namespaces` |
| POST | `/metrics` |
| GET | `/metrics` |
| POST | `/metrics/statistics` |
| POST | `/logs/groups` |
| GET | `/logs/groups` |
| DELETE | `/logs/groups/{name}` |
| GET | `/logs/groups/{name}/stats` |
| POST | `/logs/streams` |
| GET | `/logs/streams` |
| POST | `/logs/events` |
| POST | `/logs/events/query` |
| POST | `/alarms` |
| GET | `/alarms` |
| PUT | `/alarms/{alarm_id}` |
| DELETE | `/alarms/{alarm_id}` |
| POST | `/alarms/evaluate` |

---

## notifications.py

**Router Prefix:** `/api/notifications`

| Method | Path |
|--------|------|
| POST | `/topics` |
| GET | `/topics` |
| GET | `/topics/{topic_id}` |
| DELETE | `/topics/{topic_id}` |
| POST | `/topics/{topic_id}/subscribe` |
| GET | `/topics/{topic_id}/subscriptions` |
| DELETE | `/subscriptions/{subscription_id}` |
| POST | `/topics/{topic_id}/publish` |
| GET | `/topics/{topic_id}/stats` |

---

## notifications_social.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/notifications` |
| GET | `/api/notifications/count` |
| PATCH | `/api/notifications/{nid}/read` |
| POST | `/api/notifications/read-all` |
| GET | `/api/projects/{pid}/star` |
| POST | `/api/projects/{pid}/star` |
| GET | `/api/projects/{pid}/watch` |
| PUT | `/api/projects/{pid}/watch` |
| DELETE | `/api/projects/{pid}/watch` |
| GET | `/api/projects/{pid}/forks` |
| POST | `/api/projects/{pid}/fork` |

---

## packages_gist_sponsors.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/packages` |
| POST | `/api/packages` |
| GET | `/api/packages/{pkg_id}` |
| POST | `/api/packages/{pkg_id}/download` |
| GET | `/api/gists` |
| POST | `/api/gists` |
| GET | `/api/gists/{gid}` |
| DELETE | `/api/gists/{gid}` |
| GET | `/api/users/{username}/sponsors` |
| POST | `/api/sponsors` |
| GET | `/api/teams` |
| POST | `/api/teams` |
| POST | `/api/teams/{tid}/members` |
| POST | `/api/teams/{tid}/projects` |

---

## pins.py

**Router Prefix:** `/api/sessions/{session_id}/pins`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| DELETE | `/{version_id}` |

---

## pipelines_ci.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/variable-groups` |
| POST | `/api/projects/{pid}/variable-groups` |
| PATCH | `/api/projects/{pid}/variable-groups/{gid}` |
| DELETE | `/api/projects/{pid}/variable-groups/{gid}` |
| GET | `/api/projects/{pid}/secure-files` |
| POST | `/api/projects/{pid}/secure-files` |
| DELETE | `/api/projects/{pid}/secure-files/{fid}` |
| GET | `/api/projects/{pid}/task-groups` |
| POST | `/api/projects/{pid}/task-groups` |
| PATCH | `/api/projects/{pid}/task-groups/{gid}` |
| GET | `/api/workflow-runs/{run_id}/artifacts` |
| POST | `/api/workflow-runs/{run_id}/artifacts` |
| GET | `/api/projects/{pid}/approval-gates` |
| POST | `/api/projects/{pid}/approval-gates` |
| DELETE | `/api/projects/{pid}/approval-gates/{gid}` |

---

## portfolio.py

**Router Prefix:** `/api/portfolio`

| Method | Path |
|--------|------|
| GET | `` |
| GET | `/{username}` |

---

## projects.py

**Router Prefix:** `/api/projects`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{project_id}` |
| PATCH | `/{project_id}` |
| DELETE | `/{project_id}` |
| GET | `/{project_id}/branches` |
| POST | `/{project_id}/branches` |
| DELETE | `/{project_id}/branches/{branch_name}` |
| POST | `/{project_id}/merge` |
| GET | `/{project_id}/compare` |
| POST | `/{project_id}/push` |
| POST | `/{project_id}/commits` |
| GET | `/{project_id}/commits` |
| GET | `/{project_id}/commits/{commit_id}` |
| GET | `/{project_id}/tree` |
| GET | `/{project_id}/files/{file_path:path}` |
| GET | `/{project_id}/diff` |
| POST | `/{project_id}/storage-lifecycle` |

---

## pull_requests.py

**Router Prefix:** `/api/projects/{project_id}/pull-requests`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{pr_id}` |
| PATCH | `/{pr_id}` |
| POST | `/{pr_id}/merge` |
| POST | `/{pr_id}/reviews` |
| GET | `/{pr_id}/reviews` |
| POST | `/{pr_id}/comments` |
| GET | `/{pr_id}/comments` |

---

## references.py

**Router Prefix:** `/api/sessions/{session_id}/references`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| DELETE | `/{reference_id}` |

---

## release_packages.py

**Router Prefix:** `/api/release-packages`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| PATCH | `/{package_id}/lock` |
| GET | `/{package_id}/deliverables` |
| GET | `/public/{delivery_token}` |
| GET | `/public/{delivery_token}/download/{deliverable_id}` |

---

## reminders.py

**Router Prefix:** `/api/reminders`

| Method | Path |
|--------|------|
| POST | `/evaluate` |
| POST | `/send` |
| POST | `/run-all` |

---

## roles.py

**Router Prefix:** `/api/sessions/{session_id}/roles`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| DELETE | `/{member_id}` |
| GET | `/presets` |

---

## search.py

**Router Prefix:** `/api/search`

| Method | Path |
|--------|------|
| GET | `` |

---

## search_engine.py

**Router Prefix:** `/api/unified-search`

| Method | Path |
|--------|------|
| GET | `` |
| GET | `/quick` |
| POST | `/index` |
| DELETE | `/index/{entity_type}/{entity_id}` |
| POST | `/reindex` |
| GET | `/stats` |
| GET | `/popular` |
| GET | `/saved` |
| POST | `/saved` |
| DELETE | `/saved/{sid}` |
| GET | `/suggest` |
| GET | `/{entity_type}` |

---

## secrets_envs.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/secrets` |
| POST | `/api/projects/{pid}/secrets` |
| DELETE | `/api/projects/{pid}/secrets/{sid}` |
| GET | `/api/projects/{pid}/environments` |
| POST | `/api/projects/{pid}/environments` |
| GET | `/api/projects/{pid}/lfs` |
| POST | `/api/projects/{pid}/lfs` |
| GET | `/api/projects/{pid}/roles` |
| POST | `/api/projects/{pid}/roles` |
| POST | `/api/projects/{pid}/roles/assign` |
| GET | `/api/projects/{pid}/push-rules` |
| PUT | `/api/projects/{pid}/push-rules` |
| GET | `/api/projects/{pid}/ip-allowlist` |
| POST | `/api/projects/{pid}/ip-allowlist` |

---

## sessions.py

**Router Prefix:** `/api/sessions`

| Method | Path |
|--------|------|
| GET | `/public/{share_token}` |
| GET | `/public/{share_token}/versions/{version_id}/audio` |
| GET | `/public/{share_token}/versions/{version_id}/diff` |
| POST | `/public/{share_token}/versions/{version_id}/comments` |
| POST | `/public/{share_token}/versions/{version_id}/approvals` |
| GET | `` |
| POST | `` |
| GET | `/{session_id}` |
| PATCH | `/{session_id}/share` |
| PATCH | `/{session_id}/brief` |
| POST | `/{session_id}/versions` |
| GET | `/{session_id}/versions/{version_id}/audio` |
| GET | `/{session_id}/versions/{version_id}/diff` |
| POST | `/{session_id}/versions/{version_id}/comments` |
| PATCH | `/{session_id}/versions/{version_id}/comments/{comment_id}` |
| POST | `/{session_id}/versions/{version_id}/status` |
| POST | `/{session_id}/status` |
| GET | `/{session_id}/ledger` |
| GET | `/{session_id}/ledger/verify` |
| GET | `/versions/{version_id}/stems` |
| POST | `/versions/{version_id}/stems` |
| GET | `/versions/{version_id}/stems/{stem_id}/audio` |
| POST | `/public/{share_token}/submit-feedback` |
| GET | `/{session_id}/requests/export` |
| GET | `/public/{share_token}/requests/export` |
| DELETE | `/{session_id}` |

---

## storage.py

**Router Prefix:** `/api/storage`

| Method | Path |
|--------|------|
| POST | `/uploads` |
| POST | `/uploads/{object_id}/complete` |
| GET | `/objects/{object_id}` |
| POST | `/objects/{object_id}/download-url` |
| DELETE | `/objects/{object_id}` |
| GET | `/objects/{object_id}/status` |
| GET | `/usage` |
| POST | `/cleanup` |

---

## tags.py

**Router Prefix:** `/api/tags`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| PATCH | `/{tag_id}` |
| DELETE | `/{tag_id}` |
| POST | `/session/{session_id}` |
| DELETE | `/session/{session_id}/{tag_id}` |

---

## tags_releases.py

**Router Prefix:** `/api/projects/{project_id}/tags`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{tag_name}` |
| DELETE | `/{tag_name}` |
| GET | `/{tag_name}/release-notes` |
| POST | `/{tag_name}/release-notes` |

---

## tasks.py

**Router Prefix:** `/api/projects/{project_id}/tasks`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{task_id}` |
| PATCH | `/{task_id}` |
| DELETE | `/{task_id}` |
| POST | `/{task_id}/comments` |
| GET | `/{task_id}/comments` |
| GET | `/board/{board_id}/tasks` |
| POST | `/{task_id}/move/{column_id}` |

---

## templates.py

**Router Prefix:** `/api/templates`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| GET | `/{template_id}` |
| PATCH | `/{template_id}` |
| DELETE | `/{template_id}` |

---

## test_plans.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/test-plans` |
| POST | `/api/projects/{pid}/test-plans` |
| GET | `/api/projects/{pid}/test-plans/{plan_id}/suites` |
| POST | `/api/projects/{pid}/test-plans/{plan_id}/suites` |
| GET | `/api/projects/{pid}/test-suites/{suite_id}/cases` |
| POST | `/api/projects/{pid}/test-suites/{suite_id}/cases` |
| PATCH | `/api/projects/{pid}/test-cases/{case_id}` |
| GET | `/api/projects/{pid}/test-runs` |
| POST | `/api/projects/{pid}/test-runs` |
| POST | `/api/projects/{pid}/test-runs/{run_id}/results` |
| POST | `/api/projects/{pid}/test-runs/{run_id}/complete` |
| GET | `/api/projects/{pid}/load-tests` |
| POST | `/api/projects/{pid}/load-tests` |
| POST | `/api/projects/{pid}/load-tests/{tid}/run` |

---

## two_factor.py

**Router Prefix:** `/api/2fa`

| Method | Path |
|--------|------|
| POST | `/setup` |
| POST | `/verify` |
| GET | `/status` |
| DELETE | `` |
| POST | `/validate` |

---

## versions.py

**Router Prefix:** `/api/versions`

| Method | Path |
|--------|------|
| GET | `/{version_id}/stems` |
| POST | `/{version_id}/stems` |
| GET | `/{version_id}/stems/{stem_id}/audio` |
| GET | `/{version_id}/audio-analysis` |

---

## webhooks.py

**Router Prefix:** `/api/webhooks`

| Method | Path |
|--------|------|
| GET | `` |
| POST | `` |
| PATCH | `/{webhook_id}` |
| DELETE | `/{webhook_id}` |
| GET | `/{webhook_id}/deliveries` |

---

## wiki_time_epics.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/wiki` |
| POST | `/api/projects/{pid}/wiki` |
| GET | `/api/projects/{pid}/wiki/{slug}` |
| PUT | `/api/projects/{pid}/wiki/{slug}` |
| DELETE | `/api/projects/{pid}/wiki/{slug}` |
| GET | `/api/projects/{pid}/wiki/{slug}/revisions` |
| GET | `/api/projects/{pid}/time` |
| POST | `/api/projects/{pid}/time` |
| GET | `/api/projects/{pid}/epics` |
| POST | `/api/projects/{pid}/epics` |
| POST | `/api/projects/{pid}/epics/{eid}/tasks/{tid}` |
| GET | `/api/projects/{pid}/roadmap` |
| POST | `/api/projects/{pid}/roadmap` |
| GET | `/api/projects/{pid}/calendar` |
| POST | `/api/projects/{pid}/calendar` |

---

## workflows_security.py

**Router Prefix:** *(no prefix)*

| Method | Path |
|--------|------|
| GET | `/api/projects/{pid}/workflows` |
| POST | `/api/projects/{pid}/workflows` |
| GET | `/api/projects/{pid}/workflows/{wid}/runs` |
| POST | `/api/projects/{pid}/workflows/{wid}/trigger` |
| PATCH | `/api/projects/{pid}/workflows/{wid}/runs/{rid}` |
| GET | `/api/projects/{pid}/workflows/{wid}` |
| PUT | `/api/projects/{pid}/workflows/{wid}` |
| DELETE | `/api/projects/{pid}/workflows/{wid}` |
| POST | `/api/projects/{pid}/workflows/{wid}/runs/{runId}/cancel` |
| GET | `/api/projects/{pid}/workflows/{wid}/runs/{runId}/logs` |
| GET | `/api/projects/{pid}/security-alerts` |
| POST | `/api/projects/{pid}/security-alerts` |
| PATCH | `/api/projects/{pid}/security-alerts/{aid}` |
| GET | `/api/graphql` |
| GET | `/api/graphql/schema` |

---

