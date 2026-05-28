import "./styles/index.css";
import { renderPage } from "./sections/index.js";
import { initComponents } from "./components/index.js";
import { withPreloadState } from "./components/preload-state/preload-state.js";

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

  await runInitStep("renderPage", () =>
    withPreloadState(document.body, () => renderPage(main), {
      delay: 420,
      fixed: true,
    }),
  );

  appInitialized = true;

  await runInitStep("initComponents", () => initComponents());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
