---
name: looksawful-vendor-skills
description: Route site work to a small verified set of external Agent Skills without overriding project-local rules.
---

# Curated external skills for looksawful.ru

Project-local skills and AGENTS.md are authoritative. External skills are supplemental and must not rewrite project architecture, copy, selectors, interaction contracts, media ownership rules, or Git policy.

Use external skills only when the task clearly needs the capability below. Do not install whole upstream collections when a named skill is sufficient.

## Approved

- `greensock/gsap-skills`: `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-performance`. Use for GSAP implementation, debugging, lifecycle and performance. Never use `gsap-react`; this repository is not React.
- `MengTo/Skills`: `threejs`. Use for Three.js/WebGL scene, renderer, material, camera and animation-loop work. Existing project runtime constraints still win.
- `cursor/plugins`: `typescript-best-practices`. Use for strict TypeScript review and type-safety. Do not introduce framework conventions or refactors unrelated to the task.

## Reference only / opt-in

- `paulirish/dotfiles`: `modern-css`. Use only as a secondary reference when the local `looksawful-modern-css` skill does not cover a current CSS feature. Local CSS policy wins on conflicts.
- `anthropics/claude-code`: `frontend-design`. Use for visual direction and frontend design critique only. It must not replace the existing design system, page composition, project copy, accessibility rules, or runtime constraints.

## Explicitly excluded

- React/Next.js skills, Vercel React Best Practices and React Doctor: this repository is Vite/vanilla TypeScript, not React or Next.js.
- Tailwind-specific skills: Tailwind is not part of the site stack.
- Broad ECC, Superpowers, wshobson or other whole-pack installs: they duplicate project-local debugging, review, Git, CI and runtime skills and add conflicting process instructions.
- UI/UX mega-packs as authoritative rules: use project-local design constraints instead.

## Installation policy

For a one-off local agent installation, list the upstream pack first and install only the named skills with the current `skills` CLI, preferably as project-scoped copies when the result is meant to be committed. Review every installed directory and its license before commit.

Never run `--all` for an upstream pack in this repository. Never update vendored skills implicitly during unrelated work. Record the upstream source and resolved revision in the change that introduces or refreshes a vendored skill.

## Verification

After using an external skill, run the repository's existing relevant gates. At minimum preserve typecheck/lint/build behavior; for visual/runtime changes also run the project-specific Playwright/runtime or visual checks required by local skills. An external skill is guidance, not evidence that the change works.
