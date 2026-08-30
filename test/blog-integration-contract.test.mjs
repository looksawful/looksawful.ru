import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  const cms = await read(".pages.yml");
  const navigation = JSON.parse(await read("src/content/navigation.json"));

  assert.match(cms, /name: blog-images/);
  assert.match(cms, /input: public\/media\/blog/);
  assert.match(cms, /output: \/media\/blog/);
  assert.match(cms, /name: blog\b/);
  assert.match(cms, /path: src\/content\/blog/);
  assert.match(cms, /format: yaml-frontmatter/);
  assert.match(cms, /rename: false/);
  assert.match(cms, /delete: false/);
  assert.match(cms, /name: body\b[\s\S]*?type: rich-text/);
  assert.ok(navigation.some(({ id, label }) => id === "blog" && label === "Блог"));
});

test("blog article stubs are generated before dev/build rather than committed as authored pages", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const gitignore = await read(".gitignore");

  assert.equal(packageJson.scripts["site:entries:prepare"], "node tools/prepare-blog-entries.mjs");
  assert.match(packageJson.scripts.dev, /site:entries:prepare/);
  assert.match(packageJson.scripts["build:vite"], /site:entries:prepare/);
  assert.match(gitignore, /blog\/\*\/index\.html/);
});
