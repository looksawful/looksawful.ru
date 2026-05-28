import { mountAwfulHead } from "./awfulhead/awfulhead.js";
import { initCvTaskPreviews } from "./cv-task-previews/cv-task-previews.js";

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
  runComponentStep("mountAwfulHead", () => mountFaces());
  runComponentStep("initCvTaskPreviews", () => initCvTaskPreviews());
}
