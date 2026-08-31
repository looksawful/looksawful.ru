# CMS for CV and Four Main Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a verified Pages CMS workflow for CV, Jestei Pool, Styx, Sensetique, Shootings and the four fixed homepage project cards, then publish the integrated result through `dev` to `prod`.

**Architecture:** Keep Pages CMS as a Git-backed editor over strict JSON sources under `src/content/`. Case and Shootings data continue through typed adapters and renderers; CV data continues through its strict adapter and deterministic HTML transformer. CMS writes only editorial values to `dev`; routes, links, media identity, layout, runtime behavior and production publication remain protected by code and CI.

**Tech Stack:** Pages CMS `.pages.yml`, JSON, TypeScript 7, Node.js 24 test runner, Vite 8, Playwright, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-31-cms-cv-four-projects-design.md`

## Global Constraints

- Do not change authored/user-facing copy while completing the CMS structure; migrated JSON defaults must reproduce current output byte-for-byte after HTML escaping rules are applied.
- Keep exactly four homepage card IDs: `jestei`, `styx`, `sensetique`, `shootings`.
- Keep exactly fifteen CV experience IDs and their existing per-card case, fact and link counts.
- Keep routes, hrefs, canonical URLs, indexability, renderer names, DOM classes, media IDs, layouts and runtime options outside CMS.
- Keep CMS fixed-record create, rename and delete operations disabled.
- Keep project-card media scoped to WebP files under `public/media/projects/index`.
- Keep project-cover width and height explicit; automatic dimension extraction is outside this implementation.
- Preserve `data-caption-view`, lightbox, media registry and generated-media contracts.
- Do not merge either incomplete open CMS pull request independently; integrate their reviewed changes into one tested completion branch.
- Run `npm run verify` before production integration when dependencies and browser tooling are available, and require independent GitHub Actions verification on the final remote commit.
- Publish only through a reviewed `dev -> prod` pull request and the existing GitHub Pages workflow.

---

### Task 1: Integrate the Green Main Case Editability Series

**Files:**
- Modify: `.pages.yml`
- Modify: `src/content/cases/jestei-pool.json`
- Modify: `src/content/cases/styx.json`
- Modify: `src/data/content/jestei-editorial.ts`
- Modify: `src/data/content/jestei-pool.ts`
- Modify: `src/data/content/styx-editorial.ts`
- Modify: `src/data/content/styx.ts`
- Modify: `test/jestei-cms-copy.test.mjs`
- Modify: `test/sensetique-cms-copy.test.mjs`
- Modify: `test/styx-cms-copy.test.mjs`

**Interfaces:**
- Consumes: current `origin/dev` Case editorial JSON, typed Case content exports and Pages CMS Case schemas.
- Produces: `JesteiEditorialContent.role`, `JesteiEditorialContent.period`, `StyxEditorialContent.role`, `StyxEditorialContent.period`; project intros consume those values instead of duplicate catalog values.

- [ ] **Step 1: Verify the current Case baseline before integration**

Run:

```bash
node --test test/jestei-cms-copy.test.mjs test/styx-cms-copy.test.mjs test/sensetique-cms-copy.test.mjs
```

Expected: the `dev` baseline passes, while the current tests still freeze some output instead of proving arbitrary valid edits.

- [ ] **Step 2: Apply the reviewed PR #51 commit sequence without a local merge**

Run:

```bash
git cherry-pick e46696d 920fb95 88d50bd 3648c9f ccc19f8 87e3a3e c0f3b96 a27e1c5 bda8273 61628a4
```

These commits preserve their original test-first history and the already-green remote review evidence.

- [ ] **Step 3: Verify all three Case contracts after integration**

Run:

```bash
node --test test/jestei-cms-copy.test.mjs test/styx-cms-copy.test.mjs test/sensetique-cms-copy.test.mjs test/jestei-cms-paragraph-contract.test.mjs
```

Expected: all tests pass; legitimate role, period, lead, section, overlay, credit and note edits are accepted while route/media/presentation fields remain rejected.

- [ ] **Step 4: Inspect the integrated Case diff**

Run:

```bash
git diff origin/dev -- .pages.yml src/content/cases src/data/content/jestei-editorial.ts src/data/content/jestei-pool.ts src/data/content/styx-editorial.ts src/data/content/styx.ts test/jestei-cms-copy.test.mjs test/styx-cms-copy.test.mjs test/sensetique-cms-copy.test.mjs
git diff --check
```

Expected: only the ten reviewed Case files change; Jestei and Styx copy values are unchanged and only ownership moves.

---

### Task 2: Restore the Existing CV Experience Work as a Reproducible RED State

**Files:**
- Modify: `src/content/cv.json`
- Modify: `src/data/cv.ts`
- Modify: `test/cv-cms.test.mjs`
- Create: `test/cv-experience-copy-cms.test.mjs`
- Modify: `tools/lib/cv-content.mjs`

**Interfaces:**
- Consumes: fixed CV experience IDs, existing `public/cv/index.html` cards and the existing `transformCvContent(html, content, options)` entry point.
- Produces: structured `CvExperienceData` records and an intentionally failing first implementation that demonstrates the exact remaining gaps.

- [ ] **Step 1: Apply the PR #52 commit sequence in its original test-first order**

Run:

```bash
git cherry-pick 5ac4e40 15ae2fa 6d5ac6d 1909572 0bd865e
```

- [ ] **Step 2: Run the focused CV tests and confirm RED for the expected reasons**

Run:

```bash
node --test test/cv-cms.test.mjs test/cv-experience-copy-cms.test.mjs test/cv-production.test.mjs
```

Expected failures:

```text
Expected exactly one .experience-role in CV HTML; got 0
Pages CMS exposes CV experience copy without href, class or route controls
production CV physically removes exactly the experience hidden by structured CMS content
```

The role failure must trace to `h4.experience-role` in the transformer while the real source uses `h3.experience-role`. The CMS test must show that `.pages.yml` exposes only `id` and `visible` for experience records.

- [ ] **Step 3: Confirm the structured source itself is complete before changing implementation**

Run:

```bash
node --test --test-name-pattern="CMS source owns copy|parser accepts legitimate" test/cv-experience-copy-cms.test.mjs
```

Expected: the structured-source and parser tests pass, proving the remaining failures are transformer/configuration gaps rather than missing migrated copy.

---

### Task 3: Strengthen the CV HTML Preservation Regression Test

**Files:**
- Modify: `test/cv-experience-copy-cms.test.mjs`

**Interfaces:**
- Consumes: `transformCvContent`, `parseCvContent`, `public/cv/index.html` and stable experience card classes.
- Produces: regression evidence that editable copy changes while tag names, hrefs, attributes and `experience-value` wrappers survive.

- [ ] **Step 1: Add a stable helper for extracting one experience article**

Add beside the existing test helpers:

```javascript
function articleFor(html, id) {
  const pattern = new RegExp(
    `<article\\b(?=[^>]*\\bclass=["'][^"']*\\bexperience-card--${id}\\b[^"']*["'])[^>]*>[\\s\\S]*?<\\/article>`,
    "i",
  );
  const matches = [...html.matchAll(new RegExp(pattern.source, "gi"))];
  assert.equal(matches.length, 1, `expected exactly one CV experience article for ${id}`);
  return matches[0][0];
}
```

- [ ] **Step 2: Expand the transformation test to exercise cases, facts and link labels**

Replace the edited-record setup with ID-based edits so the test does not depend on array position:

```javascript
const edited = clone(source);
const jestei = edited.experience.find(({ id }) => id === "jestei");
const styx = edited.experience.find(({ id }) => id === "styx");
assert.ok(jestei);
assert.ok(styx);

