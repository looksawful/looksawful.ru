import * as THREE from "three";

import { FluidSimulation } from "./fluid-simulation.js";

function createConfig() {
  const compact = window.innerWidth < 768;

  return {
    simResolution: compact ? 128 : 256,

    dyeResolution: compact ? 512 : 1024,

    curl: 25,

    pressureIterations: compact ? 28 : 50,

    velocityDissipation: 0.95,
    dyeDissipation: 0.95,
    splatRadius: 0.275,
    forceStrength: 7.5,
    pressureDecay: 0.75,
    threshold: 1,
    edgeSoftness: 0,

    inkColor: new THREE.Color(1, 1, 1),
  };
}

export function createFluidCursor({ root, canvas } = {}) {
  if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  if (canvas.dataset.fluidCursorMounted === "true") {
    return null;
  }

  canvas.dataset.fluidCursorMounted = "true";

  let simulation = null;

  try {
    simulation = new FluidSimulation(canvas, createConfig(), {
      root,
    });

    canvas.hidden = false;
  } catch (error) {
    canvas.hidden = true;

    delete canvas.dataset.fluidCursorMounted;

    console.warn("Fluid cursor is unavailable in this browser.", error);

    return null;
  }

  return function destroyFluidCursor() {
    simulation?.destroy();
    simulation = null;

    canvas.hidden = true;

    delete canvas.dataset.fluidCursorMounted;
  };
}
