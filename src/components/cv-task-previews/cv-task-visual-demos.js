const THREE_MOUNTERS = {
  logo: () => import("./jestei-logo-three.js").then((module) => module.mountJesteiLogoThree),
};

const CANVAS_MOUNTERS = {
  arc: () => import("../../lab/canvas/arc/index.js").then((module) => module.mountArc),
  masonry: () => import("../../lab/canvas/masonry/index.js").then((module) => module.mountMasonry),
  spiral: () => import("../../lab/canvas/spiral/index.js").then((module) => module.mountSpiral),
};

const LOGO_INSPECTOR_MODEL_URL = "/src/lab/assets/projects/jestei/logo/logo-inspector.glb";

function normalizeDispose(dispose) {
  if (typeof dispose === "function") {
    return dispose;
  }

  if (typeof dispose?.dispose === "function") {
    return () => dispose.dispose();
  }

  return () => {};
}

async function mountThreeDemo(canvas) {
  const sceneName = canvas.dataset.cvVisualDemo?.split(":")[1];
  const loadMount = THREE_MOUNTERS[sceneName];

  if (!loadMount) {
    return () => {};
  }

  canvas.dataset.threeScene = sceneName;

  const mount = await loadMount();
  const dispose = mount(canvas);

  return normalizeDispose(dispose);
}

async function mountCanvasDemo(canvas) {
  const demoName = canvas.dataset.cvVisualDemo?.split(":")[1];
  const loadMount = CANVAS_MOUNTERS[demoName];

  if (!loadMount) {
    return () => {};
  }

  const mount = await loadMount();
  const dispose = await mount(canvas.id);

  return normalizeDispose(dispose);
}

async function mountLogoInspector(target) {
  const { createLogoInspector3D } = await import("./logo-inspector-3d.js");
  const controller = createLogoInspector3D(target, {
    modelUrl: LOGO_INSPECTOR_MODEL_URL,
    minHeight: target.dataset.cvMinHeight ? Number(target.dataset.cvMinHeight) : 560,
    initialVariantId: target.dataset.cvVariant || "brand-orange",
    autoSpin: target.dataset.cvAutoSpin !== "false",
  });

  return normalizeDispose(controller);
}

async function mountNewsletterCanvas(target) {
  const { createNewsletterCanvas } = await import("./newsletter-canvas.js");
  const sources = JSON.parse(target.dataset.cvNewsletterSources || "[]");
  const controller = createNewsletterCanvas(target, {
    src: sources,
    alt: target.dataset.cvAlt || "Newsletter canvas",
    minHeight: target.dataset.cvMinHeight ? Number(target.dataset.cvMinHeight) : 560,
  });

  return normalizeDispose(controller);
}

async function mountVisualDemo(target) {
  const [type] = target.dataset.cvVisualDemo?.split(":") ?? [];

  if (type === "three" && target instanceof HTMLCanvasElement) {
    return mountThreeDemo(target);
  }

  if (type === "canvas" && target instanceof HTMLCanvasElement) {
    return mountCanvasDemo(target);
  }

  if (type === "logo-inspector" && target instanceof HTMLElement) {
    return mountLogoInspector(target);
  }

  if (type === "newsletter-canvas" && target instanceof HTMLElement) {
    return mountNewsletterCanvas(target);
  }

  return () => {};
}

export async function mountCvDemoVisuals(root) {
  const targets = [...root.querySelectorAll("[data-cv-visual-demo]")];
  const disposers = await Promise.all(targets.map(mountVisualDemo));

  return () => {
    disposers.forEach((dispose) => dispose());
  };
}