jestei.company = "JESTEI & POOL";
jestei.context = "Музыкальный <сервис>";
jestei.period = "2024–2027";
jestei.role = "Арт-директор & дизайн-лид";
jestei.description = "Описание <без HTML> & безопасно";
jestei.cases[0] = "Кейс & исследование";
jestei.links[0] = "Сайт & продукт";
styx.facts[0].text = "Факт <сохранён> & обновлён";
```

After transforming, assert the protected structure explicitly:

```javascript
const transformed = transformCvContent(originalHtml, parseCvContent(edited)).html;
const transformedJestei = articleFor(transformed, "jestei");
const transformedStyx = articleFor(transformed, "styx");

assert.deepEqual(hrefs(transformed), originalHrefs, "CMS copy edits must not own experience hrefs");
assert.match(transformedJestei, /<h3 class="experience-role">Арт-директор &amp; дизайн-лид<\/h3>/);
assert.match(transformedJestei, /<div class="experience-cases">/);
assert.match(transformedJestei, /<a class="experience-value" href="\/#jestei-brand"[^>]*>Кейс &amp; исследование<\/a>/);
assert.match(transformedJestei, /<div class="experience-links">/);
assert.match(transformedStyx, /<div class="experience-facts">/);
assert.match(transformedStyx, /<span class="experience-value">Факт &lt;сохранён&gt; &amp; обновлён<\/span>/);
assert.doesNotMatch(transformed, /Описание <без HTML>/);
```

- [ ] **Step 3: Run the strengthened test and verify it remains RED**

Run:

```bash
node --test --test-name-pattern="transform changes editorial copy" test/cv-experience-copy-cms.test.mjs
```

Expected: FAIL at `.experience-role` before reaching the later container assertions. This proves the test exercises the broken production seam.

- [ ] **Step 4: Commit the regression test**

Run:

```bash
git add test/cv-experience-copy-cms.test.mjs
git commit -m "test(cms): lock CV experience HTML preservation"
```

---

### Task 4: Expose Complete CV Experience Fields in Pages CMS

**Files:**
- Modify: `.pages.yml`
- Test: `test/cv-experience-copy-cms.test.mjs`
- Test: `test/pages-cms-yaml-syntax.test.mjs`

**Interfaces:**
- Consumes: `CvExperienceData` fields accepted by `parseCvContent`.
- Produces: Pages CMS fields named `company`, `context`, `period`, `role`, `description`, `cases`, `facts`, `label`, `text` and `links`, while omitting href/route/layout controls.

- [ ] **Step 1: Use the existing failing CMS-schema assertion as RED**

Run:

```bash
node --test --test-name-pattern="Pages CMS exposes CV experience copy" test/cv-experience-copy-cms.test.mjs
```

Expected: FAIL because `name: company` and the subsequent editorial fields are absent.

- [ ] **Step 2: Add fields after the existing `visible` field in `.pages.yml`**

Add this exact schema under `content -> cv -> experience -> fields`:

```yaml
          - name: company
            label: Компания / проект
            type: string
            required: true
          - name: context
            label: Контекст
            type: string
            required: true
            description: Тип компании, продукта или проекта, показываемый рядом с периодом.
          - name: period
            label: Период
            type: string
            required: true
          - name: role
            label: Роль
            type: string
            required: true
          - name: description
            label: Описание
            type: text
            description: Поле может быть пустым только у карточек без существующего слота описания. Разметка карточки остаётся в коде.
          - name: cases
            label: Кейсы
            type: string
            required: true
            list: true
            description: Редактируй только существующие строки. Их количество и ссылки защищены кодом.
          - name: facts
            label: Факты
            type: object
            required: true
            list:
              collapsible:
                collapsed: true
                summary: "{label}"
            description: Редактируй текст существующих фактов, не добавляя и не удаляя строки.
            fields:
              - name: label
                label: Подпись
                type: string
                description: Может быть пустой у объединённого факта без отдельного заголовка.
              - name: text
                label: Текст
                type: text
                required: true
          - name: links
            label: Подписи ссылок
            type: string
            required: true
            list: true
            description: Меняются только видимые подписи. Адреса и атрибуты ссылок остаются в коде.
