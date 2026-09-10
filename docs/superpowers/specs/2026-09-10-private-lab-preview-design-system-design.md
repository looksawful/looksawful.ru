# Private Lab + PR Preview Design System Design

Date: 2026-09-10
Status: approved for implementation
Branch: `lab`

## Goal

Make every Cloudflare preview non-public by default, keep the persistent Lab as the only design-prototyping workspace, and expose a complete design-system/documentation browser inside Lab without introducing a second source of truth, CMS, component package, authentication implementation, or deployment project.

## Non-negotiable boundaries

- Production `prod` and `www.looksawful.ru` remain unchanged by Lab infrastructure.
- `lab` remains a persistent experimental branch and must not become a release path.
- The long-lived `lab -> dev` PR is never merged wholesale.
- Existing `src/components/**`, `src/styles/**`, `src/templates/**`, and site/domain sources remain canonical.
- No component is duplicated only to make documentation render.
- Atomic Design names are documentation metadata only. Production folders are not reorganized into atoms/molecules/organisms.
- No custom username/password database, auth cookie, password hash, or application login screen is added to the repository.
- No production analytics or search indexing is enabled in Lab or PR previews.
- Anonymous preview access must be denied by Cloudflare Access. Automated CI receives a separate service credential, never a human credential.

## Architecture

### One preview project

Keep the existing Direct Upload Pages project `looksawful-ru-preview`.

- `lab.<project>.pages.dev` remains the persistent Lab branch alias.
- `pr-<number>.<project>.pages.dev` remains the human-friendly PR alias.
- immutable hash URLs remain exact-revision evidence.
- `lab.looksawful.ru` is an optional custom hostname for the persistent Lab once DNS permissions are available.

Do not create another Pages project for Storybook or documentation.

### Authentication

Use Cloudflare Access in front of Pages previews.

Human authentication:

- Cloudflare is the identity provider.
- Allow rule: members of the owning Cloudflare account.
- Default behavior: deny everyone else.
- Human session duration: 12 hours.
- MFA remains governed by the user's Cloudflare account security.

Machine authentication:

- create one Cloudflare Access service token named `looksawful-preview-ci`;
- add a `Service Auth` policy for that token to the preview Access application;
- store only its Client ID and Client Secret as GitHub Actions secrets `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`;
- remote curl/Playwright verification sends those headers;
- logs and artifacts must never print the secret.

Cloudflare's Pages preview access policy is the primary security boundary for branch aliases and immutable preview deployments. `lab.looksawful.ru` gets its own self-hosted Access application with the same human and service-token policy when the custom domain is active.

If Access has not been enabled yet, CI must report that preview privacy is incomplete rather than claiming a private environment.

### Lab workbench

Keep `/lab/` as the lightweight site-specific shell for:

- real-page route switching;
- desktop/tablet/mobile/custom viewport;
- fit scaling;
- light/dark/checker stage;
- outline/grid/DOM inspection;
- local CSS scratchpad;
- exact deployed revision metadata.

Add two links, not a new router or SPA layer:

- `system` -> `/lab/system/`;
- `inventory` -> `/lab/system/inventory.html` (or the generated inventory page if Storybook owns navigation to it).

### Design-system browser

Use Storybook 10.6.0 with `@storybook/html-vite` 10.6.0. It matches the existing vanilla HTML/TypeScript/Vite stack and does not require introducing React into product code.

Use only two addons initially:

- `@storybook/addon-a11y` 10.6.0;
- `storybook-design-token` 5.0.0.

The Storybook static build is emitted into `dist/lab/system/` only in the Lab pipeline. Standard PR previews remain product previews and do not build Storybook, keeping PR feedback fast and avoiding an unnecessary parallel application in every candidate.

Storybook is therefore a viewer over the same code, not a package consumed by the site.

### Documentation taxonomy

Sidebar taxonomy is metadata only:

