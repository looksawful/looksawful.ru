import { observeOnceVisible } from "../shared/observer.js";
import { mountArc } from "./arc/index.js";
import { mountSpiral } from "./spiral/index.js";
import { mountLetters } from "./letters/index.js";
import { mountThreeCanvas } from "./three/index.js";

const THREE_CANVAS_TARGETS = ["#three-canvas"];

function runCanvasStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[canvas] ${label} failed`, error);
    return null;
  }
}

function mountThreeScenes() {
  const canvases = THREE_CANVAS_TARGETS.map((target) => document.querySelector(target)).filter(
    (canvas) => canvas instanceof HTMLCanvasElement,
  );

  const lazyCanvases = canvases.filter((canvas) => canvas.dataset.threeScene === "laptop");
  const eagerCanvases = canvases.filter((canvas) => !lazyCanvases.includes(canvas));

  eagerCanvases.forEach((canvas) => {
    mountThreeCanvas(canvas);
  });

  if (!lazyCanvases.length) {
    return;
  }

  observeOnceVisible(
    lazyCanvases,
    (canvas) => {
      mountThreeCanvas(canvas);
    },
    {
      rootMargin: "75% 0px",
      threshold: 0,
    },
  );
}

export function initCanvas() {
  runCanvasStep("mountThreeScenes", () => mountThreeScenes());
  runCanvasStep("mountArc", () => mountArc("arc-container"));
  runCanvasStep("mountSpiral", () => mountSpiral("spiral-container"));
  runCanvasStep("mountLetters", () => {
    const lettersCanvas = document.getElementById("letters-canvas");
    if (lettersCanvas) {
      mountLetters(lettersCanvas);
    }
  });
}
