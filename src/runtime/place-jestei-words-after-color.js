export function placeJesteiWordsAfterColor(root = document) {
  const colorSection = root.querySelector("#jestei-color");
  const wordsSection = root.querySelector("#jestei-words");

  if (!(colorSection instanceof HTMLElement) || !(wordsSection instanceof HTMLElement)) {
    return;
  }

  if (colorSection.nextElementSibling !== wordsSection) {
    colorSection.insertAdjacentElement("afterend", wordsSection);
  }
}
