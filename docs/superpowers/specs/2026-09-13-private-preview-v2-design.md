# Private Preview V2 Design

## Purpose

Build a single private preview system around the existing branch model without changing the meaning of `dev` or `prod`.

- `dev` remains the default, stable working branch.
- `prod` remains the protected production branch.
- feature/fix/content branches remain short-lived sources of work.
- `lab` is an experimental integration surface only. It is never a release source.
- the existing Private Lab/Admin UI is a separate internal tool and must not be conflated with the `lab` branch.

## Release model

Promotion remains:

```text
feature/* -> dev -> prod
```

The `lab` branch may aggregate selected open feature branches for compatibility testing, but no `lab -> dev` or `lab -> prod` promotion is allowed.

## Preview types

One Preview Engine serves four sources:

- `feature`: exact SHA from a pull request or manual candidate;
- `lab`: exact SHA of the generated experimental integration branch;
- `cms`: exact SHA of a temporary CMS snapshot branch;
- `release`: exact SHA of a `dev -> prod` release candidate.

Each preview carries immutable provenance: repository, exact 40-character SHA, kind, key and optional PR number.

## Security boundary

Candidate code is untrusted. Candidate build jobs may run candidate Node code but must have no deployment or authentication secrets.

Deployment is trusted. A privileged workflow defined on trusted `dev` consumes the candidate artifact strictly as data, validates it, attaches the trusted preview runtime and performs the Cloudflare Pages deployment.

The deployment layer must reject candidate-controlled runtime entry points including `_worker.js`, `_routes.json` and `functions/`.

Preview authentication is implemented with trusted Pages Functions, not Cloudflare Access/Zero Trust. All preview paths, including HTML, JS, CSS, images, video and metadata, pass through authentication.

Runtime secrets:

- `PREVIEW_PASSWORD_HASH`
- `PREVIEW_SESSION_SECRET`
- `PREVIEW_CI_TOKEN_HASH`

The human password is never committed to Git, embedded in the site artifact, placed in URLs or exposed to candidate JavaScript.

Authenticated browser sessions use a `__Host-preview_session` cookie with `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` and a finite lifetime.

Missing or invalid authentication configuration fails closed.

## Trusted response policy

Private preview responses carry at minimum:

```text
X-Robots-Tag: noindex, nofollow, noarchive
Cache-Control: private, no-store
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

Preview security policy must not modify the production site's headers.

## Oversized media

The current preview packager may redirect oversized tracked assets to exact-SHA `raw.githubusercontent.com` URLs. Private Preview V2 must not expose that browser redirect because it bypasses the protected preview origin.

Instead, oversized tracked media is recorded in a manifest and fetched server-side by trusted preview runtime after authentication. GET, HEAD and Range requests must remain usable for browser media playback. Generated oversized video may continue to use preview-only H.264/AAC surrogates.

## QA

Every preview runs baseline QA. Feature-specific profiles supplement baseline checks rather than replacing them.

Initial profiles:

- baseline;
- Venus/Contact Hub;
- Gallery;
- AWFUL STUDIO / Pet Projects after its current route is verified from repository source.

Visual QA records desktop and mobile screenshots. Green baseline alone must not be treated as proof that a feature-specific state works.

## CMS Preview

Content/Media Desk write policy remains loopback-only and branch-restricted. Preview support must not weaken those guards.

CMS Preview creates a temporary snapshot branch from `origin/dev` by default using only files already allowed by the Content Desk write policy. It triggers the same Preview Engine. Cloudflare credentials never enter the CMS browser or local preview UI.

An advanced experimental mode may base a CMS snapshot on `lab`, but stable `dev` remains the default.

## Lab composition

Before any automation, existing unique work on `lab` must be audited and preserved in normal feature branches.

After that migration, `lab` becomes a generated integration branch:

1. start from current `dev`;
2. collect same-repository open PRs explicitly labelled for Lab;
3. merge them in deterministic order into a temporary integration tree;
4. if any merge conflicts, abort and leave the previous `lab` ref untouched;
5. if all merge cleanly, update `lab` and trigger a private Lab preview.

No manual release work originates from generated `lab`.

## Lifecycle and cleanup

Preview cleanup combines event-driven expiry and scheduled garbage collection.

- closed/merged feature PR: expire candidate;
- CMS delete/TTL: expire preview and delete temporary branch;
- Lab: retain current and previous deployment;
- release: retain current candidate only;
- orphaned deployment: purge;
- default CMS TTL: 48 hours.

Cloudflare Pages cannot remove the newest deployment for a branch alias directly. Expiry therefore replaces the active candidate with a tiny trusted `PREVIEW EXPIRED` artifact and then deletes older candidate deployments.

## Migration

Private Preview V2 is introduced beside the existing `pr-preview.yml` pipeline.

1. add contract tests;
2. add manual-only V2 build/deploy path;
3. prove auth and artifact isolation;
4. prove parity against current active feature branches without rebasing or retargeting them;
5. add feature QA, CMS trigger, Lab composition and cleanup;
6. make V2 automatic while legacy preview remains a fallback;
7. complete one normal `dev -> prod` release cycle;
8. retire legacy automatic preview only after that cycle succeeds.

At no stage does this project require changing the semantics of `dev`, `prod` or the production deployment workflow.
