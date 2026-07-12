const REBRAND_SVG = "/assets/jestei/branding/jestei-rebrand-equation.svg";

export function replaceJesteiRebrandVisual(root = document) {
  const slot = root.querySelector(
    '#jestei-results [data-bento-card="rebrand"] .jestei-bento__logo-inspector',
  );

  if (!slot || slot.dataset.rebrandEquationReady === "true") return;

  slot.dataset.rebrandEquationReady = "true";
  slot.removeAttribute("data-visual-demo");
  slot.removeAttribute("data-cv-poster");
  slot.removeAttribute("data-logo-inspector-passive");
  slot.classList.add("jestei-bento__rebrand-equation");
  slot.replaceChildren();

  const image = (root.ownerDocument || root).createElement("img");
  image.className = "jestei-bento__rebrand-equation-image";
  image.src = REBRAND_SVG;
  image.alt = "";
  image.decoding = "async";
  image.loading = "eager";
  image.draggable = false;

  slot.append(image);
}
