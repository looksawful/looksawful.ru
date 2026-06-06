import "./styles/index.css";
import { renderPage } from "./sections/index.js";
import { initComponents } from "./components/index.js";
import { withPreloadState } from "./components/preload-state/preload-state.js";

import { mountCvHorizontal } from "./lab/canvas/cv-horizontal/index.js";
import { mountCvCarousel } from "./lab/canvas/cv-carousel/index.js";
import { mountMasonry } from "./lab/canvas/masonry/index.js";
import { mountArc } from "./lab/canvas/arc/index.js";
import { mountCvDiagonal } from "./lab/canvas/cv-diagonal/index.js";

let cvAnimationsMounted = false;

const injectCvCanvasStyles = () => {
  if (import.meta.env.PROD) {
    return;
  }

  if (document.getElementById("cv-canvas-debug-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "cv-canvas-debug-styles";
  style.textContent = `
		.cv-preview {
			position: relative;
			display: block;
			width: 100%;
			height: 520px;
			min-height: 520px;
			overflow: hidden;
		}

		.cv-canvas {
			display: block;
			width: 100%;
			height: 100%;
			min-height: 520px;
		}

		.cv-canvas-debug-wrap {
			position: relative;
			z-index: 999;
			display: grid;
			gap: 24px;
			width: 100%;
			padding: 24px;
			background: #111;
		}
	`;
  document.head.appendChild(style);
};

const ensureCvCanvas = (id) => {
  let canvas = document.getElementById(id);

  if (canvas) {
    return canvas;
  }

  let wrap = document.getElementById("cv-canvas-debug-wrap");

  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "cv-canvas-debug-wrap";
    wrap.className = "cv-canvas-debug-wrap";

    const cvSection = document.getElementById("cv");
    const target = cvSection || document.body;

    target.prepend(wrap);
  }

  const section = document.createElement("section");
  section.className = "cv-preview";

  canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.className = "cv-canvas";

  section.appendChild(canvas);
  wrap.appendChild(section);

  console.warn(`[cv canvas] created missing canvas: #${id}`);

  return canvas;
};

const mountCvCanvasAnimations = async () => {
  if (cvAnimationsMounted) {
    return;
  }

  injectCvCanvasStyles();

  const horizontalCanvas = ensureCvCanvas("cv-horizontal-container");
  const carouselCanvas = ensureCvCanvas("cv-carousel-container");
  const masonryCanvas = ensureCvCanvas("masonry-container");
  const arcCanvas = ensureCvCanvas("arc-container");
  const diagonalCanvas = ensureCvCanvas("cv-diagonal-container");

  console.log("[cv canvas final check]", {
    cv: document.getElementById("cv"),
    horizontalCanvas,
    carouselCanvas,
    masonryCanvas,
    arcCanvas,
    diagonalCanvas,
    horizontalRect: horizontalCanvas.getBoundingClientRect(),
    carouselRect: carouselCanvas.getBoundingClientRect(),
    masonryRect: masonryCanvas.getBoundingClientRect(),
    arcRect: arcCanvas.getBoundingClientRect(),
    diagonalRect: diagonalCanvas.getBoundingClientRect(),
  });

  cvAnimationsMounted = true;

  await mountCvHorizontal("cv-horizontal-container");
  await mountCvCarousel("cv-carousel-container");
  await mountMasonry("masonry-container");
  await mountArc("arc-container");
  await mountCvDiagonal("cv-diagonal-container");
};

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
requestAnimationFrame(() => {
  mountCvCanvasAnimations();
});
