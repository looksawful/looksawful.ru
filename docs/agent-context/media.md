# Agent Context: Media

The authoritative details are `docs/cms-architecture.md`, `docs/cms-content-map.md`, `docs/media-upload-policy.md`, media types, catalog code, and the media tooling tests.

## Ownership and flow

There are two authored entry paths: registered assets and CMS upload records converge in the typed `MediaCatalogItem`/catalog layer. A CMS upload record is normalized into a typed uploaded `MediaAsset` and then added with `origin: "cms"`. `MediaEntry` is a separate usage/placement-specific project or template layer and is created only where required, not for every CMS upload. TypeScript/catalog code owns reusable identity and technical structure; CMS owns approved editorial metadata; deterministic builders own derivatives and generated indexes.

- Preserve source/master media. For video, `VideoMedia.src` is the browser delivery asset and optional `sourceSrc` retains the source master.
- Do not hand-edit `public/media/generated/`, `src/data/media/catalog-records.generated.ts`, `src/data/media/responsive-generated.ts`, or generated JSON manifests such as `responsive-manifest.json` and `video-inventory.json`. Change the source or builder and regenerate.
- Do not create placeholder media. Missing production assets require an authoritative restore or an explicit report.
- Tooling must not silently rewrite editorial fields, captions, credits, or authored copy.
- Current new-upload thresholds are warning above 20 MiB and hard rejection above 50 MiB for images; warning above 50 MiB and hard rejection above 95 MiB for videos. Verify the policy before changing limits.

## Safe media path

Inspect `src/types/media.ts`, catalog records, content consumers, and builders. Then use the smallest applicable commands:

```bash
npm run media:catalog:check
npm run media:sync
npm run test:media:contract
npm run test:media:checks
```

`media:sync` is a correctness path and may update generated files. Review that diff. Unchanged builds should not re-transcode or rewrite manifests.

## Runtime contracts

- `data-caption-view` is the single caption contract; do not reintroduce legacy caption attributes or a second reveal layer.
- Lightbox sources are project-scoped. Resolve the active slide of nested decks before falling back to the first media element.
- Prefer registry-backed rendering over direct project-media markup in `index.html`.
