import { mountArc } from "./arc/index.js";
import { mountSpiral } from "./spiral/index.js";
import { mountLetters } from "./letters/index.js";

function runCanvasStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[canvas] ${label} failed`, error);
    return null;
  }
}

export function initCanvas() {
  runCanvasStep("mountArc", () => mountArc("arc-container"));
  runCanvasStep("mountSpiral", () => mountSpiral("spiral-container"));
  runCanvasStep("mountLetters", () => {
    const lettersCanvas = document.getElementById("letters-canvas");
    if (lettersCanvas) {
      mountLetters(lettersCanvas);
    }
  });
}
