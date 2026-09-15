# Private GitBook documentation architecture

Status: TARGET documentation delivery architecture. This document does not claim that private publishing or Git Sync is already configured.

Verified: 2026-09-15 against `dev@0e9709133cc75b4b01cc867df6e306a3e2b429ee` for repository structure and against current GitBook product/API evidence for platform capabilities.

## Decision

Durable technical documentation remains Git-backed in this repository. GitBook is the private read/search/review surface over that content, not an independent source of truth.

The authority order remains `docs/README.md`:

1. executable code, parsers, tests and workflows;
2. repository policy and current normative architecture docs;
3. current operational maps and handbooks;
4. current GitHub Issues for open TARGET work;
5. dated specs, handoffs, audits and reports as snapshots/history.

Notion remains suitable for research, planning, fact bases, drafts and historical evidence until a source is reconciled. An imported Notion page does not become CURRENT by entering GitBook.

## Private access model

### Recommended minimum

Use a GitBook organization space that is not publicly published while the documentation is owner/internal-only. This avoids exposing repository documentation through a public docs site and avoids paying for visitor authentication that is not needed for a single-owner/internal editing surface.

If a polished published URL must be shared with a small external audience, use a revocable private share link on a plan that includes private share links and search-index opt-out.

Use authenticated access only when individual visitor identity or an identity provider is actually required. Current GitBook product documentation places authenticated access on the Ultimate site plan, so it is unnecessary overhead for the present owner/internal-only requirement.

### Safety gate

No repository or Notion migration starts into a site that is publicly readable. Verify access first, then sync content.

## Git Sync model

GitBook Git Sync is bidirectional. The repository therefore remains the durable canon by governance, not because GitBook is technically read-only.

Rules:

- sync `looksawful/looksawful.ru` from `dev`;
- scope GitBook content to repository `docs/`;
- perform the first population GitHub -> GitBook;
- repository Markdown remains the durable artifact;
- GitBook-originated edits must travel through the Git/change-request review path before they are accepted as canonical;
- do not manually maintain a second copy of a canonical page in GitBook;
- do not connect `prod` as the authoring branch: `prod` is deployment state, while `dev` is the current integration/documentation branch.

## Proposed GitBook information architecture

The IA is a navigation projection over canonical files. It does not require physically moving every existing file before the migration is useful.

```text
Home / Documentation authority

Product
  Domain glossary
  Site pages and portfolio model
  Product-facing analytics where verified

Architecture
  Repository structure
  Site/page architecture
  Current architecture decisions

Frontend & Pages
  Page manifest / routing
  Rendering and composition
  Preview behavior
  UI/component documentation after audit

Design System
  Tokens
  Component ownership
  Storybook coverage and verified component guidance

Content & CMS
  CMS architecture
  CMS content ownership map
  CMS handbook
  Content/Media Desk contract when reconciled

Media
  Media ownership and catalog
  Generation/derivative policy
  Media operations

Operations
  Site operations
  Tooling pipeline
  PR preview
  Release/deployment operator references

Testing & Quality
  Testing policy
  Testing pipeline
  Engineering quality
  CI operational guidance

Agents & Automation
  Agent-facing repository guidance
  Skill provenance
  Public reporting policy
  Automation guidance

Decisions & Programs
  Accepted TARGET specifications
  Active programs that still own open work
  ADR-style durable decisions

Reference
  References
  Licensing
  Rights and provenance

Historical & Archive
  Historical roadmaps
  Dated audits
  Handoffs
  Superseded plans/specs
```

`docs/README.md` remains the first page because it explains authority and classification. Historical and TARGET material must not be interleaved with CURRENT operator documentation merely because GitBook makes nested navigation convenient.

## Metadata contract

Do not mass-edit every file merely to satisfy a template. Apply this contract when a document is migrated/reconciled or when its authority is reviewed.

```text
Status: CURRENT DEV | CURRENT PROD | TARGET | SNAPSHOT | HISTORICAL
Class: POLICY | NORMATIVE | OPERATIONAL | MAP | INVENTORY | OPERATOR | IMPLEMENTATION
Owner: <repository area / issue / named role>
Last verified: YYYY-MM-DD
Verified against: <branch@sha and/or executable paths/tests/workflows>
Source / provenance: <repository paths or sanitized source identifiers>
Related issues / PRs: #123, PR #456
Supersedes: <document, if applicable>
Superseded by: <document, if applicable>
```

