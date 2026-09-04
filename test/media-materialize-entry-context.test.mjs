import assert from "node:assert/strict";
import test from "node:test";

import { materializeMediaEntrySource } from "../tools/media/materialize-entry-context.mjs";

test("materializer writes canonical identity and contextual values into the MediaEntry source", () => {
  const source = `export const entries = [\n  {\n    id: "entry-a",\n    assetId: "old-asset",\n    caption: { title: "Keep me" },\n  },\n];\n`;
  const runtimeEntries = new Map([
    ["entry-a", {
      id: "entry-a",
      assetId: "canonical-asset",
      projectIds: ["project-a"],
      title: "Context title",
      alt: "",
      tags: ["tag-a"],
    }],
  ]);

  const result = materializeMediaEntrySource(source, "fixture.ts", runtimeEntries);

  assert.match(result, /assetId:\s*"canonical-asset"/);
  assert.match(result, /projectIds:\s*\["project-a"\]/);
  assert.match(result, /title:\s*"Context title"/);
  assert.match(result, /alt:\s*""/);
  assert.match(result, /tags:\s*\["tag-a"\]/);
  assert.match(result, /caption:\s*\{ title: "Keep me" \}/);
});

test("materializer is idempotent", () => {
  const source = `export const entries = [{ id: "entry-a", assetId: "old-asset" }];\n`;
  const runtimeEntries = new Map([
    ["entry-a", { id: "entry-a", assetId: "canonical-asset", projectIds: [] }],
  ]);

  const once = materializeMediaEntrySource(source, "fixture.ts", runtimeEntries);
  const twice = materializeMediaEntrySource(once, "fixture.ts", runtimeEntries);

  assert.equal(twice, once);
});
