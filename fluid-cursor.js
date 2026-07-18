import * as THREE from "three";
import { FluidSimulation } from "./FluidSimulation.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

export function createHeroFluid({ root, canvas } = {}) {
  if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  if (canvas.dataset.heroFluidMounted === "true") return null;

  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  canvas.dataset.heroFluidMounted = "true";

  let simulation = null;

  const mountSimulation = () => {
    if (reducedMotion.matches || simulation) return;

    try {
      simulation = new FluidSimulation(canvas, createConfig(), { root });
      canvas.hidden = false;
    } catch (error) {
      canvas.hidden = true;
      console.warn("Fluid cursor is unavailable in this browser.", error);
    }
  };

  const unmountSimulation = () => {
    simulation?.destroy();
    simulation = null;
  };

  const handleMotionPreference = () => {
    if (reducedMotion.matches) {
      unmountSimulation();
    } else {
      mountSimulation();
    }
  };

  reducedMotion.addEventListener("change", handleMotionPreference);
  mountSimulation();

  return function destroyHeroFluid() {
    reducedMotion.removeEventListener("change", handleMotionPreference);
    unmountSimulation();
    delete canvas.dataset.heroFluidMounted;
  };
}
