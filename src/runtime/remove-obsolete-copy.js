const SELECTORS = [
  "#jestei-tariffs .jestei-tariffs__screen > p:last-child",
  "#resume-title",
];

export function removeObsoleteCopy(root = document) {
  SELECTORS.forEach((selector) => {
    root.querySelector(selector)?.remove();
  });
}
