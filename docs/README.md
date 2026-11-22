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
| `site-operations.md` | CURRENT OPERATOR | Manual dev content, media preparation and protected prod releases. |
| `tooling-pipeline.md` | CURRENT OPERATIONAL | Local commands, CI/media tooling and explicit branches. |
| `repository-structure.md` | CURRENT MAP | Repository area ownership/navigation. |
| `gitbook-architecture.md` | CURRENT NORMATIVE / rollout in progress | Free-only GitBook projection over canonical repository docs and migration governance. |
| `SUMMARY.md` | CURRENT NAVIGATION | GitBook Wave 1 navigation only; does not redefine authority. |

## Open target work and residual issue ownership

GitHub Issues own independently executable work. An issue may remain open after a core implementation slice lands; the issue state alone is not proof that the implementation is absent.

Retirement/consolidation acceptance is recorded in existing issue #1009. Historical CMS issues and dated handoffs describe the former editors; they do not authorize a third permanent branch or restore removed write services. Do not automatically close unrelated historical issues.

## GitBook projection

`.gitbook.yaml` scopes GitBook to `docs/`. `SUMMARY.md` is a conservative Wave 1 navigation list over canonical repository documents.

GitBook is a synchronized reader/editor surface, not a higher authority than Git. The project intentionally uses a free-only GitBook model and does not depend on paid authenticated publishing, private share links, advanced branding or AI features. See `gitbook-architecture.md`.

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
- Git-backed authored content and typed registries: runtime content/domain/media authority according to the contracts in `site-operations.md`.

A fixed `prod@<sha>` in an external document is a snapshot unless it is explicitly revalidated against current production.
