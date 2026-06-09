import { getTechIcon } from "../../shared/tech-icons.js";

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();
const dedupeKey = (value = "") => normalizeText(value).toLowerCase();

const createIconNode = (label) => {
  const holder = document.createElement("span");
  holder.innerHTML = getTechIcon(label);
  return holder.firstElementChild;
};

const inferTechLabels = (meta) => {
  const domain = meta.closest(".cv-task-domain");
  const area = dedupeKey(domain?.dataset.taskArea || "");
  const project = dedupeKey(domain?.dataset.projectId || "");
  const title = dedupeKey(meta.querySelector(".cv-task-domain__title")?.textContent || "");

  if (title.includes("лендинг")) return ["Figma", "JavaScript", "Canvas", "Motion"];
  if (title.includes("сканограф")) return ["Photography", "Photoshop", "After Effects", "Production"];
  if (title.includes("фото")) return ["Photography", "Photoshop", "Production", "Retouch"];
  if (title.includes("фирмен")) return ["Figma", "Branding", "Print", "Adobe"];
  if (title.includes("графичес")) return ["Figma", "Photoshop", "Illustrator", "Print"];
  if (title.includes("продукт")) return ["Figma", "CJM", "Product Design", "Design System"];
  if (title.includes("интерфейс")) return ["Figma", "Design System", "Prototype", "UI"];

  if (area === "interface") return ["Figma", "CJM", "Prototype", "Design System"];
  if (area === "product" && project.includes("styx")) return ["Photography", "Photoshop", "Production"];
  if (area === "product") return ["Figma", "CJM", "Product Design"];
  if (area === "graphic") return ["Figma", "Photoshop", "Branding"];
  if (area === "analysis") return ["Figma", "Branding", "Print"];

  return [];
};

const createTechList = (labels) => {
  const list = document.createElement("ul");
  list.className = "pet-tech-list cv-task-tech-list cv-task-tech-list--domain";
  list.setAttribute("aria-label", "технологии блока");

  for (const label of labels) {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = label;
    item.append(text);
    list.append(item);
  }

  return list;
};

const readLabels = (lists) => {
  const labels = [];
  const seen = new Set();

  for (const list of lists) {
    for (const item of list.querySelectorAll("li")) {
      const label = normalizeText(item.textContent);
      const key = dedupeKey(label);

      if (!label || seen.has(key)) continue;

      seen.add(key);
      labels.push(label);
    }
  }

  return labels;
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

const consolidateTaskGroupTech = (root) => {
  for (const meta of root.querySelectorAll(".cv-task-group__meta")) {
    const sourceLists = [
      ...meta.querySelectorAll(".cv-task-list-group__content > .cv-task-tech-list, .cv-task-list-group__content > .pet-tech-list"),
    ].filter((list) => !list.classList.contains("cv-task-tech-list--domain"));

    let labels = readLabels(sourceLists);

    for (const list of sourceLists) {
      list.remove();
    }

    if (labels.length === 0) {
      labels = inferTechLabels(meta);
    }

    const title = meta.querySelector(".cv-task-domain__title");
    const existing = meta.querySelector(".cv-task-tech-list--domain");

    if (labels.length === 0) {
      existing?.remove();
      continue;
    }

    const nextList = createTechList(labels);

    if (existing) {
      existing.replaceWith(nextList);
    } else if (title) {
      title.insertAdjacentElement("afterend", nextList);
    } else {
      meta.prepend(nextList);
    }

    enhanceTechList(nextList);
  }
};

export const mountTechIcons = (root = document) => {
  consolidateTaskGroupTech(root);

  for (const list of root.querySelectorAll(".tech-list, .pet-tech-list, .cv-task-tech-list")) {
    enhanceTechList(list);
  }
};
