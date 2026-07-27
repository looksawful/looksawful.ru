import { createAwfulface } from "../awfulface/awfulface.js";
import { createFluidCursorController } from "../cursor-trail/fluid-cursor-controller.js";
import { createHeroTitleMotion } from "./hero-motion.js";

const HERO_DESTROY = Symbol.for("looksawful.hero.destroy");

export function createHero({ root = document, motion } = {}) {
  if (!root || typeof root.querySelector !== "function") {
    return null;
  }

  const hero = root.querySelector("[data-hero]");

  if (!(hero instanceof HTMLElement)) {
    return null;
  }

  const previousDestroy = hero[HERO_DESTROY];

  if (typeof previousDestroy === "function") {
    previousDestroy();
  }

  const fluidCanvas = hero.querySelector("[data-fluid-cursor-canvas]");

  const awfulface = hero.querySelector("[data-awfulface]");

  const cleanups = [];

  const registerCleanup = (cleanup) => {
    if (typeof cleanup === "function") {
      cleanups.push(cleanup);
    }
  };

  try {
    if (fluidCanvas instanceof HTMLCanvasElement) {
      registerCleanup(
        createFluidCursorController({
          root: hero,
          canvas: fluidCanvas,
          motion,
        }),
      );
    }

    if (awfulface instanceof HTMLElement) {
      registerCleanup(
        createAwfulface({
          element: awfulface,
          trackingRoot: hero,
          motion,
        }),
      );
    }

    registerCleanup(
      createHeroTitleMotion({
        root: hero,
        motion,
      }),
    );
  } catch (error) {
    for (let index = cleanups.length - 1; index >= 0; index -= 1) {
      cleanups[index]();
    }

    delete hero.dataset.heroMounted;
    delete hero[HERO_DESTROY];

    throw error;
  }

  hero.dataset.heroMounted = "true";

  let destroyed = false;

  const destroyHero = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    for (let index = cleanups.length - 1; index >= 0; index -= 1) {
      cleanups[index]();
    }

    cleanups.length = 0;

    delete hero.dataset.heroMounted;

    if (hero[HERO_DESTROY] === destroyHero) {
      delete hero[HERO_DESTROY];
    }
  };

  hero[HERO_DESTROY] = destroyHero;

  return destroyHero;
}
