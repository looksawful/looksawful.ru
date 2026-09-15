# Recruiter analytics dashboard specification

## Primary questions

1. Which channel actually sends recruiter/client traffic: HH, Telegram, Instagram, email, LinkedIn, referral or search?
2. Which landing works: CV, Home or a case?
3. After landing on CV, do visitors engage, reach the end, open cases, download, or activate a contact?
4. Which source produces qualified visits and contact intent rather than raw clicks?

## Required views

### Acquisition
Dimensions: `utm_campaign`, `utm_source`, `utm_medium`, `utm_content`, opaque `utm_id`, landing page.
Metrics: visits, users, bounce, duration, depth.

### CV funnel
For `/cv/`: landings -> engaged -> project open -> CV end/download -> contact intent.
Segment every stage by source/medium/campaign and device. Keep counts as well as rates because traffic is currently low.

### Cases after CV
Measure which cases are opened from CV, whether `case_end` is reached, and whether a contact follows in the same visit.

### Behavior
For `/cv/` and top cases: Webvisor replays, Click Map, Link Map and Scroll Map filtered by the relevant UTM segment and date window. Behavioral evidence explains aggregate anomalies; individual replays are not treated as proof by themselves.

## Channel interpretation

- HH + `job_search`: recruiter acquisition.
- Telegram + `job_search`: recruiter/direct outreach.
- Instagram + `job_search`: employment conversation/DM.
- Instagram + `portfolio`: organic/social portfolio discovery.
- Search/referral/direct remain separate and must not be silently reclassified as outreach.

## Reporting cadence

Private weekly report: 7-day pulse + 30-day context. Show raw visits/users before conversion rates. Flag insufficient sample sizes instead of presenting tiny denominators as stable percentages.
