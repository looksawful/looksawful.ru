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
  const [{ initCvVisuals }, { initCvInlineVideos }] = await Promise.all([
    import("./cv-visuals/cv-visuals.js"),
    import("./cv-inline-video/cv-inline-video.js"),
  ]);

  runComponentStep("initCvVisuals", () => initCvVisuals(document));
  runComponentStep("initCvInlineVideos", () => initCvInlineVideos());
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
