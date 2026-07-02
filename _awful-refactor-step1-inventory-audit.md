# remaining refactor step 1 inventory audit

## checks
- ok: inventory script exists
- ok: inventory root md exists
- ok: inventory docs md exists
- ok: inventory package script exists
- ok: audit points to step1 inventory
- ok: inventory has runtime map
- ok: inventory has component modules
- ok: inventory has visual modules
- ok: inventory has css modules
- ok: inventory has html map
- ok: inventory has deferred cleanup map
- ok: final baseline audit still exists
- ok: round5 css still imported
- ok: round5 playlist scope still present
- ok: round5 policy scope still present
- ok: runtime registry still present
- ok: visual registry still present
- ok: pet iframe still absent from main
- ok: media layout attrs still present
- ok: media ratio attrs still present

## metrics
- inventoryBytes: 17550
- inventoryDocBytes: 17550
- mediaGroups: 16
- mediaLayoutAttrs: 16
- mediaRatioAttrs: 16
- legacyMobileRails: 8
- runtimeMountRefs: 15
- playlistFilterBytes: 200041
- playlistFilterCssBytes: 61613

## next step
- step 2 must complete runtime helpers, registry boundaries and canvas lifecycle cleanup using this inventory as baseline.
