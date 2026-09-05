import { chromium, firefox, webkit } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const phase = process.argv[2];
const expected = process.argv[3];
if (!["before", "after"].includes(phase) || !["present", "absent"].includes(expected)) {
  throw new Error("usage: tmp-nav-393-matrix.mjs before|after present|absent");
}

const browsers = { chromium, firefox, webkit };
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

const port = 4175;
const baseUrl = `http://127.0.0.1:${port}`;
const outDir = path.join("tmp-nav-393-artifacts", phase);
await mkdir(outDir, { recursive: true });

const waitForPort = () => new Promise((resolve, reject) => {
  const started = Date.now();
  const probe = () => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => { socket.end(); resolve(); });
    socket.once("error", () => {
      socket.destroy();
      if (Date.now() - started > 15000) reject(new Error("vite did not start"));
      else setTimeout(probe, 120);
    });
  };
  probe();
});

const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: process.platform === "win32",
});
server.stdout.on("data", (chunk) => process.stdout.write(`[vite] ${chunk}`));
server.stderr.on("data", (chunk) => process.stderr.write(`[vite] ${chunk}`));

async function runBrowser(browserName, launcher) {
  const browser = await launcher.launch({ headless: true });
  const results = [];
  try {
    for (const item of cases) {
      console.log(`[${phase}] ${browserName} ${item.name}: start`);
      const options = {
        viewport: { width: item.width, height: item.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      };
      if (item.touch) options.hasTouch = true;
      if (item.touch && browserName !== "firefox") options.isMobile = true;
      const context = await browser.newContext(options);
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      try {
        await page.route("**/*", async (route) => {
          if (route.request().resourceType() === "media") await route.abort();
          else await route.continue();
        });
        await page.goto(`${baseUrl}${item.route}`, { waitUntil: "domcontentloaded", timeout: 12000 });
        await page.waitForSelector("[data-site-menu-toggle]", { timeout: 5000 });
        const closed = await page.evaluate(() => {
          const nav = document.querySelector(".site-nav");
          const bar = document.querySelector(".site-nav__bar");
          const toggle = document.querySelector("[data-site-menu-toggle]");
          const navStyle = nav instanceof HTMLElement ? getComputedStyle(nav) : null;
          return {
            border: navStyle?.borderBlockEndWidth || navStyle?.borderBottomWidth || "",
            borderColor: navStyle?.borderBlockEndColor || navStyle?.borderBottomColor || "",
            navHeight: nav instanceof HTMLElement ? nav.getBoundingClientRect().height : null,
            barHeight: bar instanceof HTMLElement ? bar.getBoundingClientRect().height : null,
            toggleWidth: toggle instanceof HTMLElement ? toggle.getBoundingClientRect().width : null,
            coarse: matchMedia("(pointer: coarse)").matches,
            fine: matchMedia("(pointer: fine)").matches,
            hoverNone: matchMedia("(hover: none)").matches,
            hoverHover: matchMedia("(hover: hover)").matches,
          };
        });
        await page.screenshot({ path: path.join(outDir, `${browserName}-${item.name}-closed.png`) });
        const borderPx = Number.parseFloat(closed.border) || 0;
        if (expected === "present" && borderPx < 0.5) throw new Error(`${browserName} ${item.name}: expected legacy border, got ${closed.border}`);
        if (expected === "absent" && borderPx > 0.01) throw new Error(`${browserName} ${item.name}: separator survives at ${closed.border}`);

        await page.locator("[data-site-menu-toggle]").click({ force: true, timeout: 5000 });
        await page.waitForTimeout(80);
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
            menuTop: menuRect?.top ?? null,
            menuBottomGap: menuRect ? innerHeight - menuRect.bottom : null,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        await page.screenshot({ path: path.join(outDir, `${browserName}-${item.name}-open.png`) });
        const openBorderPx = Number.parseFloat(opened.border) || 0;
        if (expected === "present" && openBorderPx < 0.5) throw new Error(`${browserName} ${item.name} open: expected legacy border, got ${opened.border}`);
        if (expected === "absent" && openBorderPx > 0.01) throw new Error(`${browserName} ${item.name} open: separator survives at ${opened.border}`);
        if ((opened.barHeight ?? 99) > 1) throw new Error(`${browserName} ${item.name}: open bar height ${opened.barHeight}`);
        if (opened.contextDisplay !== "none") throw new Error(`${browserName} ${item.name}: open context display ${opened.contextDisplay}`);
        if (Math.abs(opened.menuTop ?? 99) > 1 || Math.abs(opened.menuBottomGap ?? 99) > 1) throw new Error(`${browserName} ${item.name}: menu not fullscreen`);
        if ((opened.overflow ?? 99) > 1) throw new Error(`${browserName} ${item.name}: horizontal overflow ${opened.overflow}`);
        if (item.width <= 512 && opened.textAlign !== "center") throw new Error(`${browserName} ${item.name}: expected centered mobile menu, got ${opened.textAlign}`);
        if (item.width > 512 && !["start", "left"].includes(opened.textAlign)) throw new Error(`${browserName} ${item.name}: expected start desktop menu, got ${opened.textAlign}`);
        results.push({ browser: browserName, ...item, closed, opened });
        console.log(`[${phase}] ${browserName} ${item.name}: OK border=${closed.border}/${opened.border}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

try {
  await waitForPort();
  const nested = await Promise.all(Object.entries(browsers).map(([name, launcher]) => runBrowser(name, launcher)));
  console.log(`NAV393_${phase.toUpperCase()}_SUMMARY=${JSON.stringify(nested.flat())}`);
} finally {
  server.kill("SIGTERM");
}
