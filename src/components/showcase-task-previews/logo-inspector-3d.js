import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STYLE_ID = "logo-inspector-3d-styles";
const SLIDE_COUNT = 3;
const CAMERA_DISTANCE = 8;
const IDLE_SPIN_SPEED = 0.42;
const DRAG_ROTATE_SPEED = 0.008;
const RETURN_EASE = 0.08;
const LOGO_INTRO_HOLD_MS = 0;
const LOGO_INTRO_FLY_MS = 3600;
const LOGO_FLY_START_Z = -140;
const LOGO_FLY_TARGET_Z = 1.35;
const LOGO_FLY_START_Y = 0;
const LOGO_FLY_VISIBLE_PROGRESS = 0.08;
const LOGO_FLY_SPREAD_START = 0;
const LOGO_FLY_ROTATE_RESOLVE_START = 0;
const LOGO_INTRO_ROTATION = {
  x: 0.18,
  y: -0.2,
  z: -0.08,
};
const WHITE_BACKGROUND = "#ffffff";

const SHOW_COLOR_TOKEN_CHIPS = false;
const SHOW_SLIDER_NAV_BUTTONS = false;
const SHOW_SLIDER_DOTS = false;
const SHOW_SLIDER_COUNTER = false;
const SHOW_AUDIENCE_LABELS = false;

const DEFAULT_ASSETS = {
  model: "./logo.glb",
  oldLogo: "./assets/logo-primary.svg",
  newLogo: "./assets/logo-secondary.svg",
  contrastUnion: "./Union.svg",
  contrastVector: "./Vector.svg",
};

const DEFAULT_VARIANTS = [
  {
    id: "club",
    theme: "",
    token: "клубные диджеи",
    hex: "#E18200",
    color: "#E18200",
    palette: ["#FFE3B1", "#FFBE4A", "#E18200", "#B76600", "#7A4200", "#2A1600"],
  },
  {
    id: "event",
    theme: "",
    token: "ивент диджеи",
    hex: "#D1E231",
    color: "#D1E231",
    palette: ["#F4FFB8", "#EAF85A", "#D1E231", "#A1B314", "#5E6A08", "#1A2000"],
  },
  {
    id: "pro",
    theme: "",
    token: "Эксклюзивы",
    hex: "#157AFF",
    color: "#157AFF",
    palette: ["#D8ECFF", "#74B8FF", "#157AFF", "#0D55C8", "#082F78", "#050C22"],
  },
];

const DISPLAY_VARIANT_IDS = ["pro", "club", "event"];

