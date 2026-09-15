# GitBook Private Documentation Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a private GitBook read/review surface for looksawful.ru whose durable technical source of truth remains Git-backed repository documentation.

**Architecture:** `docs/**` on `dev` remains the canonical durable documentation seam. GitBook consumes that seam through Git Sync and provides navigation, search and review; it must not become an independent competing canon. Notion remains planning/research/history until individual sources pass reconciliation. GitHub Issues/PR own TARGET work.

**Tech Stack:** GitBook, GitHub Git Sync, Markdown, repository `docs/**`, GitHub pull requests.

**Spec:** `docs/gitbook-architecture.md`

## Global Constraints

- Authority order remains the one defined in `docs/README.md`.
- `dev` is working/integration; `prod` is production/deploy.
- No mass Notion import before triage and evidence reconciliation.
- No private Notion/local/account data is copied into this public repository.
- GitBook must not expose project documentation publicly before private access is configured and verified.
- Historical snapshots are preserved rather than rewritten as current truth.

---

### Task 1: Establish the private GitBook container

**Files:**
- No repository files changed.

**Interfaces:**
- Consumes: existing GitBook organization and access controls.
- Produces: one private/unpublished GitBook documentation surface ready for Git Sync.

- [ ] Verify current site/space visibility before importing any repository content.
- [ ] Prefer an unpublished/private organization space for owner-only use. If a published site is required for browser-style consumption, use a revocable private share link rather than public publishing.
- [ ] Verify anonymous access cannot read the documentation surface.
- [ ] Record the selected GitBook space/site identifier privately; do not publish account-scoped identifiers in GitHub.

### Task 2: Configure repository-backed Git Sync

**Files:**
- Create after compatibility verification: `.gitbook.yaml`
- Create after content reconciliation: `docs/SUMMARY.md`

**Interfaces:**
- Consumes: `looksawful/looksawful.ru`, branch `dev`, repository `docs/**`.
- Produces: synchronized GitBook representation of canonical Markdown.

- [ ] Connect GitBook Git Sync to `looksawful/looksawful.ru` and branch `dev`.
- [ ] Set the documentation root to `docs/` through the supported GitBook configuration mechanism.
- [ ] Import GitHub → GitBook first; do not overwrite repository documents from an empty/new GitBook space.
- [ ] Verify a repository Markdown change appears in GitBook without creating duplicate authored pages.
- [ ] Verify a GitBook edit follows the configured review/change-request path and does not bypass repository review policy.

### Task 3: Build the navigation index from audited canonical docs

**Files:**
- Create: `docs/SUMMARY.md`

**Interfaces:**
- Consumes: verified CURRENT docs and the classification in `docs/README.md`.
- Produces: GitBook navigation only; it does not redefine document authority.

- [ ] Include `docs/README.md` as the documentation entry point.
- [ ] Group verified pages under Architecture, Frontend & Pages, Design System, Content & CMS, Media, Operations, Testing & Quality, Agents & Automation, Decisions & Programs, Reference, Historical & Archive.
- [ ] Keep TARGET plans and historical snapshots visually separated from CURRENT operational material.
- [ ] Exclude untriaged Notion imports and unresolved conflicting documents from the primary navigation.
- [ ] Run a relative-link check for every `SUMMARY.md` target.

### Task 4: Apply the metadata contract during reconciliation

**Files:**
- Modify only documents approved by the migration matrix; no blanket rewrite.

**Interfaces:**
- Consumes: source classification/evidence.
- Produces: explicit document lifecycle metadata.

- [ ] For each canonical page, record `Status`, `Owner`, `Last verified`, `Verified against`, `Source / provenance`, `Related issues / PRs`, and `Supersedes / Superseded by` when applicable.
- [ ] Use only CURRENT DEV, CURRENT PROD, TARGET, SNAPSHOT, HISTORICAL plus the repository's finer CURRENT classes where needed.
- [ ] Bind technical verification to branch/SHA or executable evidence where a claim can drift.
- [ ] Never upgrade DRAFT/TARGET/SNAPSHOT to CURRENT because of recency or prose quality.

### Task 5: Enforce documentation lifecycle

**Files:**
- Modify: `docs/README.md` only after review confirms the lifecycle belongs in the canonical policy index.

**Interfaces:**
- Consumes: canonical docs and change history.
- Produces: lifecycle `DRAFT -> REVIEW -> VERIFIED CURRENT -> STALE -> SUPERSEDED/HISTORICAL`.

- [ ] Mark a page STALE when its verification baseline changes in an owning executable surface and the claim has not been revalidated.
- [ ] Require review before STALE material returns to VERIFIED CURRENT.
- [ ] Preserve superseded pages when they carry provenance; link forward to their replacement.
- [ ] Keep open implementation work in GitHub Issues/PR rather than turning GitBook into a second task tracker.

### Task 6: Migrate in evidence-gated waves

**Files:**
- Modify/create only canonical Markdown approved by the migration matrix.

**Interfaces:**
- Consumes: Notion inventory + migration matrix + repository evidence.
- Produces: reconciled Git-backed docs visible through GitBook.

- [ ] Wave 1: sync already verified CURRENT repository documents.
- [ ] Wave 2: reconcile partial overlaps and conflicting Notion/repository material into one canonical repository document per topic.
- [ ] Quarantine: keep UNKNOWN/conflicting material out of the main GitBook navigation until evidence resolves it.
- [ ] Preserve provenance pointers without copying private URLs or sensitive source data into public GitHub.

### Task 7: Acceptance verification

**Files:**
- No new files unless a narrowly scoped verification fix is required.

**Interfaces:**
- Consumes: configured GitBook + repository branch.
- Produces: GO/NO-GO decision for normal use.

- [ ] Anonymous access test: private docs are not readable without intended access.
- [ ] Git Sync test: repository → GitBook synchronization works from `docs/**`.
- [ ] Review-path test: GitBook-originated edits cannot silently become canonical without the agreed Git/review path.
- [ ] Navigation test: every primary page resolves and CURRENT/TARGET/HISTORICAL are distinguishable.
- [ ] Provenance test: no historical source was destroyed and no private connector/account data leaked to public GitHub.
- [ ] Duplication test: no canonical topic has two independently maintained CURRENT documents.