```

- [ ] **Step 3: Verify the CMS schema and YAML scalar rules**

Run:

```bash
node --test --test-name-pattern="Pages CMS exposes CV experience copy" test/cv-experience-copy-cms.test.mjs
node --test test/pages-cms-yaml-syntax.test.mjs
```

Expected: both commands pass; no field named `href`, `route`, `className`, `target`, `rel`, `layout`, `indexable` or `listed` exists in the CV block.

- [ ] **Step 4: Commit the CMS configuration slice**

Run:

```bash
git add .pages.yml test/cv-experience-copy-cms.test.mjs
git commit -m "feat(cms): expose CV experience editorial fields"
```

---

### Task 5: Repair the CV Transformer Against the Real HTML Contract

**Files:**
- Modify: `tools/lib/cv-content.mjs`
- Test: `test/cv-experience-copy-cms.test.mjs`
- Test: `test/cv-cms.test.mjs`
- Test: `test/cv-production.test.mjs`

**Interfaces:**
- Consumes: `transformCvContent(html, content, options)`, `CvExperienceData`, stable experience card classes and existing HTML slots.
- Produces: escaped text replacement that preserves article identity, `h3.experience-role`, nested `div` containers, link attributes and `span.experience-value` wrappers.

- [ ] **Step 1: Replace the section-only helper with a balanced element locator**

Replace `hasClassSection` and `transformClassSection` with:

```javascript
function classOpeningPattern(tagName, className, flags = "i") {
  return new RegExp(
    `<${tagName}\\b(?=[^>]*\\bclass=["'][^"']*\\b${className}\\b[^"']*["'])[^>]*>`,
    flags,
  );
}

