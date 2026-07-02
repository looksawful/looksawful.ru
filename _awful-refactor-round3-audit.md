# refactor round 3 typography audit

## checks
- ok: round3 css exists
- ok: round3 css imported
- ok: project type token
- ok: chapter type token
- ok: section type token
- ok: block type token
- ok: filter scoped out from typography override
- ok: pet preview scoped out from typography override
- ok: fit headings narrowed

## metrics
- titleDisplayRefs: 2
- titleXlRefs: 11
- titleLgRefs: 23
- caseChapterHeadingRefs: 27
- sectionHeadRefs: 14
- blockHeaderRefs: 14
- textBlockRefs: 4
- typographyCssBytes: 4524

## next high-risk areas
- media-group migration still needs data-media-layout cleanup.
- canvas/visual lifecycle still needs shared-runtime verification.
- playlist filter is still a monolith and should be split after runtime stabilization.
- policy book still needs partial/document extraction after the main section cleanup.
