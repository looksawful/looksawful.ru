import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 4173;
const baseUrl = `http://${host}:${port}`;
const manualCardSelector = '#jestei-results [data-bento-card="manual"]';
const sceneSelector = `${manualCardSelector} #jestei-process-scene`;
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
  return page.evaluate((selector) => {
    const scenes = [...document.querySelectorAll(selector)];
    const scene =
      scenes.find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return (
          rect.width > 1 &&
          rect.height > 1 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0
        );
      }) || scenes[0];
    const reveals = [...(scene?.querySelectorAll("[data-process-reveal]") || [])];
    return {
      state: scene?.dataset.processState || "",
      frame: Number(scene?.dataset.processFrame || 0),
      revealCount: reveals.length,
      target: scene?.dataset.finalProcessTarget || "",
      signature: reveals
        .map(
          (reveal) =>
            `${reveal.getAttribute("data-process-reveal")}:${reveal.style.strokeDasharray}:${reveal.style.strokeDashoffset}`,
        )
        .join("|"),
    };
  }, sceneSelector);
}

async function pageDiagnostics(page) {
  return page.evaluate(() => ({
    readyState: document.readyState,
    mainExists: Boolean(document.querySelector("#main")),
    coverExists: Boolean(document.querySelector("#jestei-cover")),
    resultsExists: Boolean(document.querySelector("#jestei-results")),
    finalRepairs: document.documentElement.dataset.finalSiteRepairs || "",
    sectionIds: [...document.querySelectorAll("#main > section, #main > [id]")]
      .map((element) => element.id)
      .filter(Boolean),
  }));
}

async function runCase(browser, testCase) {
  const context = await browser.newContext({
    viewport: testCase.viewport,
    reducedMotion: testCase.reducedMotion,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const expectsStatic = testCase.reducedMotion === "reduce";

  page.on("console", (message) => {
    if (message.type() === "error" && !isAllowedConsoleError(message.text())) {
      consoleErrors.push(message.text());
    }
  });

  try {
    await page.goto(
      `${baseUrl}/?jestei-process-regression=${encodeURIComponent(testCase.name)}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      },
    );

    const visibleCard = page.locator(manualCardSelector).first();
    try {
      await visibleCard.waitFor({ state: "attached", timeout: 30_000 });
    } catch (error) {
      const diagnostics = await pageDiagnostics(page);
      throw new Error(
        `${testCase.name}: manual card was not published. diagnostics=${JSON.stringify(diagnostics)} console=${JSON.stringify(consoleErrors)} original=${error.message}`,
      );
    }

    await visibleCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_000);

    await page.waitForFunction(
      ({ staticMode, selector }) => {
        const scenes = [...document.querySelectorAll(selector)];
        const scene =
          scenes.find((candidate) => {
            const rect = candidate.getBoundingClientRect();
            const style = getComputedStyle(candidate);
            return (
              rect.width > 1 &&
              rect.height > 1 &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              Number(style.opacity) > 0
            );
          }) || scenes[0];
        return staticMode
          ? scene?.dataset.processState === "static"
          : scene?.dataset.processState === "running";
      },
      { staticMode: expectsStatic, selector: sceneSelector },
      { timeout: 20_000 },
    );

    const hiddenDecorations = await page.evaluate(() => {
      const isHidden = (element) => {
        if (!element) return true;
        const style = getComputedStyle(element);
        return (
          element.hidden ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) === 0
        );
      };

      return {
        interfaceArchive: isHidden(document.querySelector("#jestei-interface-archive")),
        rebrandEquation: isHidden(
          document.querySelector(
            '#jestei-results [data-bento-card="rebrand"] .jestei-bento__logo-inspector',
          ),
        ),
        audienceAvatar: isHidden(
          document.querySelector("#jestei-results .jestei-bento__audience-avatar"),
        ),
      };
    });

    if (Object.values(hiddenDecorations).some((hidden) => !hidden)) {
      throw new Error(
        `${testCase.name}: temporary decorations are visible: ${JSON.stringify(hiddenDecorations)}`,
      );
    }

    const firstSample = await sampleScene(page);
    await page.waitForTimeout(900);
    const secondSample = await sampleScene(page);

    if (!firstSample.revealCount || !secondSample.revealCount) {
      throw new Error(`${testCase.name}: process scene has no normalized reveal masks`);
    }

    if (expectsStatic) {
      const masksStable = firstSample.signature === secondSample.signature;
      const frameStable = secondSample.frame === firstSample.frame;

      if (!masksStable || !frameStable || secondSample.state !== "static") {
        throw new Error(
          `${testCase.name}: reduced-motion scene is not static. first=${JSON.stringify(firstSample)} second=${JSON.stringify(secondSample)}`,
        );
      }
    } else {
      const masksChanged = firstSample.signature !== secondSample.signature;
      const frameAdvanced = secondSample.frame > firstSample.frame;

      if (!masksChanged || !frameAdvanced || secondSample.target !== "visible") {
        throw new Error(
          `${testCase.name}: visible production scene is static or mounted on the wrong card. first=${JSON.stringify(firstSample)} second=${JSON.stringify(secondSample)}`,
        );
      }
    }

    if (consoleErrors.length) {
      throw new Error(`${testCase.name}: console errors:\n${consoleErrors.join("\n")}`);
    }

    console.log(`${testCase.name}: passed`, {
      state: secondSample.state,
      firstFrame: firstSample.frame,
      secondFrame: secondSample.frame,
      revealCount: secondSample.revealCount,
      target: secondSample.target,
      hiddenDecorations,
    });
  } finally {
    await context.close();
  }
}

let browser;
const globalTimeout = setTimeout(() => {
  console.error("Jestei process regression exceeded 180 seconds");
  void stopPreview().finally(() => process.exit(1));
}, 180_000);

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
