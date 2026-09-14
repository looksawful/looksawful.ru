import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(
  new URL("../src/styles/project-shell.css", import.meta.url),
  "utf8",
);

test("desktop project lead override wins after shared lead constraints", () => {
  const sharedConstraintIndex = css.lastIndexOf(
    ".project__lead,\n  .text-lead",
  );
  const desktopOverrideIndex = css.lastIndexOf(
    "@container project (width > 50rem)",
  );

  assert.ok(sharedConstraintIndex >= 0, "missing shared project/text lead constraint");
  assert.ok(
    desktopOverrideIndex > sharedConstraintIndex,
    "desktop project lead override must appear after the shared lead constraint",
  );

  const desktopTail = css.slice(desktopOverrideIndex);
  assert.match(
    desktopTail,
    /\.project__lead\s*\{[^}]*max-inline-size:\s*none;/s,
  );
});
