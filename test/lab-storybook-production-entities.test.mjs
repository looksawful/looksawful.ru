import assert from "node:assert/strict";
import test from "node:test";
import { storybookInventory } from "../src/lab/storybook/inventory.ts";
import meta, { Sections, Compositions, PageArchetypes } from "../src/lab/stories/entity-fixtures.stories.mjs";

const groups = [
  ["template", Sections],
  ["composition", Compositions],
  ["page", PageArchetypes],
];

test("native Storybook exposes every production-backed entity fixture without copying renderers", () => {
  assert.equal(meta.title, "05 Patterns & Templates/Production Entities");
  assert.equal(meta.parameters.looksawful.canonical, true);
  for (const [kind, story] of groups) {
    const expected = storybookInventory.filter((fixture) => fixture.kind === kind).map((fixture) => fixture.id);
    assert.ok(expected.length > 0, `${kind} must have fixtures`);
    assert.deepEqual(story.argTypes.fixtureId.options, expected);
    assert.equal(story.args.fixtureId, expected[0]);
    assert.equal(typeof story.render, "function");
  }
});

test("each entity story renders the actual canonical HTML and rejects unknown fixtures", () => {
  for (const [kind, story] of groups) {
    const fixture = storybookInventory.find((entry) => entry.kind === kind);
    const html = story.render({ fixtureId: fixture.id });
    assert.equal(typeof html, "string");
    assert.ok(html.length > 100, `${kind} should contain real rendered content`);
    assert.match(html, /data-story-fixture=/);
    assert.throws(() => story.render({ fixtureId: "not-real" }), /Unknown production fixture/);
  }
});


test("existing private-Lab composition fixtures render all real entity pages without missing specialized renderers", () => {
  for (const fixture of storybookInventory.filter((entry) => entry.kind === "composition" || entry.kind === "page")) {
    assert.doesNotThrow(() => fixture.render(), fixture.id);
  }
});


test("all 94 current template/composition/page fixtures render actual HTML without exceptions", () => {
  assert.ok(storybookInventory.length > 0);
  for (const fixture of storybookInventory) {
    const html = fixture.render();
    assert.equal(typeof html, "string", fixture.id);
    assert.ok(html.trim().length > 0, fixture.id);
  }
});
