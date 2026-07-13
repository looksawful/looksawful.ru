const INTERFACE_CANVAS_ID = "archive-jestei-interface-masonry";
const PRODUCT_CANVAS_ID = "archive-jestei-product-horizontal";
const INTERFACE_SECTION_ID = "jestei-interface-archive";
const PRODUCT_SECTION_ID = "jestei-product-archive";
const JESTEI_COVER_ID = "jestei-cover";
const PRODUCT_MASONRY_SCENE = "jesteiProductDesignMasonry";

const REMOVED_SECTION_TITLE = "улучшили интерфейс";
const REMOVED_COPY = [
  "Жанры, метки, bpm, тональность, рейтинг, тип трека, часть ночи и исключения собраны в рабочий инструмент для быстрого поиска музыки.",
  "Главные плейлисты вынесены выше, редкие подборки остались в папках и коллекциях. Папки, коллекции, плейлисты и подборки получили разные роли и визуальные формы.",
];
const REMOVED_SCANOGRAPHY_COPY =
  "Вместе со съёмками и предметными сетапами я экспериментировал со сканографией для создания портретов моделей, предметных композиций и экспрессивных искажённых кадров. Эти изображения стали частью визуальной системы бренда, использовались в соцсетях, промо-материалах и кампаниях.";

const noop = () => {};
const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();

const removeDeprecatedShowcaseContent = (root = document) => {
  const removedTitle = normalizeText(REMOVED_SECTION_TITLE);
  const removedCopy = REMOVED_COPY.map(normalizeText);
  const removedScanographyCopy = normalizeText(REMOVED_SCANOGRAPHY_COPY);

  root.querySelectorAll("section").forEach((section) => {
    const title = section.querySelector("h1, h2, h3, [data-section-title]");
    if (normalizeText(title?.textContent) === removedTitle) {
      section.remove();
    }
  });

  root.querySelectorAll("p").forEach((paragraph) => {
    const text = normalizeText(paragraph.textContent);

    if (text === removedScanographyCopy) {
      paragraph.remove();
      return;
    }

    if (!removedCopy.includes(text)) {
      return;
    }

    const card = paragraph.closest("article, [data-card], .card, .section-card");
    if (card) {
      card.remove();
      return;
    }

    paragraph.remove();
  });
};

const setVisible = (element) => {
  if (!element) return;

  element.hidden = false;
  element.removeAttribute("hidden");
  element.removeAttribute("aria-hidden");
  element.removeAttribute("data-homepage-hidden");
  element.style.setProperty("display", "block", "important");
  element.style.setProperty("visibility", "visible", "important");
  element.style.setProperty("opacity", "1", "important");
};

const prepareSurface = (surface, modifier) => {
  if (!surface) return;

  const preserveDepthActive =
    modifier === "interface" && surface.classList.contains("is-scroll-depth-active");

  surface.className = `jestei-archive-media__surface jestei-archive-media__surface--${modifier}`;
  surface.classList.toggle("is-scroll-depth-active", preserveDepthActive);
  surface.toggleAttribute("data-scroll-depth", modifier === "interface");
  surface.removeAttribute("aria-hidden");
  setVisible(surface);

  const canvas = surface.querySelector("canvas");
  canvas?.classList.add("jestei-archive-media__canvas");

  if (canvas) {
    canvas.dataset.scrollDepth = modifier === "interface" ? "true" : "false";
  }

  setVisible(canvas);
};

const resolveCanvas = (canvasOrId, root = document) => {
  if (canvasOrId instanceof HTMLCanvasElement) return canvasOrId;
  if (typeof canvasOrId === "string") return root.getElementById(canvasOrId);
  return null;
};

const prepareProductMasonry = (surface, canvas) => {
  if (!surface || !canvas) return;

  surface.dataset.animationScene = PRODUCT_MASONRY_SCENE;
  surface.dataset.masonryScene = PRODUCT_MASONRY_SCENE;
  canvas.dataset.animationScene = PRODUCT_MASONRY_SCENE;
  canvas.dataset.masonryScene = PRODUCT_MASONRY_SCENE;
  setVisible(surface);
  setVisible(canvas);
};