- `00 Foundations`: colors, typography, spacing, radius, layout/grid, breakpoints, motion;
- `01 Atoms`: true single-purpose primitives that already exist;
- `02 Molecules`: small compositions such as code blocks, audio controls, captions, before/after controls;
- `03 Organisms`: larger media decks, reels, galleries, navigation and substantial content sections;
- `04 Templates`: reusable page/case/collection layouts;
- `05 Pages`: canonical assembled routes where useful for system context;
- `06 Motion`: motion/reduced-motion examples and behavior contracts;
- `90 Experimental`: Lab-only or not-yet-approved UI.

Status tags may include `stable`, `experimental`, `deprecated`, `project:<name>`, and `a11y-reviewed`.

Do not classify a file as an atom/molecule/organism merely from its filename. Initial stories should cover clear canonical components first; the inventory exposes everything not yet documented.

### Foundations and tokens

CSS remains the source of truth.

Do not create a parallel `tokens.json` unless the production architecture later adopts one. Storybook imports canonical site styles and displays variables/tokens derived from those sources. The design-token addon may use documentation annotations in canonical CSS only when such annotations do not change runtime behavior.

### Automatic inventory

Create a deterministic Lab-only inventory generator that scans canonical source directories and emits generated documentation into the Lab build output. It must distinguish at least:

- component/runtime files under `src/components/**`;
- canonical styles under `src/styles/**`;
- templates under `src/templates/**`;
- Storybook story files;
- documented versus undocumented source owners.

Inventory output is generated, not hand-maintained. It must not mutate production source files.

The first iteration reports missing stories as information, not as a merge-blocking failure. After coverage is intentionally established, a separate future decision may promote selected missing-story checks into CI contracts.

### PR preview behavior under Access

Once Access is enabled, existing anonymous `curl` and Playwright checks will receive the Access login response. Update the PR Preview workflow to add service-token headers to remote verification and browser context requests.

Security verification must cover both sides:

1. anonymous request does not receive preview content;
2. CI service-token request receives the exact preview revision and can run the existing smoke suite.

The preview comment remains safe to publish publicly because it contains URLs only, never service credentials.

### Lab behavior under Access

The Lab workflow performs the same anonymous-denial check and then uses the service token for exact revision, branch alias, and custom-domain verification. Until `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are configured, the workflow may deploy but must mark privacy verification incomplete and must not claim that anonymous access is blocked.

## Error handling

- Missing Access API permissions: report the exact required Cloudflare permission and stop Access bootstrap; do not weaken privacy rules.
- Missing CI service-token secrets: remote authenticated verification must fail with a clear setup message once Access is expected to be enabled.
- Storybook dependency/build failure: fail the Lab build, leave the previous successful Lab deployment serving, and do not affect PR or production deploys.
- Undocumented component: inventory records it; the initial rollout does not fail the build.
- Custom-domain DNS failure: keep the Pages branch alias as the working Lab endpoint and report the DNS permission gap.

## Testing

Permanent contracts should remain narrow:

- extend the Lab workspace contract to assert Storybook output wiring, no production analytics/discovery, and inventory generation wiring;
- add a preview security workflow contract that asserts Access service headers are consumed only from GitHub secrets and anonymous-denial verification exists;
- do not add broad snapshot tests or duplicate component behavior tests merely because Storybook exists;
- rely on Storybook build success plus existing site tests for canonical component behavior.

Security checks must never be satisfied by bypassing Cloudflare Access or by embedding static credentials in the generated site.

## User-owned Cloudflare actions

The repository can prepare and verify the security contract, but the user must perform account-level actions when the current API token lacks the required Cloudflare Zero Trust permissions:

1. enable Zero Trust for the account if not already enabled;
2. enable the Pages preview Access policy for `looksawful-ru-preview`;
3. set Cloudflare as the human identity provider and restrict it to owning-account members;
4. create the `looksawful-preview-ci` service token;
5. attach a Service Auth policy for that token;
6. add the two token values to GitHub Actions secrets;
7. grant DNS edit permission or create the `lab.looksawful.ru` proxied CNAME manually if the current token cannot do so;
8. add a self-hosted Access application for `lab.looksawful.ru` when that custom hostname becomes active.

No password, token, or secret value is written into repository documentation.
