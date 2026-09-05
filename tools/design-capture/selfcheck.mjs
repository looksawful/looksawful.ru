import assert from "node:assert/strict";

import {
  assertManualCaptureAllowed,
  parseMode,
  requiresInteractiveConfirmation,
} from "./safety.mjs";
import {
  breakpointSides,
  extractMediaBreakpoints,
  mergeBreakpoints,
} from "./discover-breakpoints.mjs";
import {
  mapHtmlPathToRoute,
  shouldExcludeRoute,
} from "./discover-pages.mjs";
import {
  COMPONENTS,
  OUTPUT_ROOT,
  PAGE_VIEWPORTS,
} from "./config.mjs";
import {
  createManifest,
  addCapture,
  addWarning,
} from "./manifest.mjs";
import {
  componentCapturePath,
  pageCapturePath,
  pageSlug,
} from "./paths.mjs";
import {
  createDeterministicStyleTag,
  validateRuntimeOptions,
} from "./runtime.mjs";

function expectThrow(fn, pattern) {
  assert.throws(fn, pattern);
}

expectThrow(
  () => assertManualCaptureAllowed({ CI: "true" }),
  /CI/i,
);
expectThrow(
  () => assertManualCaptureAllowed({ GITHUB_ACTIONS: "true" }),
  /GitHub Actions/i,
);
assert.doesNotThrow(() => assertManualCaptureAllowed({}));

assert.equal(requiresInteractiveConfirmation({ manual: false, isTTY: true }), true);
assert.equal(requiresInteractiveConfirmation({ manual: true, isTTY: false }), false);
expectThrow(
  () => requiresInteractiveConfirmation({ manual: false, isTTY: false }),
  /--manual/,
);

assert.equal(parseMode([]), "all");
assert.equal(parseMode(["--mode=pages"]), "pages");
assert.equal(parseMode(["--mode=components"]), "components");
expectThrow(() => parseMode(["--mode=wat"]), /mode/i);

assert.equal(mapHtmlPathToRoute("index.html"), "/");
assert.equal(mapHtmlPathToRoute("public/privacy/index.html"), "/privacy/");
assert.equal(mapHtmlPathToRoute("public/foo/bar.html"), "/foo/bar.html");
assert.equal(shouldExcludeRoute("/fixtures/example/", ["/fixtures/"]), true);
assert.equal(shouldExcludeRoute("/projects/jestei/", ["/fixtures/"]), false);

assert.deepEqual(
  extractMediaBreakpoints(`
    @media (max-width: 42rem) { .x { display:none } }
    @media screen and (min-width: 768px) { .x { display:block } }
    @media (width <= 64rem) { .x { gap: 1rem } }
  `),
  [672, 768, 1024],
);
assert.deepEqual(breakpointSides(672), [671, 673]);
assert.deepEqual(breakpointSides(320), [319, 321]);
assert.deepEqual(mergeBreakpoints([960, 672], [672, 1180]), [672, 960, 1180]);

assert.deepEqual(PAGE_VIEWPORTS, [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
]);
assert.equal(OUTPUT_ROOT.replaceAll("\\", "/"), "_local/design-capture");
assert.equal(new Set(COMPONENTS.map(({ name }) => name)).size, COMPONENTS.length);

const manifest = createManifest({ mode: "all", outputDir: "x", source: { branch: "dev" } });
addCapture(manifest, { type: "page", route: "/", file: "pages/desktop/home.png" });
addWarning(manifest, "missing optional component");
assert.equal(manifest.mode, "all");
assert.equal(manifest.captures.length, 1);
assert.equal(manifest.warnings.length, 1);
assert.equal(manifest.source.branch, "dev");

assert.equal(pageSlug("/"), "home");
assert.equal(pageSlug("/privacy/"), "privacy");
assert.equal(pageSlug("/foo/bar.html"), "foo--bar-html");
assert.equal(
  pageCapturePath({ viewport: "mobile", route: "/privacy/", kind: "full-page" }).replaceAll("\\", "/"),
  "pages/mobile/privacy--full-page.png",
);
assert.equal(
  componentCapturePath({ component: "site-nav", breakpoint: 672, instance: 2, side: "before" }).replaceAll("\\", "/"),
  "components/site-nav/672/002/before--671.png",
);

validateRuntimeOptions({ host: "127.0.0.1", port: 4173 });
expectThrow(() => validateRuntimeOptions({ host: "0.0.0.0", port: 4173 }), /loopback/i);
expectThrow(() => validateRuntimeOptions({ host: "127.0.0.1", port: 70000 }), /port/i);
assert.match(createDeterministicStyleTag(), /animation-duration:\s*0s/i);
assert.match(createDeterministicStyleTag(), /caret-color:\s*transparent/i);

console.log("design-capture selfcheck passed");
