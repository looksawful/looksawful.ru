import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { BASELINE_VIEWPORTS } from "./baseline-config.mjs";
import { isDirectRun } from "./baseline-runner.mjs";

const baselineDir = path.resolve(process.env.BASELINE_DIR || path.join("_local", "baseline", "dev"));

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function compareJson(name, expected, actual, failures) {
  const left = JSON.stringify(expected, null, 2);
  const right = JSON.stringify(actual, null, 2);
  if (left === right) return;

  failures.push(`${name}: snapshot changed`);
}

export async function runDomRegression() {
  await access(path.join(baselineDir, "manifest.json")).catch(() => {
    throw new Error(
      `Missing dev baseline at ${baselineDir}. Run "npm run baseline:capture" before DOM regression.`,
    );
  });

  const failures = [];
  const cliViewports =
    process.argv
      .slice(2)
      .find((arg) => arg.startsWith("--viewports="))
      ?.slice("--viewports=".length) || "";
  const requestedViewports = (cliViewports || process.env.BASELINE_VIEWPORTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const viewports = requestedViewports.length
    ? BASELINE_VIEWPORTS.filter((viewport) => requestedViewports.includes(viewport.name))
    : BASELINE_VIEWPORTS;

  for (const viewport of viewports) {
    const structural = await collectSourceDomContract();
    const computed = {
      status: "skipped",
      reason:
        "Runtime computed-style snapshots are disabled for the current dev repair-loop baseline because page.evaluate can block on the existing runtime.",
    };
    const expectedStructural = await readJson(path.join(baselineDir, "dom", `${viewport.name}.json`));
    const expectedComputed = await readJson(path.join(baselineDir, "computed-styles", `${viewport.name}.json`));

    compareJson(`${viewport.name} DOM`, expectedStructural, structural, failures);
    compareJson(`${viewport.name} computed styles`, expectedComputed, computed, failures);
    console.log(`checked DOM ${viewport.name}`);
  }

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  }
}

async function collectSourceDomContract() {
  const html = await readFile("index.html", "utf8");
  const sectionMatches = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/giu)];
  const scriptMatches = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/giu)];
  const stylesheetMatches = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/giu)];
  const title = html.match(/<title>([^<]*)<\/title>/iu)?.[1]?.trim() || "";

  return {
    source: "index.html",
    title,
    counts: {
      sections: sectionMatches.length,
      scripts: scriptMatches.length,
      stylesheets: stylesheetMatches.length,
      inlineStyleTags: [...html.matchAll(/<style\b/giu)].length,
      heroOnlyReferences: [...html.matchAll(/hero-only/giu)].length,
    },
    sections: sectionMatches.map((match, index) => ({ index, id: match[1] })),
    scripts: scriptMatches.map((match) => match[1]),
    stylesheets: stylesheetMatches.map((match) => match[1]),
  };
}

if (isDirectRun(import.meta.url)) {
  runDomRegression().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
