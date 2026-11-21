import { buildTokenRegistry, groupTokensByKind, canonicalFoundationGroup, isCanonicalFoundationDeclaration, resolveTokenValue } from "../token-visualization.mjs";

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
  if (token.kind === "color") preview.style.background = value;
  else if (token.kind === "radius") preview.style.borderRadius = value;
  else if (token.kind === "shadow") preview.style.boxShadow = value;
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
  } else if (token.kind === "z-index") {
    preview.innerHTML = '<span class="token-layer">1</span><span class="token-layer token-layer--active">z</span>';
    preview.lastElementChild.style.zIndex = value;
  } else preview.textContent = token.resolved;
  return preview;
}

function buildTokens() {
  const declarations = collectCustomProperties().filter(isCanonicalFoundationDeclaration);
  const values = new Map(declarations.map(({ name, raw }) => [name, raw]));
  return buildTokenRegistry(declarations)
    .map((token) => ({ ...token, resolved: resolveTokenValue(token.raw, values) }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

function tokenGallery(filter, heading) {
  const root = el("main", "token-foundations");
  root.innerHTML = `<style>
    .token-foundations{min-height:100vh;padding:clamp(20px,4vw,48px);background:var(--clr-bg,#fff);color:var(--clr-text,#111);font-family:var(--ff-primary,Inter,system-ui,sans-serif)}
    .token-foundations *{box-sizing:border-box}.token-foundations h1{margin:0 0 10px;font-size:clamp(32px,4vw,52px);line-height:1;overflow-wrap:anywhere}.token-intro{max-width:70ch;margin:0 0 28px;color:var(--clr-text-muted,#555);line-height:1.45}
    .token-toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:0 0 24px}.token-search{width:min(440px,100%);padding:12px 14px;border:1px solid var(--clr-border,#ccc);border-radius:10px;background:transparent;color:inherit;font:inherit}
    .token-count{font-size:13px;color:var(--clr-text-muted,#555);font-variant-numeric:tabular-nums}.token-section{margin:36px 0}.token-section h2{text-transform:lowercase;margin:0 0 14px;font-size:20px}.token-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(290px,100%),1fr));gap:0 24px}
    .token-card{min-width:0;padding:16px 0 18px;border-block-start:1px solid var(--clr-border,#ddd)}
    .token-preview{min-height:74px;height:74px;margin-bottom:12px;border:1px solid var(--clr-border,#ddd);border-radius:var(--radius-contained,12px);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:32px}.token-preview--font-size{height:auto;min-height:132px;padding:16px 12px;line-height:1;overflow:visible}
    .token-preview--shadow{margin:12px;height:88px;background:var(--clr-bg,#fff)}.token-preview--spacing{justify-content:flex-start;padding:12px}.token-size-bar{display:block;height:40px;min-width:2px;max-width:100%;background:currentColor}
    .token-layer{position:relative;width:58px;height:58px;display:grid;place-items:center;border:1px solid currentColor;background:var(--clr-bg,#fff);transform:translate(12px,8px)}.token-layer--active{transform:translate(-12px,-8px)}
    .token-name{font:600 14px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.token-value{margin-top:4px;font:13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--clr-text-muted,#555);overflow-wrap:anywhere}.token-details{margin-top:10px;font-size:13px;color:var(--clr-text-muted,#555)}.token-details summary{width:max-content;max-width:100%;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.token-detail-content{margin-top:8px;overflow-wrap:anywhere}.token-empty{padding:32px 0;color:var(--clr-text-muted,#555);overflow-wrap:anywhere}.token-search:focus-visible,.token-details summary:focus-visible{outline:2px solid var(--clr-foreground,#111);outline-offset:3px}
  </style>`;
  root.append(el("h1", "", heading));
  root.append(el("p", "token-intro", "Current site tokens only. Search by name or value; expand a token to see its source."));
  const toolbar = el("div", "token-toolbar");
  const search = el("input", "token-search"); search.type = "search"; search.placeholder = "Search tokens"; search.setAttribute("aria-label", "Filter design tokens");
  const count = el("span", "token-count"); toolbar.append(search, count); root.append(toolbar);
  const content = el("div", "token-content"); content.id = "token-gallery-results"; search.setAttribute("aria-controls", content.id); root.append(content);
  const allTokens = buildTokens().filter(filter);
  const render = () => {
    content.replaceChildren();
    const query = search.value.trim().toLowerCase();
    const tokens = allTokens.filter((t) => `${t.name} ${t.raw} ${t.kind} ${t.selector || ""} ${t.media || ""} ${t.source || ""}`.toLowerCase().includes(query));
    count.textContent = `${tokens.length} of ${allTokens.length}`;
    if (!tokens.length) {
      const empty = el("p", "token-empty", `No tokens match "${search.value.trim()}".`);
      empty.setAttribute("role", "status");
      content.append(empty);
      return;
    }
    const groups = groupTokensByKind(tokens);
    for (const [kind, items] of groups) {
      const section = el("section", "token-section"); section.append(el("h2", "", kind));
      const grid = el("div", "token-grid");
      for (const token of items) {
        const card = el("article", "token-card");
        card.append(previewFor(token), el("div", "token-name", token.name), el("div", "token-value", token.raw));
        const details = el("details", "token-details");
        details.append(el("summary", "", "Source and aliases"));
        const source = token.name.startsWith("--clr-") ? "src/styles/colors.css" : "src/styles/tokens.css";
        const context = [token.selector, token.media && `@media ${token.media}`, source].filter(Boolean).join(" · ");
        details.append(el("div", "token-detail-content", context));
        if (token.resolved !== token.raw) details.append(el("div", "token-detail-content", `Resolved: ${token.resolved}`));
        if (token.aliases.length) details.append(el("div", "token-detail-content", `Aliases: ${token.aliases.join(", ")}`));
        card.append(details);
        grid.append(card);
      }
      section.append(grid); content.append(section);
    }
  };
  search.addEventListener("input", render); render(); return root;
}

const meta = {
  title: "00 Foundations/Design Tokens",
  tags: ["autodocs", "stable"],
  parameters: {
    docs: { description: { component: "Read-only, source-backed production foundations. Every active global CSS token appears in exactly one thematic story; experimental and local CSS values are not canonical." } },
    looksawful: {
      sources: ["src/styles/tokens.css", "src/styles/colors.css"],
      layer: "foundation",
      policy: "isolated",
      canonical: true,
      state: "read-only",
      visibility: ["always"],
    },
  },
};
export default meta;

const group = (name, heading) => ({
  render: () => tokenGallery((token) => canonicalFoundationGroup(token.name) === name, heading),
});

export const Palette = group("palette", "production color palette");
export const Typography = group("typography", "typography · families, sizes, rhythm");
export const SpacingAndLayout = group("spacing", "spacing · measures · gutters");
export const ShapeAndElevation = group("shape", "borders · radii · surfaces · controls");
export const MotionAndLayers = group("motion", "motion speeds · stacking layers");
