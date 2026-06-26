let appInitialized = false;

async function runInitStep(label, callback) {
  try {
    return await callback();
  } catch (error) {
    console.error("[init] " + label + " failed", error);
    return null;
  }
}

async function importSideEffects() {
  await Promise.allSettled([
    import("./vendor/gsap-globals.js"),
    import("./visuals/dom/media-marquee.js"),
    import("./visuals/dom/media-slider.js"),
    import("./visuals/dom/policy-book.js"),
    import("./visuals/dom/list-scroll.js"),
    import("./components/proximity-components.js"),
  ]);
}

async function initNamedModules(root) {
  await runInitStep("initPlaylistFilterEmbed", async () => {
    const module = await import("./visuals/dom/playlist-filter-embed.js");
    return module.initPlaylistFilterEmbed(root);
  });

  await runInitStep("initRandomGalleries", async () => {
    const module = await import("./visuals/dom/random-gallery.js");
    return module.initRandomGalleries(root);
  });

  await runInitStep("initCaseChapters", async () => {
    const module = await import("./visuals/dom/case-chapters.js");
    return module.initCaseChapters(root);
  });

  await runInitStep("initArtifactReaders", async () => {
    const module = await import("./visuals/dom/artifact-reader.js");
    return module.initArtifactReaders(root);
  });
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

  await runInitStep("importSideEffects", importSideEffects);

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
