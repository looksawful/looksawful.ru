---
name: to-spec
description: Use when owner-approved decisions are clear enough to synthesize one executable repository specification and publish it to the configured GitHub Issues tracker without reopening settled questions.
---

# To Spec

Read `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and the smallest relevant current repository evidence before publishing.

## Input

Synthesize from decisions already made in Research, CodebaseDesign, Grill/Wayfinder, current repository evidence and explicit owner instructions.

Do not interview again unless a material requirement is genuinely missing. Never invent owner choices merely to fill a template.

## Shape

Use the established repository spec shape:

- Problem Statement
- Solution
- extensive numbered User Stories
- Implementation Decisions
- Testing Decisions
- Out of Scope
- Further Notes

Use canonical domain vocabulary from `CONTEXT.md`. Describe durable module/interfaces decisions, not brittle file-path implementation instructions.

## Test seams

Prefer the highest existing behavior seam. Reuse repository-owned seams instead of creating test-only interfaces. Any new seam must be justified by actual behavior or architecture pressure.

Testing decisions remain subject to `docs/testing-policy.md`; a Spec does not grant permanent-test status.

## Publish

Publish executable repository work to GitHub Issues and apply the configured `ready-for-agent` role when that label exists.

Keep unresolved roadmap/research in Notion rather than creating a competing live GitHub spec.

Publishing the Spec grants no merge, deploy, CMS publication or protection-bypass authority.

## Done

The Spec is complete when another fresh agent can understand the user problem, chosen solution, test seam, non-goals and material decisions without reconstructing chat history.
