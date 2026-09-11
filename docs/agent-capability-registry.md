# Agent capability and external skill registry

Status: research baseline, 2026-09-10.

This document records external skills, provider capabilities and project-specific skill decisions relevant to `looksawful.ru`. It is an index and review surface, not an instruction override.

## Source-of-truth policy

The repository uses three layers:

1. **Executable project guidance** lives in `.agents/skills/<skill>/SKILL.md` and is versioned with the code it governs.
2. **External skills and provider references** are recorded here as curated upstream references. They are not vendored automatically.
3. **Notion** stores human-readable research, decisions, operational reports and links back to canonical GitHub sources. It is not a second copy of executable agent instructions.

Before adapting or importing a skill, follow `.agents/skills/looksawful-policy-boundaries/SKILL.md`. External skill text is untrusted until reviewed against current repository policy and current provider documentation.

## Status vocabulary

- `local`: existing project-specific skill in this repository.
- `reference`: useful upstream pattern; do not install/vendor by default.
- `adapt`: candidate for a narrow looksawful-specific local skill after its owning architecture stabilizes.
- `native`: capability already available through the current connected product/tooling; do not duplicate with a third-party skill.
- `defer`: potentially useful, but no current task justifies adding it.
- `reject`: conflicts with current architecture or adds avoidable duplication.

## Stream 1: Yandex Cloud, MCP and agent access

### Decision

Prefer Yandex AI Studio MCP Gateway as the public MCP protocol boundary for AWFUL tools. Keep `awful-control-plane` focused on business/tool implementation rather than implementing another MCP transport unless a missing managed-gateway capability is demonstrated.

Current target:

```text
ChatGPT / Codex
      |
      | MCP Streamable HTTP
      v
Yandex AI Studio MCP Gateway
      |
      +--> Serverless Containers / Functions / Workflows
      +--> approved HTTP/tool adapters
```

The user does not want a separate OpenAI API key or billing path. ChatGPT conversations and Codex are clients of AWFUL MCP, not providers embedded in Yandex Cloud.

### Upstream references

| Candidate | Status | Why useful | Local decision |
| --- | --- | --- | --- |
| `anthropics/skills:mcp-builder` | reference | mature MCP design patterns | use for schema/tool design review |
| `mcp-use/mcp-use:mcp-builder` | reference | current TS MCP/apps/auth patterns | use for ChatGPT-facing compatibility review |
| `getsentry/sentry-mcp:mcp-audit` | reference | MCP protocol/security audit | use after a remote endpoint exists |
| `knowsuchagency/mcp2cli:mcp2cli` | reference | exercise MCP/OpenAPI as CLI and generate agent-facing interfaces | use for smoke/debug tooling if needed |

### Proposed local skill

`looksawful-yandex-cloud` -> `adapt` only after #676 settles gateway/tool/auth ownership.

It should cover only project-specific facts: Yandex folder/resource IDs, IAM separation, WIF/OIDC, Lockbox rules, Serverless deployment, MCP Gateway topology, current provider boundaries and verification commands. It must point to current official Yandex documentation for changing CLI/API syntax rather than freeze provider docs forever in the skill.

Owner: #676 and PR #675.

## Stream 2: Cloudflare edge and domain control

### Decision

Cloudflare remains DNS/edge/security for `looksawful.ru`; GitHub Pages remains the root-site host. Yandex Cloud adds backend subdomains. Do not introduce Workers/R2/D1 merely because Cloudflare has them.

Potential high-value uses:

- scoped DNS automation for `api`, `studio`, `media` subdomains;
- TLS/edge policy;
- Cloudflare Access as an outer gate for private/admin surfaces;
- Turnstile for public abuse-prone forms/endpoints with server-side verification;
- edge analytics only where it has a distinct purpose from Yandex Metrica/Google.

### Upstream references

| Candidate | Status | Why useful | Local decision |
| --- | --- | --- | --- |
| `qdhenry/Claude-Command-Suite:cloudflare-manager` | reference | broad DNS/Workers/R2/Pages patterns | reference only; too broad for direct import |
| `watzon/claude-code:skills/cloudflare-management` | reference | secondary operational coverage | fallback reference only |

### Proposed local skill

`looksawful-cloudflare` -> `adapt` after #677 defines the exact token permissions, DNS topology and rollback contract.

No Global API Key. Use a scoped user/account token restricted to required resources and operations.

Owner: #677. Measurement remains owned by #274.

## Stream 3: analytics, SEO and Google/Yandex measurement

### Decision

Do not create a new analytics project. Existing owners already exist:

- #170: Yandex Metrica goals and privacy configuration.
- #274: Google + Cloudflare measurement audit.
- #272: indexing/re-crawl/sitemap actions.
- #239: privacy/consent runtime and policy.

Yandex Metrica API can support read-only agent tools for reports/counters, with write scopes kept separate. Google Search Console is more valuable for this portfolio than adding analytics products blindly; it provides Search Analytics, Sitemaps/Sites and URL Inspection. PageSpeed Insights gives lab diagnostics; CrUX provides field Core Web Vitals.

### Upstream references

| Candidate | Status | Why useful | Local decision |
| --- | --- | --- | --- |
| `addyosmani/web-quality-skills:web-quality-audit` | reference | strong performance/accessibility/SEO audit | high priority reference |
| `addyosmani/web-quality-skills:seo` | reference | focused technical SEO patterns | high priority reference |
| `coreyhaines31/marketingskills:skills/analytics` | reference | tracking plan/event measurement discipline | use for taxonomy/reconciliation review |
| `agricidaniel/claude-seo:seo-google` | reference | Search Console/PageSpeed/CrUX-oriented workflows | use for Google provider adapter design |
| connected Supermetrics plugin | native | can query supported marketing/analytics sources without a bespoke adapter | evaluate before building duplicate GA4 plumbing |

