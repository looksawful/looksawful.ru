import assert from "node:assert/strict";
import { withE2ERuntime } from "./runtime.mjs";

const GEOMETRY_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
];

function rounded(value) {
  return Math.round(value * 100) / 100;
}

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.waitForTimeout(180);
}

async function verifyOverlayGeometry(browser, baseUrl, viewport) {
  const page = await browser.newPage({ viewport });
  try {
    await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "networkidle" });
    const cta = page.locator('.contact a[href="mailto:i@lookawful.ru"]').first();
    await cta.scrollIntoViewIfNeeded();
    await cta.waitFor({ state: "visible" });

    const before = await page.evaluate(() => {
      const main = document.querySelector("main");
      const rect = main?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        mainLeft: rect?.left ?? 0,
        mainWidth: rect?.width ?? 0,
      };
    });

    await cta.click();
    await settle(page);
    const hub = page.locator("[data-contact-hub]");
    await hub.waitFor({ state: "visible", timeout: 2_000 });

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
    assert.equal(geometry.position, "fixed", `${viewport.width}x${viewport.height}: Contact Hub must be an overlay widget`);
    assert.ok(geometry.left >= -1 && geometry.top >= -1, `${viewport.width}x${viewport.height}: Hub clipped at start edge`);
    assert.ok(geometry.right <= geometry.viewportWidth + 1, `${viewport.width}x${viewport.height}: Hub clipped horizontally`);
    assert.ok(geometry.bottom <= geometry.viewportHeight + 1, `${viewport.width}x${viewport.height}: Hub clipped vertically`);

    const after = await page.evaluate(() => {
      const main = document.querySelector("main");
      const rect = main?.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        mainLeft: rect?.left ?? 0,
        mainWidth: rect?.width ?? 0,
      };
    });

    assert.equal(after.scrollWidth, before.scrollWidth, `${viewport.width}x${viewport.height}: opening Hub must not create document width`);
    assert.equal(rounded(after.mainLeft), rounded(before.mainLeft), `${viewport.width}x${viewport.height}: opening Hub must not move main`);
    assert.equal(rounded(after.mainWidth), rounded(before.mainWidth), `${viewport.width}x${viewport.height}: opening Hub must not resize main`);
  } finally {
    await page.close();
  }
}

await withE2ERuntime(async ({ browser, baseUrl }) => {
  for (const viewport of GEOMETRY_VIEWPORTS) {
    await verifyOverlayGeometry(browser, baseUrl, viewport);
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "networkidle" });

  const pet = page.locator("[data-portfolio-pet-launcher]").first();
  assert.equal(await pet.count(), 1, "Awful must exist as a visible launcher before Contact Hub opens");
  await pet.waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await pet.getAttribute("aria-label"), "Открыть чат с Awful");

  await pet.click();
  await settle(page);
  let hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await hub.getAttribute("data-mode"), "ai", "clicking Awful must open Contact Hub directly in AI mode");
  await page.keyboard.press("Escape");
  await hub.waitFor({ state: "hidden", timeout: 2_000 });

  let cta = page.locator('.contact a[href="mailto:i@lookawful.ru"]').first();
  assert.equal(await cta.count(), 1, "canonical site contact CTA must still exist");
  assert.equal((await cta.textContent()).trim(), "Связаться со мной");
  await cta.scrollIntoViewIfNeeded();
  await cta.waitFor({ state: "visible" });
  await cta.focus();
  await cta.click();
  await settle(page);

  hub = page.locator("[data-contact-hub]");
  await hub.waitFor({ state: "visible", timeout: 2_000 });
  assert.equal(await hub.getAttribute("data-mode"), "form");
  assert.equal(await hub.getAttribute("data-visibility"), "open");

  await page.keyboard.press("Escape");
  await hub.waitFor({ state: "hidden", timeout: 2_000 });
  assert.equal(await cta.evaluate((element) => document.activeElement === element), true, "closing Hub must restore focus to its opener");

  await cta.click();
  await settle(page);
  hub = page.locator("[data-contact-hub]");
  const name = hub.locator('input[name="name"]');
  const email = hub.locator('input[name="email"]');
  const message = hub.locator('textarea[name="message"]');
  await name.fill("Иван");
  await email.fill("person@example.com");
  await message.fill("Черновик должен пережить reload");

  await page.reload({ waitUntil: "networkidle" });
  cta = page.locator('.contact a[href="mailto:i@lookawful.ru"]').first();
  await cta.scrollIntoViewIfNeeded();
  await cta.waitFor({ state: "visible" });
  await cta.click();
  await settle(page);
  hub = page.locator("[data-contact-hub]");
  assert.equal(await hub.locator('input[name="name"]').inputValue(), "Иван", "same-tab reload must preserve name draft");
  assert.equal(await hub.locator('input[name="email"]').inputValue(), "person@example.com", "same-tab reload must preserve email draft");
  assert.equal(await hub.locator('textarea[name="message"]').inputValue(), "Черновик должен пережить reload", "same-tab reload must preserve message draft");

  await page.close();
});