const CONTRAST_CONFIG = {
  durationMs: 10400,
  background: "#000000",
  dividerColor: "rgba(255,255,255,0.22)",
  borderColor: "rgba(255,255,255,0.22)",
  titleColor: "#ffffff",
  figureSizeRatio: 0.46,
  blur: {
    maxPxRatio: 0.13,
    opacityAtMax: 0.22,
  },
  scale: {
    min: 0.01,
    max: 1,
  },
  titles: {
    blur: "Контрастность",
    scale: "Читаемость",
  },
  qualityIndex: {
    label: "LQI",
    decimals: 0,
    fontScale: 0.055,
    captionFontScale: 0.026,
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.58)",
    values: {
      1: { from: 96, to: 18 },
      2: { from: 98, to: 54 },
      3: { from: 6, to: 78 },
      4: { from: 14, to: 94 },
    },
  },
  badges: {
    1: [
      { from: 0, state: "good" },
      { from: 0.14, state: "normal" },
      { from: 0.28, state: "bad" },
      { from: 0.72, state: "bad" },
      { from: 0.86, state: "normal" },
      { from: 0.96, state: "good" },
    ],
    2: [
      { from: 0, state: "good" },
      { from: 0.28, state: "normal" },
      { from: 0.58, state: "bad" },
      { from: 0.72, state: "bad" },
      { from: 0.86, state: "normal" },
      { from: 0.96, state: "good" },
    ],
    3: [
      { from: 0, state: "bad" },
      { from: 0.18, state: "normal" },
      { from: 0.36, state: "good" },
      { from: 0.64, state: "good" },
      { from: 0.82, state: "normal" },
      { from: 0.96, state: "bad" },
    ],
    4: [
      { from: 0, state: "bad" },
      { from: 0.08, state: "normal" },
      { from: 0.18, state: "good" },
      { from: 0.82, state: "good" },
      { from: 0.92, state: "normal" },
      { from: 0.98, state: "bad" },
    ],
  },
  badgeStates: {
    good: { text: "хорошо", fill: "#2dd36f", textColor: "#001b0b" },
    normal: { text: "нормально", fill: "#8d8d8d", textColor: "#050505" },
    bad: { text: "плохо", fill: "#ff3b30", textColor: "#250000" },
  },
};

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .logo-inspector-3d {
      position: relative;
      display: block;
      width: 100%;
      min-width: 0;
      height: clamp(20rem, 44vw, 38rem);
      min-height: min(22rem, 72vh);
      max-height: min(38rem, 76vh);
      overflow: hidden;
      contain: layout paint;
      isolation: isolate;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      color: #111111;
      background: #ffffff;
      font-family: "Rubik", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-rendering: geometricPrecision;
    }

    .logo-inspector-3d__slides {
      position: absolute;
      z-index: 1;
      inset: 0;
      overflow: hidden;
      background: #ffffff;
    }

    .logo-inspector-3d__slide {
      position: absolute;
      inset: 0;
      display: none;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #ffffff;
    }

    .logo-inspector-3d__slide.is-active {
      display: block;
    }

    .logo-inspector-3d__canvas {
      position: absolute;
      z-index: 1;
      inset: 0;
      min-width: 0;
      cursor: default;
      touch-action: none;
      user-select: none;
    }

    .logo-inspector-3d__canvas.is-hovering {
      cursor: grab;
    }

    .logo-inspector-3d__canvas.is-dragging {
      cursor: grabbing;
    }

    .logo-inspector-3d__canvas canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      max-height: 100%;
    }

    .logo-inspector-3d__overlay {
      position: absolute;
      z-index: 2;
      inset: 0;
      display: grid;
      align-items: stretch;
      padding: clamp(1.2rem, 2.4vw, 2rem);
      pointer-events: none;
    }

    .logo-inspector-3d__columns {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: clamp(1rem, 2.4vw, 1.8rem);
      min-width: 0;
      min-height: 0;
    }

    .logo-inspector-3d__column {
      --accent: #111111;
      position: relative;
      display: grid;
      grid-template-rows: minmax(0, 1.22fr) auto auto minmax(0, 0.56fr);
      min-width: 0;
      min-height: 0;
      overflow: visible;
      border-radius: 18px;
    }

    .logo-inspector-3d__header {
      position: relative;
      z-index: 2;
      display: grid;
      grid-row: 2;
      justify-items: center;
      gap: 0.3rem;
      align-self: center;
      min-width: 0;
      padding-block-start: 0;
      text-align: center;
    }

    .logo-inspector-3d__color-name {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      padding: 0.58rem 1.05rem 0.62rem;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 999px;
      color: #111111;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
      font-size: clamp(0.74rem, 1.02vw, 0.98rem);
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0.035em;
      text-transform: uppercase;
      white-space: nowrap;
      backdrop-filter: blur(12px);
    }

    .logo-inspector-3d__theme {
      color: rgba(17, 17, 17, 0.72);
      font-size: clamp(0.66rem, 0.8vw, 0.82rem);
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .logo-inspector-3d__theme:empty {
      display: none;
    }

    .logo-inspector-3d__token-list {
      position: relative;
      z-index: 2;
      grid-row: 3;
      align-self: end;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.56rem 0.64rem;
      min-width: 0;
      padding: 0.8rem 0.9rem 1rem;
      margin-block-end: clamp(0.1rem, 0.35vw, 0.4rem);
    }

    .logo-inspector-3d__token-item {
      display: inline-flex;
      align-items: center;
      gap: 0.38rem;
      min-width: 0;
      padding: 0.38rem 0.6rem 0.4rem 0.46rem;
      border: 1px solid rgba(0, 0, 0, 0.24);
      border-radius: 999px;
      color: #111111;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 7px 18px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
    }

    .logo-inspector-3d__token-dot {
      width: clamp(0.56rem, 0.72vw, 0.72rem);
      aspect-ratio: 1;
      flex: 0 0 auto;
      border: 1px solid rgba(0, 0, 0, 0.34);
      border-radius: 999px;
      background: var(--dot);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.92), 0 1px 4px rgba(0, 0, 0, 0.18);
    }

    .logo-inspector-3d__hex {
      color: #111111;
      font-size: clamp(0.52rem, 0.62vw, 0.66rem);
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .logo-inspector-3d__compare {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: clamp(1.2rem, 4vw, 4rem);
      padding: clamp(3.2rem, 6vw, 5rem) clamp(4.2rem, 8vw, 8rem) clamp(4rem, 7vw, 6rem);
      background: #ffffff;
      color: #111111;
    }

    .logo-inspector-3d__compare-item {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: clamp(0.9rem, 1.8vw, 1.4rem);
      min-width: 0;
    }

    .logo-inspector-3d__compare-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.34rem 0.62rem 0.37rem;
      border: 1px solid rgba(0, 0, 0, 0.22);
      border-radius: 999px;
      color: rgba(17, 17, 17, 0.74);
      background: rgba(255, 255, 255, 0.9);
      font-size: clamp(0.62rem, 0.76vw, 0.78rem);
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .logo-inspector-3d__compare-logo {
      display: block;
      width: min(58%, 15rem);
      height: auto;
      max-height: min(42vh, 16rem);
      object-fit: contain;
      object-position: center;
      user-select: none;
      -webkit-user-drag: none;
    }

    .logo-inspector-3d__compare-logo--new {
      width: min(68%, 17.5rem);
      transform: scale(1.08);
      transform-origin: center;
    }

    .logo-inspector-3d__compare-arrow {
      position: relative;
      display: grid;
      place-items: center;
      width: clamp(3.2rem, 5vw, 5rem);
      height: clamp(3.2rem, 5vw, 5rem);
      border: 1px solid rgba(0, 0, 0, 0.18);
      border-radius: 999px;
      color: #111111;
      background: #ffffff;
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
    }

    .logo-inspector-3d__compare-arrow::before {
      content: "";
      width: 42%;
      height: 1.5px;
      background: currentColor;
      transform: translateX(-10%);
    }

    .logo-inspector-3d__compare-arrow::after {
      content: "";
      position: absolute;
      width: 0.62rem;
      height: 0.62rem;
      border-block-start: 1.5px solid currentColor;
      border-inline-end: 1.5px solid currentColor;
      transform: translateX(0.48rem) rotate(45deg);
    }

    .logo-inspector-3d__contrast,
    .logo-inspector-3d__contrast-canvas {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      background: #000000;
    }

    .logo-inspector-3d__nav {
      position: absolute;
      z-index: 6;
      top: 50%;
      display: grid;
      place-items: center;
      width: clamp(2rem, 3vw, 2.8rem);
      height: clamp(4rem, 8vw, 6.5rem);
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.18);
      border-radius: 999px;
      color: #111111;
      background: rgba(255, 255, 255, 0.84);
      box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      pointer-events: auto;
      transform: translateY(-50%);
      backdrop-filter: blur(14px);
    }

    .logo-inspector-3d__nav:hover {
      background: rgba(255, 255, 255, 0.96);
    }

    .logo-inspector-3d__nav:focus-visible {
      outline: 2px solid #111111;
      outline-offset: 3px;
    }

    .logo-inspector-3d__nav--prev {
      inset-inline-start: clamp(0.55rem, 1.4vw, 1rem);
    }

    .logo-inspector-3d__nav--next {
      inset-inline-end: clamp(0.55rem, 1.4vw, 1rem);
    }

    .logo-inspector-3d__nav-icon {
      position: relative;
      display: block;
      width: 0.78rem;
      height: 0.78rem;
      border-block-start: 1.8px solid currentColor;
      border-inline-start: 1.8px solid currentColor;
    }

    .logo-inspector-3d__nav--prev .logo-inspector-3d__nav-icon {
      transform: translateX(0.16rem) rotate(-45deg);
    }

    .logo-inspector-3d__nav--next .logo-inspector-3d__nav-icon {
      transform: translateX(-0.16rem) rotate(135deg);
    }

    .logo-inspector-3d__dots {
      position: absolute;
      z-index: 6;
      inset-inline: 0;
      inset-block-end: clamp(0.9rem, 2vw, 1.45rem);
      display: flex;
      justify-content: center;
      gap: 0.42rem;
      pointer-events: none;
    }

    .logo-inspector-3d__dot-button {
      width: 0.44rem;
      height: 0.44rem;
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 0.42);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      opacity: 0.55;
      pointer-events: auto;
    }

    .logo-inspector-3d__dot-button.is-active {
      width: 1.35rem;
      background: #111111;
      opacity: 1;
    }

    .logo-inspector-3d__dot-button:focus-visible {
      outline: 2px solid #111111;
      outline-offset: 3px;
    }

    .logo-inspector-3d__counter {
      position: absolute;
      z-index: 6;
      inset-block-start: clamp(3.9rem, 1.8vw, 1.25rem);
      inset-inline-end: clamp(0.9rem, 1.8vw, 1.25rem);
      display: grid;
      justify-items: end;
      gap: 0.18rem;
      min-width: 2.4rem;
      color: #111111;
      pointer-events: none;
    }

    .logo-inspector-3d__counter-current {
      font-size: clamp(0.76rem, 0.92vw, 0.92rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .logo-inspector-3d__counter-total {
      color: rgba(17, 17, 17, 0.42);
      font-size: clamp(0.52rem, 0.64vw, 0.64rem);
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0.08em;
    }

    .logo-inspector-3d__status {
      position: absolute;
      z-index: 7;
      inset-block-start: 3.2rem;
      inset-inline-end: 16px;
      max-width: min(22rem, calc(100% - 32px));
      padding: 0.4rem 0.58rem 0.45rem;
      border: 1px solid rgba(150, 0, 0, 0.32);
      border-radius: 999px;
      color: #7a1111;
      background: rgba(255, 244, 244, 0.94);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
      font-size: 0.7rem;
      font-weight: 650;
      line-height: 1;
      pointer-events: none;
      backdrop-filter: blur(14px);
    }

    .logo-inspector-3d__status[hidden] {
      display: none;
    }

    .logo-inspector-3d.is-color-token-chips-disabled .logo-inspector-3d__token-list {
      display: none;
    }

    .logo-inspector-3d.is-slider-nav-disabled .logo-inspector-3d__nav {
      display: none;
    }

    .logo-inspector-3d.is-slider-dots-disabled .logo-inspector-3d__dots {
      display: none;
    }

    .logo-inspector-3d.is-slider-counter-disabled .logo-inspector-3d__counter {
      display: none;
    }

    .logo-inspector-3d.is-audience-labels-disabled .logo-inspector-3d__header {
      display: none;
    }

    .logo-inspector-3d[data-active-slide="2"] .logo-inspector-3d__counter {
      color: #ffffff;
    }

    .logo-inspector-3d[data-active-slide="2"] .logo-inspector-3d__counter-total {
      color: rgba(255, 255, 255, 0.52);
    }

    .logo-inspector-3d[data-active-slide="2"] .logo-inspector-3d__nav {
      border-color: rgba(255, 255, 255, 0.28);
      color: #ffffff;
      background: rgba(0, 0, 0, 0.52);
      box-shadow: none;
    }

    .logo-inspector-3d[data-active-slide="2"] .logo-inspector-3d__nav:hover {
      background: rgba(0, 0, 0, 0.74);
    }

    .logo-inspector-3d[data-active-slide="2"] .logo-inspector-3d__dot-button {
      border-color: rgba(255, 255, 255, 0.48);
      background: rgba(0, 0, 0, 0.7);
    }

    .logo-inspector-3d[data-active-slide="2"] .logo-inspector-3d__dot-button.is-active {
      background: #ffffff;
    }

    @media (max-width: 56rem) {
      .logo-inspector-3d {
        height: clamp(34rem, 104vw, 48rem);
        max-height: none;
      }

      .logo-inspector-3d__overlay {
        padding: clamp(0.8rem, 3vw, 1.2rem);
      }

      .logo-inspector-3d__columns {
        gap: 0.5rem;
      }

      .logo-inspector-3d__color-name {
        padding: 0.46rem 0.72rem 0.5rem;
        font-size: clamp(0.54rem, 1.62vw, 0.74rem);
        letter-spacing: 0.025em;
      }

      .logo-inspector-3d__theme {
        font-size: clamp(0.48rem, 1.5vw, 0.62rem);
      }

      .logo-inspector-3d__token-list {
        gap: 0.34rem;
        padding: 0.55rem 0.25rem 0.7rem;
      }

      .logo-inspector-3d__token-item {
        gap: 0.26rem;
        padding: 0.26rem 0.42rem 0.28rem 0.34rem;
      }

      .logo-inspector-3d__token-dot {
        width: clamp(0.48rem, 1.5vw, 0.62rem);
      }

      .logo-inspector-3d__hex {
        font-size: clamp(0.42rem, 1.2vw, 0.52rem);
      }

      .logo-inspector-3d__compare {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) auto minmax(0, 1fr);
        gap: clamp(1.1rem, 4vw, 2rem);
        padding: clamp(4rem, 12vw, 5rem) clamp(3rem, 12vw, 4rem) clamp(4rem, 12vw, 5.2rem);
      }

      .logo-inspector-3d__compare-logo {
        width: min(46vw, 12rem);
        max-height: 26vh;
      }

      .logo-inspector-3d__compare-logo--new {
        width: min(54vw, 13.4rem);
      }

      .logo-inspector-3d__compare-arrow {
        width: clamp(2.8rem, 12vw, 3.8rem);
        height: clamp(2.8rem, 12vw, 3.8rem);
        transform: rotate(90deg);
      }

      .logo-inspector-3d__nav {
        width: 2rem;
        height: 4.4rem;
      }
    }
  `;

  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

function easeOutCubic(progress) {
  const p = clamp(progress, 0, 1);
  return 1 - Math.pow(1 - p, 3);
}

function pingPong(progress) {
  return 1 - Math.abs(1 - progress * 2);
}

function getRomanSlide(index) {
  return ["i", "ii", "iii"][index] || String(index + 1);
}

function createImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function createFallbackMesh() {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.3, 72, 180));
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 56, 140));
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 0.18));

  plate.position.set(1.45, -0.18, 0);
  group.add(outer, inner, plate);

  return group;
}

function traverseMeshes(object, callback) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) callback(child);
  });
}

function disposeMaterial(material, textureCache, materialCache) {
  if (!material || materialCache.has(material)) return;

  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture && !textureCache.has(value)) {
      textureCache.add(value);
      value.dispose();
    }
  }

  materialCache.add(material);
  material.dispose();
}

function disposeObjectResources(object, cache = {}) {
  const geometries = cache.geometries || new Set();
  const textures = cache.textures || new Set();
  const materials = cache.materials || new Set();

  traverseMeshes(object, (mesh) => {
    if (mesh.geometry && !geometries.has(mesh.geometry)) {
      geometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => disposeMaterial(material, textures, materials));
    } else {
      disposeMaterial(mesh.material, textures, materials);
    }
  });

  cache.geometries = geometries;
  cache.textures = textures;
  cache.materials = materials;

  return cache;
}

function centerAndScaleObject(object, targetSize = 2.35) {
  object.updateWorldMatrix(true, true);

  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const scale = targetSize / maxDimension;

  object.position.sub(center);
  object.scale.multiplyScalar(scale);
  object.updateWorldMatrix(true, true);
}

function applyVariantColor(root, colorValue, logoGroup) {
  const color = new THREE.Color(colorValue);

  traverseMeshes(root, (mesh) => {
    mesh.geometry?.computeVertexNormals?.();
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.logoGroup = logoGroup;
    mesh.material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.34,
      metalness: 0.64,
      clearcoat: 0.42,
      clearcoatRoughness: 0.36,
      envMapIntensity: 1.24,
      side: THREE.FrontSide,
    });
  });
}

function createVariantLogo(sourceRoot, variant, index) {
  const group = new THREE.Group();
  const root = sourceRoot.clone(true);

  group.name = `logo-${variant.id}`;
  group.userData.variant = variant;
  group.userData.index = index;
  group.userData.baseRotationX = 0.18;
  group.userData.baseRotationY = -0.2 + index * 0.2;
  group.userData.baseRotationZ = -0.08;
  group.userData.hasManualRotation = false;

  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);

  applyVariantColor(root, variant.color, group);

  group.add(root);
  group.rotation.set(LOGO_INTRO_ROTATION.x, LOGO_INTRO_ROTATION.y, LOGO_INTRO_ROTATION.z);

  return group;
}

function createSimpleOverlay(variants) {
  const overlay = document.createElement("div");
  overlay.className = "logo-inspector-3d__overlay";

  const columns = document.createElement("div");
  columns.className = "logo-inspector-3d__columns";

  variants.slice(0, 3).forEach((variant) => {
    const column = document.createElement("div");
    column.className = "logo-inspector-3d__column";
    column.style.setProperty("--accent", variant.color);

    const header = document.createElement("div");
    header.className = "logo-inspector-3d__header";

    const colorName = document.createElement("span");
    colorName.className = "logo-inspector-3d__color-name";
    colorName.textContent = variant.token;

    const theme = document.createElement("span");
    theme.className = "logo-inspector-3d__theme";
    theme.textContent = variant.theme;

    header.append(colorName, theme);

    const tokenList = document.createElement("div");
    tokenList.className = "logo-inspector-3d__token-list";

    variant.palette.forEach((color) => {
      const token = document.createElement("span");
      token.className = "logo-inspector-3d__token-item";

      const dot = document.createElement("span");
      dot.className = "logo-inspector-3d__token-dot";
      dot.style.setProperty("--dot", color);

      const hex = document.createElement("span");
      hex.className = "logo-inspector-3d__hex";
      hex.textContent = color;

      token.append(dot, hex);
      tokenList.appendChild(token);
    });

    column.append(header, tokenList);
    columns.appendChild(column);
  });

  overlay.appendChild(columns);
  return overlay;
}

function createCompareSlide(assetUrls) {
  const wrapper = document.createElement("div");
  wrapper.className = "logo-inspector-3d__compare";

  const oldItem = document.createElement("div");
  oldItem.className = "logo-inspector-3d__compare-item";

  const oldLogo = document.createElement("img");
  oldLogo.className = "logo-inspector-3d__compare-logo logo-inspector-3d__compare-logo--old";
  oldLogo.alt = "Старый логотип";
  oldLogo.decoding = "async";
  oldLogo.draggable = false;
  oldLogo.src = assetUrls.oldLogo;

  const oldLabel = document.createElement("span");
  oldLabel.className = "logo-inspector-3d__compare-label";
  oldLabel.textContent = "old";

  oldItem.append(oldLogo, oldLabel);

  const arrow = document.createElement("div");
  arrow.className = "logo-inspector-3d__compare-arrow";
  arrow.setAttribute("aria-hidden", "true");

  const newItem = document.createElement("div");
  newItem.className = "logo-inspector-3d__compare-item";

  const newLogo = document.createElement("img");
  newLogo.className = "logo-inspector-3d__compare-logo logo-inspector-3d__compare-logo--new";
  newLogo.alt = "Новый логотип";
  newLogo.decoding = "async";
  newLogo.draggable = false;
  newLogo.src = assetUrls.newLogo;

  const newLabel = document.createElement("span");
  newLabel.className = "logo-inspector-3d__compare-label";
  newLabel.textContent = "new";

  newItem.append(newLogo, newLabel);
  wrapper.append(oldItem, arrow, newItem);

  return wrapper;
}

function createContrastCanvasRenderer(canvas, assetUrls) {
  const ctx = canvas.getContext("2d");
  const images = {
    union: createImage(assetUrls.contrastUnion),
    vector: createImage(assetUrls.contrastVector),
  };

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (width === state.width && height === state.height && dpr === state.dpr) return;

    state.width = width;
    state.height = height;
    state.dpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getQualityValue(quadrantIndex, progress) {
    const item = CONTRAST_CONFIG.qualityIndex.values[quadrantIndex];
    return lerp(item.from, item.to, progress);
  }

  function getBadgeState(steps, progress) {
    let stateName = steps[0].state;

    for (let i = 0; i < steps.length; i += 1) {
      if (progress >= steps[i].from) stateName = steps[i].state;
    }

    return CONTRAST_CONFIG.badgeStates[stateName];
  }

  function drawBackground() {
    ctx.fillStyle = CONTRAST_CONFIG.background;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.strokeStyle = CONTRAST_CONFIG.dividerColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(state.width / 2, 0);
    ctx.lineTo(state.width / 2, state.height);
    ctx.moveTo(0, state.height / 2);
    ctx.lineTo(state.width, state.height / 2);
    ctx.stroke();

    ctx.strokeStyle = CONTRAST_CONFIG.borderColor;
    ctx.strokeRect(0.5, 0.5, state.width - 1, state.height - 1);
  }

  function drawTitle(text, value, y) {
    const fontSize = Math.max(15, Math.min(state.width, state.height) * 0.03);
    const label = `${text} ${value}`;

    ctx.save();
    ctx.font = `700 ${fontSize}px Rubik, Arial, Helvetica, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(label);
    const bgWidth = metrics.width + fontSize * 1.3;
    const bgHeight = fontSize * 1.7;

    ctx.fillStyle = CONTRAST_CONFIG.background;
    ctx.fillRect(state.width / 2 - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

    ctx.fillStyle = CONTRAST_CONFIG.titleColor;
    ctx.fillText(label, state.width / 2, y);
    ctx.restore();
  }

  function drawTitles(blurValue, scaleValue) {
    const fontSize = Math.max(15, Math.min(state.width, state.height) * 0.03);
    drawTitle(CONTRAST_CONFIG.titles.blur, blurValue.toFixed(2), Math.max(fontSize * 1.25, state.height * 0.05));
    drawTitle(CONTRAST_CONFIG.titles.scale, `${Math.round(scaleValue * 100)}%`, state.height / 2);
  }

  function drawBadge(quadrant, badgeState) {
    const padding = Math.max(12, Math.min(quadrant.width, quadrant.height) * 0.045);
    const fontSize = Math.max(11, Math.min(quadrant.width, quadrant.height) * 0.04);
    const horizontalPadding = fontSize * 0.86;
    const badgeHeight = fontSize * 2.1;

    ctx.font = `700 ${fontSize}px Rubik, Arial, Helvetica, sans-serif`;

    const textWidth = ctx.measureText(badgeState.text).width;
    const badgeWidth = textWidth + horizontalPadding * 2;
    const isRightQuadrant = quadrant.index === 2 || quadrant.index === 3;
    const x = isRightQuadrant ? quadrant.x + quadrant.width - padding - badgeWidth : quadrant.x + padding;
    const y = quadrant.y + padding;

    ctx.save();
    roundedRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fillStyle = badgeState.fill;
    ctx.fill();
    ctx.fillStyle = badgeState.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeState.text, x + badgeWidth / 2, y + badgeHeight / 2 + fontSize * 0.03);
    ctx.restore();
  }

  function drawQualityIndex(quadrant, progress) {
    const value = getQualityValue(quadrant.index, progress);
    const valueText = value.toFixed(CONTRAST_CONFIG.qualityIndex.decimals);
    const minSide = Math.min(quadrant.width, quadrant.height);
    const padding = Math.max(12, minSide * 0.045);
    const captionSize = Math.max(9, minSide * CONTRAST_CONFIG.qualityIndex.captionFontScale);
    const valueSize = Math.max(18, minSide * CONTRAST_CONFIG.qualityIndex.fontScale);
    const isRightQuadrant = quadrant.index === 2 || quadrant.index === 3;
    const x = isRightQuadrant ? quadrant.x + quadrant.width - padding : quadrant.x + padding;
    const y = quadrant.y + quadrant.height - padding;

    ctx.save();
    ctx.textAlign = isRightQuadrant ? "right" : "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${valueSize}px Rubik, Arial, Helvetica, sans-serif`;
    ctx.fillStyle = CONTRAST_CONFIG.qualityIndex.textColor;
    ctx.fillText(valueText, x, y);
    ctx.font = `700 ${captionSize}px Rubik, Arial, Helvetica, sans-serif`;
    ctx.fillStyle = CONTRAST_CONFIG.qualityIndex.mutedColor;
    ctx.fillText(CONTRAST_CONFIG.qualityIndex.label, x, y - valueSize * 1.05);
    ctx.restore();
  }

  function drawFallbackMark(cx, cy, size, variant) {
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = size * 0.07;

    if (variant === "union") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 0.46);
      ctx.lineTo(cx + size * 0.12, cy - size * 0.12);
      ctx.lineTo(cx + size * 0.48, cy - size * 0.12);
      ctx.lineTo(cx + size * 0.18, cy + size * 0.08);
      ctx.lineTo(cx + size * 0.3, cy + size * 0.45);
      ctx.lineTo(cx, cy + size * 0.22);
      ctx.lineTo(cx - size * 0.3, cy + size * 0.45);
      ctx.lineTo(cx - size * 0.18, cy + size * 0.08);
      ctx.lineTo(cx - size * 0.48, cy - size * 0.12);
      ctx.lineTo(cx - size * 0.12, cy - size * 0.12);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawMark(quadrant, options) {
    const image = quadrant.image;
    const minSide = Math.min(quadrant.width, quadrant.height);
    const cx = quadrant.x + quadrant.width / 2;
    const cy = quadrant.y + quadrant.height / 2;
    const size = minSide * CONTRAST_CONFIG.figureSizeRatio;
    const blurPx = options.blurNorm * minSide * CONTRAST_CONFIG.blur.maxPxRatio;
    const alpha = quadrant.effect === "blur" ? 1 - options.blurNorm * (1 - CONTRAST_CONFIG.blur.opacityAtMax) : 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(options.scaleValue, options.scaleValue);
    ctx.translate(-cx, -cy);
    ctx.filter = quadrant.effect === "blur" ? `blur(${blurPx}px)` : "none";
    ctx.globalAlpha = alpha;

    if (image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, cx - size / 2, cy - size / 2, size, size);
    } else {
      drawFallbackMark(cx, cy, size, quadrant.variant);
    }

    ctx.restore();
  }

  function getQuadrants() {
    const halfWidth = state.width / 2;
    const halfHeight = state.height / 2;

    return {
      1: {
        index: 1,
        x: 0,
        y: 0,
        width: halfWidth,
        height: halfHeight,
        image: images.union,
        variant: "union",
        effect: "blur",
      },
      2: {
        index: 2,
        x: halfWidth,
        y: 0,
        width: halfWidth,
        height: halfHeight,
        image: images.vector,
        variant: "vector",
        effect: "blur",
      },
      3: {
        index: 3,
        x: halfWidth,
        y: halfHeight,
        width: halfWidth,
        height: halfHeight,
        image: images.union,
        variant: "union",
        effect: "scale",
      },
      4: {
        index: 4,
        x: 0,
        y: halfHeight,
        width: halfWidth,
        height: halfHeight,
        image: images.vector,
        variant: "vector",
        effect: "scale",
      },
    };
  }

  function draw(timestamp) {
    resize();

    const timelineProgress = (timestamp % CONTRAST_CONFIG.durationMs) / CONTRAST_CONFIG.durationMs;
    const effectProgress = pingPong(timelineProgress);
    const blurNorm = effectProgress;
    const scaleValue = lerp(CONTRAST_CONFIG.scale.min, CONTRAST_CONFIG.scale.max, effectProgress);
    const quadrants = getQuadrants();

    drawBackground();
    drawTitles(blurNorm, scaleValue);

    Object.keys(quadrants).forEach((key) => {
      const quadrant = quadrants[key];
      const badgeState = getBadgeState(CONTRAST_CONFIG.badges[key], timelineProgress);

      drawMark(quadrant, {
        blurNorm,
        scaleValue: quadrant.effect === "scale" ? scaleValue : 1,
      });

      drawBadge(quadrant, badgeState);
      drawQualityIndex(quadrant, effectProgress);
    });
  }

  return { resize, draw };
}

