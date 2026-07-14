import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

import { BASELINE_SECTION_IDS, BASELINE_VIEWPORTS } from "./baseline-config.mjs";
import {
  captureInteractionStates,
  isAllowedConsoleIssue,
  isDirectRun,
  prepareOutputDirectory,
  sanitizeSegment,
  waitForHomepage,
  withPreviewServer,
  writeJson,
} from "./baseline-runner.mjs";

export async function captureDevBaseline(options = {}) {
  const cli = parseArgs(process.argv.slice(2));
  const requestedViewports = (options.viewports || cli.viewports || process.env.BASELINE_VIEWPORTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const screenshotsEnabled =
    options.screenshots ?? (process.env.BASELINE_SCREENSHOTS !== "0" && !cli.noScreenshots);
  const fullPageEnabled =
    screenshotsEnabled && (process.env.BASELINE_FULL_PAGE !== "0" && !cli.noFullPage);
  const interactionsEnabled =
    options.interactions ?? (process.env.BASELINE_INTERACTIONS === "1" || cli.interactions);
  const viewports = requestedViewports.length
    ? BASELINE_VIEWPORTS.filter((viewport) => requestedViewports.includes(viewport.name))
    : BASELINE_VIEWPORTS;

  if (!viewports.length) {
    throw new Error(`No baseline viewports matched BASELINE_VIEWPORTS=${process.env.BASELINE_VIEWPORTS}`);
  }

  const outputDir = await prepareOutputDirectory(
    options.outputDir || process.env.BASELINE_DIR || path.join("_local", "baseline", "dev"),
  );
  const motion = process.env.BASELINE_REDUCED_MOTION === "0" ? "no-preference" : "reduce";
  const manifest = {
    kind: "looksawful-dev-baseline",
    capturedAt: new Date().toISOString(),
    branch: await gitValue(["branch", "--show-current"]),
    commit: await gitValue(["rev-parse", "HEAD"]),
    motion,
    screenshots: screenshotsEnabled,
    fullPageScreenshots: fullPageEnabled,
    interactions: interactionsEnabled,
    viewports,
    browser: "chromium",
    browserPath: "Playwright chromium",
    outputDir,
    pages: [],
  };

  await withPreviewServer(async (baseUrl) => {
    manifest.baseUrl = baseUrl;
    const browser = await chromium.launch({ headless: true });

    try {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          reducedMotion: motion,
        });
        const page = await context.newPage();
        page.setDefaultTimeout(8_000);
        page.setDefaultNavigationTimeout(60_000);
        const consoleIssues = [];
        const requestIssues = [];
        const captureIssues = [];

        page.on("console", (message) => {
          if (["error", "warning"].includes(message.type()) && !isAllowedConsoleIssue(message.text())) {
            consoleIssues.push({ type: message.type(), text: message.text() });
          }
        });
        page.on("requestfailed", (request) => {
          const failure = request.failure()?.errorText || "";
          if (!failure.includes("net::ERR_ABORTED")) {
            requestIssues.push(`${request.method()} ${request.url()} ${failure}`.trim());
          }
        });

        try {
          console.log(`capturing ${viewport.name}: navigate`);
          await page.goto(`${baseUrl}/?baseline=dev`, {
            waitUntil: "domcontentloaded",
            timeout: 60_000,
          });
          console.log(`capturing ${viewport.name}: stabilize`);
          await waitForHomepage(page);

          const viewportDir = path.join(outputDir, "screenshots", viewport.name);
          const sectionDir = path.join(viewportDir, "sections");
          const stateDir = path.join(viewportDir, "states");
          await mkdir(sectionDir, { recursive: true });

          if (fullPageEnabled) {
            console.log(`capturing ${viewport.name}: full-page screenshot`);
            try {
              await page.screenshot({
                path: path.join(viewportDir, "full-page.png"),
                fullPage: true,
                animations: "disabled",
                timeout: 45_000,
              });
            } catch (error) {
              captureIssues.push({
                target: "full-page",
                message: error.message,
                fallback: "viewport.png",
              });
              try {
                await page.screenshot({
                  path: path.join(viewportDir, "viewport.png"),
                  fullPage: false,
                  timeout: 12_000,
                });
              } catch (fallbackError) {
                captureIssues.push({
                  target: "viewport",
                  message: fallbackError.message,
                });
              }
            }
          } else if (screenshotsEnabled) {
            captureIssues.push({
              target: "full-page",
              message: "Skipped by --no-full-page or BASELINE_FULL_PAGE=0.",
            });
          }

          const sections = BASELINE_SECTION_IDS.map((id, index) => ({ id, index }));
          if (screenshotsEnabled) {
            console.log(`capturing ${viewport.name}: section screenshots`);
            for (const section of sections) {
              try {
                console.log(`capturing ${viewport.name}: section ${section.id}`);
                await page.locator(`#${section.id}`).first().screenshot({
                  path: path.join(
                    sectionDir,
                    `${String(section.index).padStart(2, "0")}-${sanitizeSegment(section.id)}.png`,
                  ),
                  animations: "disabled",
                  timeout: 3_000,
                });
              } catch (error) {
                captureIssues.push({
                  target: `section:${section.id}`,
                  message: error.message,
                });
              }
            }
          } else {
            captureIssues.push({
              target: "screenshots",
              message: "Skipped by --no-screenshots or BASELINE_SCREENSHOTS=0.",
            });
          }

          console.log(`capturing ${viewport.name}: source DOM contract`);
          const structural = await collectSourceDomContract();
          const computed = {
            status: "skipped",
            reason:
              "Runtime computed-style snapshots are disabled for the current dev repair-loop baseline because page.evaluate can block on the existing runtime.",
          };
          console.log(`capturing ${viewport.name}: interaction states`);
          const states = await captureInteractionStates(page, stateDir, viewport, {
            enabled: interactionsEnabled,
          });

          await writeJson(path.join(outputDir, "dom", `${viewport.name}.json`), structural);
          await writeJson(path.join(outputDir, "computed-styles", `${viewport.name}.json`), computed);

          manifest.pages.push({
            route: "/",
            viewport,
            sections: sections.map((section) => section.id),
            states,
            consoleIssues,
            requestIssues,
            captureIssues,
          });

          console.log(`captured ${viewport.name}: ${sections.length} tracked sections`);
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  });

  await writeJson(path.join(outputDir, "manifest.json"), manifest);
  return manifest;
}

function parseArgs(args) {
  const result = {
    interactions: false,
    noFullPage: false,
    noScreenshots: false,
    viewports: "",
  };

  for (const arg of args) {
    if (arg === "--interactions") result.interactions = true;
    if (arg === "--no-full-page") result.noFullPage = true;
    if (arg === "--no-screenshots") result.noScreenshots = true;
    if (arg.startsWith("--viewports=")) result.viewports = arg.slice("--viewports=".length);
  }

  return result;
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

async function gitValue(args) {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync("git", args, { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

if (isDirectRun(import.meta.url)) {
  captureDevBaseline().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
