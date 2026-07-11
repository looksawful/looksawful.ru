const APPROVED_SECTION_IDS = new Set([
  "hero",
  "jestei-cover",
  "jestei-results",
  "jestei-interface-bento",
  "jestei-color",
  "jestei-words",
  "jestei-filter",
  "jestei-event-nav",
  "jestei-promo",
  "jestei-landings",
  "jestei-tariffs",
  "styx-cover",
  "styx-work-slider",
  "pet-projects",
  "resume",
]);

function removeHeroOnlyConstraints(root = document) {
  root
    .querySelectorAll("[data-hero-only-mode], #hero-only-inline-mode")
    .forEach((node) => node.remove());

  const header = root.querySelector("body > .site-header");
  if (header) {
    header.style.setProperty("display", "block", "important");
    header.style.setProperty("visibility", "visible", "important");
    header.style.setProperty("opacity", "1", "important");
  }

  root.querySelectorAll("#main > .section").forEach((section) => {
    const isApproved = APPROVED_SECTION_IDS.has(section.id);
    section.hidden = false;
    section.style.setProperty("display", isApproved ? "block" : "none", "important");
    section.style.setProperty("visibility", isApproved ? "visible" : "hidden", "important");
    section.style.setProperty("opacity", isApproved ? "1" : "0", "important");
  });

  root
    .querySelectorAll('.site-header a[href="#shootings"], .site-header a[href="#jestei-logo"], .site-header a[href="#styx-graphics"]')
    .forEach((link) => link.style.setProperty("display", "none", "important"));
}

async function start() {
  removeHeroOnlyConstraints(document);

  try {
    const { prepareHomepagePublication } = await import("./homepage-publication.js");
    prepareHomepagePublication(document);
  } finally {
    removeHeroOnlyConstraints(document);
  }

  const { initRuntime } = await import("./runtime/init-runtime.js");
  await initRuntime(document);
  removeHeroOnlyConstraints(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void start();
  }, { once: true });
} else {
  void start();
}
