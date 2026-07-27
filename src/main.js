import "@fontsource-variable/rubik/wght.css";

/*
 * Общие стили проекта.
 */
import "./styles/index.css";

/*
 * Стили компонентов.
 */
import "./components/awfulface/awfulface.css";
import "./components/cursor-trail/cursor-trail.css";
import "./components/hero/hero.css";
import "./components/cv-accordion/cv-accordion.css";
import "./components/classics/classics.css";
import "./components/lattice/lattice.css";

/*
 * JavaScript компонентов.
 */
import { createCvAccordion } from "./components/cv-accordion/cv-accordion.js";

import { createHero } from "./components/hero/hero.js";

import { createLattice } from "./components/lattice/lattice.js";

import { createMotionPreference } from "./motion-preference.js";

/*
 * Общий сервис motion preference.
 */
let motionPreference = null;

/*
 * Функции уничтожения компонентов.
 */
let destroyHero = null;
let destroyCvAccordion = null;
let destroyLattice = null;

/*
 * Временный обработчик DOMContentLoaded.
 */
let domReadyHandler = null;

/*
 * Уничтожение выполняется
 * в обратном порядке mount.
 */
function unmount() {
  destroyLattice?.();
  destroyLattice = null;

  destroyCvAccordion?.();
  destroyCvAccordion = null;

  destroyHero?.();
  destroyHero = null;

  motionPreference?.destroy();
  motionPreference = null;
}

/*
 * Полная инициализация страницы.
 */
function mount() {
  /*
   * Защита от повторного mount.
   */
  unmount();

  motionPreference = createMotionPreference();

  destroyHero = createHero({
    root: document,
    motion: motionPreference,
  });

  destroyCvAccordion = createCvAccordion({
    root: document,
    motion: motionPreference,
  });

  destroyLattice = createLattice({
    root: document,
    motion: motionPreference,
  });
}

/*
 * Возврат страницы из back-forward cache.
 */
function handlePageShow(event) {
  if (event.persisted) {
    mount();
  }
}

/*
 * Первый запуск.
 */
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

/*
 * Очистка при уходе со страницы.
 */
window.addEventListener("pagehide", unmount);

window.addEventListener("pageshow", handlePageShow);

/*
 * Очистка при Vite HMR.
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
