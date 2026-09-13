import "../styles/index.css";
import "./blog-preview.css";

type BlogKind = "tool" | "course" | "tutorial" | "note";

type PreviewEntry = {
  readonly title: string;
  readonly summary: string;
  readonly kind: BlogKind;
  readonly date: string;
  readonly source: string;
  readonly topics: readonly string[];
  readonly href?: string;
};

const FILTER_LABELS: readonly [BlogKind | "all", string][] = [
  ["all", "все"],
  ["tool", "инструменты"],
  ["course", "курсы"],
  ["tutorial", "уроки"],
  ["note", "заметки"],
];

const KIND_LABELS: Record<BlogKind, string> = {
  tool: "инструмент",
  course: "курс",
  tutorial: "урок",
  note: "заметка",
};

const entries: readonly PreviewEntry[] = [
  {
    title: "AWFUL STUDIO: как я собираю виртуальную предметную студию в Blender",
    summary: "Рабочие заметки о Blender-native инструменте для предметной и рекламной работы: студия, свет, камера, движение и автоматизация без закрытого конструктора.",
    kind: "tool",
    date: "12.09.2026",
    source: "looksawful / GitHub",
    topics: ["blender", "3d", "workflow"],
    href: "/lab/blog/?view=article",
  },
  {
    title: "Conquering Responsive Layouts — Kevin Powell",
    summary: "Курс, который я использую как базовую точку отсчёта для адаптивной вёрстки и современных CSS-layout подходов.",
    kind: "course",
    date: "08.09.2026",
    source: "Kevin Powell",
    topics: ["css", "responsive"],
  },
  {
    title: "You probably want position: sticky instead of fixed",
    summary: "Один из сохранённых материалов Kevin Powell, к которому удобно возвращаться при проектировании закреплённых элементов интерфейса.",
    kind: "tutorial",
    date: "07.09.2026",
    source: "Kevin Powell",
    topics: ["css", "layout"],
  },
  {
    title: "Discover three.js",
    summary: "Курс Lewy Blue в моей рабочей библиотеке по Three.js: не витрина сертификатов, а источник, к которому можно вернуться в реальной задаче.",
    kind: "course",
    date: "05.09.2026",
    source: "Lewy Blue",
    topics: ["three.js", "webgl"],
  },
  {
    title: "The Book of Shaders",
    summary: "Интерактивный материал Patricio Gonzalez Vivo и Jen Lowe, который остаётся полезным визуальным справочником по GLSL и шейдерам.",
    kind: "note",
    date: "02.09.2026",
    source: "Patricio Gonzalez Vivo & Jen Lowe",
    topics: ["glsl", "shaders"],
  },
];

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing blog preview element: ${selector}`);
  return element;
}

const root = required<HTMLElement>("#blog-preview-root");

function formatCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} материалов`;
  if (mod10 === 1) return `${count} материал`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} материала`;
  return `${count} материалов`;
}

function renderTopics(topics: readonly string[]): string {
  return topics.map((topic) => `#${topic}`).join(" · ");
}

function renderCard(entry: PreviewEntry, index: number): string {
  const featured = index === 0;
  const className = `blog-card${featured ? " blog-card--featured" : ""}${entry.href ? " blog-card--linked" : ""}`;
  const content = `
      <span class="blog-card__index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      <div class="blog-card__meta">
        <span>${KIND_LABELS[entry.kind]}</span>
        <time>${entry.date}</time>
      </div>
      <div class="blog-card__content">
        <h2 class="blog-card__title">${entry.title}</h2>
        <p class="blog-card__summary">${entry.summary}</p>
        <p class="blog-card__topics">${renderTopics(entry.topics)}</p>
      </div>
      <p class="blog-card__source"><span>источник</span><strong>${entry.source}</strong></p>
  `;

  if (entry.href) {
    return `<li class="blog-feed__item" data-blog-kind="${entry.kind}">
      <a class="${className}" href="${entry.href}">${content}</a>
    </li>`;
  }

  return `<li class="blog-feed__item" data-blog-kind="${entry.kind}">
    <article class="${className}">${content}</article>
  </li>`;
}

