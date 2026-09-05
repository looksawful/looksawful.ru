import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const mode = process.argv[2];
const COMPONENTS_PATH = new URL("../src/styles/components.css", import.meta.url);

const LEGACY_NAV_BLOCK = `/* ==================================================
   Portfolio navigation
   ================================================== */

.site-nav {
  --wrapper-max-width: var(--content-max-width);
  --cluster-align: baseline;
  --cluster-justify: space-between;
  --cluster-space: var(--size-400);

  padding-block: var(--size-300);
  border-block-end: var(--border-width-100) solid var(--clr-border);
  font-size: var(--fs-300);
}

.site-nav__brand,
.site-nav__link {
  color: inherit;
  font-weight: var(--fw-500);
  text-decoration: none;
}

.site-nav__list {
  --cluster-justify: flex-end;
  --cluster-row-gap: var(--size-200);
  --cluster-column-gap: var(--size-400);

  list-style: none;
}

`;

async function applyFix() {
  const source = await readFile(COMPONENTS_PATH, "utf8");
  const occurrences = source.split(LEGACY_NAV_BLOCK).length - 1;
  if (occurrences !== 1) {
    throw new Error(`RED contract expected exactly one legacy site-nav block, found ${occurrences}`);
  }
  if (!LEGACY_NAV_BLOCK.includes("border-block-end:")) {
    throw new Error("RED contract no longer identifies the separator border");
  }
  console.log("RED_CONFIRMED: stale components.css owns the unwanted site-nav separator");
  const updated = source.replace(LEGACY_NAV_BLOCK, "");
  if (/^\s*\.site-nav(?:\b|__)/m.test(updated)) {
    throw new Error("legacy .site-nav selector remains in components.css after cleanup");
  }
  await writeFile(COMPONENTS_PATH, updated);
  console.log("FIX_APPLIED: removed stale global navigation ownership from components.css");
}

function waitForPort(port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const probe = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - started > timeout) reject(new Error("preview server did not start"));
        else setTimeout(probe, 120);
      });
    };
    probe();
  });
}

