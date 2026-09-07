---
name: looksawful-threejs-assets
description: Use when Three.js work in looksawful.ru involves PBR materials, textures, environment maps, GLTF loading, compressed assets, texture configuration, or render-cost tradeoffs.
---

# Looksawful Three.js assets

Use this after `looksawful-frontend-runtime`. This is a specialist reference for materials, textures and model loading inside the existing site runtime.

## Working rules

- Read the installed Three.js version and existing loaders before copying API examples.
- Prefer the existing asset pipeline and browser delivery formats. Do not create a parallel 3D asset pipeline for one scene.
- Choose the simplest material that satisfies the visual requirement. More physically elaborate is not automatically better on a portfolio page.
- Reuse materials/textures when practical; avoid unnecessary transparency and oversized textures.
- Treat color space, texture mapping, filtering, mipmaps, anisotropy, environment maps and UV assumptions explicitly.
- Preserve source/master assets when optimization produces delivery derivatives.
- For GLTF/GLB, prefer measured reductions such as appropriate compression, texture resizing and reusable geometry/materials over speculative scene rewrites.
- Dispose task-owned geometries, materials, textures and render targets with the scene lifecycle.

## Boundaries

Do not introduce an ECS, game asset manager, runtime LOD framework, custom content server, new compression dependency or export pipeline without an explicit architecture decision.

Do not optimize by visibly degrading a hero asset without evidence that the tradeoff is needed.

## Upstream reference

Adapted from the materials, textures and loaders guidance in `CloudAI-X/threejs-skills`, reviewed from repository commit `b1c623076c661fc9b03dac19292e825a5d106823`. Upstream examples are advisory; repository-local media rules and the installed Three.js release win.
