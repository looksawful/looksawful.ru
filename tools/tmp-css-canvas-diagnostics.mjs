import { withE2ERuntime } from "./e2e/runtime.mjs";

const VIEWPORT = { width: 390, height: 844 };
const SETTLE_MS = 5_500;

function sameOrigin(url, baseUrl) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

async function scrollThroughPage(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const step = Math.max(240, Math.floor(innerHeight * 0.7));
    for (let y = 0; y <= max; y += step) {
      scrollTo(0, y);
      await delay(80);
    }
    scrollTo(0, 0);
  });
}

async function collectCanvasDiagnostics({ browser, baseUrl }) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const requestFailures = [];
  const responseFailures = [];
  const consoleErrors = [];

  page.on("requestfailed", (request) => {
    requestFailures.push({
      url: request.url(),
      resourceType: request.resourceType(),
      errorText: request.failure()?.errorText || "unknown",
    });
  });

  page.on("response", (response) => {
    if (response.status() < 400) return;
    const request = response.request();
    responseFailures.push({
      url: response.url(),
      status: response.status(),
      resourceType: request.resourceType(),
      sameOrigin: sameOrigin(response.url(), baseUrl),
    });
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    consoleErrors.push(message.text());
  });

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForLoadState("load", { timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await scrollThroughPage(page);
    await page.waitForTimeout(SETTLE_MS);

    const hosts = await page.evaluate(() => {
      const absolute = (value) => {
        if (!value) return "";
        try {
          return new URL(value, location.href).href;
        } catch {
          return value;
        }
      };

      return [...document.querySelectorAll("[data-animated-canvas-gallery]")].map((node, index) => {
        const canvas = node.querySelector("canvas");
        const rect = canvas?.getBoundingClientRect();
        const project = node.closest(".project, [data-project-id], [data-project], [id^='project-']");
        const section = node.closest("section, [data-section], [data-section-id]");
        const heading = (project || section)?.querySelector("h1, h2, h3, [data-project-title]");
        const jsonPayload = node.querySelector(":scope > script[type='application/json'][data-gallery-items]");
        let jsonSources = [];
        if (jsonPayload?.textContent) {
          try {
            const parsed = JSON.parse(jsonPayload.textContent);
            if (Array.isArray(parsed)) {
              jsonSources = parsed.map((item) => absolute(item?.src || "")).filter(Boolean);
            }
          } catch {}
        }
        const fallbackSources = [...node.querySelectorAll("[data-gallery-fallback] img")]
          .flatMap((image) => [
            absolute(image.getAttribute("src") || ""),
            absolute(image.getAttribute("data-fallback-src") || ""),
          ])
          .filter(Boolean);
        const sources = [...new Set([...jsonSources, ...fallbackSources])];

        return {
          index,
          state: node.getAttribute("data-gallery-state"),
          profile: node.getAttribute("data-gallery-profile"),
          variant: node.getAttribute("data-gallery-variant"),
          project: {
            id: project?.id || "",
            projectId: project?.getAttribute("data-project-id") || project?.getAttribute("data-project") || "",
            className: project instanceof HTMLElement ? project.className : "",
          },
          section: {
            id: section?.id || "",
            sectionId: section?.getAttribute("data-section-id") || section?.getAttribute("data-section") || "",
            className: section instanceof HTMLElement ? section.className : "",
          },
          heading: heading?.textContent?.trim().slice(0, 160) || "",
          sourceCount: sources.length,
          sourceSample: sources.slice(0, 8),
          canvas: {
            present: canvas instanceof HTMLCanvasElement,
            cssWidth: rect?.width || 0,
            cssHeight: rect?.height || 0,
            bitmapWidth: canvas instanceof HTMLCanvasElement ? canvas.width : 0,
            bitmapHeight: canvas instanceof HTMLCanvasElement ? canvas.height : 0,
          },
        };
      });
    });

    const failedHosts = hosts.filter((host) => host.state === "error");
    const report = {
      viewport: VIEWPORT,
      url: baseUrl,
      failedHostCount: failedHosts.length,
      failedHosts,
      allHosts: hosts,
      requestFailures,
      responseFailures,
      consoleErrors,
    };

    console.log(JSON.stringify(report, null, 2));

    if (failedHosts.length) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
  }
}

await withE2ERuntime(collectCanvasDiagnostics);