function renderIndex(): string {
  const filters = FILTER_LABELS.map(([kind, label], index) => (
    `<button class="blog-filter__button" type="button" data-blog-filter-kind="${kind}" aria-pressed="${index === 0 ? "true" : "false"}">${label}</button>`
  )).join("");

  return `<main class="blog-preview-page blog-index" data-blog-index>
    <header class="blog-index__header wrapper editorial-grid">
      <h1 class="blog-index__title">блог</h1>
      <p class="blog-index__intro">Инструменты, курсы, видеоуроки и заметки о дизайне, коде и нейросетях. Сохраняю здесь то, к чему действительно возвращаюсь в работе.</p>
    </header>

    <section class="blog-index__controls wrapper" aria-label="Фильтры блога">
      <div class="blog-filter__types" role="group" aria-label="Тип материала">${filters}</div>
      <p class="blog-filter__count" data-blog-count>${formatCount(entries.length)}</p>
    </section>

    <ol class="blog-feed wrapper">
      ${entries.map(renderCard).join("\n")}
    </ol>
    <p class="blog-index__empty wrapper" data-blog-empty hidden>В этой категории пока ничего нет.</p>
  </main>`;
}

function renderRelatedEntries(): string {
  return entries.slice(1, 4).map((entry, index) => `
    <li>
      <span>${String(index + 2).padStart(2, "0")}</span>
      <div>
        <strong>${entry.title}</strong>
        <small>${KIND_LABELS[entry.kind]} · ${entry.source}</small>
      </div>
    </li>
  `).join("");
}

