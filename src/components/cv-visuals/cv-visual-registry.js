export const ANIMATION_MOUNTERS = {
  "landing-arc": () => import("../../visuals/canvas/landing-motion/arc/index.js").then((module) => module.mountArc),
  "landing-masonry": () => import("../../visuals/canvas/landing-motion/masonry/index.js").then((module) => module.mountMasonry),
  "landing-spiral": () => import("../../visuals/canvas/landing-motion/spiral/index.js").then((module) => module.mountSpiral),
"landing-masonry": () => import("../../visuals/canvas/landing-motion/masonry/index.js").then((module) => module.mountMasonry),
arc: () => import("../../visuals/canvas/arc/index.js").then((module) => module.mountArc),
  carousel: () => import("../../visuals/canvas/cv-carousel/index.js").then((module) => module.mountCvCarousel),
  diagonal: () => import("../../visuals/canvas/cv-diagonal/index.js").then((module) => module.mountCvDiagonal),
  horizontal: () => import("../../visuals/canvas/cv-horizontal/index.js").then((module) => module.mountCvHorizontal),
  masonry: () => import("../../visuals/canvas/masonry/index.js").then((module) => module.mountMasonry),
  spiral: () => import("../../visuals/canvas/spiral/index.js").then((module) => module.mountSpiral),
};

export const THREE_DEMO_MOUNTERS = {
  logo: () => import("../cv-task-previews/jestei-logo-three.js").then((module) => module.mountJesteiLogoThree),
};

export const CANVAS_DEMO_MOUNTERS = {
  arc: () => import("../../visuals/canvas/arc/index.js").then((module) => module.mountArc),
  masonry: () => import("../../visuals/canvas/masonry/index.js").then((module) => module.mountMasonry),
  spiral: () => import("../../visuals/canvas/spiral/index.js").then((module) => module.mountSpiral),
};

export const LOGO_INSPECTOR_MODEL_URL = new URL(
  "../../visuals/assets/projects/jestei/logo/logo.glb",
  import.meta.url,
).href;

export const loadAnimationMount = (type) => ANIMATION_MOUNTERS[type]?.();

export const loadThreeDemoMount = (scene) => THREE_DEMO_MOUNTERS[scene]?.();

export const loadCanvasDemoMount = (demo) => CANVAS_DEMO_MOUNTERS[demo]?.();



