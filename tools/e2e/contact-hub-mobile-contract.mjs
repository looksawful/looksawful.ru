import assert from "node:assert/strict";

import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

const VIEWPORTS = [
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 568 },
];

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.waitForTimeout(180);
}

async function box(locator, label) {
  await locator.waitFor({ state: "visible" });
  const value = await locator.boundingBox();
  assert.ok(value, `${label}: missing bounding box`);
  return value;
}

function assertInside(rect, viewport, label) {
  assert.ok(rect.x >= -1, `${label}: clipped left`);
  assert.ok(rect.y >= -1, `${label}: clipped top`);
  assert.ok(rect.x + rect.width <= viewport.width + 1, `${label}: clipped right`);
  assert.ok(rect.y + rect.height <= viewport.height + 1, `${label}: clipped bottom`);
}

function overlaps(a, b) {
  return !(
    a.x + a.width <= b.x || b.x + b.width <= a.x ||
    a.y + a.height <= b.y || b.y + b.height <= a.y
  );
}

async function insertSyntheticConsent(page) {
  await page.evaluate(() => {
    document.querySelector(".site-analytics-consent")?.remove();
    const consent = document.createElement("aside");
    consent.className = "site-analytics-consent";
    consent.textContent = "analytics consent";
    document.body.append(consent);
  });
  await settle(page);
  return page.locator(".site-analytics-consent");
}

async function openMobilePage(browser, baseUrl, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `${viewport.width}x${viewport.height}: homepage failed`);
  return { context, page };
}

async function revealAndClickContactCta(page) {
  const cta = page.locator('.contact a[href="mailto:i@lookawful.ru"]').first();
  await cta.scrollIntoViewIfNeeded();
  await cta.waitFor({ state: "visible" });
  await cta.click();
  await settle(page);
}

async function verifyViewport(browser, baseUrl, viewport) {
  const { context, page } = await openMobilePage(browser, baseUrl, viewport);
  try {
    const pet = page.locator("[data-portfolio-pet-launcher]");
    const closedConsent = await insertSyntheticConsent(page);
    const closedConsentBox = await box(closedConsent, "closed-state consent");
    assertInside(closedConsentBox, viewport, "closed-state consent");
    assert.equal(
      overlaps(closedConsentBox, await box(pet, "closed Venus with consent")),
      false,
      `${viewport.width}x${viewport.height}: consent must not overlap canonical closed Venus`,
    );
    await closedConsent.evaluate((node) => node.remove());
    await settle(page);

    await revealAndClickContactCta(page);

    const hub = page.locator("[data-contact-hub]").first();
    const hubBox = await box(hub, "hub");
    assertInside(hubBox, viewport, `${viewport.width}x${viewport.height} hub`);

    const metrics = await hub.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        position: style.position,
        bottom: Math.round(node.getBoundingClientRect().bottom),
        viewportHeight: window.innerHeight,
      };
    });
    assert.equal(metrics.position, "fixed", "hub must stay fixed");
    assert.ok(Math.abs(metrics.bottom - metrics.viewportHeight) <= 1, "mobile hub must be bottom anchored");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `${viewport.width}x${viewport.height}: horizontal overflow ${overflow}px`);

    const close = hub.locator("[data-contact-hub-close]");
    const collapse = hub.locator("[data-contact-hub-collapse]");
    assertInside(await box(close, "close"), viewport, "close");
    assertInside(await box(collapse, "collapse"), viewport, "collapse");

    const name = hub.locator('input[name="name"]');
    const email = hub.locator('input[name="email"]');
    const message = hub.locator('textarea[name="message"]');
    const submit = hub.locator('button[type="submit"]').filter({ hasText: "отправить" }).first();
    await name.fill("draft name");
    await email.fill("draft@example.com");
    await message.fill("draft message");
    await submit.scrollIntoViewIfNeeded();
    assertInside(await box(submit, "submit"), viewport, "form submit");

    await collapse.click();
    await hub.waitFor({ state: "hidden" });
    const launcher = page.locator("[data-contact-hub-launcher]");
    assertInside(await box(launcher, "collapsed launcher"), viewport, "collapsed launcher");

    const collapsedConsent = await insertSyntheticConsent(page);
    const collapsedConsentBox = await box(collapsedConsent, "collapsed-state consent");
    assert.equal(
      overlaps(collapsedConsentBox, await box(launcher, "collapsed launcher with consent")),
      false,
      `${viewport.width}x${viewport.height}: consent must not overlap collapsed Hub launcher`,
    );
    await collapsedConsent.evaluate((node) => node.remove());
    await settle(page);

    await launcher.click();
    await hub.waitFor({ state: "visible" });
    await settle(page);
    assert.equal(await name.inputValue(), "draft name");
    assert.equal(await email.inputValue(), "draft@example.com");
    assert.equal(await message.inputValue(), "draft message");

    await hub.locator('[data-contact-hub-mode="ai"]').click();
    await settle(page);
    const composer = hub.locator("[data-contact-hub-ai-composer]");
    assertInside(await box(composer, "composer"), viewport, "AI composer");
    assertInside(await box(close, "close after mode switch"), viewport, "close after mode switch");

    const consent = await insertSyntheticConsent(page);
    const consentBox = await box(consent, "consent");
    assertInside(consentBox, viewport, "consent");
    assert.equal(overlaps(consentBox, await box(hub, "hub with consent")), false, "consent must not overlap the open hub");
  } finally {
    await context.close();
  }
}

async function verifyKeyboardLikeResize(browser, baseUrl) {
  const initialViewport = { width: 390, height: 844 };
  const reducedViewport = { width: 390, height: 560 };
  const { context, page } = await openMobilePage(browser, baseUrl, initialViewport);
  try {
    await revealAndClickContactCta(page);
    const hub = page.locator("[data-contact-hub]").first();
    const message = hub.locator('textarea[name="message"]');
    const submit = hub.locator('button[type="submit"]').filter({ hasText: "отправить" }).first();

    await message.focus();
    await page.setViewportSize(reducedViewport);
    await settle(page);

    assertInside(await box(hub, "keyboard-like resized hub"), reducedViewport, "keyboard-like resized hub");
    await message.scrollIntoViewIfNeeded();
    assertInside(await box(message, "focused message after viewport shrink"), reducedViewport, "focused message after viewport shrink");
    await submit.scrollIntoViewIfNeeded();
    assertInside(await box(submit, "submit after viewport shrink"), reducedViewport, "submit after viewport shrink");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `keyboard-like resize: horizontal overflow ${overflow}px`);
  } finally {
    await context.close();
  }
}

export async function runContactHubMobileContract({ browser, baseUrl }) {
  for (const viewport of VIEWPORTS) {
    await verifyViewport(browser, baseUrl, viewport);
  }
  await verifyKeyboardLikeResize(browser, baseUrl);
  console.log(`Contact Hub mobile viewport contract passed: ${VIEWPORTS.map(({ width, height }) => `${width}x${height}`).join(", ")} + keyboard-like 390x560`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(runContactHubMobileContract);
}
