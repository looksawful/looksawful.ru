import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 4173;
const baseUrl = `http://${host}:${port}`;
const allowedConsoleFragments = ["WebGL", "THREE.WebGLRenderer", "GL_INVALID", "GPU stall"];

const preview = spawn(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "preview", "--", "--host", host, "--port", String(port)],
  { stdio: ["ignore", "pipe", "pipe"], env: process.env },
);

let previewOutput = "";
preview.stdout.on("data", (chunk) => {
  previewOutput += chunk.toString();
});
preview.stderr.on("data", (chunk) => {
  previewOutput += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.ok || response.status === 304) return;
    } catch {
      // The preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not start.\n${previewOutput}`);
}

function isAllowedConsoleError(text) {
  return allowedConsoleFragments.some((fragment) => text.includes(fragment));
}

async function runCase(browser, testCase) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    reducedMotion: testCase.reducedMotion,
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error" && !isAllowedConsoleError(message.text())) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto(`${baseUrl}/?static=1&jestei-process-regression=${encodeURIComponent(testCase.name)}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  const card = page.locator('#jestei-results .jestei-bento__card--manual');
  await card.waitFor({ state: "visible", timeout: 30_000 });
  await card.scrollIntoViewIfNeeded();

  const svg = page.locator("#jestei-process-scene");
  await svg.waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(() => {
    const scene = document.querySelector("#jestei-process-scene");
    return scene?.dataset.processState === "running";
  }, null, { timeout: 10_000 });

  const hiddenDecorations = await page.evaluate(() => {
    const isHidden = (element) => {
      if (!element) return true;
      const style = getComputedStyle(element);
      return element.hidden || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0;
    };

    return {
      interfaceArchive: isHidden(document.querySelector("#jestei-interface-archive")),
      rebrandEquation: isHidden(
        document.querySelector('#jestei-results [data-bento-card="rebrand"] .jestei-bento__logo-inspector'),
      ),
    };
  });

  if (!hiddenDecorations.interfaceArchive || !hiddenDecorations.rebrandEquation) {
    throw new Error(`${testCase.name}: temporary decorations are visible: ${JSON.stringify(hiddenDecorations)}`);
  }

  const firstSample = await page.evaluate(() => {
    const scene = document.querySelector("#jestei-process-scene");
    const reveal = scene?.querySelector("[data-process-reveal], #jestei-process-defs mask path");
    return {
      frame: Number(scene?.dataset.processFrame || 0),
      dasharray: reveal?.style.strokeDasharray || "",
      dashoffset: reveal?.style.strokeDashoffset || "",
    };
  });

  await page.waitForTimeout(900);

  const secondSample = await page.evaluate(() => {
    const scene = document.querySelector("#jestei-process-scene");
    const reveal = scene?.querySelector("[data-process-reveal], #jestei-process-defs mask path");
    return {
      frame: Number(scene?.dataset.processFrame || 0),
      dasharray: reveal?.style.strokeDasharray || "",
      dashoffset: reveal?.style.strokeDashoffset || "",
    };
  });

  const maskChanged =
    firstSample.dasharray !== secondSample.dasharray ||
    firstSample.dashoffset !== secondSample.dashoffset;
  const frameAdvanced = secondSample.frame > firstSample.frame;

  if (!maskChanged && !frameAdvanced) {
    throw new Error(
      `${testCase.name}: process scene is static. first=${JSON.stringify(firstSample)} second=${JSON.stringify(secondSample)}`,
    );
  }

  if (consoleErrors.length) {
    throw new Error(`${testCase.name}: console errors:\n${consoleErrors.join("\n")}`);
  }

  await context.close();
  console.log(`${testCase.name}: passed`, { firstSample, secondSample, hiddenDecorations });
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  const cases = [
    {
      name: "desktop",
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "no-preference",
    },
    {
      name: "mobile",
      viewport: { width: 390, height: 844 },
      reducedMotion: "no-preference",
    },
    {
      name: "mobile-reduced-motion",
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    },
  ];

  for (const testCase of cases) {
    await runCase(browser, testCase);
  }
} finally {
  await browser?.close();
  preview.kill("SIGTERM");
}
