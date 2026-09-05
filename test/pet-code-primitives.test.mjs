import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  ["Awful Cases", "public/pets/awful-cases/index.html"],
  ["Berserk Timer", "public/pets/berserk-timer/index.html"],
];

test("standalone pet code surfaces use one shared progressive Copy enhancer", async () => {
  for (const [label, path] of pages) {
    const html = await readFile(path, "utf8");
    assert.match(
      html,
      /<script type="module" src="\/pets\/shared-code-copy\.js"><\/script>/,
      `${label} must load the shared Copy enhancer`,
    );
    assert.doesNotMatch(
      html,
      /navigator\.clipboard\.writeText|querySelectorAll\(['"]\[data-copy-target\]/,
      `${label} must not keep a page-local Copy implementation`,
    );
    assert.match(html, /data-copy-target=/, `${label} must retain progressive Copy controls`);
  }
});
