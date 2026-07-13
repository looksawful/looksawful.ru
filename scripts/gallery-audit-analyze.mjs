import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const reportDir = path.join(rootDir, "public", "_audit-gallery-inventory");
const manifestPath = path.join(rootDir, "public", "assets", "gallery", "manifest.json");

const readJson = async (name) => JSON.parse(await fs.readFile(path.join(reportDir, name), "utf8"));
const writeJson = async (name, data) => fs.writeFile(path.join(reportDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
const bytesToMb = (bytes) => Number((bytes / 1024 / 1024).toFixed(3));
const percent = (value, total) => total ? Number((value / total * 100).toFixed(2)) : 0;

function countBy(items, keyFn, valueFn = () => 1) {
  const map = new Map();
  for (const item of items) {
    const key = String(keyFn(item) ?? "unknown");
    const value = valueFn(item);
    map.set(key, (map.get(key) || 0) + value);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru")));
}

function prefixFor(item) {
  const parts = item.repoPath.split("/");
  if (item.repoPath.startsWith("public/assets/gallery/database/vanila-draft/")) return parts.slice(0, 6).join("/");
  if (item.repoPath.startsWith("public/assets/media/cases/")) return parts.slice(0, 5).join("/");
  if (item.repoPath.startsWith("public/assets/gallery/database/")) return parts.slice(0, 5).join("/");
  return parts.slice(0, 4).join("/");
}

function canonicalScore(item) {
  const value = item.repoPath.toLowerCase();
  let score = 0;
  if (value.includes("/assets/media/cases/")) score += 100;
  if (value.includes("/assets/gallery/custom/")) score += 80;
  if (value.includes("/02-showcase/")) score += 60;
  if (value.includes("/03-pet-projects/")) score += 30;
  if (value.includes("/01-resume/")) score += 20;
  if (value.includes("копия") || value.includes(" copy")) score -= 15;
  if (value.includes("placeholder")) score -= 20;
  if (item.referencedOutsideManifest) score += 25;
  if (item.inManifest) score += 10;
  return score;
}

function projectFamily(item) {
  const value = item.repoPath.toLowerCase();
  if (value.includes("jestei-pool") || value.includes("jesteipool") || value.includes("/jestei/")) return "jesteipool";
  if (value.includes("styx") || value.includes("stix") || value.includes("стикс")) return "styx";
  if (value.includes("/shoots/") || value.includes("shooting") || value.includes("photography")) return "shootings";
  if (value.includes("sensetique")) return "sensetique";
  if (value.includes("berry")) return "berry";
  if (value.includes("s-and-s")) return "s-and-s";
  if (value.includes("mad-cow") || value.includes("madcow")) return "mad-cow-films";
  if (value.includes("li-ne") || value.includes("line-logo")) return "li-ne";
  if (value.includes("progress")) return "progress";
  if (value.includes("pet-projects")) return "pets-other";
  return item.inferredProject || "unclassified";
}

const behanceProjects = [
  { id: "styx", label: "Styx Jewels", patterns: [/styx/i, /stix/i, /стикс/i], broad: false },
  { id: "obladaet", label: "Obladaet", patterns: [/obladaet/i, /обладает/i], broad: false },
  { id: "offmi", label: "Offmi", patterns: [/offmi/i, /оффми/i], broad: false },
  { id: "mano", label: "Mano", patterns: [/(^|[\s/_-])mano([\s/_-]|$)/i, /мано/i], broad: false },
  { id: "r3xred", label: "R3xRed", patterns: [/r3xred/i, /rexred/i, /r3x/i], broad: false },
  { id: "ecobasik", label: "Ecobasik", patterns: [/ecobasik/i, /eco[\s_-]*basik/i, /экобазик/i], broad: false },
  { id: "anka", label: "Anka model tests", patterns: [/(^|[\s/_-])anka([\s/_-]|$)/i, /анка/i], broad: false },
  { id: "hypression", label: "Hypression", patterns: [/hypression/i], broad: false },
  { id: "cinema-stills", label: "Cinema Stills", patterns: [/cinema[\s_-]*stills/i, /cinema/i, /stills/i], broad: false },
  { id: "choose-character", label: "Choose your character", patterns: [/choose[\s_-]*your[\s_-]*character/i, /character/i, /персонаж/i], broad: false },
  { id: "editorial", label: "Editorial photography", patterns: [/editorial/i, /редакцион/i], broad: false },
  { id: "music-photography", label: "Music photography archive", patterns: [/music-photography/i, /music photography/i, /музыкальн/i], broad: true },
  { id: "model-shootings", label: "Model shootings archive", patterns: [/model shootings/i, /model-shootings/i, /модельн/i], broad: true },
];

function matchBehance(item, project) {
  return project.patterns.some((pattern) => pattern.test(item.repoPath));
}

async function main() {
  const inventory = await readJson("site-assets-inventory.json");
  const exactGroups = await readJson("exact-duplicates.json");
  const pixelGroups = await readJson("pixel-duplicates.json");
  const perceptual = await readJson("perceptual-candidates.json");
  const filenameGroups = await readJson("filename-candidates.json");
  const missingReferences = await readJson("missing-references.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const manifestItems = Array.isArray(manifest.items) ? manifest.items : [];
  const inventoryByPath = new Map(inventory.map((item) => [item.repoPath, item]));
  const manifestBySrc = new Map();
  for (const item of manifestItems) {
    if (!manifestBySrc.has(item.src)) manifestBySrc.set(item.src, []);
    manifestBySrc.get(item.src).push(item);
  }

  const duplicateDetails = exactGroups.map((group) => {
    const items = group.items.map((name) => inventoryByPath.get(name)).filter(Boolean);
    const sorted = [...items].sort((a, b) => canonicalScore(b) - canonicalScore(a) || a.repoPath.localeCompare(b.repoPath, "ru"));
    const canonical = sorted[0];
    const redundant = sorted.slice(1);
    const projects = [...new Set(items.map(projectFamily))];
    const areas = [...new Set(items.map((item) => item.area))];
    const directories = [...new Set(items.map((item) => path.posix.dirname(item.repoPath)))];
    return {
      sha256: group.key,
      bytesPerFile: canonical?.bytes || 0,
      copies: items.length,
      redundantCopies: redundant.length,
      reclaimableBytes: redundant.reduce((sum, item) => sum + item.bytes, 0),
      scope: areas.length > 1 ? "cross-area" : projects.length > 1 ? "cross-project" : directories.length > 1 ? "cross-directory" : "same-directory",
      areas,
      projects,
      canonical: canonical?.repoPath || null,
      redundant: redundant.map((item) => item.repoPath),
    };
  }).sort((a, b) => b.reclaimableBytes - a.reclaimableBytes || b.copies - a.copies);

  const redundantFiles = duplicateDetails.reduce((sum, group) => sum + group.redundantCopies, 0);
  const reclaimableBytes = duplicateDetails.reduce((sum, group) => sum + group.reclaimableBytes, 0);
  const areaSummary = Object.entries(countBy(inventory, (item) => item.area)).map(([area, files]) => ({
    area,
    files,
    bytes: inventory.filter((item) => item.area === area).reduce((sum, item) => sum + item.bytes, 0),
  })).map((entry) => ({ ...entry, megabytes: bytesToMb(entry.bytes) }));
  const familyNames = [...new Set(inventory.map(projectFamily))];
  const projectSummary = familyNames.map((project) => {
    const items = inventory.filter((item) => projectFamily(item) === project);
    const duplicatePaths = new Set(duplicateDetails.flatMap((group) => [...(group.canonical ? [group.canonical] : []), ...group.redundant]).filter((name) => items.some((item) => item.repoPath === name)));
    const redundantPaths = new Set(duplicateDetails.flatMap((group) => group.redundant).filter((name) => items.some((item) => item.repoPath === name)));
    return {
      project,
      files: items.length,
      bytes: items.reduce((sum, item) => sum + item.bytes, 0),
      megabytes: bytesToMb(items.reduce((sum, item) => sum + item.bytes, 0)),
      exactDuplicateFiles: duplicatePaths.size,
      redundantFiles: redundantPaths.size,
      inManifest: items.filter((item) => item.inManifest).length,
      referencedOutsideManifest: items.filter((item) => item.referencedOutsideManifest).length,
    };
  }).sort((a, b) => b.files - a.files);

  const prefixes = [...new Set(inventory.map(prefixFor))];
  const directorySummary = prefixes.map((prefix) => {
    const items = inventory.filter((item) => prefixFor(item) === prefix);
    const redundant = new Set(duplicateDetails.flatMap((group) => group.redundant)).size ? items.filter((item) => duplicateDetails.some((group) => group.redundant.includes(item.repoPath))) : [];
    return {
      prefix,
      files: items.length,
      bytes: items.reduce((sum, item) => sum + item.bytes, 0),
      megabytes: bytesToMb(items.reduce((sum, item) => sum + item.bytes, 0)),
      images: items.filter((item) => item.type === "image").length,
      videos: items.filter((item) => item.type === "video").length,
      inManifest: items.filter((item) => item.inManifest).length,
      redundantFiles: redundant.length,
      unreferenced: items.filter((item) => !item.inManifest && !item.referencedOutsideManifest).length,
    };
  }).sort((a, b) => b.files - a.files);

  const classificationMismatches = [];
  for (const item of inventory) {
    const entries = manifestBySrc.get(item.publicPath) || [];
    const expected = projectFamily(item);
    for (const entry of entries) {
      const broadExpected = expected === "sensetique" || expected === "berry" || expected === "s-and-s" || expected === "mad-cow-films" || expected === "li-ne" || expected === "progress" || expected === "pets-other" || expected === "unclassified" ? "needs-explicit-project" : expected;
      if (broadExpected !== "needs-explicit-project" && entry.project !== broadExpected) {
        classificationMismatches.push({ path: item.repoPath, manifestProject: entry.project, expectedProject: broadExpected, manifestId: entry.id });
      }
      if (broadExpected === "needs-explicit-project" && entry.project === "pets") {
        classificationMismatches.push({ path: item.repoPath, manifestProject: entry.project, expectedProject: expected, manifestId: entry.id, reason: "fallback-to-pets" });
      }
    }
  }

  const overlap = {};
  for (const project of behanceProjects) {
    const items = inventory.filter((item) => matchBehance(item, project));
    const hashes = new Set(items.map((item) => item.sha256));
    const redundant = items.filter((item) => duplicateDetails.some((group) => group.redundant.includes(item.repoPath)));
    overlap[project.id] = {
      label: project.label,
      broadArchiveMatch: project.broad,
      files: items.length,
      uniqueHashes: hashes.size,
      bytes: items.reduce((sum, item) => sum + item.bytes, 0),
      megabytes: bytesToMb(items.reduce((sum, item) => sum + item.bytes, 0)),
      exactRedundantFiles: redundant.length,
      inManifest: items.filter((item) => item.inManifest).length,
      paths: items.map((item) => ({
        path: item.repoPath,
        bytes: item.bytes,
        width: item.width || 0,
        height: item.height || 0,
        sha256: item.sha256,
        inManifest: item.inManifest,
        manifestProjects: [...new Set((manifestBySrc.get(item.publicPath) || []).map((entry) => entry.project))],
        exactDuplicate: duplicateDetails.some((group) => group.canonical === item.repoPath || group.redundant.includes(item.repoPath)),
      })),
    };
  }

  const unindexed = inventory.filter((item) => !item.inManifest);
  const unreferenced = inventory.filter((item) => !item.inManifest && !item.referencedOutsideManifest);
  const manifestOnly = inventory.filter((item) => item.inManifest && !item.referencedOutsideManifest);

  const analysis = {
    generatedAt: new Date().toISOString(),
    totals: {
      files: inventory.length,
      bytes: inventory.reduce((sum, item) => sum + item.bytes, 0),
      megabytes: bytesToMb(inventory.reduce((sum, item) => sum + item.bytes, 0)),
      exactDuplicateGroups: duplicateDetails.length,
      filesInsideExactDuplicateGroups: exactGroups.reduce((sum, group) => sum + group.items.length, 0),
      redundantFiles,
      redundantFilePercent: percent(redundantFiles, inventory.length),
      uniqueByExactContent: inventory.length - redundantFiles,
      reclaimableBytes,
      reclaimableMegabytes: bytesToMb(reclaimableBytes),
      reclaimablePercent: percent(reclaimableBytes, inventory.reduce((sum, item) => sum + item.bytes, 0)),
      decodedPixelDuplicateGroups: pixelGroups.length,
      perceptualCandidatePairs: perceptual.length,
      filenameCandidateGroups: filenameGroups.length,
      unindexedFiles: unindexed.length,
      unreferencedFiles: unreferenced.length,
      manifestOnlyFiles: manifestOnly.length,
      missingReferencePaths: missingReferences.length,
      classificationMismatches: classificationMismatches.length,
    },
    duplicateScopes: countBy(duplicateDetails, (group) => group.scope),
    duplicateBytesByScope: countBy(duplicateDetails, (group) => group.scope, (group) => group.reclaimableBytes),
    areaSummary,
    projectSummary,
    directorySummary,
    topDuplicateGroups: duplicateDetails.slice(0, 100),
    unindexedFiles: unindexed.map((item) => item.repoPath),
    unreferencedFiles: unreferenced.map((item) => item.repoPath),
    missingReferences,
    classificationMismatches: classificationMismatches.slice(0, 2000),
  };

  await writeJson("inventory-analysis.json", analysis);
  await writeJson("duplicate-reclaim-plan.json", duplicateDetails);
  await writeJson("directory-summary.json", directorySummary);
  await writeJson("project-summary.json", projectSummary);
  await writeJson("classification-mismatches.json", classificationMismatches);
  await writeJson("behance-overlap.json", overlap);

  const chunkDir = path.join(reportDir, "inventory-chunks");
  await fs.rm(chunkDir, { recursive: true, force: true });
  await fs.mkdir(chunkDir, { recursive: true });
  const chunkSize = 200;
  for (let offset = 0; offset < inventory.length; offset += chunkSize) {
    const number = String(Math.floor(offset / chunkSize) + 1).padStart(3, "0");
    await fs.writeFile(path.join(chunkDir, `inventory-${number}.json`), `${JSON.stringify(inventory.slice(offset, offset + chunkSize), null, 2)}\n`, "utf8");
  }

  console.log(`GALLERY_AUDIT_ANALYSIS=${JSON.stringify(analysis.totals)}`);
  console.log(`GALLERY_BEHANCE_OVERLAP=${JSON.stringify(Object.fromEntries(Object.entries(overlap).map(([key, value]) => [key, { files: value.files, uniqueHashes: value.uniqueHashes, exactRedundantFiles: value.exactRedundantFiles }])))}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
