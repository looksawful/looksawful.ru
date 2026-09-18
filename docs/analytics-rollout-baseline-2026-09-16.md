# Analytics rollout baseline — 2026-09-16

This snapshot records the repository state used to plan the safe analytics rollout. It is a coordination artifact, not release approval.

- `looksawful.ru/dev`: `28a294e188cc1a5fbb856cc542e25b3b7052e349`
- `looksawful.ru/prod`: `9cd91fd5cf2e15bd03f489972cb8da92a961f8b0`
- `awful-control/main`: `09d8fce1f0a5280a7fe9286c3b957db40f2efc17`

At this point `dev` and `prod` are divergent and must not be merged wholesale for the analytics release. The production release path is a narrow candidate created from the then-current `prod`, containing only the approved analytics delta and verified through the repository release preflight.

The public analytics implementation already exists on `dev` but still requires correctness fixes and fresh exact-head verification before any production backport. The private Yandex control plane has restored read-only Metrika source access, while the complete weekly analytics brief still requires a fresh successful run before the earlier reporting incident is considered fully closed.
