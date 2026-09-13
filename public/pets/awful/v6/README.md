# Awful v6 asset package

This directory is the immutable web copy of the owner-approved Awful v6 pet.
The website runtime uses `spritesheet.webp` by default and loads files under
`extras/` only when the corresponding animation is requested.

Do not replace files in place for v7. Add a new versioned directory, update the
typed manifest and keep the previous version available for rollback.

`pet.json` and `extras/extra-animations.json` retain the upstream package IDs
and source-relative paths. Website identity and executable paths are owned by
`src/features/portfolio-pet/awful-manifest.ts`.