const disposeMount = (mount) => {
  if (typeof mount === "function") {
    mount();
    return;
  }

  mount?.dispose?.();
};

const combineMounts = (...mounts) => {
  let disposed = false;

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    mounts.forEach(disposeMount);
  };

  dispose.dispose = dispose;
  return dispose;
};

export const placeJesteiArchiveCanvases = (root = document) => {
  removeDeprecatedShowcaseContent(root);

  const cover = root.querySelector(`#${JESTEI_COVER_ID}`);
  const results = root.querySelector("#jestei-results");
  const graphics = root.querySelector("#jestei-graphics");
  const archive = root.querySelector(`#${INTERFACE_SECTION_ID}`);
  const interfaceCanvas = root.querySelector(`#${INTERFACE_CANVAS_ID}`);
  const productCanvas = root.querySelector(`#${PRODUCT_CANVAS_ID}`);
  const interfaceSurface = interfaceCanvas?.closest("[data-animation]");
  const productSurface = productCanvas?.closest("[data-animation]");

  if (!results || !graphics || !archive || !interfaceSurface || !productSurface) {
    return;
  }

  prepareSurface(interfaceSurface, "interface");
  prepareSurface(productSurface, "product");
  prepareProductMasonry(productSurface, productCanvas);

  archive.className = "section jestei-archive-media jestei-archive-media--interface";
  archive.setAttribute("aria-label", "обзор ux ui решений jestei pool");
  archive.removeAttribute("data-section-component");
  archive.removeAttribute("data-section-chapter");
  archive.removeAttribute("data-restored-preview");
  archive.removeAttribute("data-chapter-title");
  archive.replaceChildren(interfaceSurface);
  setVisible(archive);

  if (cover) {
    cover.insertAdjacentElement("afterend", archive);
  } else {
    results.insertAdjacentElement("beforebegin", archive);
  }

  let productSection = root.querySelector(`#${PRODUCT_SECTION_ID}`);
  if (!productSection) {
    productSection = root.createElement("section");
    productSection.id = PRODUCT_SECTION_ID;
    productSection.setAttribute("data-section-family", "jestei");
  }

  productSection.className = "jestei-archive-media jestei-archive-media--product";
  productSection.setAttribute("aria-label", "обложки, посты и графический дизайн jestei pool");
  productSection.replaceChildren(productSurface);
  setVisible(productSection);
  graphics.insertAdjacentElement("beforebegin", productSection);
};

const schedulePlacement = () => {
  removeDeprecatedShowcaseContent(document);
  placeJesteiArchiveCanvases(document);
  queueMicrotask?.(() => placeJesteiArchiveCanvases(document));
  requestAnimationFrame?.(() => placeJesteiArchiveCanvases(document));
  setTimeout(() => placeJesteiArchiveCanvases(document), 0);
};

export const mountJesteiArchiveMasonry = async (...args) => {
  schedulePlacement();

  const canvas = resolveCanvas(args[0]);
  const surface = canvas?.closest?.("[data-animation]");
  prepareSurface(surface, "interface");

  const { mountMasonry } = await import("../../visuals/canvas/landing-motion/masonry/index.js");
  const masonryMount = await mountMasonry(...args);
  schedulePlacement();

  let depthMount = noop;

  try {
    const { mountJesteiScrollDepth } = await import("./jestei-scroll-depth.js");
    depthMount = mountJesteiScrollDepth(canvas);
  } catch (error) {
    console.error("[jestei-scroll-depth] failed to mount", error);
  }

  return combineMounts(depthMount, masonryMount);
};

export const mountJesteiArchiveHorizontal = async (...args) => {
  schedulePlacement();

  const canvas = resolveCanvas(args[0]);
  const surface = canvas?.closest?.("[data-animation]");
  prepareSurface(surface, "product");
  prepareProductMasonry(surface, canvas);

  const { mountJesteiProductGrid } = await import("../../visuals/canvas/product-grid/index.js");
  const dispose = await mountJesteiProductGrid(...args);
  schedulePlacement();
  return dispose;
};
