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
    title: "Как я собираю визуальный пайплайн без лишних инструментов",
    summary: "Рабочая схема для задачи, где референсы, генерация, постпродакшен и код должны оставаться одной понятной системой.",
    kind: "tutorial",
    date: "10.09.2026",
    tags: ["workflow", "design", "ai"],
    cover: {
      src: "/media/projects/index/jestei-pool-cover.webp",
      alt: "Фрагмент проекта Jestei Pool",
      width: 1580,
      height: 1360,
    },
  },
  {
    title: "Инструменты, которые действительно остаются в работе",
    summary: "Короткий список утилит и подходов, которые пережили эксперименты и не требуют отдельного ритуала обслуживания.",
    kind: "tool",
    date: "08.09.2026",
    tags: ["tools", "workflow"],
    cover: {
      src: "/media/projects/index/styx-jewel-cover.webp",
      alt: "Фрагмент проекта Styx Jewel",
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

const root = document.querySelector<HTMLElement>("#blog-preview-root");
if (!root) throw new Error("Missing blog preview root");

function formatCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} материалов`;
  if (mod10 === 1) return `${count} материал`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} материала`;
  return `${count} материалов`;
}

function renderCard(entry: PreviewEntry, index: number): string {
  const featured = index === 0;
  const media = entry.cover
    ? `<figure class="blog-card__media">
        <img src="${entry.cover.src}" alt="${entry.cover.alt}" width="${entry.cover.width}" height="${entry.cover.height}" decoding="async" ${featured ? 'fetchpriority="high"' : 'loading="lazy"'}>
      </figure>`
    : "";

  return `<li class="blog-feed__item" data-blog-kind="${entry.kind}" data-blog-search="${[entry.title, entry.summary, KIND_LABELS[entry.kind], ...entry.tags].join(" ").toLocaleLowerCase("ru")}">
    <a class="blog-card blog-card--${entry.cover ? "media" : "text"}${featured ? " blog-card--featured" : ""}" href="/lab/blog/?view=article">
      <div class="blog-card__meta">
        <span>${KIND_LABELS[entry.kind]}</span>
        <time>${entry.date}</time>
      </div>
      <div class="blog-card__content">
        <h2 class="blog-card__title">${entry.title}</h2>
        <p class="blog-card__summary">${entry.summary}</p>
        <p class="blog-card__tags">${entry.tags.map((tag) => `#${tag}`).join(" · ")}</p>
      </div>
      ${media}
    </a>
  </li>`;
}

function renderIndex(): string {
  const filters = FILTER_LABELS.map(([kind, label], index) => (
    `<button class="blog-filter__button" type="button" data-blog-filter-kind="${kind}" aria-pressed="${index === 0 ? "true" : "false"}">${label}</button>`
  )).join("");

  return `<main class="blog-preview-page blog-index" data-blog-index>
    <header class="blog-index__header wrapper editorial-grid">
      <h1 class="blog-index__title">блог</h1>
      <p class="blog-index__intro">Инструменты, курсы, видеоуроки и заметки о дизайне, коде и нейросетях.</p>
    </header>

    <section class="blog-index__controls wrapper" aria-label="Фильтры блога">
      <div class="blog-filter__types" role="group" aria-label="Тип материала">${filters}</div>
      <label class="blog-search">
        <span class="blog-search__label">поиск</span>
        <input class="blog-search__input" type="search" autocomplete="off" spellcheck="false" data-blog-search-input>
      </label>
      <p class="blog-filter__count" data-blog-count>${formatCount(entries.length)}</p>
    </section>

    <ol class="blog-feed wrapper">
      ${entries.map(renderCard).join("\n")}
    </ol>
    <p class="blog-index__empty wrapper" data-blog-empty hidden>Ничего не найдено.</p>
  </main>`;
}

function renderArticle(): string {
  return `<main class="blog-preview-page blog-post">
    <article>
      <header class="blog-post__header wrapper editorial-grid">
        <p class="blog-post__meta"><span>урок</span><time>10.09.2026</time></p>
        <h1 class="blog-post__title">Как я собираю визуальный пайплайн без лишних инструментов</h1>
        <p class="blog-post__lead">Система полезна только тогда, когда она уменьшает количество решений по дороге от идеи до готового результата.</p>
        <p class="blog-post__tags">#workflow · #design · #ai</p>
      </header>

      <figure class="blog-post__cover wrapper">
        <img src="/media/projects/index/jestei-pool-cover.webp" alt="Фрагмент проекта Jestei Pool" width="1580" height="1360" decoding="async" fetchpriority="high">
      </figure>

      <div class="blog-post__body">
        <div class="blog-prose">
          <p>Я стараюсь не строить отдельный процесс вокруг каждого инструмента. Сначала фиксирую задачу и ожидаемый результат, потом выбираю минимальный набор средств, который действительно сокращает путь.</p>

          <h2>Начинать с результата, а не с программы</h2>
          <p>Если задача — собрать серию изображений, важнее заранее определить общий визуальный контракт: формат, ритм, диапазон вариативности, правила обработки и то, что должно оставаться неизменным.</p>
          <blockquote>Хороший пайплайн убирает повторяющиеся решения. Плохой требует помнить, в каком именно окне сегодня нужно нажать ещё одну кнопку.</blockquote>
          <p>После этого инструменты становятся заменяемыми. Один этап может выполнять локальная модель, другой — скрипт, третий — ручная работа. Система остаётся понятной, потому что границы определены результатом.</p>

          <figure class="blog-figure">
            <img src="/media/projects/index/styx-jewel-cover.webp" alt="Фрагмент проекта Styx Jewel" width="1580" height="1360" loading="lazy" decoding="async">
            <figcaption>Широкий медиаблок выходит за reading column, но остаётся в общей editorial-сетке.</figcaption>
          </figure>

          <h2>Фиксировать только то, что повторяется</h2>
          <p>Не каждая удачная последовательность действий заслуживает собственной системы. Я сохраняю правило только после того, как оно несколько раз оказалось полезным и перестало зависеть от конкретной задачи.</p>

          <div class="blog-table" tabindex="0" aria-label="Пример структуры пайплайна">
            <table>
              <thead><tr><th>Этап</th><th>Что фиксируется</th><th>Что остаётся свободным</th></tr></thead>
              <tbody>
                <tr><td>референсы</td><td>визуальная цель и ограничения</td><td>конкретные источники</td></tr>
                <tr><td>генерация</td><td>формат и диапазон вариаций</td><td>модель и sampler</td></tr>
                <tr><td>пост</td><td>контраст, зерно, экспорт</td><td>локальные художественные решения</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Автоматизировать скучное</h2>
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
