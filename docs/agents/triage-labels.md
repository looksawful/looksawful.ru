# Triage labels

This repository uses the default five-role triage vocabulary expected by the engineering skills.

| Role | Label | Meaning |
| --- | --- | --- |
| Needs triage | `needs-triage` | Incoming work has not yet been classified or made executable. |
| Needs info | `needs-info` | Progress is blocked on missing facts, reproduction details, or an owner answer. |
| Ready for agent | `ready-for-agent` | The work is bounded, repository-facing, and executable by an agent with clear verification. |
| Ready for human | `ready-for-human` | A human decision, approval, credentialed action, or other human-owned step is required. |
| Won't fix | `wontfix` | The repository owner has intentionally decided not to pursue the work. |

## Consumer rules

- Use these exact label strings. Do not invent synonymous triage labels.
- Treat the labels as workflow state, not as severity, priority, product area, or implementation status.
- Prefer one canonical triage-role label at a time. Other non-triage labels may coexist when the repository already uses them.
- Changing this vocabulary is a policy/tooling change and should update this file and the `AGENTS.md` pointer together.
