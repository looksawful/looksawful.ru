import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const STYLE_ID = "model-viewer-controls-prototype-styles";

const controlSpecs = [
  { id: "autorotate", label: "вращение", kind: "toggle", zone: "direct", group: "direct", value: true },
  { id: "render-mode", label: "режим", kind: "select", zone: "direct", group: "direct", options: ["текстура", "каркас", "текстура + каркас", "clay", "normals", "uv", "vertex colors", "matcap", "x-ray", "silhouette", "points"], value: "текстура" },
  { id: "camera-presets", label: "ракурс", kind: "segmented", zone: "direct", group: "direct", options: ["спереди", "сбоку", "сверху"], value: "спереди" },
  { id: "fit-model", label: "вписать", kind: "action", zone: "direct", group: "direct" },
  { id: "animation-play", label: "анимация", kind: "toggle", zone: "direct", group: "direct", value: false },
  { id: "fullscreen", label: "экран", kind: "action", zone: "direct", group: "direct" },

  { id: "rotation-speed", label: "скорость", kind: "range", group: "движение", min: 0, max: 1.5, step: 0.05, value: 0.3 },
  { id: "rotation-direction", label: "направление", kind: "segmented", group: "движение", options: ["вперёд", "назад"], value: "вперёд" },
  { id: "rotation-axis", label: "ось", kind: "segmented", group: "движение", options: ["x", "y", "z"], value: "y" },
  { id: "drag-rotate", label: "вращать жестом", kind: "toggle", group: "движение", value: true },

  { id: "orbit", label: "orbit", kind: "toggle", group: "камера", value: true },
  { id: "zoom", label: "zoom", kind: "toggle", group: "камера", value: true },
  { id: "pan", label: "pan", kind: "toggle", group: "камера", value: false },
  { id: "projection", label: "проекция", kind: "segmented", group: "камера", options: ["перспектива", "орто"], value: "перспектива" },
  { id: "fov", label: "fov", kind: "range", group: "камера", min: 18, max: 70, step: 1, value: 33 },
  { id: "zoom-sensitivity", label: "чувствительность zoom", kind: "range", group: "камера", min: 0.25, max: 2, step: 0.05, value: 1 },
  { id: "rotation-sensitivity", label: "чувствительность вращения", kind: "range", group: "камера", min: 0.25, max: 2, step: 0.05, value: 0.65 },
  { id: "camera-limits", label: "дистанция", kind: "range", group: "камера", min: 3, max: 18, step: 0.5, value: 9 },
  { id: "reset-view", label: "сбросить ракурс", kind: "action", group: "камера" },

  { id: "background", label: "фон", kind: "select", group: "вид", options: ["transparent", "white", "black", "custom", "environment"], value: "transparent" },
  { id: "background-color", label: "цвет фона", kind: "color", group: "вид", value: "#f7f7f5" },
  { id: "ground", label: "плоскость", kind: "toggle", group: "вид", value: true },
  { id: "grid-floor", label: "сетка пола", kind: "toggle", group: "вид", value: false },

  { id: "lighting-enabled", label: "свет", kind: "toggle", group: "свет", value: true },
  { id: "lighting-mode", label: "источник", kind: "segmented", group: "свет", options: ["studio", "model", "hybrid"], value: "studio" },
  { id: "environment", label: "окружение", kind: "toggle", group: "свет", value: true },
  { id: "environment-preset", label: "окружение preset", kind: "select", group: "свет", options: ["soft studio", "neutral", "contrast", "model"], value: "soft studio" },
  { id: "environment-intensity", label: "интенсивность окружения", kind: "range", group: "свет", min: 0, max: 2, step: 0.05, value: 1 },
  { id: "key-light", label: "key", kind: "range", group: "свет", min: 0, max: 5, step: 0.1, value: 2.3 },
  { id: "fill-light", label: "fill", kind: "range", group: "свет", min: 0, max: 5, step: 0.1, value: 0.9 },
  { id: "rim-light", label: "rim", kind: "range", group: "свет", min: 0, max: 5, step: 0.1, value: 1.4 },
  { id: "light-direction", label: "направление света", kind: "range", group: "свет", min: 0, max: 360, step: 1, value: 35 },
  { id: "exposure", label: "экспозиция", kind: "range", group: "свет", min: 0.25, max: 2, step: 0.05, value: 1 },
  { id: "tone-mapping", label: "tone mapping", kind: "select", group: "свет", options: ["aces", "neutral", "none"], value: "aces" },
  { id: "shadows", label: "тени", kind: "toggle", group: "свет", value: true },
  { id: "shadow-softness", label: "мягкость теней", kind: "range", group: "свет", min: 0, max: 4, step: 0.1, value: 2 },

  { id: "animation-clip", label: "клип", kind: "select", group: "анимация", options: ["idle", "spin", "float", "tilt"], value: "idle" },
  { id: "animation-restart", label: "сначала", kind: "action", group: "анимация" },
  { id: "animation-loop", label: "цикл", kind: "toggle", group: "анимация", value: true },
  { id: "animation-speed", label: "скорость", kind: "range", group: "анимация", min: 0.1, max: 2.5, step: 0.1, value: 1 },
  { id: "animation-direction", label: "направление", kind: "segmented", group: "анимация", options: ["вперёд", "назад"], value: "вперёд" },
  { id: "animation-timeline", label: "таймлайн", kind: "range", group: "анимация", min: 0, max: 10, step: 0.05, value: 0 },

  { id: "parts", label: "части модели", kind: "checklist", group: "модель", options: ["core", "ring", "base"] },
  { id: "isolate-part", label: "изолировать", kind: "select", group: "модель", options: ["all", "core", "ring", "base"], value: "all" },
  { id: "explode", label: "разнести", kind: "range", group: "модель", min: 0, max: 1, step: 0.05, value: 0 },
  { id: "material-variant", label: "материал", kind: "select", group: "модель", options: ["default", "dark", "chrome", "warm"], value: "default" },
  { id: "texture-variant", label: "текстура", kind: "select", group: "модель", options: ["checker", "plain", "uv"], value: "checker" },
  { id: "material-color", label: "цвет материала", kind: "color", group: "модель", value: "#d4d0c8" },
  { id: "roughness", label: "roughness", kind: "range", group: "модель", min: 0, max: 1, step: 0.01, value: 0.46 },
  { id: "metalness", label: "metalness", kind: "range", group: "модель", min: 0, max: 1, step: 0.01, value: 0.28 },
  { id: "opacity", label: "opacity", kind: "range", group: "модель", min: 0.05, max: 1, step: 0.01, value: 1 },
  { id: "normal-intensity", label: "normal", kind: "range", group: "модель", min: 0, max: 2, step: 0.05, value: 1 },
  { id: "emissive-intensity", label: "emissive", kind: "range", group: "модель", min: 0, max: 2, step: 0.05, value: 0 },
  { id: "reflection-intensity", label: "reflection", kind: "range", group: "модель", min: 0, max: 2, step: 0.05, value: 1 },
  { id: "lod", label: "lod", kind: "select", group: "модель", options: ["auto", "high", "medium", "low"], value: "auto" },

  { id: "selection", label: "выбор частей", kind: "toggle", group: "интеракции", value: true },
  { id: "hover-highlight", label: "подсветка hover", kind: "toggle", group: "интеракции", value: true },
  { id: "hotspots", label: "hotspots", kind: "toggle", group: "интеракции", value: false },
  { id: "annotations", label: "аннотации", kind: "toggle", group: "интеракции", value: false },

  { id: "clipping", label: "сечение", kind: "toggle", group: "сечение и debug", value: false },
  { id: "clipping-axis", label: "ось сечения", kind: "segmented", group: "сечение и debug", options: ["x", "y", "z"], value: "x" },
  { id: "clipping-position", label: "позиция", kind: "range", group: "сечение и debug", min: -1.2, max: 1.2, step: 0.02, value: 0 },
  { id: "clipping-invert", label: "инвертировать", kind: "toggle", group: "сечение и debug", value: false },
  { id: "clipping-cap-color", label: "цвет сечения", kind: "color", group: "сечение и debug", value: "#111111" },
  { id: "debug-axes", label: "оси", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-edges", label: "рёбра", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-vertices", label: "вершины", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-normals", label: "нормали", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-bounds", label: "bounds", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-skeleton", label: "skeleton", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-collision", label: "collision", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-origin", label: "origin", kind: "toggle", group: "сечение и debug", value: false },
  { id: "debug-stats", label: "статистика", kind: "toggle", group: "сечение и debug", value: false },
  { id: "model-info", label: "информация о модели", kind: "readout", group: "сечение и debug" },

  { id: "quality", label: "качество", kind: "segmented", group: "качество", options: ["auto", "low", "high"], value: "auto" },
];

const allControlIds = controlSpecs.map((spec) => spec.id);
const directControlIds = controlSpecs.filter((spec) => spec.zone === "direct").map((spec) => spec.id);
const portfolioPreset = ["autorotate", "render-mode", "camera-presets", "fit-model", "fullscreen"];
const animatedPreset = [...portfolioPreset, "animation-play", "animation-clip", "animation-loop", "animation-speed", "animation-timeline"];
const presets = {
  minimal: ["autorotate", "render-mode"],
  portfolio: portfolioPreset,
  animated: animatedPreset,
  full: allControlIds,
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mv-lab { display:grid; gap:var(--size-300); min-inline-size:0; color:var(--clr-text); }
    .mv-stage { position:relative; display:grid; min-block-size:clamp(32rem,72vh,54rem); overflow:hidden; border:var(--border-width-100) solid var(--clr-border); border-radius:var(--radius-shell); background:var(--clr-surface-page); container:model-viewer / inline-size; }
    .mv-stage canvas { position:absolute; inset:0; inline-size:100%; block-size:100%; touch-action:none; }
    .mv-direct { position:absolute; z-index:5; inset-inline-end:var(--size-300); inset-block-end:var(--size-300); display:flex; flex-wrap:wrap; justify-content:flex-end; gap:.25rem; max-inline-size:calc(100% - 2 * var(--size-300)); padding:.25rem; border:var(--border-width-100) solid var(--clr-border); border-radius:var(--radius-contained); background:color-mix(in srgb,var(--clr-surface-raised),transparent 4%); box-shadow:var(--shadow-surface-elevated); }
    .mv-pill,.mv-action,.mv-settings-trigger { appearance:none; min-block-size:2rem; padding-inline:.6rem; border:0; border-radius:999px; background:transparent; color:inherit; font:inherit; font-size:.75rem; line-height:var(--lh-ui); cursor:pointer; }
    .mv-pill:hover,.mv-pill:focus-visible,.mv-action:hover,.mv-action:focus-visible,.mv-settings-trigger:hover,.mv-settings-trigger:focus-visible,.mv-pill[aria-pressed="true"],.mv-settings-trigger[aria-expanded="true"] { background:color-mix(in srgb,currentColor,transparent 90%); }
    .mv-pill:focus-visible,.mv-action:focus-visible,.mv-settings-trigger:focus-visible,.mv-segmented input:focus-visible + span,.mv-toggle-row input:focus-visible + span,.mv-check-group input:focus-visible + span { outline:var(--border-width-200) solid currentColor; outline-offset:2px; }
    .mv-direct-field { display:grid; grid-auto-flow:column; align-items:center; gap:.3rem; min-block-size:2rem; padding-inline:.55rem; border-radius:999px; font-size:.75rem; }
    .mv-direct-field span { color:var(--clr-text-muted); }
    .mv-direct-field select { appearance:none; border:0; outline:0; background:transparent; color:inherit; font:inherit; cursor:pointer; }
    .mv-segmented { min-inline-size:0; margin:0; padding:0; border:0; }
    .mv-segmented legend { margin-block-end:.35rem; color:var(--clr-text-muted); font-size:.75rem; }
    .mv-segmented > div { display:flex; flex-wrap:wrap; gap:.15rem; padding:.15rem; border:var(--border-width-100) solid var(--clr-border); border-radius:999px; }
    .mv-segmented label { position:relative; min-inline-size:0; }
    .mv-segmented input { position:absolute; inline-size:1px; block-size:1px; opacity:0; pointer-events:none; }
    .mv-segmented span { display:grid; place-items:center; min-block-size:1.75rem; padding-inline:.55rem; border-radius:999px; font-size:.75rem; white-space:nowrap; cursor:pointer; }
    .mv-segmented input:checked + span { background:color-mix(in srgb,currentColor,transparent 88%); }
    .mv-direct .mv-segmented legend { position:absolute; inline-size:1px; block-size:1px; overflow:hidden; clip-path:inset(50%); }
    .mv-direct .mv-segmented > div { min-block-size:2rem; align-items:center; }
    .mv-panel { position:absolute; z-index:4; inset-block:var(--size-300) calc(3.5rem + var(--size-300)); inset-inline-end:var(--size-300); inline-size:min(24rem,calc(100% - 2 * var(--size-300))); overflow:auto; overscroll-behavior:contain; border:var(--border-width-100) solid var(--clr-border); border-radius:var(--radius-contained); background:var(--clr-surface-raised); box-shadow:var(--shadow-surface-elevated); }
    .mv-panel[hidden] { display:none; }
    .mv-panel-head { position:sticky; z-index:2; inset-block-start:0; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.65rem .75rem; border-block-end:var(--border-width-100) solid var(--clr-border); background:inherit; }
    .mv-panel-head strong { font-size:.75rem; font-weight:var(--fw-500); }
    .mv-panel-head button { appearance:none; border:0; background:transparent; color:inherit; font:inherit; font-size:.75rem; cursor:pointer; }
    .mv-group { border-block-end:var(--border-width-100) solid var(--clr-border); }
    .mv-group:last-child { border-block-end:0; }
    .mv-group > summary { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.75rem; color:var(--clr-text-muted); font-size:.75rem; cursor:pointer; list-style:none; }
    .mv-group > summary::-webkit-details-marker { display:none; }
    .mv-group > summary::after { content:"+"; color:var(--clr-text); }
    .mv-group[open] > summary::after { content:"−"; }
    .mv-group-body { display:grid; gap:.75rem; padding:0 .75rem .85rem; }
    .mv-toggle-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:1rem; min-block-size:2rem; font-size:.8rem; cursor:pointer; }
    .mv-toggle-row input { position:absolute; inline-size:1px; block-size:1px; opacity:0; }
    .mv-toggle-art { position:relative; flex:0 0 auto; inline-size:2rem; block-size:1.15rem; border:var(--border-width-100) solid var(--clr-border-strong); border-radius:999px; }
    .mv-toggle-art::after { content:""; position:absolute; inset-block-start:50%; inset-inline-start:.16rem; inline-size:.72rem; block-size:.72rem; border-radius:50%; background:currentColor; transform:translateY(-50%); transition:transform 140ms ease; }
    .mv-toggle-row input:checked + .mv-toggle-art { background:color-mix(in srgb,currentColor,transparent 90%); }
    .mv-toggle-row input:checked + .mv-toggle-art::after { transform:translate(.82rem,-50%); }
    .mv-range { display:grid; gap:.35rem; font-size:.75rem; }
    .mv-range > span:first-child { color:var(--clr-text-muted); }
    .mv-range__row { display:grid; grid-template-columns:minmax(0,1fr) 3.25rem; align-items:center; gap:.65rem; }
    .mv-range input { inline-size:100%; accent-color:currentColor; }
    .mv-range output { text-align:end; font-variant-numeric:tabular-nums; }
    .mv-field,.mv-color { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:.75rem; min-block-size:2rem; font-size:.75rem; }
    .mv-field > span,.mv-color > span:first-child { color:var(--clr-text-muted); }
    .mv-field select { min-inline-size:8rem; max-inline-size:12rem; block-size:2rem; padding-inline:.55rem; border:var(--border-width-100) solid var(--clr-border); border-radius:999px; background:transparent; color:inherit; font:inherit; font-size:.75rem; }
    .mv-color > span:last-child { display:flex; align-items:center; gap:.45rem; }
    .mv-color input { inline-size:1.5rem; block-size:1.5rem; padding:0; overflow:hidden; border:var(--border-width-100) solid var(--clr-border); border-radius:50%; background:transparent; }
    .mv-color code { color:var(--clr-text-muted); font-family:var(--ff-mono); font-size:.7rem; }
    .mv-check-group { display:grid; gap:.4rem; margin:0; padding:0; border:0; }
    .mv-check-group legend { margin-block-end:.15rem; color:var(--clr-text-muted); font-size:.75rem; }
    .mv-check-group label { position:relative; display:flex; align-items:center; gap:.5rem; min-block-size:1.8rem; font-size:.78rem; cursor:pointer; }
    .mv-check-group input { inline-size:1rem; block-size:1rem; accent-color:currentColor; }
    .mv-readout { display:grid; grid-template-columns:1fr 1fr; gap:.35rem .8rem; margin:0; font-size:.72rem; }
    .mv-readout div { display:flex; justify-content:space-between; gap:.5rem; border-block-end:var(--border-width-100) solid var(--clr-border); padding-block:.3rem; }
    .mv-readout dt { color:var(--clr-text-muted); }
    .mv-readout dd { margin:0; }
    .mv-lab-config { display:grid; gap:.75rem; padding:var(--size-300); border:var(--border-width-100) solid var(--clr-border); border-radius:var(--radius-contained); background:var(--clr-surface-raised); }
    .mv-lab-config__head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:.5rem 1rem; }
    .mv-lab-config h3 { margin:0; font-size:var(--fs-300); font-weight:var(--fw-500); }
    .mv-lab-presets { display:flex; flex-wrap:wrap; gap:.25rem; }
    .mv-lab-presets button { appearance:none; min-block-size:2rem; padding-inline:.6rem; border:var(--border-width-100) solid var(--clr-border); border-radius:999px; background:transparent; color:inherit; font:inherit; font-size:.75rem; cursor:pointer; }
    .mv-lab-presets button[aria-pressed="true"] { background:color-mix(in srgb,currentColor,transparent 90%); }
    .mv-lab-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr)); gap:.3rem .75rem; }
    .mv-lab-list label { display:flex; align-items:center; gap:.45rem; min-block-size:1.7rem; font-size:.72rem; }
    .mv-lab-list input { accent-color:currentColor; }
    .mv-lab-code { overflow:auto; margin:0; padding:.7rem; border-radius:var(--radius-100); background:var(--clr-surface-page); color:var(--clr-text-muted); font: .7rem/1.45 var(--ff-mono); white-space:pre; }
    .mv-helper { position:absolute; z-index:3; inset-inline-start:var(--size-300); inset-block-end:var(--size-300); color:var(--clr-text-muted); font-size:.7rem; pointer-events:none; }
    @container model-viewer (width < 46rem) {
      .mv-stage { min-block-size:42rem; }
      .mv-direct { inset-inline:var(--size-200); inset-block-end:var(--size-200); justify-content:center; max-inline-size:none; }
      .mv-panel { inset-inline:var(--size-200); inset-block-start:auto; inset-block-end:4.25rem; inline-size:auto; max-block-size:58%; }
      .mv-pill,.mv-action,.mv-settings-trigger,.mv-direct-field,.mv-direct .mv-segmented > div { min-block-size:2.75rem; }
      .mv-segmented span { min-block-size:2.35rem; }
      .mv-helper { display:none; }
    }
    @media (prefers-reduced-motion: reduce) { .mv-toggle-art::after { transition:none; } }
  `;
  document.head.append(style);
};

const parseEnabled = (root) => {
  const tokens = (root.dataset.modelControls ?? "").split(/[\s,]+/).filter(Boolean);
  return tokens.includes("all") ? new Set(allControlIds) : new Set(tokens.filter((token) => allControlIds.includes(token)));
};

const renderControl = (spec, compact = false) => {
  const value = spec.value ?? "";
  if (spec.kind === "toggle") {
    if (compact) return `<button class="mv-pill" type="button" data-control="${spec.id}" aria-pressed="${String(Boolean(value))}">${spec.label}</button>`;
    return `<label class="mv-toggle-row"><span>${spec.label}</span><span><input type="checkbox" data-control="${spec.id}" ${value ? "checked" : ""}><span class="mv-toggle-art" aria-hidden="true"></span></span></label>`;
  }
  if (spec.kind === "action") return `<button class="${compact ? "mv-action" : "mv-action"}" type="button" data-control="${spec.id}">${spec.label}</button>`;
  if (spec.kind === "range") return `<label class="mv-range"><span>${spec.label}</span><span class="mv-range__row"><input type="range" data-control="${spec.id}" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${value}"><output>${value}</output></span></label>`;
  if (spec.kind === "select") {
    const options = (spec.options ?? []).map((option) => `<option ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
    if (compact) return `<label class="mv-direct-field"><span>${spec.label}</span><select data-control="${spec.id}">${options}</select></label>`;
    return `<label class="mv-field"><span>${spec.label}</span><select data-control="${spec.id}">${options}</select></label>`;
  }
  if (spec.kind === "color") return `<label class="mv-color"><span>${spec.label}</span><span><input type="color" data-control="${spec.id}" value="${value}"><code>${value}</code></span></label>`;
  if (spec.kind === "checklist") return `<fieldset class="mv-check-group"><legend>${spec.label}</legend>${(spec.options ?? []).map((option) => `<label><input type="checkbox" data-part="${option}" checked><span>${option}</span></label>`).join("")}</fieldset>`;
  if (spec.kind === "readout") return `<dl class="mv-readout"><div><dt>meshes</dt><dd>3</dd></div><div><dt>materials</dt><dd>3</dd></div><div><dt>animations</dt><dd>4 demo</dd></div><div><dt>scale</dt><dd>1.0</dd></div></dl>`;
  const options = spec.options ?? [];
  return `<fieldset class="mv-segmented"><legend>${spec.label}</legend><div>${options.map((option, index) => `<label><input type="radio" name="${spec.id}" data-control="${spec.id}" value="${escapeHtml(option)}" ${(option === value || (!value && index === 0)) ? "checked" : ""}><span>${escapeHtml(option)}</span></label>`).join("")}</div></fieldset>`;
};

const renderControls = (root) => {
  const enabled = parseEnabled(root);
  const direct = controlSpecs.filter((spec) => spec.zone === "direct" && enabled.has(spec.id));
  const detailed = controlSpecs.filter((spec) => spec.zone !== "direct" && enabled.has(spec.id));
  const toolbar = root.querySelector("[data-viewer-direct]");
  const panel = root.querySelector("[data-viewer-panel]");
  const panelBody = root.querySelector("[data-viewer-panel-body]");
  if (!toolbar || !panel || !panelBody) return;

  toolbar.innerHTML = direct.map((spec) => renderControl(spec, true)).join("");
  if (detailed.length) {
    toolbar.insertAdjacentHTML("beforeend", `<button class="mv-settings-trigger" type="button" data-viewer-settings aria-expanded="${String(!panel.hidden)}">настройки</button>`);
  }

  const grouped = new Map();
  detailed.forEach((spec) => {
    const list = grouped.get(spec.group) ?? [];
    list.push(spec);
    grouped.set(spec.group, list);
  });
  panelBody.innerHTML = [...grouped.entries()].map(([group, specs], index) => `<details class="mv-group" ${index < 3 ? "open" : ""}><summary>${group}</summary><div class="mv-group-body">${specs.map((spec) => renderControl(spec)).join("")}</div></details>`).join("");
  panel.hidden = detailed.length === 0 || panel.hidden;
  root.querySelectorAll("[data-viewer-settings]").forEach((button) => button.setAttribute("aria-expanded", String(!panel.hidden)));
};

const makeCheckerTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "#d8d4cb";
  context.fillRect(0, 0, 256, 256);
  context.fillStyle = "#b8b2a8";
  for (let y = 0; y < 4; y += 1) for (let x = 0; x < 4; x += 1) if ((x + y) % 2 === 0) context.fillRect(x * 64, y * 64, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
};

const createRuntime = (root) => {
  const canvas = root.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const camera = new THREE.PerspectiveCamera(33, 1, 0.01, 100);
  camera.position.set(4.2, 3.2, 5.4);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.target.set(0, 0.35, 0);

  const checker = makeCheckerTexture();
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xd4d0c8, map: checker, roughness: 0.46, metalness: 0.28 });
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.24, metalness: 0.7 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.12 });

  const model = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 3), baseMaterial);
  core.name = "core";
  core.castShadow = true;
  core.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 18, 96), ringMaterial);
  ring.name = "ring";
  ring.rotation.x = Math.PI / 2.8;
  ring.rotation.z = Math.PI / 6;
  ring.castShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.28, 0.28, 72), accentMaterial);
  base.name = "base";
  base.position.y = -1.65;
  base.castShadow = true;
  base.receiveShadow = true;
  model.add(core, ring, base);
  scene.add(model);

  const groundMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.14 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.82;
  ground.receiveShadow = true;
  scene.add(ground);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x777777, 0.85);
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(4, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const fill = new THREE.DirectionalLight(0xffffff, 0.9);
  fill.position.set(-5, 2, 2);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(0, 5, -5);
  scene.add(hemi, key, fill, rim);

  const axes = new THREE.AxesHelper(2.8);
  axes.visible = false;
  scene.add(axes);
  const box = new THREE.BoxHelper(model, 0x111111);
  box.visible = false;
  scene.add(box);

  let autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let rotationSpeed = 0.3;
  let rotationDirection = 1;
  let rotationAxis = "y";
  let frame = 0;
  let previousTime = performance.now();
  let resizeObserver;

  const resize = () => {
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const fit = () => {
    camera.position.set(4.2, 3.2, 5.4);
    orbit.target.set(0, 0.35, 0);
    orbit.update();
  };

  const setRenderMode = (mode) => {
    core.material = baseMaterial;
    ring.material = ringMaterial;
    base.material = accentMaterial;
    [baseMaterial, ringMaterial, accentMaterial].forEach((material) => { material.wireframe = false; material.transparent = false; material.opacity = 1; material.map = material === baseMaterial ? checker : null; });
    if (mode === "каркас") [baseMaterial, ringMaterial, accentMaterial].forEach((material) => { material.wireframe = true; material.map = null; });
    if (mode === "clay") [baseMaterial, ringMaterial, accentMaterial].forEach((material) => { material.color.set(0xbeb9ae); material.map = null; material.roughness = 0.78; material.metalness = 0; });
    if (mode === "normals") [core, ring, base].forEach((mesh) => { mesh.material = new THREE.MeshNormalMaterial(); });
    if (mode === "x-ray") [baseMaterial, ringMaterial, accentMaterial].forEach((material) => { material.transparent = true; material.opacity = 0.38; material.map = null; });
    if (mode === "silhouette") [baseMaterial, ringMaterial, accentMaterial].forEach((material) => { material.color.set(0x111111); material.map = null; material.roughness = 1; material.metalness = 0; });
    if (mode === "текстура" || mode === "текстура + каркас") {
      baseMaterial.color.set(0xd4d0c8); ringMaterial.color.set(0x1b1b1b); accentMaterial.color.set(0xffffff);
      baseMaterial.roughness = 0.46; baseMaterial.metalness = 0.28; baseMaterial.map = checker;
      ringMaterial.roughness = 0.24; ringMaterial.metalness = 0.7;
    }
  };

  const onControl = (event) => {
    const target = event.target.closest?.("[data-control]");
    if (!target || !root.contains(target)) return;
    const id = target.dataset.control;
    const value = target.type === "checkbox" ? target.checked : target.value;
    if (target.matches("button[aria-pressed]")) target.setAttribute("aria-pressed", String(target.getAttribute("aria-pressed") !== "true"));
    if (id === "autorotate") autoRotate = target.getAttribute("aria-pressed") === "true";
    if (id === "rotation-speed") rotationSpeed = Number(target.value);
    if (id === "rotation-direction") rotationDirection = target.value === "назад" ? -1 : 1;
    if (id === "rotation-axis") rotationAxis = target.value;
    if (id === "render-mode") setRenderMode(target.value);
    if (id === "fov") { camera.fov = Number(target.value); camera.updateProjectionMatrix(); }
    if (id === "orbit" || id === "drag-rotate") orbit.enableRotate = Boolean(value);
    if (id === "zoom") orbit.enableZoom = Boolean(value);
    if (id === "pan") orbit.enablePan = Boolean(value);
    if (id === "zoom-sensitivity") orbit.zoomSpeed = Number(target.value);
    if (id === "rotation-sensitivity") orbit.rotateSpeed = Number(target.value);
    if (id === "camera-limits") orbit.maxDistance = Number(target.value);
    if (id === "reset-view" || id === "fit-model") fit();
    if (id === "camera-presets") {
      if (target.value === "сверху") camera.position.set(0.01, 7, 0.01);
      else if (target.value === "сбоку") camera.position.set(6, 0.5, 0);
      else camera.position.set(0, 0.65, 6);
      orbit.target.set(0, 0.25, 0); orbit.update();
    }
    if (id === "ground") ground.visible = Boolean(value);
    if (id === "lighting-enabled") [hemi, key, fill, rim].forEach((light) => { light.visible = Boolean(value); });
    if (id === "key-light") key.intensity = Number(target.value);
    if (id === "fill-light") fill.intensity = Number(target.value);
    if (id === "rim-light") rim.intensity = Number(target.value);
    if (id === "exposure") renderer.toneMappingExposure = Number(target.value);
    if (id === "shadows") renderer.shadowMap.enabled = Boolean(value);
    if (id === "roughness") baseMaterial.roughness = Number(target.value);
    if (id === "metalness") baseMaterial.metalness = Number(target.value);
    if (id === "opacity") { baseMaterial.transparent = Number(target.value) < 1; baseMaterial.opacity = Number(target.value); }
    if (id === "material-color") baseMaterial.color.set(target.value);
    if (id === "background-color") root.style.setProperty("--mv-custom-background", target.value);
    if (id === "background") {
      const map = { transparent: "var(--clr-surface-page)", white: "#fff", black: "#111", custom: "var(--mv-custom-background,#f7f7f5)", environment: "var(--clr-surface-page)" };
      root.style.background = map[target.value] ?? "var(--clr-surface-page)";
    }
    if (id === "debug-axes") axes.visible = Boolean(value);
    if (id === "debug-bounds") box.visible = Boolean(value);
    if (id === "explode") { const amount = Number(target.value); core.position.y = amount * 0.7; ring.position.y = amount * 1.35; base.position.y = -1.65 - amount * 0.5; box.update(); }
    if (target.matches('input[type="range"]')) target.parentElement?.querySelector("output")?.replaceChildren(document.createTextNode(target.value));
    if (target.matches('input[type="color"]')) target.parentElement?.querySelector("code")?.replaceChildren(document.createTextNode(target.value));
  };

  root.addEventListener("input", onControl);
  root.addEventListener("change", onControl);
  root.addEventListener("click", (event) => {
    const settings = event.target.closest?.("[data-viewer-settings]");
    if (settings) {
      const panel = root.querySelector("[data-viewer-panel]");
      panel.hidden = !panel.hidden;
      settings.setAttribute("aria-expanded", String(!panel.hidden));
    }
    if (event.target.closest?.("[data-viewer-close]")) {
      const panel = root.querySelector("[data-viewer-panel]");
      panel.hidden = true;
      root.querySelector("[data-viewer-settings]")?.setAttribute("aria-expanded", "false");
    }
    if (event.target.closest?.('[data-control="fullscreen"]')) root.requestFullscreen?.();
  });

  orbit.addEventListener("start", () => { orbit.userDataResume = autoRotate; autoRotate = false; });
  orbit.addEventListener("end", () => { if (orbit.userDataResume) window.setTimeout(() => { autoRotate = true; }, 700); });
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  resize();

  const tick = (time) => {
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    if (autoRotate) model.rotation[rotationAxis] += delta * rotationSpeed * rotationDirection;
    orbit.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    orbit.dispose();
    checker.dispose();
    environment.dispose();
    pmrem.dispose();
    [core, ring, base, ground].forEach((mesh) => mesh.geometry.dispose());
    [baseMaterial, ringMaterial, accentMaterial, groundMaterial].forEach((material) => material.dispose());
    renderer.dispose();
  };
};

const renderLabConfig = (root) => {
  const enabled = parseEnabled(root);
  const config = root.parentElement?.querySelector("[data-lab-config]");
  if (!config) return;
  config.querySelectorAll("[data-lab-control]").forEach((input) => { input.checked = enabled.has(input.dataset.labControl); });
  const code = config.querySelector("[data-lab-code]");
  if (code) code.textContent = `data-model-controls="${[...enabled].join(" ")}"`;
  config.querySelectorAll("[data-lab-preset]").forEach((button) => {
    const preset = presets[button.dataset.labPreset] ?? [];
    button.setAttribute("aria-pressed", String(preset.length === enabled.size && preset.every((id) => enabled.has(id))));
  });
};

const initialize = ({ canvasElement }, preset = "full") => {
  ensureStyles();
  const wrapper = canvasElement.querySelector("[data-model-viewer-demo]");
  const root = wrapper?.querySelector("[data-model-viewer]");
  if (!root || !wrapper) return;
  root.dataset.modelControls = (presets[preset] ?? presets.full).join(" ");
  renderControls(root);
  renderLabConfig(root);
  const destroy = createRuntime(root);

  wrapper.addEventListener("change", (event) => {
    const toggle = event.target.closest?.("[data-lab-control]");
    if (!toggle) return;
    const enabled = parseEnabled(root);
    if (toggle.checked) enabled.add(toggle.dataset.labControl); else enabled.delete(toggle.dataset.labControl);
    root.dataset.modelControls = [...enabled].join(" ");
    renderControls(root);
    renderLabConfig(root);
  });
  wrapper.addEventListener("click", (event) => {
    const presetButton = event.target.closest?.("[data-lab-preset]");
    if (!presetButton) return;
    root.dataset.modelControls = (presets[presetButton.dataset.labPreset] ?? presets.full).join(" ");
    renderControls(root);
    renderLabConfig(root);
  });
  return destroy;
};

const renderStory = () => `
  <div class="mv-lab" data-model-viewer-demo>
    <section class="mv-stage" data-model-viewer data-model-controls="all" aria-label="3D model viewer controls prototype">
      <canvas aria-label="3D model"></canvas>
      <div class="mv-helper">drag — rotate · wheel — zoom</div>
      <div class="mv-direct" data-viewer-direct></div>
      <aside class="mv-panel" data-viewer-panel hidden aria-label="настройки модели">
        <div class="mv-panel-head"><strong>настройки</strong><button type="button" data-viewer-close>закрыть</button></div>
        <div data-viewer-panel-body></div>
      </aside>
    </section>
    <section class="mv-lab-config" data-lab-config>
      <div class="mv-lab-config__head"><h3>lab: состав контролов</h3><div class="mv-lab-presets">${Object.keys(presets).map((name) => `<button type="button" data-lab-preset="${name}" aria-pressed="false">${name}</button>`).join("")}</div></div>
      <div class="mv-lab-list">${controlSpecs.map((spec) => `<label><input type="checkbox" data-lab-control="${spec.id}"><span>${spec.label} <code>${spec.id}</code></span></label>`).join("")}</div>
      <pre class="mv-lab-code" data-lab-code></pre>
    </section>
  </div>
`;

const meta = {
  title: "02 Molecules/Model Viewer Controls",
  tags: ["autodocs", "prototype", "lab-only", "a11y-review-needed"],
  render: renderStory,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Lab-only prototype for a data-attribute-driven 3D viewer control system. The production component is intentionally not connected to any project surface yet.",
      },
    },
  },
};

export default meta;
export const Full = { play: (context) => initialize(context, "full") };
export const Portfolio = { play: (context) => initialize(context, "portfolio") };
export const Minimal = { play: (context) => initialize(context, "minimal") };
export const Animated = { play: (context) => initialize(context, "animated") };
