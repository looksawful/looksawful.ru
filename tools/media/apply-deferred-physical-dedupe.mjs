import { createHash } from "node:crypto";
import {
  copyFile,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import ts from "@typescript/typescript6";

import { registeredMediaAssets } from "../../src/data/media/assets/registered.ts";
import physicalSource from "../media-migration/manifests/2026-09-03-media-dedupe/physical-only.json" with { type: "json" };

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const APPLY = process.argv.includes("--apply");
const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".html", ".css", ".md", ".txt",
]);

function absolute(repoPath) {
  return path.resolve(ROOT, repoPath);
}

export function publicUrlForPhysicalPath(repoPath) {
  if (!repoPath.startsWith("public/")) {
    throw new Error(`Expected public physical path, got ${repoPath}`);
  }
  return repoPath.slice("public".length);
}

function propertyName(node) {
  if (!node?.name) return null;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) return node.name.text;
  return null;
}

function sourceFileFor(source, fileName) {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

export function rewriteAssetDimensions(source, fileName, assetId, width, height) {
  const sourceFile = sourceFileFor(source, fileName);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const edits = [];
  let matchCount = 0;

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const idProperty = node.properties.find(
        (property) => ts.isPropertyAssignment(property)
          && propertyName(property) === "id"
          && ts.isStringLiteralLike(property.initializer),
      );
      if (idProperty?.initializer?.text === assetId) {
        matchCount += 1;
        const properties = [...node.properties];
        const replaceNumber = (key, value) => {
          const index = properties.findIndex(
            (property) => ts.isPropertyAssignment(property) && propertyName(property) === key,
          );
          const next = ts.factory.createPropertyAssignment(key, ts.factory.createNumericLiteral(value));
          if (index >= 0) properties[index] = next;
          else properties.push(next);
        };
        replaceNumber("width", width);
        replaceNumber("height", height);
        const updated = ts.factory.updateObjectLiteralExpression(node, properties);
        edits.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: printer.printNode(ts.EmitHint.Expression, updated, sourceFile),
        });
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  const next = edits
    .sort((left, right) => right.start - left.start)
    .reduce((text, edit) => `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`, source);
  return { source: next, matchCount };
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(repoPath) {
  try {
    await stat(absolute(repoPath));
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", ".cache"].includes(entry.name)) continue;
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(next));
    else result.push(next);
  }
  return result;
}

function repoPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function classifyReference(filePath) {
  const p = repoPath(filePath);
  if (p.startsWith("tools/media-migration/manifests/")) return "MIGRATION_EVIDENCE";
  if (p.startsWith("public/media/generated/") || p.includes("catalog-records.generated")) return "GENERATED";
  if (p.includes("tmp-media-dedupe") || p.startsWith(".cache/")) return "TEMP_TOOL";
  if (p.startsWith("test/")) return "TEST_FIXTURE";
  return "RUNTIME_DIRECT";
}

async function exactReferences(values) {
  const files = await walk(ROOT);
  const result = [];
  for (const filePath of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) continue;
    let text;
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    for (const value of values) {
      if (!value || !text.includes(value)) continue;
      result.push({ path: repoPath(filePath), kind: classifyReference(filePath), value });
    }
  }
  return result;
}

async function rewriteCanonicalDimensions(assetId, width, height) {
  const assetDir = absolute("src/data/media/assets");
  const filenames = (await readdir(assetDir)).filter((name) => name.endsWith(".ts"));
  let matches = 0;
  for (const filename of filenames) {
    const filePath = path.join(assetDir, filename);
    const source = await readFile(filePath, "utf8");
    const result = rewriteAssetDimensions(source, filename, assetId, width, height);
    matches += result.matchCount;
    if (result.source !== source) await writeFile(filePath, result.source, "utf8");
  }
  if (matches !== 1) throw new Error(`Expected one MediaAsset declaration for ${assetId}, found ${matches}`);
}

function physicalPathForAsset(asset) {
  return asset?.src?.startsWith("/") ? `public${asset.src.split(/[?#]/)[0]}` : null;
}