function renderArticle(): string {
  return `<main class="blog-preview-page blog-post">
    <article>
      <header class="blog-post__header wrapper editorial-grid">
        <p class="blog-post__meta"><span>инструмент</span><time>12.09.2026</time></p>
        <h1 class="blog-post__title">AWFUL STUDIO: как я собираю виртуальную предметную студию в Blender</h1>
        <p class="blog-post__lead">Мне нужна не procedural demo scene, а подготовленная виртуальная студия, где свет, камера, продукт и окружение остаются понятными Blender-инструментами.</p>
        <div class="blog-post__source">
          <span>источник</span>
          <a href="https://github.com/looksawful/awful-studio">github.com/looksawful/awful-studio</a>
        </div>
        <p class="blog-post__topics">#blender · #3d · #workflow</p>
      </header>

      <div class="blog-post__body">
        <div class="blog-prose">
          <p class="blog-prose__opening">AWFUL STUDIO — мой Blender-native инструмент для предметной и рекламной работы. Я собираю его вокруг простой идеи: хороший старт должен ускорять постановку, но не отнимать обычные Blender-контролы и возможность в любой момент вмешаться вручную.</p>

          <h2>Физически понятная студия вместо генератора красивой сцены</h2>
          <p>Сцена строится как рабочее пространство с циклорамой, витриной, пьедесталом, светом и шейперами. Важна не сама процедурность, а понятная пространственная логика: продукт, камера и источники света должны существовать в масштабе и вести себя предсказуемо.</p>

          <blockquote>Плагин должен давать хороший старт, а не превращать Blender в закрытый конструктор, который начинает бороться с ручными правками.</blockquote>

          <h2>Объект пользователя остаётся обычным объектом Blender</h2>
          <p>Основной сценарий начинается с выбранного объекта. Плагин подключает его к product rig, может привести к удобному рабочему масштабу и дальше использует габариты продукта как контекст для камеры и света. При этом исходная модель не должна становиться внутренней сущностью, которой можно распоряжаться без пользователя.</p>

          <div class="blog-note">
            <span>принцип</span>
            <p>Автоматизировать повторяемую постановку, но не дублировать Blender Inspector и не прятать сцену за собственным закрытым API.</p>
          </div>

          <h2>Свет как библиотека постановок</h2>
          <p>Я разделяю освещение на рабочие семейства: предметные commercial-схемы, прямую flash-логику, более выразительные cinema-постановки и natural-сценарии через большую боковую витрину. Пресет здесь — стартовая постановка, а не финальный кадр.</p>

          <div class="blog-table" tabindex="0" aria-label="Световые семейства AWFUL STUDIO">
            <table>
              <thead><tr><th>Семейство</th><th>Характер</th><th>Когда полезно</th></tr></thead>
              <tbody>
                <tr><td>Commercial</td><td>контролируемый предметный свет</td><td>каталог, packshot, hero product</td></tr>
                <tr><td>Flash</td><td>прямая фотографическая вспышка</td><td>жёсткий fashion / snapshot характер</td></tr>
                <tr><td>Cinema</td><td>цвет, контраст, gobo и драматургия</td><td>рекламный и имиджевый кадр</td></tr>
                <tr><td>Natural</td><td>окно, мягкий источник, negative fill</td><td>естественная предметная сцена</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Камера и продукт — два независимых уровня движения</h2>
          <p>Камера может строить дугу, push/pull, orbit или более сложный проход. Продукт при этом получает собственное движение. Такое разделение позволяет собирать комбинации вместо того, чтобы хранить каждый ролик как отдельный жёстко зашитый preset.</p>

          <div class="blog-code" data-blog-code-block>
            <div class="blog-code__head"><span>workflow</span><button class="blog-code__copy" type="button" data-blog-code-copy>копировать</button></div>
            <pre><code data-blog-code-source>Use Selected
→ Auto Fit при необходимости
→ Lighting preset
→ Camera motion
→ Product motion
→ ручная доводка сцены</code></pre>
          </div>

          <h2>Safe Rebuild важнее эффектной кнопки Rebuild</h2>
          <p>Автоматическая пересборка полезна только пока она умеет отличать собственные данные плагина от пользовательской сцены. Камеры, материалы, модели и коллекции пользователя не должны становиться расходным материалом из-за удобства автоматизации.</p>

          <h2>Панель как switchboard</h2>
          <p>В интерфейсе я оставляю workflow-контролы: постановка, движение, видимость, окружение и операции сборки. Power, Temperature, focal length и обычные параметры материалов уже есть в Blender. Если повторить их второй раз, плагин станет длиннее, но не полезнее.</p>

          <h2>Что я проверяю дальше</h2>
          <p>Следующие итерации для меня про качество постановки: framing, световую логику, работу с реальными импортированными объектами и то, насколько быстро можно перейти от стартового preset к нормальной ручной сцене.</p>
        </div>
      </div>

      <aside class="blog-related wrapper" aria-labelledby="blog-related-title">
        <div class="blog-related__head">
          <h2 id="blog-related-title">ещё в блоге</h2>
          <a href="/lab/blog/?view=index">все материалы</a>
        </div>
        <ol>${renderRelatedEntries()}</ol>
      </aside>

      <footer class="blog-post__footer wrapper">
        <a href="/lab/blog/?view=index">← блог</a>
      </footer>
    </article>
  </main>`;
}

function initIndex(): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-blog-kind]"));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-blog-filter-kind]"));
  const count = root.querySelector<HTMLElement>("[data-blog-count]");
  const empty = root.querySelector<HTMLElement>("[data-blog-empty]");
  if (!count || !empty) return;

  const apply = (kind: string): void => {
    let visible = 0;
    for (const card of cards) {
      card.hidden = kind !== "all" && card.dataset.blogKind !== kind;
      if (!card.hidden) visible += 1;
    }
    count.textContent = formatCount(visible);
    empty.hidden = visible !== 0;
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const kind = button.dataset.blogFilterKind ?? "all";
      for (const current of buttons) current.setAttribute("aria-pressed", String(current === button));
      apply(kind);
    });
  }
}

function initArticle(): void {
  const button = root.querySelector<HTMLButtonElement>("[data-blog-code-copy]");
  const source = root.querySelector<HTMLElement>("[data-blog-code-source]");
  if (!button || !source) return;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(source.textContent ?? "");
      button.textContent = "скопировано";
      window.setTimeout(() => { button.textContent = "копировать"; }, 900);
    } catch {
      button.textContent = "не удалось";
    }
  });
}

const view = new URLSearchParams(location.search).get("view") === "article" ? "article" : "index";
root.innerHTML = view === "article" ? renderArticle() : renderIndex();
document.body.dataset.blogPreviewView = view;

if (view === "article") initArticle();
else initIndex();
