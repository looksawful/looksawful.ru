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
    title: "AWFUL STUDIO: как я собираю виртуальную предметную студию в Blender",
    summary: "Blender-native инструмент для предметной и рекламной съёмки: физически понятная студия, готовые световые постановки и автоматизация, которая не мешает вручную править сцену.",
    kind: "tool",
    date: "12.09.2026",
    tags: ["blender", "awful-studio", "3d"],
  },
  {
    title: "Conquering Responsive Layouts — Kevin Powell",
    summary: "Что из курса по адаптивным интерфейсам действительно осталось в моей ежедневной работе с CSS.",
    kind: "course",
    date: "08.09.2026",
    tags: ["css", "responsive", "learning"],
  },
  {
    title: "Discover three.js: заметки после прохождения",
    summary: "Не пересказ курса, а набор вещей, к которым имеет смысл возвращаться при работе с Three.js и WebGL на сайте.",
    kind: "course",
    date: "05.09.2026",
    tags: ["threejs", "webgl", "learning"],
  },
  {
    title: "The Book of Shaders как рабочий справочник",
    summary: "Почему я возвращаюсь к нему не как к учебнику по порядку, а как к визуальному словарю для GLSL-экспериментов.",
    kind: "note",
    date: "02.09.2026",
    tags: ["glsl", "shaders", "reference"],
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
        <p class="blog-post__meta"><span>инструмент</span><time>12.09.2026</time></p>
        <h1 class="blog-post__title">AWFUL STUDIO: как я собираю виртуальную предметную студию в Blender</h1>
        <p class="blog-post__lead">Мне нужен был не генератор красивой процедурной сцены, а подготовленная виртуальная студия, в которой свет, камера и окружение ведут себя как понятные рабочие инструменты.</p>
        <p class="blog-post__tags">#blender · #awful-studio · #3d</p>
      </header>

      <div class="blog-post__body">
        <div class="blog-prose">
          <p>AWFUL STUDIO — мой Blender-native инструмент для предметной и рекламной работы. Идея простая: собрать внутри Blender подготовленную студию, дать быстрые стартовые постановки и при этом не отбирать у пользователя обычные Blender-контролы.</p>

          <h2>Не procedural demo scene, а физически понятная студия</h2>
          <p>В текущем Alpha 0.0.15 базовая сцена построена как помещение примерно 14 × 18 × 7 метров. Внутри — 12-метровая циклорама, большая боковая витрина и пьедестал. Размеры здесь важны не ради технической аккуратности: я хочу, чтобы расстояния между продуктом, камерой, светом и фоном оставались понятными как в реальной студии.</p>

          <blockquote>Плагин должен давать хороший старт, а не превращать Blender в закрытый конструктор, который начинает бороться с ручными правками.</blockquote>

          <h2>Любой объект остаётся обычным объектом Blender</h2>
          <p><strong>Use Selected</strong> монтирует выбранный пользователем контент в product rig. Auto Fit может привести импорт к рабочему масштабу студии, а если его выключить — метрический масштаб сохраняется. Габариты продукта затем используются для адаптации камеры, света и шейперов.</p>

          <h2>Свет как библиотека постановок</h2>
          <p>В Alpha 0.0.15 есть постоянный light bank, карты, флаги, diffusion, gobo и flash backdrop. Поверх него собраны 16 световых пресетов в четырёх семействах: Commercial, Flash, Cinema и Natural.</p>

          <div class="blog-table" tabindex="0" aria-label="Световые семейства AWFUL STUDIO">
            <table>
              <thead><tr><th>Семейство</th><th>Примеры</th><th>Задача</th></tr></thead>
              <tbody>
                <tr><td>Commercial</td><td>Classic 3-Light, Top Soft Packshot, Dual Strip Hero</td><td>предметная и каталожная постановка</td></tr>
                <tr><td>Flash</td><td>Direct Camera Flash, Direct Flash Wide</td><td>жёсткая фотографическая логика прямой вспышки</td></tr>
                <tr><td>Cinema</td><td>Teal/Orange, Red/Black Luxury, Hard Sun/Gobo</td><td>более художественные рекламные схемы</td></tr>
                <tr><td>Natural</td><td>Window + Negative Fill, Window Balanced</td><td>работа через большую боковую витрину</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Камера и продукт двигаются независимо</h2>
          <p>У камеры уже есть Static, Custom Path, дуги в обе стороны, Push In, Pull Out, Dolly Zoom, Orbit + Push, Orbit + Rise, Hero Arc и Figure 8. Отдельно живёт product motion: вращения по осям, Float + Spin, Hero Reveal, Tumble, Pendulum, Orbit + Bob и Breath.</p>
          <p>Базовая дистанция камеры вычисляется из габаритов продукта и FOV. При этом текущий 0.0.15 ещё не выдаётся за финальную систему framing: независимый camera target и safe framing остаются отдельной задачей.</p>

          <h2>Плагин не должен уничтожать сцену</h2>
          <p>Safe Rebuild удаляет только данные, которыми управляет AWFUL STUDIO. Пользовательские модели, материалы, камеры и коллекции не должны становиться расходным материалом только потому, что кому-то захотелось нажать Rebuild. Удивительно, но программам иногда приходится специально объяснять эту мысль.</p>

          <div class="blog-code" data-blog-code-block>
            <div class="blog-code__head"><span>workflow</span><button class="blog-code__copy" type="button" data-blog-code-copy>копировать</button></div>
            <pre><code data-blog-code-source>Use Selected
→ Auto Fit
→ Lighting preset
→ Camera motion
→ Product motion
→ Build Post Pipeline — только когда он нужен</code></pre>
          </div>

          <h2>Панель как switchboard</h2>
          <p>В интерфейсе я не хочу дублировать весь Blender Inspector. Power, Temperature, focal length, произвольные значения шейдеров и сотни render settings уже существуют в Blender. В панели AWFUL STUDIO должны оставаться именно workflow-контролы: выбор постановки, режим движения, видимость, Auto Fit, окружение и операции сборки.</p>

          <h2>Что дальше</h2>
          <p>Следующий TDD-срез после Alpha 0.0.15 посвящён фотографической логике flash-пресетов: отдельной экспозиции для вспышки, более закрытой aperture intent, нейтральной температуре и физически осмысленному положению on-camera flash. Это следующий этап разработки, а не функция, которую я приписываю текущему релизу задним числом.</p>

          <p><a href="https://github.com/looksawful/awful-studio">AWFUL STUDIO на GitHub</a></p>
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