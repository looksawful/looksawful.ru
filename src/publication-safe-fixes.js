const HERO_COPY =
  "Проектирую выразительные визуальные системы и интерфейсы. Разрабатываю айдентику и язык бренда, руковожу дизайнерами и помогаю им расти.";

const TECHNICAL_WORDS_COPY =
  /интерактивная книга оста(?:е|ё)тся внутри секции, но теперь работает как главный media-элемент bento\.?/iu;

const APPLY_DELAYS = [0, 50, 250, 1000, 3000, 6000];

function setExactText(element, text) {
  if (!element || element.textContent.trim() === text) {
    return;
  }

  element.textContent = text;
}

function restoreShootings(root = document) {
  const section = root.getElementById?.("shootings");

  if (section) {
    if (section.hidden) {
      section.hidden = false;
    }

    section.removeAttribute("aria-hidden");
    section.removeAttribute("data-homepage-hidden");

    if (section.style.getPropertyValue("display") !== "block") {
      section.style.setProperty("display", "block", "important");
    }

    if (section.style.getPropertyValue("visibility") !== "visible") {
      section.style.setProperty("visibility", "visible", "important");
    }

    if (section.style.getPropertyValue("opacity") !== "1") {
      section.style.setProperty("opacity", "1", "important");
    }
  }

  root
    .querySelectorAll?.('.site-header a[href="#shootings"]')
    .forEach((link) => {
      link.hidden = false;
      link.removeAttribute("aria-hidden");
      link.style.removeProperty("display");
      link.style.removeProperty("visibility");
      link.style.removeProperty("opacity");
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
  restoreShootings(root);
  root.documentElement?.setAttribute("data-publication-safe-fixes", "applied");
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
    ],
  });

  window.setTimeout(() => {
    observer.disconnect();
    applyPublicationSafeFixes(document);
  }, 8000);

  queueApply();
}

startPublicationSafeFixes();
