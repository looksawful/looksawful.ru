import "./foundations.css";
import {
  collectCustomProperties,
  customPropertiesFor,
  gradientDeclarations,
  motionDeclarations,
  reducedMotionDeclarations,
  resolveCustomProperty,
} from "../storybook-support/foundation-tokens.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function foundationPage(title, description) {
  const root = el("main", "foundation-page");
  const header = el("header", "foundation-page__header");
  header.append(el("h1", "foundation-page__title", title), el("p", "foundation-page__description", description));
  root.append(header);
  return root;
}

function tokenCard(token, kind = "generic") {
  const card = el("article", "foundation-token");
  card.dataset.tokenName = token.name;
  const preview = el("div", `foundation-token__preview foundation-token__preview--${kind}`);
  const resolved = resolveCustomProperty(token.name) || token.rawValue;
  if (kind === "color") preview.style.background = `var(${token.name})`;
  if (kind === "surface") {
    if (token.name.includes("shadow")) preview.style.boxShadow = `var(${token.name})`;
    else if (token.name.includes("border")) preview.style.borderColor = `var(${token.name})`;
    else preview.style.background = `var(${token.name})`;
  }
  if (kind === "radius") preview.style.borderRadius = `var(${token.name})`;
  if (kind === "size") preview.style.setProperty("--foundation-sample-size", `var(${token.name})`);
  if (kind === "type") {
    preview.textContent = "Aa 0123";
    if (token.name.startsWith("--ff-")) preview.style.fontFamily = `var(${token.name})`;
    else if (token.name.startsWith("--fw-")) preview.style.fontWeight = `var(${token.name})`;
    else if (token.name.startsWith("--fs-")) preview.style.fontSize = `var(${token.name})`;
    else if (token.name.startsWith("--lh-")) preview.style.lineHeight = `var(${token.name})`;
    else if (token.name.startsWith("--ls-")) preview.style.letterSpacing = `var(${token.name})`;
  }
  const meta = el("div", "foundation-token__meta");
  meta.append(el("code", "foundation-token__name", token.name), el("code", "foundation-token__value", resolved));
  meta.append(el("small", "foundation-token__origin", `${token.selector || "declaration"} / ${token.source}`));
  card.append(preview, meta);
  return card;
}

function tokenGallery(title, description, group, kind) {
  const root = foundationPage(title, description);
  const grid = el("section", "foundation-grid");
  for (const token of customPropertiesFor(group)) grid.append(tokenCard(token, kind));
  root.append(grid);
  return root;
}

function declarationGallery(title, description, declarations, kind) {
  const root = foundationPage(title, description);
  const grid = el("section", "foundation-grid");
  for (const item of declarations()) {
    const card = el("article", "foundation-token");
    const preview = el("div", `foundation-token__preview foundation-token__preview--${kind}`);
    if (kind === "gradient") preview.style.background = item.value;
    if (kind === "motion") preview.append(el("span", "foundation-motion-dot"));
    const meta = el("div", "foundation-token__meta");
    meta.append(
      el("code", "foundation-token__name", `${item.selector || "rule"} / ${item.property}`),
      el("code", "foundation-token__value", item.value),
      el("small", "foundation-token__origin", `${item.condition || "all media"} / ${item.source}`),
    );
    card.append(preview, meta);
    grid.append(card);
  }
  root.append(grid);
  return root;
}

function motionSystem() {
  const root = tokenGallery("motion", "Production motion custom properties plus transition and animation declarations discovered from production CSS.", "motion", "motion");
  const declarations = declarationGallery("motion declarations", "Production transition and animation declarations.", motionDeclarations, "motion");
  root.append(...Array.from(declarations.children).slice(1));
  return root;
}

function inspector() {
  const root = foundationPage("token inspector", "Every CSS custom property currently exposed by the loaded production stylesheet graph, including component-scoped variables.");
  const table = el("table", "foundation-inspector");
  const head = document.createElement("thead");
  const row = document.createElement("tr");
  for (const label of ["Token", "Value", "Selector", "Source"]) row.append(el("th", "", label));
  head.append(row);
  const body = document.createElement("tbody");
  for (const token of collectCustomProperties()) {
    const tr = document.createElement("tr");
    for (const value of [token.name, resolveCustomProperty(token.name) || token.rawValue, token.selector || token.condition || "declaration", token.source]) {
      const td = document.createElement("td");
      td.append(el("code", "", value));
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(head, body);
  root.append(table);
  return root;
}

const meta = {
  title: "00 Foundations/Production System",
  tags: ["autodocs", "stable", "a11y-reviewed"],
  parameters: {
    looksawful: {
      sources: ["src/styles/index.css", "src/styles/tokens.css", "src/styles/colors.css", "src/styles/motion.css"],
      layer: "foundation",
      policy: "isolated",
      canonical: true,
      state: "production-derived",
      visibility: ["always"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "Read-only production-derived foundation inventory. Values come from the canonical stylesheet graph through CSSOM rather than a Storybook-owned token copy." } },
  },
};
export default meta;

export const Colors = { render: () => tokenGallery("colors", "Canonical color custom properties from production CSS.", "color", "color") };
export const Typography = { render: () => tokenGallery("typography", "Production font family, weight, size, line-height and tracking scales.", "typography", "type") };
export const SizingAndSpacing = { render: () => tokenGallery("sizing and spacing", "Production size, spacing, content-width and page-padding primitives and aliases.", "sizing", "size") };
export const Radii = { render: () => tokenGallery("radii", "Production radius primitives and semantic radius aliases.", "radius", "radius") };
export const Surfaces = { render: () => tokenGallery("surfaces", "Production surface, foreground, border and shadow variables.", "surface", "surface") };
export const Gradients = { render: () => declarationGallery("gradients", "Gradient declarations discovered from the loaded production CSS rules.", gradientDeclarations, "gradient") };
export const Motion = { render: motionSystem };
export const ReducedMotion = { render: () => declarationGallery("reduced motion", "Production declarations active under prefers-reduced-motion: reduce.", reducedMotionDeclarations, "motion") };
export const Inspector = { render: inspector };
