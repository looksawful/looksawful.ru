import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateSite } from "../tools/check-site-meta.mjs";

const canonical = "https://www.looksawful.ru/";

function validPage(overrides = {}) {
  const values = {
    title: "Existing title",
    description: "Existing published description.",
    robots: "index,follow,max-image-preview:large",
    canonical,
    ogTitle: "Existing title",
    ogDescription: "Existing published description.",
    ogUrl: canonical,
    jsonLd: JSON.stringify({ "@graph": [
      { "@type": "WebSite", url: canonical },
      { "@type": "Person", name: "Иван Крушинский", url: canonical },
    ] }),
    ...overrides,
  };
  return `<!doctype html><html><head>${values.title === null ? "" : `<title>${values.title}</title>`}${values.description === null ? "" : `<meta name="description" content="${values.description}">`}${values.robots === null ? "" : `<meta name="robots" content="${values.robots}">`}${values.canonical === null ? "" : `<link rel="canonical" href="${values.canonical}">`}${values.ogTitle === null ? "" : `<meta property="og:title" content="${values.ogTitle}">`}${values.ogDescription === null ? "" : `<meta property="og:description" content="${values.ogDescription}">`}${values.ogUrl === null ? "" : `<meta property="og:url" content="${values.ogUrl}">`}${values.jsonLd === null ? "" : `<script type="application/ld+json">${values.jsonLd}</script>`}</head><body><main id="x">x</main></body></html>`;
}

async function withSite(pageHtml, run = async (dir) => validateSite({ distDir: dir })) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "site-meta-test-"));
  try {
    await writeFile(path.join(dir, "index.html"), pageHtml, "utf8");
    await writeFile(path.join(dir, "robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://www.looksawful.ru/sitemap.xml\n", "utf8");
    await writeFile(path.join(dir, "sitemap.xml"), `<?xml version="1.0"?><urlset><url><loc>${canonical}</loc></url></urlset>`, "utf8");
    return await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("valid metadata passes", async () => {
  const result = await withSite(validPage());
  assert.equal(result.indexableCount, 1);
});

for (const [label, overrides, pattern] of [
  ["missing title", { title: null, ogTitle: null }, /missing or empty title/],
  ["empty title", { title: "", ogTitle: "" }, /missing or empty title/],
  ["missing description", { description: null, ogDescription: null }, /missing or empty description/],
  ["missing canonical", { canonical: null }, /missing production canonical/],
  ["wrong origin", { canonical: "https://looksawful.ru/", ogUrl: "https://looksawful.ru/" }, /origin must be/],
  ["invalid JSON-LD", { jsonLd: "{" }, /invalid JSON-LD/],
  ["og:url mismatch", { ogUrl: "https://www.looksawful.ru/other/" }, /og:url must equal canonical/],
]) {
  test(`${label} fails`, async () => {
    await assert.rejects(() => withSite(validPage(overrides)), pattern);
  });
}

test("duplicate canonical fails", async () => {
  await assert.rejects(() => withSite(validPage(), async (dir) => {
    await mkdir(path.join(dir, "copy"), { recursive: true });
    await writeFile(path.join(dir, "copy", "index.html"), validPage({ jsonLd: null }), "utf8");
    return validateSite({ distDir: dir });
  }), /duplicate canonical/);
});

test("noindex page is excluded from the indexable metadata contract", async () => {
  const result = await withSite('<!doctype html><html><head><title>private</title><meta name="robots" content="noindex,follow"></head><body>x</body></html>', async (dir) => {
    await writeFile(path.join(dir, "sitemap.xml"), "<?xml version=\"1.0\"?><urlset></urlset>", "utf8");
    return validateSite({ distDir: dir });
  });
  assert.equal(result.indexableCount, 0);
});
