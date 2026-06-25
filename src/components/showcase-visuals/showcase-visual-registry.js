export const ANIMATION_MOUNTERS = {
  "landing-arc": () => import("../../visuals/canvas/landing-motion/arc/index.js").then((module) => module.mountArc),
  "landing-masonry": () =>
    import("../../visuals/canvas/landing-motion/masonry/index.js").then((module) => module.mountMasonry),
  diagonal: () =>
    import("../../visuals/canvas/showcase-diagonal/index.js").then((module) => module.mountShowcaseDiagonal),
  horizontal: () =>
    import("../../visuals/canvas/showcase-horizontal/index.js").then((module) => module.mountShowcaseHorizontal),
  "before-after": () =>
    import("../../visuals/canvas/before-after/index.js").then((module) => module.mountShowcaseBeforeAfter),
};

export const THREE_DEMO_MOUNTERS = {
  logo: () => import("../showcase-task-previews/jestei-logo-three.js").then((module) => module.mountJesteiLogoThree),
};

export const LOGO_INSPECTOR_MODEL_URL = new URL("../../assets/jestei/models/logo.glb", import.meta.url).href;

export const loadAnimationMount = (type) => ANIMATION_MOUNTERS[type]?.();

export const loadThreeDemoMount = (scene) => THREE_DEMO_MOUNTERS[scene]?.();
