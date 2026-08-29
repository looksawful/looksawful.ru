import { createMediaRuntimeHealth } from "./components/media-runtime-health.ts";
import { createMotionPreference } from "./components/motion-preference.ts";
import { createInfiniteReels } from "./components/infinite-reel.js";
import { createMediaDecks } from "./components/media-deck.ts";
import { createMediaLightbox } from "./components/media-lightbox.ts";
import { numberMediaCaptions } from "./components/media-caption-numbering.ts";
import { createCodeBlocks } from "./components/code-block.ts";
import { createPageFlips } from "./components/page-flip.ts";
import { createBerserkAudioPlayers } from "./components/berserk-audio-player.ts";
import { mountExpertise } from "./components/expertise.ts";
import { mountExperience } from "./components/experience.ts";
import { mountSiteAnalytics } from "./components/site-analytics.ts";
import { initSiteInteractive } from "./interactive.js";
import {
  initMotion,
} from "./motion.ts";

if (document.querySelector(".awful-cases-game")) {
  void import("./components/awful-cases-game.js");
}

if (document.querySelector("[data-animated-canvas-gallery]")) {
  void import("./components/animated-canvas-gallery.js");
}

function initBeforeAfter(root) {
  const range = root.querySelector(".before-after__range");
  if (!(range instanceof HTMLInputElement)) return () => {};
  const render = () => root.style.setProperty("--before-after-split", `${range.value}%`);
  range.addEventListener("input", render, { passive: true });
  render();
  return () => range.removeEventListener("input", render);
}

function initViewportAutoplayVideos(root = document) {
  if (!root?.querySelectorAll) return () => {};
  const videos = [...root.querySelectorAll("video[autoplay]")].filter(
    (video) => video instanceof HTMLVideoElement && !video.closest("[data-media-deck], [data-infinite-reel]"),
  );
  if (!videos.length) return () => {};
  const nearViewport = new Set();

  const syncVideo = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
    if (!document.hidden && nearViewport.has(video)) {
      if (video.paused) video.play().catch(() => {});
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
    if (!video.poster) video.preload = "auto";
    if (observer) {
      video.pause();
      observer.observe(video);
      return;
    }
    nearViewport.add(video);
    syncVideo(video);
  });

  const handleVisibilityChange = () => videos.forEach(syncVideo);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    observer?.disconnect();
    videos.forEach((video) => video.pause());
    nearViewport.clear();
  };
}

if (import.meta.env.PROD) {
  mountSiteAnalytics({
    root: document,
    target: window,
    config: {
      cloudflareToken: import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN,
      clarityProjectId: import.meta.env.VITE_CLARITY_PROJECT_ID,
    },
  });
}

mountExpertise(document);
mountExperience(document);

const motion = createMotionPreference();
const destroys = [];
let destroyed = false;

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
    .catch((error) => {
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
  destroys.push(initBeforeAfter(root));
});

window.addEventListener("pagehide", (event) => {
  if (event.persisted) {
    return;
  }

  destroyed = true;
  destroys.splice(0).reverse().forEach((destroy) => destroy?.());
  motion.destroy();
});
