# Site operations

This document is the operating manual for `looksawful.ru` after the static MPA migration.

It covers Pages CMS, the `dev`/`prod` publication flow, verification, media handling and the external webmaster/analytics services used around the site.

## 1. Operating model

The permanent branches are:

- `dev` — working/integration branch and the branch Pages CMS should edit.
- `prod` — production branch. GitHub Pages deploys from this branch.

The intended flow is:

```text
Pages CMS
  -> dev
  -> Verify dev / Проверить сайт
  -> pull request dev -> prod
  -> required checks
  -> manual merge
  -> GitHub Pages deploy
  -> production healthcheck
```

Do not use Pages CMS as a direct editor for `prod` once the branch selector has been moved to `dev`.

## 2. Responsibility boundaries

Pages CMS is a content editor, not the site architecture editor.

CMS may own explicitly configured authored content and explicitly configured CMS media folders.

CMS must not own:

- routes or route slugs for managed pages;
- canonical URLs;
- `listed` / `indexable` discovery state;
- page type or renderer selection;
- Vite inputs;
- CSS, spacing, typography or responsive behavior;
- JavaScript runtimes;
- GSAP/Three.js/canvas behavior;
- the Jestei filter;
- generated responsive media;
- video build output;
- sitemap generation logic;
- analytics provider code.

The MPA page manifest remains the routing source of truth. The CMS project-card IDs remain fixed presentation IDs and are mapped to routes in code.

## 3. Current CMS scope

The first production CMS scope is deliberately narrow:

```text
src/content/projects.json
```

It contains the four homepage project cards:

- Jestei Pool
- Styx Jewel
- Sensetique
- Shootings

The CMS may edit the card title, description, role, period, optional ARIA label and cover metadata.

The following operations are deliberately disabled:

- create a fifth card;
- delete a card;
- rename a card entity;
- edit the card ID.

This protects the fixed card-to-route contract.

The blog is a separate typed CMS scope. Its entries live in `src/content/blog/*.md`, its media source is scoped to `public/media/blog`, and its public routes remain code-owned. Blog-specific editorial rules are documented in [`docs/blog-authoring.md`](./blog-authoring.md).

## 4. Project-card fields

### ID

Read-only.

Do not try to change `jestei`, `styx`, `sensetique` or `shootings` through CMS or by hand without an explicit architecture migration.

### Название

Visible title of the card.

Changing it changes user-facing copy, so only edit it intentionally.

### Описание

Visible short description on the card.

This is plain text. Do not insert Markdown or HTML.

### Роль

Visible role when present.

### Период

Visible period exactly as it should appear on the site, for example `2024–2026`.

### ARIA label

Optional accessibility text for the card link.

Only use it when the normal visible wording is not sufficient as an accessible label.

### Обложка проекта

The CMS image picker is scoped to:

```text
public/media/projects/index
```

The public URL written to content is:

```text
/media/projects/index/...
```

Only WebP is allowed in this source.

The CMS intentionally does not expose the whole `public/media` tree.

Project-card cover assets are derived into the typed media registry from
`src/content/projects.json`. Selecting or uploading a new cover therefore does
not require a hand-written TypeScript registry edit. The dev verification builds
the responsive variants and persists only the deterministic responsive manifest
and catalog in a follow-up bot commit. If the same push changes anything outside
the project-card JSON and scoped cover folder, this automatic commit fails closed.

### Alt

Describe the meaningful contents of the image for accessibility.

Do not use filename-style text and do not mechanically repeat the project title if it does not describe the image.

### Ширина / Высота

These values are the real pixel dimensions of the selected source WebP.

After changing a cover, verify both dimensions before saving. The typed project-card loader rejects non-positive values, but it cannot know whether a positive number matches the actual file.

Automatic dimension extraction can be added later as a separate media workflow.

## 5. Replacing a project-card cover

Preferred sequence:

1. Prepare the final image as WebP.
2. Use a descriptive safe filename, for example `styx-jewel-cover-2026.webp`.
3. Open the project card in Pages CMS on `dev`.
4. In `Обложка проекта`, select an existing WebP or upload the new WebP.
5. Update `Alt`.
6. Enter the real width in pixels.
7. Enter the real height in pixels.
8. Save.
9. Run `Проверить сайт`.
10. Do not publish until verification is green.