function findElementByClass(html, tagName, className) {
  const openings = [...html.matchAll(classOpeningPattern(tagName, className, "gi"))];
  if (openings.length !== 1) {
    throw new Error(`Expected exactly one .${className} in CV HTML; got ${openings.length}`);
  }

  const opening = openings[0];
  const start = opening.index;
  const innerStart = start + opening[0].length;
  const tags = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tags.lastIndex = start;
  let depth = 0;

  for (const match of html.matchAll(tags)) {
    const isClosing = match[0].startsWith("</");
    depth += isClosing ? -1 : 1;
    if (depth === 0) {
      const closeStart = match.index;
      return {
        start,
        end: closeStart + match[0].length,
        open: opening[0],
        inner: html.slice(innerStart, closeStart),
        close: match[0],
      };
    }
  }

  throw new Error(`CV .${className} has no balanced closing ${tagName}`);
}

function hasElementByClass(html, tagName, className) {
  return classOpeningPattern(tagName, className).test(html);
}

function transformElementByClass(html, tagName, className, transformInner, required) {
  if (!required) {
    if (hasElementByClass(html, tagName, className)) {
      throw new Error(`CV .${className} must stay absent for this experience card`);
    }
    return html;
  }

  const element = findElementByClass(html, tagName, className);
  const replacement = `${element.open}${transformInner(element.inner)}${element.close}`;
  return `${html.slice(0, element.start)}${replacement}${html.slice(element.end)}`;
}
```

- [ ] **Step 2: Point cases and links at their real `div` containers**

Change both calls from the removed section helper to:

```javascript
return transformElementByClass(
  article,
  "div",
  "experience-cases",
  transformInner,
  entry.cases.length > 0,
);
```

and:

```javascript
return transformElementByClass(
  article,
  "div",
  "experience-links",
  transformInner,
  entry.links.length > 0,
);
```

Keep the existing anchor/span replacement patterns so opening tags, hrefs and attributes are retained.

- [ ] **Step 3: Preserve fact wrappers while editing label and text**

Implement the facts transformation with the real nested structure:

```javascript
function transformExperienceFacts(article, entry) {
  return transformElementByClass(
    article,
    "div",
    "experience-facts",
    (inner) => {
      const factPattern = /(<div\b(?=[^>]*\bclass=["'][^"']*\bexperience-fact\b[^"']*["'])[^>]*>)([\s\S]*?)(<\/div>)/gi;
      const matches = [...inner.matchAll(factPattern)];
      if (matches.length !== entry.facts.length) {
        throw new Error(`CV experience ${entry.id} fact markup count must remain ${entry.facts.length}; got ${matches.length}`);
      }

      let index = 0;
      return inner.replace(factPattern, (_match, open, factInner, close) => {
        const fact = entry.facts[index];
        index += 1;
        const labelPattern = /<b\b(?=[^>]*\bclass=["'][^"']*\bexperience-label\b[^"']*["'])[^>]*>[\s\S]*?<\/b>/i;
        const valuePattern = /(<span\b(?=[^>]*\bclass=["'][^"']*\bexperience-value\b[^"']*["'])[^>]*>)[\s\S]*?(<\/span>)/i;

        let transformedInner = factInner;
        if (fact.label) {
          if (labelPattern.test(transformedInner)) {
            transformedInner = transformedInner.replace(
              labelPattern,
              `<b class="experience-label">${escapeHtml(fact.label)}</b>`,
            );
          } else {
            transformedInner = `<b class="experience-label">${escapeHtml(fact.label)}</b>${transformedInner}`;
          }
        } else {
          transformedInner = transformedInner.replace(labelPattern, "");
        }

        transformedInner = replaceExactlyOnce(
          transformedInner,
          valuePattern,
          (_valueMatch, valueOpen, valueClose) => `${valueOpen}${escapeHtml(fact.text)}${valueClose}`,
          `.experience-value for ${entry.id} fact ${index}`,
        );
        return `${open}${transformedInner}${close}`;
      });
    },
    entry.facts.length > 0,
  );
}
```

- [ ] **Step 4: Use the real role heading element**

In `transformExperienceArticle`, replace:

```javascript
transformed = replaceElementTextByClass(transformed, "h4", "experience-role", entry.role);
```

with:

```javascript
transformed = replaceElementTextByClass(transformed, "h3", "experience-role", entry.role);
```

- [ ] **Step 5: Run the focused transformation test**

Run:

```bash
node --test --test-name-pattern="transform changes editorial copy" test/cv-experience-copy-cms.test.mjs
```

Expected: PASS with preserved `h3`, hrefs, `div` containers and `span.experience-value` wrappers.

- [ ] **Step 6: Run the full CV content and production suite**

Run:

```bash
node --test test/cv-cms.test.mjs test/cv-experience-copy-cms.test.mjs test/cv-production.test.mjs test/cv-profile-cms.test.mjs test/cv-contacts-cms.test.mjs test/cv-skills-cms.test.mjs test/cv-education-cms.test.mjs test/cv-runtime.test.mjs test/cv-entry.test.mjs
```

Expected: all CV tests pass, including missing-card failure, authored visibility and physical production removal.

- [ ] **Step 7: Commit the transformer repair**

Run:

```bash
git add tools/lib/cv-content.mjs test/cv-experience-copy-cms.test.mjs test/cv-cms.test.mjs test/cv-production.test.mjs
git commit -m "fix(cms): complete CV experience transformation"
```

---

### Task 6: Verify the Entire CMS Editorial Surface

**Files:**
- Verify: `.pages.yml`
- Verify: `src/content/projects.json`
- Verify: `src/content/cases/*.json`
- Verify: `src/content/collections/shootings.json`
- Verify: `src/content/shootings/*.json`
- Verify: `src/content/cv.json`
- Verify: affected adapters, renderers and tests under `src/data/`, `src/site/`, `tools/` and `test/`

**Interfaces:**
- Consumes: the integrated Case and CV slices plus existing project-card and Shootings CMS implementations.
- Produces: one verified editorial contract for CV and the four main project areas.

- [ ] **Step 1: Run the focused CMS suite**

Run:

```bash
node --test \
  test/pages-cms-yaml-syntax.test.mjs \
  test/project-cards-cms.test.mjs \
  test/project-card-visibility-cms.test.mjs \
  test/jestei-cms-copy.test.mjs \
  test/jestei-cms-paragraph-contract.test.mjs \
  test/styx-cms-copy.test.mjs \
  test/sensetique-cms-copy.test.mjs \
  test/shootings-cms-records.test.mjs \
  test/cv-cms.test.mjs \
  test/cv-experience-copy-cms.test.mjs \
  test/cv-profile-cms.test.mjs \
  test/cv-contacts-cms.test.mjs \
  test/cv-skills-cms.test.mjs \
  test/cv-education-cms.test.mjs \
  test/cv-production.test.mjs
```

Expected: zero failed tests.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
npm run typecheck
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Verify the content map and runtime isolation contracts**

Run:

```bash
node --test test/cms-content-map.test.mjs test/cms-runtime-editability.test.mjs test/site-runtime-isolation.test.mjs test/site-homepage-presentation.test.mjs
```

Expected: all tests pass; no runtime, presentation or media ownership moved into CMS.

- [ ] **Step 4: Inspect the complete branch diff**

Run:

```bash
git diff --stat origin/dev...HEAD
git diff --name-status origin/dev...HEAD
git diff --check
git status --short
```

Expected: only the approved Case/CV source, adapters, transformer, CMS config, tests and planning documents differ. There are no generated artifacts, media rewrites or unrelated UI changes.

---

### Task 7: Run Full Verification and Integrate Into `dev`

**Files:**
- Verify: entire repository
- Remote branch: `fix/cms-cv-four-projects`
- Pull request target: `dev`

**Interfaces:**
- Consumes: the locally verified completion branch.
- Produces: a reviewable remote pull request whose final commit passes Verify changes and CodeQL, followed by a green `dev` head.

- [ ] **Step 1: Restore the complete working tree required by media verification**

Run:

```bash
git sparse-checkout disable
npm ci
```

Expected: all tracked production media required by repository verification is present and dependencies install under Node 24.

- [ ] **Step 2: Run the repository completion gate**

Run:

```bash
npm run verify
```

Expected: typecheck, core tests, media synchronization, build/postbuild and all browser smoke suites pass with exit code 0.

- [ ] **Step 3: Prove verification did not rewrite tracked state**

Run:

```bash
git status --short
git diff --check
```

Expected: clean working tree. If deterministic builders produce a tracked change, inspect and resolve the source mismatch; do not commit unexplained generated noise.

- [ ] **Step 4: Publish the completion branch**

Run:

```bash
git push -u origin HEAD:fix/cms-cv-four-projects
```

If the local checkout has no GitHub write credential, publish the same tree through the connected GitHub API by creating blobs for every changed file, one tree based on the current `origin/dev` tree, one commit with message `fix(cms): complete CV and main project editors`, and updating `refs/heads/fix/cms-cv-four-projects` to that commit. The remote tree must match `git diff origin/dev...HEAD` exactly.

- [ ] **Step 5: Open one completion pull request**

Run:

```bash
gh pr create \
  --repo looksawful/looksawful.ru \
  --base dev \
  --head fix/cms-cv-four-projects \
  --title "CMS: complete CV and four main project editors" \
  --body "Completes the approved Pages CMS v1 contract for CV, Jestei Pool, Styx, Sensetique, Shootings and the four fixed homepage cards. Preserves routes, hrefs, media identity, layout and runtime ownership in code. Supersedes #51 and #52 after integrated verification."
```

- [ ] **Step 6: Require fresh remote verification**

Wait for these checks on the final pull-request head:

```text
Verify changes: success
CodeQL: success
```

Inspect failed job logs rather than rerunning blindly. Any code or test correction restarts focused local verification and `npm run verify` before updating the branch.

- [ ] **Step 7: Review and merge the completion pull request**

Verify the remote changed-file list matches the local list, then merge through the GitHub pull-request operation using a normal merge commit. Do not force-push or bypass checks.

- [ ] **Step 8: Close superseded pull requests after integration**

Close PR #51 and PR #52 with this comment:

```text
Superseded by the integrated, fully verified CMS completion pull request. The reviewed Case work and repaired CV work are now present on dev together.
```

- [ ] **Step 9: Require the new `dev` head to pass automatic verification**

Wait for:

```text
Verify dev: success
CodeQL: success
```

Record the final `dev` commit SHA and workflow URLs for handoff.

---

### Task 8: Publish to `prod` and Verify the Working System

**Files:**
- Pull request source: `dev`
- Pull request target: `prod`
- Production routes: `/`, `/cv/`, `/work/jestei-pool/`, `/work/styx/`, `/work/sensetique/`, `/shootings/`

**Interfaces:**
- Consumes: green `dev`, existing publication workflow and explicit user approval to publish.
- Produces: a green `prod` deployment and an operational Pages CMS editing path that remains pointed at `dev`.

- [ ] **Step 1: Create the publication pull request**

Run:

```bash
gh pr create \
  --repo looksawful/looksawful.ru \
  --base prod \
  --head dev \
  --title "Publish completed CMS for CV and main projects" \
  --body "Publishes the verified Pages CMS contract for CV, Jestei Pool, Styx, Sensetique, Shootings and the four homepage project cards. Source: dev. Target: prod."
```

If the existing Pages CMS `Подготовить публикацию` action has already created this exact `dev -> prod` pull request, reuse it instead of opening a duplicate.

- [ ] **Step 2: Review the full production delta and require checks**

Confirm the pull request contains the expected accumulated `dev` changes and no secret, generated-media anomaly or unrelated unfinished branch. Require all configured Verify changes and CodeQL checks to succeed.

- [ ] **Step 3: Merge the reviewed publication pull request**

Merge normally into `prod`. Do not push directly to `prod`, enable auto-merge or bypass required checks.

- [ ] **Step 4: Wait for deployment and production health workflows**

Require the GitHub Pages deployment workflow and post-deploy production healthcheck associated with the new `prod` SHA to complete successfully.

- [ ] **Step 5: Run the production route smoke**

Run the repository production suite:

```bash
npm run test:e2e:production
```

Then verify HTTP and rendered-page availability for:

```text
https://www.looksawful.ru/
https://www.looksawful.ru/cv/
https://www.looksawful.ru/work/jestei-pool/
https://www.looksawful.ru/work/styx/
https://www.looksawful.ru/work/sensetique/
https://www.looksawful.ru/shootings/
```

Expected: successful navigation, no missing local assets, CV experience cards render according to CMS visibility, and each project route retains its existing layout/runtime.

- [ ] **Step 6: Smoke the hosted CMS on `dev`**

Open `https://app.pagescms.org`, select `looksawful/looksawful.ru`, and select branch `dev`.

Verify:

```text
Карточки проектов: four fixed records load
Кейсы / Jestei Pool: role, period, lead, sections, overlays load
Кейсы / Styx: role, period, lead, sections, credits load
Кейсы / Sensetique: intro, sections, credits, notes load
Съёмки: overview and existing records load
Резюме: profile, skills, education and fifteen complete experience records load
```

Confirm fixed IDs are readonly, fixed records cannot be created/renamed/deleted, `Проверить сайт` targets the current branch, and `Подготовить публикацию` does not auto-merge.

- [ ] **Step 7: Record final evidence**

Report:

- completion pull-request URL and merge SHA;
- final `dev` verification URLs;
- publication pull-request URL and `prod` merge SHA;
- deployment and healthcheck URLs;
- local `npm run verify` result;
- production smoke result;
- whether the authenticated Pages CMS UI smoke completed or requires the owner's signed-in session.
