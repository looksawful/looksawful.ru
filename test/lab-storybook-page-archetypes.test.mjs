import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, rootUrl), "utf8").catch(() => "");

test("page document support preserves production body markup but omits runtime scripts", async () => {
  const module = await import("../src/lab/storybook-support/page-document.js").catch(() => null);
  assert.ok(module?.extractPageBody, "page-document helper must exist");
  const html = '<!doctype html><html><head><title>x</title></head><body data-page-id="x"><header>nav</header><main><h1>x</h1><script type="module" src="/runtime.js"></script></main></body></html>';
  const body = module.extractPageBody(html);
  assert.match(body, /<header>nav<\/header>/);
  assert.match(body, /<main><h1>x<\/h1>/);
  assert.doesNotMatch(body, /<script\b/);
  assert.doesNotMatch(body, /<head>|<body/i);
});

const storyCases = [
  ["src/lab/stories/gallery-page.stories.js", "src/site/renderers/gallery-page.ts", "listed: true", "indexable: true"],
  ["src/lab/stories/entity-page-listed.stories.js", "src/site/renderers/entity-page.ts", "listed: true", "indexable: true"],
  ["src/lab/stories/entity-page-unlisted.stories.js", "src/site/renderers/entity-page.ts", "listed: false", "indexable: false"],
  ["src/lab/stories/not-found-page.stories.js", "src/site/renderers/not-found-page.ts", "listed: false", "indexable: false"],
];
for (const [storyPath, rendererPath, listed, indexable] of storyCases) {
  test(`${storyPath} is a canonical route-backed page story`, async () => {
    const story = await read(storyPath);
    assert.notEqual(story, "", `${storyPath} must exist`);
    assert.match(story, new RegExp(rendererPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(story, /extractPageBody/);
    assert.match(story, /layer:\s*"page"/);
    assert.match(story, /policy:\s*"page"/);
    assert.match(story, /canonical:\s*true/);
    assert.match(story, /visibility:\s*\["always"\]/);
    assert.match(story, new RegExp(listed));
    assert.match(story, new RegExp(indexable));
    assert.match(story, /responsive:\s*\{[\s\S]*review:\s*\["desktop",\s*"tablet",\s*"mobile"\]/);
  });
}

test("entity page stories declare the production entity composition owners", async () => {
  const story = await read("src/lab/stories/entity-page-listed.stories.js");
  for (const source of [
    "src/site/renderers/entity-page.ts",
    "src/site/renderers/entity/entity-shell.ts",
    "src/site/renderers/entity/content-block.ts",
    "src/site/renderers/entity/section.ts",
    "src/site/shell/page-shell.ts",
  ]) {
    assert.match(story, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("homepage story uses the real index fixture and production homepage pipeline", async () => {
  const story = await read("src/lab/stories/home-page.stories.js");
  assert.notEqual(story, "", "home-page story must exist");
  assert.match(story, /index\.html\?raw/);
  assert.match(story, /renderHomepagePage/);
  assert.match(story, /src\/site\/renderers\/home\/home-page\.ts/);
  assert.match(story, /src\/site\/renderers\/home\/home-slots\.ts/);
  assert.match(story, /layer:\s*"page"/);
  assert.match(story, /policy:\s*"page"/);
  assert.match(story, /routeDiscovery:\s*\{\s*listed:\s*true,\s*indexable:\s*true\s*\}/);
  assert.match(story, /review:\s*\["desktop",\s*"tablet",\s*"mobile"\]/);
});