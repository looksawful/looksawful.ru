import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);

function firstLine(value) {
  return String(value ?? "").split(/\r?\n/, 1)[0].trim();
}

function runVersion(command, args = ["--version"]) {
  try {
    return {
      available: true,
      version: firstLine(execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })),
    };
  } catch (error) {
    return {
      available: false,
      version: null,
      error: error?.code === "ENOENT" ? "not found" : firstLine(error?.message),
    };
  }
}

function packageVersion(packageName) {
  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const manifest = JSON.parse(readFileSync(packagePath, "utf8"));
    return { available: true, version: manifest.version, packagePath };
  } catch (error) {
    return { available: false, version: null, packagePath: null, error: firstLine(error?.message) };
  }
}

function expectedNodeEngine() {
  try {
    const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    return manifest.engines?.node ?? null;
  } catch {
    return null;
  }
}

async function browserReport({ launchBrowser = false } = {}) {
  const playwright = packageVersion("playwright");
  if (!playwright.available) {
    return {
      package: playwright,
      chromium: { executablePath: null, installed: false, launch: "unavailable" },
    };
  }

  try {
    const { chromium } = await import("playwright");
    const executablePath = chromium.executablePath();
    const installed = existsSync(executablePath);
    let launch = launchBrowser ? "failed" : "not_checked";
    let launchError = null;

    if (launchBrowser && installed) {
      try {
        const browser = await chromium.launch({ headless: true });
        await browser.close();
        launch = "ok";
      } catch (error) {
        launchError = firstLine(error?.message);
      }
    } else if (launchBrowser && !installed) {
      launch = "missing_executable";
    }

    return {
      package: playwright,
      chromium: { executablePath, installed, launch, launchError },
    };
  } catch (error) {
    return {
      package: playwright,
      chromium: {
        executablePath: null,
        installed: false,
        launch: "unavailable",
        launchError: firstLine(error?.message),
      },
    };
  }
}

export async function collectToolchainReport(options = {}) {
  return {
    schemaVersion: 1,
    platform: process.platform,
    arch: process.arch,
    node: {
      available: true,
      version: process.version,
      expectedEngine: expectedNodeEngine(),
    },
    npm: runVersion("npm"),
    playwright: await browserReport(options),
    ffmpeg: runVersion("ffmpeg", ["-version"]),
    ffprobe: runVersion("ffprobe", ["-version"]),
  };
}

function renderHuman(report) {
  const browser = report.playwright.chromium;
  const rows = [
    ["Node", report.node.version, `expected ${report.node.expectedEngine ?? "unspecified"}`],
    ["npm", report.npm.version ?? "missing", report.npm.available ? "available" : report.npm.error],
    ["Playwright", report.playwright.package.version ?? "missing", report.playwright.package.available ? "package available" : report.playwright.package.error],
    ["Chromium", browser.installed ? "installed" : "missing", browser.executablePath ?? "no executable path"],
    ["Chromium launch", browser.launch, browser.launchError ?? ""],
    ["FFmpeg", report.ffmpeg.version ?? "missing", report.ffmpeg.available ? "available" : report.ffmpeg.error],
    ["ffprobe", report.ffprobe.version ?? "missing", report.ffprobe.available ? "available" : report.ffprobe.error],
  ];

  for (const [name, value, detail] of rows) {
    console.log(`${name}: ${value}${detail ? ` (${detail})` : ""}`);
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const json = process.argv.includes("--json");
  const launchBrowser = process.argv.includes("--launch-browser");
  const report = await collectToolchainReport({ launchBrowser });
  if (json) console.log(JSON.stringify(report, null, 2));
  else renderHuman(report);
}
