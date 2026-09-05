import assert from "node:assert/strict";
import test from "node:test";

import { cases } from "../src/data/catalog/cases.ts";
import { clients } from "../src/data/catalog/clients.ts";
import { collections } from "../src/data/catalog/collections.ts";
import { engagements } from "../src/data/catalog/engagements.ts";
import { projects } from "../src/data/catalog/projects/index.ts";

const expectedIdentitySets = {
  Case: [
    "jestei-pool",
    "styx",
    "sensetique",
  ],
  Collection: [
    "music-photography",
    "fashion-photography",
    "product-photography",
    "interfaces",
    "design",
    "production",
    "scanography",
    "motion",
    "logos",
    "pet-projects",
  ],
  Engagement: [
    "jestei-pool-2024-2026",
    "styx-jewel-2021-2025",
    "sensetique-2016-2018",
    "lyve-moscow-2025",
    "berry-agency-2020",
    "s-and-s-2018-2019",
    "mad-cow-films-2019",
    "li-ne-agency-2017",
    "progress-tradition-2013-2015",
    "moskovskie-novosti-2012",
  ],
  Project: [
    "jestei-brand-system",
    "jestei-core-interface",
    "jestei-event",
    "jestei-track-filter",
    "jestei-landings",
    "jestei-playlist-system",
    "jestei-subscription",
    "jestei-editorial-policy",
    "jestei-promo-communication",
    "styx-brand-system",
    "styx-ecommerce-site",
    "styx-packaging-2024",
    "styx-panoramic-catalog-2021",
    "styx-print-materials-2023",
    "styx-social-instructions",
    "styx-evident-things-collaboration-2022",
    "styx-lookbook-2023",
    "styx-lookbook-2024",
    "styx-lookbook-2025",
    "styx-founder-portraits-2022",
    "styx-jacket-lookbook",
    "styx-mystery-chest-animation-2024",
    "styx-gift-sculpture-animation-2025",
    "styx-apocriphon-scanography-2022",
    "styx-scanographic-campaign-2022",
    "sensetique-harsh-light-2018",
    "sensetique-young-pioneer-kaltblut",
    "sensetique-krasota-dress-lookbook",
    "sensetique-olovo-campaign",
    "sensetique-olovo-lookbook-2016",
    "sensetique-olovo-lookbook-2017",
    "sensetique-olovo-lookbook-2018",
    "sensetique-inna-honour-lookbook",
    "sensetique-buro-24-7-special",
    "sensetique-olovo-brandbook-architecture",
    "sensetique-olovo-booklet-design",
    "sensetique-digital-fear-of-love",
    "sensetique-chapurin-editorial-2018",
    "sensetique-wood-metal-panic",
    "sensetique-editorial-daniil-korotechenkov",
    "sensetique-editorial-tatiana-nikishina",
    "sensetique-editorial-katya-knyazeva",
    "sensetique-editorial-yuri-ivanov",
    "sensetique-editorial-ivan-krushinski",
    "sensetique-editorial-andrey-raputo-01",
    "sensetique-editorial-andrey-raputo-02",
    "shootings-obladaet",
    "shootings-evasha",
    "shootings-igguana",
    "shootings-esmi",
    "shootings-hypression",
    "shootings-ofelia",
    "shootings-berry-model-tests",
    "shootings-berry-editorial",
    "shootings-berry-lookbook",
    "shootings-berry-product",
    "shootings-behance-ecobasik",
    "shootings-behance-offmi",
    "shootings-behance-cinema-stills-2",
    "shootings-behance-anka-model-tests",
    "shootings-behance-choose-your-character",
    "shootings-behance-editorial-photography",
    "berry-social-content-2020",
    "s-and-s-first-lookbook",
    "s-and-s-catalog-content",
    "awful-cases",
    "moves-awful",
    "berserk-timer",
  ],
  Client: [
    "kursovoy",
    "players-club",
    "jestei-pool",
    "lyve-moscow",
    "styx-jewel",
    "illumihand",
    "vk-music",
    "48-jewelry",
    "second-friends-store",
    "li-ne-agency",
    "moch-fashn",
    "mad-cow-films",
    "moskovskie-novosti",
    "progress-tradition",
    "puma",
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
    "affa-media",
    "vinne",
    "olovo-moscow",
    "sergei-soroka",
    "theater-o",
    "obladaet",
    "igguana",
    "esmi",
    "hypression",
    "ofelia",
    "krasota-dress",
    "mimi-moscow",
    "berry-agency",
    "institute-linguistics-ras",
    "ria-novosti",
    "gac-motors",
    "vanish",
    "detsky-mir",
    "h-and-m",
    "chapurin",
    "evident-things",
  ],
};

const catalogs = {
  Case: cases,
  Collection: collections,
  Engagement: engagements,
  Project: projects,
  Client: clients,
};

for (const [entityName, expectedIds] of Object.entries(expectedIdentitySets)) {
  test(`${entityName} canonical identity set stays fixed during architecture migration`, () => {
    const actualIds = catalogs[entityName].map(({ id }) => id);
    assert.deepEqual(
      new Set(actualIds),
      new Set(expectedIds),
      `${entityName} canonical identity set changed; migrate identity intentionally instead of renaming it incidentally`,
    );
  });
}

test("Jestei Pool and Jestei Event human-readable names stay exact", () => {
  const client = clients.find(({ id }) => id === "jestei-pool");
  assert.ok(client, "Jestei Pool client must exist");
  assert.equal(client.name, "Jestei Pool");

  const eventProject = projects.find(({ id }) => id === "jestei-event");
  assert.ok(eventProject, "Jestei Event project must exist");
  assert.equal(eventProject.name, "Jestei Event");
});
