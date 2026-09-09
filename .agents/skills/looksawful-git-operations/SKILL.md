---
name: looksawful-git-operations
description: Use when looksawful.ru work needs branch creation, worktrees, drift/rebase alternatives, cherry-picking, bisect/recovery, or coordination of parallel agent branches without overwriting shared work.
---

# Looksawful Git operations

Read the live branch state before acting. `dev` is the integration branch and `prod` is the production/deploy source, but current GitHub state is stronger evidence than memory or old handoff notes.

## Safe start

1. Record current branch, exact HEAD SHA, status/diff, and target base.
2. Preserve unrelated user/agent changes.
3. For a new slice, branch from an explicitly recorded current base SHA rather than a remembered checkpoint.
4. For parallel work, prefer a separate branch/worktree to stashing or repeatedly switching one dirty checkout.

## Parallel-agent discipline

- Independent tooling/docs/test-only work may proceed in parallel when it does not write the same protected or production ownership surface.
- For overlapping production CSS/runtime ownership, follow the current issue/owner lock and keep only one active write slice where the program requires serialization.
- A prep branch may characterize/tests/docs without silently becoming a production write branch.
- Before promotion or merge review, compare the branch to the latest target branch and classify drift by files and intent.

## Drift handling

When `dev` advances:

1. fetch/read the new `dev` SHA;
2. compare old base → new base and base → feature branch;
3. determine whether the drift touches the same files/contracts;
4. if independent, avoid gratuitous history surgery;
5. if integration is required, use the least destructive explicit operation allowed by the task and repository policy, then re-verify the exact resulting head.

Do not use force-push, `reset --hard`, forced checkout, rebase, or merge as an incidental repair shortcut. Never rewrite shared `dev`/`prod` history.

## Focused tools

- Use worktrees for simultaneous isolated branches when local tooling supports them.
- Use `git bisect` only with a deterministic pass/fail command and a clean/isolated working tree.
- Use cherry-pick only when the task explicitly needs a known commit transferred and the resulting diff is reviewed; do not use it to mask uncertain branch provenance.
- Use reflog/recovery techniques to recover lost local work, not to bypass review or resurrect obsolete architecture blindly.

## PR readiness

Before calling a branch ready:

- target base is freshly read;
- the branch diff contains only intended files;
- no unrelated user/agent work was overwritten;
- required focused verification passed on the exact head;
- merge/deploy remains a separate explicit external action unless the user requested it.

## Upstream reference

Adapted from `wshobson/agents` `git-advanced-workflows`, reviewed at commit `a30778f8c4e6b0a87567941b7cca4f534bf642b6`. Upstream recommendations to rebase/force history are deliberately constrained by looksawful.ru's stricter shared-branch and protected-surface policy.
