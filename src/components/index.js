import { mountawfulface } from "./awfulface/awfulface.js";
import { mountCvProjectLogos } from "./cv-project-logos/cv-project-logos.js";
import { initHeroTitleAnimation } from "./hero-title/hero-title.js";
import { initSystemMotion } from "./system-motion/system-motion.js";
import { renderCvExperience } from "../sections/cv/cv-renderer.js";

function runComponentStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[components] ${label} failed`, error);
    return null;
  }
}

function runIdle(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1400 });
    return;
  }

  window.setTimeout(callback, 0);
}

async function initLazyComponents() {
  const [{ mountCvDemoVisuals }, { initCvGroupAnimations }, { initCvInlineVideos }, { initPreloadStates }] =
    await Promise.all([
      import("./cv-task-previews/cv-task-visual-demos.js"),
      import("./cv-group-animations/cv-group-animations.js"),
      import("./cv-inline-video/cv-inline-video.js"),
      import("./preload-state/preload-state.js"),
    ]);

  runComponentStep("mountCvDemoVisuals", () => mountCvDemoVisuals(document));
  runComponentStep("initCvGroupAnimations", () => initCvGroupAnimations());
  runComponentStep("initCvInlineVideos", () => initCvInlineVideos());
  runComponentStep("initPreloadStates", () => initPreloadStates());
}

export function initComponents() {
  runComponentStep("renderCvExperience", () => renderCvExperience());
  runComponentStep("mountawfulface", () => mountawfulface("awfulface-hero"));
  runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
  runComponentStep("mountCvProjectLogos", () => mountCvProjectLogos());
  runComponentStep("initSystemMotion", () => initSystemMotion());

  runIdle(() => {
    void initLazyComponents();
  });
}
