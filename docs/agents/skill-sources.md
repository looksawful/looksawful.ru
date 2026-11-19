# Agent skill sources and provenance

Status: review record for repository-local agent guidance. External sources are references, not runtime instructions. The local adapted skills remain subject to `AGENTS.md`, canonical project docs, code and tests.

## Reviewed upstream sources

| Source | Pinned review commit | What was adopted |
| --- | --- | --- |
| Matt Pocock `mattpocock/skills` | `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` | existing debugging/TDD/codebase-design/review/domain/architecture/prototype/handoff patterns; refreshed thin Research, Grill, Wayfinder, Spec, Tickets and Implement orchestration adapters without importing a second tracker, testing lifecycle or policy system |
| Addy Osmani `addyosmani/web-quality-skills` | `afa8da942115f2961fdbfa80807ea0b232ff6c00` | measurement-first performance/Core Web Vitals, accessibility, SEO and best-practice audit principles |
| Meng To `MengTo/Skills` | `321c769739b823de5eb94eb3a52aa1974fe783a2` | animation profiling, offscreen work gating, lifecycle/leak cleanup patterns for CSS/GSAP/Canvas/WebGL/Three.js |
| PyModel `PyModel/css-pro-tips` | `7332ca009ecc469f1bc26bd4083620b022896610` | modern CSS decision order, intrinsic/container-driven layout, progressive enhancement and explicit protection against incidental framework/toolchain migration |
| CloudAI-X `CloudAI-X/threejs-skills` | `b1c623076c661fc9b03dac19292e825a5d106823` | focused Three.js shader, material, texture and loader reference patterns, adapted behind the repository's existing runtime/lifecycle rules |
| LobeHub `lobehub/lobehub` TypeScript skill | `906b10e03029648655e0257bda4f785a9e0973f0` | strict boundary typing, no-new-`any`, inference, precise contracts, safe JS→TS migration patterns; LobeHub-specific React/Ant/database conventions excluded |
| Microsoft `microsoft/playwright` trace skill | `4302dbb90f65e80da3f4f08a2e028c9e642b64b9` | trace-first Playwright diagnosis across actions, errors, console, requests and snapshots; adapted to repository affected-test and temporary-test policy |
| Seth Hobson `wshobson/agents` Git advanced workflows | `a30778f8c4e6b0a87567941b7cca4f534bf642b6` | worktrees, bisect, drift/recovery concepts and clean-branch discipline; destructive history recommendations constrained by repository policy |
| GitHub `github/gh-aw` workflow debugging | `102cf77b34572420cedf251bb92198f6df709e77` | workflow/job/step failure classification, log-first triage and independent root-cause analysis; gh-aw orchestration itself not adopted |

## English localization review (2026-11-19)

A single focused repo skill, [`looksawful-english-localization`](../../.agents/skills/looksawful-english-localization/SKILL.md), adapts these upstream sources. **No upstream pack was installed wholesale** and no translator/LLM API, grammar service or npm dependency was added. Vendor instructions are evidence, not authority over this repo.

| Source | Pinned catalog commit | Adopted constraint |
| --- | --- | --- |
| [kostja94/marketing-skills — translation](https://github.com/kostja94/marketing-skills/blob/45143a7d6d8f92fc9048aa4f3074a26272bd0d2a/skills/content/translation/SKILL.md) | `45143a7d6d8f92fc9048aa4f3074a26272bd0d2a` | freeze source, preserve facts, maintain terms and review coverage |
| [coreyhaines31/marketingskills — copy-editing](https://github.com/coreyhaines31/marketingskills/blob/0cd9b3a0ef4c411a1d690419ce843f2a1da32cce/skills/copy-editing/SKILL.md) | `0cd9b3a0ef4c411a1d690419ce843f2a1da32cce` | clarity and voice-preserving edits, not invented benefits |
| [miqdadbadjuber/anti-slop — antislop-copywriting](https://github.com/miqdadbadjuber/anti-slop/blob/3005235d030b4793146ad9afe8d01045efd90e1d/skills/antislop-copywriting/SKILL.md) | `3005235d030b4793146ad9afe8d01045efd90e1d` | avoid empty hype, fabricated claims and generic AI prose |
| [jwynia/agent-skills — fact-check](https://github.com/jwynia/agent-skills/blob/e02ec7e226a6e4f8419fd3b88a1d8e472d421b32/skills/general/research/verification/fact-check/SKILL.md) | `e02ec7e226a6e4f8419fd3b88a1d8e472d421b32` | separate claim-by-claim verification against sources |
| [agentic-qe — localization-testing](https://github.com/proffesor-for-testing/agentic-qe/blob/b177b2315521376b83f2eed40e4994fd7581d067/.claude/skills/localization-testing/SKILL.md) | `b177b2315521376b83f2eed40e4994fd7581d067` | check translated UI and a11y in the actual rendered site |

Skill packaging follows [OpenAI Codex documentation](https://developers.openai.com/codex/build-skills) and the [Agent Skills specification](https://agentskills.io/specification). Avoid duplicate skill packs and respect Matt Pocock's upstream [selective installation guidance](https://github.com/mattpocock/skills). Skill-file provenance is not evidence that LLM translation, website build or editorial acceptance has been performed.

## Local adaptation rule

We intentionally do not copy a large generic bundle blindly. Project-local skills encode the useful workflow while routing back to the actual looksawful.ru contracts. This prevents generic advice from overriding current CSS ownership, motion, Media Catalog, CMS publication or testing policies.

Exact dependency versions are not duplicated here; read `package.json` so agent guidance cannot drift behind the repository.

## Excluded patterns

- Unverified community GSAP/CSS skills with weak maintenance/provenance.
- Skills that dynamically fetch remote instructions during execution.
- Workflow packs that impose a second issue/label/state machine over the repository's current tracker and test lifecycle.
- Generic visual-design skills that are likely to restyle an established design system during implementation work.

Updating these skills is a reviewable policy/tooling change, not an automatic `latest` update.