Do not upload arbitrary source photography, video masters, PSD/AI files or generated responsive variants into the project-cover media source.

## 6. Saving in Pages CMS

`Save` means a real Git commit to the branch currently selected in Pages CMS.

Before saving, always check the branch shown in the repository selector.

Normal state:

```text
dev
```

Unsafe state for ordinary editing:

```text
prod
```

If Pages CMS shows `prod`, stop and switch to `dev` before editing.

## 7. Проверить сайт

The CMS action `Проверить сайт` dispatches:

```text
.github/workflows/verify-pr.yml
```

The action uses the branch currently open in Pages CMS.

The workflow runs the existing verification contract, including data validation, TypeScript checks, build/postbuild checks and browser smoke tests.

The confirmation dialog is intentionally explicit: this action does not publish the website.

A failed run means the CMS change must not be promoted to `prod` until the failure is understood and resolved.

## 8. Automatic dev verification

Every push to `dev` also triggers:

```text
.github/workflows/verify-dev.yml
```

This runs type checking, deterministic media synchronization, core tests, the
production build and the shared browser smoke suite.

For a CMS project-cover change, the workflow may add one generated-only commit:

```text
chore(media): sync CMS project cover metadata
```

That commit can contain only the responsive manifest and generated TypeScript
catalog. It is not permitted to rewrite authored content or source media.

Pages CMS saves therefore receive automatic CI even if the manual `Проверить сайт` button is not used.

The manual button is still useful because it gives the editor an explicit verification action in the CMS UI.

## 9. Подготовить публикацию

The repository-level Pages CMS action `Подготовить публикацию` dispatches:

```text
.github/workflows/pages-cms-publish.yml
```

Safety rules:

- it only accepts Pages CMS actions started from `dev`;
- it never merges `prod`;
- it never deploys the site;
- if an open `dev -> prod` PR already exists, it reuses it;
- if `dev` has no unpublished commits, it exits without creating a PR;
- otherwise it creates a `dev -> prod` pull request.

After the action completes, open the created pull request and wait for required checks.

## 10. Production merge

The production flow must remain human-approved:

1. Verify the CMS changes on `dev`.
2. Run `Подготовить публикацию` or manually create `dev -> prod` PR.
3. Wait for all required checks.
4. Review the diff.
5. Merge into `prod`.
6. Wait for GitHub Pages deployment.
7. Open production and perform a short smoke check.

Do not enable automatic merge from Pages CMS for ordinary content publishing.

## 11. Recommended prod branch protection

Configure a GitHub ruleset or branch protection rule for `prod`.

Recommended requirements:

- require a pull request before merging;
- require status checks to pass;
- require the PR branch to be up to date when practical;
- block force pushes;
- block branch deletion;
- do not allow ordinary direct pushes to bypass the rule.

Keep `dev` writable by Pages CMS. Do not apply a rule to `dev` that prevents the Pages CMS GitHub App from committing content.

The exact required check names should be selected from successful PR runs in the GitHub UI. At minimum the full Verify changes job and the relevant CodeQL/site-architecture checks should gate production.

## 12. Production deployment

GitHub Pages deployment is owned by:

```text
.github/workflows/pages.yml
```

Ordinary CMS users do not need to trigger it manually.

A merge to `prod` starts the normal production deployment and post-deploy verification.

Do not copy files directly into a Pages deployment artifact and do not bypass the workflow for CMS publication.

## 13. Production monitoring

The repository already contains automated operational checks for:

- production health;
- external links;
- dependency audit;
- Lighthouse;
- CodeQL;
- dev verification;
- PR verification;
- production deployment verification.

Treat failures as signals to investigate. Do not weaken assertions simply to make a run green.

## 14. Cloudflare Web Analytics

Cloudflare Web Analytics is the lightweight RUM layer.

The site analytics code already consumes the repository variable:

```text
CLOUDFLARE_WEB_ANALYTICS_TOKEN
```

Do not paste a second Cloudflare beacon directly into HTML.

After production deployment, verify:

- the Cloudflare beacon script is present once;
- the script loads successfully;
- RUM requests appear;
- the Cloudflare dashboard starts receiving visits/page views/Core Web Vitals.

## 15. Yandex Metrica

