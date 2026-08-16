import "@fontsource-variable/rubik/wght.css";

import "./styles/index.css";

import "./components/awfulface/awfulface.css";
import "./components/cursor-trail/cursor-trail.css";
import "./components/hero/hero.css";
import "./components/cv-sheets/cv-sheets.css";
import "./components/media-slider/media-slider.css";
import "./components/before-after/before-after.css";
import "./components/app-promo/app-promo.css";
import "./components/browser-promo/browser-promo.css";
import "./components/digital-scroll-gallery/digital-scroll-gallery.css";
import "./components/awful-tools-preview/awful-tools-preview.css";
import "./components/berserk-timer-case/berserk-timer-case.css";
import "./components/awful-cases-showcase/awful-cases-showcase.css";
import "./components/moves-awful/moves-awful.css";
import "./components/animated-canvas-gallery/animated-canvas-gallery.css";
import "./components/animated-canvas-gallery/animated-canvas-gallery-preview.css";
import "./components/repository-link/repository-link.css";
import "./components/media-marquee/media-marquee.css";
import "./components/mobile-mockup/mobile-mockup.css";
import "./components/brief/brief.css";
import "./components/jestei-theme-organism/jestei-theme-organism.css";
import "./components/jestei-theme-organism/jestei-theme-organism-embed.css";
import "./components/infinite-reel/infinite-reel.css";
import "./components/content-blocks/content-blocks.css";
import "./content/cv-presentation.css";
import "./components/sands-showcase/sands-showcase.css";
import "./components/sensetique-case/sensetique-case.css";

import "./components/playlist-filter-workflow/playlist-filter-workflow.js";
import { setAwfulToolsSceneRuntime } from "./components/awful-tools-preview/awful-tools-preview.js";
import { createBerserkTimerCases } from "./components/berserk-timer-case/berserk-timer-case.js";
import { createHero } from "./components/hero/hero.js";
import { createMediaSliders } from "./components/media-slider/media-slider.js";
import { createBeforeAfters } from "./components/before-after/before-after.js";
import { createMediaMarquees } from "./components/media-marquee/media-marquee.js";
import { createInfiniteReels } from "./components/infinite-reel/infinite-reel.js";
import { createMotionPreference } from "./motion-preference.js";
import { configureMovesAwful } from "./components/moves-awful/moves-awful.js";
import { createAnimatedCanvasGalleries } from "./components/animated-canvas-gallery/animated-canvas-gallery.js";
import { createAnimatedCanvasGalleryPreviews } from "./components/animated-canvas-gallery/animated-canvas-gallery-preview.js";
import { ANIMATED_CANVAS_GALLERY_SOURCES } from "./content/animated-canvas-gallery-sources.js";
import { createImageSkeletons } from "./content/image-skeletons.js";
import { createJesteiThemeOrganisms } from "./components/jestei-theme-organism/jestei-theme-organism.js";
import { createSensetiqueCase } from "./components/sensetique-case/sensetique-case.js";
import { createSceneLifecycle } from "./runtime/scene-lifecycle.js";

let motionPreference = null;
let sceneLifecycle = null;
let destroyHero = null;
let destroyMediaSliders = null;
let destroyBeforeAfters = null;
let destroyMediaMarquees = null;
let destroyInfiniteReels = null;
let destroyAnimatedCanvasGalleryPreviews = null;
let destroyAnimatedCanvasGalleries = null;
let destroyJesteiThemeOrganisms = null;
let destroyImageSkeletons = null;
let destroyMovesAwful = null;
let destroyBerserkTimerCases = null;
let destroySensetiqueCase = null;
let domReadyHandler = null;

function unmount() {
  setAwfulToolsSceneRuntime(null, document);
  destroyImageSkeletons?.(); destroyImageSkeletons = null;
  destroyMovesAwful?.(); destroyMovesAwful = null;
  destroyBerserkTimerCases?.(); destroyBerserkTimerCases = null;
  destroyAnimatedCanvasGalleries?.(); destroyAnimatedCanvasGalleries = null;
  destroyAnimatedCanvasGalleryPreviews?.(); destroyAnimatedCanvasGalleryPreviews = null;
  destroySensetiqueCase?.(); destroySensetiqueCase = null;
  destroyJesteiThemeOrganisms?.destroy?.(); destroyJesteiThemeOrganisms = null;
  sceneLifecycle?.destroy?.(); sceneLifecycle = null;
  destroyMediaMarquees?.(); destroyMediaMarquees = null;
  destroyInfiniteReels?.(); destroyInfiniteReels = null;
  destroyBeforeAfters?.(); destroyBeforeAfters = null;
  destroyMediaSliders?.(); destroyMediaSliders = null;
  destroyHero?.(); destroyHero = null;
  motionPreference?.destroy(); motionPreference = null;
}

function mount() {
  unmount();
  destroyImageSkeletons = createImageSkeletons({ root: document });
  motionPreference = createMotionPreference();
  sceneLifecycle = createSceneLifecycle({ root: document });
  const sceneRuntime = sceneLifecycle;

  destroyHero = createHero({ root: document, motion: motionPreference });
  destroyMediaSliders = createMediaSliders({ root: document, motion: motionPreference });
  destroyMediaMarquees = createMediaMarquees({ root: document, motion: motionPreference });
  destroyInfiniteReels = createInfiniteReels({ root: document, motion: motionPreference });

  destroySensetiqueCase = createSensetiqueCase({ root: document, motion: motionPreference, sceneRuntime });
  destroyMovesAwful = configureMovesAwful(document, { sceneRuntime });
  setAwfulToolsSceneRuntime(sceneRuntime, document);
  destroyBerserkTimerCases = createBerserkTimerCases({ root: document, sceneRuntime });
  destroyBeforeAfters = createBeforeAfters({ root: document, motion: motionPreference });
  destroyJesteiThemeOrganisms = createJesteiThemeOrganisms({ root: document, motion: motionPreference, sceneRuntime });
  destroyAnimatedCanvasGalleryPreviews = createAnimatedCanvasGalleryPreviews({ root: document });
  destroyAnimatedCanvasGalleries = createAnimatedCanvasGalleries({ root: document, sources: ANIMATED_CANVAS_GALLERY_SOURCES });

  const inlineJesteiRoot = document.querySelector('[data-jestei-theme-organism][data-jestei-theme-instance="inline"]');
  const canWarmJesteiEarly = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  if (canWarmJesteiEarly) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      void destroyJesteiThemeOrganisms?.preload?.().then(() => {
        if (inlineJesteiRoot instanceof HTMLElement) sceneRuntime.requestPrepare(inlineJesteiRoot);
      });
    }));
  }
}

function handlePageShow(event) { if (event.persisted) mount(); }

if (document.readyState === "loading") {
  domReadyHandler = () => { domReadyHandler = null; mount(); };
  document.addEventListener("DOMContentLoaded", domReadyHandler, { once: true });
} else {
  mount();
}

window.addEventListener("pagehide", unmount);
window.addEventListener("pageshow", handlePageShow);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (domReadyHandler) { document.removeEventListener("DOMContentLoaded", domReadyHandler); domReadyHandler = null; }
    window.removeEventListener("pagehide", unmount);
    window.removeEventListener("pageshow", handlePageShow);
    unmount();
  });
}
