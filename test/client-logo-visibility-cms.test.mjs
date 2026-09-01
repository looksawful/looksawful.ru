import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { clients } from "../src/data/catalog/clients.ts";
import { clientLogos } from "../src/data/clients.ts";
import { renderClientLogo } from "../src/templates/client-logo.ts";

const visibilityUrl = new URL("../src/content/client-logo-visibility.json", import.meta.url);
const cmsConfigUrl = new URL("../.pages.yml", import.meta.url);
const clientDataUrl = new URL("../src/data/clients.ts", import.meta.url);
const homeSlotsUrl = new URL("../src/site/renderers/home/home-slots.ts", import.meta.url);

const expectedIds = [
  "kursovoy",
  "players-club",
  "vk-music",
  "sensetique-photostudio",
  "48-jewelry",
  "second-friends-store",
  "li-ne-agency",
  "moch-fashn",
  "jestei-pool",
  "lyve-moscow",
  "mad-cow-films",
  "moskovskie-novosti",
  "progress-tradition",
  "puma",
  "sensetique-production-agency",
  "buro-24-7",
  "channel-one",
  "lenfilm",
  "stereotactic",
  "kaltblut",
  "s-and-s",
  "offmi",
  "evasha",
  "inna-honour",
  "flashin",
  "kislak",
  "dava",
  "styx-jewel",
  "affa-media",
  "vinne",
];

const logoOnlyIds = new Set([
  "sensetique-photostudio",
  "sensetique-production-agency",
]);

const preservedPresentationLabels = new Map([
  ["lyve-moscow", "Lyve Moscow"],
  ["moskovskie-novosti", "Газета Московские Новости"],
  ["progress-tradition", "Издательство Прогресс-Традиция"],
]);

test("client logo visibility registry keeps fixed identity while booleans remain editable", async () => {
  assert.equal(existsSync(fileURLToPath(visibilityUrl)), true, "client logo visibility content must exist");
  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));

  assert.deepEqual(visibility.map(({ id }) => id), expectedIds);
  assert.ok(visibility.every(({ visible }) => typeof visible === "boolean"));
});

test("client logo definitions relate canonical clients without collapsing logo-only identities", async () => {
  const dataModule = await import("../src/data/clients.ts");
  const definitions = dataModule.clientLogoDefinitions;

  assert.ok(Array.isArray(definitions), "clientLogoDefinitions must expose the complete code-owned logo collection");
  assert.deepEqual(definitions.map(({ id }) => id), expectedIds);

  const canonicalClientIds = new Set(clients.map(({ id }) => id));

  for (const definition of definitions) {
    if (logoOnlyIds.has(definition.id)) {
      assert.equal(definition.clientId, undefined, `${definition.id} must remain presentation-only`);
      continue;
    }

    assert.equal(definition.clientId, definition.id, `${definition.id} must relate directly to its canonical Client`);
    assert.equal(canonicalClientIds.has(definition.clientId), true, `${definition.id} must reference an existing Client`);
  }

  assert.equal(canonicalClientIds.has("illumihand"), true, "illumihand must remain a canonical Client");
  assert.equal(definitions.some(({ id }) => id === "illumihand"), false, "illumihand must not be auto-added to the logo wall");
});

test("canonical Client names own linked logo names without changing established presentation labels", async () => {
  const dataModule = await import("../src/data/clients.ts");
  const canonicalClients = new Map(clients.map((client) => [client.id, client]));

  for (const definition of dataModule.clientLogoDefinitions) {
    if (!definition.clientId) continue;
    const client = canonicalClients.get(definition.clientId);
    assert.ok(client, `${definition.id} must resolve its canonical Client`);
    assert.equal(definition.name, client.name, `${definition.id} must derive its name from canonical Client data`);
  }

  for (const [id, expectedLabel] of preservedPresentationLabels) {
    const logo = clientLogos.find((candidate) => candidate.id === id);
    assert.ok(logo, `${id} must remain visible in the current logo wall fixture`);
    assert.match(renderClientLogo(logo), new RegExp(`aria-label="${expectedLabel}"`));
  }
});

test("client logo presentation follows the current visibility registry", async () => {
  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));
  const expectedVisibleIds = visibility.filter(({ visible }) => visible).map(({ id }) => id);

  assert.deepEqual(clientLogos.map(({ id }) => id), expectedVisibleIds);
  assert.ok(clientLogos.every(({ visible }) => visible === true));
});

test("client logo adapter rejects missing, duplicate and unknown visibility identity", async () => {
  const dataModule = await import("../src/data/clients.ts");
  assert.equal(typeof dataModule.parseClientLogoVisibility, "function");

  const baseline = expectedIds.map((id) => ({ id, visible: true }));
  assert.throws(
    () => dataModule.parseClientLogoVisibility(baseline.slice(0, -1)),
    /missing required client logo id|visibility count/i,
  );
  assert.throws(
    () => dataModule.parseClientLogoVisibility([...baseline, { id: "kursovoy", visible: true }]),
    /duplicate client logo id/i,
  );
  assert.throws(
    () => dataModule.parseClientLogoVisibility(baseline.map((item, index) => index === 0 ? { ...item, id: "unknown" } : item)),
    /unexpected client logo id/i,
  );
});

test("client logo selection filters only logos whose CMS visibility is false", async () => {
  const dataModule = await import("../src/data/clients.ts");
  assert.equal(typeof dataModule.getVisibleClientLogos, "function");

  const fixture = expectedIds.map((id, index) => ({
    id,
    name: id,
    file: String(index + 1),
    visible: true,
  }));
  fixture[0].visible = false;

  assert.deepEqual(
    dataModule.getVisibleClientLogos(fixture).map(({ id }) => id),
    expectedIds.slice(1),
  );
});

test("homepage consumes a client-logo export that is filtered at the data boundary", async () => {
  const [clientDataSource, homeSource] = await Promise.all([
    readFile(clientDataUrl, "utf8"),
    readFile(homeSlotsUrl, "utf8"),
  ]);

  assert.match(clientDataSource, /export const clientLogos[\s\S]*?getVisibleClientLogos\(\)/);
  assert.match(homeSource, /const logos = clientLogos\.map\(renderClientLogo\)/);
});

test("Pages CMS exposes only client logo identity and visibility controls", async () => {
  const cmsConfig = await readFile(cmsConfigUrl, "utf8");
  const block = cmsConfig.match(/\n  - name: client-logo-visibility\b[\s\S]*?(?=\n  - name: [a-z0-9-]+\b)/)?.[0] ?? "";

  assert.match(block, /path: src\/content\/client-logo-visibility\.json/);
  assert.match(block, /- name: id\b[\s\S]*?readonly: true/);
  assert.match(block, /- name: visible\b[\s\S]*?type: boolean/);
  assert.doesNotMatch(block, /- name: (name|file|alt|src|href|route|className|clientId)\b/);
});
