import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = path.join(ROOT, "index.html");

const REQUIRED_SECTION_IDS = [
  "hero",
  "jestei-cover",
  "jestei-results",
  "jestei-words",
  "jestei-logo",
  "jestei-color",
  "jestei-audience-map",
  "jestei-tariffs",
  "jestei-filter",
  "jestei-event-nav",
  "jestei-interface",
  "jestei-graphics",
  "styx-cover",
  "styx-graphics",
  "styx-packaging",
  "styx-communications",
  "styx-print",
  "styx-photo-art",
  "styx-scanography",
  "shootings",
  "pet-projects",
  "resume",
  "contacts",
];

const FORBIDDEN_SNIPPETS = [
  "hero-only-mode.css",
  "hero-only-inline-mode",
  "data-hero-only-mode",
  "homepage-publication.js",
  "prepareHomepagePublication",
];

function collectDuplicateIds(html) {
  const ids = [...html.matchAll(/\bid=(["'])(?<id>[^"']+)\1/giu)].map(
    (match) => match.groups.id,
  );
  const seen = new Set();
  const duplicates = new Set();

  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

function collectTopLevelSections(html) {
  const mainStart = html.search(/<main\b[^>]*\bid=(["'])main\1[^>]*>/iu);
  if (mainStart < 0) return [];

  const mainStartEnd = html.indexOf(">", mainStart) + 1;
  const mainEnd = html.lastIndexOf("</main>");
  const mainBody = html.slice(mainStartEnd, mainEnd);
  const sections = [];
  const tagRe = /<\/?section\b[^>]*>/giu;
  let depth = 0;
  let match;

  while ((match = tagRe.exec(mainBody))) {
    if (match[0].startsWith("</")) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (depth === 0) {
      const id = match[0].match(/\bid=(["'])(?<id>[^"']+)\1/iu)?.groups?.id;
      if (id) sections.push(id);
    }

    depth += 1;
  }

  return sections;
}

async function main() {
  const html = await readFile(INDEX_PATH, "utf8");
  const failures = [];
  const duplicateIds = collectDuplicateIds(html);

  if (duplicateIds.length) {
    failures.push(`duplicate ids: ${duplicateIds.join(", ")}`);
  }

  for (const snippet of FORBIDDEN_SNIPPETS) {
    if (html.includes(snippet)) {
      failures.push(`forbidden index.html snippet: ${snippet}`);
    }
  }

  const topLevelSections = collectTopLevelSections(html);
  for (const id of REQUIRED_SECTION_IDS) {
    if (!topLevelSections.includes(id)) {
      failures.push(`missing top-level section: ${id}`);
    }
  }

  const missingOrder = REQUIRED_SECTION_IDS.filter((id) => !topLevelSections.includes(id));
  const observedOrder = topLevelSections.filter((id) => REQUIRED_SECTION_IDS.includes(id));
  if (!missingOrder.length && observedOrder.join("\n") !== REQUIRED_SECTION_IDS.join("\n")) {
    failures.push(
      `top-level section order changed:\nexpected ${REQUIRED_SECTION_IDS.join(" > ")}\nactual   ${observedOrder.join(" > ")}`,
    );
  }

  if (failures.length) {
    console.error(failures.join("\n\n"));
    process.exitCode = 1;
    return;
  }

  console.log(
    `HTML contract passed: ${topLevelSections.length} top-level sections, no duplicate ids`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