async function loadModel(modelUrl) {
  if (!modelUrl) return createFallbackMesh();

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath("/draco/");
  dracoLoader.setDecoderConfig({ type: "wasm" });
  loader.setDRACOLoader(dracoLoader);

  try {
    const gltf = await loader.loadAsync(modelUrl);
    return gltf.scene;
  } finally {
    dracoLoader.dispose();
  }
}

export function createLogoInspector3D(target, options = {}) {
  injectStyles();

  const host = typeof target === "string" ? document.querySelector(target) : target;

  if (!host) {
    throw new Error("createLogoInspector3D: target not found");
  }

  const { modelUrl = DEFAULT_ASSETS.model, variants = DEFAULT_VARIANTS, assets = {} } = options;

  const assetUrls = {
    ...DEFAULT_ASSETS,
    ...assets,
    model: assets.model || modelUrl || DEFAULT_ASSETS.model,
  };

  const orderedVariants = DISPLAY_VARIANT_IDS.map((id) => variants.find((item) => item.id === id)).filter(Boolean);

  host.textContent = "";

  const root = document.createElement("section");
  root.className = "logo-inspector-3d";
  root.style.background = WHITE_BACKGROUND;
  root.dataset.activeSlide = "0";

  if (!SHOW_COLOR_TOKEN_CHIPS) root.classList.add("is-color-token-chips-disabled");
  if (!SHOW_SLIDER_NAV_BUTTONS) root.classList.add("is-slider-nav-disabled");
  if (!SHOW_SLIDER_DOTS) root.classList.add("is-slider-dots-disabled");
  if (!SHOW_SLIDER_COUNTER) root.classList.add("is-slider-counter-disabled");
  if (!SHOW_AUDIENCE_LABELS) root.classList.add("is-audience-labels-disabled");

  const slides = document.createElement("div");
  slides.className = "logo-inspector-3d__slides";

  const modelSlide = document.createElement("div");
  modelSlide.className = "logo-inspector-3d__slide logo-inspector-3d__slide--models is-active";

  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-3d__canvas";

  const overlay = createSimpleOverlay(orderedVariants);

  const status = document.createElement("div");
  status.className = "logo-inspector-3d__status";
  status.hidden = true;

  modelSlide.append(canvasHost, overlay, status);

  const compareSlide = document.createElement("div");
  compareSlide.className = "logo-inspector-3d__slide logo-inspector-3d__slide--compare";
  compareSlide.appendChild(createCompareSlide(assetUrls));

  const contrastSlide = document.createElement("div");
  contrastSlide.className = "logo-inspector-3d__slide logo-inspector-3d__slide--contrast";

  const contrast = document.createElement("div");
  contrast.className = "logo-inspector-3d__contrast";

  const contrastCanvas = document.createElement("canvas");
  contrastCanvas.className = "logo-inspector-3d__contrast-canvas";

  contrast.appendChild(contrastCanvas);
  contrastSlide.appendChild(contrast);
  slides.append(modelSlide, compareSlide, contrastSlide);

  const navPrev = document.createElement("button");
  navPrev.className = "logo-inspector-3d__nav logo-inspector-3d__nav--prev";
  navPrev.type = "button";
  navPrev.setAttribute("aria-label", "Предыдущий слайд");
  navPrev.innerHTML = '<span class="logo-inspector-3d__nav-icon" aria-hidden="true"></span>';

  const navNext = document.createElement("button");
  navNext.className = "logo-inspector-3d__nav logo-inspector-3d__nav--next";
  navNext.type = "button";
  navNext.setAttribute("aria-label", "Следующий слайд");
  navNext.innerHTML = '<span class="logo-inspector-3d__nav-icon" aria-hidden="true"></span>';

  if (!SHOW_SLIDER_NAV_BUTTONS) {
    navPrev.disabled = true;
    navNext.disabled = true;
    navPrev.setAttribute("aria-hidden", "true");
    navNext.setAttribute("aria-hidden", "true");
    navPrev.tabIndex = -1;
    navNext.tabIndex = -1;
  }

  const dots = document.createElement("div");
  dots.className = "logo-inspector-3d__dots";
  if (!SHOW_SLIDER_DOTS) dots.setAttribute("aria-hidden", "true");

  const dotHandlers = [];
  const dotButtons = Array.from({ length: SLIDE_COUNT }, (_, index) => {
    const button = document.createElement("button");
    button.className = "logo-inspector-3d__dot-button";
    button.type = "button";
    button.setAttribute("aria-label", `Показать слайд ${index + 1}`);
    if (index === 0) button.classList.add("is-active");

    if (!SHOW_SLIDER_DOTS) {
      button.disabled = true;
      button.tabIndex = -1;
    }

    dots.appendChild(button);
    return button;
  });

  const counter = document.createElement("div");
  counter.className = "logo-inspector-3d__counter";

  const counterCurrent = document.createElement("span");
  counterCurrent.className = "logo-inspector-3d__counter-current";
  counterCurrent.textContent = "i";

  const counterTotal = document.createElement("span");
  counterTotal.className = "logo-inspector-3d__counter-total";
  // counterTotal.textContent = "iii";

  counter.append(counterCurrent, counterTotal);
  root.append(slides, navPrev, navNext, dots, counter);
  host.appendChild(root);

  const slideElements = [modelSlide, compareSlide, contrastSlide];
  const contrastRenderer = createContrastCanvasRenderer(contrastCanvas, assetUrls);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WHITE_BACKGROUND);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 220);
  camera.position.set(0, 0.2, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environmentTexture;

  canvasHost.appendChild(renderer.domElement);

  const stage = new THREE.Group();
  stage.rotation.x = 0.24;
  stage.rotation.z = -0.04;
  scene.add(stage);

  scene.add(new THREE.AmbientLight("#ffffff", 0.44));

  const key = new THREE.DirectionalLight("#ffffff", 2.35);
  const fill = new THREE.DirectionalLight("#e7eef8", 0.84);
  const rim = new THREE.DirectionalLight("#fff5df", 1.16);

  key.position.set(4.8, 4.4, 5);
  fill.position.set(-4, 1.8, 3.4);
  rim.position.set(-4.4, 5.2, -4.8);
  scene.add(key, fill, rim);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let activeSlide = 0;
  let sourceRoot = null;
  let hoveredLogo = null;
  let draggedLogo = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let raf = 0;
  let destroyed = false;
  let lastTime = performance.now();
  let logoIntroStartTime = 0;
  let logoIntroComplete = false;

  const setStatus = (text) => {
    status.textContent = text;
    status.hidden = !text;
  };

  const getLogoFromObject = (object) => {
    let current = object;

    while (current) {
      if (current.userData?.variant) return current;
      if (current.userData?.logoGroup) return current.userData.logoGroup;
      current = current.parent;
    }

    return null;
  };

  const pickLogo = (event) => {
    if (activeSlide !== 0 || (!logoIntroComplete && logoIntroStartTime > 0)) return null;

    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) return null;

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(stage.children, true);
    return intersections.length ? getLogoFromObject(intersections[0].object) : null;
  };

  const updateHover = (event) => {
    if (draggedLogo) return;

    hoveredLogo = pickLogo(event);
    canvasHost.classList.toggle("is-hovering", Boolean(hoveredLogo));
  };

  const clearHover = () => {
    if (draggedLogo) return;

    hoveredLogo = null;
    canvasHost.classList.remove("is-hovering");
  };

  const handlePointerDown = (event) => {
    const logo = pickLogo(event);

    if (!logo) return;

    event.preventDefault();

    draggedLogo = logo;
    hoveredLogo = logo;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    logo.userData.hasManualRotation = true;

    canvasHost.classList.add("is-hovering", "is-dragging");
    renderer.domElement.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!draggedLogo) {
      updateHover(event);
      return;
    }

    event.preventDefault();

    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    draggedLogo.rotation.y += dx * DRAG_ROTATE_SPEED;
    draggedLogo.rotation.x = clamp(draggedLogo.rotation.x + dy * DRAG_ROTATE_SPEED, -Math.PI * 0.62, Math.PI * 0.62);
  };

  const handlePointerUp = (event) => {
    if (!draggedLogo) return;

    renderer.domElement.releasePointerCapture?.(event.pointerId);
    draggedLogo = null;
    canvasHost.classList.remove("is-dragging");
    updateHover(event);
  };

  const layoutLogos = () => {
    const width = Math.max(canvasHost.clientWidth || root.clientWidth || 1, 1);
    const height = Math.max(canvasHost.clientHeight || root.clientHeight || 1, 1);
    const aspect = width / height;
    const compact = width < 760;

    camera.aspect = aspect;
    camera.fov = compact ? 36 : 32;
    camera.updateProjectionMatrix();

    const spacing = compact ? 1.9 : 2.35;
    const scale = compact ? 0.68 : 0.84;
    const targetY = compact ? 0.06 : 0.1;

    stage.children.forEach((logo, index) => {
      const side = index - 1;

      const introPosition = new THREE.Vector3(0, LOGO_FLY_START_Y, LOGO_FLY_START_Z);

      const targetPosition = new THREE.Vector3(side * spacing, targetY, LOGO_FLY_TARGET_Z);

      logo.userData.introPosition = introPosition;
      logo.userData.targetPosition = targetPosition;
      logo.userData.targetScale = scale;

      if (!logo.userData.layoutReady) {
        logo.position.copy(introPosition);
        logo.scale.setScalar(scale);
        logo.userData.layoutReady = true;
        return;
      }

      if (logoIntroComplete) {
        logo.position.copy(targetPosition);
        logo.scale.setScalar(scale);
      }
    });
  };

  const updateLogoIntro = (time) => {
    if (!logoIntroStartTime || logoIntroComplete) return 1;

    const elapsed = time - logoIntroStartTime;
    const rawProgress = (elapsed - LOGO_INTRO_HOLD_MS) / LOGO_INTRO_FLY_MS;
    const progress = clamp(rawProgress, 0, 1);

    const depthProgress = progress * progress * (3 - 2 * progress);
    const spreadProgress = easeOutCubic(clamp((progress - LOGO_FLY_SPREAD_START) / (1 - LOGO_FLY_SPREAD_START), 0, 1));
    const rotateProgress = easeOutCubic(
      clamp((progress - LOGO_FLY_ROTATE_RESOLVE_START) / (1 - LOGO_FLY_ROTATE_RESOLVE_START), 0, 1),
    );

    stage.children.forEach((logo, index) => {
      const introPosition = logo.userData.introPosition;
      const targetPosition = logo.userData.targetPosition;

      if (!introPosition || !targetPosition) return;

      const side = index - 1;
      const arcLift = Math.sin(depthProgress * Math.PI) * 0.2;
      const sideDrift = Math.sin(spreadProgress * Math.PI) * side * 0.1;

      logo.visible = progress >= LOGO_FLY_VISIBLE_PROGRESS;

      logo.position.set(
        lerp(introPosition.x, targetPosition.x, spreadProgress) + sideDrift,
        lerp(introPosition.y, targetPosition.y, spreadProgress) + arcLift,
        lerp(introPosition.z, targetPosition.z, depthProgress),
      );

      logo.scale.setScalar(logo.userData.targetScale || 1);

      if (!logo.userData.hasManualRotation) {
        const startRotX = 0.26;
        const startRotY = side * 0.62;
        const startRotZ = side * 0.18;

        logo.rotation.x = lerp(startRotX, logo.userData.baseRotationX, rotateProgress);
        logo.rotation.y = lerp(startRotY, logo.userData.baseRotationY, rotateProgress);
        logo.rotation.z = lerp(startRotZ, logo.userData.baseRotationZ, rotateProgress);
      }
    });

    if (progress >= 1) {
      logoIntroComplete = true;

      stage.children.forEach((logo) => {
        logo.visible = true;

        if (logo.userData.targetPosition) {
          logo.position.copy(logo.userData.targetPosition);
        }

        if (!logo.userData.hasManualRotation) {
          logo.rotation.set(logo.userData.baseRotationX, logo.userData.baseRotationY, logo.userData.baseRotationZ);
        }
      });
    }

    return progress;
  };

  const resize = () => {
    const bounds = canvasHost.getBoundingClientRect();
    const width = Math.max(Math.floor(bounds.width || canvasHost.clientWidth || 1), 1);
    const height = Math.max(Math.floor(bounds.height || canvasHost.clientHeight || 1), 1);

    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    layoutLogos();
    contrastRenderer.resize();
  };

  const setActiveSlide = (nextSlide) => {
    activeSlide = ((nextSlide % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;
    root.dataset.activeSlide = String(activeSlide);

    slideElements.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === activeSlide);
    });

    dotButtons.forEach((button, index) => {
      const isActive = index === activeSlide;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });

    counterCurrent.textContent = getRomanSlide(activeSlide);

    if (activeSlide !== 0) {
      clearHover();
      draggedLogo = null;
      canvasHost.classList.remove("is-dragging");
    }

    requestAnimationFrame(resize);
  };

  const showPreviousSlide = () => setActiveSlide(activeSlide - 1);
  const showNextSlide = () => setActiveSlide(activeSlide + 1);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  resizeObserver.observe(canvasHost);
  resizeObserver.observe(contrastCanvas);

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("pointercancel", handlePointerUp);
  renderer.domElement.addEventListener("pointerleave", clearHover);

  if (SHOW_SLIDER_NAV_BUTTONS) {
    navPrev.addEventListener("click", showPreviousSlide);
    navNext.addEventListener("click", showNextSlide);
  }

  dotButtons.forEach((button, index) => {
    const handler = () => setActiveSlide(index);
    dotHandlers.push([button, handler]);

    if (SHOW_SLIDER_DOTS) {
      button.addEventListener("click", handler);
    }
  });

  const renderLoop = (time) => {
    if (destroyed) return;

    const delta = clamp((time - lastTime) / 1000, 0, 0.05);
    lastTime = time;

    if (activeSlide === 0) {
      const introProgress = updateLogoIntro(time);
      const isIntroRunning = introProgress < 1;

      stage.children.forEach((logo) => {
        const isPausedByUser = logo === hoveredLogo || logo === draggedLogo;

        if (!isPausedByUser && !isIntroRunning) {
          logo.rotation.y += delta * IDLE_SPIN_SPEED;
        }

        if (!logo.userData.hasManualRotation && !isPausedByUser && !isIntroRunning) {
          logo.rotation.x += (logo.userData.baseRotationX - logo.rotation.x) * RETURN_EASE;
          logo.rotation.z += (logo.userData.baseRotationZ - logo.rotation.z) * RETURN_EASE;
        }
      });

      renderer.render(scene, camera);
    }

    if (activeSlide === 2) {
      contrastRenderer.draw(time);
    }

    raf = requestAnimationFrame(renderLoop);
  };

  loadModel(assetUrls.model)
    .then((loadedRoot) => {
      if (destroyed) {
        disposeObjectResources(loadedRoot);
        return;
      }

      sourceRoot = loadedRoot;
      centerAndScaleObject(sourceRoot, 2.35);

      orderedVariants.slice(0, 3).forEach((variant, index) => {
        stage.add(createVariantLogo(sourceRoot, variant, index));
      });

      layoutLogos();

      stage.children.forEach((logo) => {
        logo.visible = false;
      });

      logoIntroStartTime = performance.now();
      logoIntroComplete = false;
    })
    .catch((error) => {
      console.error(error);

      if (destroyed) return;

      sourceRoot = createFallbackMesh();
      centerAndScaleObject(sourceRoot, 2.35);

      orderedVariants.slice(0, 3).forEach((variant, index) => {
        stage.add(createVariantLogo(sourceRoot, variant, index));
      });

      layoutLogos();

      stage.children.forEach((logo) => {
        logo.visible = false;
      });

      logoIntroStartTime = performance.now();
      logoIntroComplete = false;
      setStatus("модель не загрузилась, показываю fallback");
    });

  resize();
  raf = requestAnimationFrame(renderLoop);

  return {
    element: root,
    setSlide(index) {
      setActiveSlide(index);
    },
    nextSlide() {
      showNextSlide();
    },
    previousSlide() {
      showPreviousSlide();
    },
    dispose() {
      if (destroyed) return;

      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();

      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", clearHover);

      if (SHOW_SLIDER_NAV_BUTTONS) {
        navPrev.removeEventListener("click", showPreviousSlide);
        navNext.removeEventListener("click", showNextSlide);
      }

      if (SHOW_SLIDER_DOTS) {
        dotHandlers.forEach(([button, handler]) => {
          button.removeEventListener("click", handler);
        });
      }

      const cache = {};
      disposeObjectResources(stage, cache);

      if (sourceRoot) {
        disposeObjectResources(sourceRoot, cache);
      }

      environmentTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      root.remove();
    },
  };
}
