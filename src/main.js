let appInitialized = false;

function has(selector, root = document) {
  return Boolean(root?.querySelector?.(selector));
}

async function runInitStep(label, callback) {
  try {
    return await callback();
  } catch (error) {
    console.error("[init] " + label + " failed", error);
    return null;
  }
}

async function importSideEffects(root) {
  const imports = [
    import("./vendor/gsap-globals.js"),
  ];

  if (has('[data-media-marquee], [data-marquee], .media-marquee, .jestei-policy-marquee', root)) {
    imports.push(import("./visuals/dom/media-marquee.js"));
  }

  if (has('[data-media-slider], [data-showcase-auto-slider], [data-slider], .media-slider', root)) {
    imports.push(import("./visuals/dom/media-slider.js"));
  }

  if (has('[data-policy-book], .policy-book', root)) {
    imports.push(import("./visuals/dom/policy-book.js"));
  }

  if (has('[data-list-scroll], [data-horizontal-scroll], .project-responsibilities--mobile-scroll, .jestei-action-rail__viewport', root)) {
    imports.push(import("./visuals/dom/list-scroll.js"));
  }

  if (has('[data-proximity], [data-proximity-target], [data-proximity-root], .proximity-button, .proximity-card', root)) {
    imports.push(import("./components/proximity-components.js"));
  }

  await Promise.allSettled(imports);
}

async function initNamedModules(root) {
  const tasks = [];

  if (has('[data-playlist-filter-embed], [data-playlist-filter], .playlist-filter-embed, .playlist-filter', root)) {
    tasks.push(runInitStep("initPlaylistFilterEmbed", async () => {
      const module = await import("./visuals/dom/playlist-filter-embed.js");
      return module.initPlaylistFilterEmbed(root);
    }));
  }

  if (has("[data-random-gallery]", root)) {
    tasks.push(runInitStep("initRandomGalleries", async () => {
      const module = await import("./visuals/dom/random-gallery.js");
      return module.initRandomGalleries(root);
    }));
  }

  if (has("[data-jestei-chapter-frame], [data-case-chapter-frame], [data-jestei-action-rail]", root)) {
    tasks.push(runInitStep("initCaseChapters", async () => {
      const module = await import("./visuals/dom/case-chapters.js");
      return module.initCaseChapters(root);
    }));
  }

  if (has("[data-artifact-reader], [data-artifact-reader-open], .artifact-reader, .artifact-stage", root)) {
    tasks.push(runInitStep("initArtifactReaders", async () => {
      const module = await import("./visuals/dom/artifact-reader.js");
      return module.initArtifactReaders(root);
    }));
  }

  await Promise.allSettled(tasks);
}

async function initApp() {
  if (appInitialized) {
    return;
  }

  const main = document.getElementById("main");

  if (!(main instanceof HTMLElement)) {
    console.error("[init] main container not found");
    return;
  }

  appInitialized = true;

  await runInitStep("importSideEffects", () => importSideEffects(document));

  await runInitStep("initComponents", async () => {
    const module = await import("./components/index.js");
    return module.initComponents(document);
  });

  await initNamedModules(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
