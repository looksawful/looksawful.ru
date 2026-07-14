import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { chromium } from "playwright";
import { npmCommand } from "./baseline-runner.mjs";

const host = "127.0.0.1";
const port = 4173;
const baseUrl = `http://${host}:${port}`;
const isWindows = process.platform === "win32";
const cardSelector = '#jestei-results [data-bento-card="manual"]';
const sceneSelector = `${cardSelector} #jestei-process-scene`;

const npmPreview = npmCommand(["run", "preview", "--", "--host", host, "--port", String(port)]);
const preview = spawn(npmPreview.command, npmPreview.args, {
  stdio: ["ignore", "pipe", "pipe"],
  detached: !isWindows,
  env: process.env,
  windowsHide: true,
});

let previewOutput = "";
preview.stdout.on("data", (chunk) => (previewOutput += chunk.toString()));
preview.stderr.on("data", (chunk) => (previewOutput += chunk.toString()));

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
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
}

async function waitForServer() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview did not start.\n${previewOutput}`);
}

function assert(condition, message, details) {
  if (!condition) {
    throw new Error(details ? `${message}: ${JSON.stringify(details)}` : message);
  }
}

async function sample(page) {
  return page.evaluate((selector) => {
    const scene = document.querySelector(selector);
    const rect = scene?.getBoundingClientRect();
    const reveals = [...(scene?.querySelectorAll("[data-process-reveal]") || [])];
    const strokes = [...(scene?.querySelectorAll(".jestei-process__stroke") || [])];
    return {
      exists: Boolean(scene),
      visible: Boolean(rect && rect.width > 1 && rect.height > 1),
      state: scene?.dataset.processState || "",
      frame: Number(scene?.dataset.processFrame || 0),
      target: scene?.dataset.finalProcessTarget || "",
      revealCount: reveals.length,
      strokeCount: strokes.length,
      unmaskedStrokeCount: strokes.filter((item) => !item.hasAttribute("mask")).length,
      signature: reveals
        .map((item) => `${item.style.strokeDasharray}:${item.style.strokeDashoffset}`)
        .join("|"),
    };
  }, sceneSelector);
}

async function runCase(browser, testCase) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    reducedMotion: testCase.reducedMotion,
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/?process-v2=${testCase.name}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.evaluate((selector) => {
      document.querySelector(selector)?.scrollIntoView({ block: "center", inline: "nearest" });
    }, cardSelector);

    await page.waitForFunction(
      (selector) => {
        const scene = document.querySelector(selector);
        const rect = scene?.getBoundingClientRect();
        return Boolean(scene && rect && rect.width > 1 && rect.height > 1);
      },
      sceneSelector,
      { timeout: 30000 },
    );

    await page.evaluate((selector) => {
      document.querySelector(selector)?.scrollIntoView({ block: "center", inline: "nearest" });
    }, cardSelector);

    await page.waitForFunction(
      ({ selector, staticMode }) => {
        const scene = document.querySelector(selector);
        if (!scene) return false;
        const rect = scene.getBoundingClientRect();
        const state = scene.dataset.processState || "";
        const visible = rect.width > 1 && rect.height > 1;
        return visible && (staticMode ? state === "static" : state === "running");
      },
      { selector: sceneSelector, staticMode: testCase.reducedMotion === "reduce" },
      { timeout: 30000 },
    );

    const first = await sample(page);
    await page.waitForTimeout(1000);
    const second = await sample(page);

    assert(first.exists && second.exists, `${testCase.name}: scene is missing`, { first, second });
    assert(first.visible && second.visible, `${testCase.name}: scene is hidden`, { first, second });
    assert(second.revealCount > 0, `${testCase.name}: reveal helpers are missing`, second);
    assert(second.strokeCount > 0, `${testCase.name}: process strokes are missing`, second);
    assert(
      second.unmaskedStrokeCount === second.strokeCount,
      `${testCase.name}: process strokes are masked again`,
      second,
    );

    if (testCase.reducedMotion === "reduce") {
      assert(second.state === "static", `${testCase.name}: scene is not static`, second);
      assert(first.frame === second.frame, `${testCase.name}: static frame changed`, { first, second });
      assert(first.signature === second.signature, `${testCase.name}: static reveals changed`, { first, second });
    } else {
      assert(second.state === "running", `${testCase.name}: scene is not running`, second);
      assert(second.frame > first.frame, `${testCase.name}: frame did not advance`, { first, second });
      assert(second.target === "visible", `${testCase.name}: wrong target card`, second);
    }

    console.log(`${testCase.name}: passed`, second);
  } finally {
    await context.close();
  }
}

let browser;
const timeout = setTimeout(() => {
  console.error("Jestei process v2 regression exceeded 120 seconds");
  void stopPreview().finally(() => process.exit(1));
}, 120000);

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  for (const testCase of [
    { name: "desktop", viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" },
    { name: "mobile", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" },
    { name: "mobile-reduced", viewport: { width: 390, height: 844 }, reducedMotion: "reduce" },
  ]) {
    await runCase(browser, testCase);
  }
} finally {
  clearTimeout(timeout);
  await browser?.close();
  await stopPreview();
}
