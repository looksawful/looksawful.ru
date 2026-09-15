# Useful media audit — 2026-09-15

Scope: media/cover evidence only. Branch `audit/useful-media-20260915` is isolated from `preview/useful-cards-powell-20260915`.

## Verified assets

| Project | Verified source | Native size | 4:5 readiness | Decision |
| --- | --- | ---: | --- | --- |
| Awful Cases | `/pets/awful-cases/assets/recording-2026-08-15-121210.mp4` + poster | 1720×880 | crop required | use video cover; it is already catalogued and has a poster |
| Moves Awful | `/media/projects/jestei/landings/moves-awful/source/01-2044x1112.mp4` + poster | 2044×1112 | crop required | use existing video entry; autoplay policy belongs in renderer |
| Berserk Timer | `/pets/berserk-timer/index.html` contains the canonical ASCII logo | text/DOM | native 4:5 composition required | render/export a dedicated 4:5 cover from the existing ASCII logo; do not use current generic 1440×900 cover |
| Awful Studio | `looksawful/awful-studio:docs/screenshots/awful-studio-cover.jpg` | 300×225 | unsuitable as final 4:5 raster | verified generated white-background reference; use only as composition reference unless a higher-res source is found |
| Awful 3D Mockups | `looksawful/awful-studio:docs/screenshots/awful-mockups-cover.jpg` | 300×225 | unsuitable as final 4:5 raster | verified generated device-mockup white-background reference requested for Awful 3D Mockups |
| Awful Mockups | requested `3.psd` | not found | unknown | do not substitute an invented asset; select another verified human-holding-phone mockup only after locating its actual source |

## Awful Cases evidence

The site already registers the game atlas, fall/victory/ground/pit sprites, a 1720×880 MP4 recording and its poster. The interactive runtime explicitly draws the knight from the atlas, so the requested knight animation is existing project material rather than a new illustration.

Recommended card entry: reuse `awful-cases-assets-recording-2026-08-15-121210-use-01`, or create a cover-specific usage entry pointing to the same video/poster so project-page caption metadata is not overloaded by homepage concerns. The current pet card points to the static settings screenshot and should be changed by the implementation branch.

## Moves Awful evidence

Three existing video usages are registered with poster assets. Candidate 01 is 2044×1112; 02 is 2540×790; 03 is 1914×1208. For a 4:5 card, 03 loses the least horizontal content, but the final focal crop must be visually reviewed. Do not create a duplicate video file just to obtain 4:5; use CSS `object-fit: cover` plus explicit focal-position metadata if the media system supports it.

## Berserk Timer evidence

`public/pets/berserk-timer/index.html` contains the canonical `<pre aria-label="Berserk Timer ASCII logo">…</pre>`. The registered `berserk-timer-cover` is only a 1440×900 image. The cover requirement should therefore be implemented as a dedicated 4:5 asset generated from the canonical ASCII composition, preserving the logo exactly rather than redrawing it.

## Video cover runtime contract

Do not hard-code unconditional HTML autoplay. The card renderer should emit `muted`, `loop`, `playsinline`, `preload="metadata"` and a valid poster. Runtime must call `play()` only when `matchMedia('(prefers-reduced-motion: no-preference)')` matches. On `reduce`, pause the video, reset if needed, and leave the poster/static frame visible. Listen for preference changes so an open page responds without reload. A rejected `play()` promise is non-fatal and falls back to the poster.

## Import / catalog recommendation

Keep physical assets under project-scoped `public/media/projects/<project>/...`; register each physical file once in `src/data/media/assets/*`; create contextual usages in `src/data/media/entries/*`; point Pet Project card data to cover usage IDs, not raw paths. For video covers, poster identity belongs on the media entry. Cover status and card status are content data, not filenames.

For Awful Studio / Awful 3D Mockups, copy from the related repository only after producing or locating production-resolution 4:5 masters. The two verified 300×225 JPEGs are evidence/reference thumbnails, not acceptable final card files.

## Provenance / licensing

`looksawful/awful-cases` declares MIT, copyright Ivan Krushinsky 2026. `looksawful/awful-studio` declares GPL-3.0 for the repository. The generated cover JPEGs are repository-owned outputs, but GPL's treatment of program output depends on whether the output itself constitutes a covered work; preserve source/provenance metadata instead of inferring a new standalone license. Moves Awful has no LICENSE file in the audited repository tree, so no license is asserted here. Site-owned Jestei media should retain its existing provenance/credit metadata.

## Search result for `3.psd`

Exact-name searches were run across the available A:, C:, D:, E: and F: volumes. No `3.psd` was found. Broad PSD searches under the two user-profile roots also returned no PSD files. Therefore the requested human-holding-phone mockup is not verified from the currently accessible filesystem and must not be fabricated or silently replaced.

## Acceptance criteria for implementation branch

- Awful Cases card uses the existing knight/game video plus its poster, not the settings screenshot.
- Moves Awful video cover autoplays only when reduced motion is not requested.
- Every video cover remains meaningful with motion disabled and without successful autoplay.
- Berserk Timer card visibly uses the canonical ASCII logo from its project page.
- Awful Studio and Awful 3D Mockups receive production-resolution 4:5 masters derived from the verified white-background compositions, not upscaled 300×225 thumbnails.
- Awful Mockups is blocked on a verified human-with-phone source; `3.psd` is not claimed to exist.
- Physical media is registered once; homepage cover usage is represented by a Media Entry and editable through the existing media/CMS pipeline.
- No changes from this audit branch are merged into the preview branch automatically.
