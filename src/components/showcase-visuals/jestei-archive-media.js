const INTERFACE_CANVAS_ID = "archive-jestei-interface-masonry";
const PRODUCT_CANVAS_ID = "archive-jestei-product-horizontal";
const INTERFACE_SECTION_ID = "jestei-interface-archive";
const PRODUCT_SECTION_ID = "jestei-product-archive";

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

  surface.className = `jestei-archive-media__surface jestei-archive-media__surface--${modifier}`;
  surface.removeAttribute("aria-hidden");

  const canvas = surface.querySelector("canvas");
  canvas?.classList.add("jestei-archive-media__canvas");
};

export const placeJesteiArchiveCanvases = (root = document) => {
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

  archive.className = "section jestei-archive-media jestei-archive-media--interface";
  archive.setAttribute("aria-label", "обзор ux ui решений jestei pool");
  archive.removeAttribute("data-section-component");
  archive.removeAttribute("data-section-chapter");
  archive.removeAttribute("data-restored-preview");
  archive.removeAttribute("data-chapter-title");
  archive.replaceChildren(interfaceSurface);
  setVisible(archive);
  results.insertAdjacentElement("afterend", archive);

  let productSection = root.querySelector(`#${PRODUCT_SECTION_ID}`);
  if (!productSection) {
    productSection = root.createElement("section");
    productSection.id = PRODUCT_SECTION_ID;
    productSection.setAttribute("data-section-family", "jestei");
  }

  productSection.className = "jestei-archive-media jestei-archive-media--product";
  productSection.setAttribute("aria-label", "обзор продуктовой графики jestei pool");
  productSection.replaceChildren(productSurface);
  setVisible(productSection);
  graphics.insertAdjacentElement("beforebegin", productSection);
};

const schedulePlacement = () => {
  placeJesteiArchiveCanvases(document);
  queueMicrotask?.(() => placeJesteiArchiveCanvases(document));
  requestAnimationFrame?.(() => placeJesteiArchiveCanvases(document));
  setTimeout(() => placeJesteiArchiveCanvases(document), 0);
};

export const mountJesteiArchiveMasonry = async (...args) => {
  schedulePlacement();
  const { mountMasonry } = await import("../../visuals/canvas/landing-motion/masonry/index.js");
  const dispose = await mountMasonry(...args);
  schedulePlacement();
  return dispose;
};

export const mountJesteiArchiveHorizontal = async (...args) => {
  schedulePlacement();
  const { mountShowcaseHorizontal } = await import("../../visuals/canvas/showcase-horizontal/index.js");
  const dispose = await mountShowcaseHorizontal(...args);
  schedulePlacement();
  return dispose;
};
