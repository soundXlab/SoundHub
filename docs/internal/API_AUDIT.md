# API Audit Report

**Generated at**: 2026-08-24T20:13:50.336503

## Executive Summary

- Total router endpoints: 446
- Total documented endpoints: 3
- Duplicate endpoints: 0
- Routers without prefix: 12
- Undocumented endpoints: 446
- Stale documentation entries: 3
- Mutating endpoints missing authentication: 255
- Endpoints missing response model: 310
- OpenAPI comparison: Mismatch
  - Only in routers: 1
  - Only in OpenAPI: 5

## Duplicate Endpoints

No duplicate endpoints found.

## Routers Without Prefix

| File |
|------|
| agile_delivery.py |
| code_search_and_insights.py |
| codeowners_milestones.py |
| deployments_artifacts.py |
| gitlab_features.py |
| notifications_social.py |
| packages_gist_sponsors.py |
| pipelines_ci.py |
| secrets_envs.py |
| test_plans.py |
| wiki_time_epics.py |
| workflows_security.py |

## Undocumented Endpoints

| Method | Path | File | Line Number | Suggested Fix |
|--------|------|------|-------------|---------------|
| DELETE | /api/2fa | two_factor.py | 125 | Add to API_DOC_SUMMARY.md under two_factor.py |
| DELETE | /api/functions/triggers/{trigger_id} | compute.py | 148 | Add to API_DOC_SUMMARY.md under compute.py |
| DELETE | /api/functions/{function_id} | compute.py | 107 | Add to API_DOC_SUMMARY.md under compute.py |
| DELETE | /api/gateway/keys/{key_id} | api_gateway.py | 70 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| DELETE | /api/gateway/keys/{key_id}/permanent | api_gateway.py | 77 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| DELETE | /api/gateway/rules/{rule_id} | api_gateway.py | 128 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| DELETE | /api/gists/{gid} | packages_gist_sponsors.py | 99 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| DELETE | /api/groups/session/{session_id}/{group_id} | groups.py | 65 | Add to API_DOC_SUMMARY.md under groups.py |
| DELETE | /api/groups/{group_id} | groups.py | 49 | Add to API_DOC_SUMMARY.md under groups.py |
| DELETE | /api/iam/assignments/{assignment_id} | iam.py | 131 | Add to API_DOC_SUMMARY.md under iam.py |
| DELETE | /api/iam/policies/{policy_id} | iam.py | 114 | Add to API_DOC_SUMMARY.md under iam.py |
| DELETE | /api/iam/roles/{role_id} | iam.py | 97 | Add to API_DOC_SUMMARY.md under iam.py |
| DELETE | /api/integrations/{integration_id} | integrations.py | 254 | Add to API_DOC_SUMMARY.md under integrations.py |
| DELETE | /api/jobs/{job_id} | jobs.py | 165 | Add to API_DOC_SUMMARY.md under jobs.py |
| DELETE | /api/monitoring/alarms/{alarm_id} | monitoring.py | 257 | Add to API_DOC_SUMMARY.md under monitoring.py |
| DELETE | /api/monitoring/logs/groups/{name} | monitoring.py | 179 | Add to API_DOC_SUMMARY.md under monitoring.py |
| DELETE | /api/notifications/subscriptions/{subscription_id} | notifications.py | 105 | Add to API_DOC_SUMMARY.md under notifications.py |
| DELETE | /api/notifications/topics/{topic_id} | notifications.py | 80 | Add to API_DOC_SUMMARY.md under notifications.py |
| DELETE | /api/projects/{pid}/approval-gates/{gid} | pipelines_ci.py | 222 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| DELETE | /api/projects/{pid}/branch-permissions/{bid} | deployments_artifacts.py | 370 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| DELETE | /api/projects/{pid}/codeowners/{owner_id} | codeowners_milestones.py | 43 | Add to API_DOC_SUMMARY.md under codeowners_milestones.py |
| DELETE | /api/projects/{pid}/secrets/{sid} | secrets_envs.py | 61 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| DELETE | /api/projects/{pid}/secure-files/{fid} | pipelines_ci.py | 110 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| DELETE | /api/projects/{pid}/variable-groups/{gid} | pipelines_ci.py | 66 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| DELETE | /api/projects/{pid}/watch | notifications_social.py | 102 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| DELETE | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 83 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| DELETE | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 122 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| DELETE | /api/projects/{project_id} | projects.py | 219 | Add to API_DOC_SUMMARY.md under projects.py |
| DELETE | /api/projects/{project_id}/branches/{branch_name} | projects.py | 276 | Add to API_DOC_SUMMARY.md under projects.py |
| DELETE | /api/projects/{project_id}/discussions/{disc_id} | discussions.py | 87 | Add to API_DOC_SUMMARY.md under discussions.py |
| DELETE | /api/projects/{project_id}/kanban/{board_id}/cards/{card_id} | kanban.py | 108 | Add to API_DOC_SUMMARY.md under kanban.py |
| DELETE | /api/projects/{project_id}/protection/{branch_name} | branch_protection.py | 123 | Add to API_DOC_SUMMARY.md under branch_protection.py |
| DELETE | /api/projects/{project_id}/tags/{tag_name} | tags_releases.py | 69 | Add to API_DOC_SUMMARY.md under tags_releases.py |
| DELETE | /api/projects/{project_id}/tasks/{task_id} | tasks.py | 186 | Add to API_DOC_SUMMARY.md under tasks.py |
| DELETE | /api/sessions/{session_id} | sessions.py | 1208 | Add to API_DOC_SUMMARY.md under sessions.py |
| DELETE | /api/sessions/{session_id}/pins/{version_id} | pins.py | 56 | Add to API_DOC_SUMMARY.md under pins.py |
| DELETE | /api/sessions/{session_id}/references/{reference_id} | references.py | 51 | Add to API_DOC_SUMMARY.md under references.py |
| DELETE | /api/sessions/{session_id}/roles/{member_id} | roles.py | 53 | Add to API_DOC_SUMMARY.md under roles.py |
| DELETE | /api/storage/objects/{object_id} | storage.py | 337 | Add to API_DOC_SUMMARY.md under storage.py |
| DELETE | /api/tags/session/{session_id}/{tag_id} | tags.py | 65 | Add to API_DOC_SUMMARY.md under tags.py |
| DELETE | /api/tags/{tag_id} | tags.py | 49 | Add to API_DOC_SUMMARY.md under tags.py |
| DELETE | /api/templates/{template_id} | templates.py | 42 | Add to API_DOC_SUMMARY.md under templates.py |
| DELETE | /api/unified-search/index/{entity_type}/{entity_id} | search_engine.py | 82 | Add to API_DOC_SUMMARY.md under search_engine.py |
| DELETE | /api/unified-search/saved/{sid} | search_engine.py | 144 | Add to API_DOC_SUMMARY.md under search_engine.py |
| DELETE | /api/webhooks/{webhook_id} | webhooks.py | 62 | Add to API_DOC_SUMMARY.md under webhooks.py |
| GET | /api/2fa/status | two_factor.py | 116 | Add to API_DOC_SUMMARY.md under two_factor.py |
| GET | /api/activity | activity.py | 14 | Add to API_DOC_SUMMARY.md under activity.py |
| GET | /api/ai/presets | ai_mix.py | 97 | Add to API_DOC_SUMMARY.md under ai_mix.py |
| GET | /api/ai/quick-check | ai_mix.py | 75 | Add to API_DOC_SUMMARY.md under ai_mix.py |
| GET | /api/analytics | analytics.py | 13 | Add to API_DOC_SUMMARY.md under analytics.py |
| GET | /api/artifacts/search | deployments_artifacts.py | 84 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/assets | assets.py | 20 | Add to API_DOC_SUMMARY.md under assets.py |
| GET | /api/assets/recommend | assets.py | 464 | Add to API_DOC_SUMMARY.md under assets.py |
| GET | /api/assets/{asset_id}/download | assets.py | 262 | Add to API_DOC_SUMMARY.md under assets.py |
| GET | /api/assets/{asset_id}/download64 | assets.py | 362 | Add to API_DOC_SUMMARY.md under assets.py |
| GET | /api/assets/{asset_id}/preview | assets.py | 177 | Add to API_DOC_SUMMARY.md under assets.py |
| GET | /api/auth/me | auth.py | 76 | Add to API_DOC_SUMMARY.md under auth.py |
| GET | /api/dashboard | dashboard.py | 24 | Add to API_DOC_SUMMARY.md under dashboard.py |
| GET | /api/dashboard/projects/{project_id} | dashboard.py | 98 | Add to API_DOC_SUMMARY.md under dashboard.py |
| GET | /api/demo/review | demo.py | 15 | Add to API_DOC_SUMMARY.md under demo.py |
| GET | /api/diffs/{session_id}/versions/{version_id} | diffs.py | 12 | Add to API_DOC_SUMMARY.md under diffs.py |
| GET | /api/extensions | code_search_and_insights.py | 158 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| GET | /api/files/{sha} | files.py | 24 | Add to API_DOC_SUMMARY.md under files.py |
| GET | /api/functions | compute.py | 85 | Add to API_DOC_SUMMARY.md under compute.py |
| GET | /api/functions/invocations | compute.py | 157 | Add to API_DOC_SUMMARY.md under compute.py |
| GET | /api/functions/invocations/{invocation_id} | compute.py | 167 | Add to API_DOC_SUMMARY.md under compute.py |
| GET | /api/functions/{function_id} | compute.py | 90 | Add to API_DOC_SUMMARY.md under compute.py |
| GET | /api/functions/{function_id}/stats | compute.py | 124 | Add to API_DOC_SUMMARY.md under compute.py |
| GET | /api/functions/{function_id}/triggers | compute.py | 143 | Add to API_DOC_SUMMARY.md under compute.py |
| GET | /api/gateway/keys | api_gateway.py | 64 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| GET | /api/gateway/keys/{key_id}/usage | api_gateway.py | 84 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| GET | /api/gateway/rules | api_gateway.py | 122 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| GET | /api/gists | packages_gist_sponsors.py | 67 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| GET | /api/gists/{gid} | packages_gist_sponsors.py | 90 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| GET | /api/graphql | workflows_security.py | 213 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/graphql/schema | workflows_security.py | 229 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/groups | groups.py | 28 | Add to API_DOC_SUMMARY.md under groups.py |
| GET | /api/iam/assignments | iam.py | 137 | Add to API_DOC_SUMMARY.md under iam.py |
| GET | /api/iam/roles | iam.py | 84 | Add to API_DOC_SUMMARY.md under iam.py |
| GET | /api/iam/roles/{role_id} | iam.py | 89 | Add to API_DOC_SUMMARY.md under iam.py |
| GET | /api/integrations | integrations.py | 215 | Add to API_DOC_SUMMARY.md under integrations.py |
| GET | /api/integrations/events | integrations.py | 209 | Add to API_DOC_SUMMARY.md under integrations.py |
| GET | /api/jobs | jobs.py | 114 | Add to API_DOC_SUMMARY.md under jobs.py |
| GET | /api/jobs/dlq | jobs.py | 281 | Add to API_DOC_SUMMARY.md under jobs.py |
| GET | /api/jobs/{job_id} | jobs.py | 151 | Add to API_DOC_SUMMARY.md under jobs.py |
| GET | /api/metadata/isrc/{isrc} | metadata.py | 48 | Add to API_DOC_SUMMARY.md under metadata.py |
| GET | /api/metadata/isrc/{isrc}/enrich | metadata.py | 73 | Add to API_DOC_SUMMARY.md under metadata.py |
| GET | /api/metadata/search | metadata.py | 92 | Add to API_DOC_SUMMARY.md under metadata.py |
| GET | /api/monitoring/alarms | monitoring.py | 243 | Add to API_DOC_SUMMARY.md under monitoring.py |
| GET | /api/monitoring/logs/groups | monitoring.py | 174 | Add to API_DOC_SUMMARY.md under monitoring.py |
| GET | /api/monitoring/logs/groups/{name}/stats | monitoring.py | 185 | Add to API_DOC_SUMMARY.md under monitoring.py |
| GET | /api/monitoring/logs/streams | monitoring.py | 204 | Add to API_DOC_SUMMARY.md under monitoring.py |
| GET | /api/monitoring/metrics | monitoring.py | 146 | Add to API_DOC_SUMMARY.md under monitoring.py |
| GET | /api/monitoring/namespaces | monitoring.py | 130 | Add to API_DOC_SUMMARY.md under monitoring.py |
| GET | /api/notifications | notifications_social.py | 16 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| GET | /api/notifications/count | notifications_social.py | 25 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| GET | /api/notifications/topics | notifications.py | 65 | Add to API_DOC_SUMMARY.md under notifications.py |
| GET | /api/notifications/topics/{topic_id} | notifications.py | 71 | Add to API_DOC_SUMMARY.md under notifications.py |
| GET | /api/notifications/topics/{topic_id}/stats | notifications.py | 129 | Add to API_DOC_SUMMARY.md under notifications.py |
| GET | /api/notifications/topics/{topic_id}/subscriptions | notifications.py | 99 | Add to API_DOC_SUMMARY.md under notifications.py |
| GET | /api/packages | packages_gist_sponsors.py | 18 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| GET | /api/packages/{pkg_id} | packages_gist_sponsors.py | 47 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| GET | /api/portfolio | portfolio.py | 15 | Add to API_DOC_SUMMARY.md under portfolio.py |
| GET | /api/portfolio/{username} | portfolio.py | 20 | Add to API_DOC_SUMMARY.md under portfolio.py |
| GET | /api/projects | projects.py | 165 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{pid}/approval-gates | pipelines_ci.py | 194 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| GET | /api/projects/{pid}/artifact-feeds | deployments_artifacts.py | 28 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/projects/{pid}/artifact-feeds/{fid}/packages | deployments_artifacts.py | 53 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/projects/{pid}/artifact-feeds/{fid}/stats | deployments_artifacts.py | 173 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/projects/{pid}/audit | gitlab_features.py | 356 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/branch-permissions | deployments_artifacts.py | 293 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/projects/{pid}/calendar | wiki_time_epics.py | 203 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/code-insights | code_search_and_insights.py | 81 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| GET | /api/projects/{pid}/code-search | code_search_and_insights.py | 56 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| GET | /api/projects/{pid}/codeowners | codeowners_milestones.py | 16 | Add to API_DOC_SUMMARY.md under codeowners_milestones.py |
| GET | /api/projects/{pid}/deployments | deployments_artifacts.py | 208 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/projects/{pid}/designs | gitlab_features.py | 74 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/environments | secrets_envs.py | 72 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| GET | /api/projects/{pid}/environments/{eid}/approvals | deployments_artifacts.py | 255 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| GET | /api/projects/{pid}/epics | wiki_time_epics.py | 135 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/errors | gitlab_features.py | 208 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/extensions | code_search_and_insights.py | 202 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| GET | /api/projects/{pid}/feature-flags | gitlab_features.py | 174 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/forks | notifications_social.py | 113 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| GET | /api/projects/{pid}/incidents | gitlab_features.py | 230 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/ip-allowlist | secrets_envs.py | 190 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| GET | /api/projects/{pid}/lfs | secrets_envs.py | 95 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| GET | /api/projects/{pid}/load-tests | test_plans.py | 186 | Add to API_DOC_SUMMARY.md under test_plans.py |
| GET | /api/projects/{pid}/merge-trains | gitlab_features.py | 30 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/milestones | codeowners_milestones.py | 54 | Add to API_DOC_SUMMARY.md under codeowners_milestones.py |
| GET | /api/projects/{pid}/mirrors | code_search_and_insights.py | 109 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| GET | /api/projects/{pid}/okrs | gitlab_features.py | 315 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/oncall | gitlab_features.py | 267 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/push-rules | secrets_envs.py | 157 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| GET | /api/projects/{pid}/registry | gitlab_features.py | 165 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/release-approvals | agile_delivery.py | 194 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| GET | /api/projects/{pid}/requirements | gitlab_features.py | 49 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/retros | agile_delivery.py | 111 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| GET | /api/projects/{pid}/retros/{rid}/items | agile_delivery.py | 157 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| GET | /api/projects/{pid}/roadmap | wiki_time_epics.py | 177 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/roles | secrets_envs.py | 119 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| GET | /api/projects/{pid}/secrets | secrets_envs.py | 35 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| GET | /api/projects/{pid}/secure-files | pipelines_ci.py | 78 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| GET | /api/projects/{pid}/security-alerts | workflows_security.py | 155 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/projects/{pid}/security-scans | gitlab_features.py | 140 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/security-scans/{sid}/findings | gitlab_features.py | 156 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/service-desk | gitlab_features.py | 104 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/sprints | agile_delivery.py | 26 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| GET | /api/projects/{pid}/sprints/{sid}/backlog | agile_delivery.py | 79 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| GET | /api/projects/{pid}/star | notifications_social.py | 60 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| GET | /api/projects/{pid}/status-page | gitlab_features.py | 289 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| GET | /api/projects/{pid}/task-groups | pipelines_ci.py | 122 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| GET | /api/projects/{pid}/test-plans | test_plans.py | 26 | Add to API_DOC_SUMMARY.md under test_plans.py |
| GET | /api/projects/{pid}/test-plans/{plan_id}/suites | test_plans.py | 52 | Add to API_DOC_SUMMARY.md under test_plans.py |
| GET | /api/projects/{pid}/test-runs | test_plans.py | 121 | Add to API_DOC_SUMMARY.md under test_plans.py |
| GET | /api/projects/{pid}/test-suites/{suite_id}/cases | test_plans.py | 79 | Add to API_DOC_SUMMARY.md under test_plans.py |
| GET | /api/projects/{pid}/time | wiki_time_epics.py | 105 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/variable-groups | pipelines_ci.py | 27 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| GET | /api/projects/{pid}/watch | notifications_social.py | 82 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| GET | /api/projects/{pid}/wiki | wiki_time_epics.py | 27 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 53 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/wiki/{slug}/revisions | wiki_time_epics.py | 93 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| GET | /api/projects/{pid}/workflows | workflows_security.py | 19 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 96 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/projects/{pid}/workflows/{wid}/runs | workflows_security.py | 45 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/projects/{pid}/workflows/{wid}/runs/{runId}/logs | workflows_security.py | 145 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| GET | /api/projects/{project_id} | projects.py | 200 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/branches | projects.py | 228 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/commits | projects.py | 1281 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/commits/{commit_id} | projects.py | 1305 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/commits/{commit_id}/checks | audio_checks.py | 13 | Add to API_DOC_SUMMARY.md under audio_checks.py |
| GET | /api/projects/{project_id}/compare | projects.py | 466 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/diff | projects.py | 1433 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/discussions | discussions.py | 40 | Add to API_DOC_SUMMARY.md under discussions.py |
| GET | /api/projects/{project_id}/discussions/{disc_id} | discussions.py | 63 | Add to API_DOC_SUMMARY.md under discussions.py |
| GET | /api/projects/{project_id}/discussions/{disc_id}/comments | discussions.py | 112 | Add to API_DOC_SUMMARY.md under discussions.py |
| GET | /api/projects/{project_id}/files/{file_path:path} | projects.py | 1398 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/projects/{project_id}/kanban | kanban.py | 47 | Add to API_DOC_SUMMARY.md under kanban.py |
| GET | /api/projects/{project_id}/kanban/{board_id} | kanban.py | 67 | Add to API_DOC_SUMMARY.md under kanban.py |
| GET | /api/projects/{project_id}/protection | branch_protection.py | 33 | Add to API_DOC_SUMMARY.md under branch_protection.py |
| GET | /api/projects/{project_id}/pull-requests | pull_requests.py | 100 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| GET | /api/projects/{project_id}/pull-requests/{pr_id} | pull_requests.py | 151 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| GET | /api/projects/{project_id}/pull-requests/{pr_id}/comments | pull_requests.py | 417 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| GET | /api/projects/{project_id}/pull-requests/{pr_id}/reviews | pull_requests.py | 375 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| GET | /api/projects/{project_id}/tags | tags_releases.py | 37 | Add to API_DOC_SUMMARY.md under tags_releases.py |
| GET | /api/projects/{project_id}/tags/{tag_name} | tags_releases.py | 60 | Add to API_DOC_SUMMARY.md under tags_releases.py |
| GET | /api/projects/{project_id}/tags/{tag_name}/release-notes | tags_releases.py | 81 | Add to API_DOC_SUMMARY.md under tags_releases.py |
| GET | /api/projects/{project_id}/tasks | tasks.py | 72 | Add to API_DOC_SUMMARY.md under tasks.py |
| GET | /api/projects/{project_id}/tasks/board/{board_id}/tasks | tasks.py | 221 | Add to API_DOC_SUMMARY.md under tasks.py |
| GET | /api/projects/{project_id}/tasks/{task_id} | tasks.py | 157 | Add to API_DOC_SUMMARY.md under tasks.py |
| GET | /api/projects/{project_id}/tasks/{task_id}/comments | tasks.py | 212 | Add to API_DOC_SUMMARY.md under tasks.py |
| GET | /api/projects/{project_id}/tree | projects.py | 1328 | Add to API_DOC_SUMMARY.md under projects.py |
| GET | /api/release-packages | release_packages.py | 19 | Add to API_DOC_SUMMARY.md under release_packages.py |
| GET | /api/release-packages/public/{delivery_token} | release_packages.py | 107 | Add to API_DOC_SUMMARY.md under release_packages.py |
| GET | /api/release-packages/public/{delivery_token}/download/{deliverable_id} | release_packages.py | 123 | Add to API_DOC_SUMMARY.md under release_packages.py |
| GET | /api/release-packages/{package_id}/deliverables | release_packages.py | 95 | Add to API_DOC_SUMMARY.md under release_packages.py |
| GET | /api/search | search.py | 14 | Add to API_DOC_SUMMARY.md under search.py |
| GET | /api/sessions | sessions.py | 506 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/public/{share_token} | sessions.py | 245 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/public/{share_token}/requests/export | sessions.py | 1131 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/audio | sessions.py | 254 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/diff | sessions.py | 271 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/versions/{version_id}/stems | sessions.py | 942 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/versions/{version_id}/stems/{stem_id}/audio | sessions.py | 1018 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/{session_id} | sessions.py | 528 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/{session_id}/change-orders | change_orders.py | 22 | Add to API_DOC_SUMMARY.md under change_orders.py |
| GET | /api/sessions/{session_id}/ledger | sessions.py | 909 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/{session_id}/ledger/verify | sessions.py | 934 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/{session_id}/pins | pins.py | 21 | Add to API_DOC_SUMMARY.md under pins.py |
| GET | /api/sessions/{session_id}/references | references.py | 22 | Add to API_DOC_SUMMARY.md under references.py |
| GET | /api/sessions/{session_id}/requests/export | sessions.py | 1118 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/{session_id}/roles | roles.py | 15 | Add to API_DOC_SUMMARY.md under roles.py |
| GET | /api/sessions/{session_id}/roles/presets | roles.py | 65 | Add to API_DOC_SUMMARY.md under roles.py |
| GET | /api/sessions/{session_id}/versions/{version_id}/audio | sessions.py | 659 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/sessions/{session_id}/versions/{version_id}/diff | sessions.py | 671 | Add to API_DOC_SUMMARY.md under sessions.py |
| GET | /api/storage/objects/{object_id} | storage.py | 291 | Add to API_DOC_SUMMARY.md under storage.py |
| GET | /api/storage/objects/{object_id}/status | storage.py | 353 | Add to API_DOC_SUMMARY.md under storage.py |
| GET | /api/storage/usage | storage.py | 369 | Add to API_DOC_SUMMARY.md under storage.py |
| GET | /api/tags | tags.py | 28 | Add to API_DOC_SUMMARY.md under tags.py |
| GET | /api/teams | packages_gist_sponsors.py | 136 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| GET | /api/templates | templates.py | 13 | Add to API_DOC_SUMMARY.md under templates.py |
| GET | /api/templates/{template_id} | templates.py | 25 | Add to API_DOC_SUMMARY.md under templates.py |
| GET | /api/unified-search | search_engine.py | 17 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/unified-search/popular | search_engine.py | 104 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/unified-search/quick | search_engine.py | 43 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/unified-search/saved | search_engine.py | 118 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/unified-search/stats | search_engine.py | 98 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/unified-search/suggest | search_engine.py | 157 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/unified-search/{entity_type} | search_engine.py | 182 | Add to API_DOC_SUMMARY.md under search_engine.py |
| GET | /api/users/{username}/sponsors | packages_gist_sponsors.py | 110 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| GET | /api/versions/{version_id}/audio-analysis | versions.py | 126 | Add to API_DOC_SUMMARY.md under versions.py |
| GET | /api/versions/{version_id}/stems | versions.py | 39 | Add to API_DOC_SUMMARY.md under versions.py |
| GET | /api/versions/{version_id}/stems/{stem_id}/audio | versions.py | 103 | Add to API_DOC_SUMMARY.md under versions.py |
| GET | /api/webhooks | webhooks.py | 22 | Add to API_DOC_SUMMARY.md under webhooks.py |
| GET | /api/webhooks/{webhook_id}/deliveries | webhooks.py | 71 | Add to API_DOC_SUMMARY.md under webhooks.py |
| GET | /api/workflow-runs/{run_id}/artifacts | pipelines_ci.py | 163 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| PATCH | /api/auth/me | auth.py | 81 | Add to API_DOC_SUMMARY.md under auth.py |
| PATCH | /api/groups/{group_id} | groups.py | 40 | Add to API_DOC_SUMMARY.md under groups.py |
| PATCH | /api/integrations/{integration_id} | integrations.py | 242 | Add to API_DOC_SUMMARY.md under integrations.py |
| PATCH | /api/notifications/{nid}/read | notifications_social.py | 32 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| PATCH | /api/projects/{pid}/deployments/{did} | deployments_artifacts.py | 238 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| PATCH | /api/projects/{pid}/errors/{eid} | gitlab_features.py | 215 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| PATCH | /api/projects/{pid}/feature-flags/{fid} | gitlab_features.py | 195 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| PATCH | /api/projects/{pid}/incidents/{iid} | gitlab_features.py | 251 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| PATCH | /api/projects/{pid}/milestones/{mid} | codeowners_milestones.py | 93 | Add to API_DOC_SUMMARY.md under codeowners_milestones.py |
| PATCH | /api/projects/{pid}/mirrors/{mid} | code_search_and_insights.py | 143 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| PATCH | /api/projects/{pid}/retros/{rid} | agile_delivery.py | 140 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| PATCH | /api/projects/{pid}/security-alerts/{aid} | workflows_security.py | 180 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| PATCH | /api/projects/{pid}/service-desk/{tid} | gitlab_features.py | 127 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| PATCH | /api/projects/{pid}/sprints/{sid} | agile_delivery.py | 62 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| PATCH | /api/projects/{pid}/task-groups/{gid} | pipelines_ci.py | 146 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| PATCH | /api/projects/{pid}/test-cases/{case_id} | test_plans.py | 104 | Add to API_DOC_SUMMARY.md under test_plans.py |
| PATCH | /api/projects/{pid}/variable-groups/{gid} | pipelines_ci.py | 52 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| PATCH | /api/projects/{pid}/workflows/{wid}/runs/{rid} | workflows_security.py | 80 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| PATCH | /api/projects/{project_id} | projects.py | 206 | Add to API_DOC_SUMMARY.md under projects.py |
| PATCH | /api/projects/{project_id}/discussions/{disc_id} | discussions.py | 72 | Add to API_DOC_SUMMARY.md under discussions.py |
| PATCH | /api/projects/{project_id}/discussions/{disc_id}/comments/{comment_id}/accept | discussions.py | 119 | Add to API_DOC_SUMMARY.md under discussions.py |
| PATCH | /api/projects/{project_id}/kanban/{board_id}/cards/{card_id} | kanban.py | 91 | Add to API_DOC_SUMMARY.md under kanban.py |
| PATCH | /api/projects/{project_id}/protection/{branch_name} | branch_protection.py | 92 | Add to API_DOC_SUMMARY.md under branch_protection.py |
| PATCH | /api/projects/{project_id}/pull-requests/{pr_id} | pull_requests.py | 157 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| PATCH | /api/projects/{project_id}/tasks/{task_id} | tasks.py | 166 | Add to API_DOC_SUMMARY.md under tasks.py |
| PATCH | /api/release-packages/{package_id}/lock | release_packages.py | 67 | Add to API_DOC_SUMMARY.md under release_packages.py |
| PATCH | /api/sessions/{session_id}/brief | sessions.py | 576 | Add to API_DOC_SUMMARY.md under sessions.py |
| PATCH | /api/sessions/{session_id}/change-orders/{order_id}/accept | change_orders.py | 63 | Add to API_DOC_SUMMARY.md under change_orders.py |
| PATCH | /api/sessions/{session_id}/change-orders/{order_id}/decline | change_orders.py | 81 | Add to API_DOC_SUMMARY.md under change_orders.py |
| PATCH | /api/sessions/{session_id}/change-orders/{order_id}/quote | change_orders.py | 47 | Add to API_DOC_SUMMARY.md under change_orders.py |
| PATCH | /api/sessions/{session_id}/share | sessions.py | 534 | Add to API_DOC_SUMMARY.md under sessions.py |
| PATCH | /api/sessions/{session_id}/versions/{version_id}/comments/{comment_id} | sessions.py | 871 | Add to API_DOC_SUMMARY.md under sessions.py |
| PATCH | /api/tags/{tag_id} | tags.py | 40 | Add to API_DOC_SUMMARY.md under tags.py |
| PATCH | /api/templates/{template_id} | templates.py | 33 | Add to API_DOC_SUMMARY.md under templates.py |
| PATCH | /api/webhooks/{webhook_id} | webhooks.py | 45 | Add to API_DOC_SUMMARY.md under webhooks.py |
| POST | /api/2fa/setup | two_factor.py | 62 | Add to API_DOC_SUMMARY.md under two_factor.py |
| POST | /api/2fa/validate | two_factor.py | 146 | Add to API_DOC_SUMMARY.md under two_factor.py |
| POST | /api/2fa/verify | two_factor.py | 88 | Add to API_DOC_SUMMARY.md under two_factor.py |
| POST | /api/ai/analyze | ai_mix.py | 40 | Add to API_DOC_SUMMARY.md under ai_mix.py |
| POST | /api/assets/stems | assets.py | 672 | Add to API_DOC_SUMMARY.md under assets.py |
| POST | /api/assets/{asset_id}/receipt | assets.py | 624 | Add to API_DOC_SUMMARY.md under assets.py |
| POST | /api/auth/login | auth.py | 36 | Add to API_DOC_SUMMARY.md under auth.py |
| POST | /api/auth/register | auth.py | 23 | Add to API_DOC_SUMMARY.md under auth.py |
| POST | /api/auth/wallet/login | auth.py | 54 | Add to API_DOC_SUMMARY.md under auth.py |
| POST | /api/auth/wallet/nonce | auth.py | 45 | Add to API_DOC_SUMMARY.md under auth.py |
| POST | /api/comparisons/references | comparisons.py | 41 | Add to API_DOC_SUMMARY.md under comparisons.py |
| POST | /api/comparisons/versions | comparisons.py | 21 | Add to API_DOC_SUMMARY.md under comparisons.py |
| POST | /api/extensions | code_search_and_insights.py | 178 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| POST | /api/files/upload | files.py | 14 | Add to API_DOC_SUMMARY.md under files.py |
| POST | /api/functions | compute.py | 74 | Add to API_DOC_SUMMARY.md under compute.py |
| POST | /api/functions/{function_id}/invoke | compute.py | 116 | Add to API_DOC_SUMMARY.md under compute.py |
| POST | /api/functions/{function_id}/triggers | compute.py | 135 | Add to API_DOC_SUMMARY.md under compute.py |
| POST | /api/gateway/keys | api_gateway.py | 53 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| POST | /api/gateway/keys/{key_id}/check-limit | api_gateway.py | 103 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| POST | /api/gateway/keys/{key_id}/validate | api_gateway.py | 93 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| POST | /api/gateway/rules | api_gateway.py | 116 | Add to API_DOC_SUMMARY.md under api_gateway.py |
| POST | /api/gists | packages_gist_sponsors.py | 79 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/groups | groups.py | 34 | Add to API_DOC_SUMMARY.md under groups.py |
| POST | /api/groups/session/{session_id} | groups.py | 57 | Add to API_DOC_SUMMARY.md under groups.py |
| POST | /api/iam/audit | iam.py | 161 | Add to API_DOC_SUMMARY.md under iam.py |
| POST | /api/iam/check-permission | iam.py | 150 | Add to API_DOC_SUMMARY.md under iam.py |
| POST | /api/iam/init-system-roles | iam.py | 171 | Add to API_DOC_SUMMARY.md under iam.py |
| POST | /api/iam/roles | iam.py | 76 | Add to API_DOC_SUMMARY.md under iam.py |
| POST | /api/iam/roles/{role_id}/assign | iam.py | 123 | Add to API_DOC_SUMMARY.md under iam.py |
| POST | /api/iam/roles/{role_id}/policies | iam.py | 106 | Add to API_DOC_SUMMARY.md under iam.py |
| POST | /api/integrations | integrations.py | 227 | Add to API_DOC_SUMMARY.md under integrations.py |
| POST | /api/integrations/{integration_id}/test | integrations.py | 264 | Add to API_DOC_SUMMARY.md under integrations.py |
| POST | /api/jobs | jobs.py | 81 | Add to API_DOC_SUMMARY.md under jobs.py |
| POST | /api/jobs/batch | jobs.py | 241 | Add to API_DOC_SUMMARY.md under jobs.py |
| POST | /api/jobs/{job_id}/retry | jobs.py | 185 | Add to API_DOC_SUMMARY.md under jobs.py |
| POST | /api/monitoring/alarms | monitoring.py | 231 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/alarms/evaluate | monitoring.py | 263 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/logs/events | monitoring.py | 212 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/logs/events/query | monitoring.py | 220 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/logs/groups | monitoring.py | 166 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/logs/streams | monitoring.py | 196 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/metrics | monitoring.py | 138 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/metrics/statistics | monitoring.py | 151 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/monitoring/namespaces | monitoring.py | 122 | Add to API_DOC_SUMMARY.md under monitoring.py |
| POST | /api/notifications/read-all | notifications_social.py | 42 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| POST | /api/notifications/topics | notifications.py | 56 | Add to API_DOC_SUMMARY.md under notifications.py |
| POST | /api/notifications/topics/{topic_id}/publish | notifications.py | 115 | Add to API_DOC_SUMMARY.md under notifications.py |
| POST | /api/notifications/topics/{topic_id}/subscribe | notifications.py | 90 | Add to API_DOC_SUMMARY.md under notifications.py |
| POST | /api/packages | packages_gist_sponsors.py | 39 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/packages/{pkg_id}/download | packages_gist_sponsors.py | 55 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/projects | projects.py | 173 | Add to API_DOC_SUMMARY.md under projects.py |
| POST | /api/projects/{pid}/approval-gates | pipelines_ci.py | 210 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| POST | /api/projects/{pid}/artifact-feeds | deployments_artifacts.py | 42 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| POST | /api/projects/{pid}/artifact-feeds/{fid}/packages | deployments_artifacts.py | 69 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| POST | /api/projects/{pid}/branch-permissions | deployments_artifacts.py | 358 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| POST | /api/projects/{pid}/calendar | wiki_time_epics.py | 218 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| POST | /api/projects/{pid}/code-insights | code_search_and_insights.py | 93 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| POST | /api/projects/{pid}/code-search/index | code_search_and_insights.py | 32 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| POST | /api/projects/{pid}/codeowners | codeowners_milestones.py | 29 | Add to API_DOC_SUMMARY.md under codeowners_milestones.py |
| POST | /api/projects/{pid}/deployments | deployments_artifacts.py | 226 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| POST | /api/projects/{pid}/designs | gitlab_features.py | 81 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/designs/{did}/comments | gitlab_features.py | 90 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/environments | secrets_envs.py | 84 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| POST | /api/projects/{pid}/environments/{eid}/approvals/{aid}/approve | deployments_artifacts.py | 264 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| POST | /api/projects/{pid}/environments/{eid}/approvals/{aid}/reject | deployments_artifacts.py | 277 | Add to API_DOC_SUMMARY.md under deployments_artifacts.py |
| POST | /api/projects/{pid}/epics | wiki_time_epics.py | 153 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| POST | /api/projects/{pid}/epics/{eid}/tasks/{tid} | wiki_time_epics.py | 164 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| POST | /api/projects/{pid}/extensions/{eid}/install | code_search_and_insights.py | 187 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| POST | /api/projects/{pid}/feature-flags | gitlab_features.py | 186 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/fork | notifications_social.py | 119 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| POST | /api/projects/{pid}/incidents | gitlab_features.py | 242 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/ip-allowlist | secrets_envs.py | 201 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| POST | /api/projects/{pid}/lfs | secrets_envs.py | 108 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| POST | /api/projects/{pid}/load-tests | test_plans.py | 201 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/load-tests/{tid}/run | test_plans.py | 213 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/merge-trains/{pr_id} | gitlab_features.py | 37 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/milestones | codeowners_milestones.py | 79 | Add to API_DOC_SUMMARY.md under codeowners_milestones.py |
| POST | /api/projects/{pid}/mirrors | code_search_and_insights.py | 122 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| POST | /api/projects/{pid}/mirrors/{mid}/sync | code_search_and_insights.py | 132 | Add to API_DOC_SUMMARY.md under code_search_and_insights.py |
| POST | /api/projects/{pid}/okrs | gitlab_features.py | 331 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/okrs/{oid}/key-results | gitlab_features.py | 345 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/oncall | gitlab_features.py | 278 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/release-approvals | agile_delivery.py | 208 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/release-approvals/{raid}/approve | agile_delivery.py | 219 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/release-approvals/{raid}/reject | agile_delivery.py | 231 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/requirements | gitlab_features.py | 63 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/retro-items/{iid}/vote | agile_delivery.py | 181 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/retros | agile_delivery.py | 129 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/retros/{rid}/items | agile_delivery.py | 170 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/roadmap | wiki_time_epics.py | 192 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| POST | /api/projects/{pid}/roles | secrets_envs.py | 130 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| POST | /api/projects/{pid}/roles/assign | secrets_envs.py | 143 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| POST | /api/projects/{pid}/secrets | secrets_envs.py | 47 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| POST | /api/projects/{pid}/secure-files | pipelines_ci.py | 95 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| POST | /api/projects/{pid}/security-alerts | workflows_security.py | 172 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| POST | /api/projects/{pid}/security-scans | gitlab_features.py | 147 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/service-desk | gitlab_features.py | 116 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/sprints | agile_delivery.py | 46 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/sprints/{sid}/assign | agile_delivery.py | 92 | Add to API_DOC_SUMMARY.md under agile_delivery.py |
| POST | /api/projects/{pid}/star | notifications_social.py | 67 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| POST | /api/projects/{pid}/status-page/components | gitlab_features.py | 304 | Add to API_DOC_SUMMARY.md under gitlab_features.py |
| POST | /api/projects/{pid}/task-groups | pipelines_ci.py | 135 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| POST | /api/projects/{pid}/test-plans | test_plans.py | 38 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/test-plans/{plan_id}/suites | test_plans.py | 67 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/test-runs | test_plans.py | 134 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/test-runs/{run_id}/complete | test_plans.py | 172 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/test-runs/{run_id}/results | test_plans.py | 150 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/test-suites/{suite_id}/cases | test_plans.py | 93 | Add to API_DOC_SUMMARY.md under test_plans.py |
| POST | /api/projects/{pid}/time | wiki_time_epics.py | 122 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| POST | /api/projects/{pid}/variable-groups | pipelines_ci.py | 41 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| POST | /api/projects/{pid}/wiki | wiki_time_epics.py | 39 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| POST | /api/projects/{pid}/workflows | workflows_security.py | 34 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| POST | /api/projects/{pid}/workflows/{wid}/runs/{runId}/cancel | workflows_security.py | 132 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| POST | /api/projects/{pid}/workflows/{wid}/trigger | workflows_security.py | 51 | Add to API_DOC_SUMMARY.md under workflows_security.py |
| POST | /api/projects/{project_id}/branches | projects.py | 243 | Add to API_DOC_SUMMARY.md under projects.py |
| POST | /api/projects/{project_id}/commits | projects.py | 1225 | Add to API_DOC_SUMMARY.md under projects.py |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks | audio_checks.py | 26 | Add to API_DOC_SUMMARY.md under audio_checks.py |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks/run | audio_checks.py | 92 | Add to API_DOC_SUMMARY.md under audio_checks.py |
| POST | /api/projects/{project_id}/discussions | discussions.py | 53 | Add to API_DOC_SUMMARY.md under discussions.py |
| POST | /api/projects/{project_id}/discussions/{disc_id}/comments | discussions.py | 97 | Add to API_DOC_SUMMARY.md under discussions.py |
| POST | /api/projects/{project_id}/kanban | kanban.py | 54 | Add to API_DOC_SUMMARY.md under kanban.py |
| POST | /api/projects/{project_id}/kanban/{board_id}/cards | kanban.py | 76 | Add to API_DOC_SUMMARY.md under kanban.py |
| POST | /api/projects/{project_id}/merge | projects.py | 294 | Add to API_DOC_SUMMARY.md under projects.py |
| POST | /api/projects/{project_id}/protection | branch_protection.py | 47 | Add to API_DOC_SUMMARY.md under branch_protection.py |
| POST | /api/projects/{project_id}/pull-requests | pull_requests.py | 115 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| POST | /api/projects/{project_id}/pull-requests/{pr_id}/comments | pull_requests.py | 392 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| POST | /api/projects/{project_id}/pull-requests/{pr_id}/merge | pull_requests.py | 179 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| POST | /api/projects/{project_id}/pull-requests/{pr_id}/reviews | pull_requests.py | 353 | Add to API_DOC_SUMMARY.md under pull_requests.py |
| POST | /api/projects/{project_id}/push | projects.py | 554 | Add to API_DOC_SUMMARY.md under projects.py |
| POST | /api/projects/{project_id}/storage-lifecycle | projects.py | 1527 | Add to API_DOC_SUMMARY.md under projects.py |
| POST | /api/projects/{project_id}/tags | tags_releases.py | 44 | Add to API_DOC_SUMMARY.md under tags_releases.py |
| POST | /api/projects/{project_id}/tags/{tag_name}/release-notes | tags_releases.py | 96 | Add to API_DOC_SUMMARY.md under tags_releases.py |
| POST | /api/projects/{project_id}/tasks | tasks.py | 89 | Add to API_DOC_SUMMARY.md under tasks.py |
| POST | /api/projects/{project_id}/tasks/{task_id}/comments | tasks.py | 196 | Add to API_DOC_SUMMARY.md under tasks.py |
| POST | /api/projects/{project_id}/tasks/{task_id}/move/{column_id} | tasks.py | 257 | Add to API_DOC_SUMMARY.md under tasks.py |
| POST | /api/release-packages | release_packages.py | 30 | Add to API_DOC_SUMMARY.md under release_packages.py |
| POST | /api/reminders/evaluate | reminders.py | 12 | Add to API_DOC_SUMMARY.md under reminders.py |
| POST | /api/reminders/run-all | reminders.py | 24 | Add to API_DOC_SUMMARY.md under reminders.py |
| POST | /api/reminders/send | reminders.py | 18 | Add to API_DOC_SUMMARY.md under reminders.py |
| POST | /api/sessions | sessions.py | 514 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/public/{share_token}/submit-feedback | sessions.py | 1054 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/approvals | sessions.py | 478 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/comments | sessions.py | 450 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/versions/{version_id}/stems | sessions.py | 973 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/{session_id}/change-orders | change_orders.py | 31 | Add to API_DOC_SUMMARY.md under change_orders.py |
| POST | /api/sessions/{session_id}/pins | pins.py | 30 | Add to API_DOC_SUMMARY.md under pins.py |
| POST | /api/sessions/{session_id}/references | references.py | 31 | Add to API_DOC_SUMMARY.md under references.py |
| POST | /api/sessions/{session_id}/roles | roles.py | 26 | Add to API_DOC_SUMMARY.md under roles.py |
| POST | /api/sessions/{session_id}/status | sessions.py | 900 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/{session_id}/versions | sessions.py | 593 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/{session_id}/versions/{version_id}/comments | sessions.py | 853 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sessions/{session_id}/versions/{version_id}/status | sessions.py | 887 | Add to API_DOC_SUMMARY.md under sessions.py |
| POST | /api/sponsors | packages_gist_sponsors.py | 126 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/storage/cleanup | storage.py | 393 | Add to API_DOC_SUMMARY.md under storage.py |
| POST | /api/storage/objects/{object_id}/download-url | storage.py | 315 | Add to API_DOC_SUMMARY.md under storage.py |
| POST | /api/storage/uploads | storage.py | 133 | Add to API_DOC_SUMMARY.md under storage.py |
| POST | /api/storage/uploads/{object_id}/complete | storage.py | 232 | Add to API_DOC_SUMMARY.md under storage.py |
| POST | /api/tags | tags.py | 34 | Add to API_DOC_SUMMARY.md under tags.py |
| POST | /api/tags/session/{session_id} | tags.py | 57 | Add to API_DOC_SUMMARY.md under tags.py |
| POST | /api/teams | packages_gist_sponsors.py | 149 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/teams/{tid}/members | packages_gist_sponsors.py | 163 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/teams/{tid}/projects | packages_gist_sponsors.py | 181 | Add to API_DOC_SUMMARY.md under packages_gist_sponsors.py |
| POST | /api/templates | templates.py | 19 | Add to API_DOC_SUMMARY.md under templates.py |
| POST | /api/unified-search/index | search_engine.py | 71 | Add to API_DOC_SUMMARY.md under search_engine.py |
| POST | /api/unified-search/reindex | search_engine.py | 89 | Add to API_DOC_SUMMARY.md under search_engine.py |
| POST | /api/unified-search/saved | search_engine.py | 131 | Add to API_DOC_SUMMARY.md under search_engine.py |
| POST | /api/versions/{version_id}/stems | versions.py | 64 | Add to API_DOC_SUMMARY.md under versions.py |
| POST | /api/webhooks | webhooks.py | 30 | Add to API_DOC_SUMMARY.md under webhooks.py |
| POST | /api/workflow-runs/{run_id}/artifacts | pipelines_ci.py | 177 | Add to API_DOC_SUMMARY.md under pipelines_ci.py |
| PUT | /api/functions/{function_id} | compute.py | 98 | Add to API_DOC_SUMMARY.md under compute.py |
| PUT | /api/monitoring/alarms/{alarm_id} | monitoring.py | 248 | Add to API_DOC_SUMMARY.md under monitoring.py |
| PUT | /api/projects/{pid}/push-rules | secrets_envs.py | 174 | Add to API_DOC_SUMMARY.md under secrets_envs.py |
| PUT | /api/projects/{pid}/watch | notifications_social.py | 91 | Add to API_DOC_SUMMARY.md under notifications_social.py |
| PUT | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 67 | Add to API_DOC_SUMMARY.md under wiki_time_epics.py |
| PUT | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 104 | Add to API_DOC_SUMMARY.md under workflows_security.py |

