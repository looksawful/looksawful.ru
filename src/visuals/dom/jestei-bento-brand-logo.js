// Reuses the same Jestei logo asset as the project cover without a WebGL shader.
const TARGET_SELECTOR = "#jestei-results .jestei-bento__logo-inspector";
const LOGO_URL = "/assets/jestei/branding/jestei-logo.svg";

function replaceInspector(target) {
  if (!(target instanceof HTMLElement) || target.dataset.bentoBrandLogoMounted === "true") {
    return () => {};
  }

  const originalHtml = target.innerHTML;
  const originalVisualDemo = target.getAttribute("data-visual-demo");
  const originalPoster = target.getAttribute("data-cv-poster");
  const originalPassive = target.getAttribute("data-logo-inspector-passive");
  const win = target.ownerDocument.defaultView || window;
  const card = target.closest(".jestei-bento__card--rebrand");
  const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  let intersectionObserver;

  target.dataset.bentoBrandLogoMounted = "true";
  target.classList.add("jestei-bento__brand-logo-shell");
  target.removeAttribute("data-visual-demo");
  target.removeAttribute("data-cv-poster");
  target.removeAttribute("data-logo-inspector-passive");
  target.replaceChildren();

  const logo = target.ownerDocument.createElement("img");
  logo.className = "jestei-bento__brand-logo";
  logo.src = LOGO_URL;
  logo.alt = "";
  logo.decoding = "async";
  logo.loading = "eager";
  logo.draggable = false;
  logo.setAttribute("aria-hidden", "true");
  target.append(logo);

  const reveal = () => {
    target.classList.add("is-visible");
    intersectionObserver?.disconnect();
  };

  if (reducedMotion || !("IntersectionObserver" in win)) {
    reveal();
  } else {
    intersectionObserver = new win.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      },
      { threshold: 0.24, rootMargin: "0px 0px -5% 0px" },
    );
    intersectionObserver.observe(card || target);
  }

  return () => {
    intersectionObserver?.disconnect();
    target.classList.remove("is-visible");
    target.replaceChildren();
    target.innerHTML = originalHtml;
    target.classList.remove("jestei-bento__brand-logo-shell");
    delete target.dataset.bentoBrandLogoMounted;

    if (originalVisualDemo == null) target.removeAttribute("data-visual-demo");
    else target.setAttribute("data-visual-demo", originalVisualDemo);

    if (originalPoster == null) target.removeAttribute("data-cv-poster");
    else target.setAttribute("data-cv-poster", originalPoster);

    if (originalPassive == null) target.removeAttribute("data-logo-inspector-passive");
    else target.setAttribute("data-logo-inspector-passive", originalPassive);
  };
}

export function mountJesteiBentoBrandLogo(root = document) {
  const disposers = [...root.querySelectorAll(TARGET_SELECTOR)].map((target) =>
    replaceInspector(target),
  );

  return () => {
    disposers.forEach((dispose) => dispose?.());
  };
}
