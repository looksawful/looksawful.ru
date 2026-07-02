# remaining refactor step 2 runtime/canvas audit

## checks
- ok: step2 audit points to runtime
- ok: step1 audit preserved
- ok: schedule helper exists
- ok: visibility helper exists
- ok: visual lifecycle helper exists
- ok: schedule exports runWhenIdle
- ok: schedule exports runAfterFirstPaint
- ok: visibility exports runWhenNear
- ok: visibility uses IntersectionObserver
- ok: visual lifecycle exports create registry
- ok: visual lifecycle exports mountOnce
- ok: mount engine uses split helpers
- ok: mount engine has no PowerShell newline literals
- ok: runtime registry still present
- ok: components index remains bridge
- ok: visual registry still present
- ok: before-after direct duplicate remains removed
- ok: inventory baseline preserved
- ok: runtime lifecycle doc exists
- ok: round5 css still imported
- ok: playlist scope still present
- ok: policy scope still present
- ok: pet iframe still absent from main
- ok: media layout attrs still present
- ok: media ratio attrs still present

## metrics
- runtimeMountRefs: 15
- componentsIndexBytes: 4820
- scheduleBytes: 1210
- visibilityBytes: 1501
- visualLifecycleBytes: 1565
- visualRegistryBytes: 1107
- mediaGroups: 16
- mediaLayoutAttrs: 16
- mediaRatioAttrs: 16
- legacyMobileRails: 8
- playlistFilterBytes: 200041

## canvas scene lifecycle scan
- src/visuals/canvas/before-after/index.js: 8763 bytes, 0 lifecycle/state refs
- src/visuals/canvas/landing-motion/arc/index.js: 16442 bytes, 17 lifecycle/state refs
- src/visuals/canvas/landing-motion/masonry/index.js: 29617 bytes, 18 lifecycle/state refs
- src/visuals/canvas/showcase-diagonal/index.js: 17893 bytes, 0 lifecycle/state refs
- src/visuals/canvas/showcase-horizontal/index.js: 17294 bytes, 0 lifecycle/state refs

## next step
- step 3 must split playlist-filter-embed.js and playlist-filter-embed.css into source modules without visual changes.
