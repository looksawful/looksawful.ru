function runComponentStep(label, callback) {
  try {
    return callback();
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

async function initContentEnhancements() {
  try {
  } catch (error) {
    console.error("[components] initContentEnhancements failed", error);
  }
}

async function initVisualEnhancements() {
  try {
    const [{ initShowcaseVisuals }, { initCvInlineVideos }] = await Promise.all([
      import("./showcase-visuals/showcase-visuals.js"),
      import("./showcase-inline-video/showcase-inline-video.js"),
    ]);

    runComponentStep("initShowcaseVisuals", () => initShowcaseVisuals(document));
    runComponentStep("initCvInlineVideos", () => initCvInlineVideos());
    const { initShowcasePhotoLoop } = await import("../visuals/canvas/photo-loop/index.js");
    runComponentStep("initShowcasePhotoLoop", () => initShowcasePhotoLoop(document));
    const { initShowcaseDiagonalLoop } = await import("../visuals/canvas/diagonal-loop/index.js");
    runComponentStep("initShowcaseDiagonalLoop", () => initShowcaseDiagonalLoop(document));
} catch (error) {
    console.error("[components] base visual enhancements failed", error);
  }

  try {
    const { initShowcaseBeforeAfter } = await import("../visuals/canvas/before-after/index.js");
    runComponentStep("initShowcaseBeforeAfter", () => initShowcaseBeforeAfter(document));
  } catch (error) {
    console.error("[components] initShowcaseBeforeAfter import failed", error);
  }

  try {
} catch (error) {
    console.error("[components] initShowcasePhotoLoop import failed", error);
  }
}

async function initDecorations() {
  try {
    const [{ mountawfulface }, { initHeroTitleAnimation }, { initSystemMotion }] = await Promise.all([
      import("./awfulface/awfulface.js"),
      import("./hero-title/hero-title.js"),
      import("./system-motion/system-motion.js"),
    ]);

    runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
    runComponentStep("mountawfulface", () => mountawfulface("awfulface-hero"));
    runComponentStep("initSystemMotion", () => initSystemMotion());
  } catch (error) {
    console.error("[components] initDecorations failed", error);
  }
}

export function initComponents() {
  runAfterFirstPaint(() => {
    void initContentEnhancements()
      .then(() => initVisualEnhancements())
      .then(() => {
        runWhenIdle(() => {
          void initDecorations();
        });
      });
  });
}



