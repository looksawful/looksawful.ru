let initialized = false;

const has = (selector, root = document) => Boolean(root?.querySelector?.(selector));

async function safe(label, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`[init] ${label} failed`, error);
    return null;
  }
}

async function initApp() {
  if (initialized) return;
  const main = document.getElementById("main");
  if (!(main instanceof HTMLElement)) return;

  initialized = true;

  await safe("gsap", () => import("./vendor/gsap-globals.js"));

  await safe("components", async () => {
    const module = await import("./components/index.js");
    return module.initComponents(document);
  });

  const tasks = [];

  if (has("[data-media-marquee], .media-marquee, .jestei-policy-marquee")) {
    tasks.push(safe("mediaMarquee", () => import("./visuals/dom/media-marquee.js")));
  }

  if (has("[data-policy-book], .policy-book")) {
    tasks.push(safe("policyBook", () => import("./visuals/dom/policy-book.js")));
  }

  if (has(".list-scroll-x, .jestei-action-rail__viewport")) {
    tasks.push(safe("listScroll", () => import("./visuals/dom/list-scroll.js")));
  }

  if (has("[data-lightbox-item], [data-lightbox-video]")) {
    tasks.push(
      safe("portfolioGallery", async () => {
        const module = await import("./visuals/dom/portfolio-gallery.js");
        return module.initPortfolioGallery(document);
      }),
    );
  }

  if (has("[data-portfolio-toc]")) {
    tasks.push(
      safe("portfolioToc", async () => {
        const module = await import("./visuals/dom/showcase-toc.js");
        return module.initShowcaseToc(document);
      }),
    );
  }

  if (has("[data-jestei-action-rail]")) {
    tasks.push(
      safe("caseChapters", async () => {
        const module = await import("./visuals/dom/case-chapters.js");
        return module.initCaseChapters(document);
      }),
    );
  }

  if (has("[data-artifact-reader], [data-artifact-reader-open], .artifact-reader, .artifact-stage")) {
    tasks.push(
      safe("artifactReader", async () => {
        const module = await import("./visuals/dom/artifact-reader.js");
        return module.initArtifactReaders(document);
      }),
    );
  }

  if (has("[data-playlist-filter-embed], [data-playlist-filter], .playlist-filter-embed, .playlist-filter")) {
    tasks.push(
      safe("playlistFilter", async () => {
        const module = await import("./visuals/dom/playlist-filter-embed.js");
        return module.initPlaylistFilterEmbed(document);
      }),
    );
  }

  if (has("[data-proximity], [data-proximity-target], [data-proximity-root], .proximity-button, .proximity-card")) {
    tasks.push(safe("proximity", () => import("./components/proximity-components.js")));
  }

  await Promise.allSettled(tasks);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  void initApp();
}
