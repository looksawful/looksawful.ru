---
name: wayfinder
description: Use for genuinely foggy multi-session decision work whose route to a spec or other destination is not yet visible; maintain a shared GitHub decision map using the repository's configured tracker operations.
---

# Wayfinder

Read `docs/agents/issue-tracker.md` before creating or working a map.

## When to use

Use Wayfinder only when the destination spans more than one session and important decisions cannot yet be stated as a normal Spec/Tickets sequence.

If Research/CodebaseDesign/Grill already made the route clear, do not create a map. Continue to Spec.

Wayfinder plans by default. It does not implement the destination.

## Map

Use the configured GitHub operations:

- one map issue with `wayfinder:map`;
- decision tickets with exactly one of `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, `wayfinder:task`;
- native sub-issue/dependency relationships when the active GitHub surface safely exposes them;
- otherwise the documented Parent / Blocked-by body fallback.

If a required Wayfinder label is missing and the current authorized surface cannot create repository labels, stop before pretending the map is fully provisioned. Report the prerequisite; do not invent aliases.

The map stores Destination, Notes, Decisions so far, Not yet specified and Out of scope. Decision detail lives in the ticket, not duplicated in the map.

## Frontier and claims

The frontier is open, unblocked, unclaimed decision work.

Claim a decision through assignment when the active tracker surface supports it. Never claim exclusivity if assignment could not actually be written.

Resolve one human-in-the-loop decision per session. Independent Research tickets may proceed in parallel.

## Resolution

A resolved decision gets:
1. a durable resolution comment/evidence;
2. a closed decision ticket;
3. one linked gist appended to Decisions so far;
4. newly visible fog graduated into tickets only when the question is now precise.

Use `research` for AFK evidence work, `prototype` when a concrete throwaway artifact is needed, and `grill-with-docs` for human decisions.

## Boundary

Wayfinder labels are planning metadata, not implementation state or permission. Repository policy, triage roles, tests, branch rules and publication guards remain authoritative.

## Done

The map is done when no decision fog remains between the current state and its named destination. Hand off to Spec/Tickets or the destination's next normal repository workflow.
