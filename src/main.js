import "./components/showcase-sync-side-card-height.js";
import "./components/showcase-sync-graphic-side-layouts.js";
import "./components/showcase-gallery-aspect-fit.js";
import "./styles/index.css";
import "./visuals/dom/media-marquee.js";
import "./visuals/dom/media-slider.js";
import { initComponents } from "./components/index.js";

let appInitialized = false;

async function runInitStep(label, callback) {
  try {
    return await callback();
  } catch (error) {
    console.error(`[init] ${label} failed`, error);
    return null;
  }
}

async function initApp() {
  if (appInitialized) {
    return;
  }

  const main = document.getElementById("main");

  if (!(main instanceof HTMLElement)) {
    console.error("[init] main container not found");
    return;
  }

  appInitialized = true;

  await runInitStep("initComponents", () => initComponents());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
