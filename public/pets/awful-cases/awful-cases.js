import {
  ACTION_ORDER,
  ACTIONS,
  SESSION_PLAN,
  actionFromCode,
  createSessionStats,
  missIsLethal,
  phaseForIndex,
  recordCorrect,
  sessionAccuracy,
  recordMistake,
} from "./awful-cases-core.js";
import { COPY, DICTIONARIES } from "./awful-cases-content.js";

const BEST_SCORE_KEY = "awful-cases-trainer-best-v1";

export function enhanceAwfulCases(root, { locale = "en" } = {}) {
  if (!(root instanceof HTMLElement)) return { setActive() {}, destroy() {} };
  let active = false;
  let destroyed = false;
  const abortController = new AbortController();
  const ATLAS_SRC = "/media/interactive/awful-cases-atlas.png";
  const GROUND_SRC = "/pets/awful-cases/assets/ground.png";
  const PIT_SRC = "/pets/awful-cases/assets/pit.png";
  const FALL1_SRC = "/pets/awful-cases/assets/fall1.png";
  const FALL2_SRC = "/pets/awful-cases/assets/fall2.png";
  const VICTORY_SRC = "/pets/awful-cases/assets/victory.png";
  const FLAG_SRC = "/pets/awful-cases/assets/flag.png";
  const DECOR_SOURCES = [
    "/pets/awful-cases/assets/decor-1.png",
    "/pets/awful-cases/assets/decor-2.png",
    "/pets/awful-cases/assets/decor-3.png",
  ];
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES.en;
  const copy = COPY[locale] ?? COPY.en;
  const SESSION_LENGTH = SESSION_PLAN.length;
  const HINTS = Object.fromEntries(ACTION_ORDER.map((type) => [type, ACTIONS[type].label]));
  const canvas = root.querySelector("[data-awful-cases-canvas]");
  const startPanel = root.querySelector("[data-awful-cases-start]");
  const startButton = root.querySelector("[data-awful-cases-start-button]");
  const restartPanel = root.querySelector("[data-awful-cases-restart]");
  const restartTitle = root.querySelector("[data-awful-cases-restart-title]");
  const restartMeta = root.querySelector("[data-awful-cases-restart-meta]");
  const restartButton = root.querySelector("[data-awful-cases-restart-button]");
  const runnerControls = root.querySelector("[data-awful-cases-controls]");
  const runnerPrompt = root.querySelector("[data-awful-cases-prompt]");
  const onboardingKicker = root.querySelector("[data-awful-cases-onboarding-kicker]");
  const onboardingTitle = root.querySelector("[data-awful-cases-onboarding-title]");
  const onboardingCopy = root.querySelector("[data-awful-cases-onboarding-copy]");
  const onboardingActions = root.querySelector("[data-awful-cases-onboarding-actions]");
  const onboardingTip = root.querySelector("[data-awful-cases-onboarding-tip]");
  const actionButtons = [...root.querySelectorAll("[data-awful-cases-action]")];
  const ctx = canvas.getContext("2d", { alpha: false });
  const atlas = new Image();
  let atlasReady = false;
  atlas.onload = () => {
    atlasReady = true;
  };
  atlas.src = ATLAS_SRC;

  const groundTile = new Image();
  let groundReady = false;
  groundTile.onload = () => {
    groundReady = true;
  };
  groundTile.src = GROUND_SRC;

  const pitTile = new Image();
  let pitReady = false;
  pitTile.onload = () => {
    pitReady = true;
  };
  pitTile.src = PIT_SRC;

  function loadSprite(src) {
    const image = new Image();
    image.ready = false;
    image.onload = () => {
      image.ready = true;
    };
    image.src = src;
    return image;
  }

  const fallSprites = [loadSprite(FALL1_SRC), loadSprite(FALL2_SRC)];
  const victorySprite = loadSprite(VICTORY_SRC);
  const flagSprite = loadSprite(FLAG_SRC);
  const decorSprites = DECOR_SOURCES.map(loadSprite);

  const RUN = Array.from({ length: 6 }, (_, i) => ({ x: i * 270, y: 0, w: 270, h: 230 }));
  const view = {
    w: 0,
    h: 0,
    dpr: 1,
    floor: 0,
    scale: 1,
    playerX: 0,
    footX: 0,
    font: 32,
    speed: 180,
  };
  const game = {
    mode: "demo",
    time: 0,
    last: performance.now(),
    speed: 180,
    obstacles: [],
    decor: [],
    nextDecorX: 0,
    finishX: null,
    victoryTimer: 0,
    fallStep: 0,
    nextType: 0,
    shake: 0,
    raf: 0,
    failTimer: 0,
    inputCooldown: 0,
    spawned: 0,
    stats: createSessionStats(),
    mastered: new Set(),
    completeTimer: 0,
    world: 0,
    lastGuidanceKey: "",
  };
  Object.defineProperties(game, {
    solved: { get: () => game.stats.correct },
    mistakes: { get: () => game.stats.mistakes },
  });

  function appShortcut(type) {
    return `Ctrl+Alt+Shift+${ACTIONS[type].appKey}`;
  }

  function populateTrainerUi() {
    if (onboardingKicker) onboardingKicker.textContent = copy.onboardingKicker;
    if (onboardingTitle) onboardingTitle.textContent = copy.onboardingTitle;
    if (onboardingCopy) onboardingCopy.textContent = copy.onboardingCopy;
    if (onboardingTip) onboardingTip.textContent = copy.onboardingTip;
    if (startButton) startButton.textContent = copy.startTraining;

    if (onboardingActions) {
      const fragment = document.createDocumentFragment();
      for (const type of ACTION_ORDER) {
        const example = dictionary.find((item) => item.type === type);
        const row = document.createElement("div");
        row.className = "start__action";
        row.innerHTML = `<span class="start__action-name"></span><span class="start__action-example"></span><span class="start__action-keys"><kbd></kbd><small></small></span>`;
        row.querySelector(".start__action-name").textContent = actionTitle(type);
        row.querySelector(".start__action-example").textContent = example
          ? `${example.input} → ${example.output}`
          : "";
        row.querySelector("kbd").textContent = ACTIONS[type].label;
        row.querySelector("small").textContent = appShortcut(type);
        fragment.append(row);
      }
      onboardingActions.replaceChildren(fragment);
    }

    for (const button of actionButtons) {
      const type = button.dataset.awfulCasesAction;
      if (!ACTIONS[type]) continue;
      const key = button.querySelector("b");
      const label = button.querySelector("span");
      if (key) key.textContent = ACTIONS[type].label;
      if (label) label.textContent = actionTitle(type);
      button.dataset.active = "false";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${actionTitle(type)}: ${ACTIONS[type].label}, ${appShortcut(type)}`);
    }
  }

  function guidanceTask() {
    return nearestTask() ?? game.obstacles.find((task) => !task.resolved && task.target < 1) ?? null;
  }

  function syncGuidance() {
    const task = game.mode === "running" ? guidanceTask() : null;
    const tutorial = task?.phase === "tutorial";
    const key = task ? `${task.id}:${task.phase}:${task.failed ? 1 : 0}` : game.mode;
    if (key === game.lastGuidanceKey) return;
    game.lastGuidanceKey = key;

    for (const button of actionButtons) {
      const activeButton = Boolean(tutorial && task && button.dataset.awfulCasesAction === task.type);
      button.dataset.active = String(activeButton);
      button.setAttribute("aria-pressed", String(activeButton));
    }

    if (!runnerPrompt) return;
    if (!tutorial || !task) {
      runnerPrompt.hidden = true;
      runnerPrompt.textContent = "";
      return;
    }
    runnerPrompt.hidden = false;
    runnerPrompt.textContent = `${copy.currentAction}: ${actionTitle(task.type)} · ${copy.gameKey} ${ACTIONS[task.type].label} · ${copy.appShortcut} ${appShortcut(task.type)}`;
  }

  function resize() {
    view.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    view.w = Math.max(260, root.clientWidth || 260);
    view.h = Math.max(320, root.clientHeight || 320);
    canvas.width = Math.floor(view.w * view.dpr);
    canvas.height = Math.floor(view.h * view.dpr);
    canvas.style.width = view.w + "px";
    canvas.style.height = view.h + "px";
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    updateView();
  }

  function updateView() {
    const compact = view.w < 560;
    view.scale = clamp(Math.min(view.w / 1180, view.h / 520), compact ? 0.32 : 0.46, 1.34);
    view.floor = Math.round(view.h * (compact ? 0.68 : 0.66));
    view.playerX = Math.round(view.w * (compact ? 0.44 : 0.5));
    view.footX = view.playerX + 36 * view.scale;
    view.font = Math.round(clamp(33 * view.scale, compact ? 13 : 18, 44));
    view.speed = 205 * view.scale;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function irnd(a, b) {
    return Math.floor(rnd(a, b + 1));
  }
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function setFont(size = view.font, weight = 800) {
    ctx.font = `${weight} ${Math.round(size)}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#111";
    ctx.fontKerning = "normal";
  }

  function textMetrics(text, size = view.font, weight = 800) {
    setFont(size, weight);
    const m = ctx.measureText(text);
    const ascent = Math.ceil(m.actualBoundingBoxAscent || size * 0.76);
    const descent = Math.ceil(m.actualBoundingBoxDescent || size * 0.2);
    return { width: m.width, ascent, descent, height: ascent + descent };
  }

  function textWidth(text, size = view.font) {
    return textMetrics(text, size).width;
  }

  function visualTextHeight(text, size) {
    return textMetrics(text, size).height;
  }

  function drawWordCard(text, x, topY, size, mode = "normal", alpha = 1, weight = 800, color = null) {
    const m = textMetrics(text, size, weight);
    const padX = Math.round(clamp(size * 0.48, 9 * view.scale, 22 * view.scale));
    const padY = Math.round(clamp(size * 0.28, 6 * view.scale, 13 * view.scale));
    const cardW = Math.ceil(m.width + padX * 2);
    const cardH = Math.ceil(m.height + padY * 2);
    const left = Math.round(x - cardW * 0.5);
    const top = Math.round(topY - padY);
    const radius = Math.round(clamp(8 * view.scale, 5, 11));
    const shadow = Math.round(clamp(3 * view.scale, 2, 4));
    const palette =
      mode === "error"
        ? { fill: "#ffe8e5", border: "#8f1f16", text: "#8f1f16" }
        : mode === "correct"
          ? { fill: "#e1f4df", border: "#1c6b2a", text: "#1c6b2a" }
          : { fill: "#fffdf0", border: "#111", text: color ?? "#111" };

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(left + shadow, top + shadow, cardW, cardH, radius);
    ctx.fillStyle = "rgb(0 0 0 / 28%)";
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(left, top, cardW, cardH, radius);
    ctx.fillStyle = palette.fill;
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = Math.max(1.5, 1.5 * view.scale);
    ctx.stroke();

    setFont(size, weight);
    ctx.fillStyle = palette.text;
    ctx.fillText(text, Math.round(x), Math.round(topY + m.ascent));
    ctx.restore();
    return m;
  }

  function drawTextTopSurface(text, x, topY, size, mode = "normal", alpha = 1, weight = 800) {
    return drawWordCard(text, x, topY, size, mode, alpha, weight);
  }

  function fitTaskTextSize(base, text, maxChars, minScale = 0.58) {
    const length = Math.max(1, [...String(text)].length);
    const factor = length <= maxChars ? 1 : clamp(maxChars / length, minScale, 1);
    return base * factor;
  }

  function taskSizes(task) {
    const longForm = task.type === "lint" || task.type === "sentence";
    const base = longForm ? view.font * 0.84 : view.font * 1.04;
    return {
      input: fitTaskTextSize(base, task.input, longForm ? 20 : 13),
      output: fitTaskTextSize(base, task.output, longForm ? 22 : 14),
    };
  }

  function taskTextWidth(task, which = "output") {
    const sizes = taskSizes(task);
    const text = which === "input" ? task.input : task.output;
    const size = which === "input" ? sizes.input : sizes.output;
    return textWidth(text, size);
  }

  function taskWidth(task) {
    const a = taskTextWidth(task, "input");
    const b = taskTextWidth(task, "output");
    return Math.max(a, b) + 76 * view.scale;
  }

  function taskHoleRect(task) {
    const holeW = Math.max(96 * view.scale, taskTextWidth(task, "output") + 94 * view.scale);
    const w = taskWidth(task);
    return {
      x: task.x + w * 0.5 - holeW * 0.5,
      w: holeW,
    };
  }

  function randomTask(type) {
    const pool = dictionary.filter((item) => item.type === type);
    const src = pool[irnd(0, pool.length - 1)];
    return {
      id: String(Date.now()) + Math.random(),
      type: src.type,
      input: src.input,
      output: src.output,
      x: 0,
      progress: 0,
      target: 0,
      solved: false,
      resolved: false,
      failed: false,
      phase: "tutorial",
    };
  }

  function spawn(entry, x = null) {
    const type = typeof entry === "string" ? entry : entry.type;
    const phase = typeof entry === "string" ? "tutorial" : entry.phase;
    const task = randomTask(type);
    const last = game.obstacles[game.obstacles.length - 1];
    const w = taskWidth(task);
    const minX = view.w + 120 * view.scale;
    const gap = rnd(360, 520) * view.scale;
    task.x = x ?? (last ? Math.max(minX, last.x + taskWidth(last) + gap) : minX);
    task._w = w;
    task.index = game.spawned;
    task.phase = phase;
    task.showHint = game.mode === "demo" || phase === "tutorial";
    game.spawned += 1;
    game.obstacles.push(task);
    if (game.mode === "running" && game.spawned === SESSION_LENGTH) {
      game.finishX = task.x + w + 520 * view.scale;
    }
    return task;
  }

  function canSpawn() {
    return game.mode === "demo" || game.spawned < SESSION_LENGTH;
  }

  function spawnNext(x = null) {
    if (!canSpawn()) return null;
    const entry =
      game.mode === "demo"
        ? SESSION_PLAN[game.spawned % SESSION_PLAN.length]
        : SESSION_PLAN[game.spawned];
    return entry ? spawn(entry, x) : null;
  }

  function resetState(mode) {
    game.mode = mode;
    game.time = 0;
    game.speed = view.speed;
    game.shake = 0;
    game.failTimer = 0;
    game.inputCooldown = 0;
    game.spawned = 0;
    game.stats = createSessionStats();
    game.mastered.clear();
    game.lastGuidanceKey = "";
    game.obstacles.length = 0;
    game.decor.length = 0;
    game.nextDecorX = view.w + 240 * view.scale;
    game.finishX = null;
    game.nextType = 0;
    syncTouchControls();
  }

  function focusCanvas() {
    if (!active || destroyed) return;
    setTimeout(() => {
      if (active && !destroyed && root.isConnected) canvas.focus({ preventScroll: true });
    }, 0);
  }

  function startDemo() {
    resetState("demo");
    startPanel.hidden = false;
    restartPanel.hidden = true;
    spawnNext(view.playerX + 380 * view.scale);
    fillQueue();
  }

  function reset() {
    resetState("running");
    startPanel.hidden = true;
    restartPanel.hidden = true;
    spawnNext(view.playerX + 300 * view.scale);
    fillQueue();
    syncGuidance();
    focusCanvas();
  }

  function fillQueue() {
    let guard = 0;
    while (game.obstacles.length < 5 && canSpawn() && guard++ < 30) spawnNext();
    while (
      game.obstacles.length &&
      canSpawn() &&
      game.obstacles[game.obstacles.length - 1].x < view.w + 760 * view.scale &&
      guard++ < 60
    )
      spawnNext();
  }

  function command(type) {
    if (game.mode !== "running" || !ACTIONS[type]) return false;

    if (game.inputCooldown > 0) {
      game.shake = Math.max(game.shake, 0.8);
      return false;
    }

    const task = nearestTask();
    if (!task) {
      game.shake = Math.max(game.shake, 1.4);
      game.inputCooldown = 0.12;
      return false;
    }

    if (task.type !== type) {
      task.failed = true;
      task.errorTime = 0.42;
      task.hintTime = 0.9;
      game.stats = recordMistake(game.stats);
      game.shake = Math.max(game.shake, 2.3);
      game.inputCooldown = 0.2;
      return false;
    }

    task.failed = false;
    task.errorTime = 0;
    task.hintTime = 0.35;
    task.correctTime = 0.55;
    task.target = 1;
    task.solved = true;
    task.resolved = true;
    task.progress = Math.max(task.progress, 0.12);
    game.stats = recordCorrect(game.stats);
    game.mastered.add(type);
    game.lastGuidanceKey = "";
    syncGuidance();
    game.inputCooldown = 0.24;
    return true;
  }

  function nearestTask() {
    const zoneLeft = view.playerX - 260 * view.scale;
    const zoneRight = view.w - 72 * view.scale;

    for (const task of game.obstacles) {
      if (task.target >= 1 || task.resolved) continue;
      const w = taskWidth(task);
      const right = task.x + w;
      if (right < zoneLeft) continue;
      if (task.x > zoneRight) continue;
      return task;
    }

    return null;
  }

  function recoverMiss(task) {
    task.failed = true;
    task.errorTime = 0.6;
    task.hintTime = 0.8;
    task.target = 1;
    task.resolved = true;
    task.progress = Math.max(task.progress, 0.08);
    game.stats = recordMistake(game.stats, { resolve: true });
    game.shake = Math.max(game.shake, 3.2);
  }

  function die() {
    if (game.mode !== "running") return;
    game.mode = "falling";
    syncTouchControls();
    game.failTimer = 1.15;
    game.fallStep = 0;
    game.shake = 8;
  }

  function startVictory() {
    if (game.mode !== "running") return;
    game.mode = "victory";
    syncTouchControls();
    game.victoryTimer = 1.35;
    game.shake = 0;
  }

  function readBestScore() {
    try {
      return Math.max(0, Number(localStorage.getItem(BEST_SCORE_KEY)) || 0);
    } catch {
      return 0;
    }
  }

  function writeBestScore(score) {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch {}
  }

  function resultMeta() {
    const best = Math.max(readBestScore(), game.stats.score);
    const accuracy = sessionAccuracy(game.stats);
    return `${copy.mastered} ${game.mastered.size}/${ACTION_ORDER.length} ${copy.operations} | ${copy.accuracy} ${accuracy}% | ${copy.mistakes} ${game.stats.mistakes} | ${copy.score} ${game.stats.score} | ${copy.best} ${best}`;
  }

  function complete() {
    if (game.mode !== "victory") return;
    game.mode = "complete";
    const best = readBestScore();
    if (game.stats.score > best) writeBestScore(game.stats.score);
    showRestart(copy.complete, resultMeta());
  }

  function showRestart(title, meta) {
    restartTitle.textContent = title;
    restartMeta.textContent = meta + " | " + copy.restart;
    restartPanel.hidden = false;
    syncTouchControls();
    restartButton.focus({ preventScroll: true });
  }

  function updateDemoAutomation() {
    const triggerX = view.playerX + 330 * view.scale;
    for (const task of game.obstacles) {
      if (task.solved || task.target >= 1) continue;
      if (task.x < triggerX) {
        task.failed = false;
        task.errorTime = 0;
        task.hintTime = 0.45;
        task.target = 1;
        task.solved = true;
        task.resolved = true;
        task.progress = Math.max(task.progress, 0.06);
        break;
      }
    }
  }

  function update(dt) {
    if (
      game.mode === "running" ||
      game.mode === "demo" ||
      game.mode === "falling" ||
      game.mode === "victory"
    )
      game.time += dt;
    game.inputCooldown = Math.max(0, game.inputCooldown - dt);
    for (const task of game.obstacles) {
      task.errorTime = Math.max(0, (task.errorTime || 0) - dt);
      task.hintTime = Math.max(0, (task.hintTime || 0) - dt);
      task.correctTime = Math.max(0, (task.correctTime || 0) - dt);
    }

    if (game.mode === "falling") {
      game.failTimer = Math.max(0, game.failTimer - dt);
      game.fallStep = game.failTimer > 0.55 ? 0 : 1;
      if (game.failTimer <= 0) {
        game.mode = "dead";
        showRestart(copy.fell, resultMeta());
      }
      game.shake = Math.max(0, game.shake - dt * 18);
      return;
    }

    if (game.mode === "victory") {
      game.victoryTimer = Math.max(0, game.victoryTimer - dt);
      if (game.victoryTimer <= 0) complete();
      return;
    }

    if (game.mode === "running" || game.mode === "demo") {
      const demo = game.mode === "demo";
      const phase = phaseForIndex(Math.min(game.stats.resolved, SESSION_LENGTH - 1));
      const phaseFactor = phase === "tutorial" ? 0.82 : phase === "exam" ? 1.08 : 1;
      game.speed = demo
        ? view.speed * 0.78
        : view.speed * phaseFactor + Math.min(48 * view.scale, game.time * 1.4 * view.scale);
      game.world += game.speed * dt;
      for (const task of game.obstacles) {
        task.x -= game.speed * dt;
        task.progress += (task.target - task.progress) * Math.min(1, dt * 10);
      }
      for (const decor of game.decor) decor.x -= game.speed * dt;
      if (game.finishX != null) game.finishX -= game.speed * dt;

      updateDecor();
      if (demo) updateDemoAutomation();
      if (!demo) {
        for (const task of game.obstacles) {
          if (task.target >= 1 || task.resolved) continue;
          if (!footInHole(task)) continue;
          if (missIsLethal(task.phase)) {
            game.stats = recordMistake(game.stats);
            die();
          } else {
            recoverMiss(task);
          }
          break;
        }
      }
      while (
        game.obstacles.length &&
        game.obstacles[0].x + taskWidth(game.obstacles[0]) < -180 * view.scale
      ) {
        game.obstacles.shift();
      }
      while (game.decor.length && game.decor[0].x < -220 * view.scale) game.decor.shift();
      fillQueue();
      if (!demo && game.finishX != null && game.finishX < view.playerX + 80 * view.scale)
        startVictory();
    }
    game.shake = Math.max(0, game.shake - dt * 24);
  }

  function updateDecor() {
    if (!decorSprites.length) return;
    if (game.nextDecorX < view.w + 80 * view.scale)
      game.nextDecorX = view.w + rnd(120, 260) * view.scale;
    let guard = 0;
    while (game.nextDecorX < view.w + 980 * view.scale && guard++ < 12) {
      const spriteIndex = irnd(0, decorSprites.length - 1);
      const scale = rnd(0.76, 1.08) * envTileScale();
      game.decor.push({
        x: game.nextDecorX,
        spriteIndex,
        scale,
        flip: Math.random() > 0.5,
        yOffset: rnd(-2, 4) * view.scale,
      });
      game.nextDecorX += rnd(420, 760) * view.scale;
    }
  }

  function footInHole(task) {
    const foot = view.footX;
    const h = taskHoleRect(task);
    return foot >= h.x && foot <= h.x + h.w;
  }

  function draw() {
    ctx.clearRect(0, 0, view.w, view.h);
    rect(0, 0, view.w, view.h, "#007a7a");
    rect(0, view.floor + Math.round(14 * view.scale), view.w, view.h - view.floor, "#5a341d");
    const amp = game.shake;
    ctx.save();
    if (amp > 0) ctx.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
    drawFloor();
    for (const task of game.obstacles) drawTaskHole(task);
    drawDecor();
    drawFinishFlag();
    for (const task of game.obstacles) drawTask(task);
    drawKnight();
    ctx.restore();
    drawSessionHud();
    drawPinnedHint();
    syncGuidance();
  }

  function drawSessionHud() {
    if (game.mode !== "running") return;
    const phase = phaseForIndex(Math.min(game.stats.resolved, SESSION_LENGTH - 1));
    const label = `${copy.phaseLabels[phase]} ${game.stats.resolved}/${SESSION_LENGTH} | ${copy.mistakes} ${game.stats.mistakes} | ${copy.accuracy} ${sessionAccuracy(game.stats)}%`;
    let fontSize = Math.round(clamp(11 * view.scale, 8, 12));
    const padX = Math.round(clamp(10 * view.scale, 8, 12));
    const padY = Math.round(clamp(7 * view.scale, 5, 8));
    const left = Math.round(clamp(12 * view.scale, 8, 14));
    const top = Math.round(clamp(44 * view.scale, 28, 46));
    const maxBoxW = Math.max(80, view.w - left - 4);

    ctx.save();
    ctx.font = `700 ${fontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let labelWidth = ctx.measureText(label).width;
    while (fontSize > 6 && labelWidth + padX * 2 > maxBoxW) {
      fontSize -= 1;
      ctx.font = `700 ${fontSize}px "Press Start 2P", monospace`;
      labelWidth = ctx.measureText(label).width;
    }
    const boxW = Math.min(maxBoxW, Math.ceil(labelWidth + padX * 2));
    const boxH = Math.ceil(fontSize + padY * 2);
    rect(left, top, boxW, boxH, "#fff");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(1, Math.round(view.scale));
    ctx.strokeRect(left + 0.5, top + 0.5, boxW - 1, boxH - 1);
    ctx.fillStyle = "#000";
    ctx.fillText(label, left + padX, top + padY, Math.max(1, boxW - padX * 2));
    ctx.restore();
  }

  function envTileScale() {
    return clamp(view.scale * 1.78, 1.22, 2.35);
  }

  function groundTileSize() {
    const s = envTileScale();
    return {
      w: groundReady ? Math.max(1, groundTile.width * s) : 120 * s,
      h: groundReady ? groundTile.height * s : 48 * s,
    };
  }

  function pitTileSize() {
    const s = envTileScale();
    return {
      w: pitReady ? Math.max(1, pitTile.width * s) : 112 * s,
      h: pitReady ? pitTile.height * s : 48 * s,
    };
  }

  function pitDrawRect(task) {
    const h = taskHoleRect(task);
    const size = pitTileSize();
    const drawW = Math.max(size.w * 1.18, h.w + 112 * view.scale);
    return {
      x: Math.round(h.x + h.w * 0.5 - drawW * 0.5),
      y: Math.round(view.floor),
      w: Math.round(drawW),
      h: Math.round(size.h),
    };
  }

  function drawImageMaybeFlip(image, x, y, w, h, flip = false) {
    if (!flip) {
      ctx.drawImage(image, Math.floor(x), Math.round(y), Math.ceil(w), Math.ceil(h));
      return;
    }
    ctx.save();
    ctx.translate(Math.floor(x) + Math.ceil(w), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, Math.ceil(w), Math.ceil(h));
    ctx.restore();
  }

  function drawGroundTilesClipped(left, right) {
    if (right <= left) return;
    const size = groundTileSize();
    const top = Math.round(view.floor);

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      Math.floor(left) - 12,
      top,
      Math.ceil(right - left) + 24,
      Math.ceil(size.h + 18 * view.scale),
    );
    ctx.clip();

    rect(
      left - 16,
      top + Math.round(10 * view.scale),
      right - left + 32,
      size.h + 18 * view.scale,
      "#5a341d",
    );

    if (!groundReady) {
      rect(left, top, right - left, Math.max(2, Math.round(3 * view.scale)), "#000");
      ctx.restore();
      return;
    }

    const overlap = Math.max(14, Math.round(24 * view.scale));
    const tileW = Math.ceil(size.w);
    const tileH = Math.ceil(size.h);
    const step = Math.max(1, tileW - overlap);
    const offset = -(((game.world % step) + step) % step);

    for (let x = offset - step * 4; x < view.w + step * 4; x += step) {
      drawImageMaybeFlip(groundTile, Math.floor(x), top, tileW, tileH, false);
    }

    ctx.restore();
  }

  function drawFloor() {
    drawGroundTilesClipped(-16, view.w + 16);
  }

  function drawTaskHole(task) {
    const p = pitDrawRect(task);

    if (!pitReady) return;

    drawImageMaybeFlip(pitTile, p.x, p.y, p.w, p.h, task.index % 2 === 1);
  }

  function drawTask(task) {
    const floor = view.floor;
    const w = taskWidth(task);
    const x = task.x + w * 0.5;
    const p = smooth(task.progress);
    const sizes = taskSizes(task);
    const inputH = visualTextHeight(task.input, sizes.input);
    const outputH = visualTextHeight(task.output, sizes.output);
    const inputTop = floor - inputH - 24 * view.scale;
    const outputTop = floor - outputH - 24 * view.scale;

    if (task.target <= 0) {
      const wrongShake = task.errorTime > 0 ? Math.sin(game.time * 80) * 4 * view.scale : 0;
      const mode = task.errorTime > 0 ? "error" : "normal";
      drawTextTopSurface(task.input, x + wrongShake, inputTop, sizes.input, mode);
      return;
    }

    const size = sizes.input + (sizes.output - sizes.input) * p;
    const top = inputTop + (outputTop - inputTop) * p;
    const mode = (task.correctTime || 0) > 0 ? "correct" : "normal";

    drawTextTopSurface(task.output, x, top, size, mode);
  }

  function actionTitle(type) {
    return copy.actionTitles[type] ?? type;
  }

  function hintTask() {
    const showFromX = Math.min(view.w - 80 * view.scale, view.playerX + 520 * view.scale);
    const hideAfterX = view.playerX - 42 * view.scale;

    for (const task of game.obstacles) {
      if (task.solved) continue;
      const w = taskWidth(task);
      const taskRight = task.x + w;
      if (task.x > showFromX) continue;
      if (taskRight < hideAfterX) continue;
      return task;
    }

    return null;
  }

  function drawPinnedHint() {
    if (game.mode !== "running") return;
    const task = hintTask();
    if (!task) return;
    if (!task.showHint && !(task.failed && task.phase !== "exam")) return;

    const w = taskWidth(task);
    const taskRight = task.x + w;
    const showFromX = Math.min(view.w - 80 * view.scale, view.playerX + 520 * view.scale);
    const hideAfterX = view.playerX - 42 * view.scale;
    const fadeIn = clamp((showFromX - task.x) / (120 * view.scale), 0, 1);
    const fadeOut = clamp((taskRight - hideAfterX) / (44 * view.scale), 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= 0.02) return;

    const color = task.errorTime > 0 ? "#c00000" : "#000";
    const fontSize = Math.round(clamp(16 * view.scale, 13, 20));
    const smallSize = Math.round(clamp(12 * view.scale, 10, 15));
    const title = task.errorTime > 0 ? copy.wrongAction : actionTitle(task.type);
    const hint = HINTS[task.type];
    const preview = `${task.input} → ${task.output}`;
    const shortcut = `APP: Ctrl+Alt+Shift+${ACTIONS[task.type].appKey}`;
    const microSize = Math.round(clamp(10 * view.scale, 8, 12));
    const padX = Math.round(16 * view.scale);
    const padY = Math.round(10 * view.scale);
    const gap = Math.round(5 * view.scale);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `700 ${fontSize}px "Press Start 2P", monospace`;
    const w1 = ctx.measureText(`${hint}  ${title}`).width;
    ctx.font = `400 ${smallSize}px "Press Start 2P", monospace`;
    const w2 = ctx.measureText(preview).width;
    ctx.font = `400 ${microSize}px "Press Start 2P", monospace`;
    const w3 = ctx.measureText(shortcut).width;
    const boxW = Math.ceil(Math.max(w1, w2, w3) + padX * 2);
    const boxH = Math.ceil(fontSize + smallSize + microSize + padY * 2 + gap * 2);
    const left = Math.round((view.w - boxW) / 2);
    const top = Math.round(view.h - boxH - clamp(24 * view.scale, 18, 38));
    const cx = Math.round(view.w / 2);

    rect(left, top, boxW, boxH, "#fff");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(1, Math.round(1.5 * view.scale));
    ctx.strokeRect(
      Math.round(left) + 0.5,
      Math.round(top) + 0.5,
      Math.round(boxW) - 1,
      Math.round(boxH) - 1,
    );

    ctx.fillStyle = color;
    ctx.font = `700 ${fontSize}px "Press Start 2P", monospace`;
    ctx.fillText(`${hint}  ${title}`, cx, top + padY);
    ctx.font = `400 ${smallSize}px "Press Start 2P", monospace`;
    ctx.fillText(preview, cx, top + padY + fontSize + gap);
    ctx.font = `400 ${microSize}px "Press Start 2P", monospace`;
    ctx.fillText(shortcut, cx, top + padY + fontSize + gap + smallSize + gap);
    ctx.restore();
  }

  function drawDecor() {
    if (!game.decor.length) return;
    for (const item of game.decor) {
      const sprite = decorSprites[item.spriteIndex];
      if (!sprite || !sprite.ready) continue;
      const w = sprite.width * item.scale;
      const h = sprite.height * item.scale;
      const x = item.x;
      const y = view.floor - h + 8 * view.scale + item.yOffset;
      if (x + w < -20 || x > view.w + 20) continue;
      ctx.save();
      ctx.globalAlpha = 0.92;
      drawImageMaybeFlip(sprite, x, y, w, h, item.flip);
      ctx.restore();
    }
  }

  function drawFinishFlag() {
    if (game.finishX == null || !flagSprite.ready) return;
    const s = envTileScale() * 0.98;
    const w = flagSprite.width * s;
    const h = flagSprite.height * s;
    const x = game.finishX;
    const y = view.floor - h + 12 * view.scale;
    if (x + w < -40 || x > view.w + 80) return;
    drawImageMaybeFlip(flagSprite, x, y, w, h, false);
  }

  function drawKnight() {
    if (game.mode === "falling" || game.mode === "dead") {
      const sprite = fallSprites[game.mode === "dead" ? 1 : game.fallStep];
      if (sprite && sprite.ready) {
        const s = view.scale * 1.64;
        const w = sprite.width * s;
        const h = sprite.height * s;
        drawImageMaybeFlip(
          sprite,
          view.playerX - w * 0.52,
          view.floor - h + 14 * view.scale,
          w,
          h,
          false,
        );
        return;
      }
    }

    if ((game.mode === "victory" || game.mode === "complete") && victorySprite.ready) {
      const s = view.scale * 1.64;
      const w = victorySprite.width * s;
      const h = victorySprite.height * s;
      drawImageMaybeFlip(
        victorySprite,
        view.playerX - w * 0.48,
        view.floor - h + 14 * view.scale,
        w,
        h,
        false,
      );
      return;
    }

    const elapsed = Number.isFinite(game.time) ? game.time : 0;
    const frameIndex = ((Math.floor(elapsed * 10) % RUN.length) + RUN.length) % RUN.length;
    const frame = RUN[frameIndex] ?? RUN[0];
    const s = view.scale * 1.18;
    const dw = Math.round(frame.w * s);
    const dh = Math.round(frame.h * s);
    const dx = Math.round(view.playerX - dw * 0.5);
    const dy = Math.round(view.floor - dh + 9 * s);
    if (!atlasReady) {
      rect(
        view.playerX - 42 * view.scale,
        view.floor - 84 * view.scale,
        84 * view.scale,
        70 * view.scale,
        "#000",
      );
      return;
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.rect(view.playerX - 142 * s, view.floor - 224 * s, 284 * s, 232 * s);
    ctx.clip();
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(atlas, frame.x, frame.y, frame.w, frame.h, 0, 0, dw, dh);
    ctx.restore();
  }

  function loop(now) {
    if (!active || destroyed) {
      game.raf = 0;
      return;
    }
    const dt = Math.max(0, Math.min(0.034, (now - game.last) / 1000 || 0));
    game.last = now;
    updateView();
    update(dt);
    draw();
    game.raf = requestAnimationFrame(loop);
  }

  function actionFromKeyboardEvent(event) {
    return actionFromCode(event.code || "") ?? actionFromCode(event.key || "");
  }

  function syncTouchControls() {
    if (!runnerControls) return;
    runnerControls.hidden = game.mode !== "running";
  }

  function handleKey(event) {
    if (!active || destroyed || !root.contains(document.activeElement)) return;
    const code = event.code || "";
    const key = event.key || "";
    const isEnter = code === "Enter" || key === "Enter" || event.keyCode === 13;
    const action = actionFromKeyboardEvent(event);

    if (!startPanel.hidden) {
      if (isEnter) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        if (!event.repeat) reset();
        return;
      }
      if (action) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        return;
      }
    }

    if (!restartPanel.hidden) {
      if (isEnter) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        if (!event.repeat) reset();
        return;
      }
      if (action) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        return;
      }
    }

    if (action) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      event.stopPropagation();
      if (!event.repeat) command(action);
      return;
    }
  }

  window.addEventListener("keydown", handleKey, {
    capture: true,
    passive: false,
    signal: abortController.signal,
  });

  for (const button of actionButtons) {
    const type = button.dataset.awfulCasesAction;
    if (!ACTIONS[type]) continue;
    button.addEventListener(
      "pointerdown",
      (event) => {
        if (!active || destroyed) return;
        event.preventDefault();
        event.stopPropagation();
        command(type);
        focusCanvas();
      },
      { signal: abortController.signal },
    );
  }

  let startPointerHandled = false;

  startButton.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      startPointerHandled = true;
      reset();
    },
    { signal: abortController.signal },
  );

  startButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (startPointerHandled) {
        startPointerHandled = false;
        return;
      }
      reset();
    },
    { signal: abortController.signal },
  );

  let restartPointerHandled = false;

  restartButton.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      restartPointerHandled = true;
      reset();
    },
    { signal: abortController.signal },
  );

  restartButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (restartPointerHandled) {
        restartPointerHandled = false;
        return;
      }
      reset();
    },
    { signal: abortController.signal },
  );

  root.awfulCasesCaseTrainer = { game, view, dictionary, command, reset, startDemo, nearestTask };
  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(root);
  window.addEventListener("resize", resize, { passive: true, signal: abortController.signal });
  populateTrainerUi();
  resize();
  startDemo();

  return {
    setActive(nextActive) {
      if (destroyed) return;
      active = Boolean(nextActive);
      if (!active) {
        if (game.raf) cancelAnimationFrame(game.raf);
        game.raf = 0;
        return;
      }
      resize();
      game.last = performance.now();
      if (!game.raf) game.raf = requestAnimationFrame(loop);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      active = false;
      if (game.raf) cancelAnimationFrame(game.raf);
      game.raf = 0;
      resizeObserver?.disconnect();
      abortController.abort();
      delete root.awfulCasesCaseTrainer;
    },
  };
}
