import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  movesAwfulAnimationsIntro,
  movesAwfulCanvasGallery,
  movesAwfulIntro,
  movesAwfulLandingMedia,
} from "../src/data/content/moves-awful.ts";
import { otherProjects } from "../src/data/catalog/projects/other.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";
import { escapeHtml } from "../src/utils/html.ts";

const contentPath = "src/content/standalone-projects/moves-awful.json";
const adapterPath = "src/data/content/moves-awful-editorial.ts";

const clone = (value) => structuredClone(value);

test("Moves Awful has a strict CMS-owned editorial source", async () => {
  assert.equal(existsSync(contentPath), true, `${contentPath} must exist`);
  assert.equal(existsSync(adapterPath), true, `${adapterPath} must exist`);

  const source = JSON.parse(await readFile(contentPath, "utf8"));
  assert.deepEqual(Object.keys(source).sort(), ["intro", "animations"].sort());
  assert.deepEqual(
    Object.keys(source.intro).sort(),
    ["head", "title", "role", "period", "summary"].sort(),
  );
  assert.deepEqual(Object.keys(source.animations).sort(), ["title", "paragraphs"].sort());

  const { movesAwfulEditorialContent, parseMovesAwfulEditorialContent } = await import(
    "../src/data/content/moves-awful-editorial.ts"
  );

  assert.deepEqual(movesAwfulEditorialContent, source);
  assert.deepEqual(parseMovesAwfulEditorialContent(clone(source)), source);

  const unexpected = clone(source);
  unexpected.intro.route = "/work/changed-by-cms/";
  assert.throws(() => parseMovesAwfulEditorialContent(unexpected), /unexpected|field|key/i);

  const whitespace = clone(source);
  whitespace.animations.paragraphs = ["   "];
  assert.throws(() => parseMovesAwfulEditorialContent(whitespace), /non-empty|string|paragraph/i);

  const noParagraphs = clone(source);
  noParagraphs.animations.paragraphs = [];
  assert.throws(() => parseMovesAwfulEditorialContent(noParagraphs), /paragraph|non-empty|array/i);
});

test("Moves Awful CMS copy feeds existing intro, section and matching catalog fields", async () => {
  const source = JSON.parse(await readFile(contentPath, "utf8"));

  assert.equal(movesAwfulIntro.head.type, "text");
  assert.equal(movesAwfulIntro.head.text, source.intro.head);
  assert.equal(movesAwfulIntro.title.type, "text");
  assert.equal(movesAwfulIntro.title.text, source.intro.title);
  assert.equal(movesAwfulIntro.role, source.intro.role);
  assert.equal(movesAwfulIntro.period, source.intro.period);
  assert.equal(movesAwfulIntro.summary, source.intro.summary);
  assert.equal(movesAwfulAnimationsIntro.title, source.animations.title);
  assert.deepEqual(movesAwfulAnimationsIntro.paragraphs, source.animations.paragraphs);

  const renderedIntro = renderProjectIntro(movesAwfulIntro);
  for (const value of Object.values(source.intro)) {
    assert.ok(renderedIntro.includes(escapeHtml(value)));
  }

  const renderedAnimations = renderSectionIntro(movesAwfulAnimationsIntro);
  assert.ok(renderedAnimations.includes(escapeHtml(source.animations.title)));
  for (const paragraph of source.animations.paragraphs) {
    assert.ok(renderedAnimations.includes(escapeHtml(paragraph)));
  }

  const project = otherProjects.find((candidate) => candidate.id === "moves-awful");
  assert.ok(project);
  assert.equal(project.name, source.intro.title);
  assert.equal(project.date, source.intro.period);
  assert.equal(project.summary, source.intro.summary);
});

test("Moves Awful CMS leaves media, canvas runtime, route and discovery code-owned", () => {
  assert.deepEqual(
    movesAwfulLandingMedia.map(({ entryId, captionView, video }) => ({ entryId, captionView, video })),
    [
      {
        entryId: "moves-awful-jestei-landing-animation-01-use-01",
        captionView: "overlay",
        video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" },
      },
      {
        entryId: "moves-awful-jestei-landing-animation-02-use-01",
        captionView: "overlay",
        video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" },
      },
      {
        entryId: "moves-awful-jestei-landing-animation-03-use-01",
        captionView: "overlay",
        video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" },
      },
    ],
  );

  assert.deepEqual(
    {
      profile: movesAwfulCanvasGallery.profile,
      variant: movesAwfulCanvasGallery.variant,
      id: movesAwfulCanvasGallery.id,
      className: movesAwfulCanvasGallery.className,
      entryIds: movesAwfulCanvasGallery.items.map(({ entryId }) => entryId),
    },
    {
      profile: "moves",
      variant: "arc",
      id: "real-gallery",
      className: "animated-canvas-gallery",
      entryIds: [
        "obladaet-01-source-02-2x3-use-01",
        "obladaet-02-source-04-4x5-use-01",
        "evasha-05-source-01-1x1-use-01",
        "evasha-06-source-01-2x3-use-01",
        "evasha-07-source-02-121x125-use-01",
        "igguana-11-source-01-1x1-use-01",
        "igguana-11-source-05-2x3-use-01",
        "hypression-14-source-01-5x4-use-01",
        "hypression-15-source-02-256x181-use-01",
        "ofelia-19-source-01-4x5-use-01",
        "ofelia-19-source-03-1553x2135-use-01",
        "obladaet-04-source-01-4x5-use-01",
        "obladaet-03-source-03-1129x1280-use-01",
        "evasha-10-source-02-2x3-use-01",
        "hypression-17-source-01-4x5-use-01",
        "evasha-08-source-01-99x140-use-01",
      ],
    },
  );

  const page = sitePages.find((candidate) => candidate.id === "project:moves-awful");
  assert.ok(page);
  assert.equal(page.path, "/work/moves-awful/");
  assert.deepEqual(page.discovery, { listed: false, indexable: false });
});

test("Pages CMS exposes Moves Awful editorial copy without route, taxonomy, media or runtime controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: moves-awful-standalone-project\n");
  assert.notEqual(start, -1, "Moves Awful standalone Project CMS entry must exist");

  const rest = cms.slice(start);
  const nextSibling = rest.indexOf("\n      - name: ", 8);
  const nextTopLevel = rest.indexOf("\n  - name: ", 8);
  const boundaries = [nextSibling, nextTopLevel].filter((index) => index !== -1);
  const end = boundaries.length ? Math.min(...boundaries) : rest.length;
  const config = rest.slice(0, end);

  assert.match(config, /type: file/);
  assert.match(config, /path: src\/content\/standalone-projects\/moves-awful\.json/);
  assert.match(config, /create: false/);
  assert.match(config, /rename: false/);
  assert.match(config, /delete: false/);

  for (const field of ["intro", "head", "title", "role", "period", "summary", "animations", "paragraphs"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of [
    "id",
    "route",
    "href",
    "listed",
    "indexable",
    "enabled",
    "collectionIds",
    "engagementTypeIds",
    "roleIds",
    "entryId",
    "captionView",
    "video",
    "profile",
    "variant",
    "className",
    "items",
  ]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
