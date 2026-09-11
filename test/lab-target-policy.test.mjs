import test from "node:test";
import assert from "node:assert/strict";

import {
  createLabTargets,
  getLabTargetCapabilities,
} from "../src/devtools/lab/targets.ts";

test("Lab target factory exposes only reviewed local, preview and production origins", () => {
  const targets = createLabTargets({
    currentOrigin: "http://127.0.0.1:5173/tools/lab/",
    previewOrigin: "https://pr-735.looksawful-ru-preview.pages.dev/work/jestei-pool/",
  });

  assert.deepEqual(targets, [
    {
      id: "local",
      label: "Local",
      kind: "local",
      origin: "http://127.0.0.1:5173",
    },
    {
      id: "preview",
      label: "PR Preview",
      kind: "preview",
      origin: "https://pr-735.looksawful-ru-preview.pages.dev",
    },
    {
      id: "production",
      label: "Production",
      kind: "production",
      origin: "https://www.looksawful.ru",
    },
  ]);
});

test("same-origin local target alone receives DOM inspection and scratch capabilities", () => {
  const [local, preview, production] = createLabTargets({
    currentOrigin: "http://127.0.0.1:5173",
    previewOrigin: "https://pr-735.looksawful-ru-preview.pages.dev",
  });

  assert.deepEqual(getLabTargetCapabilities(local, "http://127.0.0.1:5173"), {
    visual: true,
    inspectDom: true,
    injectScratchCss: true,
    privilegedBridge: false,
  });

  for (const target of [preview, production]) {
    assert.deepEqual(getLabTargetCapabilities(target, "http://127.0.0.1:5173"), {
      visual: true,
      inspectDom: false,
      injectScratchCss: false,
      privilegedBridge: false,
    });
  }
});

test("production never gains privileged inspection merely because shell origin matches it", () => {
  const targets = createLabTargets({ currentOrigin: "https://www.looksawful.ru" });
  const production = targets.find((target) => target.kind === "production");
  assert.ok(production);

  assert.deepEqual(getLabTargetCapabilities(production, "https://www.looksawful.ru"), {
    visual: true,
    inspectDom: false,
    injectScratchCss: false,
    privilegedBridge: false,
  });
});

test("preview remains visual-only even when shell happens to share its origin", () => {
  const targets = createLabTargets({
    currentOrigin: "http://127.0.0.1:5173",
    previewOrigin: "https://pr-735.looksawful-ru-preview.pages.dev",
  });
  const preview = targets.find((target) => target.kind === "preview");
  assert.ok(preview);

  assert.deepEqual(
    getLabTargetCapabilities(preview, "https://pr-735.looksawful-ru-preview.pages.dev"),
    {
      visual: true,
      inspectDom: false,
      injectScratchCss: false,
      privilegedBridge: false,
    },
  );
});

test("target factory rejects invalid or non-http origins instead of accepting arbitrary input", () => {
  assert.throws(
    () => createLabTargets({ currentOrigin: "javascript:alert(1)" }),
    /http/i,
  );
  assert.throws(
    () => createLabTargets({ currentOrigin: "not a url" }),
    /origin|url/i,
  );
  assert.throws(
    () =>
      createLabTargets({
        currentOrigin: "http://127.0.0.1:5173",
        previewOrigin: "file:///tmp/preview",
      }),
    /http/i,
  );
});
