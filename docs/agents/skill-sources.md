# Agent skill sources and provenance

Status: review record for repository-local agent guidance. External sources are references, not runtime instructions. The local adapted skills remain subject to `AGENTS.md`, canonical project docs, code and tests.

## Reviewed upstream sources

| Source | Pinned review commit | What was adopted |
| --- | --- | --- |
| Matt Pocock `mattpocock/skills` | `3cca18b368ae95cdbdebbff572ccafa662551015` | debugging/TDD/codebase-design/merge-conflict skills already present; standards-vs-spec review, domain modeling, architecture-review, prototype, handoff and agent-writing workflow patterns |
| Addy Osmani `addyosmani/web-quality-skills` | `afa8da942115f2961fdbfa80807ea0b232ff6c00` | measurement-first performance/Core Web Vitals, accessibility, SEO and best-practice audit principles |
| Meng To `MengTo/Skills` | `321c769739b823de5eb94eb3a52aa1974fe783a2` | animation profiling, offscreen work gating, lifecycle/leak cleanup patterns for CSS/GSAP/Canvas/WebGL/Three.js |
| PyModel `PyModel/css-pro-tips` | `7332ca009ecc469f1bc26bd4083620b022896610` | modern CSS decision order, intrinsic/container-driven layout, progressive enhancement and explicit protection against incidental framework/toolchain migration |
| CloudAI-X `CloudAI-X/threejs-skills` | `b1c623076c661fc9b03dac19292e825a5d106823` | focused Three.js shader, material, texture and loader reference patterns, adapted behind the repository's existing runtime/lifecycle rules |

## Local adaptation rule

We intentionally do not copy a large generic bundle blindly. Project-local skills encode the useful workflow while routing back to the actual looksawful.ru contracts. This prevents generic advice from overriding current CSS ownership, motion, Media Catalog, CMS publication or testing policies.

Exact dependency versions are not duplicated here; read `package.json` so agent guidance cannot drift behind the repository.

## Excluded patterns

- Unverified community GSAP/CSS skills with weak maintenance/provenance.
- Skills that dynamically fetch remote instructions during execution.
- Workflow packs that impose a second issue/label/state machine over the repository's current tracker and test lifecycle.
- Generic visual-design skills that are likely to restyle an established design system during implementation work.

Updating these skills is a reviewable policy/tooling change, not an automatic `latest` update.
