const TEMPORARY_DECORATION_SELECTORS = [
  "#jestei-interface-archive",
  '#jestei-results [data-bento-card="rebrand"] .jestei-bento__logo-inspector',
];

function hideDecoration(element) {
  if (!(element instanceof HTMLElement)) return;

  const alreadyHidden =
    element.hidden &&
    element.getAttribute("aria-hidden") === "true" &&
    element.hasAttribute("data-temporarily-hidden-decoration") &&
    element.style.getPropertyValue("display") === "none" &&
    element.style.getPropertyPriority("display") === "important";

  if (alreadyHidden) return;

  element.hidden = true;
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("data-temporarily-hidden-decoration", "");
  element.style.setProperty("display", "none", "important");
  element.style.setProperty("visibility", "hidden", "important");
  element.style.setProperty("opacity", "0", "important");
}

function apply(root = document) {
  TEMPORARY_DECORATION_SELECTORS.forEach((selector) => {
    root.querySelectorAll?.(selector).forEach(hideDecoration);
  });
}

let observer;

export function hideJesteiTemporaryDecorations(root = document) {
  apply(root);

  if (observer || !(root instanceof Document) || !("MutationObserver" in window)) {
    return () => {};
  }

  observer = new MutationObserver(() => apply(root));
  observer.observe(root.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden", "style", "class", "aria-hidden"],
  });

  return () => {
    observer?.disconnect();
    observer = undefined;
  };
}
