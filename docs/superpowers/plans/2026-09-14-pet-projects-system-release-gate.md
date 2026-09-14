# Pet Projects release-gate addendum

This addendum supersedes any earlier implementation-plan step that treated Berserk Timer or AWFUL STUDIO as immediately public.

Current release state:

- Awful Cases: live card and existing route.
- Moves Awful: live card and existing route.
- Berserk Timer: authored card remains `coming-soon` with no `href`; production-candidate SitePage stays `enabled:false`, `listed:false`, `indexable:false` until final page/card approval.
- AWFUL STUDIO: authored card remains `coming-soon` with no `href`; production-candidate SitePage stays `enabled:false`, `listed:false`, `indexable:false` until final page/card approval.

The private password-protected Lab may enable Berserk Timer and AWFUL STUDIO routes for development and visual review. This does not authorize public production routing.

Release of either gated project requires one coordinated change that provides final approved card media/content, changes the card to `live` with its canonical `href`, and changes the SitePage to `enabled:true`. Public discovery/indexability remains a separate authored decision.

Permanent tests must reject accidental public links or route enablement while a project remains release-gated.
