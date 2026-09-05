import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { renderJesteiThemeOrganismMockup } from "../src/components/specialized/index.ts";
import { JESTEI_THEME_NAMES } from "../src/components/jestei-theme-organism/jestei-theme-organism-data.js";
import {
  jesteiThemeOrganismMockup,
  jesteiThemeOrganismThemes,
} from "../src/data/content/jestei-theme-organism.ts";
import { getMediaAsset, getMediaEntry } from "../src/data/media/index.ts";

test("Jestei theme organism model is registered as project media", () => {
  const entry = getMediaEntry(jesteiThemeOrganismMockup.modelEntryId);
  const asset = getMediaAsset(entry.assetId);

  assert.equal(asset.type, "model");
  assert.equal(asset.src, "/media/projects/jestei/theme-organism/jestei-theme-organism.glb");
  assert.equal(asset.mimeType, "model/gltf-binary");
  assert.equal(asset.byteLength, 11404);
  assert.deepEqual(entry.projectIds, ["jestei-brand-system"]);
  assert.equal(entry.caption, undefined);
});

test("Jestei theme organism renderer preserves mockup and runtime markup contracts", () => {
  const html = renderJesteiThemeOrganismMockup(jesteiThemeOrganismMockup);

  assert.match(html, /class="media mockup jestei-theme-organism-mockup"/);
  assert.match(html, /data-device="desktop"/);
  assert.doesNotMatch(html, /data-mockup-theme="dark"/);
  assert.match(html, /data-caption-view="lightbox-only"/);
  assert.match(html, /data-lightbox="off"/);
  assert.match(html, /aria-label="Цветовые темы Jestei Pool"/);
  assert.match(html, /data-jestei-theme-instance="inline"/);
  assert.match(html, /data-jestei-theme-organism=""/);
  assert.match(html, /data-jestei-theme-model-src="\/media\/projects\/jestei\/theme-organism\/jestei-theme-organism\.glb"/);
  assert.match(html, /data-jestei-theme-draco-path="\/vendor\/draco\/gltf\/"/);
  assert.match(html, /data-motion-state="static"/);
  assert.match(html, /data-theme-track=""/);
  assert.match(html, /data-jestei-theme-canvas=""/);
  assert.equal((html.match(/data-theme-chip="/g) ?? []).length, 5);
  assert.equal((html.match(/class="jestei-theme-organism__card"/g) ?? []).length, 6);
  assert.equal((html.match(/data-loop-clone=""/g) ?? []).length, 1);
  assert.doesNotMatch(html, /data-caption="/);
  assert.doesNotMatch(html, /data-lightbox-item/);
  assert.doesNotMatch(html, /assets\/media/);
  assert.match(html, /Для клубных диджеев/);
  assert.match(html, /Для ивент-диджеев/);
  assert.match(html, /Для диджеев с расширенным доступом/);
  assert.match(html, /Для всех пользователей/);

  for (const theme of jesteiThemeOrganismThemes) {
    assert.match(html, new RegExp(`data-theme="${theme.name}"`));
    assert.match(html, new RegExp(`data-theme-palette="${theme.name}"`));
    assert.match(html, new RegExp(`data-theme-chip="${theme.name}"`));
    assert.match(html, new RegExp(`<p>${theme.description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</p>`));
    for (const token of theme.tokens) {
      assert.match(html, new RegExp(token.value));
    }
  }
});

test("Jestei theme organism runtime keeps the restored animation contracts", async () => {
  assert.deepEqual(
    JESTEI_THEME_NAMES,
    jesteiThemeOrganismThemes.map((theme) => theme.name),
  );

  const runtime = await readFile(
    new URL("../src/components/jestei-theme-organism/jestei-theme-organism.js", import.meta.url),
    "utf8",
  );
  const shaders = await readFile(
    new URL("../src/components/jestei-theme-organism/jestei-theme-organism-shaders.js", import.meta.url),
    "utf8",
  );

  assert.match(runtime, /import\("three"\)/);
  assert.match(runtime, /GLTFLoader/);
  assert.match(runtime, /DRACOLoader/);
  assert.match(runtime, /FRAGMENT_SHADER/);
  assert.match(runtime, /VERTEX_SHADER/);
  assert.match(runtime, /readModelUrl/);
  assert.match(runtime, /jesteiThemeModelSrc/);
  assert.match(runtime, /modelBufferPromises/);
  assert.match(runtime, /themeCopyShell\.offsetWidth/);
  assert.match(runtime, /IntersectionObserver/);
  assert.match(runtime, /prefers-reduced-motion|motionPreference/);
  assert.match(shaders, /uLineWidth/);
  assert.match(shaders, /uCycleTime/);
  assert.match(shaders, /uTextureScale/);
  assert.match(shaders, /gl_FragColor/);
});

test("Jestei theme organism mockup keeps the internal moving copy visible", async () => {
  const css = await readFile(
    new URL("../src/components/jestei-theme-organism/jestei-theme-organism.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /[.]jestei-theme-organism-mockup[\s\S]*--jestei-theme-viewport-padding: 0rem/);
  assert.doesNotMatch(
    css,
    /jestei-theme-organism-mockup[\s\S]*jestei-theme-organism__copy[\s\S]*opacity:\s*0/,
  );
  assert.match(
    css,
    /@media \(width <= 42rem\)[\s\S]*--jestei-track-fade:\s*clamp\(1rem, 4cqi, 1[.]5rem\)[\s\S]*mask-image:\s*linear-gradient/,
  );
  assert.match(
    css,
    /@media \(width <= 42rem\)[\s\S]*jestei-theme-organism__card-content[\s\S]*padding-inline:\s*clamp\(2rem, 7cqi, 3rem\)/,
  );
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(16rem, 0[.]42fr\)/);
});