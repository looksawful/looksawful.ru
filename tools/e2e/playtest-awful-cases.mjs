import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { withE2ERuntime } from "./runtime.mjs";

const outputDir = path.resolve("dist/playtest-awful-cases");
await mkdir(outputDir, { recursive: true });

const keyByAction = {
  upper: "ArrowUp",
  lower: "ArrowDown",
  title: "ArrowLeft",
  toggle: "ArrowRight",
  lint: "PageDown",
  sentence: "Delete",
};

function trainerState() {
  const root = document.querySelector("[data-awful-cases]");
  const api = root?.awfulCasesCaseTrainer;
  if (!api) return null;
  const task = api.nearestTask();
  return {
    mode: api.game.mode,
    correct: api.game.stats.correct,
    mistakes: api.game.stats.mistakes,
    resolved: api.game.stats.resolved,
    score: api.game.stats.score,
    taskType: task?.type ?? null,
    taskPhase: task?.phase ?? null,
  };
}
async function openTrainer(page, url) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("[data-awful-cases]").waitFor();
  await page.waitForFunction(() =>
    Boolean(document.querySelector("[data-awful-cases]")?.awfulCasesCaseTrainer),
  );
  assert.equal(
    await page.locator("[data-awful-cases-canvas]").evaluate((canvas) => document.activeElement === canvas),
    false,
    "trainer demo must not steal focus before the user starts the session",
  );
  const onboarding = page.locator("[data-awful-cases-onboarding]");
  assert.equal(await onboarding.isVisible(), true, "trainer must explain itself before play");
  assert.equal(
    await onboarding.locator(".start__action").count(),
    6,
    "onboarding must teach all six Awful Cases transforms",
  );
  assert.equal(await page.locator("[data-awful-cases-controls]").isVisible(), false);
  return errors;
}

async function startSession(page, { expectControlsVisible = null } = {}) {
  await page.locator("[data-awful-cases-start-button]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]")?.awfulCasesCaseTrainer?.game.mode === "running",
  );
  const state = await page.evaluate(trainerState);
  assert.ok(state?.taskType, "running session must expose a current task");
  const controls = page.locator("[data-awful-cases-controls]");
  assert.equal(await controls.locator("[data-awful-cases-action]").count(), 6);
  if (expectControlsVisible !== null) {
    assert.equal(await controls.isVisible(), expectControlsVisible);
  }
  assert.equal(await page.locator("[data-awful-cases-prompt]").isVisible(), true);
  if (expectControlsVisible) {
    assert.equal(
      await controls.locator('[data-active="true"]').getAttribute("data-awful-cases-action"),
      state.taskType,
      "touch controls must highlight the action for the current task",
    );
  }
  return state;
}

async function resetSession(page) {
  await page.evaluate(() =>
    document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.reset(),
  );
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]")?.awfulCasesCaseTrainer?.game.mode === "running",
  );
  await page.waitForTimeout(60);
}
async function exerciseKeyboard(page) {
  let state = await startSession(page);
  const correctAction = state.taskType;
  const wrongAction = Object.keys(keyByAction).find((action) => action !== correctAction);
  assert.ok(wrongAction, "keyboard playtest needs an alternate action");
  await page.keyboard.press(keyByAction[wrongAction]);
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.stats.mistakes === 1,
  );
  state = await page.evaluate(trainerState);
  assert.equal(state.mode, "running");
  assert.equal(state.correct, 0);

  await page.evaluate(() => {
    const api = document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer;
    api.game.inputCooldown = 0;
    const task = api.nearestTask();
    if (task) task.x = api.view.playerX + 100 * api.view.scale;
  });
  await page.keyboard.press(keyByAction[correctAction]);
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.stats.correct === 1,
  );
  state = await page.evaluate(trainerState);
  assert.equal(state.correct, 1);
  assert.equal(state.mistakes, 1);
}

