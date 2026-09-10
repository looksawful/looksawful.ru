# Yandex control plane

`looksawful.ru` uses GitHub as the control plane for Yandex operations. ChatGPT/agents never receive the OAuth token itself. An owner-authored GitHub Issue triggers a GitHub Actions runner, the runner reads credentials from GitHub Secrets, calls the relevant Yandex API, and publishes only a sanitized result that is safe for the repository visibility.

## Architecture

```text
ChatGPT / owner
      |
      v
GitHub Issue: [yandex-control] <action>
      |
      v
.github/workflows/yandex-control.yml
      |
      +--> GitHub Secret: YANDEX_OAUTH_TOKEN
      +--> GitHub Variables: service/resource IDs and project roots
      |
      v
tools/yandex-control.mjs
      |
      +--> Yandex Webmaster API
      +--> Yandex Metrika Management / Reporting API
      +--> Yandex Disk REST API
      +--> Yandex Cloud IAM + Resource Manager API
      |
      v
sanitized GitHub Issue comment
```

The public repository is deliberately not a private analytics transport. Detailed Metrika reports, Yandex Disk listings, and Yandex Cloud inventory require a private result channel. Management commands may execute through the public Issue bridge only when their result is reduced to non-sensitive confirmation text.

## Runtime configuration

Required now:

- GitHub Secret `YANDEX_OAUTH_TOKEN`;
- GitHub Variable `YANDEX_METRIKA_COUNTER_ID`.

Optional provider scoping:

- `YANDEX_DISK_ROOT`, default `/looksawful`; every Disk mutation is confined to this subtree;
- `YANDEX_CLOUD_ID`, scopes Cloud inventory to one cloud;
- `YANDEX_CLOUD_FOLDER_ID`, scopes Cloud inventory to one folder.

Never copy secret values into repository files, Issues, pull requests, Actions variables, logs, artifacts, documentation, Notion, or chat.

## Command transport

Only an Issue opened by the repository owner and titled with the exact prefix `[yandex-control] ` reaches the secret-bearing job. The body must be a JSON object. The job checks out the exact default-branch SHA with persisted Git credentials disabled. The job has only `contents: read` and `issues: write` GitHub permissions.

No arbitrary shell command, arbitrary provider URL, `repository_dispatch`, or `workflow_dispatch` secret surface exists.

## Risk model

Each command has one of three static classes:

- `read`: no provider-side mutation;
- `write`: creates or changes provider state;
- `destructive`: deletes provider state and requires explicit `payload.confirm` equal to the action name.

This confirmation is intentionally machine-checkable. For example, `disk-delete` must include `{"path":"/looksawful/tmp/file","confirm":"disk-delete"}`. A vague `yes` is not accepted.

## Webmaster

Available actions:

- `webmaster-status` `{}`: verification, host status, diagnostics, recrawl quota;
- `webmaster-recrawl` `{"url":"https://www.looksawful.ru/..."}`: request recrawl for a canonical-site URL;
- `webmaster-recrawl-status` `{}`: recent recrawl tasks for the public site;
- `webmaster-sitemaps` `{}`: registered public sitemap status;
- `webmaster-sitemap-add` `{"url":"https://www.looksawful.ru/sitemap.xml"}`: add a sitemap;
- `webmaster-sitemap-delete` `{"sitemapId":"...","confirm":"webmaster-sitemap-delete"}`: remove a user-added sitemap.

All URL-taking Webmaster commands enforce HTTPS and `www.looksawful.ru`; credentials, fragments, alternate hosts, and arbitrary URLs are rejected.

## Metrika

Available actions:

- `metrika-access-check` `{}`: safe OAuth/counter reachability check;
- `metrika-summary` `{"days":7}`: visits/users/pageviews, private-output only;
- `metrika-goals` `{}`: goal inventory, private-output only;
- `metrika-counter` `{}`: counter metadata, private-output only;
- `metrika-goal-create` `{"goal":{...}}`: structured goal creation;
- `metrika-goal-update` `{"goalId":"123","goal":{...}}`: structured goal update;
- `metrika-goal-delete` `{"goalId":"123","confirm":"metrika-goal-delete"}`: explicit destructive delete.

