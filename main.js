import { createAwfulheadMotion, createHeroTitleMotion } from "./motions.js";

import { createHeroFluid } from "./fluid-cursor.js";

const HERO_DESTROY = Symbol.for("looksawful.hero.destroy");

function initHero(root = document) {
  const hero = root.querySelector("[data-hero]");

  if (!(hero instanceof HTMLElement)) {
    return null;
  }

  /*
   * Удаляем прежний экземпляр,
   * даже если этот модуль был
   * загружен повторно.
   */
  const previousDestroy = hero[HERO_DESTROY];

  if (typeof previousDestroy === "function") {
    previousDestroy();
  }

  const title = hero.querySelector("[data-hero-title]");

  const awfulheadCanvas = hero.querySelector("[data-awfulhead]");

  const fluidCanvas = hero.querySelector("[data-hero-fluid]");

  const cleanups = [];

  const registerCleanup = (cleanup) => {
    if (typeof cleanup === "function") {
      cleanups.push(cleanup);
    }
  };

  try {
    registerCleanup(
      createHeroTitleMotion({
        title,
      }),
    );

    registerCleanup(
      createAwfulheadMotion({
        root: hero,
        canvas: awfulheadCanvas,
      }),
    );

    registerCleanup(
      createHeroFluid({
        root: hero,
        canvas: fluidCanvas,
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

    /*
     * Удаляем в обратном порядке:
     * fluid → face → title.
     */
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
let domReadyHandler = null;

function unmount() {
  destroyHero?.();
  destroyHero = null;
}

function mount() {
  /*
   * Защита от повторного вызова
   * mount в одном модуле.
   */
  unmount();

  destroyHero = initHero(document);
}

function handlePageShow(event) {
  /*
   * После возврата страницы из
   * back-forward cache WebGL нужно
   * создать заново.
   */
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

/*
 * Vite вызывает этот блок перед
 * заменой модуля при HMR.
 */
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
