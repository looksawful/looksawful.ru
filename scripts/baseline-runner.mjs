import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  ALLOWED_CONSOLE_PATTERNS,
  BASELINE_INTERACTION_SELECTORS,
  COMPUTED_STYLE_PROPERTIES,
} from "./baseline-config.mjs";

const isWindows = process.platform === "win32";

export function sanitizeSegment(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё._-]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 90) || "unknown";
}

export async function prepareOutputDirectory(outputDir) {
  const cwd = path.resolve(process.cwd());
  const resolved = path.resolve(outputDir);
  const relative = path.relative(cwd, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to clean a baseline directory outside the workspace: ${resolved}`);
  }

  await rm(resolved, { recursive: true, force: true });
  await mkdir(resolved, { recursive: true });
  return resolved;
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rm(filePath, { force: true });
  await import("node:fs/promises").then(({ rename }) => rename(`${filePath}.tmp`, filePath));
}

export function isAllowedConsoleIssue(text) {
  return ALLOWED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
}

export async function withPreviewServer(callback, options = {}) {
  const explicitBaseUrl = process.env.BASELINE_BASE_URL || process.env.PORTFOLIO_BASE_URL || "";
  if (explicitBaseUrl) {
    return callback(explicitBaseUrl.replace(/\/$/u, ""));
  }

  const host = options.host || process.env.BASELINE_HOST || "127.0.0.1";
  const port = Number(options.port || process.env.BASELINE_PORT || 4175);
  const baseUrl = `http://${host}:${port}`;
  const npmPreview = npmCommand([
    "run",
    "preview",
    "--",
    "--host",
    host,
    "--port",
    String(port),
  ]);
  const preview = spawn(
    npmPreview.command,
    npmPreview.args,
    {
      stdio: ["ignore", "pipe", "pipe"],
      detached: !isWindows,
      env: process.env,
      windowsHide: true,
    },
  );

  let previewOutput = "";
  preview.stdout.on("data", (chunk) => {
    previewOutput += chunk.toString();
  });
  preview.stderr.on("data", (chunk) => {
    previewOutput += chunk.toString();
  });

  async function stopPreview() {
    if (preview.exitCode != null || preview.signalCode != null) return;

    if (isWindows) {
      spawnSync("taskkill", ["/pid", String(preview.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      try {
        process.kill(-preview.pid, "SIGTERM");
      } catch {
        preview.kill("SIGTERM");
      }
    }

    await Promise.race([
      once(preview, "exit").catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 3_000)),
    ]);
  }

  try {
    await waitForServer(baseUrl, () => previewOutput);
    return await callback(baseUrl);
  } finally {
    await stopPreview();
  }
}

export function npmCommand(args) {
  if (!isWindows) {
    return { command: "npm", args };
  }

  const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(npmCli)) {
    return { command: process.execPath, args: [npmCli, ...args] };
  }

  return { command: "npm", args };
}

async function waitForServer(baseUrl, getOutput) {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok || response.status === 304) return;
    } catch {
      // The preview process is still booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Preview server did not start at ${baseUrl}.\n${getOutput()}`);
}

export async function waitForHomepage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(Number(process.env.BASELINE_STABILIZE_MS || 5_000));
}

export async function collectStructuralSnapshot(page) {
  return page.evaluate(() => {
    const isElementVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        !element.hidden &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        rect.width > 1 &&
        rect.height > 1
      );
    };

    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };

    const normalizeText = (value) => String(value || "").replace(/\s+/gu, " ").trim();
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    return {
      title: document.title,
      lang: document.documentElement.lang,
      bodyClasses: [...document.body.classList],
      duplicateIds: [...new Set(duplicateIds)].sort(),
      counts: {
        elements: document.querySelectorAll("*").length,
        topLevelSections: document.querySelectorAll("#main > .section").length,
        visibleTopLevelSections: [...document.querySelectorAll("#main > .section")].filter(isElementVisible).length,
        images: document.images.length,
        videos: document.querySelectorAll("video").length,
        canvases: document.querySelectorAll("canvas").length,
        lightboxItems: document.querySelectorAll("[data-lightbox-item], [data-lightbox-video]").length,
        animations: document.querySelectorAll("[data-animation]").length,
      },
      navLinks: [...document.querySelectorAll(".site-header a[href]")].map((link) => ({
        href: link.getAttribute("href"),
        text: normalizeText(link.textContent),
        visible: isElementVisible(link),
      })),
      sections: [...document.querySelectorAll("#main > .section[id]")].map((section, index) => ({
        index,
        id: section.id,
        className: section.className,
        hidden: section.hidden,
        ariaHidden: section.getAttribute("aria-hidden"),
        visible: isElementVisible(section),
        rect: rectOf(section),
        visualSystem: section.getAttribute("data-visual-system") || "",
        family: section.getAttribute("data-section-family") || "",
        headings: [...section.querySelectorAll("h1, h2, h3, [data-section-title], [data-content-title]")]
          .slice(0, 8)
          .map((heading) => normalizeText(heading.textContent)),
      })),
    };
  });
}

