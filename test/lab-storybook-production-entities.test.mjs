import assert from "node:assert/strict";
import test from "node:test";
import { storybookInventory } from "../src/lab/storybook/inventory.ts";

test("legacy entity fixtures remain renderable without being part of the public Storybook", () => {
  assert.ok(storybookInventory.length > 0);
  for (const fixture of storybookInventory) {
    const html = fixture.render();
    assert.equal(typeof html, "string", fixture.id);
    assert.ok(html.trim().length > 0, fixture.id);
  }
});
