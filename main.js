import { createFluidCursorController } from "./fluid-cursor-controller.js";
import { createAwfulHeadMotion } from "./awful-head.js";
import { createHeroTitleMotion } from "./hero-motion.js";
import { createCvAccordion } from "./cv-accordion.js";

const HERO_DESTROY = Symbol.for("looksawful.hero.destroy");

export function initHero(root = document) {
  const hero = root.querySelector("[data-hero]");

  if (!(hero instanceof HTMLElement)) {
    return null;
  }

  const previousDestroy = hero[HERO_DESTROY];

  if (typeof previousDestroy === "function") {
    previousDestroy();
  }

  const fluidCanvas = hero.querySelector("[data-fluid-cursor-canvas]");
  const faceCanvas = hero.querySelector(".hero__face canvas");
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
        }),
      );
    }

    if (faceCanvas instanceof HTMLCanvasElement) {
      registerCleanup(
        createAwfulHeadMotion({
          root: hero,
          canvas: faceCanvas,
        }),
      );
    }

    registerCleanup(createHeroTitleMotion(hero));
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

let destroyHero = null;
let destroyCvAccordion = null;
let domReadyHandler = null;

function unmount() {
  destroyCvAccordion?.();
  destroyCvAccordion = null;

  destroyHero?.();
  destroyHero = null;
}

function mount() {
  unmount();
  destroyHero = initHero(document);
  destroyCvAccordion = createCvAccordion(document);
}

function handlePageShow(event) {
  if (event.persisted) {
    mount();
  }
}

if (document.readyState === "loading") {
  domReadyHandler = () => {
    domReadyHandler = null;
    mount();
  };

  document.addEventListener("DOMContentLoaded", domReadyHandler, {
    once: true,
  });
} else {
  mount();
}

window.addEventListener("pagehide", unmount);
window.addEventListener("pageshow", handlePageShow);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (domReadyHandler) {
      document.removeEventListener("DOMContentLoaded", domReadyHandler);
      domReadyHandler = null;
    }

    window.removeEventListener("pagehide", unmount);
    window.removeEventListener("pageshow", handlePageShow);
    unmount();
  });
}
