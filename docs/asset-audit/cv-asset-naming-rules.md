# CV asset naming rules

## Current state

Some imported media files use export-style names:

- masonry-image (1).webp
- masonry-image (16).webp
- 2504 copy.webp
- Record Pool — копия.png

These names are not automatically treated as trash.

## Rules

- Numbered names can be valid animation sequences.
- Files with different SHA256 hashes are not duplicates.
- Files imported through import.meta.glob must not be renamed without checking visual order.
- Exact byte-to-byte duplicates can be removed after hash comparison.
- Rename passes must be separate from delete passes.
- Prefer future normalized names only for newly sorted files.

## Future target naming

- masonry-001.webp
- masonry-002.webp
- arc-001.webp
- spiral-001.webp
- styx-campaign-001.webp
- lyve-carousel-001.webp
