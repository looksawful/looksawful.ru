import { mountExperience } from "../components/experience.ts";
import { cvContent } from "../data/cv.ts";

const frame = document.querySelector<HTMLIFrameElement>("[data-preview-frame]");

function appendText(parent: HTMLElement, tag: keyof HTMLElementTagNameMap, text: string, className?: string): HTMLElement {
  const element = parent.ownerDocument.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderCurrentExpertise(section: HTMLElement): void {
  section.replaceChildren();
  section.dataset.labCurrentized = "cv-skills";

  appendText(section, "h2", "Экспертиза");

  const list = section.ownerDocument.createElement("div");
  list.className = "auto-grid";
  list.style.setProperty("--auto-grid-min", "18rem");
  section.append(list);

  for (const skillSection of Object.values(cvContent.skills)) {
    const rows = skillSection.rows.filter((row) => row.label || row.text);
    if (!rows.length) continue;

    const group = section.ownerDocument.createElement("section");
    group.className = "stack";
    group.style.setProperty("--stack-space", "0.75rem");
    appendText(group, "h3", skillSection.title || "Навыки");

    const items = section.ownerDocument.createElement("dl");
    items.className = "stack";
    items.style.setProperty("--stack-space", "0.5rem");
    for (const row of rows) {
      const item = section.ownerDocument.createElement("div");
      if (row.label) appendText(item, "dt", row.label);
      if (row.text) appendText(item, "dd", row.text);
      items.append(item);
    }
    group.append(items);
    list.append(group);
  }

  section.hidden = false;
}

function revealCurrentHomeSurfaces(doc: Document): void {
  const experience = doc.querySelector<HTMLElement>(".experience");
  if (experience) {
    experience.dataset.experienceVisibility = "visible";
    mountExperience(doc);
  }

  const expertise = doc.querySelector<HTMLElement>(".expertise");
  if (expertise) renderCurrentExpertise(expertise);

  for (const article of doc.querySelectorAll<HTMLElement>("article.project[hidden]")) {
    if (!article.querySelector(".placeholder-surface")) article.hidden = false;
  }

  for (const section of doc.querySelectorAll<HTMLElement>(".portfolio-showcase[hidden]")) {
    if (!section.querySelector(".placeholder-surface")) section.hidden = false;
  }

  doc.documentElement.dataset.labHiddenSurfaces = "1";
}

function applyLabHiddenView(): void {
  if (!frame?.contentDocument || !frame.contentWindow) return;

  try {
    const url = new URL(frame.contentWindow.location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname !== "/" || url.searchParams.get("lab-hidden") !== "1") return;
    revealCurrentHomeSurfaces(frame.contentDocument);
  } catch {
    // Lab inspection already reports cross-origin failures; this layer stays inert.
  }
}

frame?.addEventListener("load", applyLabHiddenView);
