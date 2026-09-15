import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
const LAYERS = new Set(LOOKSAWFUL_STORY_LAYER_VALUES);
const POLICIES = new Set(LOOKSAWFUL_STORY_POLICY_VALUES);
const VISIBILITY = new Set(LOOKSAWFUL_VISIBILITY_VALUES);
const OVERALL_STATUSES = new Set(["missing", "partial", "covered", "composition-only", "page-only", "experimental", "exempt-no-story", "needs-classification"]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function collectFiles(root, relativeDirectory) {
  let entries;
  try {
    entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, relative));
    } else if (entry.isFile()) {
      files.push(toPosix(relative));
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function isRuntimeSource(file) {
  return SOURCE_EXTENSIONS.has(path.posix.extname(file)) && !file.endsWith(".d.ts");
}

async function checkDeclaredSource(root, sourcePath, uiSourcePaths) {
  let exists = false;
  try {
    exists = (await stat(path.join(root, sourcePath))).isFile();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return {
    path: sourcePath,
    exists,
    role: !exists ? "missing" : uiSourcePaths.has(sourcePath) ? "ui-owner" : "supporting-source",
  };
}

function balancedObjects(text) {
  const objects = [];
  const stack = [];
  let quote = null;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'" || char === "\`") { quote = char; continue; }
    if (char === "{") stack.push(index);
    if (char === "}" && stack.length) {
      const start = stack.pop();
      objects.push(text.slice(start, index + 1));
    }
  }
  return objects;
}
function fieldString(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \t\r\n]*[\"'\`]([^\"'\`]*)[\"'\`]");
  return text.match(pattern)?.[1] ?? null;
}
function fieldBoolean(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \t\r\n]*(true|false)\\b");
  const value = text.match(pattern)?.[1];
  return value === "true" ? true : value === "false" ? false : null;
}
function fieldStringArray(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \t\r\n]*\\[([\\s\\S]*?)\\]");
  const body = text.match(pattern)?.[1] ?? "";
  return [...body.matchAll(/[\"'\`]([^\"'\`]*)[\"'\`]/g)].map((match) => match[1]);
}
function fieldObjectBody(text, name) {
  const pattern = new RegExp("(?:^|[,\\s])" + name + "\\s*:[ \t\r\n]*\\{([\\s\\S]*?)\\}");
  return text.match(pattern)?.[1] ?? null;
}
function looksawfulBlock(text) {
  return balancedObjects(text).find((object) => /(?:^|[,\s])looksawful\s*:/.test(object)) ?? "";
}

function resolveImport(storyPath, specifier) {
  if (!specifier.startsWith(".")) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(storyPath), specifier));
}

