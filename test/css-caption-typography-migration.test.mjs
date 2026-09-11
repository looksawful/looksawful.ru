import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const captions = readFileSync(
  new URL("../src/styles/captions.css", import.meta.url),
  "utf8",
);

test("caption base typography is declared once in its canonical rules", () => {
  assert.equal(
    (captions.match(/^\.media__caption\s*\{/gm) ?? []).length,
    1,
    "base media caption typography must not depend on a late duplicate rule",
  );
  assert.equal(
    (captions.match(/^\.media-lightbox__caption\s*\{/gm) ?? []).length,
    1,
    "base lightbox caption typography must not depend on a late duplicate rule",
  );
  assert.match(
    captions,
    /^\.media__caption\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/m,
  );
  assert.match(
    captions,
    /^\.media-lightbox__caption\s*\{[\s\S]*?line-height:\s*var\(--lh-body\);/m,
  );
});
