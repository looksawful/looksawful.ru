# Documentation map

Status: CURRENT navigation index for repository documentation.

This file tells readers what each documentation class is for. It does not override executable code, parsers, tests or workflows.

## Authority order

For claims about current technical behavior, use this order:

1. executable code, parsers, tests and workflows;
2. repository policy and current normative architecture docs;
3. current operational maps and handbooks;
4. current GitHub Issues for open TARGET work;
5. dated specs, handoffs, audits and reports as snapshots/history.

Branch vocabulary is explicit:

- `CURRENT DEV` — current working/integration state on `dev`;
- `CURRENT PROD` — current production/release state on `prod`;
- `TARGET` — accepted but not yet fully implemented behavior;
- `SNAPSHOT` — evidence bound to a date/SHA;
- `HISTORICAL` — retained for provenance, not current authority.

## Current policy and operating docs

| Document | Classification | Purpose |
| --- | --- | --- |
| `../AGENTS.md` | CURRENT POLICY | Repository-wide agent and change rules. |
| `testing-policy.md` | CURRENT NORMATIVE | Testing ownership and verification policy. |
| `testing-pipeline.md` | CURRENT OPERATIONAL | Current testing commands/groups and operator map. |
| `cms-architecture.md` | CURRENT NORMATIVE, with open TARGET reconciliation | Content/media/CMS ownership and publication trust boundary. |
| `cms-content-map.md` | CURRENT INVENTORY | Detailed content/CMS field mapping. |
| `cms-handbook.md` | CURRENT OPERATOR | Owner-facing Pages CMS behavior and publication flow. |
| `site-operations.md` | CURRENT OPERATOR | Branches, Pages CMS publication, media and release operations. |
| `tooling-pipeline.md` | CURRENT OPERATIONAL | Local commands, CI/CMS tooling and branch assumptions. |
| `content-media-desk-api.md` | CURRENT IMPLEMENTATION / TRANSITIONAL | Local Desk HTTP/write contract and known safety gaps owned by #452/#453. |
| `repository-structure.md` | CURRENT MAP | Repository area ownership/navigation. |

## Open target work

GitHub Issues own independently executable work. In particular:

- #249 — source/round-trip governance reconciliation;
- #451 — isolated `content/*` authoring topology before integration to `dev`;
- #452 — read-only-by-default local editorial tooling and guarded write mode;
- #453 — stricter source authorization, stale-write/concurrency and atomic persistence hardening;
- #687 — deep-refactor program/preflight, TARGET rather than current architecture evidence.

Until those issues land and are verified, current documentation must describe current behavior and target behavior separately.

## Snapshots and historical evidence

Dated audits, handoffs and plans are useful evidence but are not current operational authority merely because they are detailed.

Examples:

- `ci-pipeline-report.md` — HISTORICAL SNAPSHOT, audit dated 2026-09-01;
- `handoffs/**` — execution/handoff snapshots;
- `superpowers/specs/**` — design/spec records, classification depends on implementation status;
- `superpowers/plans/**` — implementation plans, not proof that work shipped.

When a snapshot conflicts with current executable state, preserve the snapshot and correct the current navigation/authority layer instead of rewriting history.

## Source ownership outside the repository

Notion, Google Sheets and other connected sources are not blanket substitutes for repository ownership. Authority is field-specific:

- Notion: planning, decisions, research, fact bases and historical evidence;
- Google Sheets: source material, editorial/operator registries and mirrors according to field ownership;
- Git-backed authored content and typed registries: runtime content/domain/media authority according to the contracts in `cms-architecture.md`.

A fixed `prod@<sha>` in an external document is a snapshot unless it is explicitly revalidated against current production.
