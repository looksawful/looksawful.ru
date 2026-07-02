# html partial pipeline check

mode: check

## checks
- ok: live index exists
- ok: snapshot exists
- ok: snapshot matches live index
- ok: manifest exists
- ok: policy partial exists
- ok: pets section partial exists
- ok: pet preview partial files exist
- ok: pet preview partials contain data-pet-preview
- ok: live page still has no pet iframes
- ok: live page media layout attrs preserved
- ok: live page media ratio attrs preserved

## metrics
- indexHtmlBytes: 344492
- snapshotBytes: 344492
- policyPartialBytes: 240564
- petsSectionBytes: 5583
- petPartialFiles: 3
- manifestPetPreviewRefs: 3
- mediaLayoutAttrs: 16
- mediaRatioAttrs: 16

## safety
- live index.html is not generated or overwritten by default.
- --write is intentionally reserved for a later parity-approved pass.
