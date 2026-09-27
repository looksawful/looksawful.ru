# Issue tracker

The project uses two planning layers:

- Notion is the planning map and long-lived project/decision context.
- GitHub Issues are executable implementation packets when work is ready to be performed in the repository.

GitHub and Notion are not parallel trackers. A broad plan may stay only in Notion until there is a concrete repository action that can be executed and verified independently.

## Reading

When a branch, PR or commit references an issue number, fetch that issue before treating it as the implementation spec. Prefer the current issue body plus explicit later owner decisions over stale summaries.

Current repository/runtime reality outranks documentation claims. If an issue, handoff or Notion page describes a state that no longer matches the checked-out tree, active PRs, workflows or deployed evidence, reconcile the documentation rather than treating the stale description as authority.

If no issue exists, the current explicit user request and named canonical repository documents form the implementation spec. Do not invent a missing issue merely to satisfy a workflow.

## Operational vocabulary

Use these terms as lightweight descriptions of work, not as a mandatory metadata system.

- **Program / Umbrella**: a long-running parent that coordinates several independently executable work packages toward one outcome. It may remain open while children close and is not itself required to be directly implementable in one PR.
- **Work Package**: an independently understandable, executable, verifiable and closable unit of work. This is the default shape for a GitHub issue.
- **Wave**: an ordered batch inside a larger migration or refactor where sequencing and accumulated state matter. A wave may contain several slices.
- **Slice**: the smallest independently reviewable implementation step inside a wave or work package. Prefer a separate slice when combining changes would make ownership, verification or rollback unclear.
- **Quality Gate**: a blocking acceptance checkpoint. A gate defines evidence required before dependent work may proceed; it must state what is blocked and what constitutes GREEN.
- **Audit**: evidence-producing investigation of current state against a defined contract. An audit may close with GREEN, classified debt or a precise blocker; it must not disguise unapproved product changes as verification work.
- **Spike**: time-bounded investigation used to reduce uncertainty before committing to an implementation direction. Its output is evidence and a decision/recommendation, not production completion by implication.
- **Defect / Finding**: a concrete divergence between expected and observed behavior, data or policy. A finding becomes implementation work when its owner, scope and acceptance criteria are sufficiently clear.
- **PR**: the reviewable repository change that implements or proves a work package or slice. A PR is evidence of proposed code state, not a replacement for the owning issue or planning context.
- **Handoff**: a compact current-state record that lets another human or agent continue without reconstructing the work from chat history. It should contain exact refs, completed work, blockers, next action and verification state.
- **Retro**: the closeout record of what actually changed, why, exact refs, verification, incidents/deviations and any remaining follow-up. It records reality after execution rather than restating the original plan.

## When Notion work becomes a GitHub issue

Create or use a GitHub issue when repository work is ready enough that another agent or human can execute it without depending on private chat reconstruction. Except for an explicit Program/Umbrella or Quality Gate, the issue should be independently understandable, executable, verifiable and closable.

A broad Notion project does not need a GitHub mirror merely because it exists. Keep research, roadmap context, unresolved product direction and long-lived decisions in Notion until a concrete implementation, audit, defect or gate has a bounded repository-facing outcome.

Where relevant, an executable issue should state:

- goal or problem;
- scope;
- out of scope and important guardrails;
- dependencies and blockers;
- verification;
- acceptance criteria.

Small one-off defects and maintenance tasks may express these compactly. Do not inflate trivial work into ceremony merely to satisfy headings.

## Parent and dependency semantics

A parent/program reference explains coordination and ownership; it does not automatically make every child mutually dependent.

Use a dependency or blocker only when one work item genuinely cannot proceed or be accepted before another condition is satisfied. State the blocked action explicitly when ambiguity would matter, for example `implementation may proceed, merge blocked` or `do not start until gate closes`.

Do not infer permission to merge, deploy, publish, change branch topology or bypass a gate merely because a parent issue exists or a sibling has completed.

## Writing

Creating, editing, labeling, assigning, closing, moving or mirroring tasks between Notion and GitHub is an external mutation. Do it only when the user explicitly requests that action. A code-review or architecture skill may read planning context but does not gain permission to reorganize either system.

Keep executable engineering requirements in the GitHub issue that owns the work; keep broader roadmap/decision context in Notion rather than duplicating a second live specification in repository docs.

When material issue/program status, ownership, blockers or accepted direction change, reconcile the canonical Notion project in the same work cycle when that project is part of the task context. GitHub commits, PRs, workflow runs and runtime observations remain the implementation/CI evidence; do not replace exact repository evidence with a prose status copied into Notion.

Before closing a work package, make the issue, PR/runtime evidence and relevant Notion project describe the same current state. If they disagree, resolve the disagreement explicitly rather than choosing whichever summary is most convenient.

## Matt Flow operations

These operations adapt Matt engineering skills to this repository's existing GitHub Issues + Notion model. They do not create a second tracker or workflow state machine.

### Tool choice

The tracker is the source of truth, not a specific client.

- GPT/OpenClo should use an authenticated GitHub connector/API when available.
- An authenticated `gh` CLI inside the repository clone is an equivalent operation surface.
- If one operation surface lacks a capability, do not invent a parallel tracker. Use the documented GitHub fallback or surface the missing capability.

### Spec and ticket publication

- `to-spec`: publish a repository-facing implementation spec as a GitHub Issue when it is ready to become executable work. Broader unresolved roadmap/research may remain in Notion.
- `to-tickets`: create one GitHub Issue per approved tracer-bullet work package, preserve the parent/spec reference, and record real blocking edges.
- Apply the canonical triage role from `docs/agents/triage-labels.md` only when that label exists. Missing configured labels are SetupMatt debt, not permission to invent aliases.

### Wayfinding operations

Wayfinder is for decision work that is too large/foggy for one session. It is planning by default and does not grant implementation/merge/deploy authority.

- **Map:** one GitHub Issue carrying the `wayfinder:map` label, with Destination / Notes / Decisions so far / Not yet specified / Out of scope.
- **Child decision:** use a native GitHub sub-issue when the active GitHub operation surface supports it. Otherwise create a normal GitHub Issue, put `Part of <map link>` at the top, and link it from the map.
- **Decision type labels:** `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, `wayfinder:task`.
- **Blocking:** prefer native GitHub issue dependencies when supported. Otherwise put a leading `Blocked by: <issue links>` line in the child and keep the same dependency visible from the map.
- **Frontier:** the first open child in map order whose blockers are closed and which is unassigned.
- **Claim:** assign the child before doing decision work. If assignment cannot be performed through the current operation surface, do not pretend the ticket is exclusively claimed.
- **Resolve:** post the durable answer/evidence as a resolution comment, close the child, then append a one-line linked gist to Decisions so far on the map.
- **Research decisions:** may be resolved in parallel when they are independent; human-in-the-loop Grill/Prototype decisions are never self-answered by the agent.

### Wayfinder provisioning prerequisite

The label names above are the configured vocabulary, but documentation is not proof the labels exist in GitHub. Before the first Wayfinder map is created, verify or provision the five `wayfinder:*` labels through an authorized GitHub label-management surface. The currently connected GitHub operation surface does not expose repository-label creation, so this remains an explicit provisioning prerequisite rather than a fake completed setup.

