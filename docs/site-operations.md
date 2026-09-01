# Site operations

This is the operating manual for `looksawful.ru` CMS/content/media publication and the surrounding production checks.

Architecture/ownership rules are defined in `docs/cms-architecture.md`. This file describes how to operate the current system.

## 1. Permanent branches

- `dev` — working/integration branch and Pages CMS content source.
- `prod` — production branch and trusted source of CMS publication authorization policy.

GitHub Pages deploys production from `prod` through the existing production workflow.

Normal content flow:

```text
Pages CMS on dev
  -> Save
  -> dev verification / Проверить сайт
  -> Подготовить публикацию
  -> trusted publication workflow from prod
  -> topology + explicit CMS diff authorization
  -> dev -> prod pull request
  -> required checks + diff review
  -> manual merge
  -> GitHub Pages deploy
  -> production verification
```

Pages CMS must not be used as a direct ordinary editor for `prod`.

## 2. Responsibility boundaries

Pages CMS edits only explicitly configured authored content and explicitly configured source-media surfaces.

It does not own:

- routes/slugs/canonical URLs;
- `SitePage` page type, renderer, discovery/indexability or Vite inputs;
- CSS/layout/responsive behavior;
- runtime selectors or component implementation;
- GSAP, Three.js, Canvas/WebGL or PageFlip behavior;
- Jestei filter logic;
- generated responsive/video output;
- sitemap/build/deployment architecture;
- CMS publication policy itself.

`.pages.yml`, `.github/**`, `tools/**`, tests, docs and package/build configuration are engineering changes and cannot be published through the CMS publication action.

## 3. Current Pages CMS content scope

The current editor includes configured sources for:

```text
src/content/navigation.json
src/content/projects.json
src/content/cases/jestei-pool.json
src/content/cases/styx.json
src/content/cases/sensetique.json
src/content/collections/shootings.json
src/content/shootings/*.json
src/content/standalone-projects/berry-social-content-2020.json
src/content/standalone-projects/awful-cases.json
src/content/client-logo-visibility.json
src/content/cv.json
src/content/media-catalog/registered/*.json
src/content/media-catalog/uploads/*.json
```

This list describes editor ownership, not a generic publication glob. The trusted publication classifier has its own explicit allowlist. Adding an arbitrary new file under `src/content/` does not grant publication permission.

Fixed records keep stable IDs readonly and disable create/rename/delete where the domain does not have a safe lifecycle for those actions.

## 4. Current Pages CMS media scope

Project-card cover source:

```text
public/media/projects/index/*
```

The current CMS source accepts scoped WebP covers.

Reusable Media Catalog upload source:

```text
public/media/catalog/*
```

The current Pages CMS media configuration accepts the configured image/video extensions. Do not expose broad `public/media/**` access.

Generated responsive/video assets are not editor-owned. Source masters must be preserved.

## 5. Saving in Pages CMS

`Save` creates a real Git commit on the branch selected in Pages CMS.

For ordinary editing the selected content branch must be:

```text
dev
```

If the editor is showing `prod`, do not make an ordinary content edit there. Switch to `dev`.

A save may trigger the existing deterministic CMS/media synchronization workflow where relevant. That automation may update only its configured generated metadata/content-normalization surfaces and must fail closed on unexpected source changes.

## 6. Проверить сайт

Collection/entity `Проверить сайт` actions continue to run verification for the current editing branch.

They do not publish production.

A failed verification means the change must not be promoted until the failure is understood. Do not weaken validators simply to obtain a green run.

## 7. Automatic dev verification

Pushes to `dev` run the repository's current dev verification workflow. Relevant checks include TypeScript, fast/contracts, deterministic media state, production build and browser verification according to current pipeline policy.

Media synchronization can create an expected bot follow-up commit only within its explicit persistence contract. It is not allowed to rewrite unrelated authored content or engineering code.

## 8. Подготовить публикацию — trust model

The global Pages CMS action is configured as:

```text
workflow: pages-cms-publish.yml
ref: prod
```

This distinction is intentional:

```text
CMS content source = dev
publication policy source = prod
classifier source = prod
```

The unpublished `dev` branch therefore cannot modify the workflow/classifier used to authorize publication of that same `dev` state.

The workflow independently validates:

1. the Pages CMS payload says the edited source is `dev`;
2. the workflow itself is executing from `prod`.

Any mismatch blocks publication preparation.

## 9. Branch topology gate

The trusted workflow fetches current `origin/prod` and `origin/dev` and evaluates topology before file authorization.

### prod == dev

Result:

```text
Nothing to publish.
```

Successful no-op. No PR is created.

### prod is ancestor of dev

The workflow inspects the exact current `origin/prod..origin/dev` changed-file set and passes it to the trusted publication classifier.

### dev behind prod or branches diverged

Publication preparation is blocked before classifier/PR operations.

Expected diagnostic:

```text
dev is not a linear descendant of prod.
Synchronize dev before preparing CMS publication.
```

Synchronize through the normal engineering workflow. Do not rewrite permanent branch history.

## 10. CMS publication classifier

The trusted policy lives in:

```text
tools/cms-publication-scope.mjs
```

It is intentionally separate from:

```text
tools/ci/change-scope.mjs
```

`change-scope.mjs` selects regression coverage. It does not authorize production publication.

Publication classes:

```text
CMS_CONTENT
CMS_MEDIA
CMS_GENERATED
ENGINEERING
UNKNOWN
```

Only a diff composed entirely of the first three classes may proceed.

`ENGINEERING` or `UNKNOWN` anywhere in the current diff blocks the action. Mixed CMS + engineering changes therefore always use the normal engineering release path.

The classifier uses ownership paths, not file extensions.

## 11. Explicit CMS publication surfaces

