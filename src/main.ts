import "./styles/site-analytics-consent.css";

import { createMediaRuntimeHealth } from "./components/media-runtime-health.ts";
import { hydrateDeferredVideoSource } from "./components/deferred-video-source.ts";
import { createMotionPreference } from "./components/motion-preference.ts";
import { createInfiniteReels } from "./components/infinite-reel.ts";
import { createMediaDecks } from "./components/media-deck.ts";
import { createMediaLightbox } from "./components/media-lightbox.ts";
import { numberMediaCaptions } from "./components/media-caption-numbering.ts";
import { createCodeBlocks } from "./components/code-block.ts";
import { createPageFlips } from "./components/page-flip.ts";
import { createBerserkAudioPlayers } from "./components/berserk-audio-player.ts";
import { mountExpertise } from "./components/expertise.ts";
import { mountExperience } from "./components/experience.ts";
import { mountSiteAnalyticsConsent } from "./components/site-analytics-consent.ts";
import {
  mountSiteAnalytics,
  mountSiteAnalyticsCaseEndTracking,
  mountSiteAnalyticsGoalTracking,
} from "./components/site-analytics.ts";
import { initBeforeAfter } from "./components/before-after.ts";
import { initSiteNavigation } from "./components/site-navigation.ts";
import { resolvePortfolioPetEnabled } from "./features/portfolio-pet/feature-flag.ts";
import { initSiteInteractive } from "./interactive.ts";
import { initMotion } from "./motion.ts";

type Destroy = () => void;

const noop: Destroy = () => {};

if (document.querySelector(".awful-cases-game")) {
  void import("./components/awful-cases-game.js");
}

if (document.querySelector("[data-animated-canvas-gallery]")) {
  void import("./components/animated-canvas-gallery.js");
}

function initViewportAutoplayVideos(root: ParentNode = document): Destroy {
  const videos = [...root.querySelectorAll<HTMLVideoElement>("video[autoplay]")].filter(
    (video) => !video.closest("[data-media-deck], [data-infinite-reel]"),
  );
  if (!videos.length) return noop;

  const nearViewport = new Set<HTMLVideoElement>();

  const syncVideo = (video: HTMLVideoElement): void => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (!document.hidden && nearViewport.has(video)) {
      hydrateDeferredVideoSource(video);
      if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
      if (video.paused) void video.play().catch(() => {});
      return;
    }

    if (!video.paused) video.pause();
  };

  const observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;
          if (entry.isIntersecting) nearViewport.add(video);
          else nearViewport.delete(video);
          syncVideo(video);
        });
      }, { rootMargin: "50% 0px", threshold: 0 })
    : null;

  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (!video.poster && !video.hasAttribute("data-autoplay-deferred")) video.preload = "auto";
    if (observer) {
      video.pause();
      observer.observe(video);
      return;
    }
    nearViewport.add(video);
    syncVideo(video);
  });

  const handleVisibilityChange = (): void => videos.forEach(syncVideo);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    observer?.disconnect();
    videos.forEach((video) => video.pause());
    nearViewport.clear();
  };
}

const siteAnalyticsConfig = {
  cloudflareToken: import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
  yandexCounterId: import.meta.env.VITE_YANDEX_METRIKA_COUNTER_ID,
};

let destroySiteAnalyticsGoalTracking: Destroy = noop;
let destroySiteAnalyticsCaseEndTracking: Destroy = noop;
let destroySiteAnalyticsConsent: Destroy = noop;
if (import.meta.env.PROD) {
  mountSiteAnalytics({
    root: document,
    target: window,
    config: siteAnalyticsConfig,
  });
  destroySiteAnalyticsGoalTracking = mountSiteAnalyticsGoalTracking({
    root: document,
    target: window,
    config: siteAnalyticsConfig,
  });
  destroySiteAnalyticsCaseEndTracking = mountSiteAnalyticsCaseEndTracking({
    root: document,
    target: window,
    config: siteAnalyticsConfig,
  });
  destroySiteAnalyticsConsent = mountSiteAnalyticsConsent({
    root: document,
    target: window,
    config: siteAnalyticsConfig,
  });
}

mountExpertise(document);
mountExperience(document);

const motion = createMotionPreference();
const destroys: Destroy[] = [
  destroySiteAnalyticsGoalTracking,
  destroySiteAnalyticsCaseEndTracking,
  destroySiteAnalyticsConsent,
];
let destroyed = false;

const portfolioPetPrototypeRequested = new URLSearchParams(window.location.search).get("pet") === "1";
const portfolioPetEnabled = resolvePortfolioPetEnabled({
  isDev: import.meta.env.DEV,
  envValue: import.meta.env.VITE_PORTFOLIO_PET_ENABLED,
  previewRequested: portfolioPetPrototypeRequested,
});

if (portfolioPetEnabled) {
  void import("./components/portfolio-pet.ts")
    .then(({ mountPortfolioPet }) => {
      if (destroyed) return;
      const portfolioPet = mountPortfolioPet({ root: document.body });
      destroys.push(() => portfolioPet.destroy());
    })
    .catch((error: unknown) => {
      console.error("Portfolio pet prototype failed to load.", error);
    });
}

numberMediaCaptions(document);
destroys.push(
  initMotion({
    root: document,
  }),
);
destroys.push(
  initSiteInteractive({
    root: document,
  }),
);
destroys.push(initSiteNavigation(document, motion));

if (document.querySelector('[data-jestei-theme-organism][data-jestei-theme-instance="inline"]')) {
  void import("./components/jestei-theme-organism/jestei-theme-organism.js")
    .then(({ createJesteiThemeOrganisms }) => {
      if (destroyed) return;

      const jesteiThemeOrganisms = createJesteiThemeOrganisms({ root: document, motion });
      if (!jesteiThemeOrganisms) return;

      destroys.push(() => jesteiThemeOrganisms.destroy());

      const canWarmJesteiThemeOrganism = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
      if (canWarmJesteiThemeOrganism) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!destroyed) void jesteiThemeOrganisms.preload?.();
        }));
      }
    })
    .catch((error: unknown) => {
      console.error("Jestei theme organism runtime failed to load.", error);
    });
}

destroys.push(createMediaLightbox({ root: document }));
destroys.push(createMediaDecks({ root: document, motion }));
destroys.push(createInfiniteReels({ root: document, motion }));
destroys.push(initViewportAutoplayVideos(document));
destroys.push(createMediaRuntimeHealth({ root: document }));
destroys.push(createCodeBlocks(document));
destroys.push(createPageFlips({ root: document, motion }));
destroys.push(createBerserkAudioPlayers(document));

document.querySelectorAll("[data-before-after]").forEach((root) => {
  destroys.push(
    initBeforeAfter(root, {
      motion,
      autoReveal: root.closest("#jestei-subscription") !== null,
    }),
  );
});

window.addEventListener("pagehide", (event) => {
  if (event.persisted) return;

  destroyed = true;
  destroys.splice(0).reverse().forEach((destroy) => destroy());
  motion.destroy();
});