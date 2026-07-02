# refactor round 2 audit

## checks
- ok: main pet iframes removed
- ok: pets preview section
- ok: pet preview articles
- ok: legacy pet slide headers removed
- ok: pet preview js exists
- ok: pet preview css imported
- ok: pet preview mount registered
- ok: berserk audio preview
- ok: cases internal preview
- ok: audit internal preview

## metrics
- petIframes: 0
- petPreviewArticles: 3
- petPageSlides: 0
- legacyPetHeaders: 0
- petCssBytes: 7815
- petJsBytes: 2804

## next high-risk areas
- typography map and heading level reduction still need full structural migration.
- media-group migration still needs data-media-layout cleanup.
- playlist filter is still a monolith and should be split after runtime stabilization.
- policy book still needs partial/document extraction after the main section cleanup.
