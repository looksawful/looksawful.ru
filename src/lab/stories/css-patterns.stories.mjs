const meta = {
  title: "04 Layout/CSS Patterns",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

// Visual specimens use the site's production CSS primitives, never copied
// Storybook-only layout implementations. The extra labels are reference notes.
const productionPatterns = [
  {
    name: "wrapper", usage: "project intro / portfolio content",
    description: "Centered readable measure with a fluid page gutter",
    preview: `<div class="wrapper" style="--wrapper-max-width:26rem"><div class="pattern-tile">Content stays centered</div></div>`,
  },
  {
    name: "stack", usage: "section renderers / media",
    description: "Uniform vertical rhythm between direct children",
    preview: `<div class="stack" style="--stack-space:var(--size-200)"><div class="pattern-tile">A</div><div class="pattern-tile">B</div><div class="pattern-tile">C</div></div>`,
  },
  {
    name: "cluster", usage: "navigation / resource links",
    description: "Items wrap naturally, without width-specific breakpoints",
    preview: `<div class="cluster"><span class="pattern-tile">Primary</span><span class="pattern-tile">Secondary</span><span class="pattern-tile">Longer item</span></div>`,
  },
  {
    name: "pile", usage: "media overlays / galleries",
    description: "Two layers share one grid cell; the foreground remains in flow",
    preview: `<div class="pile" style="block-size:9rem"><div class="pattern-tile" aria-hidden="true" style="inline-size:100%;block-size:100%;opacity:.5"></div><strong class="pattern-tile">Foreground</strong></div>`,
  },
  {
    name: "grid", usage: "media groups / project compositions",
    description: "Explicit columns controlled through local CSS properties",
    preview: `<div class="grid" style="--grid-columns:repeat(3,minmax(0,1fr));--grid-gap:var(--size-200)"><div class="pattern-tile">1</div><div class="pattern-tile">2</div><div class="pattern-tile">3</div></div>`,
  },
  {
    name: "auto-grid", usage: "defined utility; no confirmed site consumer",
    description: "Intrinsic auto-fit minmax columns, ready when the layout needs them",
    preview: `<div class="auto-grid" style="--auto-grid-min:12rem"><div class="pattern-tile">Card A</div><div class="pattern-tile">Card B</div><div class="pattern-tile">Card C</div></div>`,
  },
  {
    name: "split", usage: "entity-page sections",
    description: "Responsive two-part composition with intrinsic wrapping",
    preview: `<div class="split" style="--split-min:13rem"><div class="pattern-tile">Content</div><div class="pattern-tile">Media</div></div>`,
  },
  {
    name: "text-pair", usage: "section intro / expertise",
    description: "Asymmetric headline and copy that wrap by content",
    preview: `<div class="text-pair" style="--text-pair-content-min:45%"><strong class="pattern-tile">Heading</strong><p class="pattern-tile">A longer paragraph that keeps its readable measure.</p></div>`,
  },
];

export const LayoutPrimitives = {
  render: () => `<main class="wrapper stack" style="--stack-space:var(--size-400);padding-block:var(--size-400);overflow-wrap:anywhere">
    <style>
      .pattern-tile{display:block;min-inline-size:0;margin:0;padding:var(--size-200);background:var(--clr-surface-raised);overflow-wrap:anywhere}
    </style>
    <h1>CSS layout patterns</h1>
    <p>Eight layout utilities from <code>src/styles/patterns.css</code>. Resize the viewport to see how they wrap.</p>
    <div class="auto-grid" style="--auto-grid-min:22rem">
      ${productionPatterns.map((pattern) => `<section class="stack" data-css-pattern="${pattern.name}" style="--stack-space:var(--size-200)">
        <h2><code>.${pattern.name}</code></h2>
        <p>${pattern.description}</p>
        <div>${pattern.preview}</div>
        <small>src/styles/patterns.css · ${pattern.usage}</small>
      </section>`).join("")}
    </div>
  </main>`,
  parameters: {
  },
};
