import { getTechIcon } from "../../shared/tech-icons.js";

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();
const dedupeKey = (value = "") => normalizeText(value).toLowerCase();

const createIconNode = (label) => {
  const holder = document.createElement("span");
  holder.innerHTML = getTechIcon(label);
  return holder.firstElementChild;
};

const enhanceTechList = (list) => {
  const seen = new Set();

  for (const item of [...list.querySelectorAll("li")]) {
    const label = normalizeText(item.textContent);
    const key = dedupeKey(label);

    if (!label || seen.has(key)) {
      item.remove();
      continue;
    }

    seen.add(key);
    item.dataset.tech = key;
    item.replaceChildren();

    const icon = createIconNode(label);
    const text = document.createElement("span");

    text.textContent = label;

    if (icon) item.append(icon);
    item.append(text);
  }

  list.hidden = list.children.length === 0;
};

export const mountTechIcons = (root = document) => {
  for (const list of root.querySelectorAll(".tech-list, .pet-tech-list, .cv-task-tech-list")) {
    enhanceTechList(list);
  }
};
