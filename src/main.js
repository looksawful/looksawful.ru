import "./styles/index.css";
import { renderPage } from "./sections/index.js";
import { initComponents } from "./components/index.js";

let appInitialized = false;

function runInitStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[init] ${label} failed`, error);
    return null;
  }
}

function initApp() {
  if (appInitialized) {
    return;
  }

  const main = document.getElementById("main");

  if (!(main instanceof HTMLElement)) {
    console.error("[init] main container not found");
    return;
  }

  runInitStep("renderPage", () => renderPage(main));

  appInitialized = true;

  runInitStep("initComponents", () => initComponents());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  initApp();
}
