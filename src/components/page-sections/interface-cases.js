import { renderControlPhoneMedia, renderGridMedia, renderMasonryMedia, renderPaletteMedia, renderPhoneCatalogMedia, renderTalkMedia } from "./interface-case-media.js";
import { joinMarkup } from "./shared.js";

const CASES = [
  {
    title: "МЯГКИЕ БУЛКИ",
    paragraphs: [
      "Съешь ещё этих мягких французских булок, да выпей чаю. Лёгкий шёпот квадратных облаков перелистывает пустые страницы, пока тонкие линии собирают тихий порядок из случайных слов.",
    ],
    items: [
      "булочная геометрия",
      "мягкое построение",
      "чайный интерфейс",
      "пустая навигация",
      "чёрные картинки",
      "французские булки",
      "тихий порядок",
    ],
    visit: 'Смотри <a href="#">bulki.test</a> + <a href="#">tea.bulki.test</a>',
    renderMedia: renderTalkMedia,
  },
  {
    title: "ТИХИЙ ЖУРНАЛ",
    paragraphs: [
      "Съешь ещё этих мягких французских булок, да выпей чаю. Пыльная сетка раскладывает деревянные слова по полкам, а серые квадраты молча делают вид, что всё это имеет значение.",
      "Пять быстрых ежей нашли уютный каталог, закрыли все лишние вкладки и оставили только пустые карточки, мягкий свет и аккуратную скуку.",
    ],
    items: [
      "тихая редактура",
      "белая сетка",
      "чёрные предметы",
      "мягкие подписи",
      "случайный порядок",
      "пустое управление",
    ],
    visit: 'Смотри <a href="#">minimal-bulka.test</a>',
    renderMedia: renderGridMedia,
  },
  {
    title: "ПУСТОЙ КАТАЛОГ",
    paragraphs: [
      "Съешь ещё этих мягких французских булок, да выпей чаю. Уютные точки сидят на чёрном экране, серые слова притворяются товарами, а мягкая сетка спокойно ждёт следующую булку.",
    ],
    items: ["чёрная витрина", "булочная сетка", "тихие карточки", "мягкие товары", "пустые цены"],
    visit: 'Смотри <a href="#">empty-buns.test</a>',
    renderMedia: renderPhoneCatalogMedia,
  },
  {
    title: "МЯГКИЕ КРУГИ",
    paragraphs: [
      "Съешь ещё этих мягких французских булок, да выпей чаю. Девять круглых пятен медленно думают о тёплом свете, о странной тени и о том, как красиво молчать на сером фоне.",
    ],
    items: ["мутные градиенты", "чёрные сферы", "тихий блеск", "мягкий воздух", "пустая палитра"],
    visit: 'Смотри <a href="#">soft-circles.test</a>',
    renderMedia: renderPaletteMedia,
  },
  {
    title: "ЧАЙНЫЙ ПУЛЬТ",
    paragraphs: [
      "Съешь ещё этих мягких французских булок, да выпей чаю. Белые точки мерцают как сахар на чёрном стекле, а маленький пульт делает вид, что управляет погодой, музыкой и булками.",
    ],
    items: ["пустой экран", "белые точки", "чёрный корпус", "мягкий сигнал", "чайный шум"],
    visit: 'Смотри <a href="#">tea-mixer.test</a>',
    renderMedia: renderControlPhoneMedia,
  },
  {
    title: "ПЫЛЬНАЯ СЕТКА",
    paragraphs: [
      "Съешь ещё этих мягких французских булок, да выпей чаю. Квадраты смотрят друг на друга, серые поля держат воздух, а пустые картинки ждут свои номера в папке с мягким названием.",
    ],
    items: ["сухая витрина", "пустые плитки", "чёрные вставки", "ровная сетка", "булочный порядок"],
    visit: 'Смотри <a href="#">dust-grid.test</a>',
    renderMedia: renderMasonryMedia,
  },
];

const renderCopy = ({ title, paragraphs, items, visit }) => `
  <aside class="interface-cases__copy">
    <h2>${title}</h2>
    ${joinMarkup(paragraphs, (paragraph) => `<p>${paragraph}</p>`)}
    <ul>${joinMarkup(items, (item) => `<li>${item}</li>`)}</ul>
    <p class="interface-cases__visit">${visit}</p>
  </aside>
`;

const renderCase = (item) => `
  <article class="interface-cases__case">
    ${renderCopy(item)}
    <section class="interface-cases__media">${item.renderMedia()}</section>
  </article>
`;

export const renderJesteiInterfaceCases = () => joinMarkup(CASES, renderCase);

export function mountJesteiInterfaceCases(containerId = "jestei-interface-cases") {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.mounted === "true") {
    return;
  }

  container.dataset.mounted = "true";
  container.innerHTML = renderJesteiInterfaceCases();
}
