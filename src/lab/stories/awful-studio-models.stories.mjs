import { createModelViewers } from "../../components/model-viewer.ts";
import { getMediaAsset } from "../../data/media/index.ts";
const models = {
  iphone17: ["iPhone 17 v30 baseline", "iphone-17-v30"],
  ipad11: ["iPad Pro 11 M5 v6", "ipad-pro-11-m5-v6"],
  ipad13: ["iPad Pro 13 M5 v6", "ipad-pro-13-m5-v6"],
  macbook14: ["MacBook Pro 14 M5 v1", "macbook-pro-14-m5-v1"],
  profotoD1: ["Profoto D1 500 Air", "profoto-d1-500-air"],
  profotoMagnum: ["Profoto Magnum", "profoto-magnum-100624"],
  sandbag: ["Studio Sandbag", "studio-sandbag-01"],
  cstand: ["C-Stand", "studio-support-cstand-01"],
  whiteStudio: ["White Studio v2", "white-studio-v2"],
  darkNeon: ["Dark Neon v2", "dark-neon-v2"],
  loftDaylight: ["Loft Daylight v2", "loft-daylight-v2"],
};
let cleanup = () => {};
const render = ({ model, view, autorotate }) => {
  const entry = models[model];
  if (!entry) throw new Error("Unknown AWFUL STUDIO model");
  const figure = document.createElement("figure");
  figure.className = "media";
  figure.innerHTML = '<div class="media__surface" style="position:relative;aspect-ratio:4/3;max-block-size:80vh" data-model-viewer-runtime data-model-autorotate="false" role="img"><canvas data-model-viewer-canvas aria-hidden="true" style="position:absolute;inset:0;inline-size:100%;block-size:100%;touch-action:none"></canvas></div><figcaption class="media__caption"></figcaption>';
  const stage = figure.querySelector("[data-model-viewer-runtime]");
  stage.dataset.modelSrc = ["iphone17", "ipad11", "ipad13", "macbook14"].includes(model)
    ? getMediaAsset("device-" + entry[1] + "-model").src
    : "/media/projects/awful-studio/model-viewer/" + entry[1] + ".glb";
  stage.dataset.modelView = view;
  stage.dataset.modelAutorotate = String(autorotate);
  stage.setAttribute("aria-label", entry[0]);
  figure.querySelector("figcaption").textContent = entry[0];
  return figure;
};
export default {
  title: "02 Molecules/Model Viewer/AWFUL Studio 3D",
  tags: ["autodocs"], args: { model: "iphone17", view: "three-quarter", autorotate: false },
  argTypes: {
    model: { options: Object.keys(models), control: "select" },
    view: { options: ["three-quarter", "front", "side", "top"], control: "select" },
    autorotate: { control: "boolean" },
  }, render,
  beforeEach: () => { cleanup(); return () => cleanup(); },
  play: ({ canvasElement }) => { cleanup(); cleanup = createModelViewers({ root: canvasElement }); },
  parameters: { layout: "padded", looksawful: {
    sources: ["src/components/model-viewer.ts", "src/data/media/assets/devices.ts"],
    layer: "molecule", policy: "behavior-fixture", canonical: true,
    state: "accepted-catalog-baseline", visibility: ["always", "input-capability"],
    responsive: { review: ["desktop", "tablet", "mobile"] },
  }, docs: { description: { component: "11 accepted catalog assets from the #1016 Lab baseline, viewed through the production runtime. iPhone source updates remain a separate candidate under 90 Experimental; this catalog does not certify newer source gates." } } },
};
export const IPhone17 = { args: { model: "iphone17" } };
export const IPadPro11 = { args: { model: "ipad11" } };
export const IPadPro13 = { args: { model: "ipad13" } };
export const MacBookPro14 = { args: { model: "macbook14" } };
export const ProfotoD1 = { args: { model: "profotoD1" } };
export const ProfotoMagnum = { args: { model: "profotoMagnum" } };
export const StudioSandbag = { args: { model: "sandbag" } };
export const CStand = { args: { model: "cstand" } };
export const WhiteStudio = { args: { model: "whiteStudio" } };
export const DarkNeon = { args: { model: "darkNeon" } };
export const LoftDaylight = { args: { model: "loftDaylight" } };
