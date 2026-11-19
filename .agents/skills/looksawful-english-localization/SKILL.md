---
name: looksawful-english-localization
description: Translate and review looksawful.ru Russian portfolio copy into clear, lightly witty, fact-faithful English. Use for EN drafts, case studies, captions, credits, UI, SEO, and bilingual copy QA.
---

# English localization for looksawful.ru

Translate **authored meaning**, not marketing potential. This skill covers language production and editorial review. Routing, publishing, and code changes remain separate repository tasks.

## Inputs and ownership

1. Read `AGENTS.md`, `docs/cms-architecture.md`, and the relevant current GitHub localization issue. Check the actual branch and source SHA before work; `dev` authored source files, including HTML and TypeScript where applicable, are authoritative. An inventory CSV is an **audit aid**, not proof of runtime visibility.
2. Capture the exact RU text, owning file + field/ID, the Case or UI context, any approved names/terms, constraints (length, markup, alt/ARIA, SEO), and source SHA. Never edit Russian originals as part of English translation.
3. Consult existing EN candidates in `src/content/i18n/en/` and the project's editorial archives only as **candidates**. Compare against fresh RU before reusing. Do not introduce a second CMS, data registry, or source of truth.

## Translate

- Write natural, accessible English that a smart non-native speaker understands on the first reading. Prefer direct verbs and concrete nouns, short but not choppy sentences, and normal conversational contractions when appropriate.
- Voice: clear, understated, confident, **occasionally dry or lightly ironic**. Preserve the author's specific personality; do not insert a joke into each line. No posturing, SaaS clichés, inflated adjectives, or polished corporate filler.
- Preserve **every factual proposition**: people, roles and extent of contribution, clients, projects, dates, numbers, credits, relationships, methods, outcomes, links and qualifiers. Never invent a metric, achievement, intention, quote, agency/client relationship or causal claim.
- Keep IDs, placeholders, paths, URLs, markup, variable interpolation and component contracts untouched. Translate names/brand terms only if an approved English form exists; use one spelling convention consistently.
- In credits, legal/privacy, accessibility, safety and error text prioritize precision and neutrality over humor. Translate `alt` for the depicted content and purpose, not for an imagined image.

## Review: a distinct pass after drafting

1. Compare each EN proposition **against the exact RU and independently supported project facts**, not against the translator's memory or an English draft. Extract names, dates, numbers, roles, negatives, caveats and claims; mark `verified`, `needs-evidence`, or `conflict`.
2. Check paragraph/section count, field IDs, missing or extra meaning, links, escaping, placeholders, typography, readability and terminology. Reject unsupported added claims even when fluent. Do not silently “improve” an ambiguous fact: report the field and the source conflict in the owning Issue.
3. Review the actual rendered English page and reachable states when a build exists: visible text, captions, credits, metadata, alt/ARIA, mobile wrapping and JS-off content. The project's existing `docs/testing-policy.md` and tests govern test scope; an automated translation score is not approval.
4. Record changed field IDs, RU source SHA, reused EN provenance, findings and remaining uncertainty in the owning GitHub issue. Coordinate through the existing Asana task when relevant; do not duplicate the text source there. Mark copy ready only after the required editorial QA.

## Handoff contract

Return field-level **RU → EN** proposals with source path/ID and status (`draft`, `reviewed`, `blocked`, or `not-applicable`). Keep unresolved factual decisions visible. Source edits, `dev` merge and deployment require their own explicit authorization and checks; the localization release gate in [#1306](https://github.com/looksawful/looksawful.ru/issues/1306) remains in force.

## Reviewed principles

Adapted, not vendored wholesale, from version-pinned upstream skills recorded in `docs/agents/skill-sources.md`: `translation` (source lock and glossary), `copy-editing` (voice/clarity), `antislop-copywriting` (non-invention and anti-cliché), `fact-check` (separate source-backed verification), and `localization-testing` (rendered QA). None of them overrides repository-local policy.
