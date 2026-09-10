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
| LobeHub `lobehub/lobehub` TypeScript skill | `906b10e03029648655e0257bda4f785a9e0973f0` | strict boundary typing, no-new-`any`, inference, precise contracts, safe JS→TS migration patterns; LobeHub-specific React/Ant/database conventions excluded |
| Microsoft `microsoft/playwright` trace skill | `4302dbb90f65e80da3f4f08a2e028c9e642b64b9` | trace-first Playwright diagnosis across actions, errors, console, requests and snapshots; adapted to repository affected-test and temporary-test policy |
| Seth Hobson `wshobson/agents` Git advanced workflows | `a30778f8c4e6b0a87567941b7cca4f534bf642b6` | worktrees, bisect, drift/recovery concepts and clean-branch discipline; destructive history recommendations constrained by repository policy |
| GitHub `github/gh-aw` workflow debugging | `102cf77b34572420cedf251bb92198f6df709e77` | workflow/job/step failure classification, log-first triage and independent root-cause analysis; gh-aw orchestration itself not adopted |
| `looksawful/looksawful-editorial` | `17bddb671a44af9e9a9f2cd8304dd15fbe7f8266` | canonical fact/copy source routing, RU/EN glossary precedence, copy-editing, translation, UX-writing and fact-check boundaries; adapted as `looksawful-editorial-bridge`, canonical editorial truth is not copied into this repository |
| OpenAI `openai/plugins` | `d416fd5a43426019986b1e489506db3db66dee3d` | browser-visible QA loop from Build Web Apps, game architecture/playtest separation from Game Studio, and source-preserving/exact-content principles from Creative Production; adapted as `looksawful-design-audit`, `looksawful-game-refactor`, and `looksawful-visual-production` |
| Anthropic `anthropics/claude-code` frontend-design | `e62465d553ecbf1697219ffbb3c11b4fef14d5bf` | deliberate, non-generic visual direction for explicit redesign work; constrained behind the repository's existing design system, content ownership, responsive and verification rules |

## Refactor-domain capability map

| Domain | Local executable owner | External/reference support | Status |
| --- | --- | --- | --- |
| Authored portfolio copy, RU/EN editing, fact checking | `looksawful-editorial-bridge` | `looksawful-editorial` vendor/local editorial stack | local adapter |
| UX flows, interaction hierarchy, responsive/a11y design audit | `looksawful-design-audit` + existing `looksawful-frontend-runtime` / `looksawful-web-quality` | OpenAI Build Web Apps/Product Design methods; Anthropic frontend-design as visual-direction reference | local adapter |
| Graphics, generated imagery, mockups, covers, visual asset review | `looksawful-visual-production` + existing `looksawful-media-cms` | OpenAI Creative Production source-preservation/exact-content workflow | local adapter |
| Games / pet experiences | `looksawful-game-refactor` + existing runtime/debug/test skills | OpenAI Game Studio foundations/playtest patterns | local adapter |
| CSS architecture and modern layout | existing `looksawful-modern-css` + `looksawful-frontend-runtime` | PyModel CSS references | existing owner |
| TypeScript / code architecture / refactor | existing `looksawful-typescript-strict`, `codebase-design`, `architecture-review`, `tdd` | Matt Pocock/LobeHub sources above | existing owner |
| Browser QA / regression diagnosis | existing `looksawful-playwright-debugging` + `looksawful-web-quality` | Microsoft Playwright + OpenAI browser-QA methods | existing owner |
| Three.js / GLSL / 3D web assets | existing `looksawful-threejs-shaders`, `looksawful-threejs-assets`, `optimize-web-animations` | CloudAI-X + Meng To | existing owner |

## Local adaptation rule

We intentionally do not copy a large generic bundle blindly. Project-local skills encode the useful workflow while routing back to the actual looksawful.ru contracts. This prevents generic advice from overriding current CSS ownership, motion, Media Catalog, CMS publication or testing policies.

Exact dependency versions are not duplicated here; read `package.json` so agent guidance cannot drift behind the repository.

A catalog hit is not an installation decision. Framework-specific, duplicated, mutable-remote, weak-provenance or second-tracker skills remain reference/rejected even when their catalog score is high. For redesign skills, existing design tokens and product behavior are preserved unless the task explicitly authorizes changing them.

## Excluded patterns

- Unverified community GSAP/CSS skills with weak maintenance/provenance.
- Skills that dynamically fetch remote instructions during execution.
- Workflow packs that impose a second issue/label/state machine over the repository's current tracker and test lifecycle.
- React/Tailwind/shadcn-specific skills that would imply a framework migration in this Vite/vanilla/TypeScript codebase.
- Generic visual-design skills that are likely to restyle an established design system during implementation work.
- Game skills that assume Phaser/R3F/another engine before auditing the current standalone implementation and ownership seams.
- Copywriting bundles that would duplicate or override the canonical `looksawful-editorial` fact/policy/glossary hierarchy.

Updating these skills is a reviewable policy/tooling change, not an automatic `latest` update.