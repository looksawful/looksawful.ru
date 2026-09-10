---
name: looksawful-editorial-bridge
description: "Use when auditing, editing, translating, fact-checking, or restructuring authored website copy for looksawful.ru. Routes copy work through the canonical looksawful-editorial and Notion sources without making production site copy authoritative."
---

# Looksawful Editorial Bridge

Use this skill for authored/user-facing text work only. Structural, CSS, runtime, media, and architecture refactors must not rewrite copy incidentally.

## Canonical route

1. Treat the current user correction as highest priority.
2. Load the relevant canonical facts, Project Resume, Editorial Policy, glossary, and project-specific canon from `looksawful/looksawful-editorial` / Notion `Редакция` before drafting or judging factual claims.
3. Use the editorial repository's local/vendor routing for copy-editing, RU naturalness, plain English, translation, UX writing, fact-checking, and claim validation.
4. Treat `looksawful.ru` production copy as an audit corpus, not proof that wording or claims are correct.
5. Keep copy changes isolated from code/layout refactors and preserve stable content locations so discrepancies can be traced back to route, locale, source file and field.

## Required behavior

- Never improve a claim beyond its evidence, attribution, causality, metric meaning, or confidence level.
- Never copy a second factual canon into this repository. Link/rout to the editorial source instead.
- For audit-only requests, report discrepancies first; do not mutate copy unless the task explicitly includes editing.
- For RU/EN work, use the approved glossary before generic translation preferences.
- For interface microcopy, separate UX-writing decisions from case-study/portfolio prose.
- After semantic editing, deterministic spelling/typography checks are supporting tools, not semantic authority.

## Refactor boundary

Before deep refactoring, export or enumerate affected authored copy locations and keep a before/after semantic comparison. Tests should protect structure, identity, escaping, composition and source ownership, not freeze editable literal sentences.

## Stop

Stop and report a source conflict when the site, editorial repository and Notion disagree on a material fact and recency/authority cannot be established safely.