function parseStory(text, storyPath) {
  const importedSources = [];
  const importPattern = /\b(?:import|export)\s+(?:[^\"']*?\s+from\s+)?[\"']([^\"']+)[\"']/g;
  for (const match of text.matchAll(importPattern)) {
    const resolved = resolveImport(storyPath, match[1]);
    if (resolved) importedSources.push(resolved);
  }
  const looksawful = looksawfulBlock(text);
  const declaredSources = fieldStringArray(looksawful, "sources");
  const layer = fieldString(looksawful, "layer");
  const policy = fieldString(looksawful, "policy");
  const canonicalValue = fieldBoolean(looksawful, "canonical");
  const state = fieldString(looksawful, "state");
  const visibility = fieldStringArray(looksawful, "visibility");
  const routeDiscoveryBody = fieldObjectBody(looksawful, "routeDiscovery");
  const routeDiscovery = routeDiscoveryBody === null ? null : {
    listed: fieldBoolean(routeDiscoveryBody, "listed"),
    indexable: fieldBoolean(routeDiscoveryBody, "indexable"),
  };
  const title = fieldString(text, "title");
  const experimental = canonicalValue === false || layer === "experimental" || policy === "experimental" || title?.startsWith("90 Experimental/");
  return {
    id: `story:${storyPath}`, path: storyPath, kind: "story", title,
    status: experimental ? "experimental" : canonicalValue === true ? "canonical" : "unclassified",
    declaredSources, importedSources: [...new Set(importedSources)].sort(),
    layer, policy, canonical: canonicalValue, state, visibility, routeDiscovery,
  };
}

const NO_STORY_INFRASTRUCTURE = new Set([
  "src/components/caption-trust.ts",
  "src/components/composition/index.ts",
  "src/components/content/index.ts",
  "src/components/deferred-video-source.ts",
  "src/components/gallery/gallery-entry.ts",
  "src/components/gallery/gallery-state.ts",
  "src/components/media-runtime-health.ts",
  "src/components/motion-preference.ts",
  "src/components/runtime/index.ts",
  "src/components/specialized/index.ts",
  "src/site/navigation/model.ts",
  "src/site/navigation/primary.ts",
  "src/site/pages/content-validation.ts",
  "src/site/pages/entity-presentation.ts",
  "src/site/pages/homepage.ts",
  "src/site/pages/manifest.ts",
  "src/site/pages/search-presentation.ts",
  "src/site/pages/types.ts",
  "src/site/pages/validation.ts",
  "src/site/renderers/cv-page.ts",
  "src/site/renderers/home/home-image-deferral.ts",
  "src/site/renderers/home/home-media-deferral.ts",
  "src/site/rendering/html.ts",
  "src/site/shell/metadata.ts",
]);

function sourceLifecycle(sourcePath) {
  return NO_STORY_INFRASTRUCTURE.has(sourcePath) ? "infrastructure" : "production";
}

function sourceStatus(source, refs) {
  if (source.lifecycle === "experimental") return "experimental";
  if (source.lifecycle === "infrastructure") return "exempt-no-story";
  const canonical = refs.filter((ref) => ref.canonical === true);
  if (canonical.some((ref) => ref.evidence === "declared-source" && ref.policy === "page")) {
    return "page-only";
  }
  if (canonical.some((ref) => ref.evidence === "declared-source" && ref.policy === "composition")) {
    return "composition-only";
  }
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
    refs.push({
      storyPath: story.path,
      evidence: declared ? "declared-source" : "import",
      confidence: declared ? "strong" : "medium",
      canonical: story.canonical,
      policy: story.policy,
    });
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

function parseRoutes(text) {
  const routes = [];
  for (const object of balancedObjects(text)) {
    const id = fieldString(object, "id");
    const routePath = fieldString(object, "path");
    if (!id || !routePath) continue;
    routes.push({
      id,
      path: routePath,
      discovery: {
        listed: fieldBoolean(object, "listed") ?? true,
        indexable: fieldBoolean(object, "indexable") ?? true,
      },
    });
  }
  return routes.sort((a, b) => a.id.localeCompare(b.id));
}

export function validateDesignSystemInventory(inventory) {
  const issues = [];
  const sourcePaths = new Set(inventory.sources.map((source) => source.path));
  const seenIds = new Set();

  for (const source of inventory.sources) {
    if (seenIds.has(source.id)) {
      issues.push({ severity: "error", code: "duplicate-source-id", sourceId: source.id });
    }
    seenIds.add(source.id);
    if (!OVERALL_STATUSES.has(source.overallStatus)) {
      issues.push({
        severity: "error",
        code: "unknown-overall-status",
        sourcePath: source.path,
        value: source.overallStatus,
      });
    }
  }

  for (const story of inventory.stories) {
    if (story.layer && !LAYERS.has(story.layer)) {
      issues.push({ severity: "error", code: "unknown-layer", storyPath: story.path, value: story.layer });
    }
    if (story.policy && !POLICIES.has(story.policy)) {
      issues.push({ severity: "error", code: "unknown-policy", storyPath: story.path, value: story.policy });
    }
    for (const visibility of story.visibility) {
      if (!VISIBILITY.has(visibility)) {
        issues.push({ severity: "error", code: "unknown-visibility", storyPath: story.path, value: visibility });
      }
    }
    for (const declaredSource of story.declaredSources) {
      const sourceCheck = story.declaredSourceChecks?.find((check) => check.path === declaredSource);
      const exists = sourceCheck ? sourceCheck.exists : sourcePaths.has(declaredSource);
      if (!exists) {
        issues.push({
          severity: "error",
          code: "declared-source-missing",
          storyPath: story.path,
          sourcePath: declaredSource,
        });
      }
    }
  }

  const routeIds = new Set();
  for (const route of inventory.routes) {
    if (routeIds.has(route.id)) {
      issues.push({ severity: "error", code: "duplicate-route-id", routeId: route.id });
    }
    routeIds.add(route.id);
  }
  return issues;
}

export async function collectDesignSystemInventory(root) {
  const [styleFiles, storyFiles, ...sourceGroups] = await Promise.all([
    collectFiles(root, "src/styles"),
    collectFiles(root, "src/lab/stories"),
    ...SOURCE_GROUPS.map(([directory]) => collectFiles(root, directory)),
  ]);

  const stories = await Promise.all(storyFiles
    .filter((file) => STORY_SUFFIXES.some((suffix) => file.endsWith(suffix)))
    .map(async (file) => parseStory(await readFile(path.join(root, file), "utf8"), file)));

  const sourceRecords = [];
  for (let index = 0; index < SOURCE_GROUPS.length; index += 1) {
    const [, sourceKind] = SOURCE_GROUPS[index];
    for (const file of sourceGroups[index].filter(isRuntimeSource)) {
      if (sourceRecords.some((source) => source.path === file)) continue;
      const refs = storyRefsFor(file, stories);
      const lifecycle = sourceLifecycle(file);
      const source = {
        id: `ui:${file}`,
        path: file,
        sourceKind,
        lifecycle,
        storyPolicy: lifecycle === "infrastructure" ? "no-story" : null,
        storyRefs: refs,
        layer: layerFor(refs, stories),
        routeRefs: [],
        stateCoverage: { states: [], visibility: [] },
      };
      source.overallStatus = sourceStatus(source, refs);
      sourceRecords.push(source);
    }
  }
  sourceRecords.sort((a, b) => a.path.localeCompare(b.path));

  const uiSourcePaths = new Set(sourceRecords.filter((source) => source.lifecycle === "production").map((source) => source.path));
  for (const story of stories) {
    story.declaredSourceChecks = await Promise.all(
      story.declaredSources.map((sourcePath) => checkDeclaredSource(root, sourcePath, uiSourcePaths)),
    );
  }

  const manifestPath = "src/site/pages/manifest.ts";
  let routes = [];
  try {
    routes = parseRoutes(await readFile(path.join(root, manifestPath), "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const styles = styleFiles
    .filter((file) => file.endsWith(".css"))
    .map((file) => ({ path: file, kind: "style" }));

  const inventory = {
    schemaVersion: 2,
    generatedAt: null,
    sources: sourceRecords,
    components: sourceRecords.filter((source) => source.sourceKind === "component"),
    templates: sourceRecords.filter((source) => source.sourceKind === "template"),
    styles,
    stories: stories.sort((a, b) => a.path.localeCompare(b.path)),
    routes,
  };
  inventory.structuralIssues = validateDesignSystemInventory(inventory);
  return inventory;
}

function inventoryPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>looksawful Storybook inventory</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #0b0b0b; color: #f3f3f3; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; }
    main { width: min(1280px, 100%); margin: auto; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 28px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 56px); letter-spacing: -.04em; }
    a { color: inherit; }
    .counts, .filters { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 18px; }
    .count, button { border: 1px solid #303030; border-radius: 999px; padding: 7px 10px; font: inherit; font-size: 12px; background: transparent; color: inherit; }
    button[aria-pressed="true"] { background: #f3f3f3; color: #0b0b0b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #252525; text-align: left; vertical-align: top; }
    th { color: #8a8a8a; font-weight: 500; }
    .muted { color: #777; }
  </style>
</head>
<body>
<main>
  <header><div><div class="muted">evidence-backed canonical source inventory</div><h1>system inventory v2</h1></div><a href="/lab/system/">storybook</a></header>
  <div class="counts" data-counts></div>
  <div class="filters" data-filters></div>
  <table><thead><tr><th>source owner</th><th>kind</th><th>status</th><th>evidence</th></tr></thead><tbody data-rows></tbody></table>
</main>
<script type="module">
  const response = await fetch('../system-inventory.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load inventory');
  const inventory = await response.json();
  const counts = document.querySelector('[data-counts]');
  const filters = document.querySelector('[data-filters]');
  const rows = document.querySelector('[data-rows]');
  const add = (parent, tag, text, className = '') => {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    parent.append(node);
    return node;
  };
  for (const [label, value] of [
    ['sources', inventory.sources.length],
    ['covered', inventory.sources.filter((source) => source.overallStatus === 'covered').length],
    ['partial', inventory.sources.filter((source) => source.overallStatus === 'partial').length],
    ['missing', inventory.sources.filter((source) => source.overallStatus === 'missing').length],
    ['stories', inventory.stories.length],
    ['structural errors', inventory.structuralIssues.filter((issue) => issue.severity === 'error').length],
  ]) add(counts, 'span', label + ': ' + value, 'count');
  const statuses = ['all', ...new Set(inventory.sources.map((source) => source.overallStatus))];
  let selected = 'all';
  const render = () => {
    rows.replaceChildren();
    for (const source of inventory.sources) {
      if (selected !== 'all' && source.overallStatus !== selected) continue;
      const row = document.createElement('tr');
      add(row, 'td', source.path);
      add(row, 'td', source.sourceKind);
      add(row, 'td', source.overallStatus);
      add(row, 'td', source.storyRefs.map((ref) => ref.storyPath + ' [' + ref.evidence + ']').join(', ') || '—', 'muted');
      rows.append(row);
    }
  };
  for (const status of statuses) {
    const button = add(filters, 'button', status);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(status === selected));
    button.onclick = () => {
      selected = status;
      for (const item of filters.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item === button));
      render();
    };
  }
  render();
</script>
</body>
</html>`;
}

export async function writeDesignSystemInventory({ root, outDir }) {
  const inventory = await collectDesignSystemInventory(root);
  const systemDir = path.join(outDir, "system");
  await mkdir(systemDir, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outDir, "system-inventory.json"),
      `${JSON.stringify(inventory, null, 2)}\n`,
      "utf8",
    ),
    writeFile(path.join(systemDir, "inventory.html"), inventoryPage(), "utf8"),
  ]);
  return inventory;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const root = process.cwd();
  const outDir = path.join(root, "dist", "lab");
  const inventory = await writeDesignSystemInventory({ root, outDir });
  const errors = inventory.structuralIssues.filter((issue) => issue.severity === "error");
  const counts = Object.groupBy(inventory.sources, (source) => source.overallStatus);
  console.log(`[lab-inventory] ${inventory.sources.length} sources, ${inventory.stories.length} stories, ${errors.length} structural errors`);
  console.log(`[lab-inventory] covered ${counts.covered?.length ?? 0}, partial ${counts.partial?.length ?? 0}, missing ${counts.missing?.length ?? 0}`);
  if (errors.length) process.exitCode = 1;
}
