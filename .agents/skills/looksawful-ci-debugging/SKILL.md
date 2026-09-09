---
name: looksawful-ci-debugging
description: Use when looksawful.ru GitHub Actions, Fast CI, Agent Verify, Dependency Review, CodeQL, responsive/browser, build, or other repository checks fail and need evidence-first triage without weakening guards.
---

# Looksawful CI debugging

Treat a red workflow as an observation, not a diagnosis. Start from the exact failing SHA and classify the failure before changing code, tests, workflows, or dependencies.

## Triage loop

1. Record exact commit SHA, workflow run, job, failing step, and first useful error.
2. Separate failure class:
   - source/behavior regression;
   - test or fixture defect;
   - dependency/toolchain problem;
   - browser/provisioning/environment problem;
   - workflow/permissions/configuration problem;
   - transient external failure.
3. Read the narrow job/step logs and relevant artifact before rerunning broad suites.
4. Reproduce with the cheapest repository command that exercises the same contract.
5. Fix the owning source or workflow contract without weakening unrelated guards.
6. Re-run the same focused check on the exact new head, then escalate only to the configured merge/release gate.

## Repository-specific routing

- **Fast CI:** identify the specific permanent contract that failed; do not add/remove Fast tests casually to make the allowlist green.
- **Agent Verify:** use the finite exact-SHA profile appropriate to the task (`fast`, browser smoke, responsive) rather than an open-ended agent loop.
- **Dependency Review:** inspect the introduced dependency/risk; do not bypass or downgrade the check to land unrelated work.
- **CodeQL/security:** distinguish a real code/data-flow finding from workflow setup noise; never silence a finding with unsafe casts, sanitization removal, or exclusions unless the exclusion itself is justified and reviewed.
- **Browser/responsive:** add `looksawful-playwright-debugging` and inspect trace/console/network/state before changing product code.
- **CSS/style:** prefer the current narrow static checks (`lint:style`, future `css:check`/`css:affected`) before broad browser verification when the failure is statically classifiable.

## Retry discipline

- Do not rerun a failed job repeatedly without learning anything from its logs.
- Retry once when evidence points to an external/transient failure; repeated identical failures are not transient by wishful thinking.
- Do not increase timeouts, retries, or sleeps as the first fix for deterministic failures.
- If two failures occur in the same workflow, classify them independently until evidence proves a shared root cause.

## Protected surfaces

Changes to `.github/workflows/**`, CI classifiers, package scripts, permissions, branch policy, or publication guards are policy/tooling changes. Add `looksawful-policy-boundaries`, preserve fail-closed behavior, and review the diff separately.

Never use `--no-verify`, hidden overrides, permissions expansion, skipped checks, or test deletion merely to convert RED to GREEN.

## Completion

A CI investigation is complete when the root-cause class is stated, the smallest equivalent reproduction is GREEN (or the external/transient cause is evidenced), and the exact head has the required configured gate result. Do not claim a workflow is green from an older SHA.

## Upstream reference

Adapted from GitHub `gh-aw` failure-triage and workflow-debugging guidance, reviewed at commit `102cf77b34572420cedf251bb92198f6df709e77`. `gh-aw`-specific orchestration commands are not imported as project requirements; this skill targets the repository's existing GitHub Actions and exact-SHA verification model.