export async function collectComputedSnapshot(page, selectors) {
  return page.evaluate(
    ({ requestedSelectors, properties }) => {
      const snapshot = {};

      for (const selector of requestedSelectors) {
        const element = document.querySelector(selector);
        if (!element) {
          snapshot[selector] = null;
          continue;
        }

        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        snapshot[selector] = {
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          styles: Object.fromEntries(properties.map((property) => [property, styles[property]])),
        };
      }

      return snapshot;
    },
    { requestedSelectors: selectors, properties: COMPUTED_STYLE_PROPERTIES },
  );
}

export async function visibleTopLevelSections(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        !element.hidden &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        rect.width > 1 &&
        rect.height > 1
      );
    };

    return [...document.querySelectorAll("#main > .section[id]")]
      .filter(visible)
      .map((section, index) => ({ id: section.id, index }));
  });
}

export async function captureInteractionStates(page, stateDir, viewport, options = {}) {
  if (!options.enabled) {
    return [{ name: "all", status: "skipped", message: "Run with --interactions to capture state screenshots." }];
  }

  const states = [];
  await mkdir(stateDir, { recursive: true });

  const record = async (name, run) => {
    console.log(`capturing ${viewport.name}: state ${name}`);
    try {
      const result = await run();
      states.push({ name, status: result === false ? "skipped" : "captured" });
    } catch (error) {
      states.push({ name, status: "failed", message: error.message });
    }
  };

  await record("horizontal-scroll", async () => {
    const target = page.locator(BASELINE_INTERACTION_SELECTORS.horizontalScroll).first();
    if (!(await target.count())) return false;
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await target.screenshot({ path: path.join(stateDir, "horizontal-scroll.png"), timeout: 8_000 });
    return true;
  });

  await record("lightbox", async () => {
    const trigger = page.locator(BASELINE_INTERACTION_SELECTORS.lightboxTrigger).first();
    if (!(await trigger.count())) return false;
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click({ force: true });
    await page.waitForSelector(BASELINE_INTERACTION_SELECTORS.lightboxRoot, { timeout: 5_000 });
    await page.screenshot({ path: path.join(stateDir, "lightbox.png"), fullPage: false, timeout: 8_000 });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    return true;
  });

  await record("policy-book", async () => {
    const book = page.locator(BASELINE_INTERACTION_SELECTORS.policyBook).first();
    if (!(await book.count())) return false;
    await book.scrollIntoViewIfNeeded();
    const next = page.locator(BASELINE_INTERACTION_SELECTORS.policyNext).first();
    if (await next.count()) {
      await next.click({ force: true });
      await page.waitForTimeout(250);
    }
    await book.screenshot({ path: path.join(stateDir, "policy-book.png"), timeout: 8_000 });
    return true;
  });

  await record("playlist-filter", async () => {
    const root = page.locator(BASELINE_INTERACTION_SELECTORS.playlistFilterRoot).first();
    if (!(await root.count())) return false;
    await root.scrollIntoViewIfNeeded();
    const button = root.locator(BASELINE_INTERACTION_SELECTORS.playlistFilterButton).first();
    if (await button.count()) {
      await button.click({ force: true });
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(stateDir, "playlist-filter-open.png"),
        fullPage: false,
        timeout: 8_000,
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
    } else {
      await root.screenshot({ path: path.join(stateDir, "playlist-filter.png"), timeout: 8_000 });
    }
    return true;
  });

  await record("pet-project-dialog", async () => {
    const button = page.locator(BASELINE_INTERACTION_SELECTORS.petProjectButton).first();
    if (!(await button.count())) return false;
    await button.scrollIntoViewIfNeeded();
    await button.click({ force: true });
    const modal = page.locator(BASELINE_INTERACTION_SELECTORS.petProjectModal).first();
    await modal.waitFor({ state: "visible", timeout: 5_000 });
    await page.screenshot({
      path: path.join(stateDir, "pet-project-dialog.png"),
      fullPage: false,
      timeout: 8_000,
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    return true;
  });

  if (viewport.width <= 768) {
    await record("mobile-navigation", async () => {
      const trigger = page.locator(BASELINE_INTERACTION_SELECTORS.navTrigger).first();
      if (!(await trigger.count())) return false;
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await trigger.click({ force: true });
      await page.waitForTimeout(250);
      await page.screenshot({
        path: path.join(stateDir, "mobile-navigation.png"),
        fullPage: false,
        timeout: 8_000,
      });
      return true;
    });
  }

  await record("canvas-stabilized", async () => {
    const count = Math.min(await page.locator("canvas").count(), 6);

    if (!count) return false;

    for (let index = 0; index < count; index += 1) {
      await page.locator("canvas").nth(index).screenshot({
        path: path.join(stateDir, `canvas-${String(index).padStart(2, "0")}.png`),
        timeout: 8_000,
      });
    }
    return true;
  });

  return states;
}

export function isDirectRun(metaUrl) {
  return metaUrl === pathToFileURL(process.argv[1]).href;
}