async function exerciseForgivingMiss(page) {
  await resetSession(page);
  await page.evaluate(() => {
    const api = document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer;
    const task = api.nearestTask() ?? api.game.obstacles.find((item) => !item.resolved);
    task.phase = "tutorial";
    task.x = api.view.footX - task._w * 0.5;
  });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.stats.resolved >= 1,
  );
  const state = await page.evaluate(trainerState);
  assert.equal(state.mode, "running");
  assert.equal(state.mistakes, 1);
}
async function exerciseExamDeath(page) {
  await resetSession(page);
  await page.evaluate(() => {
    const api = document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer;
    const task = api.nearestTask() ?? api.game.obstacles.find((item) => !item.resolved);
    task.phase = "exam";
    task.x = api.view.footX - task._w * 0.5;
  });
  await page.waitForFunction(() =>
    ["falling", "dead"].includes(
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.mode,
    ),
  );
  await page.waitForFunction(
    () => document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.mode === "dead",
    null,
    { timeout: 3000 },
  );
  assert.equal(await page.locator("[data-awful-cases-restart]").isVisible(), true);
}

async function exerciseVictoryRestart(page) {
  await resetSession(page);
  await page.evaluate(() => {
    const api = document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer;
    for (const task of api.game.obstacles) {
      task.resolved = true;
      task.target = 1;
    }
    Object.assign(api.game.stats, {
      correct: 18,
      resolved: 18,
      mistakes: 0,
      score: 1800,
      streak: 18,
      bestStreak: 18,
    });
    api.game.spawned = 18;
    api.game.finishX = api.view.playerX;
  });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.mode === "complete",
    null,
    { timeout: 4000 },
  );
  assert.equal(await page.locator("[data-awful-cases-restart]").isVisible(), true);
  await page.locator("[data-awful-cases-restart-button]").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.mode === "running",
  );
}

async function exerciseReducedMotion(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = await openTrainer(page, `${baseUrl}/work/awful-cases/`);
  const before = await page.evaluate(() =>
    document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.time,
  );
  await page.waitForTimeout(250);
  const after = await page.evaluate(() =>
    document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.time,
  );
  assert.equal(after, before, "reduced-motion demo must remain static until the user starts");

  await startSession(page);
  await page.waitForTimeout(250);
  const runningTime = await page.evaluate(() =>
    document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.time,
  );
  assert.ok(runningTime > after, "user-started training must remain playable under reduced motion");
  assert.equal(await page.locator("[data-awful-cases-controls] [aria-pressed]").count(), 0);
  assert.deepEqual(errors, []);
  await context.close();
}

async function exerciseMobileTouch(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = await openTrainer(page, `${baseUrl}/pets/awful-cases/`);
  const initial = await startSession(page, { expectControlsVisible: true });
  const controls = page.locator("[data-awful-cases-controls]");
  assert.equal(await controls.isVisible(), true);
  assert.equal(await controls.locator("[data-awful-cases-action]").count(), 6);
  const rightEdgePixel = await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const root = document.querySelector("[data-awful-cases]");
    const api = root.awfulCasesCaseTrainer;
    const ctx = root.querySelector("[data-awful-cases-canvas]").getContext("2d");
    const dpr = api.view.dpr;
    return [
      ...ctx.getImageData(Math.floor((api.view.w - 1) * dpr), Math.floor(34 * dpr), 1, 1).data,
    ];
  });
  assert.ok(
    rightEdgePixel[0] < 20 && rightEdgePixel[1] > 100 && rightEdgePixel[2] > 100,
    "mobile HUD must leave the right canvas edge unobstructed",
  );
  await controls.locator(`[data-awful-cases-action="${initial.taskType}"]`).click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-awful-cases]").awfulCasesCaseTrainer.game.stats.correct === 1,
  );
  await page
    .locator("[data-awful-cases]")
    .screenshot({ path: path.join(outputDir, "standalone-mobile.png") });
  assert.deepEqual(errors, []);
  await context.close();
}

await withE2ERuntime(async ({ browser, baseUrl }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const embeddedErrors = await openTrainer(page, `${baseUrl}/work/awful-cases/`);
  await exerciseKeyboard(page);
  await exerciseForgivingMiss(page);
  await exerciseExamDeath(page);
  await exerciseVictoryRestart(page);
  await page
    .locator("[data-awful-cases]")
    .screenshot({ path: path.join(outputDir, "embedded-desktop.png") });
  assert.deepEqual(embeddedErrors, []);
  await page.close();

  await exerciseReducedMotion(browser, baseUrl);
  await exerciseMobileTouch(browser, baseUrl);
  console.log(`Awful Cases playtest passed. Screenshots: ${outputDir}`);
});
