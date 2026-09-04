# Site analytics contract

## Providers

The production portfolio uses two analytics providers with separate responsibilities:

- **Cloudflare Web Analytics**: privacy-first page/performance analytics and Core Web Vitals.
- **Yandex Metrica**: behavioral analytics, Webvisor and explicit conversion goals.

Do not add Clarity, GA4, PostHog or another behavioral tracker without an explicit product decision. Parallel trackers create duplicate collection, extra client work and incompatible event vocabularies.

## Yandex Metrica

Counter ID: `112065623`.

The browser tag is loaded from `https://mc.yandex.ru/metrika/tag.js` only after analytics consent is stored as:

```text
looksawful:analytics-consent = granted
```

A stored `denied` value suppresses the consent control and keeps Yandex Metrica unloaded. Global Privacy Control and `Do Not Track: 1` suppress site analytics before provider loading.

The counter initializes with:

- `clickmap: true`
- `trackLinks: true`
- `accurateTrackBounce: true`
- `webvisor: true`

The site is a real multi-page application. Normal page views are therefore recorded by the standard counter initialization. Do not add SPA-style `defer: true` plus manual `hit` calls unless the navigation architecture changes to client-side routing.

## Conversion goal IDs

Create these as **JavaScript event** goals in the Yandex Metrica counter. The goal IDs must exactly match the values below because the runtime passes them to `reachGoal`.

| Goal ID | Meaning | Parameters |
| --- | --- | --- |
| `project_open` | Visitor opens a project from a project card | source page, target path |
| `cv_open` | Visitor opens the CV from a portfolio page | source page |
| `contact_email` | Visitor activates an email link | source page |
| `contact_phone` | Visitor activates a phone link | source page |
| `contact_telegram` | Visitor activates a Telegram link | source page |
| `download` | Visitor activates a link with the `download` attribute | source page, target path when available |

Do not turn generic clicks, slider changes, lightbox navigation or scroll depth into goals. Click maps, link tracking, scroll maps and Webvisor already cover exploratory behavior. Goals are reserved for meaningful intent/conversion signals.

## Consent behavior

Portfolio-runtime pages mount the shared consent component from `src/components/site-analytics-consent.ts`.

`/cv/` is a `public-static` page and does not load `src/main.js`. Its production artifact receives a small isolated analytics bootstrap during `npm run cv:prod:prepare`. The bootstrap uses the same localStorage consent key and the same goal IDs.

The Yandex `<noscript>` tracking pixel is intentionally omitted. A pixel that fires with JavaScript disabled cannot observe the stored JavaScript consent state and would bypass the delayed-loading contract.

## Production configuration

GitHub Pages production build supplies:

```text
VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN
VITE_YANDEX_METRIKA_COUNTER_ID=112065623
```

Localhost and `*.localhost` previews do not mount analytics.

## Yandex dashboard checklist

Before production activation:

1. Create the six JavaScript event goals listed above in counter `112065623`.
2. Keep Webvisor / click and scroll maps enabled for the counter.
3. Enable the Yandex option that does not save full visitor IP addresses when the privacy requirements for the site call for it.
4. Accept the Yandex Metrica data-processing agreement when GDPR applies.
5. Maintain a public privacy/statistics notice that describes the analytics providers and consent behavior.

## Verification

Code-level contracts run in Fast CI:

```bash
npm run typecheck
npm run test:fast
npm run build:site
```

For a production-like CV artifact, run with the production analytics environment configured:

```bash
npm run cv:prod:prepare
npm run cv:prod:verify
```

Yandex Metrica supports `_ym_debug=2` for browser-side counter and goal debugging. Use it on a deployed test/production URL after granting analytics consent, then verify each goal once without generating synthetic repeated conversions.
