// Preserve the native WebGL logo inspector used by the Jestei rebrand card.
const TARGET_SELECTOR = "#jestei-results .jestei-bento__logo-inspector";
const DEFAULT_POSTER = "/assets/media/cases/jesteipool/01-logo/01/02.webp";

function restoreInspectorTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  target.classList.remove("jestei-bento__brand-logo-shell", "is-visible");
  delete target.dataset.bentoBrandLogoMounted;

  target.querySelectorAll(".jestei-bento__brand-logo").forEach((logo) => logo.remove());
  target.setAttribute("data-visual-demo", "logo-inspector:compact");
  target.setAttribute("data-cv-poster", target.getAttribute("data-cv-poster") || DEFAULT_POSTER);
  target.setAttribute("data-logo-inspector-passive", "true");
}

export function mountJesteiBentoBrandLogo(root = document) {
  root.querySelectorAll(TARGET_SELECTOR).forEach(restoreInspectorTarget);
  return () => {};
}
