---
name: looksawful-threejs-shaders
description: Use when Three.js work in looksawful.ru involves GLSL, ShaderMaterial, uniforms, vertex displacement, fragment effects, custom material hooks, or shader performance/debugging.
---

# Looksawful Three.js shaders

Use this after `looksawful-frontend-runtime`. It is a specialist reference for shader work, not permission to redesign the renderer or scene architecture.

## Working rules

- Read the installed Three.js version and the current scene wrapper before using API examples.
- Prefer the smallest shader surface that solves the visual problem. Reuse existing materials/uniform conventions when present.
- Keep time, pointer, resize and scroll inputs explicit and bounded. Avoid unnecessary layout reads inside RAF loops.
- Dispose task-owned materials, textures, render targets and listeners when the owning scene is destroyed or replaced.
- When GSAP drives uniforms, clean up the associated timeline/tween with the scene lifecycle.
- Preserve reduced-motion and offscreen-work behavior from the project runtime.
- Treat `onBeforeCompile`, shader chunks and renderer internals as version-sensitive. Verify them against the installed release before relying on an upstream snippet.

## Boundaries

Do not introduce a second renderer, game loop, ECS/world manager, shader framework, post-processing stack or dependency without an explicit architecture decision.

Do not replace a simple CSS/canvas effect with WebGL solely because a shader implementation is possible.

## Upstream reference

Adapted from `CloudAI-X/threejs-skills:threejs-shaders`, reviewed from repository commit `b1c623076c661fc9b03dac19292e825a5d106823`. The upstream examples are reference material; repository-local code, installed Three.js APIs and project lifecycle rules are authoritative.
