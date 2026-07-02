# remaining refactor step 4 html partials audit

## checks
- ok: step4 audit points to html partials
- ok: step3 audit preserved
- ok: build html script exists
- ok: build html package script exists
- ok: html source readme exists
- ok: index snapshot exists
- ok: index snapshot matches current live index
- ok: partials manifest exists
- ok: policy book partial exists
- ok: pets section partial exists
- ok: pet preview partials exist
- ok: pet preview partials contain data-pet-preview
- ok: html partial check exists
- ok: html partial check passed
- ok: playlist step3 js adapter preserved
- ok: playlist step3 css adapter preserved
- ok: runtime step2 preserved
- ok: runtime registry still present
- ok: round5 css still imported
- ok: playlist scope still present
- ok: policy scope still present
- ok: pet iframe still absent from main
- ok: media layout attrs still present
- ok: media ratio attrs still present

## metrics
- indexHtmlBytes: 344492
- snapshotBytes: 344492
- policyPartialBytes: 240564
- petsSectionBytes: 5583
- petPreviewPartialFiles: 3
- manifestBytes: 1141
- mediaGroups: 16
- mediaLayoutAttrs: 16
- mediaRatioAttrs: 16
- legacyMobileRails: 8

## next step
- step 5 must remove legacy aliases/archive folders only after visual QA and add final browser regression checks.
