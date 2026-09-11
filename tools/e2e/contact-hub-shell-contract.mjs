import assert from "node:assert/strict";
import { withE2ERuntime } from "./runtime.mjs";

function rounded(value) {
  return Math.round(value * 100) / 100;
}

await withE2ERuntime(async ({ browser, baseUrl }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "networkidle" });

  const cta = page.locator('.contact a[href="mailto:i@lookawful.ru"]').first();
  assert.equal(await cta.count(), 1, "canonical site contact CTA must still exist");
  assert.equal((await cta.innerText()).trim(), "Связаться со мной");

  const before = await page.evaluate(() => {
    const main = document.querySelector("main");
    const rect = main?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      mainLeft: rect?.left ?? 0,
      mainWidth: rect?.width ?? 0,
    };
  });

  await cta.focus();
  await cta.click();

  const hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 2_000 });

  assert.equal(await hub.getAttribute("data-mode"), "form");
  assert.equal(await hub.getAttribute("data-visibility"), "open");

  const geometry = await hub.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      position: style.position,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
  assert.equal(geometry.position, "fixed", "Contact Hub must be an overlay widget");
  assert.ok(geometry.left >= 0 && geometry.top >= 0, "open Hub must stay inside the viewport");
  assert.ok(geometry.right <= geometry.viewportWidth, "open Hub must not clip horizontally");
  assert.ok(geometry.bottom <= geometry.viewportHeight, "open Hub must not clip vertically");

  const after = await page.evaluate(() => {
    const main = document.querySelector("main");
    const rect = main?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      mainLeft: rect?.left ?? 0,
      mainWidth: rect?.width ?? 0,
    };
  });

  assert.equal(after.scrollWidth, before.scrollWidth, "opening Hub must not create horizontal overflow");
  assert.equal(rounded(after.mainLeft), rounded(before.mainLeft), "opening Hub must not move the site");
  assert.equal(rounded(after.mainWidth), rounded(before.mainWidth), "opening Hub must not resize the site");

  await page.keyboard.press("Escape");
  await hub.waitFor({ state: "hidden", timeout: 2_000 });
  assert.equal(await cta.evaluate((element) => document.activeElement === element), true, "closing Hub must restore focus to its opener");

  await page.close();
});
