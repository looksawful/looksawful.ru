import "./components/cv-sync-side-card-height.js";
import "./components/cv-sync-graphic-side-layouts.js";
import "./components/cv-gallery-aspect-fit.js";
import "./styles/index.css";
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
