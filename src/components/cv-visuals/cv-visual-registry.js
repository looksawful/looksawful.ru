export const ANIMATION_MOUNTERS = {
  arc: () => import("../../lab/canvas/arc/index.js").then((module) => module.mountArc),
  carousel: () => import("../../lab/canvas/cv-carousel/index.js").then((module) => module.mountCvCarousel),
  diagonal: () => import("../../lab/canvas/cv-diagonal/index.js").then((module) => module.mountCvDiagonal),
  horizontal: () => import("../../lab/canvas/cv-horizontal/index.js").then((module) => module.mountCvHorizontal),
  masonry: () => import("../../lab/canvas/masonry/index.js").then((module) => module.mountMasonry),
  spiral: () => import("../../lab/canvas/spiral/index.js").then((module) => module.mountSpiral),
};

export const THREE_DEMO_MOUNTERS = {
  logo: () => import("../cv-task-previews/jestei-logo-three.js").then((module) => module.mountJesteiLogoThree),
};

export const CANVAS_DEMO_MOUNTERS = {
  arc: () => import("../../lab/canvas/arc/index.js").then((module) => module.mountArc),
  masonry: () => import("../../lab/canvas/masonry/index.js").then((module) => module.mountMasonry),
  spiral: () => import("../../lab/canvas/spiral/index.js").then((module) => module.mountSpiral),
};

export const LOGO_INSPECTOR_MODEL_URL = new URL(
  "../../lab/assets/projects/jestei/logo/logo-inspector.glb",
  import.meta.url,
).href;

export const loadAnimationMount = (type) => ANIMATION_MOUNTERS[type]?.();

export const loadThreeDemoMount = (scene) => THREE_DEMO_MOUNTERS[scene]?.();

export const loadCanvasDemoMount = (demo) => CANVAS_DEMO_MOUNTERS[demo]?.();
