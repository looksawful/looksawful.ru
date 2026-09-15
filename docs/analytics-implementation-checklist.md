# Analytics implementation checklist

- [ ] Extend `tools/outreach-link.mjs` allowlist with Instagram: `dm/job_search`, `bio/portfolio`, `story/portfolio`.
- [ ] Add tests rejecting unknown Instagram medium/campaign pairs and PII-like/unbounded attribution values.
- [ ] Add CV-only semantic tracking to the static analytics bootstrap: `cv_engaged`, `cv_project_open`, `cv_end`.
- [ ] Ensure CV events fire once and never block navigation.
- [ ] Keep existing `contact_*`, `download`, Webvisor, click map and link tracking behavior intact.
- [ ] Add bounded placement metadata to important CV contact/project links where useful.
- [ ] Update Yandex goal configuration for semantic CV events; do not add generic percentage-scroll goals.
- [ ] Verify counter-side Webvisor + scroll map is enabled and privacy configuration matches `/privacy/`.
- [ ] Extend private `awful-control` outreach reporting to preserve source, medium, content, opaque batch and landing dimensions for both `job_search` and separately `portfolio` social discovery.
- [ ] Add 7-day and 30-day recruiter funnel sections focused on `/cv/`.
- [ ] Restore current Yandex Reporting API access before declaring reporting complete.
- [ ] Production-like build + Fast CI + deployed `_ym_debug=2` verification before release.