## Stale Documentation

| Method | Path | Suggested Fix |
|--------|------|---------------|
| GET | /`/{project_id}/diff` | Remove from API_DOC_SUMMARY.md (no longer exists) |
| GET | /`/{project_id}/files/{file_path:path}` | Remove from API_DOC_SUMMARY.md (no longer exists) |
| POST | /`/{project_id}/storage-lifecycle` | Remove from API_DOC_SUMMARY.md (no longer exists) |

## Potentially Missing Authentication

| Method | Path | File | Line Number | Evidence |
|--------|------|------|-------------|----------|
| DELETE | /api/2fa | two_factor.py | 125 | No auth-like dependency found in decorator |
| DELETE | /api/functions/triggers/{trigger_id} | compute.py | 148 | No auth-like dependency found in decorator |
| DELETE | /api/functions/{function_id} | compute.py | 107 | No auth-like dependency found in decorator |
| DELETE | /api/gateway/keys/{key_id} | api_gateway.py | 70 | No auth-like dependency found in decorator |
| DELETE | /api/gateway/keys/{key_id}/permanent | api_gateway.py | 77 | No auth-like dependency found in decorator |
| DELETE | /api/gateway/rules/{rule_id} | api_gateway.py | 128 | No auth-like dependency found in decorator |
| DELETE | /api/gists/{gid} | packages_gist_sponsors.py | 99 | No auth-like dependency found in decorator |
| DELETE | /api/groups/session/{session_id}/{group_id} | groups.py | 65 | No auth-like dependency found in decorator |
| DELETE | /api/groups/{group_id} | groups.py | 49 | No auth-like dependency found in decorator |
| DELETE | /api/iam/assignments/{assignment_id} | iam.py | 131 | No auth-like dependency found in decorator |
| DELETE | /api/iam/policies/{policy_id} | iam.py | 114 | No auth-like dependency found in decorator |
| DELETE | /api/iam/roles/{role_id} | iam.py | 97 | No auth-like dependency found in decorator |
| DELETE | /api/integrations/{integration_id} | integrations.py | 254 | No auth-like dependency found in decorator |
| DELETE | /api/jobs/{job_id} | jobs.py | 165 | No auth-like dependency found in decorator |
| DELETE | /api/monitoring/alarms/{alarm_id} | monitoring.py | 257 | No auth-like dependency found in decorator |
| DELETE | /api/monitoring/logs/groups/{name} | monitoring.py | 179 | No auth-like dependency found in decorator |
| DELETE | /api/notifications/subscriptions/{subscription_id} | notifications.py | 105 | No auth-like dependency found in decorator |
| DELETE | /api/notifications/topics/{topic_id} | notifications.py | 80 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/approval-gates/{gid} | pipelines_ci.py | 222 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/branch-permissions/{bid} | deployments_artifacts.py | 370 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/codeowners/{owner_id} | codeowners_milestones.py | 43 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/secrets/{sid} | secrets_envs.py | 61 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/secure-files/{fid} | pipelines_ci.py | 110 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/variable-groups/{gid} | pipelines_ci.py | 66 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/watch | notifications_social.py | 102 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 83 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 122 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id} | projects.py | 219 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id}/branches/{branch_name} | projects.py | 276 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id}/discussions/{disc_id} | discussions.py | 87 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id}/kanban/{board_id}/cards/{card_id} | kanban.py | 108 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id}/protection/{branch_name} | branch_protection.py | 123 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id}/tags/{tag_name} | tags_releases.py | 69 | No auth-like dependency found in decorator |
| DELETE | /api/projects/{project_id}/tasks/{task_id} | tasks.py | 186 | No auth-like dependency found in decorator |
| DELETE | /api/sessions/{session_id} | sessions.py | 1208 | No auth-like dependency found in decorator |
| DELETE | /api/sessions/{session_id}/pins/{version_id} | pins.py | 56 | No auth-like dependency found in decorator |
| DELETE | /api/sessions/{session_id}/references/{reference_id} | references.py | 51 | No auth-like dependency found in decorator |
| DELETE | /api/sessions/{session_id}/roles/{member_id} | roles.py | 53 | No auth-like dependency found in decorator |
| DELETE | /api/storage/objects/{object_id} | storage.py | 337 | No auth-like dependency found in decorator |
| DELETE | /api/tags/session/{session_id}/{tag_id} | tags.py | 65 | No auth-like dependency found in decorator |
| DELETE | /api/tags/{tag_id} | tags.py | 49 | No auth-like dependency found in decorator |
| DELETE | /api/templates/{template_id} | templates.py | 42 | No auth-like dependency found in decorator |
| DELETE | /api/unified-search/index/{entity_type}/{entity_id} | search_engine.py | 82 | No auth-like dependency found in decorator |
| DELETE | /api/unified-search/saved/{sid} | search_engine.py | 144 | No auth-like dependency found in decorator |
| DELETE | /api/webhooks/{webhook_id} | webhooks.py | 62 | No auth-like dependency found in decorator |
| PATCH | /api/auth/me | auth.py | 81 | No auth-like dependency found in decorator |
| PATCH | /api/groups/{group_id} | groups.py | 40 | No auth-like dependency found in decorator |
| PATCH | /api/integrations/{integration_id} | integrations.py | 242 | No auth-like dependency found in decorator |
| PATCH | /api/notifications/{nid}/read | notifications_social.py | 32 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/deployments/{did} | deployments_artifacts.py | 238 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/errors/{eid} | gitlab_features.py | 215 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/feature-flags/{fid} | gitlab_features.py | 195 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/incidents/{iid} | gitlab_features.py | 251 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/milestones/{mid} | codeowners_milestones.py | 93 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/mirrors/{mid} | code_search_and_insights.py | 143 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/retros/{rid} | agile_delivery.py | 140 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/security-alerts/{aid} | workflows_security.py | 180 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/service-desk/{tid} | gitlab_features.py | 127 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/sprints/{sid} | agile_delivery.py | 62 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/task-groups/{gid} | pipelines_ci.py | 146 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/test-cases/{case_id} | test_plans.py | 104 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/variable-groups/{gid} | pipelines_ci.py | 52 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{pid}/workflows/{wid}/runs/{rid} | workflows_security.py | 80 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id} | projects.py | 206 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id}/discussions/{disc_id} | discussions.py | 72 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id}/discussions/{disc_id}/comments/{comment_id}/accept | discussions.py | 119 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id}/kanban/{board_id}/cards/{card_id} | kanban.py | 91 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id}/protection/{branch_name} | branch_protection.py | 92 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id}/pull-requests/{pr_id} | pull_requests.py | 157 | No auth-like dependency found in decorator |
| PATCH | /api/projects/{project_id}/tasks/{task_id} | tasks.py | 166 | No auth-like dependency found in decorator |
| PATCH | /api/release-packages/{package_id}/lock | release_packages.py | 67 | No auth-like dependency found in decorator |
| PATCH | /api/sessions/{session_id}/brief | sessions.py | 576 | No auth-like dependency found in decorator |
| PATCH | /api/sessions/{session_id}/change-orders/{order_id}/accept | change_orders.py | 63 | No auth-like dependency found in decorator |
| PATCH | /api/sessions/{session_id}/change-orders/{order_id}/decline | change_orders.py | 81 | No auth-like dependency found in decorator |
| PATCH | /api/sessions/{session_id}/change-orders/{order_id}/quote | change_orders.py | 47 | No auth-like dependency found in decorator |
| PATCH | /api/sessions/{session_id}/share | sessions.py | 534 | No auth-like dependency found in decorator |
| PATCH | /api/sessions/{session_id}/versions/{version_id}/comments/{comment_id} | sessions.py | 871 | No auth-like dependency found in decorator |
| PATCH | /api/tags/{tag_id} | tags.py | 40 | No auth-like dependency found in decorator |
| PATCH | /api/templates/{template_id} | templates.py | 33 | No auth-like dependency found in decorator |
| PATCH | /api/webhooks/{webhook_id} | webhooks.py | 45 | No auth-like dependency found in decorator |
| POST | /api/2fa/setup | two_factor.py | 62 | No auth-like dependency found in decorator |
| POST | /api/2fa/validate | two_factor.py | 146 | No auth-like dependency found in decorator |
| POST | /api/2fa/verify | two_factor.py | 88 | No auth-like dependency found in decorator |
| POST | /api/ai/analyze | ai_mix.py | 40 | No auth-like dependency found in decorator |
| POST | /api/assets/stems | assets.py | 672 | No auth-like dependency found in decorator |
| POST | /api/assets/{asset_id}/receipt | assets.py | 624 | No auth-like dependency found in decorator |
| POST | /api/auth/login | auth.py | 36 | No auth-like dependency found in decorator |
| POST | /api/auth/register | auth.py | 23 | No auth-like dependency found in decorator |
| POST | /api/auth/wallet/login | auth.py | 54 | No auth-like dependency found in decorator |
| POST | /api/auth/wallet/nonce | auth.py | 45 | No auth-like dependency found in decorator |
| POST | /api/comparisons/references | comparisons.py | 41 | No auth-like dependency found in decorator |
| POST | /api/comparisons/versions | comparisons.py | 21 | No auth-like dependency found in decorator |
| POST | /api/extensions | code_search_and_insights.py | 178 | No auth-like dependency found in decorator |
| POST | /api/files/upload | files.py | 14 | No auth-like dependency found in decorator |
| POST | /api/functions | compute.py | 74 | No auth-like dependency found in decorator |
| POST | /api/functions/{function_id}/invoke | compute.py | 116 | No auth-like dependency found in decorator |
| POST | /api/functions/{function_id}/triggers | compute.py | 135 | No auth-like dependency found in decorator |
| POST | /api/gateway/keys | api_gateway.py | 53 | No auth-like dependency found in decorator |
| POST | /api/gateway/keys/{key_id}/check-limit | api_gateway.py | 103 | No auth-like dependency found in decorator |
| POST | /api/gateway/keys/{key_id}/validate | api_gateway.py | 93 | No auth-like dependency found in decorator |
| POST | /api/gateway/rules | api_gateway.py | 116 | No auth-like dependency found in decorator |
| POST | /api/gists | packages_gist_sponsors.py | 79 | No auth-like dependency found in decorator |
| POST | /api/groups | groups.py | 34 | No auth-like dependency found in decorator |
| POST | /api/groups/session/{session_id} | groups.py | 57 | No auth-like dependency found in decorator |
| POST | /api/iam/audit | iam.py | 161 | No auth-like dependency found in decorator |
| POST | /api/iam/check-permission | iam.py | 150 | No auth-like dependency found in decorator |
| POST | /api/iam/init-system-roles | iam.py | 171 | No auth-like dependency found in decorator |
| POST | /api/iam/roles | iam.py | 76 | No auth-like dependency found in decorator |
| POST | /api/iam/roles/{role_id}/assign | iam.py | 123 | No auth-like dependency found in decorator |
| POST | /api/iam/roles/{role_id}/policies | iam.py | 106 | No auth-like dependency found in decorator |
| POST | /api/integrations | integrations.py | 227 | No auth-like dependency found in decorator |
| POST | /api/integrations/{integration_id}/test | integrations.py | 264 | No auth-like dependency found in decorator |
| POST | /api/jobs | jobs.py | 81 | No auth-like dependency found in decorator |
| POST | /api/jobs/batch | jobs.py | 241 | No auth-like dependency found in decorator |
| POST | /api/jobs/{job_id}/retry | jobs.py | 185 | No auth-like dependency found in decorator |
| POST | /api/monitoring/alarms | monitoring.py | 231 | No auth-like dependency found in decorator |
| POST | /api/monitoring/alarms/evaluate | monitoring.py | 263 | No auth-like dependency found in decorator |
| POST | /api/monitoring/logs/events | monitoring.py | 212 | No auth-like dependency found in decorator |
| POST | /api/monitoring/logs/events/query | monitoring.py | 220 | No auth-like dependency found in decorator |
| POST | /api/monitoring/logs/groups | monitoring.py | 166 | No auth-like dependency found in decorator |
| POST | /api/monitoring/logs/streams | monitoring.py | 196 | No auth-like dependency found in decorator |
| POST | /api/monitoring/metrics | monitoring.py | 138 | No auth-like dependency found in decorator |
| POST | /api/monitoring/metrics/statistics | monitoring.py | 151 | No auth-like dependency found in decorator |
| POST | /api/monitoring/namespaces | monitoring.py | 122 | No auth-like dependency found in decorator |
| POST | /api/notifications/read-all | notifications_social.py | 42 | No auth-like dependency found in decorator |
| POST | /api/notifications/topics | notifications.py | 56 | No auth-like dependency found in decorator |
| POST | /api/notifications/topics/{topic_id}/publish | notifications.py | 115 | No auth-like dependency found in decorator |
| POST | /api/notifications/topics/{topic_id}/subscribe | notifications.py | 90 | No auth-like dependency found in decorator |
| POST | /api/packages | packages_gist_sponsors.py | 39 | No auth-like dependency found in decorator |
| POST | /api/packages/{pkg_id}/download | packages_gist_sponsors.py | 55 | No auth-like dependency found in decorator |
| POST | /api/projects | projects.py | 173 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/approval-gates | pipelines_ci.py | 210 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/artifact-feeds | deployments_artifacts.py | 42 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/artifact-feeds/{fid}/packages | deployments_artifacts.py | 69 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/branch-permissions | deployments_artifacts.py | 358 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/calendar | wiki_time_epics.py | 218 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/code-insights | code_search_and_insights.py | 93 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/code-search/index | code_search_and_insights.py | 32 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/codeowners | codeowners_milestones.py | 29 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/deployments | deployments_artifacts.py | 226 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/designs | gitlab_features.py | 81 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/designs/{did}/comments | gitlab_features.py | 90 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/environments | secrets_envs.py | 84 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/environments/{eid}/approvals/{aid}/approve | deployments_artifacts.py | 264 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/environments/{eid}/approvals/{aid}/reject | deployments_artifacts.py | 277 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/epics | wiki_time_epics.py | 153 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/epics/{eid}/tasks/{tid} | wiki_time_epics.py | 164 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/extensions/{eid}/install | code_search_and_insights.py | 187 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/feature-flags | gitlab_features.py | 186 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/fork | notifications_social.py | 119 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/incidents | gitlab_features.py | 242 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/ip-allowlist | secrets_envs.py | 201 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/lfs | secrets_envs.py | 108 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/load-tests | test_plans.py | 201 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/load-tests/{tid}/run | test_plans.py | 213 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/merge-trains/{pr_id} | gitlab_features.py | 37 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/milestones | codeowners_milestones.py | 79 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/mirrors | code_search_and_insights.py | 122 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/mirrors/{mid}/sync | code_search_and_insights.py | 132 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/okrs | gitlab_features.py | 331 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/okrs/{oid}/key-results | gitlab_features.py | 345 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/oncall | gitlab_features.py | 278 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/release-approvals | agile_delivery.py | 208 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/release-approvals/{raid}/approve | agile_delivery.py | 219 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/release-approvals/{raid}/reject | agile_delivery.py | 231 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/requirements | gitlab_features.py | 63 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/retro-items/{iid}/vote | agile_delivery.py | 181 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/retros | agile_delivery.py | 129 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/retros/{rid}/items | agile_delivery.py | 170 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/roadmap | wiki_time_epics.py | 192 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/roles | secrets_envs.py | 130 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/roles/assign | secrets_envs.py | 143 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/secrets | secrets_envs.py | 47 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/secure-files | pipelines_ci.py | 95 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/security-alerts | workflows_security.py | 172 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/security-scans | gitlab_features.py | 147 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/service-desk | gitlab_features.py | 116 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/sprints | agile_delivery.py | 46 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/sprints/{sid}/assign | agile_delivery.py | 92 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/star | notifications_social.py | 67 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/status-page/components | gitlab_features.py | 304 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/task-groups | pipelines_ci.py | 135 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/test-plans | test_plans.py | 38 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/test-plans/{plan_id}/suites | test_plans.py | 67 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/test-runs | test_plans.py | 134 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/test-runs/{run_id}/complete | test_plans.py | 172 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/test-runs/{run_id}/results | test_plans.py | 150 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/test-suites/{suite_id}/cases | test_plans.py | 93 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/time | wiki_time_epics.py | 122 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/variable-groups | pipelines_ci.py | 41 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/wiki | wiki_time_epics.py | 39 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/workflows | workflows_security.py | 34 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/workflows/{wid}/runs/{runId}/cancel | workflows_security.py | 132 | No auth-like dependency found in decorator |
| POST | /api/projects/{pid}/workflows/{wid}/trigger | workflows_security.py | 51 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/branches | projects.py | 243 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/commits | projects.py | 1225 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks | audio_checks.py | 26 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/commits/{commit_id}/checks/run | audio_checks.py | 92 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/discussions | discussions.py | 53 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/discussions/{disc_id}/comments | discussions.py | 97 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/kanban | kanban.py | 54 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/kanban/{board_id}/cards | kanban.py | 76 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/merge | projects.py | 294 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/protection | branch_protection.py | 47 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/pull-requests | pull_requests.py | 115 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/pull-requests/{pr_id}/comments | pull_requests.py | 392 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/pull-requests/{pr_id}/merge | pull_requests.py | 179 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/pull-requests/{pr_id}/reviews | pull_requests.py | 353 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/push | projects.py | 554 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/storage-lifecycle | projects.py | 1527 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/tags | tags_releases.py | 44 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/tags/{tag_name}/release-notes | tags_releases.py | 96 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/tasks | tasks.py | 89 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/tasks/{task_id}/comments | tasks.py | 196 | No auth-like dependency found in decorator |
| POST | /api/projects/{project_id}/tasks/{task_id}/move/{column_id} | tasks.py | 257 | No auth-like dependency found in decorator |
| POST | /api/release-packages | release_packages.py | 30 | No auth-like dependency found in decorator |
| POST | /api/reminders/evaluate | reminders.py | 12 | No auth-like dependency found in decorator |
| POST | /api/reminders/run-all | reminders.py | 24 | No auth-like dependency found in decorator |
| POST | /api/reminders/send | reminders.py | 18 | No auth-like dependency found in decorator |
| POST | /api/sessions | sessions.py | 514 | No auth-like dependency found in decorator |
| POST | /api/sessions/public/{share_token}/submit-feedback | sessions.py | 1054 | No auth-like dependency found in decorator |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/approvals | sessions.py | 478 | No auth-like dependency found in decorator |
| POST | /api/sessions/public/{share_token}/versions/{version_id}/comments | sessions.py | 450 | No auth-like dependency found in decorator |
| POST | /api/sessions/versions/{version_id}/stems | sessions.py | 973 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/change-orders | change_orders.py | 31 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/pins | pins.py | 30 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/references | references.py | 31 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/roles | roles.py | 26 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/status | sessions.py | 900 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/versions | sessions.py | 593 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/versions/{version_id}/comments | sessions.py | 853 | No auth-like dependency found in decorator |
| POST | /api/sessions/{session_id}/versions/{version_id}/status | sessions.py | 887 | No auth-like dependency found in decorator |
| POST | /api/sponsors | packages_gist_sponsors.py | 126 | No auth-like dependency found in decorator |
| POST | /api/storage/cleanup | storage.py | 393 | No auth-like dependency found in decorator |
| POST | /api/storage/objects/{object_id}/download-url | storage.py | 315 | No auth-like dependency found in decorator |
| POST | /api/storage/uploads | storage.py | 133 | No auth-like dependency found in decorator |
| POST | /api/storage/uploads/{object_id}/complete | storage.py | 232 | No auth-like dependency found in decorator |
| POST | /api/tags | tags.py | 34 | No auth-like dependency found in decorator |
| POST | /api/tags/session/{session_id} | tags.py | 57 | No auth-like dependency found in decorator |
| POST | /api/teams | packages_gist_sponsors.py | 149 | No auth-like dependency found in decorator |
| POST | /api/teams/{tid}/members | packages_gist_sponsors.py | 163 | No auth-like dependency found in decorator |
| POST | /api/teams/{tid}/projects | packages_gist_sponsors.py | 181 | No auth-like dependency found in decorator |
| POST | /api/templates | templates.py | 19 | No auth-like dependency found in decorator |
| POST | /api/unified-search/index | search_engine.py | 71 | No auth-like dependency found in decorator |
| POST | /api/unified-search/reindex | search_engine.py | 89 | No auth-like dependency found in decorator |
| POST | /api/unified-search/saved | search_engine.py | 131 | No auth-like dependency found in decorator |
| POST | /api/versions/{version_id}/stems | versions.py | 64 | No auth-like dependency found in decorator |
| POST | /api/webhooks | webhooks.py | 30 | No auth-like dependency found in decorator |
| POST | /api/workflow-runs/{run_id}/artifacts | pipelines_ci.py | 177 | No auth-like dependency found in decorator |
| PUT | /api/functions/{function_id} | compute.py | 98 | No auth-like dependency found in decorator |
| PUT | /api/monitoring/alarms/{alarm_id} | monitoring.py | 248 | No auth-like dependency found in decorator |
| PUT | /api/projects/{pid}/push-rules | secrets_envs.py | 174 | No auth-like dependency found in decorator |
| PUT | /api/projects/{pid}/watch | notifications_social.py | 91 | No auth-like dependency found in decorator |
| PUT | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 67 | No auth-like dependency found in decorator |
| PUT | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 104 | No auth-like dependency found in decorator |