async function visualGate() {
  const { chromium, firefox, webkit } = await import("playwright");
  const port = 4176;
  const baseUrl = `http://127.0.0.1:${port}`;
  const outDir = path.resolve("tmp-nav-393-visuals");
  await mkdir(outDir, { recursive: true });

  const cases = [
    { name: "desktop-1440x900", width: 1440, height: 900, route: "/", touch: false },
    { name: "width-above-32rem-513x844", width: 513, height: 844, route: "/", touch: false },
    { name: "width-at-32rem-512x844", width: 512, height: 844, route: "/", touch: true },
    { name: "mobile-390x844", width: 390, height: 844, route: "/", touch: true },
    { name: "height-above-36rem-390x577", width: 390, height: 577, route: "/", touch: true },
    { name: "height-at-36rem-390x576", width: 390, height: 576, route: "/", touch: true },
    { name: "height-above-28rem-390x449", width: 390, height: 449, route: "/", touch: true },
    { name: "height-at-28rem-390x448", width: 390, height: 448, route: "/", touch: true },
    { name: "inner-breadcrumb-390x844", width: 390, height: 844, route: "/work/jestei-pool/", touch: true },
  ];

  const server = spawn(
    "npm",
    ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (chunk) => process.stdout.write(`[preview] ${chunk}`));
  server.stderr.on("data", (chunk) => process.stderr.write(`[preview] ${chunk}`));

  const runBrowser = async (browserName, launcher) => {
    const browser = await launcher.launch({ headless: true });
    const results = [];
    try {
      for (const testCase of cases) {
        const context = await browser.newContext({
          viewport: { width: testCase.width, height: testCase.height },
          deviceScaleFactor: 1,
          hasTouch: testCase.touch,
        });
        const page = await context.newPage();
        await page.route("**/*", async (route) => {
          const type = route.request().resourceType();
          if (type === "image" || type === "media") await route.abort();
          else await route.continue();
        });

        try {
          await page.goto(`${baseUrl}${testCase.route}`, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });
          await page.screenshot({
            path: path.join(outDir, `${browserName}-${testCase.name}-closed.png`),
          });

          const closed = await page.evaluate(() => {
            const nav = document.querySelector(".site-nav");
            const faceBackground = document.querySelector(".awfulface__background");
            const navStyle = nav instanceof HTMLElement ? getComputedStyle(nav) : null;
            const faceStyle = faceBackground instanceof SVGElement ? getComputedStyle(faceBackground) : null;
            return {
              border: navStyle?.borderBlockEndWidth || navStyle?.borderBottomWidth || "",
              faceFill: faceStyle?.fill || "",
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            };
          });

          if ((Number.parseFloat(closed.border) || 0) > 0.01) {
            throw new Error(`${browserName}/${testCase.name}: closed separator ${closed.border}`);
          }
          if (closed.faceFill !== "none") {
            throw new Error(`${browserName}/${testCase.name}: Awfulface backing ${closed.faceFill}`);
          }
          if (closed.overflow > 1) {
            throw new Error(`${browserName}/${testCase.name}: closed overflow ${closed.overflow}px`);
          }

          await page.locator("[data-site-menu-toggle]").click({ timeout: 5000 });
          await page.screenshot({
            path: path.join(outDir, `${browserName}-${testCase.name}-open.png`),
          });

          const opened = await page.evaluate(() => {
            const nav = document.querySelector(".site-nav");
            const bar = document.querySelector(".site-nav__bar");
            const menu = document.querySelector("[data-site-menu]");
            const link = document.querySelector(".site-nav__menu-link");
            const navContext = document.querySelector(".site-nav__context, .site-nav__breadcrumbs");
            const navStyle = nav instanceof HTMLElement ? getComputedStyle(nav) : null;
            const linkStyle = link instanceof HTMLElement ? getComputedStyle(link) : null;
            const menuRect = menu instanceof HTMLElement ? menu.getBoundingClientRect() : null;
            return {
              border: navStyle?.borderBlockEndWidth || navStyle?.borderBottomWidth || "",
              navHeight: nav instanceof HTMLElement ? nav.getBoundingClientRect().height : null,
              barHeight: bar instanceof HTMLElement ? bar.getBoundingClientRect().height : null,
              contextDisplay: navContext instanceof HTMLElement ? getComputedStyle(navContext).display : "",
              textAlign: linkStyle?.textAlign || "",
              justifyContent: linkStyle?.justifyContent || "",
              fontSize: linkStyle ? Number.parseFloat(linkStyle.fontSize) : null,
              minBlockSize: linkStyle ? Number.parseFloat(linkStyle.minBlockSize) : null,
              menuTop: menuRect?.top ?? null,
              menuBottomGap: menuRect ? innerHeight - menuRect.bottom : null,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            };
          });

          if ((Number.parseFloat(opened.border) || 0) > 0.01) {
            throw new Error(`${browserName}/${testCase.name}: open separator ${opened.border}`);
          }
          if ((opened.navHeight ?? 99) > 1 || (opened.barHeight ?? 99) > 1) {
            throw new Error(`${browserName}/${testCase.name}: detached open band nav=${opened.navHeight} bar=${opened.barHeight}`);
          }
          if (opened.contextDisplay !== "none") {
            throw new Error(`${browserName}/${testCase.name}: open context ${opened.contextDisplay}`);
          }
          if (Math.abs(opened.menuTop ?? 99) > 1 || Math.abs(opened.menuBottomGap ?? 99) > 1) {
            throw new Error(`${browserName}/${testCase.name}: menu does not cover viewport`);
          }
          if (opened.overflow > 1) {
            throw new Error(`${browserName}/${testCase.name}: open overflow ${opened.overflow}px`);
          }
          if (testCase.width <= 512) {
            if (opened.textAlign !== "center" || opened.justifyContent !== "center") {
              throw new Error(`${browserName}/${testCase.name}: mobile alignment ${opened.textAlign}/${opened.justifyContent}`);
            }
          } else if (!["start", "left"].includes(opened.textAlign) || opened.justifyContent !== "flex-start") {
            throw new Error(`${browserName}/${testCase.name}: desktop alignment ${opened.textAlign}/${opened.justifyContent}`);
          }

          if (testCase.name === "height-above-36rem-390x577" && (opened.fontSize ?? 0) <= 28.1) {
            throw new Error(`${browserName}/${testCase.name}: 36rem compact-height rule activated too early (${opened.fontSize}px)`);
          }
          if (testCase.name === "height-at-36rem-390x576" && (opened.fontSize ?? 99) > 28.1) {
            throw new Error(`${browserName}/${testCase.name}: 36rem compact-height rule did not activate (${opened.fontSize}px)`);
          }
          if (testCase.name === "height-above-28rem-390x449" && (opened.minBlockSize ?? 0) < 43) {
            throw new Error(`${browserName}/${testCase.name}: 28rem compact target rule activated too early (${opened.minBlockSize}px)`);
          }
          if (testCase.name === "height-at-28rem-390x448" && (opened.minBlockSize ?? 99) > 36.1) {
            throw new Error(`${browserName}/${testCase.name}: 28rem compact target rule did not activate (${opened.minBlockSize}px)`);
          }

          results.push({ ...testCase, closed, opened });
        } finally {
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
    console.log(`NAV393_${browserName.toUpperCase()}=${JSON.stringify(results)}`);
  };

  try {
    await waitForPort(port);
    await Promise.all([
      runBrowser("chromium", chromium),
      runBrowser("firefox", firefox),
      runBrowser("webkit", webkit),
    ]);
    console.log("VISUAL_GREEN: 27 browser/viewport cases, 54 screenshots");
  } finally {
    server.kill("SIGTERM");
  }
}

if (mode === "apply") await applyFix();
else if (mode === "visual") await visualGate();
else throw new Error("usage: node tools/tmp-nav-393.mjs apply|visual");
