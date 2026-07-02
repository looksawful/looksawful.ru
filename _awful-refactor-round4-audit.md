# refactor round 4 media/canvas audit

## checks
- ok: round4 css exists
- ok: round4 css imported
- ok: media layout attrs added
- ok: media ratio attrs added
- ok: compact mobile rail css
- ok: visual registry still present
- ok: before-after direct duplicate remains removed
- ok: runtime registry still present

## metrics
- mediaGroups: 16
- mediaLayoutAttrs: 16
- mediaRatioAttrs: 16
- mobileRailAttrs: 8
- legacyMobileRails: 8
- visualSceneRefs: 6
- round4CssBytes: 3794
- runtimeMountRefs: 15
- visualRegistryBytes: 1107

## next high-risk areas
- legacy media classes are still kept as aliases and can be deleted only after visual QA.
- canvas models are preserved; deeper shared-runtime migration is deferred to avoid breaking visuals.
- playlist filter is still a monolith and should be split in round 5.
- policy book still needs partial/document extraction in round 5.
