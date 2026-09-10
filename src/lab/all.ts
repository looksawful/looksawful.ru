import "./all.css";

import { cases } from "../data/catalog/cases.ts";
import { collections } from "../data/catalog/collections.ts";
import { projects } from "../data/catalog/projects/index.ts";
import type { CanonicalProjectData } from "../data/catalog/projects/types.ts";
import { cvContent } from "../data/cv.ts";
import { mediaCatalogItems, type MediaCatalogItem } from "../data/media/index.ts";
import { sitePages } from "../site/pages/manifest.ts";
import type { CaseData } from "../types/case.ts";
import type { CollectionData } from "../types/collection.ts";

const allCases: readonly CaseData[] = cases;
const allCollections: readonly CollectionData[] = collections;
const allProjects: readonly CanonicalProjectData[] = projects;

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing Lab all-work element: ${selector}`);
  return node;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function compact(values: readonly (string | undefined)[]): string[] {
  return values.filter((value): value is string => Boolean(value));
}

function addTags(parent: HTMLElement, values: readonly string[]): void {
  if (!values.length) return;
  const tags = element("div", "cluster lab-tags");
  for (const value of values) tags.append(element("span", "lab-tag", value));
  parent.append(tags);
}

function addCopy(parent: HTMLElement, value: string | undefined): void {
  if (!value?.trim()) return;
  parent.append(element("p", "lab-card__copy", value));
}

function addLink(parent: HTMLElement, href: string, label = "open"): void {
  const link = element("a", "lab-card__link", label);
  link.href = href;
  parent.append(link);
}

function createPreview(item: MediaCatalogItem | undefined): HTMLElement | null {
  if (!item) return null;
  const source = item.asset.type === "image"
    ? item.asset.src
    : item.asset.type === "video"
      ? item.posterSrc
      : undefined;
  if (!source) return null;

  const figure = element("figure", "lab-card__preview");
  const image = element("img");
  image.src = source;
  image.alt = item.alt || item.title || "";
  image.loading = "lazy";
  image.decoding = "async";
  figure.append(image);
  return figure;
}

function projectRoute(id: string): string | undefined {
  const page = sitePages.find((candidate) =>
    candidate.type === "project"
    && "entityId" in candidate
    && candidate.entityId === id,
  );
  return page?.path;
}

function projectMedia(id: string): readonly MediaCatalogItem[] {
  return mediaCatalogItems.filter((item) =>
    !item.archived && item.projectIds.some((projectId) => projectId === id),
  );
}

function collectionMedia(
  item: CollectionData,
  relatedProjects: readonly CanonicalProjectData[],
): readonly MediaCatalogItem[] {
  return mediaCatalogItems.filter((media) => {
    if (media.archived) return false;
    const projectMatch = relatedProjects.some((project) =>
      media.projectIds.some((projectId) => projectId === project.id),
    );
    const workAreaMatch = (item.workAreaIds ?? []).some((workAreaId) =>
      media.workAreaIds.some((mediaWorkAreaId) => mediaWorkAreaId === workAreaId),
    );
    return projectMatch || workAreaMatch;
  });
}

function card(title: string, status?: string): HTMLElement {
  const node = element("article", "lab-data-card stack");
  node.style.setProperty("--stack-space", "0.75rem");
  if (status) node.dataset.status = status;
  const heading = element("div", "cluster lab-card__heading");
  heading.append(element("h3", "lab-card__title", title));
  if (status) heading.append(element("span", "lab-status-pill", status));
  node.append(heading);
  return node;
}

const surfaces = [
  {
    title: "home / hidden current",
    href: "/lab/?route=%2F%3Flab-hidden%3D1",
    copy: "Скрытые homepage-поверхности. Experience монтируется текущим компонентом; Expertise собирается из текущего CV; незаполненные placeholder-секции не маскируются под готовые.",
  },
  {
    title: "about / current",
    href: "/lab/about/",
    copy: "Актуальная версия исторической страницы About на текущих данных CV и текущих layout-patterns.",
  },
  {
    title: "awful cases / project",
    href: "/work/awful-cases/",
    copy: "Текущая standalone Project-страница из канонического PageContent.",
  },
  {
    title: "awful cases / pet",
    href: "/pets/awful-cases/",
    copy: "Текущий интерактивный pet runtime.",
  },
  {
    title: "berserk timer / pet",
    href: "/pets/berserk-timer/",
    copy: "Текущий Berserk Timer runtime вместо восстановления старых превью.",
  },
  {
    title: "design system",
    href: "/lab/system/",
    copy: "Компоненты, шаблоны и токены из текущего исходного кода Lab Storybook.",
  },
] as const;

const surfacesRoot = required<HTMLElement>("[data-lab-surfaces]");
for (const surface of surfaces) {
  const node = card(surface.title, "lab only");
  addCopy(node, surface.copy);
  addLink(node, surface.href);
  surfacesRoot.append(node);
}

const pagesRoot = required<HTMLElement>("[data-lab-pages]");
for (const page of sitePages) {
  const discovery = page.discovery;
  const visibility = discovery.listed && discovery.indexable ? "public" : "hidden/direct";
  const node = card(page.id, visibility);
  addTags(node, [page.type, page.renderer, page.path]);
  addLink(node, page.path);
  pagesRoot.append(node);
}

const casesRoot = required<HTMLElement>("[data-lab-cases]");
for (const item of allCases) {
  const node = card(item.name, item.visibility);
  addCopy(node, item.description || item.summary);
  addTags(node, compact([item.id, item.date, ...(item.roleIds ?? [])]));
  const route = sitePages.find((page) =>
    page.type === "case" && "entityId" in page && page.entityId === item.id,
  )?.path;
  if (route) addLink(node, route);
  casesRoot.append(node);
}

const projectsRoot = required<HTMLElement>("[data-lab-projects]");
required<HTMLElement>("[data-lab-project-count]").textContent = String(allProjects.length);
for (const item of allProjects) {
  const media = projectMedia(item.id);
  const node = card(item.name, item.status ?? "current");
  const preview = createPreview(media.find((asset) => asset.showInCatalog) ?? media[0]);
  if (preview) node.prepend(preview);
  addCopy(node, item.summary || item.description);
  addTags(node, compact([
    item.id,
    item.date,
    ...(item.caseIds ?? []),
    ...(item.collectionIds ?? []),
    `media:${media.length}`,
  ]));
  const route = projectRoute(item.id);
  if (route) addLink(node, route);
  projectsRoot.append(node);
}

const collectionsRoot = required<HTMLElement>("[data-lab-collections]");
for (const item of allCollections) {
  const relatedProjects = allProjects.filter((project) => project.collectionIds?.includes(item.id));
  const relatedMedia = collectionMedia(item, relatedProjects);
  const node = card(item.displayName ?? item.name, item.visibility);
  const preview = createPreview(relatedMedia.find((asset) => asset.showInCatalog) ?? relatedMedia[0]);
  if (preview) node.prepend(preview);
  addCopy(node, item.summary || item.description);
  addTags(node, [
    item.id,
    ...(item.workAreaIds ?? []),
    `projects:${relatedProjects.length}`,
    `media:${relatedMedia.length}`,
  ]);
  const route = sitePages.find((page) =>
    page.type === "collection" && "entityId" in page && page.entityId === item.id,
  )?.path;
  if (route) addLink(node, route);
  collectionsRoot.append(node);
}

const cvRoot = required<HTMLElement>("[data-lab-cv]");
for (const experience of cvContent.experience.filter((item) => !item.visible)) {
  const node = card(experience.company || experience.id, "hidden in CV");
  addCopy(node, experience.description || experience.context);
  addTags(node, compact([experience.id, experience.period, experience.role]));
  cvRoot.append(node);
}
for (const [id, skillSection] of Object.entries(cvContent.skills)) {
  if (skillSection.visible && skillSection.titleVisible) continue;
  const node = card(skillSection.title || id, "hidden in CV");
  for (const row of skillSection.rows) {
    if (!row.label && !row.text) continue;
    const copy = element("p", "lab-card__copy");
    copy.textContent = `${row.label ? `${row.label}: ` : ""}${row.text}`;
    node.append(copy);
  }
  cvRoot.append(node);
}

const hiddenMedia = mediaCatalogItems.filter((item) => !item.showInCatalog || item.archived);
required<HTMLElement>("[data-lab-media-count]").textContent = String(hiddenMedia.length);
const mediaRoot = required<HTMLElement>("[data-lab-media]");
for (const item of hiddenMedia) {
  const status = item.archived ? "archived" : "catalog hidden";
  const node = card(item.title || item.asset.id, status);
  const preview = createPreview(item);
  if (preview) node.prepend(preview);
  addCopy(node, item.description);
  addTags(node, compact([
    item.asset.id,
    item.asset.type,
    item.date,
    ...item.projectIds,
    ...item.workAreaIds,
    ...item.deliverableIds,
  ]));
  if (item.asset.src) addLink(node, item.asset.src, "asset");
  mediaRoot.append(node);
}
