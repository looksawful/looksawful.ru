import "../styles/index.css";
import "./blog-preview.css";

type BlogKind = "tool" | "course" | "tutorial" | "note";

type PreviewEntry = {
  readonly title: string;
  readonly summary: string;
  readonly kind: BlogKind;
  readonly date: string;
  readonly tags: readonly string[];
  readonly cover?: {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
  };
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
    title: "Как я собираю пайплайн для изображений",
    summary: "От референсов и генерации до отбора, постобработки и экспорта. Без превращения каждого шага в отдельный сервис.",
    kind: "tool",
    date: "09.09.2026",
    tags: ["images", "pipeline"],
    cover: {
      src: "/media/projects/index/jestei-cover.webp",
      alt: "Фрагмент проекта Jestei Pool",
      width: 1580,
      height: 1360,
    },
  },
  {
    title: "Три способа не потерять структуру в большом CSS",
    summary: "Практический разбор границ компонентов, слоёв и ownership-проверок, которые помогают не чинить каскад методом археологии.",
    kind: "tutorial",
    date: "07.09.2026",
    tags: ["css", "architecture"],
    cover: {
      src: "/media/projects/index/styx-cover.webp",
      alt: "Фрагмент проекта Styx",
      width: 1580,
      height: 1360,
    },
  },
  {
    title: "Что я оставляю после курса, а что выбрасываю",
    summary: "Конспект как рабочий артефакт: не пересказ программы, а набор приёмов, решений и ссылок, к которым есть смысл вернуться.",
    kind: "course",
    date: "05.09.2026",
    tags: ["learning", "notes"],
  },
  {
    title: "Почему дизайн-система должна сокращать количество решений",
    summary: "Заметка о том, где система действительно помогает продукту, а где превращается в коллекцию аккуратно подписанных сущностей.",
    kind: "note",
    date: "02.09.2026",
    tags: ["systems", "product"],
    cover: {
      src: "/media/projects/index/sensetique-cover.webp",
      alt: "Фрагмент проекта Sensetique",
      width: 1580,
      height: 1360,
    },
  },
  {
    title: "Как хранить референсы так, чтобы они снова находились",
    summary: "Минимальная структура библиотеки визуальных материалов без папочного фольклора и названий вроде final-final-2-new.",
    kind: "tutorial",
    date: "30.08.2026",
    tags: ["references", "library"],
    cover: {
      src: "/media/projects/index/shootings-cover.webp",
      alt: "Фрагмент коллекции Shootings",
      width: 1580,
      height: 1360,
    },
  },
];

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing blog preview element: ${selector}`);
  return element;
}

const root = required<HTMLElement>("#blog-preview-root");

function formatCount(count: number): string {
  return `${count} ${count === 1 ? "материал" : count > 1 && count < 5 ? "материала" : "материалов"}`;
}

function renderCover(entry: PreviewEntry): string {
  if (!entry.cover) return "";
  return `<div class="blog-card__media"><img alt="${entry.cover.alt}" height="${entry.cover.height}" loading="lazy" src="${entry.cover.src}" width="${entry.cover.width}"></div>`;
}

function renderCard(entry: PreviewEntry): string {
  const searchable = [entry.title, entry.summary, entry.kind, ...entry.tags].join(" ").toLocaleLowerCase("ru");
  return `<article class="blog-card" data-blog-kind="${entry.kind}" data-blog-search="${searchable}">
    <a class="blog-card__link" href="/lab/blog/?view=article">
      ${renderCover(entry)}
      <div class="blog-card__body">
        <div class="blog-card__meta"><span>${KIND_LABELS[entry.kind]}</span><span>${entry.date}</span></div>
        <h2>${entry.title}</h2>
        <p>${entry.summary}</p>
        <div class="blog-card__tags">${entry.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      </div>
    </a>
  </article>`;
}

function renderIndex(): string {
  return `<main class="blog-preview">
    <section class="blog-preview__intro wrapper">
      <p class="blog-preview__eyebrow">looksawful / lab</p>
      <h1>Блог</h1>
      <p class="blog-preview__lead">Черновой визуальный стенд для будущего раздела: инструменты, курсы, уроки и заметки в одной системе.</p>
    </section>

    <section class="blog-controls wrapper" aria-label="Фильтры блога">
      <label class="blog-search">
        <span>поиск</span>
        <input autocomplete="off" data-blog-search-input placeholder="css, blender, pipeline…" type="search">
      </label>
      <div class="blog-filters" aria-label="Тип материала">
        ${FILTER_LABELS.map(([value, label], index) => `<button aria-pressed="${index === 0}" data-blog-filter-kind="${value}" type="button">${label}</button>`).join("")}
      </div>
      <p class="blog-count" data-blog-count>${formatCount(entries.length)}</p>
    </section>

    <section class="blog-grid wrapper" data-blog-grid>
      ${entries.map(renderCard).join("")}
    </section>
    <p class="blog-empty wrapper" data-blog-empty hidden>Ничего не найдено.</p>
  </main>`;
}

function renderArticle(): string {
  return `<main class="blog-preview blog-preview--article">
    <article class="blog-post">
      <header class="blog-post__header wrapper">
        <a class="blog-post__back" href="/lab/blog/?view=index">← блог</a>
        <p class="blog-preview__eyebrow">инструмент · 09.09.2026</p>
        <h1>Как я собираю пайплайн для изображений</h1>
        <p class="blog-preview__lead">От референсов и генерации до отбора, постобработки и экспорта. Без превращения каждого шага в отдельный сервис.</p>
      </header>

      <div class="blog-post__hero wrapper">
        <img alt="Фрагмент проекта Jestei Pool" height="1360" src="/media/projects/index/jestei-cover.webp" width="1580">
      </div>

      <div class="blog-post__layout wrapper">
        <aside class="blog-post__toc" aria-label="Содержание">
          <span>содержание</span>
          <a href="#input">Входные данные</a>
          <a href="#selection">Отбор</a>
          <a href="#automation">Автоматизация</a>
        </aside>

        <div class="blog-prose">
          <p>Рабочий пайплайн полезен ровно до тех пор, пока сокращает число решений, которые приходится принимать заново. Если для каждого изображения нужно вспоминать порядок действий, система уже проиграла.</p>

          <h2 id="input">Начать с входных данных</h2>
          <p>До генерации я фиксирую формат, назначение изображения, референсы и технические ограничения. Это даёт модели и человеку один и тот же набор условий вместо свободного толкования задачи.</p>

          <blockquote>Хороший процесс не убирает решения. Он оставляет только те решения, которые действительно требуют внимания.</blockquote>

          <h2 id="selection">Отбирать до постобработки</h2>
          <p>Обрабатывать десятки слабых вариантов бессмысленно. Сначала остаётся короткий список кандидатов, и только потом начинается ручная работа.</p>

          <div class="blog-table-wrap">
            <table>
              <thead><tr><th>этап</th><th>фиксируем</th><th>оставляем свободным</th></tr></thead>
              <tbody>
                <tr><td>референсы</td><td>визуальная цель и ограничения</td><td>конкретные источники</td></tr>
                <tr><td>генерация</td><td>формат и диапазон вариаций</td><td>модель и sampler</td></tr>
                <tr><td>пост</td><td>контраст, зерно, экспорт</td><td>локальные художественные решения</td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="automation">Автоматизировать скучное</h2>
          <p>Повторяемые операции удобнее оставлять коду. Небольшой скрипт ценнее сложного workflow, если его назначение очевидно и он не требует отдельного обслуживания.</p>

          <div class="blog-code" data-blog-code-block>
            <div class="blog-code__head"><span>typescript</span><button type="button" data-blog-code-copy>копировать</button></div>
            <pre><code data-blog-code-source>const result = pipeline.run({
  source,
  references,
  output: "webp",
});</code></pre>
          </div>

          <p>В итоге цель не в том, чтобы автоматизировать всё. Цель — оставить ручными именно те решения, где ручная работа что-то добавляет.</p>
        </div>
      </div>

      <footer class="blog-post__footer wrapper">
        <a href="/lab/blog/?view=index">← блог</a>
      </footer>
    </article>
  </main>`;
}

function initIndex(): void {
  const input = root.querySelector<HTMLInputElement>("[data-blog-search-input]");
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-blog-kind]"));
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-blog-filter-kind]"));
  const count = root.querySelector<HTMLElement>("[data-blog-count]");
  const empty = root.querySelector<HTMLElement>("[data-blog-empty]");
  if (!input || !count || !empty) return;

  let kind = "all";
  const apply = (): void => {
    const query = input.value.trim().toLocaleLowerCase("ru");
    let visible = 0;
    for (const card of cards) {
      const kindMatch = kind === "all" || card.dataset.blogKind === kind;
      const searchMatch = !query || (card.dataset.blogSearch ?? "").includes(query);
      card.hidden = !(kindMatch && searchMatch);
      if (!card.hidden) visible += 1;
    }
    count.textContent = formatCount(visible);
    empty.hidden = visible !== 0;
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      kind = button.dataset.blogFilterKind ?? "all";
      for (const current of buttons) current.setAttribute("aria-pressed", String(current === button));
      apply();
    });
  }

  input.addEventListener("input", apply);
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
