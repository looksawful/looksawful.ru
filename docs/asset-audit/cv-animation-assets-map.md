# CV animation assets map

## Connected production roots

- src/assets/cv/animations/jestei-interface-masonry
- src/assets/cv/animations/jestei-product-horizontal
- src/assets/cv/animations/jestei-graphic-arc
- src/assets/cv/animations/styx-graphic-diagonal
- src/assets/cv/animations/lyve-graphic-carousel
- src/assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/arc
- src/assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/spiral
- src/assets/cv/chip-content/01-jestei-pool/36-pridumal-i-napisal-animacii-dlya-lendinga/Details/canvas-animations/assets/masonry

## Current root folders

| Folder | Status | Notes |
| --- | --- | --- |
| styx-graphic-diagonal | connected | 73 files, ~79.65 MB, includes heavy mp4 |
| jestei-interface-masonry | connected | 59 files, ~28.49 MB |
| jestei-product-horizontal | connected/staging | 723 files, ~27.86 MB, contains many exact duplicates and copy files |
| jestei-graphic-arc | connected | 34 files, ~0.95 MB |
| lyve-graphic-carousel | connected | 8 files, ~0.65 MB |
| assets | unconnected duplicate source | 107 files, ~4.80 MB |
| canvas-animations | unconnected duplicate source | 107 files, ~4.80 MB |

## Rules for this branch

- Do not delete unique images or videos by meaning.
- Do not delete large mp4 files automatically.
- Do not delete whole folders until imports and manual selection are finished.
- Remove only byte-to-byte duplicates by SHA256.
- Keep connected roots over unconnected roots.
- Keep shorter clean paths over nested Details/canvas-animations paths.
- Keep one copy in each needed visual category if the same image is intentionally reused by different animations.
