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
  title: "00 Foundations/Layout Patterns",
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