The created Metrica counter ID is managed outside the current CMS scope.

Do not paste Metrica snippets into individual HTML pages.

The intended future integration is a single provider in the shared analytics layer with privacy/consent handling, so every managed MPA route uses the same analytics contract.

Webvisor requires more privacy care than basic RUM. Keep sensitive form content masked and do not enable broad recording of user-entered data by default.

## 16. Search consoles and sitemap

The canonical sitemap URL is:

```text
https://www.looksawful.ru/sitemap.xml
```

Google Search Console, Bing Webmaster Tools and Yandex Webmaster should all know this same sitemap URL.

Do not create manual alternate sitemaps for each service.

Managed public/indexable MPA pages are generated into the sitemap by the site architecture. Direct-link/noindex pages must stay out of it.

After adding or promoting a real public page, verify the generated sitemap rather than editing sitemap XML manually.

## 17. Yandex Webmaster

The verification meta tag is part of the site head and should remain there after verification.

Use Webmaster for:

- site diagnostics;
- sitemap processing;
- crawl/indexing information;
- search presentation diagnostics;
- important notifications.

Do not modify the GitHub Pages CNAME to solve Webmaster verification problems.

## 18. Google Search Console

Use Search Console for:

- page indexing state;
- search queries and impressions;
- Core Web Vitals reports;
- URL inspection;
- sitemap state.

Do not request manual indexing after every deploy. Use it for genuinely new or materially changed pages when needed.

## 19. Bing Webmaster Tools

Use Bing Webmaster Tools for:

- URL inspection;
- sitemap state;
- crawl/indexing diagnostics;
- search performance;
- periodic site scans.

IndexNow can be evaluated later. Do not add it during unrelated CMS work.

## 20. Expanding the CMS later

The current CMS is intentionally a pilot/editor for homepage cards.

Future expansion should happen only after the relevant content model has a stable typed contract.

The blog follows this rule: CMS authoring was added only after its typed frontmatter schema, build-time validation, content-derived routes and dedicated renderer/runtime boundary were defined. Do not use the blog collection as a generic escape hatch for unrelated site architecture.

Recommended order:

1. homepage cards — current stage;
2. one Case as a content-model pilot;
3. remaining Cases;
4. Shootings collection records;
5. standalone Project content;
6. carefully selected global site data;
7. SEO fields only where editorial control is genuinely useful.

Do not move the canonical domain catalog wholesale into CMS.

Do not make routes editable just because a page's copy becomes editable.

## 21. Media expansion later

Future CMS media sources should remain scoped by purpose, for example:

```text
project-covers
shooting-covers
content-images
```

Do not expose one giant unrestricted `public/media` root to editors.

Generated responsive images and video outputs remain owned by the existing media builders.

## 22. Emergency rules

If a CMS save breaks `dev`:

1. do not publish;
2. inspect the failing Verify dev / Проверить сайт run;
3. fix or revert the CMS commit on `dev`;
4. rerun verification.

If a bad content change reaches `prod`:

1. do not force-push or rewrite history;
2. create a normal revert/fix commit or PR;
3. let the normal deployment pipeline publish the correction;
4. verify production after deploy.

If production styling/JavaScript appears broken after a deploy, first distinguish browser cache from a real artifact failure. Check the live hashed CSS/JS requests and their HTTP status before changing application code.

## 23. Routine checklist

For a normal CMS content change:

```text
[ ] Pages CMS branch is dev
[ ] only intended fields changed
[ ] cover path/file is correct
[ ] alt is correct
[ ] width/height match the cover
[ ] Save
[ ] Verify dev completed
[ ] Проверить сайт completed when used
[ ] dev -> prod PR created
[ ] PR checks green
[ ] diff reviewed
[ ] merge to prod
[ ] Pages deployment green
[ ] production smoke check
```

For blog authoring, use the dedicated checklist and validation rules in [`docs/blog-authoring.md`](./blog-authoring.md).

For a new external-service configuration:

```text
[ ] configure the service/dashboard
[ ] record the exact ID/token/contract needed by code
[ ] use repository variables/secrets where appropriate
[ ] do not paste duplicate snippets into page HTML
[ ] integrate through the shared site infrastructure
[ ] verify on production
[ ] document the operating procedure here
```
