import "./styles/index.css";
import { initComponents } from "./components/index.js";

let appInitialized = false;

const ROUTED_PAGE_PATTERN = /^\/(?:resume|pet-projects\/[^/]+)\/?$/;

function isRoutedPage(pathname = window.location.pathname) {
  return ROUTED_PAGE_PATTERN.test(pathname);
}

async function runInitStep(label, callback) {
  try {
    return await callback();
  } catch (error) {
    console.error(`[init] ${label} failed`, error);
    return null;
  }
}

async function renderRoutedPage(main) {
  if (!isRoutedPage()) {
    return;
  }

  const { renderPage } = await import("./sections/index.js");
  renderPage(main);
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

  await runInitStep("renderRoutedPage", () => renderRoutedPage(main));

  appInitialized = true;

  await runInitStep("initComponents", () => initComponents());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
