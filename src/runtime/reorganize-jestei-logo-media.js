const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const WORDMARK_URL = "/assets/jestei/branding/jesteipool-wordmark-druk.svg";

const LOGO_ICON_PATH =
  "M66.999 7.67546V18.4342C67.0012 20.5738 66.3574 22.6649 65.1505 24.438C63.9436 26.2111 62.229 27.5849 60.2277 28.3821C58.2265 29.1794 56.0305 29.3636 53.9227 28.911C51.9594 28.4894 50.1566 27.6045 48.7147 26.2312C48.5935 26.1158 48.5279 25.9551 48.5279 25.7884C48.5279 25.6967 48.548 25.6061 48.5868 25.5228L49.1872 24.2334L49.3662 24.221C50.1308 25.1119 51.0654 25.845 52.1167 26.3778C53.2179 26.9358 54.4234 27.2621 55.6578 27.3361C56.8921 27.4101 58.1285 27.2302 59.2894 26.8077C60.4503 26.3852 61.5107 25.7293 62.404 24.881L62.8733 24.4001C63.9815 23.1772 64.7271 21.674 65.0278 20.0568C65.3284 18.4396 65.1723 16.7715 64.5767 15.2368C63.9811 13.7022 62.9693 12.3609 61.6532 11.3613C60.337 10.3617 58.7678 9.74281 57.1192 9.57301C55.4706 9.4032 53.8067 9.68914 52.3116 10.3992C50.8166 11.1092 49.5486 12.2157 48.648 13.5962C47.7474 14.9768 47.2493 16.5775 47.2086 18.2215C47.1702 19.7781 47.3281 21.2439 48.0507 22.603C48.1309 22.7537 48.1777 22.9205 48.1777 23.0909C48.1777 23.2231 48.1504 23.3539 48.0975 23.4753L47.5154 24.8094L45.6477 29.0677C45.6091 29.1557 45.4918 29.1749 45.4268 29.1038C45.4046 29.0795 45.3923 29.0478 45.3923 29.015L45.3906 18.4342C45.3898 16.1788 46.1063 13.9807 47.4381 12.1528C48.7699 10.325 50.6491 8.9607 52.808 8.25428C54.967 7.54787 57.2956 7.53535 59.4621 8.2185C60.7936 8.63835 62.0221 9.3078 63.0851 10.1824C63.9709 10.9112 65.438 10.7237 65.8826 9.67068L66.7462 7.62504C66.7844 7.53452 66.9059 7.51666 66.9689 7.5923C66.9884 7.61569 66.999 7.6451 66.999 7.67546ZM56.1948 25.8596C60.3387 25.8596 63.698 22.4933 63.698 18.3407C63.698 14.1881 60.3387 10.8218 56.1948 10.8218C52.0509 10.8218 48.6917 14.1881 48.6917 18.3407C48.6917 22.4933 52.0509 25.8596 56.1948 25.8596ZM56.068 21.5905C57.8581 21.5905 59.3092 20.1393 59.3092 18.3492C59.3092 16.5591 57.8581 15.1079 56.068 15.1079C54.2779 15.1079 52.8267 16.5591 52.8267 18.3492C52.8267 20.1393 54.2779 21.5905 56.068 21.5905Z";

const LOGO_VARIANTS = [
  {
    id: "club",
    label: "Клубный сегмент",
    ariaLabel: "Клубный сегмент Jestei Pool",
    color: "#F18200",
  },
  {
    id: "exclusive",
    label: "Эксклюзивные продукты",
    ariaLabel: "Эксклюзивные продукты Jestei Pool",
    color: "#3D80D8",
  },
  {
    id: "special",
    label: "Специальные акции",
    ariaLabel: "Специальные акции Jestei Pool",
    color: "#B2A1EA",
  },
  {
    id: "event",
    label: "Ивент сегмент",
    ariaLabel: "Ивент сегмент Jestei Pool",
    color: "#D1E231",
  },
];

const MEDIA_ITEMS = [
  {
    href: "/assets/media/cases/jesteipool/01-logo/01/01.webp",
    label: "Шрифт, логотип и его варианты в дизайн-системе Jestei Pool",
    section: "logo",
  },
  {
    href: "/assets/media/cases/jesteipool/01-logo/02/01.webp",
    label: "Устройство и построение логотипа Jestei Pool в деталях",
    section: "logo",
  },
  {
    href: "/assets/media/cases/jesteipool/01-logo/02/02.webp",
    label: "Шрифт Druk Wide Bold, цвета и стили текста Jestei Pool",
    section: "type",
  },
  {
    href: "/assets/media/cases/jesteipool/01-logo/02/03.webp",
    label: "Текстовый логотип Jestei Pool, его структура и элементы",
    section: "logo",
  },
];

function normalizePath(value) {
  if (!value) return "";

  try {
    return new URL(value, window.location.href).pathname;
  } catch {
    return value;
  }
}

function labelMediaItem(anchor, label) {
  anchor.setAttribute("aria-label", label);
  anchor.setAttribute("data-media-caption", label);

  const image = anchor.querySelector("img");
  if (image) {
    image.alt = label;
    image.draggable = false;
  }
}

function createSvgElement(documentRef, tagName, attributes = {}) {
  const element = documentRef.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  return element;
}

