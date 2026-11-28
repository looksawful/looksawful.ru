import tokensCss from "../../styles/tokens.css?raw";
import colorsCss from "../../styles/colors.css?raw";

// Only these two global CSS owners define this catalog. Component-local
// variables and preserved project palettes must not become global tokens.
const tokens = [
  ...tokensCss.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g),
  ...colorsCss.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g),
].map(([, name, value]) => ({ name, value: value.trim().replace(/\s+/g, " ") }));

const layout = `
  .foundation-tokens { padding:var(--page-padding-inline); background:var(--clr-bg); color:var(--clr-text); min-block-size:100vh; }
  .foundation-tokens h1 { font-size:var(--fs-600); margin-block-end:var(--size-400); }
  .foundation-tokens__row { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:var(--size-300); padding-block:var(--size-300); border-block-start:var(--border-width-100) solid var(--clr-border); }
  .foundation-tokens__row > * { min-inline-size:0; overflow-wrap:anywhere; }
  .foundation-tokens__row h2 { font:var(--fw-600) var(--fs-300)/var(--lh-ui) var(--ff-mono); }
  .foundation-tokens__row code { display:block; font-size:var(--fs-200); }
  .foundation-tokens__preview { margin-block-start:var(--size-200); block-size:var(--size-600); max-inline-size:100%; overflow:hidden; background:var(--clr-surface-raised); }
  .foundation-tokens__preview--length { background:var(--clr-foreground); block-size:var(--size-200); }
`;

function catalog(title, pattern) {
  const root = document.createElement("main");
  root.className = "foundation-tokens";
  const style = document.createElement("style");
  style.textContent = layout;
  const heading = document.createElement("h1");
  heading.textContent = title;
  root.append(style, heading);

  for (const { name, value } of tokens.filter((token) => pattern.test(token.name))) {
    const row = document.createElement("section");
    row.className = "foundation-tokens__row";
    row.dataset.token = name;
    const label = document.createElement("h2");
    label.textContent = name;
    const detail = document.createElement("div");
    const formula = document.createElement("code");
    formula.textContent = value;
    const preview = document.createElement("div");
    preview.className = "foundation-tokens__preview";
    preview.setAttribute("aria-hidden", "true");
    const cssValue = `var(${name})`;
    if (name.startsWith("--clr-")) preview.style.background = cssValue;
    else if (name.startsWith("--shadow-")) {
      preview.style.boxShadow = cssValue;
      // Keep room around shadows; clipping would hide the elevation sample.
      preview.style.margin = "var(--size-400)";
      detail.style.paddingBlockEnd = "var(--size-300)";
    } else if (name.startsWith("--radius-") || name === "--control-radius") {
      preview.style.borderRadius = cssValue;
      preview.style.border = "var(--border-width-100) solid var(--clr-foreground)";
    } else if (name.startsWith("--border-width-")) {
      preview.style.border = `${cssValue} solid var(--clr-foreground)`;
    } else if (/^--(size-|space-|content-|page-padding|control-)/.test(name)) {
      preview.classList.add("foundation-tokens__preview--length");
      preview.style.inlineSize = `min(${cssValue}, 100%)`;
    } else if (/^--(ff-|fs-|fw-|lh-|ls-)/.test(name)) {
      preview.textContent = "Аа Bb 0123";
      preview.style.blockSize = "auto";
      preview.style.minBlockSize = "var(--size-600)";
      preview.style.overflow = "visible";
      const property = { ff: "fontFamily", fs: "fontSize", fw: "fontWeight", lh: "lineHeight", ls: "letterSpacing" }[name.slice(2, 4)];
      preview.style[property] = cssValue;
    } else preview.textContent = value;
    detail.append(formula, preview);
    row.append(label, detail);
    root.append(row);
  }
  return root;
}

export default {
  title: "00 Foundations/Design Tokens",
  parameters: { layout: "fullscreen" },
};

export const Colors = { render: () => catalog("Цвета и поверхности · colors.css", /^--clr-/) };
export const Spacing = { render: () => catalog("Размеры и отступы · tokens.css", /^--(size-|space-)/) };
export const Containers = { render: () => catalog("Ширины и поля · tokens.css", /^--(content-|page-padding)/) };
export const ShapeAndElevation = { render: () => catalog("Радиусы, границы, тени и контролы · tokens.css", /^--(radius-|border-width-|shadow-|control-)/) };
export const TypeScale = { render: () => catalog("Типографические токены · tokens.css", /^--(ff-|fs-|fw-|lh-|ls-)/) };
export const MotionAndLayers = { render: () => catalog("Скорость и слои · tokens.css", /^--(motion-|layer-)/) };
