import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function usageBinding(assetId, kind, ownerId, fieldPath) {
  return {
    assetId,
    usage: {
      kind,
      ownerId,
      sourcePath: "src/data/media/entries",
      fieldPath,
      blockingDelete: true,
    },
  };
}

export function buildStaticUsageIndex(entries, petCards = []) {
  if (!Array.isArray(entries)) throw new TypeError("Static usage index requires media entries");
  const bindings = [];
  for (const entry of entries) {
    if (!entry || typeof entry.id !== "string" || typeof entry.assetId !== "string") continue;
    bindings.push(usageBinding(entry.assetId, "direct-placement", entry.id, entry.id));
    if (typeof entry.posterAssetId === "string" && entry.posterAssetId) {
      bindings.push(usageBinding(entry.posterAssetId, "video-poster", entry.id, `${entry.id}.posterAssetId`));
    }
  }
  bindings.sort((left, right) => left.assetId.localeCompare(right.assetId)
    || left.usage.kind.localeCompare(right.usage.kind)
    || left.usage.ownerId.localeCompare(right.usage.ownerId));
  const basePetCards = petCards.map(({ id, coverEntryId, href }) => ({ id, coverEntryId, ...(href ? { href } : {}) }));
  basePetCards.sort((left, right) => left.id.localeCompare(right.id));
  return { bindings, petCards: basePetCards };
}

export function serializeStaticUsageIndex(indexed) {
  return `${JSON.stringify(indexed, null, 2)}\n`;
}

export function assertStaticUsageSnapshotFresh(indexed, currentSource) {
  if (currentSource !== serializeStaticUsageIndex(indexed)) {
    throw new Error("Media Desk static usage snapshot is stale; run node tools/media-desk/index-static-usage.mjs");
  }
}

async function runCli() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const [{ mediaEntries }, { petProjectCardsBase }] = await Promise.all([
    import("../../src/data/media/entries/index.ts"),
    import("../../src/data/subproject-cards.ts"),
  ]);
  const indexed = buildStaticUsageIndex(mediaEntries, petProjectCardsBase);
  const output = path.join(root, "src", "data", "media", "static-usage.generated.json");
  if (process.argv.includes("--check")) {
    assertStaticUsageSnapshotFresh(indexed, await readFile(output, "utf8"));
  } else {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, serializeStaticUsageIndex(indexed), "utf8");
  }
  process.stdout.write(
    `[media-desk-static-usage] ${indexed.bindings.length} blocking bindings\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runCli();
}
