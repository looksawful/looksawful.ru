import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = process.cwd();
const MAIN_HTML = path.join(ROOT, 'index.html');
const STANDALONE_HTML = path.join(ROOT, 'public/pets/awful-cases/index.html');
const PREVIEW_JS = path.join(ROOT, 'src/components/awful-tools-preview/awful-tools-preview.js');
const OUT_DIR = path.join(ROOT, 'public/pets/awful-cases');
const ASSET_DIR = path.join(OUT_DIR, 'assets');
const CSS_PATH = path.join(OUT_DIR, 'awful-cases.css');
const GAME_PATH = path.join(OUT_DIR, 'awful-cases.js');

const GAME_MARKUP = `<div class="awful-cases" data-awful-cases>
  <canvas class="awful-cases__canvas" data-awful-cases-canvas tabindex="0" aria-label="awful cases trainer"></canvas>
  <div class="game-title">Awful Cases - Case Trainer</div>
  <div class="start" data-awful-cases-start>
    <div class="start__label">demo mode</div>
    <button class="start__button" data-awful-cases-start-button type="button">start</button>
  </div>
  <div class="restart" data-awful-cases-restart hidden>
    <div class="restart__title" data-awful-cases-restart-title>restart</div>
    <div class="restart__meta" data-awful-cases-restart-meta>arrow keys only</div>
    <button class="restart__button" data-awful-cases-restart-button type="button">restart</button>
  </div>
</div>`;

const ASSET_NAMES = [
  'atlas.png',
  'ground.png',
  'pit.png',
  'fall1.png',
  'fall2.png',
  'victory.png',
  'flag.png',
  'decor-1.png',
  'decor-2.png',
  'decor-3.png',
];

