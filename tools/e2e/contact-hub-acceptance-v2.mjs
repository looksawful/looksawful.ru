import assert from "node:assert/strict";

import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

const VIEWPORTS = [
  { width: 1440, height: 900, mobile: false },
  { width: 1024, height: 768, mobile: false },
  { width: 430, height: 932, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 360, height: 800, mobile: true },
  { width: 320, height: 568, mobile: true },
];

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openPage(browser, baseUrl, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `${viewport.width}x${viewport.height}: homepage failed`);
  await settle(page);
  return { context, page };
}

const hub = (page) => page.locator('[role="dialog"][data-contact-hub]').first();
const pet = (page) => page.locator("[data-portfolio-pet-launcher]").first();
const directForm = (page) => page.locator("[data-contact-open-form]").first();
const email = (page) => hub(page).locator('input[type="email"]').first();
const message = (page) => hub(page).locator("textarea").first();

async function rect(locator) {
  await locator.waitFor({ state: "visible" });
  const value = await locator.boundingBox();
  assert.ok(value, "visible element must have a bounding box");
  return value;
}

function assertInside(box, viewport, label) {
  assert.ok(box.x >= -1, `${label}: left clipped`);
  assert.ok(box.y >= -1, `${label}: top clipped`);
  assert.ok(box.x + box.width <= viewport.width + 1, `${label}: right clipped`);
  assert.ok(box.y + box.height <= viewport.height + 1, `${label}: bottom clipped`);
}

function overlap(a, b) {
  return !(
    a.x + a.width <= b.x || b.x + b.width <= a.x ||
    a.y + a.height <= b.y || b.y + b.height <= a.y
  );
}

async function pageGeometry(page) {
  return page.evaluate(() => Object.fromEntries(
    [".hero", ".projects", ".contact"].map((selector) => {
      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) return [selector, null];
      const box = node.getBoundingClientRect();
      return [selector, { x: box.x, y: box.y, width: box.width, height: box.height }];
    }),
  ));
}

function assertGeometryStable(before, after) {
  for (const selector of Object.keys(before)) {
    if (!before[selector] || !after[selector]) continue;
    for (const key of ["x", "y", "width", "height"]) {
      assert.ok(Math.abs(before[selector][key] - after[selector][key]) <= 1, `${selector} ${key} changed`);
    }
  }
}