## Missing Response Model

| Method | Path | File | Line Number |
|--------|------|------|-------------|
| DELETE | /api/2fa | two_factor.py | 125 |
| DELETE | /api/functions/triggers/{trigger_id} | compute.py | 148 |
| DELETE | /api/functions/{function_id} | compute.py | 107 |
| DELETE | /api/gateway/keys/{key_id} | api_gateway.py | 70 |
| DELETE | /api/gateway/keys/{key_id}/permanent | api_gateway.py | 77 |
| DELETE | /api/gateway/rules/{rule_id} | api_gateway.py | 128 |
| DELETE | /api/gists/{gid} | packages_gist_sponsors.py | 99 |
| DELETE | /api/groups/session/{session_id}/{group_id} | groups.py | 65 |
| DELETE | /api/groups/{group_id} | groups.py | 49 |
| DELETE | /api/iam/assignments/{assignment_id} | iam.py | 131 |
| DELETE | /api/iam/policies/{policy_id} | iam.py | 114 |
| DELETE | /api/iam/roles/{role_id} | iam.py | 97 |
| DELETE | /api/integrations/{integration_id} | integrations.py | 254 |
| DELETE | /api/jobs/{job_id} | jobs.py | 165 |
| DELETE | /api/monitoring/alarms/{alarm_id} | monitoring.py | 257 |
| DELETE | /api/monitoring/logs/groups/{name} | monitoring.py | 179 |
| DELETE | /api/notifications/subscriptions/{subscription_id} | notifications.py | 105 |
| DELETE | /api/notifications/topics/{topic_id} | notifications.py | 80 |
| DELETE | /api/projects/{pid}/approval-gates/{gid} | pipelines_ci.py | 222 |
| DELETE | /api/projects/{pid}/branch-permissions/{bid} | deployments_artifacts.py | 370 |
| DELETE | /api/projects/{pid}/codeowners/{owner_id} | codeowners_milestones.py | 43 |
| DELETE | /api/projects/{pid}/secrets/{sid} | secrets_envs.py | 61 |
| DELETE | /api/projects/{pid}/secure-files/{fid} | pipelines_ci.py | 110 |
| DELETE | /api/projects/{pid}/variable-groups/{gid} | pipelines_ci.py | 66 |
| DELETE | /api/projects/{pid}/watch | notifications_social.py | 102 |
| DELETE | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 83 |
| DELETE | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 122 |
| DELETE | /api/projects/{project_id} | projects.py | 219 |
| DELETE | /api/projects/{project_id}/branches/{branch_name} | projects.py | 276 |
| DELETE | /api/projects/{project_id}/discussions/{disc_id} | discussions.py | 87 |
| DELETE | /api/projects/{project_id}/kanban/{board_id}/cards/{card_id} | kanban.py | 108 |
| DELETE | /api/projects/{project_id}/protection/{branch_name} | branch_protection.py | 123 |
| DELETE | /api/projects/{project_id}/tags/{tag_name} | tags_releases.py | 69 |
| DELETE | /api/projects/{project_id}/tasks/{task_id} | tasks.py | 186 |
| DELETE | /api/sessions/{session_id} | sessions.py | 1208 |
| DELETE | /api/sessions/{session_id}/pins/{version_id} | pins.py | 56 |
| DELETE | /api/sessions/{session_id}/references/{reference_id} | references.py | 51 |
| DELETE | /api/sessions/{session_id}/roles/{member_id} | roles.py | 53 |
| DELETE | /api/storage/objects/{object_id} | storage.py | 337 |
| DELETE | /api/tags/session/{session_id}/{tag_id} | tags.py | 65 |
| DELETE | /api/tags/{tag_id} | tags.py | 49 |
| DELETE | /api/templates/{template_id} | templates.py | 42 |
| DELETE | /api/unified-search/index/{entity_type}/{entity_id} | search_engine.py | 82 |
| DELETE | /api/unified-search/saved/{sid} | search_engine.py | 144 |
| DELETE | /api/webhooks/{webhook_id} | webhooks.py | 62 |
| GET | /api/ai/presets | ai_mix.py | 97 |
| GET | /api/ai/quick-check | ai_mix.py | 75 |
| GET | /api/artifacts/search | deployments_artifacts.py | 84 |
| GET | /api/assets | assets.py | 20 |
| GET | /api/assets/recommend | assets.py | 464 |
| GET | /api/assets/{asset_id}/download | assets.py | 262 |
| GET | /api/assets/{asset_id}/download64 | assets.py | 362 |
| GET | /api/assets/{asset_id}/preview | assets.py | 177 |
| GET | /api/dashboard | dashboard.py | 24 |
| GET | /api/dashboard/projects/{project_id} | dashboard.py | 98 |
| GET | /api/demo/review | demo.py | 15 |
| GET | /api/extensions | code_search_and_insights.py | 158 |
| GET | /api/files/{sha} | files.py | 24 |
| GET | /api/functions | compute.py | 85 |
| GET | /api/functions/invocations | compute.py | 157 |
| GET | /api/functions/invocations/{invocation_id} | compute.py | 167 |
| GET | /api/functions/{function_id} | compute.py | 90 |
| GET | /api/functions/{function_id}/stats | compute.py | 124 |
| GET | /api/functions/{function_id}/triggers | compute.py | 143 |
| GET | /api/gateway/keys | api_gateway.py | 64 |
| GET | /api/gateway/keys/{key_id}/usage | api_gateway.py | 84 |
| GET | /api/gateway/rules | api_gateway.py | 122 |
| GET | /api/gists | packages_gist_sponsors.py | 67 |
| GET | /api/gists/{gid} | packages_gist_sponsors.py | 90 |
| GET | /api/graphql | workflows_security.py | 213 |
| GET | /api/graphql/schema | workflows_security.py | 229 |
| GET | /api/iam/assignments | iam.py | 137 |
| GET | /api/iam/roles | iam.py | 84 |
| GET | /api/iam/roles/{role_id} | iam.py | 89 |
| GET | /api/integrations/events | integrations.py | 209 |
| GET | /api/jobs | jobs.py | 114 |
| GET | /api/monitoring/alarms | monitoring.py | 243 |
| GET | /api/monitoring/logs/groups | monitoring.py | 174 |
| GET | /api/monitoring/logs/groups/{name}/stats | monitoring.py | 185 |
| GET | /api/monitoring/logs/streams | monitoring.py | 204 |
| GET | /api/monitoring/metrics | monitoring.py | 146 |
| GET | /api/monitoring/namespaces | monitoring.py | 130 |
| GET | /api/notifications | notifications_social.py | 16 |
| GET | /api/notifications/count | notifications_social.py | 25 |
| GET | /api/notifications/topics | notifications.py | 65 |
| GET | /api/notifications/topics/{topic_id} | notifications.py | 71 |
| GET | /api/notifications/topics/{topic_id}/stats | notifications.py | 129 |
| GET | /api/notifications/topics/{topic_id}/subscriptions | notifications.py | 99 |
| GET | /api/packages | packages_gist_sponsors.py | 18 |
| GET | /api/packages/{pkg_id} | packages_gist_sponsors.py | 47 |
| GET | /api/portfolio/{username} | portfolio.py | 20 |
| GET | /api/projects/{pid}/approval-gates | pipelines_ci.py | 194 |
| GET | /api/projects/{pid}/artifact-feeds | deployments_artifacts.py | 28 |
| GET | /api/projects/{pid}/artifact-feeds/{fid}/packages | deployments_artifacts.py | 53 |
| GET | /api/projects/{pid}/artifact-feeds/{fid}/stats | deployments_artifacts.py | 173 |
| GET | /api/projects/{pid}/audit | gitlab_features.py | 356 |
| GET | /api/projects/{pid}/branch-permissions | deployments_artifacts.py | 293 |
| GET | /api/projects/{pid}/calendar | wiki_time_epics.py | 203 |
| GET | /api/projects/{pid}/code-insights | code_search_and_insights.py | 81 |
| GET | /api/projects/{pid}/code-search | code_search_and_insights.py | 56 |
| GET | /api/projects/{pid}/codeowners | codeowners_milestones.py | 16 |
| GET | /api/projects/{pid}/deployments | deployments_artifacts.py | 208 |
| GET | /api/projects/{pid}/designs | gitlab_features.py | 74 |
| GET | /api/projects/{pid}/environments | secrets_envs.py | 72 |
| GET | /api/projects/{pid}/environments/{eid}/approvals | deployments_artifacts.py | 255 |
| GET | /api/projects/{pid}/epics | wiki_time_epics.py | 135 |
| GET | /api/projects/{pid}/errors | gitlab_features.py | 208 |
| GET | /api/projects/{pid}/extensions | code_search_and_insights.py | 202 |
| GET | /api/projects/{pid}/feature-flags | gitlab_features.py | 174 |
| GET | /api/projects/{pid}/forks | notifications_social.py | 113 |
| GET | /api/projects/{pid}/incidents | gitlab_features.py | 230 |
| GET | /api/projects/{pid}/ip-allowlist | secrets_envs.py | 190 |
| GET | /api/projects/{pid}/lfs | secrets_envs.py | 95 |
| GET | /api/projects/{pid}/load-tests | test_plans.py | 186 |
| GET | /api/projects/{pid}/merge-trains | gitlab_features.py | 30 |
| GET | /api/projects/{pid}/milestones | codeowners_milestones.py | 54 |
| GET | /api/projects/{pid}/mirrors | code_search_and_insights.py | 109 |
| GET | /api/projects/{pid}/okrs | gitlab_features.py | 315 |
| GET | /api/projects/{pid}/oncall | gitlab_features.py | 267 |
| GET | /api/projects/{pid}/push-rules | secrets_envs.py | 157 |
| GET | /api/projects/{pid}/registry | gitlab_features.py | 165 |
| GET | /api/projects/{pid}/release-approvals | agile_delivery.py | 194 |
| GET | /api/projects/{pid}/requirements | gitlab_features.py | 49 |
| GET | /api/projects/{pid}/retros | agile_delivery.py | 111 |
| GET | /api/projects/{pid}/retros/{rid}/items | agile_delivery.py | 157 |
| GET | /api/projects/{pid}/roadmap | wiki_time_epics.py | 177 |
| GET | /api/projects/{pid}/roles | secrets_envs.py | 119 |
| GET | /api/projects/{pid}/secrets | secrets_envs.py | 35 |
| GET | /api/projects/{pid}/secure-files | pipelines_ci.py | 78 |
| GET | /api/projects/{pid}/security-alerts | workflows_security.py | 155 |
| GET | /api/projects/{pid}/security-scans | gitlab_features.py | 140 |
| GET | /api/projects/{pid}/security-scans/{sid}/findings | gitlab_features.py | 156 |
| GET | /api/projects/{pid}/service-desk | gitlab_features.py | 104 |
| GET | /api/projects/{pid}/sprints | agile_delivery.py | 26 |
| GET | /api/projects/{pid}/sprints/{sid}/backlog | agile_delivery.py | 79 |
| GET | /api/projects/{pid}/star | notifications_social.py | 60 |
| GET | /api/projects/{pid}/status-page | gitlab_features.py | 289 |
| GET | /api/projects/{pid}/task-groups | pipelines_ci.py | 122 |
| GET | /api/projects/{pid}/test-plans | test_plans.py | 26 |
| GET | /api/projects/{pid}/test-plans/{plan_id}/suites | test_plans.py | 52 |
| GET | /api/projects/{pid}/test-runs | test_plans.py | 121 |
| GET | /api/projects/{pid}/test-suites/{suite_id}/cases | test_plans.py | 79 |
| GET | /api/projects/{pid}/time | wiki_time_epics.py | 105 |
| GET | /api/projects/{pid}/variable-groups | pipelines_ci.py | 27 |
| GET | /api/projects/{pid}/watch | notifications_social.py | 82 |
| GET | /api/projects/{pid}/wiki | wiki_time_epics.py | 27 |
| GET | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 53 |
| GET | /api/projects/{pid}/wiki/{slug}/revisions | wiki_time_epics.py | 93 |
| GET | /api/projects/{pid}/workflows | workflows_security.py | 19 |
| GET | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 96 |
| GET | /api/projects/{pid}/workflows/{wid}/runs | workflows_security.py | 45 |
| GET | /api/projects/{pid}/workflows/{wid}/runs/{runId}/logs | workflows_security.py | 145 |
| GET | /api/projects/{project_id}/files/{file_path:path} | projects.py | 1398 |
| GET | /api/release-packages/public/{delivery_token} | release_packages.py | 107 |
| GET | /api/release-packages/public/{delivery_token}/download/{deliverable_id} | release_packages.py | 123 |
| GET | /api/sessions/public/{share_token}/requests/export | sessions.py | 1131 |
| GET | /api/sessions/public/{share_token}/versions/{version_id}/audio | sessions.py | 254 |
| GET | /api/sessions/versions/{version_id}/stems/{stem_id}/audio | sessions.py | 1018 |
| GET | /api/sessions/{session_id}/ledger | sessions.py | 909 |
| GET | /api/sessions/{session_id}/ledger/verify | sessions.py | 934 |
| GET | /api/sessions/{session_id}/requests/export | sessions.py | 1118 |
| GET | /api/sessions/{session_id}/roles/presets | roles.py | 65 |
| GET | /api/sessions/{session_id}/versions/{version_id}/audio | sessions.py | 659 |
| GET | /api/storage/objects/{object_id}/status | storage.py | 353 |
| GET | /api/teams | packages_gist_sponsors.py | 136 |
| GET | /api/unified-search | search_engine.py | 17 |
| GET | /api/unified-search/popular | search_engine.py | 104 |
| GET | /api/unified-search/quick | search_engine.py | 43 |
| GET | /api/unified-search/saved | search_engine.py | 118 |
| GET | /api/unified-search/stats | search_engine.py | 98 |
| GET | /api/unified-search/suggest | search_engine.py | 157 |
| GET | /api/unified-search/{entity_type} | search_engine.py | 182 |
| GET | /api/users/{username}/sponsors | packages_gist_sponsors.py | 110 |
| GET | /api/versions/{version_id}/audio-analysis | versions.py | 126 |
| GET | /api/versions/{version_id}/stems/{stem_id}/audio | versions.py | 103 |
| GET | /api/workflow-runs/{run_id}/artifacts | pipelines_ci.py | 163 |
| PATCH | /api/notifications/{nid}/read | notifications_social.py | 32 |
| PATCH | /api/projects/{pid}/deployments/{did} | deployments_artifacts.py | 238 |
| PATCH | /api/projects/{pid}/errors/{eid} | gitlab_features.py | 215 |
| PATCH | /api/projects/{pid}/feature-flags/{fid} | gitlab_features.py | 195 |
| PATCH | /api/projects/{pid}/incidents/{iid} | gitlab_features.py | 251 |
| PATCH | /api/projects/{pid}/milestones/{mid} | codeowners_milestones.py | 93 |
| PATCH | /api/projects/{pid}/mirrors/{mid} | code_search_and_insights.py | 143 |
| PATCH | /api/projects/{pid}/retros/{rid} | agile_delivery.py | 140 |
| PATCH | /api/projects/{pid}/security-alerts/{aid} | workflows_security.py | 180 |
| PATCH | /api/projects/{pid}/service-desk/{tid} | gitlab_features.py | 127 |
| PATCH | /api/projects/{pid}/sprints/{sid} | agile_delivery.py | 62 |
| PATCH | /api/projects/{pid}/task-groups/{gid} | pipelines_ci.py | 146 |
| PATCH | /api/projects/{pid}/test-cases/{case_id} | test_plans.py | 104 |
| PATCH | /api/projects/{pid}/variable-groups/{gid} | pipelines_ci.py | 52 |
| PATCH | /api/projects/{pid}/workflows/{wid}/runs/{rid} | workflows_security.py | 80 |
| POST | /api/2fa/validate | two_factor.py | 146 |
| POST | /api/2fa/verify | two_factor.py | 88 |
| POST | /api/assets/stems | assets.py | 672 |
| POST | /api/assets/{asset_id}/receipt | assets.py | 624 |
| POST | /api/extensions | code_search_and_insights.py | 178 |
| POST | /api/files/upload | files.py | 14 |
| POST | /api/functions | compute.py | 74 |
| POST | /api/functions/{function_id}/invoke | compute.py | 116 |
| POST | /api/functions/{function_id}/triggers | compute.py | 135 |
| POST | /api/gateway/keys | api_gateway.py | 53 |
| POST | /api/gateway/keys/{key_id}/check-limit | api_gateway.py | 103 |
| POST | /api/gateway/keys/{key_id}/validate | api_gateway.py | 93 |
| POST | /api/gateway/rules | api_gateway.py | 116 |
| POST | /api/gists | packages_gist_sponsors.py | 79 |
| POST | /api/iam/audit | iam.py | 161 |
| POST | /api/iam/check-permission | iam.py | 150 |
| POST | /api/iam/init-system-roles | iam.py | 171 |
| POST | /api/iam/roles | iam.py | 76 |
| POST | /api/iam/roles/{role_id}/assign | iam.py | 123 |
| POST | /api/iam/roles/{role_id}/policies | iam.py | 106 |
| POST | /api/integrations/{integration_id}/test | integrations.py | 264 |
| POST | /api/monitoring/alarms | monitoring.py | 231 |
| POST | /api/monitoring/alarms/evaluate | monitoring.py | 263 |
| POST | /api/monitoring/logs/events | monitoring.py | 212 |
| POST | /api/monitoring/logs/events/query | monitoring.py | 220 |
| POST | /api/monitoring/logs/groups | monitoring.py | 166 |
| POST | /api/monitoring/logs/streams | monitoring.py | 196 |
| POST | /api/monitoring/metrics | monitoring.py | 138 |
| POST | /api/monitoring/metrics/statistics | monitoring.py | 151 |
| POST | /api/monitoring/namespaces | monitoring.py | 122 |
| POST | /api/notifications/read-all | notifications_social.py | 42 |
| POST | /api/notifications/topics | notifications.py | 56 |
| POST | /api/notifications/topics/{topic_id}/publish | notifications.py | 115 |
| POST | /api/notifications/topics/{topic_id}/subscribe | notifications.py | 90 |
| POST | /api/packages | packages_gist_sponsors.py | 39 |
| POST | /api/packages/{pkg_id}/download | packages_gist_sponsors.py | 55 |
| POST | /api/projects/{pid}/approval-gates | pipelines_ci.py | 210 |
| POST | /api/projects/{pid}/artifact-feeds | deployments_artifacts.py | 42 |
| POST | /api/projects/{pid}/artifact-feeds/{fid}/packages | deployments_artifacts.py | 69 |
| POST | /api/projects/{pid}/branch-permissions | deployments_artifacts.py | 358 |
| POST | /api/projects/{pid}/calendar | wiki_time_epics.py | 218 |
| POST | /api/projects/{pid}/code-insights | code_search_and_insights.py | 93 |
| POST | /api/projects/{pid}/code-search/index | code_search_and_insights.py | 32 |
| POST | /api/projects/{pid}/codeowners | codeowners_milestones.py | 29 |
| POST | /api/projects/{pid}/deployments | deployments_artifacts.py | 226 |
| POST | /api/projects/{pid}/designs | gitlab_features.py | 81 |
| POST | /api/projects/{pid}/designs/{did}/comments | gitlab_features.py | 90 |
| POST | /api/projects/{pid}/environments | secrets_envs.py | 84 |
| POST | /api/projects/{pid}/environments/{eid}/approvals/{aid}/approve | deployments_artifacts.py | 264 |
| POST | /api/projects/{pid}/environments/{eid}/approvals/{aid}/reject | deployments_artifacts.py | 277 |
| POST | /api/projects/{pid}/epics | wiki_time_epics.py | 153 |
| POST | /api/projects/{pid}/epics/{eid}/tasks/{tid} | wiki_time_epics.py | 164 |
| POST | /api/projects/{pid}/extensions/{eid}/install | code_search_and_insights.py | 187 |
| POST | /api/projects/{pid}/feature-flags | gitlab_features.py | 186 |
| POST | /api/projects/{pid}/fork | notifications_social.py | 119 |
| POST | /api/projects/{pid}/incidents | gitlab_features.py | 242 |
| POST | /api/projects/{pid}/ip-allowlist | secrets_envs.py | 201 |
| POST | /api/projects/{pid}/lfs | secrets_envs.py | 108 |
| POST | /api/projects/{pid}/load-tests | test_plans.py | 201 |
| POST | /api/projects/{pid}/load-tests/{tid}/run | test_plans.py | 213 |
| POST | /api/projects/{pid}/merge-trains/{pr_id} | gitlab_features.py | 37 |
| POST | /api/projects/{pid}/milestones | codeowners_milestones.py | 79 |
| POST | /api/projects/{pid}/mirrors | code_search_and_insights.py | 122 |
| POST | /api/projects/{pid}/mirrors/{mid}/sync | code_search_and_insights.py | 132 |
| POST | /api/projects/{pid}/okrs | gitlab_features.py | 331 |
| POST | /api/projects/{pid}/okrs/{oid}/key-results | gitlab_features.py | 345 |
| POST | /api/projects/{pid}/oncall | gitlab_features.py | 278 |
| POST | /api/projects/{pid}/release-approvals | agile_delivery.py | 208 |
| POST | /api/projects/{pid}/release-approvals/{raid}/approve | agile_delivery.py | 219 |
| POST | /api/projects/{pid}/release-approvals/{raid}/reject | agile_delivery.py | 231 |
| POST | /api/projects/{pid}/requirements | gitlab_features.py | 63 |
| POST | /api/projects/{pid}/retro-items/{iid}/vote | agile_delivery.py | 181 |
| POST | /api/projects/{pid}/retros | agile_delivery.py | 129 |
| POST | /api/projects/{pid}/retros/{rid}/items | agile_delivery.py | 170 |
| POST | /api/projects/{pid}/roadmap | wiki_time_epics.py | 192 |
| POST | /api/projects/{pid}/roles | secrets_envs.py | 130 |
| POST | /api/projects/{pid}/roles/assign | secrets_envs.py | 143 |
| POST | /api/projects/{pid}/secrets | secrets_envs.py | 47 |
| POST | /api/projects/{pid}/secure-files | pipelines_ci.py | 95 |
| POST | /api/projects/{pid}/security-alerts | workflows_security.py | 172 |
| POST | /api/projects/{pid}/security-scans | gitlab_features.py | 147 |
| POST | /api/projects/{pid}/service-desk | gitlab_features.py | 116 |
| POST | /api/projects/{pid}/sprints | agile_delivery.py | 46 |
| POST | /api/projects/{pid}/sprints/{sid}/assign | agile_delivery.py | 92 |
| POST | /api/projects/{pid}/star | notifications_social.py | 67 |
| POST | /api/projects/{pid}/status-page/components | gitlab_features.py | 304 |
| POST | /api/projects/{pid}/task-groups | pipelines_ci.py | 135 |
| POST | /api/projects/{pid}/test-plans | test_plans.py | 38 |
| POST | /api/projects/{pid}/test-plans/{plan_id}/suites | test_plans.py | 67 |
| POST | /api/projects/{pid}/test-runs | test_plans.py | 134 |
| POST | /api/projects/{pid}/test-runs/{run_id}/complete | test_plans.py | 172 |
| POST | /api/projects/{pid}/test-runs/{run_id}/results | test_plans.py | 150 |
| POST | /api/projects/{pid}/test-suites/{suite_id}/cases | test_plans.py | 93 |
| POST | /api/projects/{pid}/time | wiki_time_epics.py | 122 |
| POST | /api/projects/{pid}/variable-groups | pipelines_ci.py | 41 |
| POST | /api/projects/{pid}/wiki | wiki_time_epics.py | 39 |
| POST | /api/projects/{pid}/workflows | workflows_security.py | 34 |
| POST | /api/projects/{pid}/workflows/{wid}/runs/{runId}/cancel | workflows_security.py | 132 |
| POST | /api/projects/{pid}/workflows/{wid}/trigger | workflows_security.py | 51 |
| POST | /api/reminders/evaluate | reminders.py | 12 |
| POST | /api/reminders/run-all | reminders.py | 24 |
| POST | /api/reminders/send | reminders.py | 18 |
| POST | /api/sessions/public/{share_token}/submit-feedback | sessions.py | 1054 |
| POST | /api/sponsors | packages_gist_sponsors.py | 126 |
| POST | /api/storage/cleanup | storage.py | 393 |
| POST | /api/storage/uploads/{object_id}/complete | storage.py | 232 |
| POST | /api/teams | packages_gist_sponsors.py | 149 |
| POST | /api/teams/{tid}/members | packages_gist_sponsors.py | 163 |
| POST | /api/teams/{tid}/projects | packages_gist_sponsors.py | 181 |
| POST | /api/unified-search/index | search_engine.py | 71 |
| POST | /api/unified-search/reindex | search_engine.py | 89 |
| POST | /api/unified-search/saved | search_engine.py | 131 |
| POST | /api/workflow-runs/{run_id}/artifacts | pipelines_ci.py | 177 |
| PUT | /api/functions/{function_id} | compute.py | 98 |
| PUT | /api/monitoring/alarms/{alarm_id} | monitoring.py | 248 |
| PUT | /api/projects/{pid}/push-rules | secrets_envs.py | 174 |
| PUT | /api/projects/{pid}/watch | notifications_social.py | 91 |
| PUT | /api/projects/{pid}/wiki/{slug} | wiki_time_epics.py | 67 |
| PUT | /api/projects/{pid}/workflows/{wid} | workflows_security.py | 104 |

## OpenAPI Comparison Result

**Status**: Success

### Endpoints in routers but not in OpenAPI

| Method | Path |
|--------|------|
| GET | /api/projects/{project_id}/files/{file_path:path} |

### Endpoints in OpenAPI but not in routers

| Method | Path |
|--------|------|
| GET | / |
| GET | /api/health |
| GET | /api/projects/{project_id}/files/{file_path} |
| GET | /graphql |
| POST | /graphql |

## Static-analysis Limitations

This analysis has the following limitations:
1. Dynamic routes: Routes constructed via variables or expressions may not be captured.
2. String concatenation: Paths built via string concatenation may not be normalized correctly.
3. Conditional decorators: Routes inside conditionals may be missed.
4. Imported routers: If routers are imported from other modules, their prefixes may not be resolved.
5. Authentication detection: Simple string matching for auth dependencies may have false positives/negatives.
6. Response model detection: Only checks for explicit `response_model` parameter; does not detect response models set via dependencies or decorators.
7. OpenAPI comparison: Requires the app to be importable; may fail due to missing dependencies or configuration.

## Confirmation

No source files were modified during this audit. Only reading source files and writing `API_AUDIT.md`.
