import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const COMPONENT_EXTENSIONS = new Set([".ts", ".js"]);
const TEMPLATE_EXTENSIONS = new Set([".ts", ".js"]);
const STORY_SUFFIXES = [".stories.ts", ".stories.js"];

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function collectFiles(root, relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
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

function isRuntimeSource(file, extensions) {
  const extension = path.posix.extname(file);
  return extensions.has(extension) && !file.endsWith(".d.ts");
}

function storyStem(file) {
  const name = path.posix.basename(file);
  const suffix = STORY_SUFFIXES.find((candidate) => name.endsWith(candidate));
  return suffix ? name.slice(0, -suffix.length) : null;
}

function sourceStem(file) {
  return path.posix.basename(file, path.posix.extname(file));
}

export async function collectDesignSystemInventory(root) {
  const [componentFiles, styleFiles, templateFiles, storyFiles] = await Promise.all([
    collectFiles(root, "src/components"),
    collectFiles(root, "src/styles"),
    collectFiles(root, "src/templates"),
    collectFiles(root, "src/lab/stories"),
  ]);

  const stories = storyFiles
    .filter((file) => STORY_SUFFIXES.some((suffix) => file.endsWith(suffix)))
    .map((file) => ({ path: file, kind: "story" }));

  const storiesByStem = new Map();
  for (const story of stories) {
    const stem = storyStem(story.path);
    if (!stem) continue;
    const matches = storiesByStem.get(stem) ?? [];
    matches.push(story.path);
    storiesByStem.set(stem, matches);
  }

  const components = componentFiles
    .filter((file) => isRuntimeSource(file, COMPONENT_EXTENSIONS))
    .map((file) => {
      const matchingStories = [...(storiesByStem.get(sourceStem(file)) ?? [])]
        .sort((a, b) => a.localeCompare(b));
      return {
        path: file,
        kind: "component",
        storyPaths: matchingStories,
        documented: matchingStories.length > 0,
      };
    });

  const styles = styleFiles
    .filter((file) => file.endsWith(".css"))
    .map((file) => ({ path: file, kind: "style" }));

  const templates = templateFiles
    .filter((file) => isRuntimeSource(file, TEMPLATE_EXTENSIONS))
    .map((file) => ({ path: file, kind: "template" }));

  return {
    generatedAt: null,
    components,
    styles,
    templates,
    stories,
  };
}

function inventoryPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>looksawful design system inventory</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #0b0b0b; color: #f3f3f3; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; }
    main { width: min(1160px, 100%); margin: 0 auto; }
    header { display: flex; justify-content: space-between; gap: 24px; align-items: end; margin-bottom: 28px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 56px); letter-spacing: -.04em; }
    a { color: inherit; }
    .counts { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 24px; }
    .count { border: 1px solid #303030; border-radius: 999px; padding: 7px 10px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #252525; text-align: left; vertical-align: top; }
    th { color: #8a8a8a; font-weight: 500; }
    td:first-child { width: 54%; overflow-wrap: anywhere; }
    .yes { color: #bfffc4; }
    .no { color: #ffb7b7; }
    .muted { color: #777; }
  </style>
</head>
<body>
<main>
  <header><div><div class="muted">generated from canonical source</div><h1>system inventory</h1></div><a href="/lab/system/">storybook</a></header>
  <div class="counts" data-counts></div>
  <table>
    <thead><tr><th>component owner</th><th>documented</th><th>story</th></tr></thead>
    <tbody data-rows></tbody>
  </table>
</main>
<script type="module">
  const counts = document.querySelector('[data-counts]');
  const rows = document.querySelector('[data-rows]');
  const response = await fetch('../system-inventory.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load design-system inventory');
  const inventory = await response.json();
  const addText = (parent, tag, value, className = '') => {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    parent.append(node);
    return node;
  };
  for (const [label, value] of [
    ['components', inventory.components.length],
    ['documented', inventory.components.filter((item) => item.documented).length],
    ['styles', inventory.styles.length],
    ['templates', inventory.templates.length],
    ['stories', inventory.stories.length],
  ]) {
    addText(counts, 'span', label + ': ' + value, 'count');
  }
  for (const component of inventory.components) {
    const row = document.createElement('tr');
    addText(row, 'td', component.path);
    addText(row, 'td', component.documented ? 'yes' : 'no', component.documented ? 'yes' : 'no');
    addText(row, 'td', component.storyPaths.join(', ') || '—', component.storyPaths.length ? '' : 'muted');
    rows.append(row);
  }
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
  const documented = inventory.components.filter((item) => item.documented).length;
  console.log(`[lab-inventory] ${inventory.components.length} components, ${documented} documented, ${inventory.stories.length} stories`);
}
