import { jesteiIntro } from "../../data/content/jestei-pool.ts";
import { sensetiqueProductionIntro } from "../../data/content/sensetique.ts";
import { renderProjectIntro } from "../../templates/project-intro.ts";
import { renderSectionIntro } from "../../templates/section-intro.ts";

const sampleCopy = {
  title: "Типографический ритм",
  paragraphs: [
    "Первый абзац образует обычный текстовый поток.",
    "Второй абзац сохраняет тот же вертикальный ритм.",
  ],
};

const renderComparison = () => `
  <main class="grid" style="--grid-columns:repeat(auto-fit,minmax(min(22rem,100%),1fr));--grid-gap:clamp(2rem,5vw,5rem);padding:clamp(1.5rem,4vw,4rem)">
    <section>
      <p style="margin:0 0 1rem;font:600 0.75rem/1.2 ui-monospace,monospace;text-transform:uppercase">prose</p>
      <article class="prose">
        <h2>Главный заголовок</h2>
        <p>Абзац после крупного заголовка получает расстояние от собственного размера шрифта.</p>
        <p>Соседние абзацы сохраняют читаемый вертикальный поток.</p>
        <h3>Подзаголовок</h3>
        <p>Перед новым уровнем иерархии расстояние меняется без таблицы специальных селекторов.</p>
      </article>
    </section>
    <section>
      <p style="margin:0 0 1rem;font:600 0.75rem/1.2 ui-monospace,monospace;text-transform:uppercase">stack</p>
      <article class="stack">
        <h2>Главный заголовок</h2>
        <p>Stack задаёт одинаковый gap между контейнерными детьми.</p>
        <p>Он не выражает типографическую иерархию текста.</p>
        <h3>Подзаголовок</h3>
        <p>Это другой контракт, даже если результат иногда кажется похожим.</p>
      </article>
    </section>
  </main>
`;

const meta = {
  title: "00 Foundations/CSS Patterns",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/styles/patterns.css",
        "src/styles/project-shell.css",
        "src/templates/project-intro.ts",
        "src/templates/section-intro.ts",
        "src/data/content/jestei-pool.ts",
        "src/data/content/sensetique.ts",
      ],
      layer: "foundation",
      policy: "composition",
      canonical: true,
      state: "typographic-flow",
      visibility: ["always"],
      interaction: ["default"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component: "Canonical layout-pattern specimens. Prose owns direct-child typographic rhythm; Stack owns uniform container rhythm; Text Pair owns asymmetric heading-to-copy composition. Sensetique Production exercises the real multi-paragraph section-intro renderer.",
      },
    },
  },
};

export default meta;

export const ProseVsStack = {
  render: renderComparison,
};

export const ProseSimple = {
  render: () => `
    <main style="max-inline-size:48rem;padding:clamp(1.5rem,4vw,4rem)">
      <article class="prose">
        <h2>${sampleCopy.title}</h2>
        ${sampleCopy.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </article>
    </main>
  `,
  parameters: {
    looksawful: { state: "prose-flow" },
  },
};

export const TextPairSensetiqueProduction = {
  render: () => `
    <main style="container-type:inline-size;padding:clamp(1.5rem,4vw,4rem)">
      ${renderSectionIntro(sensetiqueProductionIntro, { reveal: false })}
    </main>
  `,
  parameters: {
    looksawful: { state: "intrinsic-text-pair" },
  },
};


export const ProjectTitleMeasure = {
  render: () => `
    <main class="stack" style="--stack-space:clamp(3rem,7vw,7rem);padding:clamp(1.5rem,4vw,4rem)">
      <section class="project">
        ${renderProjectIntro({
          title: { type: "text", text: "Длинный текстовый заголовок проекта" },
          lead: "Текстовый title сохраняет читаемую меру 16ch как часть типографической арт-дирекции.",
        })}
      </section>
      <section class="project">
        ${renderProjectIntro(jesteiIntro)}
      </section>
    </main>
  `,
  parameters: {
    looksawful: { state: "project-title-measure" },
    docs: {
      description: {
        story: "Text project titles keep the 16ch typographic measure. Logo titles use the editorial grid track and never inherit a character-based width cap.",
      },
    },
  },
};


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
  render: () => `<main class="pattern-catalog">
    <style>
      .pattern-catalog{padding:clamp(1rem,3vw,3rem);background:var(--clr-bg);color:var(--clr-text);font-family:var(--ff-primary,system-ui,sans-serif)}
      .pattern-catalog h1{margin:0 0 .6rem;font-size:var(--fs-700);line-height:var(--lh-heading)}
      .pattern-catalog__intro{max-inline-size:70ch;margin:0 0 2rem;line-height:var(--lh-copy)}
      .pattern-catalog__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(22rem,100%),1fr));gap:var(--size-400)}
      .pattern-catalog__item{min-inline-size:0;padding-block:var(--size-300);border-block-start:var(--border-width-100) solid var(--clr-border)}
      .pattern-catalog__item h2{margin:0 0 .5rem;font-size:var(--fs-500);font-weight:var(--fw-600)}
      .pattern-catalog__item p{margin:0 0 .7rem;color:var(--clr-text-muted);font-size:var(--fs-300)}
      .pattern-catalog__sample{min-inline-size:0;padding:var(--size-300);background:var(--clr-surface-page)}
      .pattern-catalog__source{display:block;margin-top:.75rem;font:var(--fs-200)/var(--lh-copy) var(--ff-mono);overflow-wrap:anywhere}
      .pattern-tile{display:block;min-inline-size:0;margin:0;padding:var(--size-200);background:var(--clr-surface-raised);outline:1px solid var(--clr-border);font-size:var(--fs-300);overflow-wrap:anywhere}
    </style>
    <h1>CSS layout patterns</h1>
    <p class="pattern-catalog__intro">Read-only specimens from src/styles/patterns.css. These are actual site selectors, not a parallel CSS implementation. Prose and real text-pair content have separate examples beside this gallery. Research: <a href="https://github.com/looksawful/evangelistic-css/blob/main/docs/02-patterns.md">evangelistic-css</a>; original inspiration: <a href="https://github.com/kevin-powell/responsive-design-patterns">Kevin Powell</a>.</p>
    <div class="pattern-catalog__grid">
      ${productionPatterns.map((pattern) => `<section class="pattern-catalog__item">
        <h2><code>.${pattern.name}</code></h2>
        <p>${pattern.description}</p>
        <div class="pattern-catalog__sample">${pattern.preview}</div>
        <span class="pattern-catalog__source">src/styles/patterns.css · ${pattern.usage}</span>
      </section>`).join("")}
    </div>
  </main>`,
  parameters: {
    looksawful: {
      state: "read-only-production-patterns",
      sources: ["src/styles/patterns.css", "src/lab/stories/layout-patterns.stories.mjs"],
    },
  },
};
