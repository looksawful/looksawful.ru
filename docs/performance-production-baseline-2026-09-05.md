# Production performance baseline — 2026-09-05

Tracking issue: #247
Follow-up: #336

## Method

One Lighthouse lab run per representative production route and viewport from GitHub Actions run `33973024646` on 2026-09-05.

Routes:
- `/`
- `/work/jestei-pool/`
- `/cv/`
- `/shootings/`

Each route was measured with Lighthouse mobile defaults and the desktop preset against `https://www.looksawful.ru/`. These numbers are a diagnostic baseline, not field Core Web Vitals and not a statistically stable benchmark. INP is not treated as measured here because a navigation-only Lighthouse run does not provide representative real-user interaction latency.

## Results

| Surface | Viewport | Performance | LCP | CLS | TBT | Transfer | Requests | JS boot | Main thread |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| CV | desktop | 99 | 1.01 s | 0 | 0 ms | 0.76 MiB | 10 | 0 ms | 81 ms |
| CV | mobile | 83 | 4.68 s | 0 | 0 ms | 0.76 MiB | 10 | 38 ms | 263 ms |
| Home | desktop | 72 | 1.22 s | 0.023 | 569 ms | 87.95 MiB | 211 | 1.45 s | 7.59 s |
| Home | mobile | 33 | 37.83 s | 0 | 1.49 s | 112.85 MiB | 198 | 2.60 s | 30.39 s |
| Jestei Pool | desktop | 100 | 0.62 s | 0 | 0 ms | 6.63 MiB | 43 | 60 ms | 480 ms |
| Jestei Pool | mobile | 84 | 3.95 s | 0.006 | 0 ms | 7.38 MiB | 44 | 200 ms | 1.73 s |
| Shootings | desktop | 100 | 0.46 s | 0 | 0 ms | 0.70 MiB | 24 | 22 ms | 206 ms |
| Shootings | mobile | 100 | 1.42 s | 0 | 13 ms | 0.92 MiB | 34 | 152 ms | 920 ms |

## Findings

### P0 performance defect: Homepage eager media loading

The Homepage is the only representative route with catastrophic initial transfer/runtime cost. Lighthouse observed roughly 88–113 MiB transferred on initial load and about 200 requests. The largest network entries are offscreen project videos, including individual MP4 transfers/ranges around 8–23 MiB.

The mobile Homepage LCP element is the hero portrait. It is already discoverable in the initial document, is not lazy-loaded and has `fetchpriority="high"`. Therefore the 37.8 s mobile lab LCP is not explained by missing LCP discovery. The page is saturating network/runtime resources with media that is far below the fold.

Lighthouse also estimates roughly 9–10 MiB of offscreen image opportunity on Home. Video deferral is the much larger first-order problem and is tracked in #336.

### Hero portrait

`/media/hero/hero-portrait.webp` is about 755 KiB. Lighthouse estimates roughly 600–735 KiB potential savings depending on viewport because the source is both relatively heavy and oversized for its rendered dimensions. The same portrait is the mobile CV LCP surface, which helps explain the CV mobile LCP of 4.68 s despite otherwise negligible JS/TBT cost.

This is worth optimizing after the Homepage eager-media defect because it is a bounded asset-delivery improvement, not evidence of a shared runtime bottleneck.

### Representative project routes

Jestei Pool and Shootings do not show a shared-shell performance regression. Their desktop results are effectively clean; mobile Jestei is heavier but has zero TBT and remains within the existing 4 s Lighthouse LCP warning threshold at 3.95 s in this run.

### Third parties

Third-party execution is not the dominant problem. Cloudflare analytics and related third-party main-thread cost are tiny compared with Homepage first-party media/runtime work. Google Fonts is render-blocking on some routes, but its estimated cost is secondary to the Home media problem.

### Cache signal

Lighthouse reports many large media responses with a short cache lifetime around ten minutes and estimates substantial repeat-visit cache opportunity. This is secondary to eliminating unnecessary first-load transfers; cache policy should not be used to excuse loading tens of megabytes before the media is needed.

## Existing Lighthouse budget review

The current `lighthouserc.cjs` warning contract remains useful as a broad local/scheduled guardrail:
- performance score >= 0.75;
- LCP <= 4 s;
- total byte weight <= 15 MiB;
- third-party request count <= 10.

The audit does not justify loosening those budgets. Home currently violates the byte budget by roughly 6–8x and its mobile LCP by roughly 9x. The appropriate action is a focused Homepage fix, not a larger threshold.

## Decisions

- Keep full Lighthouse/performance audits out of Fast CI. The eight-report matrix itself took about 3 minutes 21 seconds after checkout/install and is intentionally an occasional diagnostic layer.
- Do not optimize all routes indiscriminately. Jestei/Shootings are not evidence-backed priorities from this run.
- Track Homepage eager offscreen media as focused issue #336.
- Keep mobile CV/hero portrait delivery as a smaller follow-up optimization opportunity unless field data shows it to be more urgent.
- Re-run the same Home mobile/desktop measurement after #336 to verify transfer, LCP, TBT and main-thread improvement.
