import homeHtml from "../../../index.html?raw";
import { renderHomepage } from "../../site/renderers/home/home-slots.ts";
import { initMotion } from "../../motion.ts";

const markup = renderHomepage(homeHtml);
export function renderUsefulPreview(cardId) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  const section = template.content.querySelector(".pet-projects");
  if (!section) throw new Error("Canonical Useful section is unavailable");
  const root = document.createElement("div");
  const style = section.previousElementSibling;
  if (style?.tagName === "STYLE") root.append(style.cloneNode(true));
  if (cardId) {
    for (const card of section.querySelectorAll("[data-subproject-id]")) {
      if (card.dataset.subprojectId !== cardId) card.remove();
    }
  }
  root.append(section);
  return root;
}
export function initializeUseful({ canvasElement }) {
  return initMotion({ root: canvasElement });
}
