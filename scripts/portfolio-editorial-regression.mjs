import { chromium } from "playwright";

const url = process.env.URL || "http://localhost:5173/";
const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: "networkidle" });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) throw new Error(`horizontal overflow at ${width}: ${overflow}px`);

  await page.locator("#hero .hero__title").waitFor();
  await page.locator("#showcase").waitFor();

  const visibleKickers = await page.locator("text=/секция\\s+0?\\d/i").count();
  if (visibleKickers > 0) throw new Error(`visible section kickers at ${width}: ${visibleKickers}`);

  await page.screenshot({
    path: `_local/portfolio-editorial-${width}.png`,
    fullPage: true,
  });

  console.log(`OK ${width}`);
}

await browser.close();