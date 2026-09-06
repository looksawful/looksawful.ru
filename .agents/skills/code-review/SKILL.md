---
name: code-review
description: Review a branch or diff on two separate axes: repository standards and requested/spec behavior.
---

# Code review

Review the diff against a fixed point. Keep **Standards** and **Spec** separate so one cannot hide failure in the other.

## 1. Pin the comparison

Resolve the fixed point and inspect:

```text
git diff <fixed-point>...HEAD
git log <fixed-point>..HEAD --oneline
```

Fail early on a bad ref or empty diff.

## 2. Find the spec

Use `docs/agents/issue-tracker.md`.

Priority:
1. issue/PR reference in branch or commit history;
2. explicit user-provided spec/doc;
3. relevant canonical repository document;
4. the explicit current user request.

If there is no separate spec, say so instead of inventing one.

## 3. Standards axis

Read `AGENTS.md` plus the smallest relevant canonical docs and tests. Report only actionable findings introduced by the diff.

Check especially:
- protected policy surfaces and branch/CMS boundaries;
- authored copy preservation;
- TypeScript/runtime contracts;
- test lifecycle and CI tiering;
- cleanup/lifecycle/resource ownership;
- duplicated or speculative abstractions;
- changes scattered across owners that should remain local.

Tool-enforced formatting is not a review finding unless the tool actually fails.

## 4. Spec axis

Report:
- missing/partial requested behavior;
- incorrect behavior;
- scope creep;
- unverified claims that the implementation says are complete.

Quote or cite the requirement source when available.

## Output

Use two sections: `Standards` and `Spec`. Do not merge their severities into one score. End with the number of findings on each axis and the strongest issue within each axis.
