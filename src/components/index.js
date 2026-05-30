import { mountAwfulHead } from "./awfulhead/awfulhead.js";
import { initCvTaskPreviews } from "./cv-task-previews/cv-task-previews.js";
import { initHeroTitleAnimation } from "./hero-title/hero-title.js";
import { initPageNavigation } from "./page-navigation/page-navigation.js";
import { initPreloadStates } from "./preload-state/preload-state.js";

function runComponentStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error(`[components] ${label} failed`, error);
    return null;
  }
}

function mountFaces() {
  mountAwfulHead("awfulhead-hero", { fallOnScroll: true });
}

export function initComponents() {
  runComponentStep("initPreloadStates", () => initPreloadStates());
  runComponentStep("initHeroTitleAnimation", () => initHeroTitleAnimation());
  runComponentStep("mountAwfulHead", () => mountFaces());
  runComponentStep("initCvTaskPreviews", () => initCvTaskPreviews());
  runComponentStep("initPageNavigation", () => initPageNavigation());
}
