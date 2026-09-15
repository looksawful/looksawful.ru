# Recruiter and social traffic tracking plan

## Objective

Make `/cv/` the primary measurable recruiter landing while preserving privacy and the existing analytics architecture. Distinguish traffic from HH, Telegram, Instagram, email and LinkedIn without storing recruiter names, handles, email addresses, company/person pairs or message text.

## Canonical campaign vocabulary

| Channel | utm_source | utm_medium | utm_campaign |
| --- | --- | --- | --- |
| HH recruiter message | `hh` | `message` | `job_search` |
| Telegram recruiter DM | `telegram` | `dm` | `job_search` |
| Instagram profile/bio | `instagram` | `bio` | `portfolio` |
| Instagram DM | `instagram` | `dm` | `job_search` |
| Instagram story | `instagram` | `story` | `portfolio` |
| Email outreach | `email` | `outreach` | `job_search` |
| LinkedIn DM | `linkedin` | `dm` | `job_search` |

`utm_content` is a bounded destination token such as `cv`, `jestei-pool`, `styx` or `home`. `utm_id` is an opaque batch token such as `2026w38a`. No PII is allowed.

## CV funnel

The CV page must support these semantic measurements in addition to normal pageview, Webvisor, click map, link tracking and scroll map:

1. landing on `/cv/`, segmented by UTM/referrer;
2. `cv_engaged` once per page after meaningful engagement (30 seconds OR meaningful scroll), for analysis rather than a primary conversion;
3. `cv_project_open` when a CV portfolio/case link is opened, with bounded target case ID/path;
4. existing `contact_email`, `contact_phone`, `contact_telegram`, and `download` actions;
5. `cv_end` once when the visitor reaches the actual end of the CV.

Do not create generic 25/50/75 scroll conversion goals. Scroll Map and Webvisor already explain depth. `cv_end` is semantic because CV is the recruiter funnel itself.

## Site-wide semantic attribution

Preserve the landing attribution supplied by UTM parameters and let Yandex Metrica segment normal pageviews/goals by source/campaign. Goal parameters may include only bounded technical values: source page, target path/case ID and placement. Never copy arbitrary query strings into goal parameters.

Add explicit placement identifiers to important outbound/contact surfaces where useful, for example `cv_header`, `cv_footer`, `case_footer`, so the same contact goal can be compared by placement without multiplying goal IDs.

## Behavioral layer

Keep Yandex initialization with `webvisor`, `clickmap`, and `trackLinks`. Enable/verify the counter-side Webvisor + scroll map + form analytics setting. Use Webvisor and maps to inspect CV behavior by UTM segment. Do not add GA4, Clarity, PostHog or another behavioral recorder unless the analytics architecture is deliberately changed.

## Privacy

Existing consent/GPC/DNT/internal-traffic suppression remains authoritative. Do not record recruiter identity or private message content. UTM values must remain bounded technical attribution only.

## Verification

- production-like `/cv/` build contains the isolated analytics bootstrap;
- HH/Telegram/Instagram canonical URLs retain UTM parameters on landing;
- CV semantic events fire at most once per intended action;
- external/contact links still navigate normally after tracking;
- `_ym_debug=2` confirms event delivery on a deployed test URL;
- internal traffic suppression can be used for owner QA without contaminating production data;
- private reporting groups `job_search` by source, medium, content, opaque batch and landing page.
