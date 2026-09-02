import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { projects } from "../src/data/catalog/projects/index.ts";
import { clientLogoDefinitions } from "../src/data/clients.ts";
import {
  mediaCatalogDeliverables,
  mediaCatalogProjectTypes,
  mediaCatalogWorkAreas,
} from "../src/data/taxonomy/media-taxonomy.ts";

const cmsPath = fileURLToPath(new URL("../.pages.yml", import.meta.url));
const clientLogoVisibilityPath = fileURLToPath(
  new URL("../src/content/client-logo-visibility.json", import.meta.url),
);
const checkOnly = process.argv.includes("--check");

const escapeYamlLabel = (value) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
const unescapeYamlLabel = (value) => value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");

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

function existingLabels(componentBlock) {
  const labels = new Map();
  const optionPattern = /^\s*- \{ name: ([^,}]+), label: "((?:\\.|[^"\\])*)" \}$/gm;

  for (const match of componentBlock.matchAll(optionPattern)) {
    labels.set(match[1], unescapeYamlLabel(match[2]));
  }

  return labels;
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
    const currentBlock = output.match(pattern)?.[0];

    if (!currentBlock) {
      throw new Error(`Missing generated CMS component block: ${component.name}`);
    }

    const labels = existingLabels(currentBlock);
    const values = component.values.map(({ id, label }) => ({
      id,
      label: labels.get(id) ?? label,
    }));
    const rendered = `${renderComponent(component.name, values)}\n\n`;
    output = output.replace(pattern, rendered);
  }

  return output;
}

export function renderClientLogoEditorMetadata(source) {
  const records = JSON.parse(source);
  if (!Array.isArray(records)) {
    throw new Error("client logo visibility content must be an array");
  }

  const visibleById = new Map(
    records.map((record) => [record?.id, record?.visible]),
  );

  const generated = clientLogoDefinitions.map(({ id, name, file }) => {
    const visible = visibleById.get(id);
    if (typeof visible !== "boolean") {
      throw new Error(`Missing authored client logo visibility for ${id}`);
    }

    return {
      id,
      name,
      previewSrc: `/media/clients/logo-wall/client-logo-${file}.webp`,
      visible,
    };
  });

  return `${JSON.stringify(generated, null, 2)}\n`;
}

const [cmsSource, clientLogoVisibilitySource] = await Promise.all([
  readFile(cmsPath, "utf8"),
  readFile(clientLogoVisibilityPath, "utf8"),
]);
const generatedCms = renderPagesCmsGeneratedOptions(cmsSource);
const generatedClientLogoVisibility = renderClientLogoEditorMetadata(clientLogoVisibilitySource);

if (checkOnly) {
  let stale = false;

  if (generatedCms !== cmsSource) {
    console.error(".pages.yml canonical option blocks are stale. Run npm run cms:generate.");
    stale = true;
  }
  if (generatedClientLogoVisibility !== clientLogoVisibilitySource) {
    console.error("Client logo editor metadata is stale. Run npm run cms:generate.");
    stale = true;
  }

  if (stale) process.exitCode = 1;
} else {
  if (generatedCms !== cmsSource) {
    await writeFile(cmsPath, generatedCms, "utf8");
    console.log("Updated canonical option blocks in .pages.yml");
  }
  if (generatedClientLogoVisibility !== clientLogoVisibilitySource) {
    await writeFile(clientLogoVisibilityPath, generatedClientLogoVisibility, "utf8");
    console.log("Updated client logo editor metadata");
  }
}
