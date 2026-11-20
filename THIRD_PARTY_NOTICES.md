# Third-party notices

This project contains, depends on, or references third-party software and font resources. Those materials are **not** licensed under the repository's proprietary `LICENSE`; their own upstream terms control.

This file is a human-readable inventory of direct dependencies and known externally served resources as reviewed on 7 September 2026. Installed package license files and upstream notices remain authoritative. A production build also emits a generated bundled-dependency license report through Vite.

## Runtime dependencies

| Component | Version/range in `package.json` | Terms | Upstream |
| --- | --- | --- | --- |
| `@egjs/infinitegrid` | `^4.13.0` | MIT | https://github.com/naver/egjs-infinitegrid |
| `@fontsource-variable/inter` | `^5.3.0` | Fontsource distribution; Inter font is SIL Open Font License 1.1 | https://fontsource.org/fonts/inter |
| `@fontsource-variable/rubik` | `5.3.0` | Fontsource distribution; Rubik font is SIL Open Font License 1.1 | https://fontsource.org/fonts/rubik |
| `embla-carousel` | `8.6.0` | MIT | https://github.com/davidjerleke/embla-carousel |
| `gsap` | `^3.15.0` | GreenSock Standard "no charge" License; **not MIT** | https://gsap.com/standard-license |
| `photoswipe` | `5.4.4` | MIT | https://github.com/dimsemenov/PhotoSwipe |
| `photoswipe-dynamic-caption-plugin` | `1.2.7` | MIT | https://github.com/dimsemenov/photoswipe-dynamic-caption-plugin |
| `split.js` | `^1.6.5` | MIT | https://github.com/nathancahill/split |
| `three` | `^0.185.1` | MIT | https://github.com/mrdoob/three.js |
| `tom-select` | `^2.6.2` | Apache-2.0 | https://github.com/orchidjs/tom-select |

## Development and build dependencies

| Component | Version/range in `package.json` | Terms | Upstream |
| --- | --- | --- | --- |
| `@lhci/cli` | `^0.15.1` | Apache-2.0 | https://github.com/GoogleChrome/lighthouse-ci |
| `playwright` | `^1.61.1` | Apache-2.0 | https://github.com/microsoft/playwright |
| `sharp` | `^0.35.4` | Apache-2.0 | https://github.com/lovell/sharp |
| `typescript` | `^7.0.2` | Apache-2.0 | https://github.com/microsoft/TypeScript |
| `vite` | `^8.2.2` | MIT; the distributed Vite package also carries notices for its bundled dependencies | https://github.com/vitejs/vite |

## Other package-script tooling

Repository scripts also invoke tooling through `npx` rather than declaring every tool as a persistent direct dependency:

- CSpell — MIT: https://github.com/streetsidesoftware/cspell
- Oxc / Oxlint / Oxfmt — MIT, with Oxc's own third-party notices applying to incorporated components: https://github.com/oxc-project/oxc
- Stylelint — MIT: https://github.com/stylelint/stylelint
- CSpell dictionaries and other transient packages remain subject to the license files/metadata shipped by those packages; this repository does not relicense their word lists or data.

## Fonts and externally served CSS/font files

The tracked source currently references the following font resources in addition to Fontsource packages:

| Resource | How it appears | Terms / note | Upstream |
| --- | --- | --- | --- |
| Inter | Fontsource package and Google Fonts references | SIL Open Font License 1.1 | https://github.com/rsms/inter |
| Rubik | Fontsource package and Google Fonts references | SIL Open Font License 1.1 | https://github.com/googlefonts/rubik |
| Golos Text | Google Fonts reference | SIL Open Font License 1.1 | https://github.com/googlefonts/golos-text |
| Press Start 2P | Google Fonts reference | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/pressstart2p |
| Pixelated MS Sans Serif assets | WOFF/WOFF2 files referenced from `unpkg.com/98.css@0.1.20` | **Needs provenance verification.** 98.css is MIT-licensed, but the package-level MIT declaration does not by itself establish that every historical Microsoft-derived font binary, typeface right or trademark is licensed under MIT. Treat the font binaries as separate third-party material until verified. | https://github.com/jdan/98.css |

System font fallbacks named in CSS are not redistributed merely because their family names appear in a stylesheet.

## License families represented

### MIT

MIT-licensed dependencies permit broad use, modification and redistribution subject to retention of their copyright and permission notice. Their permissive license does **not** make this repository as a whole MIT-licensed.

### Apache License 2.0

Apache-2.0 dependencies retain their own notice, copyright, patent and redistribution terms. Their license does **not** extend to owner-controlled portfolio material.

### SIL Open Font License 1.1

OFL-1.1 font software retains its font-specific permissions, conditions and reserved-font-name rules where applicable. If font files are redistributed, the applicable OFL text and upstream notices must travel with them as required by the font distribution.

Official OFL text: https://openfontlicense.org/open-font-license-official-text/

### GreenSock / GSAP

GSAP is distributed under GreenSock's applicable upstream Standard "no charge" License. The current GSAP documentation and package terms control. Treat the upstream license as controlling; do not replace it with MIT or with this repository's custom license.

Official license: https://gsap.com/standard-license

## Transitive dependencies

This manual file intentionally does not pretend to be a frozen list of every transitive npm package. Transitive components change with the lockfile and may carry their own MIT, Apache-2.0, BSD, ISC, CC0 or other terms.

The build configuration generates a license report for dependencies actually bundled by Vite. Installed packages and `package-lock.json` provide the version graph; upstream package LICENSE/NOTICE files remain controlling.

## External media, brands and portfolio content

Third-party notices for npm packages/fonts are not a rights clearance for photographs, video, audio, client work, collaborator work, logos, trademarks, likenesses, references or externally linked media. Those are handled by `CONTENT_RIGHTS.md`, `docs/RIGHTS_AND_PROVENANCE.md` and the asset-level rights audit tracked in issue #546.

## Maintenance

Update this file when a direct dependency, font, CDN-served component or other distributable third-party component is added, removed or changes license. Do not copy a dependency's license identifier from memory when the installed/upstream package can be checked directly.
