import { buildTokenRegistry, groupTokensByKind, isCanonicalFoundationDeclaration, resolveTokenValue } from "../token-visualization.mjs";

function collectCustomProperties() {
  const declarations = [];
  const visitRules = (rules, context) => {
    for (const rule of Array.from(rules)) {
      const selector = rule.selectorText || context.selector || null;
      if (rule.style) {
        for (const property of Array.from(rule.style)) {
          if (!property.startsWith("--")) continue;
          const raw = rule.style.getPropertyValue(property).trim();
          if (raw) declarations.push({ name: property, raw, selector, media: context.media, source: context.source });
        }
      }
      try {
        if (rule.cssRules) {
          const media = rule.media?.mediaText || context.media;
          visitRules(rule.cssRules, { ...context, selector, media });
        }
      } catch {
        // Inaccessible nested CSSOM is intentionally ignored.
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.cssRules) visitRules(sheet.cssRules, { selector: null, media: null, source: sheet.href || "inline" });
    } catch {
      // Cross-origin styles are not canonical local token sources.
    }
  }
  return declarations;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function previewFor(token) {
  const preview = el("div", `token-preview token-preview--${token.kind}`);
  const value = `var(${token.name})`;
  if (token.kind === "color" || token.kind === "gradient") preview.style.background = value;
  else if (token.kind === "aspect-ratio") {
    const box = el("span", "token-ratio-box");
    const ratio = token.resolved || token.raw;
    if (ratio === "auto") box.textContent = "auto";
    else box.style.aspectRatio = ratio;
    preview.append(box);
  } else if (token.kind === "radius") preview.style.borderRadius = value;
  else if (token.kind === "shadow") preview.style.boxShadow = value;
  else if (token.kind === "opacity") preview.style.opacity = value;
  else if (token.kind === "border") {
    preview.style.borderStyle = "solid";
    preview.style.borderColor = "var(--clr-foreground)";
    preview.style.borderWidth = value;
  }
  else if (token.kind === "font-family") { preview.textContent = "Aa Бб 0123"; preview.style.fontFamily = value; }
  else if (token.kind === "font-size") { preview.textContent = "Aa Бб"; preview.style.fontSize = value; }
  else if (token.kind === "font-weight") { preview.textContent = "Aa Бб"; preview.style.fontWeight = value; }
  else if (token.kind === "line-height") { preview.textContent = "Строка\nLine"; preview.style.lineHeight = value; preview.style.whiteSpace = "pre-line"; }
  else if (token.kind === "letter-spacing") { preview.textContent = "ТРЕКИНГ"; preview.style.letterSpacing = value; }
  else if (token.kind === "speed") preview.textContent = `${token.resolved} px/s`;
  else if (token.kind === "spacing") {
    const bar = el("span", "token-size-bar");
    bar.style.width = `min(${value}, 100%)`;
    preview.append(bar);
  } else if (token.kind === "duration" || token.kind === "easing") {
    const dot = el("span", "token-motion-dot");
    if (token.kind === "duration") dot.style.animationDuration = value;
    else dot.style.animationTimingFunction = value;
    preview.append(dot);
  } else if (token.kind === "z-index") {
    preview.innerHTML = '<span class="token-layer">1</span><span class="token-layer token-layer--active">z</span>';
    preview.lastElementChild.style.zIndex = value;
  } else preview.textContent = token.resolved;
  return preview;
}

function buildTokens({ canonicalOnly = false } = {}) {
  const declarations = collectCustomProperties().filter(
    (declaration) => !canonicalOnly || isCanonicalFoundationDeclaration(declaration),
  );
  const values = new Map(declarations.map(({ name, raw }) => [name, raw]));
  return buildTokenRegistry(declarations)
    .map((token) => ({ ...token, resolved: resolveTokenValue(token.raw, values) }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

function tokenGallery(filter = () => true, heading = "canonical CSS tokens", { canonicalOnly = false } = {}) {
  const root = el("main", "token-foundations");
  root.innerHTML = `<style>
    .token-foundations{min-height:100vh;padding:clamp(20px,4vw,48px);background:var(--clr-bg,#fff);color:var(--clr-text,#111);font-family:var(--ff-primary,Inter,system-ui,sans-serif)}
    .token-foundations *{box-sizing:border-box}.token-foundations h1{margin:0 0 8px;font-size:clamp(32px,5vw,64px);line-height:.95}.token-intro{max-width:760px;margin:0 0 32px;opacity:.7}
    .token-toolbar{display:flex;gap:12px;align-items:center;margin:0 0 24px}.token-search{width:min(440px,100%);padding:12px 14px;border:1px solid var(--clr-border,#ccc);border-radius:10px;background:transparent;color:inherit;font:inherit}
    .token-count{font-size:12px;opacity:.6}.token-section{margin:36px 0}.token-section h2{text-transform:lowercase;margin:0 0 14px;font-size:20px}.token-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
    .token-card{min-width:0;padding:12px;border:1px solid var(--clr-border,#ddd);border-radius:14px;background:color-mix(in srgb,var(--clr-bg,#fff) 94%,var(--clr-text,#111) 6%)}
    .token-preview{height:112px;margin-bottom:12px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:32px}
    .token-preview--shadow{margin:12px;height:88px;background:var(--clr-bg,#fff)}.token-preview--spacing{justify-content:flex-start;padding:12px}.token-size-bar{display:block;height:40px;min-width:2px;max-width:100%;background:currentColor}.token-ratio-box{display:block;height:78px;max-width:90%;border:1px solid currentColor;border-radius:8px;background:color-mix(in srgb,currentColor 10%,transparent)}
    .token-motion-dot{width:28px;height:28px;border-radius:50%;background:currentColor;animation:token-travel 1s ease-in-out infinite alternate}.token-preview--duration .token-motion-dot,.token-preview--easing .token-motion-dot{align-self:center}
    .token-layer{position:relative;width:58px;height:58px;display:grid;place-items:center;border:1px solid currentColor;background:var(--clr-bg,#fff);transform:translate(12px,8px)}.token-layer--active{transform:translate(-12px,-8px)}
    .token-name{font:600 12px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.token-value{margin-top:5px;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;opacity:.65;overflow-wrap:anywhere}.token-alias,.token-context{margin-top:5px;font-size:10px;opacity:.5;overflow-wrap:anywhere}
    @keyframes token-travel{from{transform:translateX(-70px)}to{transform:translateX(70px)}}@media(prefers-reduced-motion:reduce){.token-motion-dot{animation:none!important}}
  </style>`;
  root.append(el("h1", "", heading));
  root.append(el("p", "token-intro", canonicalOnly
    ? "Active global CSS tokens from the production stylesheet. Component-local variables and commented-out theme presets are excluded."
    : "Live visual inventory. Values are read from the site CSS at runtime; Storybook owns no duplicate token values."));
  const toolbar = el("div", "token-toolbar");
  const search = el("input", "token-search"); search.type = "search"; search.placeholder = "filter tokens…"; search.setAttribute("aria-label", "Filter design tokens");
  const count = el("span", "token-count"); toolbar.append(search, count); root.append(toolbar);
  const content = el("div", "token-content"); root.append(content);
  const allTokens = buildTokens({ canonicalOnly }).filter(filter);
  const render = () => {
    content.replaceChildren();
    const query = search.value.trim().toLowerCase();
    const tokens = allTokens.filter((t) => `${t.name} ${t.raw} ${t.kind} ${t.selector || ""} ${t.media || ""} ${t.source || ""}`.toLowerCase().includes(query));
    count.textContent = `${tokens.length} / ${allTokens.length}`;
    const groups = groupTokensByKind(tokens);
    for (const [kind, items] of groups) {
      const section = el("section", "token-section"); section.append(el("h2", "", kind));
      const grid = el("div", "token-grid");
      for (const token of items) {
        const card = el("article", "token-card"); card.append(previewFor(token), el("div", "token-name", token.name), el("div", "token-value", token.raw));
        if (token.resolved !== token.raw) card.append(el("div", "token-value", `→ ${token.resolved}`));
        if (token.aliases.length) card.append(el("div", "token-alias", `aliases: ${token.aliases.join(", ")}`));
        const context = [token.selector, token.media && `@media ${token.media}`, token.source].filter(Boolean).join(" · ");
        if (context) card.append(el("div", "token-context", context));
        grid.append(card);
      }
      section.append(grid); content.append(section);
    }
  };
  search.addEventListener("input", render); render(); return root;
}

const meta = { title: "00 Foundations/Tokens", tags: ["autodocs", "stable"], parameters: { docs: { description: { component: "Browse live active foundations using the focused story entries. Overview is an audit of ALL CSS custom properties, including component-local vars. Focused foundations isolate global values; commented themes are excluded by CSSOM." } } } };
export default meta;
export const Overview = { render: () => tokenGallery(() => true, "all CSS declarations · audit (including component-local)") };
export const Colors = { render: () => tokenGallery((t) => ["color","gradient"].includes(t.kind), "active foundation colors", { canonicalOnly: true }) };
export const Typography = { render: () => tokenGallery((t) => ["font-family","font-size","font-weight","line-height","letter-spacing"].includes(t.kind), "active foundation typography", { canonicalOnly: true }) };
export const SpacingAndShape = { render: () => tokenGallery((t) => ["spacing","radius","border"].includes(t.kind), "active foundation spacing & shape", { canonicalOnly: true }) };
export const AspectRatios = { render: () => tokenGallery((t) => t.kind === "aspect-ratio", "aspect ratios") };
export const ResponsiveContexts = { render: () => tokenGallery((t) => Boolean(t.media), "responsive & media contexts") };
export const Surfaces = { render: () => tokenGallery((t) => ["shadow","opacity"].includes(t.kind), "active elevation tokens", { canonicalOnly: true }) };
export const Motion = { render: () => tokenGallery((t) => ["duration","easing"].includes(t.kind), "motion") };
export const Layers = { render: () => tokenGallery((t) => /^--layer-/.test(t.name), "global layer order", { canonicalOnly: true }) };


// These focused, canonical foundations are grouped by the actual production
// token prefixes. They intentionally do not instantiate page organisms.
const canonical = { canonicalOnly: true };
export const FontFamilies = { render: () => tokenGallery((t) => /^--ff-/.test(t.name), "font families", canonical) };
export const FontWeights = { render: () => tokenGallery((t) => /^--fw-/.test(t.name), "font weights", canonical) };
export const TypeScale = { render: () => tokenGallery((t) => /^--fs-/.test(t.name), "fluid type scale", canonical) };
export const LineHeights = { render: () => tokenGallery((t) => /^--lh-/.test(t.name), "line-height roles", canonical) };
export const LetterSpacing = { render: () => tokenGallery((t) => /^--ls-/.test(t.name), "letter-spacing roles", canonical) };
export const SemanticColors = { render: () => tokenGallery((t) => /^--clr-/.test(t.name), "active semantic colors", canonical) };
export const SurfaceColors = { render: () => tokenGallery((t) => /^--clr-(?:surface|bg|text|foreground|selection)/.test(t.name), "surfaces & readable ink", canonical) };
export const BorderWidths = { render: () => tokenGallery((t) => /^--border-width-/.test(t.name), "border widths", canonical) };
export const RadiusScale = { render: () => tokenGallery((t) => /^--radius-|^--control-radius/.test(t.name), "radii & editorial corners", canonical) };
export const Shadows = { render: () => tokenGallery((t) => /^--shadow-/.test(t.name), "elevation & focus shadows", canonical) };
export const SpacingScale = { render: () => tokenGallery((t) => /^--(?:size|space)-|^--page-padding-/.test(t.name), "fluid & semantic spacing", canonical) };
export const ContentWidths = { render: () => tokenGallery((t) => /^--content-|^--page-padding-/.test(t.name), "content measures & page gutters", canonical) };
export const MotionSpeeds = { render: () => tokenGallery((t) => /^--motion-speed-/.test(t.name), "motion speed primitives (px/s)", canonical) };
export const ControlGeometry = { render: () => tokenGallery((t) => /^--control-/.test(t.name), "global control geometry (no control organisms)", canonical) };
