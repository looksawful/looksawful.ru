function runComponentStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error("[components] " + label + " failed", error);
    return null;
  }
}

async function runComponentImportStep(label, importer, callback) {
  try {
    const module = await importer();
    return runComponentStep(label, () => callback(module));
  } catch (error) {
    console.error("[components] " + label + " failed", error);
    return null;
  }
}

function runAfterFirstPaint(callback) {
  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback);
    });
    return;
  }

  window.setTimeout(callback, 0);
}

function runWhenIdle(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }

  window.setTimeout(callback, 120);
}

async function initContentEnhancements(root = document) {
  await Promise.allSettled([
    runComponentImportStep(
      "initSiteHeader",
      () => import("./site-header/site-header.js"),
      (module) => module.initSiteHeader(root),
    ),
    runComponentImportStep(
      "initLightbox",
      () => import("./lightbox.js"),
      (module) => module.initLightbox(root),
    )
  ]);
}

async function initVisualEnhancements(root = document) {
  await Promise.allSettled([
    runComponentImportStep(
      "initShowcaseVisuals",
      () => import("./showcase-visuals/showcase-visuals.js"),
      (module) => module.initShowcaseVisuals(root),
    ),
    runComponentImportStep(
      "initCvInlineVideos",
      () => import("./showcase-inline-video/showcase-inline-video.js"),
      (module) => module.initCvInlineVideos(root),
    ),
    runComponentImportStep(
      "initShowcaseBeforeAfter",
      () => import("../visuals/canvas/before-after/index.js"),
      (module) => module.initShowcaseBeforeAfter(root),
    ),
  ]);
}

async function initDecorations(root = document) {
  await Promise.allSettled([
    runComponentImportStep(
      "initHeroTitleAnimation",
      () => import("./hero-title/hero-title.js"),
      (module) => module.initHeroTitleAnimation(root),
    ),
    runComponentImportStep(
      "mountawfulface",
      () => import("./awfulface/awfulface.js"),
      (module) => module.mountawfulface("awfulface-hero"),
    ),
    runComponentImportStep(
      "initSystemMotion",
      () => import("./system-motion/system-motion.js"),
      (module) => module.initSystemMotion(root),
    ),
    runComponentImportStep(
      "initFilterFullscreen",
      () => import("./filter-fullscreen.js"),
      (module) => module.initFilterFullscreen(root),
    ),
  ]);
}

export function initComponents(root = document) {
  // Run heading+gallery reveal IMMEDIATELY (before first paint) so gsap.set()
  // hides elements before the browser renders them — avoids visible flash.
  runComponentImportStep(
    "initHeadingAnimations",
    () => import("./heading-animations.js"),
    (module) => module.initHeadingAnimations(root),
  );

  runAfterFirstPaint(() => {
    void initContentEnhancements(root)
      .then(() => initVisualEnhancements(root))
      .then(() => {
        runWhenIdle(() => {
          void initDecorations(root);
        });
      });
  });
}