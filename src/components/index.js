function runComponentStep(label, callback) {
  try {
    return callback();
  } catch (error) {
    console.error("[components] " + label + " failed", error);
    return null;
  }
}

async function runComponentImportStep(label, importer, callback) {
  try {
    const module = await importer();

    return runComponentStep(label, () => callback(module));
  } catch (error) {
    console.error("[components] " + label + " failed", error);
    return null;
  }
}

function has(selector, root = document) {
  return Boolean(root?.querySelector?.(selector));
}

function pushGuardedImport(tasks, root, selector, label, importer, callback) {
  if (!has(selector, root)) {
    return;
  }

  tasks.push(runComponentImportStep(label, importer, callback));
}

function runAfterFirstPaint(callback) {
  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback);
    });
    return;
  }

  window.setTimeout(callback, 0);
}

function runWhenIdle(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }

  window.setTimeout(callback, 120);
}

async function initContentEnhancements(root = document) {
  const tasks = [];

  pushGuardedImport(
    tasks,
    root,
    ".site-header, [data-site-header]",
    "initSiteHeader",
    () => import("./site-header/site-header.js"),
    (module) => module.initSiteHeader(root),
  );

  pushGuardedImport(
    tasks,
    root,
    'a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".webp"], a[href$=".gif"], a[href$=".mp4"], [data-lightbox], .media-item[href]',
    "initLightbox",
    () => import("./lightbox.js"),
    (module) => module.initLightbox(root),
  );

  await Promise.allSettled(tasks);
}

async function initVisualEnhancements(root = document) {
  const tasks = [];

  pushGuardedImport(
    tasks,
    root,
    "[data-visual-demo], [data-animation], canvas[data-animation-scene]",
    "initShowcaseVisuals",
    () => import("./showcase-visuals/showcase-visuals.js"),
    (module) => module.initShowcaseVisuals(root),
  );

  pushGuardedImport(
    tasks,
    root,
    "video[data-inline-video], [data-inline-video], .showcase-inline-video",
    "initCvInlineVideos",
    () => import("./showcase-inline-video/showcase-inline-video.js"),
    (module) => module.initCvInlineVideos(root),
  );

  pushGuardedImport(
    tasks,
    root,
    "#showcase video",
    "initShowcaseVideoControls",
    () => import("./showcase-video-controls.js"),
    (module) => module.initShowcaseVideoControls(root),
  );

  pushGuardedImport(
    tasks,
    root,
    '[data-animation="before-after"] canvas, [data-before-after] canvas',
    "initShowcaseBeforeAfter",
    () => import("../visuals/canvas/before-after/index.js"),
    (module) => module.initShowcaseBeforeAfter(root),
  );

  await Promise.allSettled(tasks);
}

async function initDecorations(root = document) {
  const tasks = [];

  pushGuardedImport(
    tasks,
    root,
    ".hero-title, [data-hero-title], .hero-title-line, .hero__headline-wrap, #hero-title",
    "initHeroTitleAnimation",
    () => import("./hero-title/hero-title.js"),
    (module) => module.initHeroTitleAnimation(root),
  );

  if (document.getElementById("awfulface-hero")) {
    tasks.push(
      runComponentImportStep(
        "mountawfulface",
        () => import("./awfulface/awfulface.js"),
        (module) => module.mountawfulface("awfulface-hero"),
      ),
    );
  }

  pushGuardedImport(
    tasks,
    root,
    "[data-filter-fullscreen], [data-filter-fullscreen-root], .filter-fullscreen-wrapper, .filter-fullscreen-button, .playlist-filter-embed",
    "initFilterFullscreen",
    () => import("./filter-fullscreen.js"),
    (module) => module.initFilterFullscreen(root),
  );

  await Promise.allSettled(tasks);
}

export function initComponents(root = document) {
  if (
    has(
      "#showcase :is(.jestei-chapter-section, .case-section-clean, [data-jestei-chapter-title], [data-case-chapter-title]) > .jestei-chapter-hero > .jestei-chapter-hero__title",
      root,
    )
  ) {
    runComponentImportStep(
      "initHeadingAnimations",
      () => import("./heading-animations.js"),
      (module) => module.initHeadingAnimations(root),
    );
  }

  initContentEnhancements(root)
    .then(() => initVisualEnhancements(root))
    .then(() => {
      runAfterFirstPaint(() => {
        void initDecorations(root);
      });
    })
    .catch((error) => {
      console.error("[components] init failed", error);
    });

  runWhenIdle(() => {
    // reserved for non-critical components
  });
}
