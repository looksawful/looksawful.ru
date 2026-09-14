# Pet Projects release-gate addendum

This addendum supersedes any earlier implementation-plan or design-spec release-state text that treated Berserk Timer or AWFUL STUDIO as immediately public or jointly gated.

Current release state:

- Awful Cases: live card and existing route.
- Moves Awful: live card and existing route.
- Berserk Timer: released by explicit user approval on 2026-09-14. The card is `live` with canonical `href`; the production SitePage is `enabled:true`, while `listed:false` and `indexable:false` remain intentionally conservative until a separate discovery/SEO decision.
- AWFUL STUDIO: authored card remains `coming-soon` with no `href`; production-candidate SitePage stays `enabled:false`, `listed:false`, `indexable:false` until final page/card approval.

The private password-protected Lab may continue to expose AWFUL STUDIO for development and visual review. This does not authorize its public production routing.

Release of a gated project requires one coordinated change that changes the card to `live` with its canonical `href` and changes the SitePage to `enabled:true`. Public discovery/indexability remains a separate authored decision.

Permanent tests must reject accidental public links or route enablement while a project remains release-gated, and must preserve the approved Berserk Timer live route while AWFUL STUDIO remains gated.