function invariant(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function extractTag(source, tag) {
  const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return invariant(match, `Missing <${tag}> in embedded trainer`)[1];
}

function decodeTrainer(source) {
  const frame = source.match(/<iframe\b[^>]*(?:data-awful-frame-src|src)="data:text\/html;charset=utf-8;base64,([A-Za-z0-9+/=]+)"[^>]*><\/iframe>/i);
  invariant(frame, 'Could not locate embedded Awful Cases trainer iframe');
  return Buffer.from(frame[1], 'base64').toString('utf8');
}

async function pixelDigest(buffer) {
  const image = sharp(buffer, { failOn: 'error' }).ensureAlpha();
  const meta = await image.metadata();
  const raw = await image.raw().toBuffer();
  return {
    width: meta.width,
    height: meta.height,
    digest: crypto.createHash('sha256').update(raw).digest('hex'),
  };
}

async function writeLosslessPng(source, target) {
  const before = await pixelDigest(source);
  const output = await sharp(source, { failOn: 'error' })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toBuffer();
  const after = await pixelDigest(output);

  invariant(before.width === after.width && before.height === after.height, `Geometry changed for ${path.basename(target)}`);
  invariant(before.digest === after.digest, `RGBA pixels changed for ${path.basename(target)}`);
  await fs.writeFile(target, output);
  return { before: source.length, after: output.length, width: before.width, height: before.height };
}

function makeComponentCss() {
  return `@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

.awful-cases {
  position: relative;
  container-type: size;
  inline-size: 100%;
  block-size: 100%;
  min-inline-size: 260px;
  min-block-size: 320px;
  overflow: hidden;
  background: #007a7a;
  color: #000;
  font-family: "Press Start 2P", monospace;
  touch-action: none;
  isolation: isolate;
}
.awful-cases, .awful-cases * { box-sizing: border-box; }
.awful-cases__canvas { display:block; inline-size:100%; block-size:100%; background:#007a7a; image-rendering:pixelated; image-rendering:crisp-edges; outline:0; }
.awful-cases .game-title { position:absolute; left:50%; top:clamp(6px,2cqh,16px); width:min(92cqw,760px); transform:translateX(-50%); z-index:2; color:#000; font:700 clamp(10px,2.25cqmin,24px)/1.2 "Press Start 2P",monospace; letter-spacing:0; text-align:center; pointer-events:none; text-shadow:1px 1px 0 rgba(255,255,255,.16); }
.awful-cases .start { position:absolute; left:50%; bottom:clamp(18px,8cqh,92px); transform:translateX(-50%); z-index:4; display:grid; gap:clamp(8px,1.8cqh,16px); justify-items:center; text-align:center; color:#000; font-family:"Press Start 2P",monospace; pointer-events:none; }
.awful-cases .start[hidden], .awful-cases .restart[hidden] { display:none; }
.awful-cases .start__label { margin-bottom:clamp(4px,1cqh,10px); background:#fff; padding:6px 10px; border:2px solid #000; font:700 clamp(7px,1.55cqmin,12px)/1.2 "Press Start 2P",monospace; letter-spacing:.08em; text-transform:uppercase; animation:awful-cases-demo-pulse 1.05s steps(1,end) infinite; }
.awful-cases .start__button { appearance:none; pointer-events:auto; border:2px solid #000; background:#fff; color:#000; padding:clamp(9px,2cqmin,12px) clamp(18px,4cqmin,28px); font:700 clamp(12px,2.45cqmin,28px)/1 "Press Start 2P",monospace; text-transform:uppercase; cursor:pointer; }
.awful-cases .start__button:focus-visible, .awful-cases .restart__button:focus-visible { outline:3px solid #000; outline-offset:4px; }
.awful-cases .start__button:active, .awful-cases .restart__button:active { background:#000; color:#fff; }
@keyframes awful-cases-demo-pulse { 0%,49.999%{background:#fff;color:#000} 50%,100%{background:#000;color:#fff} }
.awful-cases .restart { position:absolute; left:50%; top:50%; width:min(88cqw,480px); transform:translate(-50%,-50%); z-index:3; display:grid; gap:clamp(9px,2cqmin,14px); justify-items:center; padding:clamp(14px,3cqmin,22px) clamp(16px,4cqmin,24px); background:#fff; border:2px solid #000; color:#000; font:700 clamp(11px,2cqmin,16px)/1.35 "Press Start 2P",monospace; text-align:center; }
.awful-cases .restart__title { font-size:clamp(14px,3cqmin,22px); line-height:1.1; text-transform:lowercase; }
.awful-cases .restart__meta { font-weight:400; font-size:clamp(9px,1.8cqmin,14px); line-height:1.4; }
.awful-cases .restart__button { appearance:none; border:2px solid #000; background:#fff; color:#000; padding:10px 18px; font:700 clamp(11px,2cqmin,16px)/1 "Press Start 2P",monospace; cursor:pointer; }
@container (max-width:520px) {
  .awful-cases { min-block-size:360px; }
  .awful-cases .game-title { top:7px; font-size:10px; line-height:1.25; }
  .awful-cases .start { bottom:22px; }
  .awful-cases .start__label { font-size:7px; line-height:1.25; }
}
`;
}

function transformGameScript(script, assetUrls) {
  const uriPattern = /data:image\/png;base64,[A-Za-z0-9+/=]+/g;
  let assetIndex = 0;
  script = script.replace(uriPattern, () => invariant(assetUrls[assetIndex++], 'Unexpected extra embedded image'));
  invariant(assetIndex === assetUrls.length, `Expected ${assetUrls.length} images, replaced ${assetIndex}`);

  script = script.replace(/^\s*\(\(\) => \{/, `export function enhanceAwfulCases(root) {\n  if (!(root instanceof HTMLElement)) return { setActive() {}, destroy() {} };\n  let active = false;\n  let destroyed = false;\n  const abortController = new AbortController();`);
  script = script.replace(/\}\)\(\);\s*$/, `\n}`);

  const replacements = new Map([
    ["const canvas = document.getElementById('game');", "const canvas = root.querySelector('[data-awful-cases-canvas]');"],
    ["const startPanel = document.getElementById('startPanel');", "const startPanel = root.querySelector('[data-awful-cases-start]');"],
    ["const startButton = document.getElementById('startButton');", "const startButton = root.querySelector('[data-awful-cases-start-button]');"],
    ["const restartPanel = document.getElementById('restartPanel');", "const restartPanel = root.querySelector('[data-awful-cases-restart]');"],
    ["const restartTitle = document.getElementById('restartTitle');", "const restartTitle = root.querySelector('[data-awful-cases-restart-title]');"],
    ["const restartMeta = document.getElementById('restartMeta');", "const restartMeta = root.querySelector('[data-awful-cases-restart-meta]');"],
    ["const restartButton = document.getElementById('restartButton');", "const restartButton = root.querySelector('[data-awful-cases-restart-button]');"],
    ["view.w = Math.max(260, document.documentElement.clientWidth || innerWidth);", "view.w = Math.max(260, root.clientWidth || 260);"],
    ["view.h = Math.max(320, document.documentElement.clientHeight || innerHeight);", "view.h = Math.max(320, root.clientHeight || 320);"],
    ["window.awfulCasesCaseTrainer = { game, view, dictionary:DICTIONARY, command, reset, startDemo, nearestTask };", "root.awfulCasesCaseTrainer = { game, view, dictionary:DICTIONARY, command, reset, startDemo, nearestTask };"],
  ]);
  for (const [from, to] of replacements) {
    invariant(script.includes(from), `Game transform anchor missing: ${from}`);
    script = script.replace(from, to);
  }

  script = script.replaceAll("setTimeout(() => canvas.focus({ preventScroll:true }), 0);", "focusCanvas();");
  invariant(script.includes("function startDemo()"), 'Missing startDemo');
  script = script.replace("function startDemo() {", `function focusCanvas() {\n    if (!active || destroyed) return;\n    setTimeout(() => {\n      if (active && !destroyed && root.isConnected) canvas.focus({ preventScroll:true });\n    }, 0);\n  }\n\n  function startDemo() {`);

  invariant(script.includes("function handleKey(event) {"), 'Missing keyboard handler');
  script = script.replace("function handleKey(event) {", "function handleKey(event) {\n    if (!active || destroyed || !root.contains(document.activeElement)) return;");

  script = script.replace(
    "  addEventListener('keydown', handleKey, { capture:true, passive:false });\n  document.addEventListener('keydown', handleKey, { capture:true, passive:false });",
    "  window.addEventListener('keydown', handleKey, { capture:true, passive:false, signal: abortController.signal });",
  );

  let buttonListenerCount = 0;
  script = script.replace(/((?:startButton|restartButton)\.addEventListener\('[^']+', event => \{[\s\S]*?\n  \})\);/g, (match, listener) => {
    buttonListenerCount += 1;
    return `${listener}, { signal: abortController.signal });`;
  });
  invariant(buttonListenerCount === 4, `Expected 4 game button listeners, found ${buttonListenerCount}`);

  invariant(script.includes("function loop(now) {"), 'Missing game loop');
  script = script.replace(
`  function loop(now) {
    const dt = Math.min(.034, (now - game.last) / 1000 || 0);
    game.last = now;
    updateView();
    update(dt);
    draw();
    game.raf = requestAnimationFrame(loop);
  }`,
`  function loop(now) {
    if (!active || destroyed) {
      game.raf = 0;
      return;
    }
    const dt = Math.min(.034, (now - game.last) / 1000 || 0);
    game.last = now;
    updateView();
    update(dt);
    draw();
    game.raf = requestAnimationFrame(loop);
  }`);

  const oldTail = `  addEventListener('resize', resize, { passive:true });\n  resize();\n  startDemo();\n  game.raf = requestAnimationFrame(loop);`;
  invariant(script.includes(oldTail), 'Missing game bootstrap tail');
  script = script.replace(oldTail, `  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
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
  };`);

  return script;
}

function transformPreview(source) {
  const replacement = `function enhanceAwfulCasesPreview(root) {
  const gameRoot = root.querySelector("[data-awful-cases]");

  if (!(gameRoot instanceof HTMLElement)) {
    return emptyRuntime;
  }

  let runtime = emptyRuntime;
  let pending = null;
  let active = false;
  let destroyed = false;

  async function ensureRuntime() {
    if (destroyed || pending) return pending;
    pending = import("/pets/awful-cases/awful-cases.js")
      .then(({ enhanceAwfulCases }) => {
        if (destroyed) return;
        runtime = enhanceAwfulCases(gameRoot);
        runtime.setActive(active);
      })
      .catch((error) => {
        pending = null;
        console.error("Awful Cases failed to load", error);
      });
    return pending;
  }

  return {
    setActive(nextActive) {
      active = nextActive;
      if (!active) {
        runtime.setActive(false);
        return;
      }
      void ensureRuntime();
    },
    destroy() {
      destroyed = true;
      active = false;
      runtime.destroy();
      runtime = emptyRuntime;
      pending = null;
    },
  };
}

function fitBerserkScreens`;

  const next = source.replace(/function enhanceLazyFrames\(root\) \{[\s\S]*?\n\}\n\nfunction fitBerserkScreens/, replacement);
  invariant(next !== source, 'Could not replace iframe runtime');
  invariant(next.includes('activeRuntimes.push(enhanceLazyFrames(root));'), 'Missing Awful Cases runtime call');
  return next.replace('activeRuntimes.push(enhanceLazyFrames(root));', 'activeRuntimes.push(enhanceAwfulCasesPreview(root));');
}

function replaceTrainerFrame(source) {
  const pattern = /<iframe\b[^>]*(?:data-awful-frame-src|src)="data:text\/html;charset=utf-8;base64,[A-Za-z0-9+/=]+"[^>]*><\/iframe>/i;
  invariant(pattern.test(source), 'Missing embedded trainer iframe');
  return source.replace(pattern, GAME_MARKUP);
}

function ensureStylesheet(source) {
  if (source.includes('/pets/awful-cases/awful-cases.css')) return source;
  return source.replace('</head>', '  <link rel="stylesheet" href="/pets/awful-cases/awful-cases.css">\n</head>');
}

function ensureStandaloneBoot(source) {
  if (source.includes('enhanceAwfulCases(gameRoot)')) return source;
  return source.replace('</body>', `<script type="module">
  import { enhanceAwfulCases } from "/pets/awful-cases/awful-cases.js";
  const gameRoot = document.querySelector("[data-awful-cases]");
  const runtime = enhanceAwfulCases(gameRoot);
  runtime.setActive(true);
  window.addEventListener("pagehide", () => runtime.destroy(), { once: true });
</script>\n</body>`);
}

await fs.mkdir(ASSET_DIR, { recursive: true });

const standaloneSource = await fs.readFile(STANDALONE_HTML, 'utf8');
const trainer = decodeTrainer(standaloneSource);
const trainerScript = extractTag(trainer, 'script');
const dataUris = [...trainerScript.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)].map((match) => match[1]);
invariant(dataUris.length === ASSET_NAMES.length, `Expected ${ASSET_NAMES.length} PNGs, found ${dataUris.length}`);

