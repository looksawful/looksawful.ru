import { chromium } from "playwright";

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("about:blank");
  console.log(JSON.stringify({
    engine: "chromium",
    version: browser.version(),
    executablePath: chromium.executablePath(),
    headless: true,
    launch: "ok",
  }));
} finally {
  await browser?.close();
}
