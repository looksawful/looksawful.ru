# Site analytics contract

## Providers

The production portfolio uses two analytics providers with separate responsibilities:

- **Cloudflare Web Analytics**: privacy-first page/performance analytics and Core Web Vitals.
- **Yandex Metrica**: behavioral analytics, Webvisor and explicit conversion goals.

Do not add Clarity, GA4, PostHog or another behavioral tracker without an explicit product decision. Parallel trackers create duplicate collection, extra client work and incompatible event vocabularies.

## Yandex Metrica

Counter ID: `112065623`.

The browser tag at `https://mc.yandex.ru/metrika/tag.js` loads when either:

- explicit analytics consent is stored as `looksawful:analytics-consent = granted`; or
- no explicit choice is stored and the current browser session is resolved as `RU`.

A stored `denied` value always suppresses Yandex Metrica, including in an RU session. Global Privacy Control and `Do Not Track: 1` suppress site analytics before provider loading regardless of region or stored consent.

Regional resolution is session-scoped, not permanent consent. A normalized two-letter country code is stored in `sessionStorage` under `looksawful:analytics-region`. When no explicit consent and no cached region exist, the runtime resolves the country from `/cdn-cgi/trace` and then `https://api.country.is/`. RU may auto-start Yandex; non-RU or unresolved sessions render the consent control instead.

The counter initializes with:

- `clickmap: true`
- `trackLinks: true`
- `accurateTrackBounce: true`
- `webvisor: true`

The site is a real multi-page application. Normal page views are therefore recorded by the standard counter initialization. Do not add SPA-style `defer: true` plus manual `hit` calls unless the navigation architecture changes to client-side routing.

## Conversion goal IDs

Create these as **JavaScript event** goals in the Yandex Metrica counter. Goal IDs must exactly match the runtime values because they are passed to `reachGoal`.

| Goal ID | Meaning | Parameters |
| --- | --- | --- |
| `project_open` | Visitor follows an internal link to `/work/...` | source page, target path |
| `cv_open` | Visitor opens `/cv/` from a tracked portfolio page | source page |
| `contact_email` | Visitor activates an email link | source page |
| `contact_phone` | Visitor activates a phone link | source page |
| `contact_telegram` | Visitor activates a Telegram link | source page |
| `download` | Visitor activates a link with the `download` attribute | source page, target path when available |

Do not turn generic clicks, slider changes, lightbox navigation or scroll depth into goals. Click maps, link tracking, scroll maps and Webvisor already cover exploratory behavior. Goals are reserved for meaningful intent/conversion signals.

## Consent behavior

Portfolio-runtime pages mount the shared consent component from `src/components/site-analytics-consent.ts`.

The runtime first respects GPC/DNT and any explicit stored choice. Without an explicit choice it reuses the session-scoped region when available; otherwise it resolves the region and stores only that country code for the current browser session. An RU result may mount Yandex without showing the consent control. A non-RU or unresolved result renders the control, where `granted` or `denied` is stored in localStorage as the explicit user choice.

The consent control links to the canonical public `/privacy/` page. That page allows the visitor to clear only the explicit localStorage choice. Clearing it does not turn the session region into consent or erase it: the next tracked page applies the same regional rule again, so RU may auto-start and non-RU/unknown sessions may ask again.

`/cv/` is a `public-static` page and does not load `src/main.js`. Its production artifact is finalized by `src/site/build/public-static-build-plugin.ts` during the Vite production build. That step composes the canonical CV content, removes disabled experience entries and injects the small isolated analytics bootstrap. The bootstrap uses the same explicit-consent localStorage key, the same session-scoped region key, the same RU/non-RU decision rule and the same goal IDs.

The Yandex `<noscript>` tracking pixel is intentionally omitted. A pixel that fires with JavaScript disabled cannot observe the JavaScript consent/region state and would bypass the delayed-loading contract.

## Privacy page

`/privacy/` is a canonical indexable SitePage backed by `public/privacy/index.html`. It is intentionally excluded from the primary navigation and reachable from the consent control.

The page describes the actual technical behavior of the site and links to the provider documentation. Keep it synchronized with any changes to provider configuration, goal IDs, privacy signals, regional resolution or consent behavior.

## Production configuration

GitHub Pages production build supplies:

```text
VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN
VITE_YANDEX_METRIKA_COUNTER_ID=112065623
```

Localhost and `*.localhost` previews do not mount analytics.

## Yandex dashboard checklist

Before merging the analytics PR to a deployable branch:

1. Create the six JavaScript event goals listed above in counter `112065623`.
2. Keep Webvisor, click map and link tracking enabled for the counter.
3. Enable **Do not store full IP addresses of site visitors** when required by the site's privacy requirements.
4. Accept the Yandex Metrica Data Processing Agreement when GDPR applies.
5. Confirm the public `/privacy/` notice still matches the actual counter configuration.

## Verification

Code-level contracts run in Fast CI:

```bash
npm run typecheck
npm run test:fast
npm run build:site
```

For a production-like CV artifact, configure the production analytics environment before the build, then verify the generated artifact:

```bash
npm run build:site
npm run cv:prod:verify
```

Yandex Metrica supports `_ym_debug=2` for browser-side counter and goal debugging. Use it on a deployed URL after Yandex is enabled for the current session, then verify each goal once without generating repeated synthetic conversions.
