import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const source = resolve("public/pets/berserk-timer/index.html");
const output = resolve("public/media/projects/berserk-timer/cover.webp");
const temporary = resolve(".tmp-berserk-timer-cover.png");

await mkdir(dirname(output), { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(source).href, { waitUntil: "load" });
  await page.screenshot({ path: temporary, fullPage: false });

  await sharp(temporary)
    .resize({ width: 1440, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(output);

  console.log(`Captured Berserk Timer cover: ${output}`);
} finally {
  await browser.close();
  await rm(temporary, { force: true });
}
