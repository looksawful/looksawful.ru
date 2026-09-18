# Internal analytics traffic

Production analytics supports a persistent per-browser internal-traffic marker.

## Mark this browser as internal

Open:

`https://www.looksawful.ru/?analytics-traffic=internal`

The site stores `looksawful:analytics-internal=1` in local storage, removes the control parameter from the address bar, and skips both Cloudflare Web Analytics and Yandex Metrika for that browser.

The marker is browser/profile specific. Repeat this once on each browser or device used for internal review.

## Restore normal analytics

Open:

`https://www.looksawful.ru/?analytics-traffic=external`

This removes only the internal-traffic marker. It does not change the user's analytics consent choice.

## Scope

Internal traffic does not:

- load configured analytics providers;
- emit project, CV, contact, download, or CV engagement goals;
- change public content or routing.

The control URL is not authentication and grants no administrative capability. It only changes analytics collection for the current browser.