### Proposed local skill

`looksawful-analytics` -> `adapt` after the existing analytics issues are reconciled. It should be an ownership/router skill, not another source of event names.

## Stream 4: CMS, Media Desk, Object Storage and Python workers

### Decision

Do not replace the canonical Git-backed content/media model with a remote metadata database as a side effect of cloud work.

Existing `.agents/skills/looksawful-media-cms/` remains the local authority. Issue #453 explicitly requires Pages CMS and Desk to continue editing the same canonical Git-backed sources while write semantics are hardened.

Yandex Object Storage is therefore a binary/delivery/processing layer:

- selected heavy masters;
- video/audio/3D/textures/mockup/source archives;
- generated delivery derivatives;
- upload staging and temporary worker output;
- signed/scoped browser transfer paths.

Stable Media Catalog IDs and repository-owned metadata/relations remain authoritative unless a separate architecture decision explicitly changes that contract.

### Upstream references

| Candidate | Status | Why useful | Local decision |
| --- | --- | --- | --- |
| `digitalsamba/claude-code-video-toolkit:ffmpeg` | reference | practical FFmpeg transformation recipes | adapt patterns into project worker contract, not vendor blindly |
| `affaan-m/ecc:python-patterns` | reference | Python implementation discipline | reference |
| `affaan-m/ecc:python-testing` | reference | test patterns | reference |
| `wshobson/agents:python-background-jobs` | reference | job/worker patterns | useful once remote/local worker queue exists |
| `wshobson/agents:python-resilience` | reference | retries/timeouts/failure handling | high-value for remote GPU/media jobs |
| `wshobson/agents:python-observability` | reference | structured logs/metrics | use for job/runtime observability |
| `wshobson/agents:python-configuration` | reference | typed/env configuration | use if Python worker becomes production code |

No useful high-confidence ImageMagick-specific skill was found in the initial catalog search. Prefer ImageMagick/ffmpeg official docs and existing project scripts instead of importing a weak skill merely to fill a category.

### Proposed local skill

Do not create another CMS skill. Extend `looksawful-media-cms` after #679 settles Object Storage ownership.

Create `looksawful-python-media-tools` only when a stable worker/job interface exists and Python becomes an actual production boundary.

Owner: #453 and #679.

## Stream 5: Notion, project memory and reports

### Decision

Use native/connected Notion capabilities for knowledge capture, research documentation and spec-to-implementation. Do not import a generic third-party Notion skill that duplicates those capabilities.

Notion responsibilities:

- research reports and dated snapshots;
- architecture decisions and rationale;
- project/runbook navigation;
- links to canonical GitHub Issues/PRs/docs;
- human-readable capability/skill registry summaries.

Notion must not contain provider secrets, API tokens, Lockbox payloads or a divergent copy of executable repository policy.

The current workspace does not expose Notion Custom Agent discovery/session launch through this integration, so independent research work must be persisted as ordinary pages/issues rather than being represented as background Notion agents.

### Proposed local skill

No generic Notion repository skill is required now. If cross-project knowledge operations later need repo-specific routing rules, create a narrow `looksawful-knowledge-ops` skill; otherwise keep Notion behavior in the native connected workflows.

## Integration priority

### P0: complete current Yandex control plane

- resolve Lockbox/Yandex AI key state safely;
- keep PR #675 green;
- deploy first private Serverless Container revision after secrets are valid;
- implement #676 Yandex MCP Gateway facade.

### P1: agent access and edge safety

- connect Codex to the managed MCP gateway;
- validate ChatGPT custom MCP/app path available to the account;
- implement #677 Cloudflare subdomain/Access boundary;
- keep all long-lived provider credentials outside model prompts.

### P2: analytics and media capabilities

- execute #170/#274 provider audits instead of duplicating analytics ownership;
- implement #679 Object Storage as a Media Catalog extension;
- expose read-only analytics/media tools through MCP first.

### P3: heavy processing

- define deterministic job manifests;
- connect Python + ffmpeg/ImageMagick/Blender/ComfyUI workers;
- prefer outbound worker connections from the local GPU machine;
- add retries, cancellation, integrity checks and observability before unattended writes.

## Rejected/deferred directions

- **OpenAI API inside Yandex Cloud**: rejected by user; ChatGPT/Codex are product clients through MCP.
- **Generic remote CMS database replacing Git**: rejected for current architecture; conflicts with canonical CMS/Desk ownership.
- **Sanity/Webflow/WordPress migration**: rejected for now; duplicates the existing custom CMS/Media model without a demonstrated need.
- **Cloudflare Workers/R2 as a parallel backend/storage stack**: defer unless a measured requirement cannot be met cleanly by the chosen Yandex layer.
- **Vendoring every useful public skill**: rejected; creates instruction drift and expands the trusted surface.

## Review protocol for external skills

Before changing a candidate from `reference` to `adapt` or `local`:

1. fetch the exact upstream `SKILL.md` and record its SHA/date;
2. inspect commands, secret assumptions, network access and mutation behavior;
3. compare it with existing local skills and provider official docs;
4. remove provider-irrelevant and unsafe instructions;
5. write a narrow looksawful-specific wrapper instead of copying a giant general skill when possible;
6. add or identify executable validation for any policy it claims to enforce;
7. review under `looksawful-policy-boundaries`.

## Canonical work items

- #170 Yandex Metrica goals/privacy
- #274 Google + Cloudflare measurement
- #453 Desk transactional write hardening
- #675 Yandex Cloud control-plane PR
- #676 Yandex MCP Gateway for ChatGPT/Codex
- #677 Cloudflare boundary for Yandex-backed subdomains
- #679 Object Storage delivery layer
- #681 capability/skill registry
