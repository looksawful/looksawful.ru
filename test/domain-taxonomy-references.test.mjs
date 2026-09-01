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
