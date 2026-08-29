import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { clientLogos } from "../src/data/clients.ts";

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

test("client logo visibility registry keeps fixed identity while booleans remain editable", async () => {
  assert.equal(existsSync(fileURLToPath(visibilityUrl)), true, "client logo visibility content must exist");
  const visibility = JSON.parse(await readFile(visibilityUrl, "utf8"));

  assert.deepEqual(visibility.map(({ id }) => id), expectedIds);
  assert.ok(visibility.every(({ visible }) => typeof visible === "boolean"));
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
  assert.doesNotMatch(block, /- name: (name|file|alt|src|href|route|className)\b/);
});
