import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { projectSurfaceStoryCoverage } from "../../src/lab/storybook/project-surface-coverage.mjs";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPage(entries) {
  const rows = entries.map(([id, coverage]) => {
    const target = coverage.storyFile
      ? `<code>${escapeHtml(coverage.storyFile)}</code>`
      : `<a href="https://github.com/looksawful/looksawful.ru/issues/${coverage.issue}">issue #${coverage.issue}</a>`;
    return `<tr><td><code>${escapeHtml(id)}</code></td><td>${escapeHtml(coverage.status)}</td><td>${target}</td><td>${escapeHtml(coverage.reason ?? "")}</td></tr>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>looksawful project surface parity</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#0b0b0b;color:#f3f3f3}
    *{box-sizing:border-box}body{margin:0;padding:32px}main{width:min(1200px,100%);margin:auto}
    h1{font-size:clamp(28px,4vw,56px);letter-spacing:-.04em;margin:0 0 24px}p{max-width:72ch;color:#aaa}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-top:28px}th,td{padding:10px 8px;border-bottom:1px solid #252525;text-align:left;vertical-align:top}
    th{color:#888;font-weight:500}code{overflow-wrap:anywhere}a{color:inherit}
  </style>
</head>
<body><main>
  <h1>project surface parity</h1>
  <p>Generated from the Lab Storybook parity manifest. Direct and indirect entries are represented by production-backed stories. Blocked entries must point to a tracked GitHub issue instead of a Lab-only fake implementation.</p>
  <table><thead><tr><th>surface</th><th>coverage</th><th>story / issue</th><th>reason</th></tr></thead><tbody>${rows}</tbody></table>
</main></body></html>`;
}

export async function writeProjectSurfaceInventory(root = process.cwd()) {
  const entries = Object.entries(projectSurfaceStoryCoverage).sort(([a], [b]) => a.localeCompare(b));
  const outDir = path.join(root, "dist", "lab", "system");
  await mkdir(outDir, { recursive: true });
  const payload = {
    schemaVersion: 1,
    generatedAt: null,
    surfaces: Object.fromEntries(entries),
  };
  await Promise.all([
    writeFile(path.join(outDir, "project-surfaces.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8"),
    writeFile(path.join(outDir, "project-surfaces.html"), renderPage(entries), "utf8"),
  ]);
  return payload;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const inventory = await writeProjectSurfaceInventory();
  const blocked = Object.values(inventory.surfaces).filter((coverage) => coverage.status === "blocked").length;
  console.log(`[project-surface-inventory] ${Object.keys(inventory.surfaces).length} surfaces, ${blocked} blocked`);
}
