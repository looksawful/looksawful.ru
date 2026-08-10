export function enhanceAwfulCases(root) {
  if (!(root instanceof HTMLElement)) return { setActive() {}, destroy() {} };
  let active = false;
  let destroyed = false;
  const abortController = new AbortController();
  const ATLAS_SRC = "/pets/awful-cases/assets/atlas.png";
  const GROUND_SRC = "/pets/awful-cases/assets/ground.png";
  const PIT_SRC = "/pets/awful-cases/assets/pit.png";
  const FALL1_SRC = "/pets/awful-cases/assets/fall1.png";
  const FALL2_SRC = "/pets/awful-cases/assets/fall2.png";
  const VICTORY_SRC = "/pets/awful-cases/assets/victory.png";
  const FLAG_SRC = "/pets/awful-cases/assets/flag.png";
  const DECOR_SOURCES = [
    "/pets/awful-cases/assets/decor-1.png",
    "/pets/awful-cases/assets/decor-2.png",
    "/pets/awful-cases/assets/decor-3.png"
  ];
  const DICTIONARY = [{"type":"upper","input":"a","output":"A"},{"type":"upper","input":"b","output":"B"},{"type":"upper","input":"c","output":"C"},{"type":"upper","input":"d","output":"D"},{"type":"upper","input":"e","output":"E"},{"type":"upper","input":"f","output":"F"},{"type":"upper","input":"g","output":"G"},{"type":"upper","input":"h","output":"H"},{"type":"upper","input":"i","output":"I"},{"type":"upper","input":"j","output":"J"},{"type":"upper","input":"k","output":"K"},{"type":"upper","input":"l","output":"L"},{"type":"upper","input":"usa","output":"USA"},{"type":"upper","input":"eu","output":"EU"},{"type":"upper","input":"nasa","output":"NASA"},{"type":"upper","input":"html","output":"HTML"},{"type":"upper","input":"css","output":"CSS"},{"type":"upper","input":"api","output":"API"},{"type":"upper","input":"ui","output":"UI"},{"type":"upper","input":"ux","output":"UX"},{"type":"upper","input":"pdf","output":"PDF"},{"type":"upper","input":"url","output":"URL"},{"type":"upper","input":"id","output":"ID"},{"type":"upper","input":"json","output":"JSON"},{"type":"lower","input":"IF","output":"if"},{"type":"lower","input":"BECAUSE","output":"because"},{"type":"lower","input":"HOWEVER","output":"however"},{"type":"lower","input":"BEFORE","output":"before"},{"type":"lower","input":"AFTER","output":"after"},{"type":"lower","input":"BETWEEN","output":"between"},{"type":"lower","input":"INSIDE","output":"inside"},{"type":"lower","input":"OUTSIDE","output":"outside"},{"type":"lower","input":"TODAY","output":"today"},{"type":"lower","input":"TOMORROW","output":"tomorrow"},{"type":"lower","input":"EXAMPLE","output":"example"},{"type":"lower","input":"THEREFORE","output":"therefore"},{"type":"lower","input":"ALSO","output":"also"},{"type":"lower","input":"WINDOW","output":"window"},{"type":"lower","input":"BUTTON","output":"button"},{"type":"lower","input":"SCREEN","output":"screen"},{"type":"toggle","input":"aLEX","output":"Alex"},{"type":"toggle","input":"mARIA","output":"Maria"},{"type":"toggle","input":"jOHN","output":"John"},{"type":"toggle","input":"aNNA","output":"Anna"},{"type":"toggle","input":"sERGEY","output":"Sergey"},{"type":"toggle","input":"mAX","output":"Max"},{"type":"toggle","input":"oLEG","output":"Oleg"},{"type":"toggle","input":"jULIA","output":"Julia"},{"type":"toggle","input":"sONIA","output":"Sonia"},{"type":"toggle","input":"eGOR","output":"Egor"},{"type":"toggle","input":"vOVA","output":"Vova"},{"type":"toggle","input":"iVAN","output":"Ivan"},{"type":"toggle","input":"aLEX mARIA","output":"Alex Maria"},{"type":"toggle","input":"mARIA jOHN","output":"Maria John"},{"type":"toggle","input":"aNNA oLEG","output":"Anna Oleg"},{"type":"toggle","input":"eGOR jULIA","output":"Egor Julia"},{"type":"toggle","input":"sONIA mAX","output":"Sonia Max"},{"type":"toggle","input":"iVAN sERGEY","output":"Ivan Sergey"},{"type":"title","input":"ivan","output":"Ivan"},{"type":"title","input":"maria","output":"Maria"},{"type":"title","input":"john","output":"John"},{"type":"title","input":"anna","output":"Anna"},{"type":"title","input":"sergey","output":"Sergey"},{"type":"title","input":"alex","output":"Alex"},{"type":"title","input":"oleg","output":"Oleg"},{"type":"title","input":"julia","output":"Julia"},{"type":"title","input":"sonia","output":"Sonia"},{"type":"title","input":"egor","output":"Egor"},{"type":"title","input":"vova","output":"Vova"},{"type":"title","input":"max","output":"Max"},{"type":"title","input":"new york","output":"New York"},{"type":"title","input":"los angeles","output":"Los Angeles"},{"type":"title","input":"san francisco","output":"San Francisco"},{"type":"title","input":"jestei pool","output":"Jestei Pool"},{"type":"title","input":"awful cases","output":"Awful Cases"},{"type":"title","input":"case trainer","output":"Case Trainer"},{"type":"title","input":"windows utility","output":"Windows Utility"},{"type":"title","input":"github pages","output":"GitHub Pages"},{"type":"title","input":"sample 78","output":"Sample 78"},{"type":"title","input":"sample 79","output":"Sample 79"}];
  const ACTIONS = {
    upper:  { code:'ArrowUp',    label:'↑' },
    lower:  { code:'ArrowDown',  label:'↓' },
    toggle: { code:'ArrowRight', label:'→' },
    title:  { code:'ArrowLeft',  label:'←' }
  };

  const SESSION_LENGTH = 16;
  const TRAINING_SEQUENCE = [
    'upper','upper','upper','upper',
    'lower','lower','lower','lower',
    'toggle','toggle','toggle','toggle',
    'title','title','title','title'
  ];
  const HINTS = {
    upper: '↑',
    lower: '↓',
    toggle: '→',
    title: '←'
  };
  const canvas = root.querySelector('[data-awful-cases-canvas]');
  const startPanel = root.querySelector('[data-awful-cases-start]');
  const startButton = root.querySelector('[data-awful-cases-start-button]');
  const restartPanel = root.querySelector('[data-awful-cases-restart]');
  const restartTitle = root.querySelector('[data-awful-cases-restart-title]');
  const restartMeta = root.querySelector('[data-awful-cases-restart-meta]');
  const restartButton = root.querySelector('[data-awful-cases-restart-button]');
  const ctx = canvas.getContext('2d', { alpha:false });
  const atlas = new Image();
  let atlasReady = false;
  atlas.onload = () => { atlasReady = true; };
  atlas.src = ATLAS_SRC;

  const groundTile = new Image();
  let groundReady = false;
  groundTile.onload = () => { groundReady = true; };
  groundTile.src = GROUND_SRC;

  const pitTile = new Image();
  let pitReady = false;
  pitTile.onload = () => { pitReady = true; };
  pitTile.src = PIT_SRC;

  function loadSprite(src) {
    const image = new Image();
    image.ready = false;
    image.onload = () => { image.ready = true; };
    image.src = src;
    return image;
  }

  const fallSprites = [loadSprite(FALL1_SRC), loadSprite(FALL2_SRC)];
  const victorySprite = loadSprite(VICTORY_SRC);
  const flagSprite = loadSprite(FLAG_SRC);
  const decorSprites = DECOR_SOURCES.map(loadSprite);

  const RUN = Array.from({ length:6 }, (_, i) => ({ x:i*270, y:0, w:270, h:230 }));
  const TYPES = ['upper','lower','toggle','title'];
  const view = { w:0, h:0, dpr:1, floor:0, scale:1, playerX:0, footX:0, font:32, speed:180 };
  const game = {
    mode:'demo',
    time:0,
    last:performance.now(),
    speed:180,
    obstacles:[],
    decor:[],
    nextDecorX:0,
    finishX:null,
    victoryTimer:0,
    fallStep:0,
    nextType:0,
    shake:0,
    raf:0,
    failTimer:0,
    inputCooldown:0,
    spawned:0,
    solved:0,
    mistakes:0,
    phaseHintShown:{ upper:false, lower:false, toggle:false, title:false },
    completeTimer:0,
    world:0
  };

  function resize() {
    view.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    view.w = Math.max(260, root.clientWidth || 260);
    view.h = Math.max(320, root.clientHeight || 320);
    canvas.width = Math.floor(view.w * view.dpr);
    canvas.height = Math.floor(view.h * view.dpr);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    updateView();
  }

  function updateView() {
    const compact = view.w < 560;
    view.scale = clamp(Math.min(view.w / 1180, view.h / 520), compact ? .32 : .46, 1.34);
    view.floor = Math.round(view.h * (compact ? .68 : .66));
    view.playerX = Math.round(view.w * (compact ? .44 : .5));
    view.footX = view.playerX + 36 * view.scale;
    view.font = Math.round(clamp(33 * view.scale, compact ? 13 : 18, 44));
    view.speed = 205 * view.scale;
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function setFont(size = view.font, weight = 900) {
    ctx.font = `${weight} ${Math.round(size)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';
    ctx.fontKerning = 'normal';
  }

  function textMetrics(text, size = view.font, weight = 900) {
    setFont(size, weight);
    const m = ctx.measureText(text);
    const ascent = Math.ceil(m.actualBoundingBoxAscent || size * .78);
    const descent = Math.ceil(m.actualBoundingBoxDescent || size * .22);
    return { width:m.width, ascent, descent, height:ascent + descent };
  }

  function textWidth(text, size = view.font) {
    return textMetrics(text, size).width;
  }

  function visualTextHeight(text, size) {
    return textMetrics(text, size).height;
  }

  function drawTextTop(text, x, topY, size, color = '#000', alpha = 1, weight = 900) {
    const m = textMetrics(text, size, weight);
    ctx.save();
    setFont(size, weight);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillText(text, Math.round(x), Math.round(topY + m.ascent));
    ctx.restore();
    return m;
  }

  function drawTextTopSurface(text, x, topY, size, mode = 'normal', alpha = 1, weight = 900) {
    const m = textMetrics(text, size, weight);
    const baseline = Math.round(topY + m.ascent);

    let lightColor = '#000';
    let darkColor = '#fff';

    if (mode === 'error') {
      lightColor = '#c00000';
      darkColor = '#ff4040';
    } else if (mode === 'correct') {
      lightColor = '#008a24';
      darkColor = '#30ff65';
    }

    ctx.save();
    setFont(size, weight);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = lightColor;
    ctx.fillText(text, Math.round(x), baseline);
    ctx.beginPath();
    ctx.rect(0, view.floor, view.w, view.h - view.floor);
    ctx.clip();
    ctx.fillStyle = darkColor;
    ctx.fillText(text, Math.round(x), baseline);
    ctx.restore();
    return m;
  }

  function taskSizes(task) {
    if (task.type === 'upper') {
      return { input:view.font * .38, output:view.font * 1.34 };
    }
    if (task.type === 'lower') {
      return { input:view.font * 3.52, output:view.font * .84 };
    }
    return { input:view.font * 2.72, output:view.font * 1.08 };
  }

  function taskTextWidth(task, which = 'output') {
    const sizes = taskSizes(task);
    const text = which === 'input' ? task.input : task.output;
    const size = which === 'input' ? sizes.input : sizes.output;
    return textWidth(text, size);
  }

  function taskWidth(task) {
    const a = taskTextWidth(task, 'input');
    const b = taskTextWidth(task, 'output');
    return Math.max(a, b) + 76 * view.scale;
  }

  function taskHoleRect(task) {
    const holeW = Math.max(96 * view.scale, taskTextWidth(task, 'output') + 94 * view.scale);
    const w = taskWidth(task);
    return {
      x: task.x + w * .5 - holeW * .5,
      w: holeW
    };
  }

  function randomTask(type) {
    const pool = DICTIONARY.filter(item => item.type === type);
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
      failed: false
    };
  }

  function spawn(type = null, x = null) {
    const chosenType = type || TYPES[game.nextType++ % TYPES.length];
    const task = randomTask(chosenType);
    const last = game.obstacles[game.obstacles.length - 1];
    const w = taskWidth(task);
    const minX = view.w + 120 * view.scale;
    const gap = rnd(360, 520) * view.scale;
    task.x = x ?? (last ? Math.max(minX, last.x + taskWidth(last) + gap) : minX);
    task._w = w;
    task.index = game.spawned;
    task.showHint = !game.phaseHintShown[task.type];
    if (task.showHint) game.phaseHintShown[task.type] = true;
    game.spawned += 1;
    game.obstacles.push(task);
    if (game.mode === 'running' && game.spawned === SESSION_LENGTH) {
      game.finishX = task.x + w + 520 * view.scale;
    }
    return task;
  }

  function canSpawn() {
    return game.mode === 'demo' || game.spawned < SESSION_LENGTH;
  }

  function spawnNext(x = null) {
    if (!canSpawn()) return null;
    const idx = game.mode === 'demo' ? game.spawned % TRAINING_SEQUENCE.length : game.spawned;
    const type = TRAINING_SEQUENCE[idx] || TYPES[game.nextType++ % TYPES.length];
    return spawn(type, x);
  }

  function resetState(mode) {
    game.mode = mode;
    game.time = 0;
    game.speed = view.speed;
    game.shake = 0;
    game.failTimer = 0;
    game.inputCooldown = 0;
    game.spawned = 0;
    game.solved = 0;
    game.mistakes = 0;
    game.completeTimer = 0;
    game.victoryTimer = 0;
    game.fallStep = 0;
    game.world = 0;
    game.phaseHintShown = { upper:false, lower:false, toggle:false, title:false };
    game.obstacles.length = 0;
    game.decor.length = 0;
    game.nextDecorX = view.w + 240 * view.scale;
    game.finishX = null;
    game.nextType = 0;
  }

  function focusCanvas() {
    if (!active || destroyed) return;
    setTimeout(() => {
      if (active && !destroyed && root.isConnected) canvas.focus({ preventScroll:true });
    }, 0);
  }

  function startDemo() {
    resetState('demo');
    startPanel.hidden = false;
    restartPanel.hidden = true;
    spawnNext(view.playerX + 380 * view.scale);
    fillQueue();
    focusCanvas();
  }

  function reset() {
    resetState('running');
    startPanel.hidden = true;
    restartPanel.hidden = true;
    spawnNext(view.playerX + 300 * view.scale);
    fillQueue();
    focusCanvas();
  }

  function fillQueue() {
    let guard = 0;
    while (game.obstacles.length < 5 && canSpawn() && guard++ < 30) spawnNext();
    while (game.obstacles.length && canSpawn() && game.obstacles[game.obstacles.length - 1].x < view.w + 760 * view.scale && guard++ < 60) spawnNext();
  }

  function command(type) {
    if (game.mode !== 'running') return false;

    if (game.inputCooldown > 0) {
      game.shake = Math.max(game.shake, .8);
      return false;
    }

    const task = nearestTask();

    if (!task) {
      game.shake = Math.max(game.shake, 1.4);
      game.inputCooldown = .12;
      return false;
    }

    if (task.type !== type) {
      task.failed = true;
      task.errorTime = .42;
      task.hintTime = .9;
      game.mistakes += 1;
      game.shake = Math.max(game.shake, 2.3);
      game.inputCooldown = .20;
      return false;
    }

    task.failed = false;
    task.errorTime = 0;
    task.hintTime = .35;
    task.correctTime = .55;
    task.target = 1;
    task.solved = true;
    task.progress = Math.max(task.progress, .12);
    game.solved += 1;
    game.inputCooldown = .24;

    return true;
  }

  function nearestTask() {
    const zoneLeft = view.playerX - 260 * view.scale;
    const zoneRight = view.w - 72 * view.scale;

    for (const task of game.obstacles) {
      if (task.target >= 1 || task.solved) continue;
      const w = taskWidth(task);
      const right = task.x + w;
      if (right < zoneLeft) continue;
      if (task.x > zoneRight) continue;
      return task;
    }

    return null;
  }

  function die() {
    if (game.mode !== 'running') return;
    game.mode = 'falling';
    game.failTimer = 1.15;
    game.fallStep = 0;
    game.shake = 8;
  }

  function startVictory() {
    if (game.mode !== 'running') return;
    game.mode = 'victory';
    game.victoryTimer = 1.35;
    game.shake = 0;
  }

  function complete() {
    if (game.mode !== 'victory') return;
    game.mode = 'complete';
    showRestart('complete', `${game.solved} of ${SESSION_LENGTH} · mistakes: ${game.mistakes}`);
  }

  function showRestart(title, meta) {
    restartTitle.textContent = title;
    restartMeta.textContent = meta + ' · enter — restart';
    restartPanel.hidden = false;
    restartButton.focus({ preventScroll:true });
  }

  function updateDemoAutomation() {
    const triggerX = view.playerX + 330 * view.scale;
    for (const task of game.obstacles) {
      if (task.solved || task.target >= 1) continue;
      if (task.x < triggerX) {
        task.failed = false;
        task.errorTime = 0;
        task.hintTime = .45;
        task.target = 1;
        task.solved = true;
        task.progress = Math.max(task.progress, .06);
        game.solved += 1;
        break;
      }
    }
  }

  function update(dt) {
    if (game.mode === 'running' || game.mode === 'demo' || game.mode === 'falling' || game.mode === 'victory') game.time += dt;
    game.inputCooldown = Math.max(0, game.inputCooldown - dt);
    for (const task of game.obstacles) {
      task.errorTime = Math.max(0, (task.errorTime || 0) - dt);
      task.hintTime = Math.max(0, (task.hintTime || 0) - dt);
      task.correctTime = Math.max(0, (task.correctTime || 0) - dt);
    }

    if (game.mode === 'falling') {
      game.failTimer = Math.max(0, game.failTimer - dt);
      game.fallStep = game.failTimer > .55 ? 0 : 1;
      if (game.failTimer <= 0) {
        game.mode = 'dead';
        showRestart('fell', `${game.solved} of ${SESSION_LENGTH} · mistakes: ${game.mistakes}`);
      }
      game.shake = Math.max(0, game.shake - dt * 18);
      return;
    }

    if (game.mode === 'victory') {
      game.victoryTimer = Math.max(0, game.victoryTimer - dt);
      if (game.victoryTimer <= 0) complete();
      return;
    }

    if (game.mode === 'running' || game.mode === 'demo') {
      const demo = game.mode === 'demo';
      game.speed = demo
        ? view.speed * .78
        : view.speed + Math.min(72 * view.scale, game.time * 2.2 * view.scale);
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
          if (task.target >= 1) continue;
          if (footInHole(task)) {
            die();
            break;
          }
        }
      }
      while (game.obstacles.length && game.obstacles[0].x + taskWidth(game.obstacles[0]) < -180 * view.scale) {
        game.obstacles.shift();
      }
      while (game.decor.length && game.decor[0].x < -220 * view.scale) game.decor.shift();
      fillQueue();
      if (!demo && game.finishX != null && game.finishX < view.playerX + 80 * view.scale) startVictory();
    }
    game.shake = Math.max(0, game.shake - dt * 24);
  }

  function updateDecor() {
    if (!decorSprites.length) return;
    if (game.nextDecorX < view.w + 80 * view.scale) game.nextDecorX = view.w + rnd(120, 260) * view.scale;
    let guard = 0;
    while (game.nextDecorX < view.w + 980 * view.scale && guard++ < 12) {
      const spriteIndex = irnd(0, decorSprites.length - 1);
      const sprite = decorSprites[spriteIndex];
      const scale = rnd(.76, 1.08) * envTileScale();
      game.decor.push({
        x: game.nextDecorX,
        spriteIndex,
        scale,
        flip: Math.random() > .5,
        yOffset: rnd(-2, 4) * view.scale
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
    rect(0, 0, view.w, view.h, '#007a7a');
    rect(0, view.floor + Math.round(14 * view.scale), view.w, view.h - view.floor, '#5a341d');
    const amp = game.shake;
    ctx.save();
    if (amp > 0) ctx.translate((Math.random() - .5) * amp, (Math.random() - .5) * amp);
    drawFloor();
    for (const task of game.obstacles) drawTaskHole(task);
    drawDecor();
    drawFinishFlag();
    for (const task of game.obstacles) drawTask(task);
    drawKnight();
    ctx.restore();
    drawPinnedHint();
  }

  function envTileScale() {
    return clamp(view.scale * 1.78, 1.22, 2.35);
  }

  function groundTileSize() {
    const s = envTileScale();
    return {
      w: groundReady ? Math.max(1, groundTile.width * s) : 120 * s,
      h: groundReady ? groundTile.height * s : 48 * s
    };
  }

  function pitTileSize() {
    const s = envTileScale();
    return {
      w: pitReady ? Math.max(1, pitTile.width * s) : 112 * s,
      h: pitReady ? pitTile.height * s : 48 * s
    };
  }

  function pitDrawRect(task) {
    const h = taskHoleRect(task);
    const size = pitTileSize();
    const drawW = Math.max(size.w * 1.18, h.w + 112 * view.scale);
    return {
      x: Math.round(h.x + h.w * .5 - drawW * .5),
      y: Math.round(view.floor),
      w: Math.round(drawW),
      h: Math.round(size.h)
    };
  }

  function visiblePitRects() {
    const rects = [];
    for (const task of game.obstacles) {
      const p = pitDrawRect(task);
      if (p.x + p.w < -8 || p.x > view.w + 8) continue;
      rects.push(p);
    }
    rects.sort((a, b) => a.x - b.x);
    return rects;
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
    ctx.rect(Math.floor(left) - 12, top, Math.ceil(right - left) + 24, Math.ceil(size.h + 18 * view.scale));
    ctx.clip();

    rect(left - 16, top + Math.round(10 * view.scale), right - left + 32, size.h + 18 * view.scale, '#5a341d');

    if (!groundReady) {
      rect(left, top, right - left, Math.max(2, Math.round(3 * view.scale)), '#000');
      ctx.restore();
      return;
    }

    const overlap = Math.max(14, Math.round(24 * view.scale));
    const tileW = Math.ceil(size.w);
    const tileH = Math.ceil(size.h);
    const step = Math.max(1, tileW - overlap);
    const offset = -((game.world % step + step) % step);

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
    const x = task.x + w * .5;
    const p = smooth(task.progress);
    const sizes = taskSizes(task);
    const inputH = visualTextHeight(task.input, sizes.input);
    const outputH = visualTextHeight(task.output, sizes.output);
    let inputTop;
    if (task.type === 'upper') {
      inputTop = floor + 48 * view.scale;
    } else {
      inputTop = floor - inputH - 16 * view.scale;
    }

    if (task.target <= 0) {
      const wrongShake = task.errorTime > 0 ? Math.sin(game.time * 80) * 4 * view.scale : 0;
      const aboveGround = task.type !== 'upper';
      if (task.errorTime > 0) {
        drawTextTopSurface(task.input, x + wrongShake, inputTop, sizes.input, 'error');
      } else if (aboveGround) {
        drawTextTop(task.input, x + wrongShake, inputTop, sizes.input, '#b30000', 1, 900);
      } else {
        drawTextTopSurface(task.input, x + wrongShake, inputTop, sizes.input, 'normal');
      }
      return;
    }

    const startSize = sizes.input;
    const finalSize = sizes.output;
    const size = startSize + (finalSize - startSize) * p;
    const outputHNow = visualTextHeight(task.output, size);
    const startTop = task.type === 'upper'
      ? floor + 50 * view.scale
      : floor - outputH - 16 * view.scale;
    const finalTop = floor;
    const top = startTop + (finalTop - startTop) * p;
    const mode = (task.correctTime || 0) > 0 ? 'correct' : 'normal';

    drawTextTopSurface(task.output, x, top, size, mode);
  }

  function actionTitle(type) {
    if (type === 'upper') return 'uppercase';
    if (type === 'lower') return 'lowercase';
    if (type === 'toggle') return 'toggle case';
    if (type === 'title') return 'title case';
    return type;
  }

  function hintTask() {
    const showFromX = Math.min(view.w - 80 * view.scale, view.playerX + 520 * view.scale);
    const hideAfterX = view.playerX - 42 * view.scale;

    for (const task of game.obstacles) {
      const w = taskWidth(task);
      const taskRight = task.x + w;
      if (task.x > showFromX) continue;
      if (taskRight < hideAfterX) continue;
      return task;
    }

    return null;
  }

  function drawPinnedHint() {
    if (game.mode !== 'running') return;
    const task = hintTask();
    if (!task) return;

    const w = taskWidth(task);
    const taskRight = task.x + w;
    const showFromX = Math.min(view.w - 80 * view.scale, view.playerX + 520 * view.scale);
    const hideAfterX = view.playerX - 42 * view.scale;
    const fadeIn = clamp((showFromX - task.x) / (120 * view.scale), 0, 1);
    const fadeOut = clamp((taskRight - hideAfterX) / (44 * view.scale), 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha <= .02) return;

    const color = task.errorTime > 0 ? '#c00000' : '#000';
    const fontSize = Math.round(clamp(16 * view.scale, 13, 20));
    const smallSize = Math.round(clamp(12 * view.scale, 10, 15));
    const title = task.errorTime > 0 ? 'wrong action' : actionTitle(task.type);
    const hint = HINTS[task.type];
    const preview = `${task.input} → ${task.output}`;
    const padX = Math.round(16 * view.scale);
    const padY = Math.round(10 * view.scale);
    const gap = Math.round(5 * view.scale);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${fontSize}px "Press Start 2P", monospace`;
    const w1 = ctx.measureText(`${hint}  ${title}`).width;
    ctx.font = `400 ${smallSize}px "Press Start 2P", monospace`;
    const w2 = ctx.measureText(preview).width;
    const boxW = Math.ceil(Math.max(w1, w2) + padX * 2);
    const boxH = Math.ceil(fontSize + smallSize + padY * 2 + gap);
    const left = Math.round((view.w - boxW) / 2);
    const top = Math.round(view.h - boxH - clamp(24 * view.scale, 18, 38));
    const cx = Math.round(view.w / 2);

    rect(left, top, boxW, boxH, '#fff');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(1, Math.round(1.5 * view.scale));
    ctx.strokeRect(Math.round(left) + .5, Math.round(top) + .5, Math.round(boxW) - 1, Math.round(boxH) - 1);

    ctx.fillStyle = color;
    ctx.font = `700 ${fontSize}px "Press Start 2P", monospace`;
    ctx.fillText(`${hint}  ${title}`, cx, top + padY);
    ctx.font = `400 ${smallSize}px "Press Start 2P", monospace`;
    ctx.fillText(preview, cx, top + padY + fontSize + gap);
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
      ctx.globalAlpha = .92;
      drawImageMaybeFlip(sprite, x, y, w, h, item.flip);
      ctx.restore();
    }
  }

  function drawFinishFlag() {
    if (game.finishX == null || !flagSprite.ready) return;
    const s = envTileScale() * .98;
    const w = flagSprite.width * s;
    const h = flagSprite.height * s;
    const x = game.finishX;
    const y = view.floor - h + 12 * view.scale;
    if (x + w < -40 || x > view.w + 80) return;
    drawImageMaybeFlip(flagSprite, x, y, w, h, false);
  }

  function drawKnight() {
    if (game.mode === 'falling' || game.mode === 'dead') {
      const sprite = fallSprites[game.mode === 'dead' ? 1 : game.fallStep];
      if (sprite && sprite.ready) {
        const s = view.scale * 1.64;
        const w = sprite.width * s;
        const h = sprite.height * s;
        drawImageMaybeFlip(sprite, view.playerX - w * .52, view.floor - h + 14 * view.scale, w, h, false);
        return;
      }
    }

    if ((game.mode === 'victory' || game.mode === 'complete') && victorySprite.ready) {
      const s = view.scale * 1.64;
      const w = victorySprite.width * s;
      const h = victorySprite.height * s;
      drawImageMaybeFlip(victorySprite, view.playerX - w * .48, view.floor - h + 14 * view.scale, w, h, false);
      return;
    }

    const frame = RUN[Math.floor(game.time * 10) % RUN.length];
    const s = view.scale * 1.18;
    const dw = Math.round(frame.w * s);
    const dh = Math.round(frame.h * s);
    const dx = Math.round(view.playerX - dw * .5);
    const dy = Math.round(view.floor - dh + 9 * s);
    if (!atlasReady) {
      rect(view.playerX - 42 * view.scale, view.floor - 84 * view.scale, 84 * view.scale, 70 * view.scale, '#000');
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
    const dt = Math.max(0, Math.min(.034, (now - game.last) / 1000 || 0));
    game.last = now;
    updateView();
    update(dt);
    draw();
    game.raf = requestAnimationFrame(loop);
  }

  function actionFromKeyboardEvent(event) {
    const code = event.code || '';
    const key = event.key || '';
    if (code === 'ArrowUp' || key === 'ArrowUp' || key === 'Up' || event.keyCode === 38) return 'upper';
    if (code === 'ArrowDown' || key === 'ArrowDown' || key === 'Down' || event.keyCode === 40) return 'lower';
    if (code === 'ArrowRight' || key === 'ArrowRight' || key === 'Right' || event.keyCode === 39) return 'toggle';
    if (code === 'ArrowLeft' || key === 'ArrowLeft' || key === 'Left' || event.keyCode === 37) return 'title';
    return null;
  }

  function handleKey(event) {
    if (!active || destroyed || !root.contains(document.activeElement)) return;
    const code = event.code || '';
    const key = event.key || '';
    const isEnter = code === 'Enter' || key === 'Enter' || event.keyCode === 13;
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

  window.addEventListener('keydown', handleKey, { capture:true, passive:false, signal: abortController.signal });

  let startPointerHandled = false;

  startButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    startPointerHandled = true;
    reset();
  }, { signal: abortController.signal });

  startButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (startPointerHandled) {
      startPointerHandled = false;
      return;
    }
    reset();
  }, { signal: abortController.signal });

  let restartPointerHandled = false;

  restartButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    restartPointerHandled = true;
    reset();
  }, { signal: abortController.signal });

  restartButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (restartPointerHandled) {
      restartPointerHandled = false;
      return;
    }
    reset();
  }, { signal: abortController.signal });

  focusCanvas();

  root.awfulCasesCaseTrainer = { game, view, dictionary:DICTIONARY, command, reset, startDemo, nearestTask };
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(root);
  window.addEventListener('resize', resize, { passive:true, signal: abortController.signal });
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
      focusCanvas();
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