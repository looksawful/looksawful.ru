import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

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
const LAYERS = new Set(["foundation", "atom", "molecule", "organism", "template", "page", "motion", "experimental"]);
const POLICIES = new Set(["isolated", "composition", "page", "behavior-fixture", "experimental", "no-story"]);
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

function sourceFileFor(text, file) {
  const kind = file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

function propertyName(node) {
  if (!node?.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) return node.name.text;
  return null;
}

function objectProperty(object, name) {
  if (!object || !ts.isObjectLiteralExpression(object)) return null;
  return object.properties.find((property) =>
    propertyName(property) === name && ts.isPropertyAssignment(property)
  )?.initializer ?? null;
}

function resolveIdentifierExpression(sourceFile, expression) {
  if (!expression || !ts.isIdentifier(expression)) return expression;
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === expression.text) {
        return declaration.initializer ?? expression;
      }
    }
  }
  return expression;
}

function defaultExportObject(sourceFile) {
  const exportAssignment = sourceFile.statements.find((statement) =>
    ts.isExportAssignment(statement) && !statement.isExportEquals
  );
  if (!exportAssignment) return null;
  const expression = resolveIdentifierExpression(sourceFile, exportAssignment.expression);
  return ts.isObjectLiteralExpression(expression) ? expression : null;
}

function staticString(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : null;
}

function staticBoolean(node) {
  if (node?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

function staticStringArray(node) {
  if (!node || !ts.isArrayLiteralExpression(node)) return [];
  return node.elements.map(staticString).filter((value) => value !== null);
}

function resolveImport(storyPath, specifier) {
  if (!specifier.startsWith(".")) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(storyPath), specifier));
}

function parseStory(text, storyPath) {
  const ast = sourceFileFor(text, storyPath);
  const importedSources = [];
  for (const statement of ast.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier
    ) {
      const specifier = staticString(statement.moduleSpecifier);
      const resolved = specifier ? resolveImport(storyPath, specifier) : null;
      if (resolved) importedSources.push(resolved);
    }
  }

  const meta = defaultExportObject(ast);
  const title = staticString(objectProperty(meta, "title"));
  const parameters = objectProperty(meta, "parameters");
  const looksawful = objectProperty(parameters, "looksawful");
  const declaredSources = staticStringArray(objectProperty(looksawful, "sources"));
  const layer = staticString(objectProperty(looksawful, "layer"));
  const policy = staticString(objectProperty(looksawful, "policy"));
  const canonicalValue = staticBoolean(objectProperty(looksawful, "canonical"));
  const state = staticString(objectProperty(looksawful, "state"));
  const visibility = staticStringArray(objectProperty(looksawful, "visibility"));
  const experimental = canonicalValue === false ||
    layer === "experimental" ||
    policy === "experimental" ||
    title?.startsWith("90 Experimental/");

  return {
    id: `story:${storyPath}`,
    path: storyPath,
    kind: "story",
    title,
    status: experimental ? "experimental" : canonicalValue === true ? "canonical" : "unclassified",
    declaredSources,
    importedSources: [...new Set(importedSources)].sort(),
    layer,
    policy,
    canonical: canonicalValue,
    state,
    visibility,
  };
}

function sourceLifecycle(sourcePath) {
  return sourcePath === "src/site/pages/manifest.ts" ? "infrastructure" : "production";
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

function parseRoutes(text, manifestPath) {
  const ast = sourceFileFor(text, manifestPath);
  const routes = [];
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const id = staticString(objectProperty(node, "id"));
      const routePath = staticString(objectProperty(node, "path"));
      if (id && routePath) {
        const listed = staticBoolean(objectProperty(node, "listed"));
        const indexable = staticBoolean(objectProperty(node, "indexable"));
        routes.push({
          id,
          path: routePath,
          discovery: {
            listed: listed ?? true,
            indexable: indexable ?? true,
          },
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
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
    for (const declaredSource of story.declaredSources) {
      if (!sourcePaths.has(declaredSource)) {
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

  const manifestPath = "src/site/pages/manifest.ts";
  let routes = [];
  try {
    routes = parseRoutes(await readFile(path.join(root, manifestPath), "utf8"), manifestPath);
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
