# GitBook Private Documentation Architecture Implementation Plan

> **For agentic workers:** use Superpowers execution and verification skills. This file is an execution snapshot, not current technical authority.

**Goal:** Establish a private, free-only GitBook read/search/edit surface for looksawful.ru whose durable technical source of truth remains Git-backed repository documentation.

**Architecture:** `docs/**` on `dev` remains canonical durable documentation. GitBook consumes that seam through Git Sync. Notion remains planning/research/history until individual sources pass reconciliation. GitHub Issues/PR own TARGET work.

**Spec:** `docs/gitbook-architecture.md`

## Global constraints

- Authority order remains `docs/README.md`.
- `dev` is working/integration; `prod` is production/deploy.
- No mass Notion import before triage and evidence reconciliation.
- No private Notion/local/account data is copied into this public repository.
- GitBook must not expose project documentation publicly.
- The workflow must work on GitBook Free; no paid site feature is a dependency.
- Historical snapshots are preserved rather than rewritten as current truth.

### Task 1: Establish the private GitBook container

- [x] Verify the existing docs site/space publication state.
- [x] Unpublish the previously published docs site.
- [x] Verify the intended working space is private through GitBook account/API state.
- [x] Keep GitBook account/space identifiers private and out of the repository.
- [ ] Perform a final anonymous/browser access check after Git Sync is connected.

### Task 2: Prepare repository-backed Git Sync

- [x] Verify current GitBook `.gitbook.yaml` configuration syntax against official product documentation.
- [x] Add repository-root `.gitbook.yaml` with `root: ./docs/` and explicit README/SUMMARY paths.
- [x] Add conservative `docs/SUMMARY.md` from audited repository paths.
- [ ] In GitBook, authorize GitHub interactively.
- [ ] Connect `looksawful/looksawful.ru`, branch `dev`.
- [ ] Select GitHub -> GitBook for the first population so the empty GitBook skeleton cannot overwrite canonical Markdown.
- [ ] Verify an exact repository commit appears in GitBook.
- [ ] Verify a GitBook-originated edit follows Git/change history rather than becoming an unreviewed second canon.

### Task 3: Reconcile Wave 1 CURRENT docs

- [x] Re-audit the local Content / Media Desk behavior against current executable code/tests.
- [x] Correct operator/agent docs that still described ordinary `npm run desk` as write-capable.
- [x] Reclassify the Desk API document from an old integration-candidate label to current implementation/transitional status.
- [x] Reconcile `docs/README.md` so #451/#452/#453 are not presented as wholly unimplemented TARGET behavior after their core implementation landed.
- [x] Keep unresolved/open issue ownership explicit instead of auto-closing issues from documentation work.

### Task 4: Migrate in evidence-gated waves

- [ ] Wave 1: first Git Sync of the canonical files listed by `docs/SUMMARY.md`.
- [ ] Wave 2: reconcile partial overlaps and conflicting Notion/repository material into one canonical repository document per topic.
- [ ] Keep UNKNOWN/conflicting material out of primary navigation until evidence resolves it.
- [ ] Preserve provenance without copying private URLs or account data into public GitHub.

### Task 5: Acceptance verification

- [ ] Private-access test passes after sync.
- [ ] Repository -> GitBook synchronization works from `docs/**` on exact `dev` commit.
- [ ] Navigation resolves every `SUMMARY.md` target.
- [ ] GitBook-originated changes do not bypass repository change history.
- [ ] No private connector/account data leaked to public GitHub.
- [ ] No canonical topic has two independently maintained CURRENT documents.
- [ ] Workflow remains usable with GitBook Free only.
