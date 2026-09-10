# Yandex Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing owner-only GitHub Actions/Yandex OAuth bridge into a typed, testable control plane for looksawful.ru across Webmaster, Metrika, Yandex Disk, and Yandex Cloud without exposing provider credentials to agents.

**Architecture:** GitHub Issues remain the audited command transport. GitHub Actions injects secrets only at runtime; `tools/yandex-control.mjs` is the provider boundary and rejects arbitrary HTTP/shell execution. Public results are restricted to public-site facts and mutation acknowledgements; private provider data requires a separate private transport.

**Tech Stack:** Node.js 24, GitHub Actions, Yandex Webmaster API v4, Yandex Metrika Management/Reporting API, Yandex Disk REST API, Yandex Cloud IAM/Resource Manager API.

**Spec:** `docs/yandex-control.md`

## Global Constraints

- Repository is public.
- `YANDEX_OAUTH_TOKEN` stays in GitHub Secrets and must never be printed.
- Commands are explicit allowlisted actions only.
- Every action has `read`, `write`, or `destructive` risk classification.
- Destructive actions require exact machine-readable confirmation.
- Webmaster URLs are confined to `https://www.looksawful.ru`.
- Disk paths are confined to `YANDEX_DISK_ROOT`, default `/looksawful`.
- Private Metrika/Disk/Cloud reads must fail closed on the public Issue transport.
- Yandex Cloud production mutations require a dedicated service-account identity with minimum IAM roles.

---

### Task 1: Policy contract

**Files:**
- Modify: `test/yandex-control-workflow.test.mjs`
- Modify: `tools/yandex-control.mjs`

**Interfaces:**
- Produces: `classifyAction(action)`, `requiresConfirmation(action)`, provider input validators.

- [x] Write failing contract tests for explicit risk classes, destructive confirmation, Disk path confinement, and Metrika goal validation.
- [x] Run the exact PR-SHA test and verify RED because the policy exports do not yet exist.
- [x] Implement the policy helpers and explicit action map.
- [x] Run the contract workflow and verify GREEN.

### Task 2: Webmaster expansion

**Files:**
- Modify: `tools/yandex-control.mjs`
- Modify: `docs/yandex-control.md`

**Interfaces:**
- Produces: sitemap list/add/delete plus existing status/recrawl operations.

- [x] Preserve canonical-host validation and existing recrawl behavior.
- [x] Add sitemap inventory.
- [x] Add sitemap registration using the documented `{ "url": ... }` request body.
- [x] Add confirmed sitemap deletion.
- [x] Document public-safe output.

### Task 3: Metrika management

**Files:**
- Modify: `tools/yandex-control.mjs`
- Modify: `docs/yandex-control.md`

**Interfaces:**
- Produces: counter read, summary read, goals read, goal create/update/delete.

- [x] Preserve counter access check.
- [x] Add private counter/report/goal inventory reads.
- [x] Add structured goal create/update/delete operations.
- [x] Require explicit confirmation for deletion.
- [x] Keep private reports out of public Issues.

### Task 4: Yandex Disk project workspace

**Files:**
- Modify: `tools/yandex-control.mjs`
- Modify: `.github/workflows/yandex-control.yml`

**Interfaces:**
- Consumes: `YANDEX_DISK_ROOT`.
- Produces: info/list/mkdir/copy/move/delete.

- [x] Add absolute-path and traversal validation.
- [x] Restrict every operation to the looksawful project subtree.
- [x] Add read and mutation operations.
- [x] Require confirmation for delete.
- [x] Wire root scoping through GitHub Variables.

### Task 5: Yandex Cloud bootstrap

**Files:**
- Modify: `tools/yandex-control.mjs`
- Modify: `.github/workflows/yandex-control.yml`
- Modify: `docs/yandex-control.md`

**Interfaces:**
- Consumes: optional `YANDEX_CLOUD_ID`, `YANDEX_CLOUD_FOLDER_ID`.
- Produces: read-only cloud/folder inventory adapter.

- [x] Add OAuth-to-IAM exchange for compatible existing credentials.
- [x] Add read-only Resource Manager inventory.
- [x] Scope inventory through optional IDs.
- [x] Document the 2026 OAuth limitation and service-account requirement for durable production mutation.
- [ ] Configure a dedicated Yandex Cloud service account and minimum IAM roles in the external Yandex account.

### Task 6: Private result transport

**Files:**
- Modify: `docs/yandex-control.md`
- Future transport file depends on the selected private sink.

**Interfaces:**
- Produces: a result channel readable by the authorized agent but not by public GitHub visitors.

- [x] Fail private reads closed on the public transport.
- [ ] Provision an authenticated private sink (preferred: dedicated private GitHub repository or an integration-backed private workspace) and add its credential as a GitHub Secret.
- [ ] Route `metrika-summary`, `metrika-goals`, `metrika-counter`, `disk-info`, `disk-list`, and `cloud-inventory` to that sink.
- [ ] Verify that public workflow logs/comments contain no private payload.

### Task 7: Production verification

**Files:**
- Modify: `docs/yandex-control.md` verification journal after probes.

**Interfaces:**
- Consumes: production GitHub Secrets/Variables.
- Produces: live evidence of actual provider reach.

- [ ] Merge the control-plane PR after all repository CI is green.
- [ ] Run `webmaster-status` through the production Issue bridge.
- [ ] Run `metrika-access-check` through the production Issue bridge.
- [ ] Verify Yandex Disk scope after OAuth permission is present without exposing storage metadata.
- [ ] Verify Cloud identity after the service-account credential is configured.
- [ ] Record actual reachable/unreachable providers and required account-side configuration.
