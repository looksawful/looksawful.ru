import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 4174;
const baseUrl = `http://${host}:${port}`;
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
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.ok || response.status === 304) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not start.\n${previewOutput}`);
}

function assert(condition, message, details) {
  if (!condition) {
    throw new Error(details ? `${message}: ${JSON.stringify(details)}` : message);
  }
}

async function metrics(page, selector) {
  return page.evaluate((value) => {
    const element = document.querySelector(value);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      text: element.textContent?.replace(/\s+/gu, " ").trim() || "",
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      display: style.display,
      visibility: style.visibility,
      opacity: Number(style.opacity),
      fontSize: Number.parseFloat(style.fontSize) || 0,
      letterSpacing: Number.parseFloat(style.letterSpacing) || 0,
      borderTopWidth: Number.parseFloat(style.borderTopWidth) || 0,
      borderRightWidth: Number.parseFloat(style.borderRightWidth) || 0,
      outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
      outlineOffset: Number.parseFloat(style.outlineOffset) || 0,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      hidden: element.hidden,
    };
  }, selector);
}

function visible(value) {
  return Boolean(
    value &&
      !value.hidden &&
      value.display !== "none" &&
      value.visibility !== "hidden" &&
      value.opacity > 0 &&
      value.width > 1 &&
      value.height > 1,
  );
}

async function scrollTo(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "attached", timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return locator;
}

async function run() {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/?static=1&visible-repairs-regression=1`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await page.waitForTimeout(7_000);

    // 1. The current inspector shell must keep its complete frame inside the section.
    const logoSelector = "#jestei-logo [data-logo-inspector-shell]";
    await scrollTo(page, logoSelector);
    const logo = await metrics(page, logoSelector);
    const logoSection = await metrics(page, "#jestei-logo [data-section-screen], #jestei-logo");
    assert(visible(logo), "logo inspector is not visible", logo);
    assert(
      logo.outlineWidth >= 1 || logo.borderRightWidth >= 1,
      "logo inspector has no visible frame",
      logo,
    );
    assert(logo.outlineOffset <= 0, "logo inspector frame is drawn outside the shell", logo);
    assert(
      !logoSection || logo.right <= logoSection.right + 2,
      "logo inspector frame is clipped on the right",
      { logo, logoSection },
    );

    // 2. The color chapter must use almost the same usable width as the results bento.
    await scrollTo(page, "#jestei-color .jestei-color-bento");
    const color = await metrics(page, "#jestei-color .jestei-color-bento");
    const results = await metrics(page, "#jestei-results .jestei-bento__screen");
    assert(visible(color), "color chapter is not visible", color);
    assert(visible(results), "results bento reference is not visible", results);
    const colorRatio = color.width / results.width;
    assert(colorRatio >= 0.9 && colorRatio <= 1.05, "color chapter width differs from results bento", {
      colorWidth: color.width,
      resultsWidth: results.width,
      ratio: colorRatio,
    });

    // 3. Audience map must have a visible border.
    await scrollTo(page, "#jestei-audience-map .jestei-audience-map__figure");
    const audience = await metrics(page, "#jestei-audience-map .jestei-audience-map__figure");
    assert(visible(audience), "audience map is not visible", audience);
    assert(
      audience.borderTopWidth >= 1 || audience.outlineWidth >= 1,
      "audience map has no border",
      audience,
    );

    // 4. Tariff title must use the approved wording.
    await scrollTo(page, "#jestei-tariffs");
    const tariffTitleSelector = "#jestei-tariffs [data-chapter-head] [data-section-title], #jestei-tariffs [data-section-title]";
    const tariffTitle = await metrics(page, tariffTitleSelector);
    assert(visible(tariffTitle), "tariff title is not visible", tariffTitle);
    assert(
      tariffTitle.text.toLocaleLowerCase("ru") === "пересобрали тарифные сценарии",
      "tariff title text is incorrect",
      tariffTitle,
    );

    // 5. Before/after must react to dragging.
    const canvas = page.locator('#jestei-tariffs [data-animation="before-after"] canvas').first();
    await canvas.waitFor({ state: "visible", timeout: 30_000 });
    const box = await canvas.boundingBox();
    assert(box && box.width > 100 && box.height > 80, "before/after canvas has invalid geometry", box);
    const before = await canvas.screenshot();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.5, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    const after = await canvas.screenshot();
    assert(!before.equals(after), "before/after canvas does not react to dragging");

    // 6–7. Filter and Event headings must stay readable and inside their boxes.
    for (const [name, selector] of [
      ["filter", "#jestei-filter [data-chapter-head] > [data-section-title], #jestei-filter [data-section-title]"],
      ["event", "#jestei-event-nav [data-chapter-head] > [data-section-title], #jestei-event-nav [data-section-title]"],
    ]) {
      await scrollTo(page, selector);
      const title = await metrics(page, selector);
      assert(visible(title), `${name} title is not visible`, title);
      assert(title.fontSize <= 84, `${name} title is too large`, title);
      assert(title.scrollWidth <= title.clientWidth + 2, `${name} title overflows its box`, title);
    }

    // 8. Jestei graphics paragraph must use a readable measure and size.
    await scrollTo(page, "#jestei-graphics");
    const graphicsLead = await metrics(
      page,
      "#jestei-graphics .jestei-graphics__lead, #jestei-graphics [data-content-head] > p",
    );
    assert(visible(graphicsLead), "Jestei graphics paragraph is not visible", graphicsLead);
    assert(graphicsLead.width <= 760, "Jestei graphics paragraph is too wide", graphicsLead);
    assert(
      graphicsLead.fontSize >= 16 && graphicsLead.fontSize <= 22,
      "Jestei graphics paragraph font size is invalid",
      graphicsLead,
    );

    // 9–12. Styx copy must sit below headings and the requested media must be visible.
    for (const id of ["styx-graphics", "styx-print", "styx-photo-art"]) {
      await scrollTo(page, `#${id}`);
      const title = await metrics(page, `#${id} [data-chapter-head] > [data-section-title]`);
      const lead = await metrics(page, `#${id} [data-chapter-head] > [data-section-lead]`);
      assert(visible(title), `${id} title is not visible`, title);
      if (lead) {
        assert(visible(lead), `${id} paragraph is not visible`, lead);
        assert(Math.abs(lead.left - title.left) <= 12, `${id} paragraph is shifted sideways`, { title, lead });
        assert(lead.top >= title.bottom - 4, `${id} paragraph is not below the title`, { title, lead });
        assert(Math.abs(lead.letterSpacing) <= 1, `${id} paragraph has excessive letter spacing`, lead);
      }
    }

    const styxGraphicsMedia = await metrics(
      page,
      "#styx-graphics [data-section-media], #styx-graphics [data-media-gallery]",
    );
    assert(visible(styxGraphicsMedia), "Styx graphics content is missing", styxGraphicsMedia);

    const styxPrintMedia = await metrics(page, '#styx-print [data-animation="horizontal"]');
    assert(visible(styxPrintMedia), "Styx print content is missing", styxPrintMedia);

    const photoBanner = await metrics(
      page,
      '#styx-photo-art [data-styx-photo-banner], #styx-photo-art [aria-label="styx photo production banner"]',
    );
    const photoGallery = await metrics(
      page,
      '#styx-photo-art [data-styx-photo-gallery], #styx-photo-art [aria-label="styx photo production gallery"]',
    );
    assert(visible(photoBanner), "Styx photo banner is missing", photoBanner);
    assert(visible(photoGallery), "Styx photo gallery is missing", photoGallery);
    assert(Math.abs(photoBanner.width - photoGallery.width) <= 16, "Styx photo banner and gallery widths differ", {
      banner: photoBanner,
      gallery: photoGallery,
    });

    // 13. Scanography videos must be visible, aligned and advancing.
    await scrollTo(page, "#styx-scanography [data-scanography-videos]");
    const scanography = await page.evaluate(async () => {
      const videos = [...document.querySelectorAll("#styx-scanography [data-scanography-videos] video")];
      const beforeTimes = videos.map((video) => video.currentTime);
      await new Promise((resolve) => setTimeout(resolve, 900));
      return videos.map((video, index) => {
        const rect = video.getBoundingClientRect();
        const style = getComputedStyle(video);
        return {
          beforeTime: beforeTimes[index],
          currentTime: video.currentTime,
          paused: video.paused,
          readyState: video.readyState,
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top,
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity),
        };
      });
    });
    assert(scanography.length >= 2, "scanography has fewer than two videos", scanography);
    for (const video of scanography) {
      assert(video.width > 100 && video.height > 100, "scanography video has invalid geometry", video);
      assert(
        video.display !== "none" && video.visibility !== "hidden" && video.opacity > 0,
        "scanography video is hidden",
        video,
      );
      assert(!video.paused && video.currentTime > video.beforeTime, "scanography video is not playing", video);
    }
    assert(Math.abs(scanography[0].top - scanography[1].top) <= 16, "scanography videos are misaligned", scanography);
    assert(Math.abs(scanography[0].width - scanography[1].width) <= 16, "scanography video widths differ", scanography);

    // 14. The redundant shootings heading must be absent.
    const shootingsHeading = await page.evaluate(() => {
      const normalize = (value) => String(value || "").replace(/\s+/gu, " ").trim().toLocaleLowerCase("ru");
      return [...document.querySelectorAll("#shootings h1, #shootings h2, #shootings h3, #shootings [data-section-title]")]
        .map((element) => normalize(element.textContent))
        .find((text) => text === "творческие съёмки" || text === "творческие съемки") || null;
    });
    assert(!shootingsHeading, "redundant shootings heading is still present", shootingsHeading);

    console.log("visible repairs regression: passed");
  } finally {
    await context.close();
    await browser.close();
    await stopPreview();
  }
}

const timeout = setTimeout(() => {
  console.error("Visible repairs regression exceeded 180 seconds");
  void stopPreview().finally(() => process.exit(1));
}, 180_000);

try {
  await run();
} finally {
  clearTimeout(timeout);
}
