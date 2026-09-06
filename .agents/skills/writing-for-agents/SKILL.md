---
name: writing-for-agents
description: Use when creating or editing AGENTS.md, repository-local skills, agent-context docs, or other instructions consumed by coding agents.
---

# Writing for agents

Agent instructions are operational guidance, not a security boundary. Real enforcement lives in code, parsers, workflows, permissions and tests.

## Write small context pointers

Always-loaded text should mainly route the agent to the right source. A pointer must say what the target contains and when to read it. Avoid duplicating long rules in both `AGENTS.md` and a skill.

## Information hierarchy

1. Put ordered work in short executable steps.
2. Keep reference material next to the concept it explains.
3. Move branch-specific detail into a focused skill or canonical doc and link it from the routing layer.

## Completion criteria

Every workflow needs a checkable end condition. Prefer evidence such as a resolved diff, passing named check, stable runtime measurement, or explicit review result over vague phrases such as "make sure it works".

## Prune

- Keep one source of truth for each rule.
- Do not cache values an agent can cheaply read from `package.json`, code or config; those copies go stale.
- Remove obsolete instructions rather than layering a new contradictory paragraph underneath them.
- Prefer positive target behavior. Use prohibitions only for important guardrails and pair them with the intended safe action.
- A new skill should cover a distinct recurring workflow. Do not create a skill for a one-off task or a synonym of an existing one.

## Protected surface review

Changes to `AGENTS.md` and `.agents/skills/**` are policy/tooling changes in this repository. Read `looksawful-policy-boundaries`, inspect the diff independently, and verify that no skill grants permission to merge/deploy/publish/bypass guards.
