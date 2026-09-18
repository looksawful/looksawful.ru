# Private GitBook documentation architecture

Status: CURRENT NORMATIVE / rollout in progress.

Last verified: 2026-09-16 against `dev@7816d9d31fd5c6ffbc30e823fe0e65a9c23e8f73`, current repository documentation/executable contracts, and current GitBook product documentation.

## Decision

Durable technical documentation remains Git-backed in this repository. GitBook is an owner-facing read/search/edit surface over canonical Markdown, not an independent source of truth.

The authority order remains `docs/README.md`:

1. executable code, parsers, tests and workflows;
2. repository policy and current normative architecture docs;
3. current operational maps and handbooks;
4. current GitHub Issues for open TARGET work;
5. dated specs, handoffs, audits and reports as snapshots/history.

Notion remains suitable for research, planning, fact bases, drafts and historical evidence until an individual source is reconciled. A Notion page does not become CURRENT merely because it is imported somewhere else.

## Free-only GitBook constraint

This project must not depend on paid GitBook capabilities.

The supported operating model is:

- one owner/editor on the GitBook Free plan;
- Git Sync with GitHub;
- GitBook change requests where useful;
- no requirement for authenticated published visitor access;
- no requirement for private share links, advanced branding, AI Assistant or paid review/approval features;
- no paid GitBook site is required for the documentation workflow.

If GitBook changes its free-plan capability set later, the repository remains authoritative and usable without GitBook.

## Access model

The documentation space is intended for owner/internal use and must remain non-public.

Current access gate:

- the previously published GitBook docs site has been unpublished;
- the intended working space is private;
- no repository or Notion content should be published to a public GitBook site as part of this migration;
- paid authenticated-access publishing is deliberately outside scope.

Do not store GitBook organization IDs, space IDs, private source URLs or account metadata in public repository documentation.

## Git Sync model

GitBook Git Sync is bidirectional. The repository remains canonical by governance and review policy, not because GitBook is technically read-only.

Rules:

- synchronize `looksawful/looksawful.ru` from branch `dev`;
- scope GitBook content to repository `docs/`;
- populate the space GitHub -> GitBook first;
- repository Markdown remains the durable artifact;
- GitBook-originated edits must return through Git/GitBook change history and must not silently replace repository authority;
- do not manually maintain a second copy of a canonical page in GitBook;
- do not connect `prod` as the documentation authoring branch: `prod` is release/deployment state, while `dev` is the current integration/documentation branch.

Git Sync still requires the owner's interactive GitHub authorization in GitBook. That OAuth step is the only external setup gate that cannot be completed safely through repository automation.

## Repository configuration

Current GitBook documentation confirms that a root `.gitbook.yaml` can scope content to `./docs/` and define the README and SUMMARY paths. The repository therefore uses:

```yaml
root: ./docs/

structure:
  readme: README.md
  summary: SUMMARY.md
```

All structure paths are relative to `docs/` because of the configured root.

## Wave 1 navigation

`docs/SUMMARY.md` is navigation, not authority. Wave 1 intentionally contains only already canonical repository documents whose role is clear enough for the primary GitBook tree:

- documentation authority (`README.md`);
- repository structure;
- CMS architecture, content ownership map and operator handbook;
- reconciled Content / Media Desk contract;
- site operations and tooling pipeline;
- testing policy and testing pipeline;
- this documentation architecture decision under Decisions & Programs.

Untriaged Notion material, dated audits, handoffs and historical plans are not added merely to make the sidebar look complete.

## Target information architecture

As further material is reconciled, GitBook may project the repository into these navigation groups:

```text
Home / Documentation authority
Architecture
Frontend & Pages
Design System
Content & CMS
Media
Operations
Testing & Quality
Agents & Automation
Decisions & Programs
Reference
Historical & Archive
```

The grouping is a reader-facing projection. It does not require physically moving every repository document.

## Metadata contract

Do not mass-edit every file merely to satisfy a template. Apply metadata when a document is reconciled or its authority is reviewed.

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

CURRENT technical claims require an evidence baseline where the claim can drift.

## Lifecycle

```text
DRAFT -> REVIEW -> VERIFIED CURRENT -> STALE -> SUPERSEDED/HISTORICAL
                    ^                    |
                    +---- reverify ------+
```

A document becomes STALE when an owning executable contract changes, its verification baseline is no longer representative, an authoritative replacement lands, or an audit finds an unresolved conflict. STALE is not automatically wrong; it is no longer safe to present as verified current behavior.

A page returns to VERIFIED CURRENT only after evidence review. Superseded historical evidence is preserved when it carries provenance and should link forward to its replacement where useful.

## Import policy

Direct mass import from Notion is rejected for this migration.

Preferred paths:

- already canonical repository doc -> Git Sync, no content copy;
- useful Notion-only CURRENT claim -> reconcile into the owning repository document, preserve sanitized provenance, then Git Sync;
- TARGET work -> GitHub Issue/PR plus linked spec where justified;
- research/draft -> keep in Notion until promoted;
- snapshot/history -> preserve and classify, do not rewrite into CURRENT prose.

## Risks and mitigations

1. **Public exposure.** Keep the working space private and the docs site unpublished.
2. **Second source of truth.** Repository Markdown remains durable canon; GitBook is a synchronized projection/editor.
3. **CURRENT/TARGET contamination.** Keep TARGET/program material visually separate from CURRENT operator docs.
4. **Notion duplication.** Promote individual verified knowledge, not whole page trees.
5. **Historical evidence loss.** Preserve dated snapshots rather than rewriting them as current.
6. **Private data copied into public GitHub.** Store only sanitized provenance, never account-scoped identifiers/private URLs.
7. **Paid-feature dependency.** The workflow must remain functional on GitBook Free and remain fully recoverable from Git alone.

## Acceptance criteria

Normal use is GO only when all are true:

- the intended GitBook working space is non-public;
- Git Sync is connected to `looksawful/looksawful.ru` branch `dev`;
- GitBook reads repository `.gitbook.yaml` and `docs/SUMMARY.md` correctly;
- first synchronization is GitHub -> GitBook and does not overwrite canonical Markdown with the existing empty GitBook skeleton;
- `README.md` authority rules remain the entry point;
- every Wave 1 navigation target resolves;
- repository -> GitBook synchronization is observed on an exact commit;
- a GitBook-originated edit does not bypass the agreed Git/review history;
- no private connector/account data is copied into public GitHub;
- no paid GitBook capability is required;
- no mass Notion import has occurred.

## Current execution status

The privacy gate is passed and the old published docs site is unpublished. The repository-side GitBook configuration and Wave 1 navigation are now defined in Git.

The remaining external gate is interactive GitHub authorization for Git Sync inside the private GitBook space. Until that authorization is completed and first synchronization is verified, the GitBook space may still show its earlier empty placeholder page tree. That empty tree is not documentation authority and must not be manually populated as a competing copy.
