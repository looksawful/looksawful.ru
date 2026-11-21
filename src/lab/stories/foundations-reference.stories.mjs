// Owner-provided MiroMiro extraction, 21 Nov 2026.
// These numeric labels are NOT live CSS variables, system decisions or theme presets.
// They are reference samples to reconcile with the canonical semantic token API.
import { referenceTokens } from "../foundations-reference-data.mjs";

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}

const styles = `
  <style>
    .extracted-foundation{padding:clamp(1.25rem,4vw,3rem);color:var(--clr-text,#111);background:var(--clr-bg,#fff);font-family:var(--ff-primary,system-ui,sans-serif);min-height:100vh}
    .extracted-foundation *{box-sizing:border-box}
    .extracted-foundation h1{font-size:clamp(1.75rem,3vw,3rem);margin:0 0 1rem}
    .extracted-foundation p{max-width:70ch;margin:0 0 1.5rem;line-height:var(--lh-copy,1.45)}
    .extracted-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(14rem,100%),1fr));gap:1rem}
    .extracted-token{min-inline-size:0;padding:1rem;border:1px solid var(--clr-border,#ccc)}
    .extracted-token strong,.extracted-token code{display:block;overflow-wrap:anywhere}
    .extracted-token strong{font:600 .8rem/1.4 var(--ff-mono,monospace)}
    .extracted-token code{font:.75rem/1.5 var(--ff-mono,monospace);margin-top:.35rem}
    .extracted-sample{display:flex;align-items:center;justify-content:center;min-block-size:6rem;margin-bottom:.85rem;overflow:hidden}
    .extracted-sample--color{border:1px solid var(--clr-border,#ccc)}
    .extracted-sample--text{line-height:1.1;white-space:nowrap}
    .extracted-sample--space{justify-content:flex-start}
    .extracted-space-bar{display:block;block-size:1.75rem;min-inline-size:1px;background:currentColor}
    .extracted-sample--radius{border:2px solid currentColor;background:color-mix(in srgb,currentColor 5%,transparent)}
    .extracted-sample--shadow{padding:1.5rem}
    .extracted-shadow-box{inline-size:75%;block-size:3.25rem;background:var(--clr-surface,#fff)}
  </style>`;

function example(token) {
  const value = escapeHtml(token.value);
  if (token.kind === "color") return `<div class="extracted-sample extracted-sample--color" style="background:${value}"></div>`;
  if (token.kind === "text") return `<div class="extracted-sample extracted-sample--text" style="font-size:min(3rem,${value})">Aa Аа</div>`;
  if (token.kind === "space") return `<div class="extracted-sample extracted-sample--space"><span class="extracted-space-bar" style="inline-size:min(100%,${value})"></span></div>`;
  if (token.kind === "radius") return `<div class="extracted-sample extracted-sample--radius" style="border-radius:${value}">radius</div>`;
  return `<div class="extracted-sample extracted-sample--shadow"><span class="extracted-shadow-box" style="box-shadow:${value}"></span></div>`;
}

function referenceGallery(kinds, heading) {
  const tokens=referenceTokens.filter((token)=>kinds.includes(token.kind));
  return `<main class="extracted-foundation" data-foundation-reference="unapproved">
    ${styles}
    <h1>${escapeHtml(heading)}</h1>
    <p>Reference-only extraction supplied by the owner. Numeric names are NOT production tokens. Samples show the supplied raw values; long text is capped visually. Do not copy these into global CSS without a semantic mapping and approval.</p>
    <div class="extracted-grid">
      ${tokens.map((token)=>`<article class="extracted-token" data-reference-token="${token.name}">
        ${example(token)}
        <strong>${escapeHtml(token.name)}</strong><code>${escapeHtml(token.value)}</code>
      </article>`).join("")}
    </div>
  </main>`;
}

const meta={
  title:"90 Experimental/Extracted Reference Tokens",
  tags:["autodocs"],
  parameters:{
    layout:"fullscreen",
    looksawful:{
      sources:["src/lab/stories/foundations-reference.stories.mjs","src/lab/foundations-reference-data.mjs","src/styles/tokens.css","src/styles/colors.css"],
      layer:"foundation",
      policy:"reference-only",
      canonical:false,
      state:"unapproved",
      visibility:["always"],
      interaction:["default"],
      responsive:{review:["desktop","tablet","mobile"]},
    },
    docs:{description:{component:"Owner-provided extract. All 38 values are kept exact but intentionally NOT installed as CSS custom properties. No commented-out palette is advertised as live."}},
  },
};
export default meta;

export const ExtractedColors={render:()=>referenceGallery(["color"],"raw color references · 18")};
export const ExtractedTypography={render:()=>referenceGallery(["text"],"raw text-size references · 6")};
export const ExtractedSpacing={render:()=>referenceGallery(["space"],"raw spacing references · 7")};
export const ExtractedEffects={render:()=>referenceGallery(["radius","shadow"],"raw radius & shadow references · 7")};
