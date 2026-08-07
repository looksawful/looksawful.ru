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
import "./components/media-slider/media-slider.css";
import "./components/before-after/before-after.css";
import "./components/app-promo/app-promo.css";
import "./components/browser-promo/browser-promo.css";
import "./components/digital-scroll-gallery/digital-scroll-gallery.css";
import "./components/awful-tools-preview/awful-tools-preview.css";
import "./components/moves-awful/moves-awful.css";
import "./components/animated-canvas-gallery/animated-canvas-gallery.css";
import "./components/animated-canvas-gallery/animated-canvas-gallery-preview.css";
import "./components/repository-link/repository-link.css";
import "./components/media-marquee/media-marquee.css";
import "./components/brief/brief.css";

/*
 * JavaScript компонентов.
 */
import "./components/playlist-filter-workflow/playlist-filter-workflow.js";
import "./components/awful-tools-preview/awful-tools-preview.js";

import { createDigitalScrollGalleries } from "./components/digital-scroll-gallery/digital-scroll-gallery.js";

import { createCvAccordion } from "./components/cv-accordion/cv-accordion.js";

import { createHero } from "./components/hero/hero.js";

import { createMediaSliders } from "./components/media-slider/media-slider.js";

import { createBeforeAfters } from "./components/before-after/before-after.js";

import { createMediaMarquees } from "./components/media-marquee/media-marquee.js";

import { createMotionPreference } from "./motion-preference.js";

import { createAnimatedCanvasGalleries } from "./components/animated-canvas-gallery/animated-canvas-gallery.js";

import { createAnimatedCanvasGalleryPreviews } from "./components/animated-canvas-gallery/animated-canvas-gallery-preview.js";

import { ANIMATED_CANVAS_GALLERY_SOURCES } from "./content/animated-canvas-gallery-sources.js";

/*
 * Общий сервис motion preference.
 */
let motionPreference = null;

/*
 * Функции уничтожения компонентов.
 */
let destroyHero = null;
let destroyMediaSliders = null;
let destroyBeforeAfters = null;
let destroyMediaMarquees = null;
let destroyDigitalScrollGalleries = null;
let destroyCvAccordion = null;
let destroyAnimatedCanvasGalleryPreviews = null;
let destroyAnimatedCanvasGalleries = null;

/*
 * Временный обработчик DOMContentLoaded.
 */
let domReadyHandler = null;

/*
 * Уничтожение выполняется
 * в обратном порядке mount.
 */
function unmount() {
  destroyAnimatedCanvasGalleries?.();
  destroyAnimatedCanvasGalleries = null;

  destroyAnimatedCanvasGalleryPreviews?.();
  destroyAnimatedCanvasGalleryPreviews = null;

  destroyCvAccordion?.();
  destroyCvAccordion = null;

  destroyDigitalScrollGalleries?.();
  destroyDigitalScrollGalleries = null;

  destroyMediaMarquees?.();
  destroyMediaMarquees = null;

  destroyBeforeAfters?.();
  destroyBeforeAfters = null;

  destroyMediaSliders?.();
  destroyMediaSliders = null;

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

  destroyMediaSliders = createMediaSliders({
    root: document,
    motion: motionPreference,
  });

  destroyBeforeAfters = createBeforeAfters({
    root: document,
    motion: motionPreference,
  });

  destroyMediaMarquees = createMediaMarquees({
    root: document,
    motion: motionPreference,
  });

  destroyDigitalScrollGalleries = createDigitalScrollGalleries({
    root: document,
  });

  destroyCvAccordion = createCvAccordion({
    root: document,
    motion: motionPreference,
  });

  destroyAnimatedCanvasGalleryPreviews = createAnimatedCanvasGalleryPreviews({
    root: document,
  });

  destroyAnimatedCanvasGalleries = createAnimatedCanvasGalleries({
    root: document,
    sources: ANIMATED_CANVAS_GALLERY_SOURCES,
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
