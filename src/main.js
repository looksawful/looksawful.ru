import "@fontsource-variable/rubik/wght.css";

import "./styles/index.css";
import "./components/awfulface/awfulface.css";
import "./components/cursor-trail/cursor-trail.css";
import "./components/hero/hero.css";
import "./components/cv-accordion/cv-accordion.css";

import { createCvAccordion } from "./components/cv-accordion/cv-accordion.js";
import { createHero } from "./components/hero/hero.js";
import { createMotionPreference } from "./motion-preference.js";

let motionPreference = null;
let destroyHero = null;
let destroyCvAccordion = null;
let domReadyHandler = null;

function unmount() {
  destroyCvAccordion?.();
  destroyCvAccordion = null;

  destroyHero?.();
  destroyHero = null;

  motionPreference?.destroy();
  motionPreference = null;
}

function mount() {
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
