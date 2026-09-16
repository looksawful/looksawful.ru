# Analytics implementation checklist

## Simple preparation tasks

- [x] Re-read current branch heads before starting: `dev@28a294e188cc1a5fbb856cc542e25b3b7052e349`, `prod@9cd91fd5cf2e15bd03f489972cb8da92a961f8b0`, `awful-control/main@09d8fce1f0a5280a7fe9286c3b957db40f2efc17`.
- [x] Align the documented runtime goal vocabulary with the current dev implementation: seven existing goals plus `cv_engaged`, `cv_project_open`, `cv_end`.
- [x] Align documented controlled attribution with the current allowlisted HH, Telegram, Instagram, LinkedIn, Behance, VK, FashionBank and email source/medium/campaign combinations.
- [x] Document internal owner/agent traffic suppression.
- [x] Add a fail-closed implementation plan that keeps public instrumentation, release promotion and private reporting in separate review lanes.

## Complex implementation tasks

- [ ] Correct CV project clicks so aggregate `project_open` is preserved alongside `cv_project_open`.
- [ ] Make the 30-second `cv_engaged` path count visible engagement time rather than hidden-tab wall time.
- [ ] Remove the unavailable `/cdn-cgi/trace` probe from the current dynamic and public-static analytics runtimes through a fresh RED→GREEN change.
- [ ] Obtain fresh exact-head CI/preview/browser evidence for the public analytics candidate and merge only that narrow candidate to `dev`.
- [ ] Repair and integrate the fail-closed release-preflight work before relying on it for production promotion.
- [ ] Create/verify `cv_engaged`, `cv_project_open` and `cv_end` JavaScript-event goals through the private Yandex control plane.
- [ ] Backport only the approved analytics delta from current `dev` onto a fresh branch from current `prod`; do not merge all of `dev` into `prod`.
- [ ] Verify the deployed production SHA and live `/cv/`/case behavior independently.
- [ ] Expand `awful-control` reporting to separate `job_search` and `portfolio`, consume the semantic CV events, and include the existing device/OS/browser report in the weekly brief.
- [ ] Record a post-release measurement epoch, then perform 7-day health and 30-day acquisition/funnel reviews without mixing pre-release traffic into the new cohort.
