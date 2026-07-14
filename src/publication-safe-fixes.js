const HERO_COPY =
  "Проектирую выразительные визуальные системы и интерфейсы. Разрабатываю айдентику и язык бренда, руковожу дизайнерами и помогаю им расти.";

const TECHNICAL_WORDS_COPY =
  /интерактивная книга оста(?:е|ё)тся внутри секции, но теперь работает как главный media-элемент bento\.?/iu;

const APPLY_DELAYS = [0, 50, 250, 1000, 3000, 6000];
const MOBILE_FILTER_QUERY = "(max-width: 48rem)";

const HOMEPAGE_HIDDEN_SECTION_IDS = new Set([
  "jestei-type",
  "jestei-interface-archive",
  "jestei-promo",
  "jestei-landings",
  "jestei-arc",
  "jestei-masonry",
  "styx-orbit-archive",
]);

const PUBLIC_SECTION_ORDER = [
  "hero",
  "jestei-cover",
  "jestei-results",
  "jestei-interface-bento",
  "jestei-words",
  "jestei-logo",
  "jestei-color",
  "jestei-audience-map",
  "jestei-tariffs",
  "jestei-filter",
  "jestei-event-nav",
  "jestei-interface",
  "jestei-graphics",
  "styx-cover",
  "styx-graphics",
  "styx-packaging",
  "styx-communications",
  "styx-print",
  "styx-photo-art",
  "styx-scanography",
  "shootings",
  "pet-projects",
  "resume",
];

const VISUAL_SYSTEM_SECTION_IDS = new Set([
  "jestei-interface-bento",
  "jestei-words",
  "jestei-color",
  "jestei-tariffs",
  "jestei-filter",
  "jestei-event-nav",
  "jestei-interface",
  "jestei-graphics",
  "styx-cover",
  "styx-graphics",
  "styx-packaging",
  "styx-communications",
  "styx-print",
  "styx-photo-art",
  "styx-scanography",
  "shootings",
  "pet-projects",
  "resume",
]);

const VISUAL_SYSTEM_EXCLUDED_SECTION_IDS = new Set(["jestei-results"]);

function setExactText(element, text) {
  if (!element || element.textContent.trim() === text) {
    return;
  }

  element.textContent = text;
}

function setStyleProperty(element, property, value, priority = "") {
  if (!element) {
    return;
  }

  if (
    element.style.getPropertyValue(property) === value &&
    element.style.getPropertyPriority(property) === priority
  ) {
    return;
  }

  element.style.setProperty(property, value, priority);
}

function hideHomepageElement(element) {
  if (!element) {
    return;
  }

  if (!element.hidden) {
    element.hidden = true;
  }

  if (element.getAttribute("aria-hidden") !== "true") {
    element.setAttribute("aria-hidden", "true");
  }

  if (!element.hasAttribute("data-homepage-hidden")) {
    element.setAttribute("data-homepage-hidden", "");
  }

  setStyleProperty(element, "display", "none", "important");
  setStyleProperty(element, "visibility", "hidden", "important");
  setStyleProperty(element, "opacity", "0", "important");
}

function showHomepageElement(element) {
  if (!element) {
    return;
  }

  if (element.hidden) {
    element.hidden = false;
  }

  element.removeAttribute("aria-hidden");
  element.removeAttribute("data-homepage-hidden");

  const isTopLevelSection = element.matches?.("#main > .section");
  setStyleProperty(
    element,
    "display",
    isTopLevelSection ? "block" : "inline-flex",
    "important",
  );
  setStyleProperty(element, "visibility", "visible", "important");
  setStyleProperty(element, "opacity", "1", "important");
}

function setNavigationLinkVisibility(root, sectionId, visible) {
  root
    .querySelectorAll?.(`a[href="#${sectionId}"]`)
    .forEach((link) => {
      if (visible) {
        showHomepageElement(link);
      } else {
        hideHomepageElement(link);
      }
    });
}

function applySectionVisibility(root = document) {
  const mobileFilterDisabled = window.matchMedia(MOBILE_FILTER_QUERY).matches;

  HOMEPAGE_HIDDEN_SECTION_IDS.forEach((sectionId) => {
    hideHomepageElement(root.getElementById?.(sectionId));
    setNavigationLinkVisibility(root, sectionId, false);
  });

  PUBLIC_SECTION_ORDER.forEach((sectionId) => {
    if (HOMEPAGE_HIDDEN_SECTION_IDS.has(sectionId)) {
      return;
    }

    if (sectionId === "jestei-filter" && mobileFilterDisabled) {
      hideHomepageElement(root.getElementById?.(sectionId));
      setNavigationLinkVisibility(root, sectionId, false);
      return;
    }

    showHomepageElement(root.getElementById?.(sectionId));
    setNavigationLinkVisibility(root, sectionId, true);
  });
}

