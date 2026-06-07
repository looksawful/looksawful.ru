function runComponentStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[components] ${label} failed`, error);
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

async function initContent() {
  try {
    const [{ renderCvExperience }, { mountCvProjectLogos }] = await Promise.all([
      import("../sections/cv/cv-renderer.js"),
      import("./cv-project-logos/cv-project-logos.js"),
    ]);

    runComponentStep("renderCvExperience", () => renderCvExperience());
    runComponentStep("mountCvProjectLogos", () => mountCvProjectLogos());
  } catch (error) {
    console.error("[components] initContent failed", error);
  }
}

async function initVisualEnhancements() {
  try {
    const [{ initCvVisuals }, { initCvInlineVideos }] = await Promise.all([
      import("./cv-visuals/cv-visuals.js"),
      import("./cv-inline-video/cv-inline-video.js"),
    ]);

    runComponentStep("initCvVisuals", () => initCvVisuals(document));
    runComponentStep("initCvInlineVideos", () => initCvInlineVideos());
  } catch (error) {
    console.error("[components] initVisualEnhancements failed", error);
  }
}

async function initDecorations() {
  try {
    const [{ mountawfulface }, { initHeroTitleAnimation }, { initSystemMotion }] = await Promise.all([
      import("./awfulface/awfulface.js"),
      import("./hero-title/hero-title.js"),
      import("./system-motion/system-motion.js"),
    ]);

    runComponentStep("mountawfulface", () => mountawfulface("awfulface-hero"));
    runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
    runComponentStep("initSystemMotion", () => initSystemMotion());
  } catch (error) {
    console.error("[components] initDecorations failed", error);
  }
}

export function initComponents() {
  runAfterFirstPaint(() => {
    void initContent()
      .then(() => initVisualEnhancements())
      .then(() => {
        runWhenIdle(() => {
          void initDecorations();
        });
      });
  });
}