function createVariantSvg(documentRef, variant) {
  const svg = createSvgElement(documentRef, "svg", {
    viewBox: "0 0 362 32",
    role: "img",
    "aria-label": variant.ariaLabel,
    preserveAspectRatio: "xMidYMid meet",
  });
  svg.classList.add("jestei-logo__variant-svg");

  const filterId = `jestei-wordmark-${variant.id}`;
  const defs = createSvgElement(documentRef, "defs");
  const filter = createSvgElement(documentRef, "filter", {
    id: filterId,
    x: "-10%",
    y: "-20%",
    width: "120%",
    height: "140%",
    "color-interpolation-filters": "sRGB",
  });
  const flood = createSvgElement(documentRef, "feFlood", {
    "flood-color": variant.color,
    result: "color",
  });
  const composite = createSvgElement(documentRef, "feComposite", {
    in: "color",
    in2: "SourceAlpha",
    operator: "in",
  });
  filter.append(flood, composite);
  defs.append(filter);

  const background = createSvgElement(documentRef, "rect", {
    width: 362,
    height: 32,
    fill: "#050505",
  });
  const icon = createSvgElement(documentRef, "path", {
    d: LOGO_ICON_PATH,
    fill: variant.color,
    "fill-rule": "evenodd",
    "clip-rule": "evenodd",
  });
  const label = createSvgElement(documentRef, "text", {
    x: 76,
    y: 20.65,
    fill: "#ffffff",
    "font-family": "Rubik, Arial, sans-serif",
    "font-size": 6.15,
    "font-weight": 400,
    "letter-spacing": 0,
  });
  label.textContent = variant.label;

  const wordmark = createSvgElement(documentRef, "image", {
    x: 168,
    y: 10.25,
    width: 157,
    height: 15.8,
    preserveAspectRatio: "xMidYMid meet",
    filter: `url(#${filterId})`,
  });
  wordmark.setAttribute("href", WORDMARK_URL);
  wordmark.setAttributeNS(XLINK_NS, "xlink:href", WORDMARK_URL);

  svg.append(defs, background, icon, label, wordmark);
  return svg;
}

function createVariantStack(documentRef) {
  const stack = documentRef.createElement("div");
  stack.className = "jestei-logo__variants";
  stack.setAttribute("aria-label", "цветовые варианты логотипа Jestei Pool");

  LOGO_VARIANTS.forEach((variant, index) => {
    const item = documentRef.createElement("div");
    item.className = "jestei-logo__variant";
    item.style.setProperty("--variant-index", String(index));
    item.append(createVariantSvg(documentRef, variant));
    stack.append(item);
  });

  return stack;
}

function createLogoSlider(documentRef) {
  const slider = documentRef.createElement("aside");
  slider.className = "jestei-logo__slider";
  slider.setAttribute("aria-label", "материалы о построении и использовании логотипа Jestei Pool");
  slider.setAttribute("aria-roledescription", "горизонтальный слайдер");
  slider.setAttribute("data-jestei-logo-slider", "");
  slider.tabIndex = 0;

  const track = documentRef.createElement("div");
  track.className = "jestei-logo__slider-track";
  slider.append(track);

  return { slider, track };
}

function collectMediaAnchors(root, typeGallery, logoSection) {
  const candidates = [
    ...typeGallery.querySelectorAll("a[href]"),
    ...logoSection.querySelectorAll("[data-jestei-logo-gallery] a[href]"),
  ];

  return new Map(
    candidates.map((anchor) => [normalizePath(anchor.getAttribute("href")), anchor]),
  );
}

function mountReveal(composition) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    composition.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      composition.classList.add("is-visible");
      observer.disconnect();
    },
    {
      rootMargin: "0px 0px -12%",
      threshold: 0.08,
    },
  );

  observer.observe(composition);
}

export function reorganizeJesteiLogoMedia(root = document) {
  const documentRef = root.ownerDocument || root;
  const logoSection = root.querySelector("#jestei-logo");
  const typeSection = root.querySelector("#jestei-type");
  const typeGallery = typeSection?.querySelector("aside[data-media-cluster]");
  const currentHead = logoSection?.querySelector("[data-chapter-head]");
  const inspector = logoSection?.querySelector("[data-logo-inspector-shell]");
  const title = currentHead?.querySelector("[data-section-title]");
  const lead = currentHead?.querySelector("[data-section-lead]");

  if (
    !logoSection ||
    !typeSection ||
    !typeGallery ||
    !currentHead ||
    !inspector ||
    !title ||
    !lead
  ) {
    return;
  }

  if (logoSection.querySelector("[data-jestei-logo-composition]")) {
    return;
  }

  const itemByPath = collectMediaAnchors(root, typeGallery, logoSection);

  MEDIA_ITEMS.forEach(({ href, label }) => {
    const anchor =
      itemByPath.get(href) ||
      root.querySelector(`a[data-section-media-item][href="${href}"]`);
    if (anchor) {
      labelMediaItem(anchor, label);
      itemByPath.set(href, anchor);
    }
  });

  const composition = documentRef.createElement("div");
  composition.className = "jestei-logo__composition";
  composition.setAttribute("data-jestei-logo-composition", "");

  const top = documentRef.createElement("div");
  top.className = "jestei-logo__top";
  const variants = createVariantStack(documentRef);
  top.append(title, variants, lead);

  const { slider, track } = createLogoSlider(documentRef);

  MEDIA_ITEMS.forEach(({ href, section }) => {
    const anchor = itemByPath.get(href);
    if (!anchor) return;

    if (section === "logo") {
      anchor.classList.add("jestei-logo__slide");
      track.append(anchor);
    } else {
      typeGallery.append(anchor);
    }
  });

  typeGallery.setAttribute("aria-label", "типографическая система Jestei Pool");
  typeGallery.setAttribute("data-media-layout", "single");
  typeGallery.setAttribute("data-media-ratio", "landscape");

  logoSection.querySelector("[data-jestei-logo-gallery]")?.remove();
  composition.append(top, inspector, slider);
  currentHead.replaceWith(composition);
  mountReveal(composition);
}
