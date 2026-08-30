import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parse as parseYaml } from "yaml";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("blog uses an isolated lightweight CSS and runtime entrypoint", async () => {
  const [entryCss, blogCss, runtime] = await Promise.all([
    read("src/styles/blog-entry.css"),
    read("src/styles/blog.css"),
    read("src/blog.ts"),
  ]);

  assert.match(entryCss, /source-serif-4/);
  assert.match(entryCss, /\.\/tokens\.css/);
  assert.match(entryCss, /\.\/colors\.css/);
  assert.match(entryCss, /\.\/patterns\.css/);
  assert.match(entryCss, /\.\/site-navigation\.css/);
  assert.match(entryCss, /\.\/blog\.css/);
  assert.doesNotMatch(entryCss, /components\.css|captions\.css|motion\.css/);
  assert.match(blogCss, /\.blog-index/);
  assert.match(blogCss, /\.blog-post/);
  assert.match(blogCss, /\.blog-prose/);
  assert.doesNotMatch(blogCss, /#[0-9a-f]{3,8}\b/i);

  assert.match(runtime, /blog-filter/);
  assert.match(runtime, /blog-video/);
  assert.match(runtime, /site-navigation/);
  assert.match(runtime, /site-analytics/);
  assert.match(runtime, /code-block/);
  assert.doesNotMatch(runtime, /gsap|three|photoswipe|embla|media-deck|infinite-reel|interactive\.js|motion\.ts/i);
});

test("Pages CMS owns blog authoring and media but not routing", async () => {
  const cmsSource = await read(".pages.yml");
  const cms = parseYaml(cmsSource);
  const navigation = JSON.parse(await read("src/content/navigation.json"));

  assert.ok(Array.isArray(cms.media), "Pages CMS media must be an array");
  const blogMedia = cms.media.find((item) => item?.name === "blog-images");
  assert.ok(blogMedia, "blog-images must be registered under top-level media");
  assert.equal(blogMedia.input, "public/media/blog");
  assert.equal(blogMedia.output, "/media/blog");
  assert.equal(cms.actions?.some((item) => item?.name === "blog-images"), false);

  assert.ok(Array.isArray(cms.content), "Pages CMS content must be an array");
  const blogCollection = cms.content.find((item) => item?.name === "blog");
  assert.ok(blogCollection, "blog collection must be registered under content");
  assert.equal(blogCollection.path, "src/content/blog");
  assert.equal(blogCollection.format, "yaml-frontmatter");
  assert.equal(blogCollection.operations?.rename, false);
  assert.equal(blogCollection.operations?.delete, false);
  assert.ok(blogCollection.fields?.some((field) => field?.name === "body" && field?.type === "rich-text"));

  assert.ok(navigation.some(({ id, label }) => id === "blog" && label === "Блог"));
});

test("blog article stubs are generated before dev/site builds rather than committed as authored pages", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const gitignore = await read(".gitignore");

  assert.equal(packageJson.scripts["site:entries:prepare"], "node tools/prepare-blog-entries.mjs");
  assert.match(packageJson.scripts.dev, /site:entries:prepare/);
  assert.match(packageJson.scripts["build:site"], /site:entries:prepare/);
  assert.equal(packageJson.scripts["build:vite"], "vite build");
  assert.match(gitignore, /blog\/\*\/index\.html/);
});
