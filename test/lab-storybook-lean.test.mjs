import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import main from "../tools/lab/storybook/main.mjs";

test("one Foundation token browser: no duplicate design-token addon", () => {
  const addons = main.addons.map((addon) => typeof addon === "string" ? addon : addon.name);
  assert.deepEqual(addons, ["@storybook/addon-docs", "@storybook/addon-a11y"]);
  const build = readFileSync(new URL("../tools/lab/build-storybook.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(build, /storybook-design-token@/);
});