Current content authorization is limited to the exact fixed files and configured collection record patterns represented in the trusted classifier.

Current CMS media authorization is limited to the configured project-cover and Media Catalog source folders/files.

Current generated authorization is limited to these exact deterministic metadata outputs:

```text
src/data/media/catalog-records.generated.ts
public/media/generated/responsive-manifest.json
public/media/generated/video-inventory.json
src/data/media/responsive-generated.ts
```

Broad rules such as `src/content/**`, `public/media/**` or `public/media/generated/**` are intentionally not publication permissions.

Any new CMS entity must first reach trusted `prod` through the normal engineering path before it can be added to this allowlist.

## 12. Publication diagnostics

When authorization fails, the workflow/classifier must expose actionable information in the GitHub Step Summary, including:

- current `prod`/`dev` topology/SHA context;
- safe CMS files;
- blocked engineering files;
- unknown files;
- instruction to use the normal engineering release workflow.

Do not treat a generic “invalid scope” message as sufficient diagnostics.

## 13. Existing publication PR behavior

If the current diff passes topology and classifier checks, the workflow searches for an existing open `dev -> prod` publication PR.

- existing authorized PR: reuse it;
- no PR: create one;
- current diff not authorized: block before PR lookup/reuse/creation.

An old open PR never bypasses re-evaluation of the current `prod..dev` diff.

The workflow never merges `prod` and never deploys production automatically.

## 14. Engineering release versus CMS publication

Use CMS publication only for explicit CMS-owned content/media plus allowed generated metadata.

Use the normal engineering flow for:

- TypeScript/runtime changes;
- CSS/HTML architecture;
- `.pages.yml` changes;
- workflow changes;
- tools/classifier changes;
- tests/docs/package/build configuration;
- any mixed or unknown diff.

The WAVE 1 gate itself must first be released through this normal engineering path. It becomes a trusted CMS authorization boundary only after the same workflow/classifier/configuration exists in `prod`.

## 15. Production merge

For an authorized CMS publication:

1. verify the intended CMS changes on `dev`;
2. run `Подготовить публикацию`;
3. wait for the trusted scope gate and PR checks;
4. review the diff;
5. merge manually into `prod`;
6. wait for GitHub Pages deployment;
7. verify production.

Do not enable automatic CMS merge/deploy as a shortcut.

## 16. Branch protection requirements

Branch protection/rulesets are repository configuration, not a code substitute.

Recommended `prod` policy:

- prevent force pushes/non-fast-forward history rewriting;
- prevent deletion;
- require PR-based normal updates;
- require relevant verification checks;
- avoid a ceremonial approval count if it would break the solo-maintainer workflow.

Recommended `dev` policy:

- prevent force pushes/history rewrite;
- prevent deletion;
- preserve direct writes required by Pages CMS and the existing media synchronization bot;
- preserve normal development/integration workflow.

Do not claim these controls are configured until GitHub API/UI state confirms them.

## 17. Media Catalog operations

Registered media metadata is editable through:

```text
src/content/media-catalog/registered/*.json
```

Stable media identity/type/source and technical properties are readonly.

New uploads use:

```text
public/media/catalog/*
src/content/media-catalog/uploads/*.json
```

Media tooling owns width/height/MIME/size/duration and generated delivery metadata. Editorial fields such as title, reusable default alt/description, taxonomy/tags/credits/reuse/archive must survive deterministic sync.

Do not use catalog metadata to overwrite placement-specific captions/alt/layout.

## 18. Project-card cover operation

For an intentional cover replacement:

1. prepare the final WebP;
2. use a safe descriptive filename;
3. open the project card on `dev`;
4. select/upload inside the scoped project-cover media source;
5. update intended alt and required source metadata;
6. save;
7. verify dev/site;
8. wait for deterministic responsive metadata sync;
9. publish only through an authorized content-only release.

Do not upload arbitrary source photography, PSD/AI files, video masters or generated derivatives into the cover source.

## 19. Production deployment and monitoring

Production deployment remains owned by:

```text
.github/workflows/pages.yml
```

The repository also maintains independent operational/security checks such as production health, external links, dependency audit, Lighthouse and CodeQL. Investigate failures; do not reduce assertions to hide them.

## 20. Search/analytics operations

Cloudflare Web Analytics should remain integrated through the shared analytics layer and repository configuration. Do not paste duplicate provider snippets into individual pages.

The canonical sitemap remains:

```text
https://www.looksawful.ru/sitemap.xml
```

Google Search Console, Bing Webmaster Tools and Yandex Webmaster should consume the generated canonical sitemap rather than separate hand-maintained variants.

Search/analytics service configuration does not belong in Pages CMS unless a dedicated future contract explicitly requires it.

## 21. Emergency rules

If a CMS save breaks `dev`:

1. do not publish;
2. inspect the failing verification;
3. fix or revert with normal Git history;
4. rerun verification.

If a bad content change reaches `prod`:

1. do not force-push/reset permanent branches;
2. create a normal revert/fix commit or PR;
3. let the normal deployment workflow publish the correction;
4. verify production after deploy.

If publication is blocked by `ENGINEERING`, `UNKNOWN` or branch topology, do not bypass the gate. Use the normal engineering release path or synchronize branches correctly.

## 22. Routine CMS publication checklist

```text
[ ] Pages CMS source branch is dev
[ ] only intended authored/media fields changed
[ ] automatic/manual dev verification is green
[ ] current dev is a linear descendant of prod
[ ] trusted prod publication gate authorizes the complete prod..dev diff
[ ] dev -> prod PR exists
[ ] PR checks are green
[ ] diff reviewed
[ ] manual merge to prod
[ ] Pages deployment green
[ ] production smoke check
```
