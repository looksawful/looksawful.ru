---
name: implement
description: Use for a ready repository work package whose scope and acceptance criteria are already explicit; execute it through repository-local subject skills, TDD where applicable, verification, and fixed-point Code Review.
---

# Implement

Implementation follows the owning Spec/ticket. It is not permission to widen scope.

## Before changing code

1. Read the owning issue/spec and current comments.
2. Inspect current branch/ref/diff and preserve unrelated work.
3. Read the smallest relevant canonical docs and repository-local subject skill.
4. For behavior changes, identify the public seam and use `tdd` subject to `docs/testing-policy.md`.
5. For protected policy/tooling surfaces, use `writing-for-agents` / `looksawful-policy-boundaries` or the relevant protected-surface skill.

## Work

- Implement one ticket/slice at a time.
- Prefer the existing owner/module over parallel abstractions.
- Keep authored copy, media identity, CMS ownership, branch topology and release behavior unchanged unless the ticket explicitly owns them.
- Run the cheapest relevant checks during the loop.
- Temporary RED/GREEN tests remain temporary unless they qualify as durable contracts under the testing policy.

Do not merge, deploy, publish CMS state, bypass checks or perform destructive Git operations merely because implementation is complete.

## Review loop

Once the ticket behavior is implemented and focused verification is GREEN, run `code-review` from a fixed point.

Keep Standards and Spec findings separate. Any actionable finding returns to the owning ticket/TDD implementation loop, followed by another fixed-point review.

## Done

Implementation is complete only when:
- the ticket acceptance criteria are met;
- relevant verification is recorded on the exact candidate head;
- changed tests are classified KEEP / MOVE / DELETE;
- Code Review has no unresolved actionable Standards or Spec findings;
- external actions beyond the user's authorization remain undone.
