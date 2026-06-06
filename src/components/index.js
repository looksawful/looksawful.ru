import { mountawfulface } from "./awfulface/awfulface.js";
import { initCvGroupAnimations } from "./cv-group-animations/cv-group-animations.js";
import { initCvInlineVideos } from "./cv-inline-video/cv-inline-video.js";
import { mountCvProjectLogos } from "./cv-project-logos/cv-project-logos.js";
import { initCvSidebar } from "./cv-sidebar/cv-sidebar.js";
import { mountCvDemoVisuals } from "./cv-task-previews/cv-task-visual-demos.js";
import { initHeroTitleAnimation } from "./hero-title/hero-title.js";
import { initPageNavigation } from "./page-navigation/page-navigation.js";
import { initPreloadStates } from "./preload-state/preload-state.js";
import { initSystemMotion } from "./system-motion/system-motion.js";
import { renderCvExperience } from "../sections/cv/cv-renderer.js";
import { initSiteNavigationState } from "../sections/site-navigation/site-navigation.js";

function runComponentStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[components] ${label} failed`, error);
    return null;
  }
}

function mountFaces() {
  mountawfulface("awfulface-hero", { fallOnScroll: true });
}

export function initComponents() {
  runComponentStep("initPreloadStates", () => initPreloadStates());
  runComponentStep("initSiteNavigationState", () => initSiteNavigationState());
  runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
  runComponentStep("mountawfulface", () => mountFaces());
  runComponentStep("renderCvExperience", () => renderCvExperience());
  runComponentStep("mountCvProjectLogos", () => mountCvProjectLogos());
  runComponentStep("initCvGroupAnimations", () => initCvGroupAnimations());
  runComponentStep("initCvInlineVideos", () => initCvInlineVideos());
  runComponentStep("mountCvDemoVisuals", () => mountCvDemoVisuals(document));
  runComponentStep("initCvSidebar", () => initCvSidebar());
  runComponentStep("initPageNavigation", () => initPageNavigation());
  runComponentStep("initSystemMotion", () => initSystemMotion());
}
