import { mountawfulface } from "./awfulface/awfulface.js";
import { initCvGroupAnimations } from "./cv-group-animations/cv-group-animations.js";
import { initCvTaskPreviews } from "./cv-task-previews/cv-task-previews.js";
import { initHeroTitleAnimation } from "./hero-title/hero-title.js";
import { initPageNavigation } from "./page-navigation/page-navigation.js";
import { initPreloadStates } from "./preload-state/preload-state.js";
import { renderCvExperience } from "../sections/cv/cv-renderer.js";

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
  runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
  runComponentStep("mountawfulface", () => mountFaces());
  runComponentStep("renderCvExperience", () => renderCvExperience());
  runComponentStep("initCvGroupAnimations", () => initCvGroupAnimations());
  runComponentStep("initCvTaskPreviews", () => initCvTaskPreviews());
  runComponentStep("initPageNavigation", () => initPageNavigation());
}
