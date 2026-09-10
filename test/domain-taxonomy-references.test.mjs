import assert from "node:assert/strict";
import test from "node:test";

import { cases } from "../src/data/catalog/cases.ts";
import { clients } from "../src/data/catalog/clients.ts";
import { collections } from "../src/data/catalog/collections.ts";
import { engagements } from "../src/data/catalog/engagements.ts";
import { projects } from "../src/data/catalog/projects/index.ts";
import { deliverables } from "../src/data/taxonomy/deliverables.ts";
import { engagementTypes } from "../src/data/taxonomy/engagement-types.ts";
import { industries } from "../src/data/taxonomy/industries.ts";
import { professionalQualities } from "../src/data/taxonomy/professional-qualities.ts";
import { projectTypes } from "../src/data/taxonomy/project-types.ts";
import { services } from "../src/data/taxonomy/services.ts";
import { skills } from "../src/data/taxonomy/skills.ts";
import { software } from "../src/data/taxonomy/software.ts";
import { technologies } from "../src/data/taxonomy/technologies.ts";
import { workAreas } from "../src/data/taxonomy/work-areas.ts";

const idSet = (items) => new Set(items.map(({ id }) => id));

const taxonomyIds = {
  deliverableIds: idSet(deliverables),
  engagementTypeIds: idSet(engagementTypes),
  industryIds: idSet(industries),
  professionalQualityIds: idSet(professionalQualities),
  projectTypeIds: idSet(projectTypes),
  serviceIds: idSet(services),
  skillIds: idSet(skills),
  softwareIds: idSet(software),
  technologyIds: idSet(technologies),
  workAreaIds: idSet(workAreas),
};

function assertTaxonomyReferences(entityName, records, fields) {
  for (const record of records) {
    for (const field of fields) {
      for (const value of record[field] ?? []) {
        assert.ok(
          taxonomyIds[field].has(value),
          `${entityName}(${record.id}).${field}: unknown taxonomy id "${value}"`,
        );
      }
    }
  }
}

test("catalog taxonomy references remain closed after domain dependency normalization", () => {
  assertTaxonomyReferences("Case", cases, ["engagementTypeIds", "industryIds"]);
  assertTaxonomyReferences("Client", clients, ["industryIds"]);
  assertTaxonomyReferences("Collection", collections, ["workAreaIds"]);
  assertTaxonomyReferences("Engagement", engagements, ["engagementTypeIds", "industryIds", "workAreaIds"]);
  assertTaxonomyReferences("Project", projects, [
    "projectTypeIds",
    "engagementTypeIds",
    "industryIds",
    "workAreaIds",
    "serviceIds",
    "deliverableIds",
    "skillIds",
    "technologyIds",
    "softwareIds",
    "professionalQualityIds",
  ]);
});

test("Public Catalog exposes one compact closed direction layer", async () => {
  const {
    catalogDirections,
    catalogDirectionIdsForTaxonomy,
    getPublicCatalogItems,
  } = await import("../src/data/media/public-catalog.ts");

  assert.deepEqual(
    catalogDirections.map(({ id }) => id),
    ["photo", "production", "graphic", "identity", "illustration", "motion", "3d", "product"],
  );
  assert.equal(typeof getPublicCatalogItems, "function");

  assert.deepEqual(
    catalogDirectionIdsForTaxonomy({
      workAreaIds: ["photography", "art-direction"],
      projectTypeIds: ["identity-project", "3d-animation"],
      deliverableIds: ["screen-mockup", "music-cover"],
    }),
    ["photo", "graphic", "identity", "motion", "3d", "product"],
  );

  assert.throws(
    () => catalogDirectionIdsForTaxonomy({
      workAreaIds: ["invented-area"],
      projectTypeIds: [],
      deliverableIds: [],
    }),
    /unknown work area/i,
  );
});

test("Public Catalog visibility is explicit and reusable stays independent", async () => {
  const { getPublicCatalogItems } = await import("../src/data/media/public-catalog.ts");

  const base = {
    origin: "registered",
    asset: {
      id: "public-a",
      type: "image",
      src: "/a.webp",
      width: 1200,
      height: 800,
      rating: 4,
    },
    title: "Public work",
    alt: "Public work preview",
    description: "Case explanation must not leak into Gallery",
    date: "2024–2025",
    projectIds: ["jestei-brand-system"],
    workAreaIds: ["photography"],
    projectTypeIds: ["identity-project"],
    deliverableIds: ["screen-mockup"],
    tags: ["editorial"],
    credits: ["Photo: A"],
    showInCatalog: true,
    reusable: false,
    archived: false,
  };

  const hidden = {
    ...base,
    asset: { ...base.asset, id: "hidden-a" },
    showInCatalog: false,
  };
  const archived = {
    ...base,
    asset: { ...base.asset, id: "archived-a" },
    archived: true,
  };

  const result = getPublicCatalogItems([base, hidden, archived]);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "public-a");
  assert.deepEqual(result[0].directions, ["photo", "identity", "product"]);
  assert.deepEqual(result[0].projectIds, ["jestei-brand-system"]);
  assert.deepEqual(result[0].tags, ["editorial"]);
  assert.deepEqual(result[0].credits, ["Photo: A"]);
  assert.equal(result[0].year, 2024);
  assert.equal(result[0].width, 1200);
  assert.equal(result[0].height, 800);
  assert.equal(result[0].aspectRatio, 1.5);
  assert.equal(result[0].rating, 4);
  assert.equal("description" in result[0], false);
});
