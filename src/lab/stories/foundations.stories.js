import "./foundations.css";

function collectCustomProperties() {
  const tokens = new Map();
  const visitRules = (rules) => {
    for (const rule of Array.from(rules)) {
      if (rule.style) {
        for (const property of Array.from(rule.style)) {
          if (!property.startsWith("--")) continue;
          const value = rule.style.getPropertyValue(property).trim();
          if (value) tokens.set(property, value);
        }
      }
      if (rule.cssRules) visitRules(rule.cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try { if (sheet.cssRules) visitRules(sheet.cssRules); } catch { /* local CSSOM only */ }
  }
  return [...tokens.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function resolveTokenValue(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const matches = {
  color: (name, raw, resolved) => name.startsWith("--clr-") || /color|#[0-9a-f]{3,8}|rgb|hsl|oklch|color\(/i.test(`${name} ${raw} ${resolved}`),
  typography: (name) => /(font|type|text|line-height|letter-spacing)/i.test(name),
  spacing: (name) => /(space|gap|padding|margin)/i.test(name),
  radius: (name) => /(radius|rounded)/i.test(name),
  shadow: (name) => /(shadow|elevation)/i.test(name),
  motion: (name) => /(motion|duration|ease|transition|delay)/i.test(name),
  layout: (name) => /(width|height|size|container|grid|breakpoint|z-|aspect)/i.test(name),
};

function tokensFor(kind) {
  return collectCustomProperties().map(([name, rawValue]) => ({ name, rawValue, resolvedValue: resolveTokenValue(name) || rawValue })).filter((token) => matches[kind]?.(token.name, token.rawValue, token.resolvedValue));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderColorPreview(token) {
  const sample = el("div", "token-color");
  sample.style.background = `var(${token.name})`;
  return sample;
}
function renderLengthPreview(token) {
  const wrap = el("div", "token-length");
  const bar = el("div", "token-length__bar");
  bar.style.width = `clamp(1px, var(${token.name}), 100%)`;
  wrap.append(bar); return wrap;
}
function renderRadiusPreview(token) {
  const sample = el("div", "token-radius"); sample.style.borderRadius = `var(${token.name})`; return sample;
}
function renderShadowPreview(token) {
  const sample = el("div", "token-shadow"); sample.style.boxShadow = `var(${token.name})`; return sample;
}
function renderTypographyPreview(token) {
  const sample = el("div", "token-type", "Aa Гг 0123");
  const name = token.name.toLowerCase();
  if (name.includes("font-family")) sample.style.fontFamily = `var(${token.name})`;
  else if (name.includes("font-weight")) sample.style.fontWeight = `var(${token.name})`;
  else if (name.includes("line-height")) sample.style.lineHeight = `var(${token.name})`;
  else if (name.includes("letter")) sample.style.letterSpacing = `var(${token.name})`;
  else sample.style.fontSize = `var(${token.name})`;
  return sample;
}
function renderMotionPreview(token) {
  const track = el("div", "token-motion"); const dot = el("div", "token-motion__dot");
  const value = token.resolvedValue;
  if (/ms|s$/i.test(value)) dot.style.setProperty("--token-duration", `var(${token.name})`);
  if (/cubic-bezier|steps|linear|ease/i.test(value)) dot.style.setProperty("--token-ease", `var(${token.name})`);
  track.append(dot); return track;
}
function renderGenericPreview(token) {
  const sample = el("div", "token-type", token.resolvedValue || token.rawValue); return sample;
}

function card(token, renderer) {
  const root = el("article", "token-card"); root.dataset.tokenName = token.name;
  const visual = el("div", "token-card__visual"); visual.append(renderer(token));
  const meta = el("div", "token-card__meta"); meta.append(el("div", "token-card__name", token.name), el("div", "token-card__value", token.resolvedValue || token.rawValue));
  root.append(visual, meta); return root;
}

function page(title, description) {
  const root = el("main", "token-foundations"); const header = el("header", "token-foundations__header");
  header.append(el("h1", "", title), el("p", "", description)); root.append(header); return root;
}
function gallery(title, description, kind, renderer) {
  const root = page(title, description); const grid = el("div", "token-foundations__grid");
  for (const token of tokensFor(kind)) grid.append(card(token, renderer)); root.append(grid); return root;
}

function overview() {
  const root = page("design tokens", "Live visual map of the canonical CSS custom properties loaded by the site. Nothing is duplicated in Storybook.");
  const summary = el("div", "token-summary");
  const all = collectCustomProperties();
  for (const kind of Object.keys(matches)) summary.append(el("span", "", `${kind} · ${tokensFor(kind).length}`));
  summary.append(el("span", "", `all · ${all.length}`)); root.append(summary);
  const grid = el("div", "token-foundations__grid");
  for (const token of tokensFor("color")) grid.append(card(token, renderColorPreview)); root.append(grid); return root;
}

function inspector() {
  const root = page("token inspector", "Raw declaration and browser-resolved value from the canonical stylesheet graph.");
  const table = el("table", "token-inspector"); const head = document.createElement("thead"); const hr = document.createElement("tr");
  for (const label of ["Token", "Raw value", "Resolved value"]) hr.append(el("th", "", label)); head.append(hr); table.append(head);
  const body = document.createElement("tbody");
  for (const [name, rawValue] of collectCustomProperties()) { const row = document.createElement("tr"); row.dataset.tokenName = name; for (const value of [name, rawValue, resolveTokenValue(name) || rawValue]) { const cell = document.createElement("td"); cell.append(el("code", "", value)); row.append(cell); } body.append(row); }
  table.append(body); root.append(table); return root;
}

const meta = { title: "00 Foundations/Tokens", tags: ["autodocs", "stable"], parameters: { docs: { description: { component: "Live visual inventory of canonical CSS custom properties. Storybook never owns a duplicate token source." } } } };
export default meta;

export const Overview = { render: overview };
export const Colors = { render: () => gallery("colors", "Canonical color tokens rendered as live swatches.", "color", renderColorPreview) };
export const Typography = { render: () => gallery("typography", "Type-related variables applied to a live specimen.", "typography", renderTypographyPreview) };
export const Spacing = { render: () => gallery("spacing", "Spacing and gap values shown at physical scale where CSS permits.", "spacing", renderLengthPreview) };
export const Radii = { render: () => gallery("radii", "Corner-radius tokens applied to identical geometry.", "radius", renderRadiusPreview) };
export const Shadows = { render: () => gallery("shadows", "Shadow and elevation tokens rendered on neutral surfaces.", "shadow", renderShadowPreview) };
export const Motion = { render: () => gallery("motion", "Duration and easing tokens demonstrated with reduced-motion support.", "motion", renderMotionPreview) };
export const Layout = { render: () => gallery("layout", "Size, container, grid, breakpoint and related layout variables.", "layout", renderGenericPreview) };
export const Inspector = { render: inspector };