async function assertFormUsable(page, viewport, label) {
  const dialog = hub(page);
  assertInside(await rect(dialog), viewport, `${label} hub`);
  await email(page).scrollIntoViewIfNeeded();
  await message(page).scrollIntoViewIfNeeded();
  assertInside(await rect(email(page)), viewport, `${label} email`);
  assertInside(await rect(message(page)), viewport, `${label} message`);
  const submit = dialog.locator('button[type="submit"]').first();
  await submit.scrollIntoViewIfNeeded();
  assertInside(await rect(submit), viewport, `${label} submit`);
  const close = dialog.locator("[data-contact-hub-close]").first();
  assertInside(await rect(close), viewport, `${label} close`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label}: horizontal overflow ${overflow}px`);
}

async function checkSiteCta(browser, baseUrl, viewport) {
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    const before = await pageGeometry(page);
    const cta = page.locator('a[href^="mailto:"]').filter({ hasText: /связаться/i }).first();
    await cta.click();
    await assertFormUsable(page, viewport, `${viewport.width}x${viewport.height}`);
    assertGeometryStable(before, await pageGeometry(page));
    await hub(page).locator("[data-contact-hub-close]").click();
    await hub(page).waitFor({ state: "hidden" });
    assert.equal(await cta.evaluate((node) => node === document.activeElement), true, "focus must return to opener");
  } finally {
    await context.close();
  }
}

async function checkPetEntries(browser, baseUrl) {
  const viewport = { width: 1440, height: 900, mobile: false };
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    const launcher = pet(page);
    const petBox = await rect(launcher);
    assert.ok(petBox.height >= viewport.height * 0.28, "Venus must read as a large character");
    assertInside(petBox, viewport, "Venus");

    await directForm(page).click();
    await assertFormUsable(page, viewport, "pet direct form");
    await hub(page).locator("[data-contact-hub-close]").click();

    await launcher.click();
    const composer = hub(page).locator("[data-contact-hub-ai-composer]").first();
    await composer.waitFor({ state: "visible" });
    assert.equal(await email(page).isVisible(), false, "pet primary action must expose AI result, not active form fields");
  } finally {
    await context.close();
  }
}

async function checkPointerDrag(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    const launcher = pet(page);
    const before = await rect(launcher);
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + 180, before.y - 100, { steps: 8 });
    await page.mouse.up();
    await settle(page);
    const after = await rect(launcher);
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 50, "pointer drag must move Venus");
    assertInside(after, viewport, "dragged Venus");
    assert.equal(await hub(page).isVisible(), false, "drag must not activate Hub");
  } finally {
    await context.close();
  }
}

async function checkMobileCollapse(browser, baseUrl) {
  const viewport = { width: 390, height: 844, mobile: true };
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    await directForm(page).click();
    await email(page).fill("draft@example.com");
    await message(page).fill("draft");
    await assertFormUsable(page, viewport, "mobile before collapse");

    await hub(page).locator("[data-contact-hub-collapse]").click();
    await hub(page).waitFor({ state: "hidden" });
    const compact = page.locator("[data-contact-hub-launcher]").first();
    assertInside(await rect(compact), viewport, "collapsed launcher");
    await compact.click();
    await assertFormUsable(page, viewport, "mobile restored");
    assert.equal(await email(page).inputValue(), "draft@example.com");
    assert.equal(await message(page).inputValue(), "draft");
  } finally {
    await context.close();
  }
}

async function checkFailureAndSingleFlight(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    let sends = 0;
    await page.route("**/api/contact/send", async (route) => {
      sends += 1;
      await new Promise((resolve) => setTimeout(resolve, 80));
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ kind: "unavailable" }) });
    });
    await directForm(page).click();
    await email(page).fill("test@example.com");
    await message(page).fill("preserve me");
    const submit = hub(page).locator('button[type="submit"]').first();
    await Promise.all([submit.click(), submit.click({ force: true })]);
    const status = hub(page).locator('[role="status"]').first();
    await status.waitFor({ state: "visible" });
    assert.equal(sends, 1, "double activation must create one frontend request");
    assert.equal(await email(page).inputValue(), "test@example.com");
    assert.equal(await message(page).inputValue(), "preserve me");
    await hub(page).locator('a[href^="mailto:i@lookawful.ru"]').first().waitFor({ state: "visible" });
  } finally {
    await context.close();
  }
}

async function checkPreparedAnswerEconomy(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    let providerCalls = 0;
    await page.route("**/api/assistant/**", async (route) => {
      providerCalls += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ kind: "answer", text: "network" }) });
    });
    await pet(page).click();
    const log = hub(page).locator('[role="log"]').first();
    const before = await log.locator("[data-assistant-message]").count();
    await hub(page).locator('[data-assistant-intent="cases"]').first().click();
    await page.waitForTimeout(20);
    assert.equal(providerCalls, 0, "prepared answer must make zero generative requests");
    assert.ok(await log.locator("[data-assistant-message]").count() > before, "prepared action must produce visible output");
  } finally {
    await context.close();
  }
}

async function checkVisibleConsentCollision(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openPage(browser, baseUrl, viewport);
  try {
    const consent = page.locator(".site-analytics-consent").first();
    if (!(await consent.isVisible())) return;
    const consentBox = await rect(consent);
    assert.equal(overlap(consentBox, await rect(pet(page))), false, "visible consent must not be covered by Venus");
    await directForm(page).click();
    assert.equal(overlap(consentBox, await rect(hub(page))), false, "visible consent must remain usable with Hub open");
  } finally {
    await context.close();
  }
}

export async function runContactHubAcceptanceV2({ browser, baseUrl }) {
  for (const viewport of VIEWPORTS) await checkSiteCta(browser, baseUrl, viewport);
  await checkPetEntries(browser, baseUrl);
  await checkPointerDrag(browser, baseUrl);
  await checkMobileCollapse(browser, baseUrl);
  await checkFailureAndSingleFlight(browser, baseUrl);
  await checkPreparedAnswerEconomy(browser, baseUrl);
  await checkVisibleConsentCollision(browser, baseUrl);
  console.log("Contact Hub reconciled acceptance checks passed");
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(runContactHubAcceptanceV2);
}
