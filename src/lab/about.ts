import "./about.css";

import { cvContent } from "../data/cv.ts";

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing Lab about element: ${selector}`);
  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  value: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
}

const profile = required<HTMLElement>("[data-about-profile]");
profile.append(
  text("p", cvContent.profile.role, "lab-about__role"),
  text("h1", cvContent.profile.name, "lab-about__name"),
  text("p", cvContent.profile.aboutPrimary, "lab-about__lead"),
);
if (cvContent.profile.aboutSecondary) {
  profile.append(text("p", cvContent.profile.aboutSecondary, "lab-about__secondary"));
}

const principles = required<HTMLElement>("[data-about-principles]");
for (const principle of cvContent.profile.principles) {
  const card = document.createElement("article");
  card.className = "stack lab-about-card";
  card.style.setProperty("--stack-space", "0.65rem");
  card.append(text("h3", principle.title), text("p", principle.text));
  principles.append(card);
}

const languages = required<HTMLElement>("[data-about-languages]");
for (const language of cvContent.profile.languages) {
  const item = document.createElement("span");
  item.className = "lab-about-language";
  item.textContent = `${language.name} · ${language.level}`;
  languages.append(item);
}
