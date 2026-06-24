import "./vendor/gsap-globals.js";
import { initHeadingAnimations } from "./components/heading-animations.js";
import "./components/showcase-sync-side-card-height.js";
import "./components/showcase-sync-graphic-side-layouts.js";
import "./components/showcase-gallery-aspect-fit.js";
import "./visuals/dom/media-marquee.js";
import "./visuals/dom/media-slider.js";
import "./visuals/dom/policy-book.js";
import "./visuals/dom/list-scroll.js";
import "./components/proximity-components.js";
import { initPlaylistFilterEmbed } from "./visuals/dom/playlist-filter-embed.js";
import { initRandomGalleries } from "./visuals/dom/random-gallery.js";
import { initComponents } from "./components/index.js";

let appInitialized = false;

async function runInitStep(label, callback) {
  try {
    return await callback();
  } catch (error) {
    console.error("[init] " + label + " failed", error);
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

  await runInitStep("initComponents", () => initComponents(document));
  await runInitStep("initHeadingAnimations", () => initHeadingAnimations(document));
  await runInitStep("initPlaylistFilterEmbed", () => initPlaylistFilterEmbed(document));
  await runInitStep("initRandomGalleries", () => initRandomGalleries(document));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