Not every field is mandatory when it has no meaning, but CURRENT technical claims require an evidence baseline.

## Lifecycle

```text
DRAFT -> REVIEW -> VERIFIED CURRENT -> STALE -> SUPERSEDED/HISTORICAL
                    ^                    |
                    +---- reverify ------+
```

A document becomes STALE when an owning executable contract changes, its branch/SHA baseline is no longer representative, an authoritative replacement lands, or an audit finds an unresolved conflict. STALE is not automatically wrong; it is no longer safe to present as verified current behavior.

A page returns to VERIFIED CURRENT only after evidence review. Superseded historical evidence is preserved when it carries provenance and links forward to the replacement.

## Configuration draft

Do not commit this file until Git Sync setup confirms the exact supported configuration for the selected space/repository connection.

```yaml
root: ./docs/

structure:
  readme: README.md
  summary: SUMMARY.md
```

The intent is to make root repository `docs/**` the GitBook content root. If the current GitBook integration generates or requires a different `.gitbook.yaml` representation during connection, prefer the integration-generated compatible form rather than forcing this draft.

## `SUMMARY.md` policy

`SUMMARY.md` is navigation, not authority. Generate it only from audited repository paths. It must:

- start from `README.md`;
- expose verified CURRENT docs prominently;
- group TARGET/program material separately;
- put snapshots/handoffs/audits under Historical & Archive;
- omit quarantined/UNKNOWN material until reconciled;
- use relative links within `docs/`;
- never copy Notion content merely to make the tree look complete.

## Import policy

Direct mass import from Notion is rejected for this migration. Import is allowed only after a source has a migration-matrix decision and its claims have been reconciled against stronger evidence.

Preferred paths:

- already canonical repository doc -> Git Sync, no content copy;
- useful Notion-only CURRENT claim -> reconcile into the owning repository document, preserve provenance, then Git Sync;
- TARGET work -> GitHub Issue/PR plus linked spec where justified;
- research/draft -> keep in Notion until promoted;
- snapshot/history -> preserve and classify, do not rewrite into CURRENT prose.

## Redirects

Create GitBook redirects only after final page paths are known. Redirects solve reader navigation, not source ownership. Do not use redirects to hide duplicate canonical pages; reconcile the duplicate first.

## Risks

1. **Public exposure before access setup.** Mitigation: access gate precedes sync/import.
2. **Bidirectional Git Sync creates a second authoring path.** Mitigation: repository review policy remains canonical and GitBook edits use change requests/Git review.
3. **CURRENT/TARGET contamination.** Mitigation: explicit navigation groups, metadata and evidence gates.
4. **Notion duplication.** Mitigation: migration matrix chooses one canonical destination per topic.
5. **Historical evidence loss.** Mitigation: preserve snapshots and forward-link superseded material.
6. **Private data copied into public GitHub.** Mitigation: follow `docs/agents/public-reporting.md`; use sanitized provenance identifiers rather than private URLs/account metadata.
7. **Configuration drift.** Mitigation: verify `.gitbook.yaml` against the actual connected GitBook integration before committing it.

## Acceptance criteria

The architecture is ready for Wave 1 only when all are true:

- the GitBook destination is verified non-public for the intended audience;
- Git Sync is connected to `looksawful/looksawful.ru` `dev` with `docs/` as the documentation root;
- first synchronization is repository -> GitBook and does not overwrite canonical Markdown;
- `README.md` authority rules remain the entry point;
- navigation separates CURRENT, TARGET and HISTORICAL material;
- every Wave 1 page has been classified and has no unresolved higher-authority conflict;
- GitBook-originated changes cannot bypass the agreed review path;
- no private connector/account data is copied into the public repository;
- no mass Notion import has occurred.

## Current execution status

Repository architecture and the target GitBook model are defined here. The current connected GitBook site was observed as publicly published during this audit, so it is **NO-GO for documentation import until its visibility is changed or a separate private/unpublished space is created and verified**. This status is intentionally conservative: access control is a prerequisite, not a cleanup step after migration.
