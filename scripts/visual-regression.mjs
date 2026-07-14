import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

import { captureDevBaseline } from "./capture-dev-baseline.mjs";
import { isDirectRun, prepareOutputDirectory } from "./baseline-runner.mjs";

const baselineDir = path.resolve(process.env.BASELINE_DIR || path.join("_local", "baseline", "dev"));
const currentDir = path.resolve(process.env.CURRENT_BASELINE_DIR || path.join("_local", "baseline", "current"));
const maxDiffRatio = Number(process.env.VISUAL_MAX_DIFF_RATIO || 0.006);
const channelThreshold = Number(process.env.VISUAL_CHANNEL_THRESHOLD || 28);

async function listPngFiles(root, dir = root) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listPngFiles(root, next)));
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      files.push(path.relative(root, next));
    }
  }

  return files.sort();
}

async function comparePng(relativePath) {
  const expectedPath = path.join(baselineDir, relativePath);
  const actualPath = path.join(currentDir, relativePath);
  const [expectedMeta, actualMeta] = await Promise.all([
    sharp(expectedPath).metadata(),
    sharp(actualPath).metadata(),
  ]);

  if (expectedMeta.width !== actualMeta.width || expectedMeta.height !== actualMeta.height) {
    return {
      relativePath,
      status: "failed",
      reason: `size changed ${expectedMeta.width}x${expectedMeta.height} -> ${actualMeta.width}x${actualMeta.height}`,
    };
  }

  const [expected, actual] = await Promise.all([
    sharp(expectedPath).ensureAlpha().raw().toBuffer(),
    sharp(actualPath).ensureAlpha().raw().toBuffer(),
  ]);

  let diffPixels = 0;
  for (let index = 0; index < expected.length; index += 4) {
    const changed =
      Math.abs(expected[index] - actual[index]) > channelThreshold ||
      Math.abs(expected[index + 1] - actual[index + 1]) > channelThreshold ||
      Math.abs(expected[index + 2] - actual[index + 2]) > channelThreshold ||
      Math.abs(expected[index + 3] - actual[index + 3]) > channelThreshold;

    if (changed) diffPixels += 1;
  }

  const totalPixels = expected.length / 4;
  const diffRatio = diffPixels / totalPixels;

  return {
    relativePath,
    status: diffRatio <= maxDiffRatio ? "passed" : "failed",
    diffPixels,
    totalPixels,
    diffRatio,
  };
}

export async function runVisualRegression() {
  await readFile(path.join(baselineDir, "manifest.json"), "utf8").catch(() => {
    throw new Error(
      `Missing dev baseline at ${baselineDir}. Run "npm run baseline:capture" before visual regression.`,
    );
  });

  await prepareOutputDirectory(currentDir);
  await captureDevBaseline({ outputDir: currentDir, interactions: false });

  const expectedFiles = await listPngFiles(baselineDir);
  const actualFiles = await listPngFiles(currentDir);
  const actualSet = new Set(actualFiles);
  const failures = [];

  for (const file of expectedFiles) {
    if (!actualSet.has(file)) {
      failures.push(`${file}: current screenshot is missing`);
      continue;
    }

    const result = await comparePng(file);
    if (result.status === "failed") {
      failures.push(
        `${file}: ${result.reason || `diff ${(result.diffRatio * 100).toFixed(3)}% (${result.diffPixels}/${result.totalPixels})`}`,
      );
    } else {
      console.log(`${file}: diff ${(result.diffRatio * 100).toFixed(3)}%`);
    }
  }

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  }
}

if (isDirectRun(import.meta.url)) {
  runVisualRegression().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
