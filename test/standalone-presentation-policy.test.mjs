import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as presentationModule from "../src/site/pages/entity-presentation.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { getPageByPath } from "../src/site/pages/manifest.ts";

function entityPage(path) {
  const page = getPageByPath(path);
  assert.ok(page && (page.type === "case" || page.type === "collection" || page.type === "project"));
  return page;
}

test("standalone presentation registry owns temporary case and collection copy policies", () => {
  assert.equal(typeof presentationModule.getEntityStandalonePresentation, "function");
  const jestei = presentationModule.getEntityStandalonePresentation("case:jestei-pool");
  assert.equal(jestei.intro?.head, false);
  assert.equal(jestei.intro?.role, false);
  assert.equal(jestei.intro?.period, false);

  const styx = presentationModule.getEntityStandalonePresentation("case:styx");
  assert.deepEqual(styx.hiddenSectionIds, ["styx-social-instructions"]);

  const shootings = presentationModule.getEntityStandalonePresentation("collection:music-photography");
  assert.equal(shootings.intro?.head, false);
  assert.equal(shootings.intro?.lead, false);
  assert.equal(shootings.sections?.copy, false);
  assert.equal(shootings.sections?.omitEmpty, true);
  assert.equal(shootings.suppressCaptions, true);
});

test("generic standalone entity renderer contains no direct Styx or Shootings page-id policy branches", async () => {
  const source = await readFile(new URL("../src/site/renderers/entity-page.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /case:styx|collection:music-photography|withoutStyxSocialInstructions|shootingsVisualOnlyContent/);
});

test("standalone policy preserves approved Jestei, Styx and Shootings output", () => {
  const jestei = renderStandaloneEntityPage(entityPage("/work/jestei-pool/"));
  assert.doesNotMatch(jestei, /class="project__head"/);
  assert.match(jestei, /Jestei Pool/);

  const styx = renderStandaloneEntityPage(entityPage("/work/styx/"));
  assert.doesNotMatch(styx, /id="styx-social-instructions"/);
  assert.match(styx, /Styx Jewel/);

  const shootings = renderStandaloneEntityPage(entityPage("/shootings/"));
  assert.match(shootings, /<h1[^>]*>\s*Съёмки\s*<\/h1>/);
  assert.doesNotMatch(shootings, /media__caption/);
  assert.doesNotMatch(shootings, /section__intro|section__heading|class="credits"/);
  assert.match(shootings, /<img\b|<video\b/);
});



