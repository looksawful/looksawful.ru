import { jesteiIntro } from "../../data/content/jestei-pool.ts";
import { progressTraditionIntro } from "../../data/content/progress-tradition.ts";
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
        ${renderProjectIntro(progressTraditionIntro)}
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
        story: "The longest current text-title case, Издательство Прогресс-Традиция, exercises the 16ch art-direction measure against a real logo-title case. Logo titles use the editorial grid track and never inherit a character-based width cap.",
      },
    },
  },
};


export const ReelHorizontalOverflow = {
  render: () => `
    <main style="padding:clamp(1.5rem,4vw,4rem)">
      <div
        class="reel"
        style="--reel-gap:1rem;--reel-item-size:min(72vw,18rem);--reel-snap-type:inline mandatory;--reel-snap-align:center;padding-block:1rem"
      >
        ${["01", "02", "03", "04", "05"].map((label) => `
          <article style="display:grid;place-items:end start;min-block-size:14rem;padding:1rem;border:1px solid currentColor;border-radius:1rem">
            <strong>${label}</strong>
          </article>
        `).join("")}
      </div>
    </main>
  `,
  parameters: {
    looksawful: { state: "horizontal-overflow-reel" },
    docs: {
      description: {
        story: "Reel owns horizontal overflow, snapping and hidden-scrollbar mechanics. Consumers provide item geometry and may switch those mechanics off through reel custom properties.",
      },
    },
  },
};


export const ClusterPeers = {
  render: () => `
    <main style="padding:clamp(1.5rem,4vw,4rem)">
      <nav class="cluster" aria-label="Пример cluster" style="--cluster-space:0.75rem">
        <a href="#one">Первый</a>
        <a href="#two">Второй пункт</a>
        <a href="#three">Третий</a>
        <button type="button">Действие</button>
      </nav>
    </main>
  `,
  parameters: {
    looksawful: { state: "peer-inline-cluster" },
    docs: {
      description: {
        story: "Cluster owns wrapping adjacency between peer inline controls or labels. It does not express heading-to-copy hierarchy.",
      },
    },
  },
};

export const SplitIntrinsic = {
  render: () => `
    <main style="container-type:inline-size;padding:clamp(1.5rem,4vw,4rem)">
      <section class="split" style="--split-min:18rem;--split-gap:clamp(1rem,4cqi,3rem)">
        <article style="min-block-size:12rem;padding:1rem;border:1px solid currentColor">
          <h2>Первый контейнер</h2>
          <p>Split создаёт следующую колонку только когда для неё действительно хватает места.</p>
        </article>
        <article style="min-block-size:12rem;padding:1rem;border:1px solid currentColor">
          <h2>Второй контейнер</h2>
          <p>Точка перехода определяется содержимым и доступной шириной, а не названием устройства.</p>
        </article>
      </section>
    </main>
  `,
  parameters: {
    looksawful: { state: "intrinsic-container-split" },
    docs: {
      description: {
        story: "Split owns intrinsic composition of peer containers. It may collapse to one column when authored minimums no longer fit.",
      },
    },
  },
};

export const SplitAlwaysAuthoredPair = {
  render: () => `
    <main style="container-type:inline-size;padding:clamp(1.5rem,4vw,4rem)">
      <section class="split split-always" style="--split-min:8rem;--split-gap:clamp(0.75rem,3cqi,1.5rem)">
        <figure style="min-block-size:12rem;margin:0;padding:1rem;border:1px solid currentColor">
          <figcaption>Левая авторизованная часть</figcaption>
        </figure>
        <figure style="min-block-size:12rem;margin:0;padding:1rem;border:1px solid currentColor">
          <figcaption>Правая авторизованная часть</figcaption>
        </figure>
      </section>
    </main>
  `,
  parameters: {
    looksawful: { state: "authored-persistent-split" },
    docs: {
      description: {
        story: "Split Always is reserved for explicit two-part compositions that must remain divided. It is not a typography-flow mechanism and must never turn separate prose paragraphs into layout columns.",
      },
    },
  },
};

export const PileOverlap = {
  render: () => `
    <main style="padding:clamp(1.5rem,4vw,4rem)">
      <figure class="pile" style="max-inline-size:28rem;margin:0;--pile-place-items:end start">
        <div style="inline-size:100%;aspect-ratio:4/3;border:1px solid currentColor"></div>
        <figcaption style="padding:1rem">Наложенный слой</figcaption>
      </figure>
    </main>
  `,
  parameters: {
    looksawful: { state: "overlap-pile" },
    docs: {
      description: {
        story: "Pile owns deliberate overlap. All direct children share one grid area; it is not a vertical stack substitute.",
      },
    },
  },
};

export const AutoGridAdaptive = {
  render: () => `
    <main style="container-type:inline-size;padding:clamp(1.5rem,4vw,4rem)">
      <ul class="auto-grid" style="--auto-grid-min:12rem;--auto-grid-gap:1rem;list-style:none;padding:0;margin:0">
        ${["Figma", "CSS", "TypeScript", "Three.js", "Blender", "GSAP"].map((label) => `
          <li style="padding:1rem;border:1px solid currentColor">${label}</li>
        `).join("")}
      </ul>
    </main>
  `,
  parameters: {
    looksawful: { state: "adaptive-auto-grid" },
    docs: {
      description: {
        story: "Auto Grid owns repeated equal-role items with intrinsic column count. Consumers provide only the preferred item minimum and gaps.",
      },
    },
  },
};

export const GridExplicitTracks = {
  render: () => `
    <main style="container-type:inline-size;padding:clamp(1.5rem,4vw,4rem)">
      <div class="grid" style="--grid-columns:minmax(0,2fr) minmax(0,1fr);--grid-gap:1rem">
        <div style="min-block-size:10rem;padding:1rem;border:1px solid currentColor">2fr</div>
        <div style="min-block-size:10rem;padding:1rem;border:1px solid currentColor">1fr</div>
      </div>
    </main>
  `,
  parameters: {
    looksawful: { state: "explicit-grid-tracks" },
    docs: {
      description: {
        story: "Grid is the low-level explicit track primitive. Consumers own the track definition; use a more semantic primitive when one already matches the composition.",
      },
    },
  },
};

export const EditorialGridProjectIntro = {
  render: () => `
    <main style="container-type:inline-size">
      <section class="project">
        ${renderProjectIntro(progressTraditionIntro)}
      </section>
    </main>
  `,
  parameters: {
    looksawful: { state: "editorial-grid-project-intro" },
    docs: {
      description: {
        story: "Editorial Grid owns authored page-level tracks. The real project intro is the canonical consumer.",
      },
    },
  },
};


export const WrapperContainer = {
  render: () => `
    <main style="padding-block:2rem;border-block:1px solid currentColor">
      <div class="wrapper" style="--wrapper-max-width:48rem">
        <p>Wrapper owns centered page/container width and gutters. Content semantics live inside it.</p>
      </div>
    </main>
  `,
  parameters: {
    looksawful: { state: "wrapper-container" },
    docs: {
      description: {
        story: "Wrapper owns centered maximum width plus inline gutters. It is a container boundary, not a typography measure.",
      },
    },
  },
};