const stats = [];
for (let index = 0; index < dataUris.length; index += 1) {
  const input = Buffer.from(dataUris[index], 'base64');
  const target = path.join(ASSET_DIR, ASSET_NAMES[index]);
  stats.push({ name: ASSET_NAMES[index], ...(await writeLosslessPng(input, target)) });
}

const assetUrls = ASSET_NAMES.map((name) => `/pets/awful-cases/assets/${name}`);
await fs.writeFile(GAME_PATH, transformGameScript(trainerScript, assetUrls));
await fs.writeFile(CSS_PATH, makeComponentCss());

let main = await fs.readFile(MAIN_HTML, 'utf8');
main = ensureStylesheet(replaceTrainerFrame(main));
await fs.writeFile(MAIN_HTML, main);

let standalone = replaceTrainerFrame(standaloneSource);
standalone = ensureStylesheet(standalone);
standalone = ensureStandaloneBoot(standalone);
await fs.writeFile(STANDALONE_HTML, standalone);

const preview = await fs.readFile(PREVIEW_JS, 'utf8');
await fs.writeFile(PREVIEW_JS, transformPreview(preview));

const totalBefore = stats.reduce((sum, item) => sum + item.before, 0);
const totalAfter = stats.reduce((sum, item) => sum + item.after, 0);
console.log(`Awful Cases migrated: ${stats.length} RGBA PNGs, ${totalBefore} -> ${totalAfter} bytes`);
for (const item of stats) console.log(`${item.name}: ${item.width}x${item.height}, ${item.before} -> ${item.after}`);
