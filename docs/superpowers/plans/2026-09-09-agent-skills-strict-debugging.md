# Agent Skills Strict Debugging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four small repository-local skills that improve TypeScript safety, Playwright failure diagnosis, parallel Git operations, and CI triage without introducing a second workflow system.

**Architecture:** Keep `AGENTS.md` as a short router. Each new skill owns one recurring workflow and adapts a pinned public source to looksawful.ru policy. Existing code, tests, `docs/testing-policy.md`, branch rules, and project-local skills remain authoritative.

**Tech Stack:** Markdown repository skills, GitHub Actions/Playwright/TypeScript/Git.

**Spec:** User-approved shortlist from the 2026-09-09 agent-skill audit.

## Global Constraints

- No production runtime, CSS, CMS, or authored-copy changes.
- Do not grant merge, deploy, publish, force-push, guard-bypass, or branch-topology authority through prose.
- Do not copy framework-specific upstream rules that do not apply to this Vite + TypeScript site.
- Keep upstream provenance pinned in `docs/agents/skill-sources.md`.

---

### Task 1: Add strict TypeScript guidance

**Files:**
- Create: `.agents/skills/looksawful-typescript-strict/SKILL.md`
- Modify: `AGENTS.md`

- [ ] Add a strict boundary-first TS workflow covering `unknown`, type guards, no new `any`, reference search, JS→TS replacement, and cheapest relevant verification.
- [ ] Route TS migration/type-safety work to the skill without changing runtime behavior.

### Task 2: Add Playwright failure diagnosis

**Files:**
- Create: `.agents/skills/looksawful-playwright-debugging/SKILL.md`
- Modify: `AGENTS.md`

- [ ] Add trace-first diagnosis for failed browser checks, stable visual fixtures, motion/media nondeterminism classification, and temporary-probe cleanup.

### Task 3: Add Git operations guidance

**Files:**
- Create: `.agents/skills/looksawful-git-operations/SKILL.md`
- Modify: `AGENTS.md`

- [ ] Add exact-SHA branching, worktree-first parallelism, drift comparison, and safe recovery guidance constrained by the repository's no-destructive-history rules.

### Task 4: Add CI failure triage

**Files:**
- Create: `.agents/skills/looksawful-ci-debugging/SKILL.md`
- Modify: `AGENTS.md`

- [ ] Add workflow → job → step classification, cheapest reproduction, exact-SHA verification, and guard-preserving remediation.

### Task 5: Record provenance and review the protected-surface diff

**Files:**
- Modify: `docs/agents/skill-sources.md`

- [ ] Record pinned upstream review commits for LobeHub, Microsoft Playwright, wshobson/agents, and github/gh-aw.
- [ ] Compare the branch with its exact base and confirm only skills/router/provenance/plan docs changed.
- [ ] Run the repository's focused smoke/Fast verification available for `.agents/skills/**` changes before promotion.