Goal mutations accept structured Metrika goal objects only. They do not accept arbitrary URLs or arbitrary HTTP requests.

## Yandex Disk

Available actions:

- `disk-info` `{}`: storage metadata, private-output only;
- `disk-list` `{"path":"/looksawful"}`: directory listing, private-output only;
- `disk-mkdir` `{"path":"/looksawful/backups"}`;
- `disk-move` `{"from":"/looksawful/a","path":"/looksawful/b"}`;
- `disk-copy` `{"from":"/looksawful/a","path":"/looksawful/b"}`;
- `disk-delete` `{"path":"/looksawful/a","confirm":"disk-delete"}`.

Every path is restricted to `YANDEX_DISK_ROOT`. `..` traversal and paths outside the project root are rejected.

## Yandex Cloud

`cloud-inventory` exchanges a compatible Yandex Passport OAuth token for a short-lived IAM token and reads Cloud/Folder inventory. Its output is private-only.

Important 2026 limitation: Yandex Cloud changed user OAuth handling. New Yandex ID OAuth tokens can no longer be relied on as a durable Cloud credential. Production Cloud mutation should therefore use a dedicated service account with minimum IAM roles and short-lived IAM credentials rather than broad permanent user credentials. The current Cloud adapter is intentionally read-only until that service-account identity is configured.

## Public reporting boundary

Safe public results are limited to public-site operational information and simple success/failure confirmations. OAuth/IAM tokens, request headers, raw API responses, Yandex user IDs, host IDs, private traffic numbers, Disk directory contents, Cloud resource IDs, and internal provider identifiers are never intentionally copied into Issue comments.

Private read actions fail closed with `PRIVATE_OUTPUT_REQUIRED` on the public bridge.

## Production plan

1. Merge the typed control-plane implementation after contract tests pass.
2. Verify the existing OAuth token against `webmaster-status` and `metrika-access-check` without exposing it.
3. Configure `YANDEX_DISK_ROOT=/looksawful` and verify Disk OAuth scope before enabling operational Disk use.
4. Configure a dedicated Yandex Cloud service account and minimum roles for the exact services needed by looksawful.ru.
5. Add a private result transport before enabling private analytics/Disk/Cloud reads for agents.
6. Add provider modules only as explicit allowlisted commands, with tests and a declared risk class.
7. Never add a generic HTTP proxy or shell command to the control plane.

## Definition of Done

The control plane is production-ready for a provider/action only when:

- the command is explicitly allowlisted;
- its risk class is fixed in code;
- input is validated and scoped to looksawful.ru/project resources;
- destructive actions require exact confirmation;
- the provider credential never leaves GitHub Actions;
- public output contains no private data;
- the contract test passes on the exact PR SHA;
- a non-destructive live probe succeeds with the production credential;
- the action and required OAuth/IAM scope are documented;
- rollback or deletion behavior is defined for mutations.

## Verification journal

- 2026-09-10: existing owner-only GitHub Issue → Actions → Yandex OAuth bridge audited.
- 2026-09-10: test-first expansion started; initial contract intentionally failed because new policy exports did not exist.
- 2026-09-10: explicit `read` / `write` / `destructive` policy, destructive confirmation, Disk root confinement, Metrika goal validation, Webmaster sitemap operations, Disk operations, and Cloud read inventory implemented on `feat/yandex-control-plane`.
- 2026-09-10: official Yandex documentation rechecked for Webmaster sitemap request shape (`{"url": ...}`) and the current 13 Metrika goal types.
- 2026-09-10: public/private boundary retained: private provider reads are not emitted into the public repository.

## Agent rule

Agents should request the narrowest existing command that satisfies the task. If a required provider operation is missing, add a typed action, validation, tests, documentation, and risk classification first. Never work around the control plane by printing a secret or introducing arbitrary request execution.
