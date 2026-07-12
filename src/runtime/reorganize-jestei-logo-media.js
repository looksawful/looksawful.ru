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
  }
}

function createLogoGallery(root) {
  const gallery = root.createElement("aside");
  gallery.className = "jestei-logo__gallery";
  gallery.setAttribute("aria-label", "устройство и варианты логотипа Jestei Pool");
  gallery.setAttribute("data-media-layout", "three");
  gallery.setAttribute("data-media-ratio", "landscape");
  gallery.setAttribute("data-media-cluster", "");
  gallery.setAttribute("data-jestei-logo-gallery", "");
  return gallery;
}

export function reorganizeJesteiLogoMedia(root = document) {
  const logoSection = root.querySelector("#jestei-logo");
  const typeSection = root.querySelector("#jestei-type");
  const typeGallery = typeSection?.querySelector("aside[data-media-cluster]");
  const inspector = logoSection?.querySelector("[data-logo-inspector-shell]");

  if (!logoSection || !typeSection || !typeGallery || !inspector) {
    return;
  }

  const itemByPath = new Map(
    [...typeGallery.querySelectorAll("a[href]")].map((anchor) => [
      normalizePath(anchor.getAttribute("href")),
      anchor,
    ]),
  );

  MEDIA_ITEMS.forEach(({ href, label }) => {
    const anchor =
      itemByPath.get(href) ||
      root.querySelector(`a[data-section-media-item][href="${href}"]`);
    if (anchor) {
      labelMediaItem(anchor, label);
      itemByPath.set(href, anchor);
    }
  });

  let logoGallery = logoSection.querySelector("[data-jestei-logo-gallery]");
  if (!logoGallery) {
    logoGallery = createLogoGallery(root);
    inspector.insertAdjacentElement("afterend", logoGallery);
  }

  MEDIA_ITEMS.forEach(({ href, section }) => {
    const anchor = itemByPath.get(href);
    if (!anchor) return;

    if (section === "logo") {
      logoGallery.append(anchor);
    } else {
      typeGallery.append(anchor);
    }
  });

  typeGallery.setAttribute("aria-label", "типографическая система Jestei Pool");
  typeGallery.setAttribute("data-media-layout", "single");
  typeGallery.setAttribute("data-media-ratio", "landscape");

  logoGallery.setAttribute("data-media-layout", "three");
  logoGallery.setAttribute("data-media-ratio", "landscape");
}
