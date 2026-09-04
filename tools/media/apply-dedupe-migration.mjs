import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { mediaAssets, mediaEntries } from "../../src/data/media/index.ts";
import { registeredMediaAssets } from "../../src/data/media/assets/registered.ts";
import { mediaCatalogItems as baseMediaCatalogItems } from "../../src/data/media/catalog.ts";
import { dedupeMediaUsageRecords } from "../../src/data/media/usage-records.ts";

import logicalSource from "../media-migration/manifests/2026-09-03-media-dedupe/logical-assets.json" with { type: "json" };
import noMergeSource from "../media-migration/manifests/2026-09-03-media-dedupe/no-merge.json" with { type: "json" };

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const APPLY = process.argv.includes("--apply");
const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".html", ".css",
  ".md", ".txt", ".yml", ".yaml",
]);
const CONTEXT_KEYS = [
  "title",
  "alt",
  "description",
  "date",
  "projectIds",
  "workAreaIds",
  "projectTypeIds",
  "deliverableIds",
  "tags",
  "credits",
];
const LIBRARY_ONLY_KEYS = ["reusable", "archived"];

function posix(path) {
  return path.split(sep).join("/");
}

function repoPath(absolute) {
  return posix(relative(ROOT, absolute));
}

function absolute(repoRelative) {
  return resolve(ROOT, repoRelative);
}

function physicalPathForAsset(asset) {
  if (!asset?.src?.startsWith("/")) return null;
  return `public${asset.src.split(/[?#]/, 1)[0]}`;
}

function stableEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function exists(repoRelative) {
  try {
    await readFile(absolute(repoRelative));
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", ".cache"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

function classifyReference(path) {
  const p = posix(path);
  if (p.startsWith("tools/media-migration/manifests/")
      || p === "src/data/media/asset-aliases.json"
      || p === "src/data/media/asset-aliases.ts"
      || p === "src/content/media-usages/registered.json") {
    return "MIGRATION_EVIDENCE";
  }
  if (p.includes("catalog-records.generated")
      || p.includes("responsive-generated")
      || p.startsWith("public/media/generated/")) {
    return "GENERATED";
  }
  if (p.includes("tmp-media-dedupe") || p.startsWith(".cache/")) return "TEMP_TOOL";
  if (p.startsWith("test/") || p.includes("/fixtures/")) return "TEST_FIXTURE";
  if (p.startsWith("src/data/media/assets/")) return "ASSET_REGISTRY";
  if (p.startsWith("src/content/media-catalog/")) return "CATALOG_SOURCE";
  return "RUNTIME_DIRECT";
}

function propertyName(node) {
  if (!node.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) return node.name.text;
  return null;
}

function rewriteAssetProperties(sourceText, sourceFile, aliases) {
  const edits = [];

  function visit(node) {
    if (ts.isPropertyAssignment(node)
        && ["assetId", "mediaAssetId"].includes(propertyName(node))
        && ts.isStringLiteralLike(node.initializer)) {
      const replacement = aliases.get(node.initializer.text);
      if (replacement) {
        edits.push({
          start: node.initializer.getStart(sourceFile),
          end: node.initializer.getEnd(),
          text: JSON.stringify(replacement),
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return applyEdits(sourceText, edits);
}

function removeAssetDeclarations(sourceText, sourceFile, removeIds) {
  const edits = [];

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const idProperty = node.properties.find(
        (property) => ts.isPropertyAssignment(property)
          && propertyName(property) === "id"
          && ts.isStringLiteralLike(property.initializer),
      );
      const id = idProperty?.initializer?.text;
      if (id && removeIds.has(id)) {
        let start = node.getFullStart();
        let end = node.getEnd();
        while (end < sourceText.length && /[ \t]/.test(sourceText[end])) end += 1;
        if (sourceText[end] === ",") end += 1;
        if (sourceText[end] === "\r") end += 1;
        if (sourceText[end] === "\n") end += 1;
        edits.push({ start, end, text: "" });
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return applyEdits(sourceText, edits);
}

function applyEdits(sourceText, edits) {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (text, edit) => `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`,
      sourceText,
    );
}

async function buildTextWorkspace(aliases, removeIds) {
  const files = await walk(ROOT);
  const textFiles = files.filter((path) => TEXT_EXTENSIONS.has(extname(path).toLowerCase()));
  const workspace = new Map();

  for (const path of textFiles) {
    const rel = repoPath(path);
    let text;
    try {
      text = await readFile(path, "utf8");
    } catch {
      continue;
    }

    if ([".ts", ".tsx", ".js", ".mjs", ".cjs"].includes(extname(path).toLowerCase())) {
      const sourceFile = ts.createSourceFile(
        rel,
        text,
        ts.ScriptTarget.Latest,
        true,
        rel.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      text = rewriteAssetProperties(text, sourceFile, aliases);
      if (rel.startsWith("src/data/media/assets/")) {
        const rewrittenFile = ts.createSourceFile(
          rel,
          text,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        );
        text = removeAssetDeclarations(text, rewrittenFile, removeIds);
      }
    }

    workspace.set(rel, text);
  }

  return workspace;
}

function findLiveReferences(workspace, component, deletedTextPaths) {
  const refs = [];
  const needles = new Set([
    ...component.removeAssetIds,
    ...component.removePhysicalPaths,
    ...component.removePhysicalPaths
      .filter((path) => path.startsWith("public/"))
      .map((path) => path.slice("public".length)),
  ]);

  for (const [path, text] of workspace) {
    if (deletedTextPaths.has(path)) continue;
    for (const needle of needles) {
      if (!needle || !text.includes(needle)) continue;
      refs.push({ path, kind: classifyReference(path), needle });
    }
  }

  return refs;
}

function metadataBlockers(component, catalogById, usageByEntryId) {
  const blockers = [];
  const canonical = catalogById.get(component.canonicalAssetId);
  if (!canonical) return [`missing canonical catalog item ${component.canonicalAssetId}`];

  const usageRecords = component.entryIds
    .map((entryId) => usageByEntryId.get(entryId))
    .filter(Boolean);

  for (const removeId of component.removeAssetIds) {
    const old = catalogById.get(removeId);
    if (!old) {
      blockers.push(`missing retired catalog item ${removeId}`);
      continue;
    }

    for (const key of CONTEXT_KEYS) {
      if (stableEqual(old[key], canonical[key])) continue;
      const preserved = usageRecords.some(
        (record) => Object.prototype.hasOwnProperty.call(record, key)
          && stableEqual(record[key], old[key]),
      );
      if (!preserved) blockers.push(`${removeId}.${key} differs without usage carrier`);
    }

    for (const key of LIBRARY_ONLY_KEYS) {
      if (!stableEqual(old[key], canonical[key])) {
        blockers.push(`${removeId}.${key} differs and is library-only`);
      }
    }
  }

  return blockers;
}

function noMergeBlockers(component, assetByPhysicalPath) {
  const removePaths = new Set(component.removePhysicalPaths);
  const involvedIds = new Set([
    component.canonicalAssetId,
    ...component.removeAssetIds,
  ]);
  const blockers = [];

  for (const constraint of noMergeSource) {
    if (removePaths.has(constraint.left) || removePaths.has(constraint.right)) {
      blockers.push(`${constraint.source} ${constraint.decision} path is scheduled for deletion`);
      continue;
    }

    const left = assetByPhysicalPath.get(constraint.left);
    const right = assetByPhysicalPath.get(constraint.right);
    if (!left || !right) continue;
    if (involvedIds.has(left.id) && involvedIds.has(right.id)) {
      blockers.push(`${constraint.source} ${constraint.decision} assets would enter one component`);
    }
  }

  return blockers;
}

async function buildPlan() {
  const runtimeAssetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  const legacyAssetById = new Map(registeredMediaAssets.map((asset) => [asset.id, asset]));
  const catalogById = new Map(baseMediaCatalogItems.map((item) => [item.asset.id, item]));
  const entryById = new Map(mediaEntries.map((entry) => [entry.id, entry]));
  const usageByEntryId = new Map(dedupeMediaUsageRecords.map((record) => [record.entryId, record]));
  const assetByPhysicalPath = new Map(
    registeredMediaAssets.map((asset) => [physicalPathForAsset(asset), asset]),
  );

  const aliases = new Map();
  const removeIds = new Set();
  for (const component of logicalSource.components) {
    for (const removeId of component.removeAssetIds) {
      aliases.set(removeId, component.canonicalAssetId);
      removeIds.add(removeId);
    }
  }

  const workspace = await buildTextWorkspace(aliases, removeIds);
  const plannedCatalogDeletes = new Set(
    [...removeIds].map((id) => `src/content/media-catalog/registered/${id}.json`),
  );

  const components = [];
  for (const component of logicalSource.components) {
    const blockers = [];
    const canonicalAsset = runtimeAssetById.get(component.canonicalAssetId);
    if (!canonicalAsset) blockers.push(`canonical runtime asset missing: ${component.canonicalAssetId}`);

    const canonicalPath = physicalPathForAsset(canonicalAsset ?? legacyAssetById.get(component.canonicalAssetId));
    if (!canonicalPath || !(await exists(canonicalPath))) {
      blockers.push(`canonical physical source missing: ${canonicalPath ?? component.canonicalAssetId}`);
    }

    for (const removeId of component.removeAssetIds) {
      if (!legacyAssetById.has(removeId)) blockers.push(`retired asset declaration missing: ${removeId}`);
      if (runtimeAssetById.has(removeId)) blockers.push(`retired asset still survives runtime registry: ${removeId}`);
      const catalogPath = `src/content/media-catalog/registered/${removeId}.json`;
      if (!(await exists(catalogPath))) blockers.push(`catalog source missing before cleanup: ${catalogPath}`);
    }

    for (const entryId of component.entryIds) {
      const usage = usageByEntryId.get(entryId);
      const entry = entryById.get(entryId);
      if (!usage) blockers.push(`missing explicit usage metadata: ${entryId}`);
      if (!entry) blockers.push(`missing runtime MediaEntry: ${entryId}`);
      if (entry && entry.assetId !== component.canonicalAssetId) {
        blockers.push(`entry not retargeted: ${entryId} -> ${entry.assetId}`);
      }
    }

    blockers.push(...metadataBlockers(component, catalogById, usageByEntryId));
    blockers.push(...noMergeBlockers(component, assetByPhysicalPath));

    const refs = findLiveReferences(workspace, component, plannedCatalogDeletes);
    const runtimeRefs = refs.filter((ref) => ref.kind === "RUNTIME_DIRECT");
    for (const ref of runtimeRefs) {
      blockers.push(`live runtime reference: ${ref.path} -> ${ref.needle}`);
    }

    const physicalFiles = [];
    for (const path of component.removePhysicalPaths) {
      physicalFiles.push({ path, exists: await exists(path) });
    }

    components.push({
      componentId: component.componentId,
      canonicalAssetId: component.canonicalAssetId,
      canonicalPath,
      removeAssetIds: component.removeAssetIds,
      entryIds: component.entryIds,
      physicalFiles,
      references: refs,
      blockers: [...new Set(blockers)],
      eligible: blockers.length === 0,
    });
  }

  return { components, workspace, aliases, plannedCatalogDeletes };
}

async function applyPlan(plan) {
  const eligible = plan.components.filter((component) => component.eligible);
  const eligibleIds = new Set(eligible.flatMap((component) => component.removeAssetIds));
  const eligibleAliases = new Map(
    [...plan.aliases].filter(([from]) => eligibleIds.has(from)),
  );

  const files = await walk(ROOT);
  for (const path of files) {
    const rel = repoPath(path);
    if (![".ts", ".tsx", ".js", ".mjs", ".cjs"].includes(extname(path).toLowerCase())) continue;
    let text;
    try {
      text = await readFile(path, "utf8");
    } catch {
      continue;
    }
    const sourceFile = ts.createSourceFile(
      rel,
      text,
      ts.ScriptTarget.Latest,
      true,
      rel.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    let next = rewriteAssetProperties(text, sourceFile, eligibleAliases);
    if (rel.startsWith("src/data/media/assets/")) {
      const rewrittenFile = ts.createSourceFile(
        rel,
        next,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      next = removeAssetDeclarations(next, rewrittenFile, eligibleIds);
    }
    if (next !== text) await writeFile(path, next, "utf8");
  }

  for (const component of eligible) {
    for (const removeId of component.removeAssetIds) {
      await rm(
        absolute(`src/content/media-catalog/registered/${removeId}.json`),
        { force: true },
      );
    }
    for (const file of component.physicalFiles) {
      if (file.exists) await rm(absolute(file.path), { force: true });
    }
  }

  return {
    appliedComponentIds: eligible.map((component) => component.componentId),
    removedAssetIds: [...eligibleIds],
    removedPhysicalPaths: eligible.flatMap((component) =>
      component.physicalFiles.filter((file) => file.exists).map((file) => file.path),
    ),
  };
}

async function main() {
  const plan = await buildPlan();
  const eligible = plan.components.filter((component) => component.eligible);
  const blocked = plan.components.filter((component) => !component.eligible);

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    suppliedComponents: plan.components.length,
    eligibleComponents: eligible.length,
    blockedComponents: blocked.length,
    entryRetargetEvidenceCount: dedupeMediaUsageRecords.length,
    components: plan.components.map(({ references, ...component }) => ({
      ...component,
      referenceSummary: Object.fromEntries(
        [...new Set(references.map((ref) => ref.kind))].map((kind) => [
          kind,
          references.filter((ref) => ref.kind === kind).length,
        ]),
      ),
    })),
  };

  if (!APPLY) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (eligible.length === 0) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
    return;
  }

  const applied = await applyPlan(plan);
  process.stdout.write(`${JSON.stringify({ ...report, applied }, null, 2)}\n`);
  if (blocked.length > 0) process.exitCode = 2;
}

await main();
