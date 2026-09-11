import assert from "node:assert/strict";

import { isDirectExecution, withE2ERuntime } from "./runtime.mjs";

const VIEWPORTS = [
  { width: 1440, height: 900, mobile: false },
  { width: 1280, height: 800, mobile: false },
  { width: 1024, height: 768, mobile: false },
  { width: 768, height: 1024, mobile: true },
  { width: 430, height: 932, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 360, height: 800, mobile: true },
  { width: 320, height: 568, mobile: true },
];

const REQUIRED_FORM_FIELDS = ["Имя", "Email", "Сообщение"];

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function openContext(browser, baseUrl, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/?pet=1`, { waitUntil: "domcontentloaded" });
  assert.ok(response?.ok(), `${viewport.width}x${viewport.height}: homepage failed`);
  await settle(page);
  return { context, page };
}

async function visibleRect(locator) {
  await locator.waitFor({ state: "visible" });
  const box = await locator.boundingBox();
  assert.ok(box, "expected visible element bounding box");
  return box;
}

function assertInsideViewport(box, viewport, label) {
  const tolerance = 1;
  assert.ok(box.x >= -tolerance, `${label}: left ${box.x}px is outside viewport`);
  assert.ok(box.y >= -tolerance, `${label}: top ${box.y}px is outside viewport`);
  assert.ok(box.x + box.width <= viewport.width + tolerance, `${label}: right edge is outside viewport`);
  assert.ok(box.y + box.height <= viewport.height + tolerance, `${label}: bottom edge is outside viewport`);
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(overflow <= 1, `${label}: horizontal overflow is ${overflow}px`);
}

async function readUnderlyingGeometry(page) {
  return page.evaluate(() => {
    const selectors = [".hero", ".projects-grid", ".contact"];
    return Object.fromEntries(selectors.map((selector) => {
      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) return [selector, null];
      const rect = node.getBoundingClientRect();
      return [selector, {
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      }];
    }));
  });
}

function assertGeometryStable(before, after, label) {
  for (const selector of Object.keys(before)) {
    if (!before[selector] || !after[selector]) continue;
    for (const key of ["x", "y", "width", "height"]) {
      assert.ok(
        Math.abs(before[selector][key] - after[selector][key]) <= 1,
        `${label}: ${selector} ${key} changed from ${before[selector][key]} to ${after[selector][key]}`,
      );
    }
  }
}

async function assertFormReachable(page, viewport, label) {
  const dialog = page.getByRole("dialog", { name: "Контакты" });
  assertInsideViewport(await visibleRect(dialog), viewport, `${label} dialog`);

  for (const fieldName of REQUIRED_FORM_FIELDS) {
    const field = page.getByLabel(fieldName, { exact: true });
    await field.scrollIntoViewIfNeeded();
    assertInsideViewport(await visibleRect(field), viewport, `${label} ${fieldName}`);
  }

  const submit = page.getByRole("button", { name: "Отправить" });
  await submit.scrollIntoViewIfNeeded();
  assertInsideViewport(await visibleRect(submit), viewport, `${label} submit`);
  assertInsideViewport(
    await visibleRect(page.getByRole("button", { name: "Закрыть" })),
    viewport,
    `${label} close`,
  );
  await assertNoHorizontalOverflow(page, label);
}

async function checkEntryIsolationAndForm(browser, baseUrl, viewport) {
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    const before = await readUnderlyingGeometry(page);
    const siteCta = page.getByRole("link", { name: "Связаться со мной" });
    await siteCta.click();

    const dialog = page.getByRole("dialog", { name: "Контакты" });
    await dialog.waitFor({ state: "visible" });
    assert.equal(await page.getByRole("tab", { name: "Написать" }).getAttribute("aria-selected"), "true");
    await assertFormReachable(page, viewport, `${viewport.width}x${viewport.height}`);

    const after = await readUnderlyingGeometry(page);
    assertGeometryStable(before, after, `${viewport.width}x${viewport.height} widget isolation`);

    await page.getByRole("button", { name: "Закрыть" }).click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await siteCta.evaluate((node) => node === document.activeElement), true, "focus must return to CTA opener");
  } finally {
    await context.close();
  }
}

async function checkPetAndDirectForm(browser, baseUrl) {
  const viewport = { width: 1440, height: 900, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    const pet = page.getByRole("button", { name: "Открыть помощника" });
    const petRect = await visibleRect(pet);
    assert.ok(petRect.height >= viewport.height * 0.28, `pet is too small: ${petRect.height}px`);
    assert.ok(petRect.height <= viewport.height * 0.42, `pet is unexpectedly huge: ${petRect.height}px`);
    assertInsideViewport(petRect, viewport, "desktop pet");

    const direct = page.getByRole("button", { name: "Написать напрямую" });
    await direct.click();
    const dialog = page.getByRole("dialog", { name: "Контакты" });
    await dialog.waitFor({ state: "visible" });
    assert.equal(await page.getByRole("tab", { name: "Написать" }).getAttribute("aria-selected"), "true");
    await page.getByRole("button", { name: "Закрыть" }).click();

    await pet.click();
    await dialog.waitFor({ state: "visible" });
    assert.equal(await page.getByRole("tab", { name: "AI" }).getAttribute("aria-selected"), "true");
  } finally {
    await context.close();
  }
}

async function checkPointerDrag(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    const pet = page.getByRole("button", { name: "Открыть помощника" });
    const before = await visibleRect(pet);
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + 190, before.y - 120, { steps: 8 });
    await page.mouse.up();
    await settle(page);

    const after = await visibleRect(pet);
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 60, "pointer drag must move the pet");
    assertInsideViewport(after, viewport, "dragged pet");
    await page.getByRole("dialog", { name: "Контакты" }).waitFor({ state: "hidden" });
  } finally {
    await context.close();
  }
}

async function dispatchTouchDrag(page, locator, dx, dy) {
  const box = await visibleRect(locator);
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await locator.evaluate((node, points) => {
    const emit = (type, x, y) => node.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 41,
      pointerType: "touch",
      isPrimary: true,
      clientX: x,
      clientY: y,
      buttons: type === "pointerup" ? 0 : 1,
    }));
    emit("pointerdown", points.start.x, points.start.y);
    emit("pointermove", points.start.x + points.dx * 0.5, points.start.y + points.dy * 0.5);
    emit("pointermove", points.start.x + points.dx, points.start.y + points.dy);
    emit("pointerup", points.start.x + points.dx, points.start.y + points.dy);
  }, { start, dx, dy });
  await settle(page);
}

async function checkTouchDragAndCollapse(browser, baseUrl) {
  const viewport = { width: 390, height: 844, mobile: true };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    const pet = page.getByRole("button", { name: "Открыть помощника" });
    const before = await visibleRect(pet);
    await dispatchTouchDrag(page, pet, 120, -90);
    const after = await visibleRect(pet);
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 40, "touch drag must move the pet");
    assertInsideViewport(after, viewport, "touch-dragged pet");

    await page.getByRole("button", { name: "Написать напрямую" }).click();
    const dialog = page.getByRole("dialog", { name: "Контакты" });
    await assertFormReachable(page, viewport, "mobile form before collapse");

    await page.getByRole("button", { name: "Свернуть" }).click();
    await dialog.waitFor({ state: "hidden" });
    const launcher = page.getByRole("button", { name: "Открыть контакты" });
    assertInsideViewport(await visibleRect(launcher), viewport, "collapsed launcher");

    await launcher.click();
    await dialog.waitFor({ state: "visible" });
    assert.equal(await page.getByRole("tab", { name: "Написать" }).getAttribute("aria-selected"), "true");
  } finally {
    await context.close();
  }
}

async function checkDynamicViewportStability(browser, baseUrl) {
  const viewport = { width: 390, height: 844, mobile: true };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    await page.getByRole("link", { name: "Связаться со мной" }).click();
    const dialog = page.getByRole("dialog", { name: "Контакты" });
    const before = await visibleRect(dialog);

    await page.setViewportSize({ width: 390, height: 690 });
    await settle(page);
    const shrunk = await visibleRect(dialog);
    assertInsideViewport(shrunk, { width: 390, height: 690 }, "mobile sheet after viewport shrink");

    await page.setViewportSize({ width: 390, height: 844 });
    await settle(page);
    const restored = await visibleRect(dialog);
    assertInsideViewport(restored, viewport, "mobile sheet after viewport restore");
    assert.ok(Math.abs(restored.x - before.x) <= 1, "sheet must not drift horizontally after browser chrome cycle");
  } finally {
    await context.close();
  }
}

async function checkDraftAndFailure(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    await page.route("**/api/contact/send", async (route) => {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ kind: "unavailable" }) });
    });

    await page.getByRole("link", { name: "Связаться со мной" }).click();
    await page.getByLabel("Имя", { exact: true }).fill("Иван");
    await page.getByLabel("Email", { exact: true }).fill("test@example.com");
    await page.getByLabel("Сообщение", { exact: true }).fill("Тестовое сообщение");
    await page.getByRole("button", { name: "Отправить" }).click();

    await page.getByRole("status").filter({ hasText: /не удалось|ошибка/i }).waitFor({ state: "visible" });
    assert.equal(await page.getByLabel("Имя", { exact: true }).inputValue(), "Иван");
    assert.equal(await page.getByLabel("Email", { exact: true }).inputValue(), "test@example.com");
    assert.equal(await page.getByLabel("Сообщение", { exact: true }).inputValue(), "Тестовое сообщение");
    await page.getByRole("link", { name: /i@lookawful\.ru/i }).waitFor({ state: "visible" });
  } finally {
    await context.close();
  }
}

async function checkSingleSuccessfulSubmission(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    let sends = 0;
    await page.route("**/api/contact/send", async (route) => {
      sends += 1;
      await new Promise((resolve) => setTimeout(resolve, 120));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ kind: "accepted", submissionId: "test-1" }) });
    });

    await page.getByRole("link", { name: "Связаться со мной" }).click();
    await page.getByLabel("Email", { exact: true }).fill("test@example.com");
    await page.getByLabel("Сообщение", { exact: true }).fill("Одно сообщение");
    const submit = page.getByRole("button", { name: "Отправить" });
    await Promise.all([submit.click(), submit.click({ force: true })]);
    await page.getByRole("status").filter({ hasText: /отправлено|готово/i }).waitFor({ state: "visible" });
    assert.equal(sends, 1, "one logical submit must create exactly one contact request");
  } finally {
    await context.close();
  }
}

async function checkPreparedAnswerEconomy(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    let aiRequests = 0;
    await page.route("**/api/assistant/**", async (route) => {
      aiRequests += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ kind: "answer", text: "network answer" }) });
    });

    await page.getByRole("button", { name: "Открыть помощника" }).click();
    await page.getByRole("button", { name: "Кейсы" }).click();
    await page.getByRole("log").getByText(/Jestei|Styx|кей/i).first().waitFor({ state: "visible" });
    assert.equal(aiRequests, 0, "prepared quick action must not call generative AI endpoint");
  } finally {
    await context.close();
  }
}

async function checkThinkingAndAiFailureIsolation(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    await page.route("**/api/assistant/chat", async (route) => {
      await pending;
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ kind: "unavailable" }) });
    });

    await page.getByRole("button", { name: "Открыть помощника" }).click();
    const input = page.getByRole("textbox", { name: "Сообщение для AI" });
    await input.fill("Расскажи нестандартно о подходе к арт-дирекшену");
    await page.getByRole("button", { name: "Отправить AI" }).click();
    await page.getByRole("status", { name: "AI думает" }).waitFor({ state: "visible" });

    await page.getByRole("tab", { name: "Написать" }).click();
    await page.getByLabel("Email", { exact: true }).waitFor({ state: "visible" });
    release();
  } finally {
    await context.close();
  }
}

async function checkKeyboardLifecycle(browser, baseUrl) {
  const viewport = { width: 1280, height: 800, mobile: false };
  const { context, page } = await openContext(browser, baseUrl, viewport);
  try {
    const cta = page.getByRole("link", { name: "Связаться со мной" });
    await cta.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Контакты" });
    await dialog.waitFor({ state: "visible" });
    const focusedName = await page.evaluate(() => document.activeElement?.getAttribute("name") ?? document.activeElement?.getAttribute("aria-label"));
    assert.ok(focusedName, "opening form should place focus inside Hub");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await cta.evaluate((node) => node === document.activeElement), true, "Escape close must return focus to opener");
  } finally {
    await context.close();
  }
}

export async function runContactHubAcceptance({ browser, baseUrl }) {
  for (const viewport of VIEWPORTS) {
    await checkEntryIsolationAndForm(browser, baseUrl, viewport);
  }
  await checkPetAndDirectForm(browser, baseUrl);
  await checkPointerDrag(browser, baseUrl);
  await checkTouchDragAndCollapse(browser, baseUrl);
  await checkDynamicViewportStability(browser, baseUrl);
  await checkDraftAndFailure(browser, baseUrl);
  await checkSingleSuccessfulSubmission(browser, baseUrl);
  await checkPreparedAnswerEconomy(browser, baseUrl);
  await checkThinkingAndAiFailureIsolation(browser, baseUrl);
  await checkKeyboardLifecycle(browser, baseUrl);
  console.log("Contact Hub acceptance checks passed");
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(runContactHubAcceptance);
}
