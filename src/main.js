import "@fontsource-variable/rubik/wght.css";

import "./styles/index.css";

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
import "./components/jestei-theme-organism/jestei-theme-organism.css";
import "./components/jestei-theme-organism/jestei-theme-organism-embed.css";
import "./components/infinite-reel/infinite-reel.css";
import "./components/content-blocks/content-blocks.css";
import "./content/accordion-presentation.css";

import "./components/playlist-filter-workflow/playlist-filter-workflow.js";
import { setAwfulToolsAccordionRuntime } from "./components/awful-tools-preview/awful-tools-preview.js";

import { createDigitalScrollGalleries } from "./components/digital-scroll-gallery/digital-scroll-gallery.js";
import { createCvAccordion } from "./components/cv-accordion/cv-accordion.js";
import { createHero } from "./components/hero/hero.js";
import { createMediaSliders } from "./components/media-slider/media-slider.js";
import { createBeforeAfters } from "./components/before-after/before-after.js";
import { createMediaMarquees } from "./components/media-marquee/media-marquee.js";
import { createInfiniteReels } from "./components/infinite-reel/infinite-reel.js";
import { createMotionPreference } from "./motion-preference.js";
import { createAnimatedCanvasGalleries } from "./components/animated-canvas-gallery/animated-canvas-gallery.js";
import { createAnimatedCanvasGalleryPreviews } from "./components/animated-canvas-gallery/animated-canvas-gallery-preview.js";
import { ANIMATED_CANVAS_GALLERY_SOURCES } from "./content/animated-canvas-gallery-sources.js";
import { applyAccordionContent } from "./content/accordion-content.js";
import { applyAccordionPresentation } from "./content/accordion-presentation.js";
import { createJesteiThemeOrganisms } from "./components/jestei-theme-organism/jestei-theme-organism.js";

let motionPreference = null;
let destroyHero = null;
let destroyMediaSliders = null;
let destroyBeforeAfters = null;
let destroyMediaMarquees = null;
let destroyInfiniteReels = null;
let destroyDigitalScrollGalleries = null;
let cvAccordion = null;
let destroyAnimatedCanvasGalleryPreviews = null;
let destroyAnimatedCanvasGalleries = null;
let destroyJesteiThemeOrganisms = null;
let destroyAccordionPresentation = null;
let domReadyHandler = null;

function unmount() {
  setAwfulToolsAccordionRuntime(null, document);
  destroyAccordionPresentation?.();
  destroyAccordionPresentation = null;

  destroyAnimatedCanvasGalleries?.();
  destroyAnimatedCanvasGalleries = null;

  destroyAnimatedCanvasGalleryPreviews?.();
  destroyAnimatedCanvasGalleryPreviews = null;

  // Stop the shared scene runtime before destroying its direct consumers.
  cvAccordion?.destroy?.();
  cvAccordion = null;

  destroyJesteiThemeOrganisms?.destroy?.();
  destroyJesteiThemeOrganisms = null;

  destroyDigitalScrollGalleries?.();
  destroyDigitalScrollGalleries = null;

  destroyMediaMarquees?.();
  destroyMediaMarquees = null;

  destroyInfiniteReels?.();
  destroyInfiniteReels = null;

  destroyBeforeAfters?.();
  destroyBeforeAfters = null;

  destroyMediaSliders?.();
  destroyMediaSliders = null;

  destroyHero?.();
  destroyHero = null;

  motionPreference?.destroy();
  motionPreference = null;
}

function mount() {
  unmount();

  applyAccordionContent(document);
  destroyAccordionPresentation = applyAccordionPresentation(document);
  motionPreference = createMotionPreference();

  destroyHero = createHero({ root: document, motion: motionPreference });
  destroyMediaSliders = createMediaSliders({
    root: document,
    motion: motionPreference,
  });
  destroyBeforeAfters = null;
  destroyMediaMarquees = createMediaMarquees({
    root: document,
    motion: motionPreference,
  });
  destroyInfiniteReels = createInfiniteReels({
    root: document,
    motion: motionPreference,
  });
  // Mounted after the accordion so scroll-driven components subscribe directly.
  destroyDigitalScrollGalleries = null;

  cvAccordion = createCvAccordion({
    root: document,
    motion: motionPreference,
  });
  const accordionRuntime = cvAccordion?.runtime ?? null;

  setAwfulToolsAccordionRuntime(accordionRuntime, document);

  destroyBeforeAfters = createBeforeAfters({
    root: document,
    motion: motionPreference,
    accordionRuntime,
  });

  destroyDigitalScrollGalleries = createDigitalScrollGalleries({
    root: document,
    accordionRuntime,
  });

  destroyJesteiThemeOrganisms = createJesteiThemeOrganisms({
    root: document,
    motion: motionPreference,
    accordionRuntime,
  });

  destroyAnimatedCanvasGalleryPreviews =
    createAnimatedCanvasGalleryPreviews({ root: document, accordionRuntime });
  destroyAnimatedCanvasGalleries = createAnimatedCanvasGalleries({
    root: document,
    sources: ANIMATED_CANVAS_GALLERY_SOURCES,
    accordionRuntime,
  });

  // Warm Three.js and the model only after the first painted frame. Renderer
  // preparation is requested through the same scene runtime that later owns
  // Jestei activity, so there is no second lifecycle channel.
  const inlineJesteiRoot = document.querySelector(
    '[data-jestei-theme-organism][data-jestei-theme-instance="inline"]',
  );
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void destroyJesteiThemeOrganisms?.preload?.().then(() => {
        if (inlineJesteiRoot instanceof HTMLElement && accordionRuntime) {
          accordionRuntime.requestPrepare(inlineJesteiRoot);
        } else {
          destroyJesteiThemeOrganisms?.prepare?.();
        }
      });
    });
  });
}

function handlePageShow(event) {
  if (event.persisted) mount();
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
