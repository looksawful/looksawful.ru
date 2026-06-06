import { mountawfulface } from "./awfulface/awfulface.js";
import { initCvGroupAnimations } from "./cv-group-animations/cv-group-animations.js";
import { initCvInlineVideos } from "./cv-inline-video/cv-inline-video.js";
import { mountCvProjectLogos } from "./cv-project-logos/cv-project-logos.js";
import { mountCvDemoVisuals } from "./cv-task-previews/cv-task-visual-demos.js";
import { initHeroTitleAnimation } from "./hero-title/hero-title.js";
import { initPreloadStates } from "./preload-state/preload-state.js";
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

export function initComponents() {
  runComponentStep("renderCvExperience", () => renderCvExperience());
  runComponentStep("mountawfulface", () => mountawfulface("awfulface-hero"));
  runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
  runComponentStep("mountCvProjectLogos", () => mountCvProjectLogos());
  runComponentStep("mountCvDemoVisuals", () => mountCvDemoVisuals(document));
  runComponentStep("initCvGroupAnimations", () => initCvGroupAnimations());
  runComponentStep("initCvInlineVideos", () => initCvInlineVideos());
  runComponentStep("initPreloadStates", () => initPreloadStates());
  runComponentStep("initSystemMotion", () => initSystemMotion());
}
