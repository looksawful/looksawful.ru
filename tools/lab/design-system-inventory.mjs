import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  LOOKSAWFUL_STORY_LAYER_VALUES,
  LOOKSAWFUL_STORY_POLICY_VALUES,
  LOOKSAWFUL_VISIBILITY_VALUES,
} from "./storybook/state-schema.mjs";

const SOURCE_EXTENSIONS = new Set([".ts", ".js", ".mjs"]);
const STORY_SUFFIXES = [".stories.ts", ".stories.js", ".stories.mjs"];
const SOURCE_GROUPS = [
  ["src/components", "component"],
  ["src/templates", "template"],
  ["src/site/navigation", "navigation"],
  ["src/site/renderers", "renderer"],
  ["src/site/rendering", "rendering"],
  ["src/site/shell", "shell"],
  ["src/site/pages", "page"],
];
const SOURCE_CLASSIFICATIONS = Object.freeze({
  "src/site/pages/manifest.ts": {
    lifecycle: "infrastructure",
    storyPolicy: "no-story",
    reason: "route discovery registry, not a visual owner",
    denominatorEligible: false,
  },
  "src/site/rendering/html.ts": {
    lifecycle: "infrastructure",
    storyPolicy: "no-story",
    reason: "HTML slot/extraction utility, not a visual owner",
    denominatorEligible: false,
  },
});
const LAYERS = new Set(LOOKSAWFUL_STORY_LAYER_VALUES);
const POLICIES = new Set(LOOKSAWFUL_STORY_POLICY_VALUES);
const VISIBILITY = new Set(LOOKSAWFUL_VISIBILITY_VALUES);
const OVERALL_STATUSES = new Set(["missing", "partial", "covered", "composition-only", "page-only", "experimental", "exempt-no-story", "needs-classification"]);

