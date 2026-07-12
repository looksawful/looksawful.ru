function findDirectParagraph(element) {
  return [...element.children].find((child) => child.matches("p")) || null;
}

export function mergeJesteiTypeIntoLogo(root = document) {
  const logoSection = root.querySelector("#jestei-logo");
  const composition = logoSection?.querySelector("[data-jestei-logo-composition]");
  const typeSection = root.querySelector("#jestei-type");

  if (!logoSection || !composition || !typeSection) return;
  if (composition.contains(typeSection)) return;

  const typeScreen = typeSection.querySelector("[data-section-screen]");
  const typeBlock = typeSection.querySelector("[data-section-block]");
  const typeTitle = typeBlock?.querySelector("[data-section-title]");
  const typeParagraph = typeBlock ? findDirectParagraph(typeBlock) : null;
  const typeGallery = typeBlock?.querySelector("aside[data-media-cluster]");

  if (!typeScreen || !typeBlock || !typeTitle || !typeParagraph || !typeGallery) {
    return;
  }

  const documentRef = root.ownerDocument || root;
  const typeCopy = documentRef.createElement("div");
  typeCopy.className = "jestei-logo__type-copy";

  typeTitle.classList.add("jestei-logo__type-title");
  typeGallery.classList.add("jestei-logo__type-media");
  typeCopy.append(typeTitle, typeParagraph);

  typeBlock.classList.add("jestei-logo__type-group");
  typeBlock.replaceChildren(typeCopy, typeGallery);
  typeScreen.classList.add("jestei-logo__type-screen");
  typeSection.classList.add("jestei-logo__type-section");

  composition.classList.add("jestei-brand-bento");
  composition.setAttribute("data-jestei-brand-bento", "");
  composition.append(typeSection);
}
