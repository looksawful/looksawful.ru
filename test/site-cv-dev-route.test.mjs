import assert from "node:assert/strict";
import test from "node:test";

import { rewritePublicStaticDevRequest } from "../src/site/build/site-pages-plugin.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

const cvPage = sitePages.find((page) => page.id === "cv");
assert.ok(cvPage, "missing canonical CV SitePage");

test("Vite dev rewrites public-static routes from the canonical SitePage build contract", () => {
  assert.equal(rewritePublicStaticDevRequest("/cv/"), "/cv/index.html");
  assert.equal(rewritePublicStaticDevRequest("/cv"), "/cv/index.html");
  assert.equal(
    rewritePublicStaticDevRequest("/cv/?preview=1#profile"),
    "/cv/index.html?preview=1#profile",
  );
  assert.equal(rewritePublicStaticDevRequest("/cv/index.html"), "/cv/index.html");
  assert.equal(rewritePublicStaticDevRequest("/work/styx/"), "/work/styx/");

  const relocatedPages = sitePages.map((page) => page.id === "cv"
    ? {
        ...page,
        path: "/resume/",
        build: {
          kind: "public-static",
          sourcePath: "public/resume-shell/index.html",
        },
      }
    : page);

  assert.equal(
    rewritePublicStaticDevRequest("/resume/?preview=1#profile", relocatedPages),
    "/resume-shell/index.html?preview=1#profile",
  );
  assert.equal(rewritePublicStaticDevRequest("/resume", relocatedPages), "/resume-shell/index.html");
  assert.equal(rewritePublicStaticDevRequest("/cv/", relocatedPages), "/cv/");

  const viteOwnedPages = sitePages.map((page) => page.id === "cv"
    ? { ...page, build: { kind: "vite" } }
    : page);
  assert.equal(rewritePublicStaticDevRequest("/cv/", viteOwnedPages), "/cv/");
});