async function buildPlan() {
  const assetById = new Map(registeredMediaAssets.map((asset) => [asset.id, asset]));
  const assetByPath = new Map(registeredMediaAssets.map((asset) => [physicalPathForAsset(asset), asset]));
  const blockers = [];
  const rewrites = [];
  const promotions = [];

  for (const item of physicalSource.deferredRuntimeRewrites ?? []) {
    const oldUrl = publicUrlForPhysicalPath(item.path);
    const newUrl = publicUrlForPhysicalPath(item.canonicalPath);
    if (!(await exists(item.path))) blockers.push(`missing deferred source ${item.path}`);
    if (!(await exists(item.canonicalPath))) blockers.push(`missing canonical source ${item.canonicalPath}`);
    const refs = await exactReferences([oldUrl, item.path]);
    const runtimeRefs = refs.filter((ref) => ref.kind === "RUNTIME_DIRECT");
    rewrites.push({ ...item, oldUrl, newUrl, refs, runtimeRefs });
    if (runtimeRefs.length !== 1 || runtimeRefs[0].path !== "public/pets/awful-cases/awful-cases.js") {
      blockers.push(`unexpected atlas runtime references: ${JSON.stringify(runtimeRefs)}`);
    }
  }

  for (const item of physicalSource.deferredQualityPromotions ?? []) {
    const canonicalAsset = assetById.get(item.canonicalAssetId);
    if (!canonicalAsset) {
      blockers.push(`missing canonical asset ${item.canonicalAssetId}`);
      continue;
    }
    const canonicalPath = physicalPathForAsset(canonicalAsset);
    if (!canonicalPath || !(await exists(canonicalPath))) blockers.push(`missing canonical file ${canonicalPath}`);
    if (!(await exists(item.bestSourcePath))) blockers.push(`missing best source ${item.bestSourcePath}`);
    const competingAsset = assetByPath.get(item.bestSourcePath);
    if (competingAsset && competingAsset.id !== item.canonicalAssetId) {
      blockers.push(`best source is registered as independent asset ${competingAsset.id}`);
    }
    const refs = await exactReferences([
      item.bestSourcePath,
      item.bestSourcePath.startsWith("public/") ? item.bestSourcePath.slice("public".length) : "",
    ]);
    const blockingRefs = refs.filter((ref) => ref.kind === "RUNTIME_DIRECT");
    if (blockingRefs.length) blockers.push(`live best-source references: ${JSON.stringify(blockingRefs)}`);

    let bestMetadata = null;
    let canonicalStat = null;
    if (await exists(item.bestSourcePath)) {
      bestMetadata = await sharp(absolute(item.bestSourcePath)).metadata();
      if (!bestMetadata.width || !bestMetadata.height) blockers.push(`cannot read dimensions ${item.bestSourcePath}`);
    }
    if (canonicalPath && await exists(canonicalPath)) canonicalStat = await stat(absolute(canonicalPath));
    promotions.push({ ...item, canonicalPath, refs, bestMetadata, canonicalStat });
  }

  return { blockers: [...new Set(blockers)], rewrites, promotions };
}

async function applyPlan(plan) {
  let netBytesRemoved = 0;
  const removedPaths = [];

  for (const rewrite of plan.rewrites) {
    const jsPath = absolute("public/pets/awful-cases/awful-cases.js");
    const source = await readFile(jsPath, "utf8");
    if (!source.includes(rewrite.oldUrl)) throw new Error(`Expected atlas URL ${rewrite.oldUrl}`);
    const next = source.replaceAll(rewrite.oldUrl, rewrite.newUrl);
    await writeFile(jsPath, next, "utf8");
    const oldStat = await stat(absolute(rewrite.path));
    await rm(absolute(rewrite.path));
    netBytesRemoved += oldStat.size;
    removedPaths.push(rewrite.path);
  }

  for (const promotion of plan.promotions) {
    const oldCanonicalStat = await stat(absolute(promotion.canonicalPath));
    await copyFile(absolute(promotion.bestSourcePath), absolute(promotion.canonicalPath));
    const [sourceHash, canonicalHash] = await Promise.all([
      sha256(absolute(promotion.bestSourcePath)),
      sha256(absolute(promotion.canonicalPath)),
    ]);
    if (sourceHash !== canonicalHash) throw new Error(`quality promotion hash mismatch ${promotion.componentId}`);
    await rewriteCanonicalDimensions(
      promotion.canonicalAssetId,
      promotion.bestMetadata.width,
      promotion.bestMetadata.height,
    );
    await rm(absolute(promotion.bestSourcePath));
    netBytesRemoved += oldCanonicalStat.size;
    removedPaths.push(promotion.bestSourcePath);
  }

  return { netBytesRemoved, removedPaths };
}

async function main() {
  const plan = await buildPlan();
  const summary = {
    mode: APPLY ? "apply" : "dry-run",
    blockers: plan.blockers,
    runtimeRewriteCount: plan.rewrites.length,
    qualityPromotionCount: plan.promotions.length,
    rewrites: plan.rewrites,
    promotions: plan.promotions.map((item) => ({
      componentId: item.componentId,
      canonicalAssetId: item.canonicalAssetId,
      canonicalPath: item.canonicalPath,
      bestSourcePath: item.bestSourcePath,
      width: item.bestMetadata?.width ?? null,
      height: item.bestMetadata?.height ?? null,
    })),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (plan.blockers.length) {
    process.exitCode = 1;
    return;
  }
  if (!APPLY) return;

  const applied = await applyPlan(plan);
  process.stdout.write(`${JSON.stringify({ applied }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
