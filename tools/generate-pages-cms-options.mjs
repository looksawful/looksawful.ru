import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { projects } from "../src/data/catalog/projects/index.ts";
import {
  mediaCatalogDeliverables,
  mediaCatalogProjectTypes,
  mediaCatalogWorkAreas,
} from "../src/data/taxonomy/media-taxonomy.ts";

const cmsPath = fileURLToPath(new URL("../.pages.yml", import.meta.url));
const checkOnly = process.argv.includes("--check");

const escapeYamlLabel = (value) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

function renderComponent(name, values) {
  return [
    `  ${name}:`,
    "    type: select",
    "    options:",
    "      multiple: true",
    "      values:",
    ...values.map(({ id, label }) => `        - { name: ${id}, label: "${escapeYamlLabel(label)}" }`),
  ].join("\n");
}

const generatedComponents = [
  {
    name: "media-catalog-project-ids",
    values: projects.map((project) => ({ id: project.id, label: project.name })),
  },
  {
    name: "media-catalog-work-area-ids",
    values: mediaCatalogWorkAreas.map((item) => ({ id: item.id, label: item.name })),
  },
  {
    name: "media-catalog-project-type-ids",
    values: mediaCatalogProjectTypes.map((item) => ({ id: item.id, label: item.name })),
  },
  {
    name: "media-catalog-deliverable-ids",
    values: mediaCatalogDeliverables.map((item) => ({ id: item.id, label: item.name })),
  },
];

export function renderPagesCmsGeneratedOptions(source) {
  let output = source;

  for (let index = 0; index < generatedComponents.length; index += 1) {
    const component = generatedComponents[index];
    const next = generatedComponents[index + 1]?.name;
    const boundary = next ? `  ${next}:` : "media:";
    const pattern = new RegExp(
      `^  ${component.name}:\\n[\\s\\S]*?(?=^${boundary.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`,
      "m",
    );
    const rendered = `${renderComponent(component.name, component.values)}\n\n`;

    if (!pattern.test(output)) {
      throw new Error(`Missing generated CMS component block: ${component.name}`);
    }
    output = output.replace(pattern, rendered);
  }

  return output;
}

const source = await readFile(cmsPath, "utf8");
const generated = renderPagesCmsGeneratedOptions(source);

if (checkOnly) {
  if (generated !== source) {
    console.error(".pages.yml canonical option blocks are stale. Run npm run cms:generate.");
    process.exitCode = 1;
  }
} else if (generated !== source) {
  await writeFile(cmsPath, generated, "utf8");
  console.log("Updated canonical option blocks in .pages.yml");
}
