# Triage labels

Matt/Engineering skills speak in five canonical triage roles. This file maps those roles to the GitHub label strings used by this repository.

| Canonical role | GitHub label | Meaning |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | Incoming work still needs classification or executable scope |
| `needs-info` | `needs-info` | Missing facts, reproduction evidence or owner input prevent progress |
| `ready-for-agent` | `ready-for-agent` | Work is bounded, repository-facing and executable with clear verification |
| `ready-for-human` | `ready-for-human` | A human decision, approval or credentialed action is required |
| `wontfix` | `wontfix` | The owner intentionally decided not to pursue the work |

## Consumer rules

- Use these exact strings when the labels exist; do not invent synonymous workflow labels.
- These are lightweight triage roles, not a second project state machine, severity system, priority scheme or merge/deploy permission.
- Prefer one canonical triage role at a time. Existing category/area labels may coexist.
- `ready-for-agent` is already used by current executable work such as the Round 3 issue family.
- This mapping does not prove every configured label exists in GitHub. Missing labels must be provisioned or reported as SetupMatt debt, not silently replaced.
- Wayfinder-specific labels are configured separately in `docs/agents/issue-tracker.md`.