function applyPublicSectionOrder(root = document) {
  const main = root.getElementById?.("main") || root.querySelector?.("#main");
  if (!main) {
    return;
  }

  const orderedSections = PUBLIC_SECTION_ORDER
    .map((sectionId) => root.getElementById?.(sectionId))
    .filter((section) => section?.parentElement === main);

  if (orderedSections.length < 2) {
    return;
  }

  let anchor = orderedSections[0];

  for (const section of orderedSections.slice(1)) {
    if (anchor.nextElementSibling !== section) {
      anchor.insertAdjacentElement("afterend", section);
    }

    anchor = section;
  }
}

function applyVisualSystemMarkers(root = document) {
  VISUAL_SYSTEM_EXCLUDED_SECTION_IDS.forEach((sectionId) => {
    root.getElementById?.(sectionId)?.removeAttribute("data-visual-system");
  });

  VISUAL_SYSTEM_SECTION_IDS.forEach((sectionId) => {
    const section = root.getElementById?.(sectionId);
    if (!section || section.getAttribute("data-visual-system") === "v2") {
      return;
    }

    section.setAttribute("data-visual-system", "v2");
  });
}

function applyHeroCopy(root = document) {
  setExactText(root.querySelector?.("#hero .hero__note"), HERO_COPY);
}

function applyResultsCopy(root = document) {
  const productsCard = root.querySelector?.(
    '#jestei-results [data-bento-card="products"]',
  );

  if (!productsCard) {
    return;
  }

  setExactText(
    productsCard.querySelector("h3"),
    "расширили продуктовую линейку для 4 классов диджеев",
  );
  setExactText(
    productsCard.querySelector("p"),
    "ии-треки, видео-паки, алгоритмические плейлисты и прогрессивный фильтр треков для двух аудиторий",
  );
}

function applyUsefulLabel(root = document) {
  root
    .querySelectorAll?.(
      '.site-header a[href="#pet-projects"], .site-header a[href="#pets"], .site-header a[href="#berserk-timer"]',
    )
    .forEach((link) => {
      link.setAttribute("href", "#pet-projects");
      setExactText(link, "полезное");
    });

  const section = root.getElementById?.("pet-projects");
  if (!section) {
    return;
  }

  section.setAttribute("aria-label", "полезное");
  setExactText(
    section.querySelector(".pet-projects-bento__title"),
    "полезное",
  );
}

function removeTechnicalWordsCopy(root = document) {
  root
    .querySelectorAll?.("#jestei-words p, #jestei-words li")
    .forEach((element) => {
      const value = element.textContent || "";
      if (!TECHNICAL_WORDS_COPY.test(value)) {
        return;
      }

      const corrected = value.replace(TECHNICAL_WORDS_COPY, "").trim();
      if (corrected) {
        element.textContent = corrected;
      } else {
        element.remove();
      }
    });
}

export function applyPublicationSafeFixes(root = document) {
  applyHeroCopy(root);
  applyResultsCopy(root);
  applyUsefulLabel(root);
  removeTechnicalWordsCopy(root);
  applySectionVisibility(root);
  applyPublicSectionOrder(root);
  applyVisualSystemMarkers(root);

  if (
    root.documentElement?.getAttribute("data-publication-safe-fixes") !==
    "applied-v2"
  ) {
    root.documentElement?.setAttribute(
      "data-publication-safe-fixes",
      "applied-v2",
    );
  }
}

function startPublicationSafeFixes() {
  let queued = false;

  const queueApply = () => {
    if (queued) {
      return;
    }

    queued = true;
    queueMicrotask(() => {
      queued = false;
      applyPublicationSafeFixes(document);
    });
  };

  APPLY_DELAYS.forEach((delay) => {
    window.setTimeout(queueApply, delay);
  });

  window.addEventListener("load", queueApply, { once: true });

  const mobileFilterMedia = window.matchMedia(MOBILE_FILTER_QUERY);
  mobileFilterMedia.addEventListener?.("change", queueApply);

  requestAnimationFrame(() => {
    requestAnimationFrame(queueApply);
  });

  const observer = new MutationObserver(queueApply);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "style",
      "hidden",
      "aria-hidden",
      "data-homepage-hidden",
      "data-visual-system",
    ],
  });

  window.setTimeout(() => {
    observer.disconnect();
    applyPublicationSafeFixes(document);
  }, 8000);

  queueApply();
}

startPublicationSafeFixes();
