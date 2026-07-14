import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 4173;
const baseUrl = `http://${host}:${port}`;
const allowedConsoleFragments = ["WebGL", "THREE.WebGLRenderer", "GL_INVALID", "GPU stall"];
const isWindows = process.platform === "win32";

const preview = spawn(
  isWindows ? "npm.cmd" : "npm",
  ["run", "preview", "--", "--host", host, "--port", String(port)],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    detached: !isWindows,
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

  preview.stdout.destroy();
  preview.stderr.destroy();
}

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

async function sampleScene(page) {
  return page.evaluate(() => {
    const scene = document.querySelector("#jestei-process-scene");
    const reveals = [...(scene?.querySelectorAll("[data-process-reveal]") || [])];
    return {
      frame: Number(scene?.dataset.processFrame || 0),
      revealCount: reveals.length,
      signature: reveals
        .map((reveal) => `${reveal.getAttribute("data-process-reveal")}:${reveal.style.strokeDasharray}:${reveal.style.strokeDashoffset}`)
        .join("|"),
    };
  });
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

  try {
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
        audienceAvatar: isHidden(
          document.querySelector("#jestei-results .jestei-bento__audience-avatar"),
        ),
      };
    });

    if (Object.values(hiddenDecorations).some((hidden) => !hidden)) {
      throw new Error(`${testCase.name}: temporary decorations are visible: ${JSON.stringify(hiddenDecorations)}`);
    }

    const firstSample = await sampleScene(page);
    await page.waitForTimeout(900);
    const secondSample = await sampleScene(page);

    const masksChanged = firstSample.signature !== secondSample.signature;
    const frameAdvanced = secondSample.frame > firstSample.frame;

    if (!firstSample.revealCount || !secondSample.revealCount) {
      throw new Error(`${testCase.name}: process scene has no normalized reveal masks`);
    }

    if (!masksChanged || !frameAdvanced) {
      throw new Error(
        `${testCase.name}: process scene is static. first=${JSON.stringify(firstSample)} second=${JSON.stringify(secondSample)}`,
      );
    }

    if (consoleErrors.length) {
      throw new Error(`${testCase.name}: console errors:\n${consoleErrors.join("\n")}`);
    }

    console.log(`${testCase.name}: passed`, {
      firstFrame: firstSample.frame,
      secondFrame: secondSample.frame,
      revealCount: secondSample.revealCount,
      hiddenDecorations,
    });
  } finally {
    await context.close();
  }
}

let browser;
const globalTimeout = setTimeout(() => {
  console.error("Jestei process regression exceeded 150 seconds");
  void stopPreview().finally(() => process.exit(1));
}, 150_000);

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
  clearTimeout(globalTimeout);
  await browser?.close();
  await stopPreview();
}