function toPosix(value) { return value.split(path.sep).join("/"); }
async function collectFiles(root, relativeDirectory) {
  let entries;
  try { entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true }); }
  catch (error) { if (error?.code === "ENOENT") return []; throw error; }
  const files = [];
  for (const entry of entries) {
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(root, relative));
    else if (entry.isFile()) files.push(toPosix(relative));
  }
  return files.sort((a, b) => a.localeCompare(b));
}
function isRuntimeSource(file) { return SOURCE_EXTENSIONS.has(path.posix.extname(file)) && !file.endsWith(".d.ts"); }
async function checkDeclaredSource(root, sourcePath, uiSourcePaths) {
  let exists = false;
  try { exists = (await stat(path.join(root, sourcePath))).isFile(); }
  catch (error) { if (error?.code !== "ENOENT") throw error; }
  return { path: sourcePath, exists, role: !exists ? "missing" : uiSourcePaths.has(sourcePath) ? "ui-owner" : "supporting-source" };
}
function balancedObjects(text) {
  const objects = [], stack = [];
  let quote = null, escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") stack.push(index);
    if (char === "}" && stack.length) { const start = stack.pop(); objects.push(text.slice(start, index + 1)); }
  }
  return objects;
}
function fieldString(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \\t\\r\\n]*[\\\"'`]([^\\\"'`]*)[\\\"'`]");
  return text.match(pattern)?.[1] ?? null;
}
function fieldBoolean(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \\t\\r\\n]*(true|false)\\b");
  const value = text.match(pattern)?.[1];
  return value === "true" ? true : value === "false" ? false : null;
}
function fieldStringArray(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \\t\\r\\n]*\\[([\\s\\S]*?)\\]");
  const body = text.match(pattern)?.[1] ?? "";
  return [...body.matchAll(/[\"'`]([^\"'`]*)[\"'`]/g)].map((match) => match[1]);
}
function looksawfulBlock(text) { return balancedObjects(text).find((object) => /(?:^|[,\s])looksawful\s*:/.test(object)) ?? ""; }
function resolveImport(storyPath, specifier) { return specifier.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(storyPath), specifier)) : null; }
function parseStory(text, storyPath) {
  const importedSources = [];
  const importPattern = /\b(?:import|export)\s+(?:[^\"']*?\s+from\s+)?[\"']([^\"']+)[\"']/g;
  for (const match of text.matchAll(importPattern)) { const resolved = resolveImport(storyPath, match[1]); if (resolved) importedSources.push(resolved); }
  const looksawful = looksawfulBlock(text);
  const declaredSources = fieldStringArray(looksawful, "sources");
  const layer = fieldString(looksawful, "layer");
  const policy = fieldString(looksawful, "policy");
  const canonicalValue = fieldBoolean(looksawful, "canonical");
  const state = fieldString(looksawful, "state");
  const visibility = fieldStringArray(looksawful, "visibility");
  const interaction = fieldStringArray(looksawful, "interaction");
  const data = fieldStringArray(looksawful, "data");
  const motion = fieldStringArray(looksawful, "motion");
  const review = fieldStringArray(looksawful, "review");
  const conditions = fieldStringArray(looksawful, "conditions");
  const title = fieldString(text, "title");
  const experimental = canonicalValue === false || layer === "experimental" || policy === "experimental" || title?.startsWith("90 Experimental/");
  return {
    id: `story:${storyPath}`, path: storyPath, kind: "story", title,
    status: experimental ? "experimental" : canonicalValue === true ? "canonical" : "unclassified",
    declaredSources, importedSources: [...new Set(importedSources)].sort(),
    layer, policy, canonical: canonicalValue, state, visibility, interaction, data, motion,
    responsive: { review, conditions },
  };
}
function sourceClassification(sourcePath) {
  return SOURCE_CLASSIFICATIONS[sourcePath] ?? {
    lifecycle: "production", storyPolicy: null, reason: null, denominatorEligible: true,
  };
}
function sourceStatus(source, refs) {
  if (source.lifecycle === "experimental") return "experimental";
  if (!source.denominatorEligible || source.storyPolicy === "no-story") return "exempt-no-story";
  const canonical = refs.filter((ref) => ref.canonical === true);
  if (canonical.some((ref) => ref.evidence === "declared-source" && ref.policy === "page")) return "page-only";
  if (canonical.some((ref) => ref.evidence === "declared-source" && ref.policy === "composition")) return "composition-only";
  if (canonical.some((ref) => ref.evidence === "declared-source")) return "covered";
  if (refs.some((ref) => ref.canonical !== false)) return "partial";
  return "missing";
}
function storyRefsFor(sourcePath, stories) {
  const refs = [];
  for (const story of stories) {
    const declared = story.declaredSources.includes(sourcePath);
    const imported = story.importedSources.includes(sourcePath);
    if (!declared && !imported) continue;
    refs.push({ storyPath: story.path, evidence: declared ? "declared-source" : "import", confidence: declared ? "strong" : "medium", canonical: story.canonical, policy: story.policy });
  }
  return refs.sort((a, b) => a.storyPath.localeCompare(b.storyPath));
}
function layerFor(refs, stories) {
  for (const ref of refs) {
    if (ref.evidence !== "declared-source") continue;
    const story = stories.find((candidate) => candidate.path === ref.storyPath);
    if (story?.layer) return story.layer;
  }
  return null;
}
function stateCoverageFor(sourcePath, stories) {
  const relevant = stories.filter((story) => story.canonical === true && story.declaredSources.includes(sourcePath));
  return {
    states: [...new Set(relevant.map((story) => story.state).filter(Boolean))].sort(),
    visibility: [...new Set(relevant.flatMap((story) => story.visibility))].sort(),
    interaction: [...new Set(relevant.flatMap((story) => story.interaction))].sort(),
    data: [...new Set(relevant.flatMap((story) => story.data))].sort(),
    motion: [...new Set(relevant.flatMap((story) => story.motion))].sort(),
    reviewViewports: [...new Set(relevant.flatMap((story) => story.responsive.review))].sort(),
    responsiveConditions: [...new Set(relevant.flatMap((story) => story.responsive.conditions))].sort(),
  };
}
function parseRoutes(text) {
  const routes = [];
  for (const object of balancedObjects(text)) {
    const id = fieldString(object, "id");
    const routePath = fieldString(object, "path");
    if (!id || !routePath) continue;
    routes.push({ id, path: routePath, discovery: { listed: fieldBoolean(object, "listed") ?? true, indexable: fieldBoolean(object, "indexable") ?? true } });
  }
  return routes.sort((a, b) => a.id.localeCompare(b.id));
}
export function validateDesignSystemInventory(inventory) {
  const issues = [];
  const sourcePaths = new Set(inventory.sources.map((source) => source.path));
  const seenIds = new Set();
  for (const source of inventory.sources) {
    if (seenIds.has(source.id)) issues.push({ severity: "error", code: "duplicate-source-id", sourceId: source.id });
    seenIds.add(source.id);
    if (!OVERALL_STATUSES.has(source.overallStatus)) issues.push({ severity: "error", code: "unknown-overall-status", sourcePath: source.path, value: source.overallStatus });
    if (source.storyPolicy === "no-story" && source.denominatorEligible) issues.push({ severity: "error", code: "no-story-in-denominator", sourcePath: source.path });
  }
  for (const story of inventory.stories) {
    if (story.layer && !LAYERS.has(story.layer)) issues.push({ severity: "error", code: "unknown-layer", storyPath: story.path, value: story.layer });
    if (story.policy && !POLICIES.has(story.policy)) issues.push({ severity: "error", code: "unknown-policy", storyPath: story.path, value: story.policy });
    for (const visibility of story.visibility) if (!VISIBILITY.has(visibility)) issues.push({ severity: "error", code: "unknown-visibility", storyPath: story.path, value: visibility });
    for (const declaredSource of story.declaredSources) {
      const sourceCheck = story.declaredSourceChecks?.find((check) => check.path === declaredSource);
      const exists = sourceCheck ? sourceCheck.exists : sourcePaths.has(declaredSource);
      if (!exists) issues.push({ severity: "error", code: "declared-source-missing", storyPath: story.path, sourcePath: declaredSource });
    }
  }
  const routeIds = new Set();
  for (const route of inventory.routes) {
    if (routeIds.has(route.id)) issues.push({ severity: "error", code: "duplicate-route-id", routeId: route.id });
    routeIds.add(route.id);
  }
  return issues;
}
export async function collectDesignSystemInventory(root) {
  const [styleFiles, storyFiles, ...sourceGroups] = await Promise.all([
    collectFiles(root, "src/styles"), collectFiles(root, "src/lab/stories"), ...SOURCE_GROUPS.map(([directory]) => collectFiles(root, directory)),
  ]);
  const stories = await Promise.all(storyFiles.filter((file) => STORY_SUFFIXES.some((suffix) => file.endsWith(suffix))).map(async (file) => parseStory(await readFile(path.join(root, file), "utf8"), file)));
  const sourceRecords = [];
  for (let index = 0; index < SOURCE_GROUPS.length; index += 1) {
    const [, sourceKind] = SOURCE_GROUPS[index];
    for (const file of sourceGroups[index].filter(isRuntimeSource)) {
      if (sourceRecords.some((source) => source.path === file)) continue;
      const refs = storyRefsFor(file, stories);
      const classification = sourceClassification(file);
      const source = {
        id: `ui:${file}`, path: file, sourceKind,
        lifecycle: classification.lifecycle,
        storyPolicy: classification.storyPolicy,
        storyPolicyReason: classification.reason,
        denominatorEligible: classification.denominatorEligible,
        storyRefs: refs, layer: layerFor(refs, stories), routeRefs: [],
        stateCoverage: stateCoverageFor(file, stories),
      };
      source.overallStatus = sourceStatus(source, refs);
      sourceRecords.push(source);
    }
  }
  sourceRecords.sort((a, b) => a.path.localeCompare(b.path));
  const manifestPath = "src/site/pages/manifest.ts";
  const routes = (await collectFiles(root, "src/site/pages")).includes(manifestPath) ? parseRoutes(await readFile(path.join(root, manifestPath), "utf8")) : [];
  const uiSourcePaths = new Set(sourceRecords.map((source) => source.path));
  for (const story of stories) {
    story.declaredSourceChecks = await Promise.all(story.declaredSources.map((sourcePath) => checkDeclaredSource(root, sourcePath, uiSourcePaths)));
  }
  const structuralIssues = validateDesignSystemInventory({ sources: sourceRecords, stories, routes });
  const denominatorSources = sourceRecords.filter((source) => source.denominatorEligible);
  const coverageSummary = {
    denominator: denominatorSources.length,
    discoveredUiSources: sourceRecords.length,
    covered: denominatorSources.filter((source) => source.overallStatus === "covered").length,
    partial: denominatorSources.filter((source) => source.overallStatus === "partial").length,
    missing: denominatorSources.filter((source) => source.overallStatus === "missing").length,
    compositionOnly: denominatorSources.filter((source) => source.overallStatus === "composition-only").length,
    pageOnly: denominatorSources.filter((source) => source.overallStatus === "page-only").length,
    excludedNoStory: sourceRecords.filter((source) => source.overallStatus === "exempt-no-story").length,
  };
  return {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    methodology: {
      denominator: "production UI owners from audited src/components, src/templates and src/site roots, excluding explicit no-story infrastructure classifications",
      strongEvidence: "parameters.looksawful.sources on canonical stories",
      weakEvidence: "direct story import; useful for discovery but never sufficient for covered status",
      stateEvidence: "canonical declared-source story metadata only",
      routeDiscovery: "listed/indexable are reported independently from visual visibility",
    },
    coverageSummary,
    sourceGroups: SOURCE_GROUPS.map(([directory, sourceKind]) => ({ directory, sourceKind })),
    sources: sourceRecords,
    stories: stories.sort((a, b) => a.path.localeCompare(b.path)),
    routes,
    styles: styleFiles,
    structuralIssues,
  };
}
function renderInventoryHtml(inventory) {
  const rows = inventory.sources.map((source) => `<tr><td><code>${source.path}</code></td><td>${source.sourceKind}</td><td>${source.lifecycle}</td><td>${source.storyPolicy ?? "story"}</td><td>${source.denominatorEligible ? "yes" : "no"}</td><td>${source.overallStatus}</td><td>${source.stateCoverage.states.join(", ") || "—"}</td><td>${source.stateCoverage.visibility.join(", ") || "—"}</td><td>${source.stateCoverage.interaction.join(", ") || "—"}</td><td>${source.stateCoverage.data.join(", ") || "—"}</td><td>${source.stateCoverage.motion.join(", ") || "—"}</td><td>${source.stateCoverage.reviewViewports.join(", ") || "—"}</td><td>${source.storyRefs.map((ref) => `<code>${ref.storyPath}</code> <small>${ref.evidence}/${ref.canonical === true ? "canonical" : ref.canonical === false ? "experimental" : "unclassified"}</small>`).join("<br>") || "—"}</td></tr>`).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Storybook inventory</title><style>body{font:14px/1.45 system-ui,sans-serif;margin:2rem;color:#161616}table{border-collapse:collapse;width:100%}th,td{padding:.5rem;border:1px solid #ddd;text-align:left;vertical-align:top}th{background:#f6f6f6;position:sticky;top:0}code{font-size:12px}.summary{display:flex;gap:1.25rem;flex-wrap:wrap;margin:1rem 0}.summary strong{font-size:18px;display:block}</style></head><body><h1>Storybook coverage inventory</h1><p>Generated ${inventory.generatedAt}. Coverage denominator: audited production UI owners only; explicit <code>no-story</code> infrastructure is excluded.</p><div class="summary"><span><strong>${inventory.coverageSummary.denominator}</strong>denominator</span><span><strong>${inventory.coverageSummary.covered}</strong>covered</span><span><strong>${inventory.coverageSummary.partial}</strong>partial</span><span><strong>${inventory.coverageSummary.missing}</strong>missing</span><span><strong>${inventory.coverageSummary.excludedNoStory}</strong>no-story excluded</span></div><table><thead><tr><th>Source</th><th>Kind</th><th>Lifecycle</th><th>Policy</th><th>Denominator</th><th>Status</th><th>States</th><th>Visibility</th><th>Interaction</th><th>Data</th><th>Motion</th><th>Viewports</th><th>Evidence</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
async function main() {
  const root = process.cwd();
  const outputRoot = path.join(root, "dist-lab", "lab");
  const inventory = await collectDesignSystemInventory(root);
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "system-inventory.json"), JSON.stringify(inventory, null, 2) + "\n", "utf8");
  await mkdir(path.join(outputRoot, "system"), { recursive: true });
  await writeFile(path.join(outputRoot, "system", "inventory.html"), renderInventoryHtml(inventory), "utf8");
  console.log(`[lab-inventory] ${inventory.coverageSummary.denominator} denominator sources, ${inventory.coverageSummary.discoveredUiSources} discovered UI sources, ${inventory.stories.length} stories, ${inventory.structuralIssues.filter((issue) => issue.severity === "error").length} structural errors`);
  console.log(`[lab-inventory] covered ${inventory.coverageSummary.covered}, partial ${inventory.coverageSummary.partial}, missing ${inventory.coverageSummary.missing}, no-story excluded ${inventory.coverageSummary.excludedNoStory}`);
  if (inventory.structuralIssues.some((issue) => issue.severity === "error")) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
