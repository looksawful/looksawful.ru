// Mount one rotating 3D Jestei logo inside the rebrand card.
const TARGET_SELECTOR = "#jestei-results .jestei-bento__logo-inspector";
const POSTER_URL = "/assets/jestei/branding/jestei-logo.svg";

function mountSingleLogo(target) {
  if (!(target instanceof HTMLElement) || target.dataset.bentoSingleLogoMounted === "true") {
    return () => {};
  }

  const originalHtml = target.innerHTML;
  const originalVisualDemo = target.getAttribute("data-visual-demo");
  const originalPoster = target.getAttribute("data-cv-poster");
  const originalPassive = target.getAttribute("data-logo-inspector-passive");

  target.dataset.bentoSingleLogoMounted = "true";
  target.classList.remove("jestei-bento__brand-logo-shell", "is-visible");
  target.removeAttribute("data-visual-demo");
  target.removeAttribute("data-cv-poster");
  target.removeAttribute("data-logo-inspector-passive");
  target.replaceChildren();

  const canvas = target.ownerDocument.createElement("canvas");
  canvas.id = "jestei-rebrand-logo-canvas";
  canvas.className = "visual-canvas jestei-bento__single-logo-canvas";
  canvas.dataset.threePoster = POSTER_URL;
  canvas.dataset.threeScene = "logo";
  canvas.dataset.visualDemo = "three:logo";
  canvas.setAttribute("aria-hidden", "true");
  target.append(canvas);

  return () => {
    target.replaceChildren();
    target.innerHTML = originalHtml;
    delete target.dataset.bentoSingleLogoMounted;

    if (originalVisualDemo == null) target.removeAttribute("data-visual-demo");
    else target.setAttribute("data-visual-demo", originalVisualDemo);

    if (originalPoster == null) target.removeAttribute("data-cv-poster");
    else target.setAttribute("data-cv-poster", originalPoster);

    if (originalPassive == null) target.removeAttribute("data-logo-inspector-passive");
    else target.setAttribute("data-logo-inspector-passive", originalPassive);
  };
}

export function mountJesteiBentoBrandLogo(root = document) {
  const disposers = [...root.querySelectorAll(TARGET_SELECTOR)].map(mountSingleLogo);
  return () => disposers.forEach((dispose) => dispose?.());
}
