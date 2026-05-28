const PALETTE_GROUPS = [
  {
    title: "Feature",
    family: "Biloba",
    background: "#B2A1EA",
    foreground: "#151718",
    swatches: [
      { name: "Biloba-50", hex: "#DED3F4" },
      { name: "Biloba-100", hex: "#CFBFEF" },
      { name: "Biloba-400", hex: "#B2A1EA" },
      { name: "Biloba-500", hex: "#8473A9" },
    ],
  },
  {
    title: "Brand",
    family: "Gold",
    background: "#F18200",
    foreground: "#151718",
    swatches: [
      { name: "Gold-50", hex: "#F9C996" },
      { name: "Gold-100", hex: "#F7B067" },
      { name: "Gold-400", hex: "#F18200" },
      { name: "Gold-500", hex: "#B1620F" },
    ],
  },
  {
    title: "Event",
    family: "Pear",
    background: "#D1E231",
    foreground: "#151718",
    swatches: [
      { name: "Pear-50", hex: "#E9F4AC" },
      { name: "Pear-100", hex: "#DFFF87" },
      { name: "Pear-400", hex: "#D1E231" },
      { name: "Pear-500", hex: "#96A834" },
    ],
  },
  {
    title: "PRO",
    family: "Dodger blue",
    background: "#1760C1",
    foreground: "#F6F8FF",
    swatches: [
      { name: "Dodger blue-50", hex: "#B5D1F6" },
      { name: "Dodger blue-100", hex: "#6C9CDC" },
      { name: "Dodger blue-400", hex: "#3D80D8" },
      { name: "Dodger blue-500", hex: "#1760C1" },
    ],
  },
];

/*
  Тексты из ошибочного CV-блока намеренно оставлены здесь комментариями:
  - Иван Крушинский / looksawful.ru / i@lookawful.ru
  - Профиль: работа на стыке бренд-дизайна, продуктового UX/UI, motion и 3D
  - Арт-директор / бренд-системы и визуальные правила / 2024 - сейчас
  - Продуктовый дизайнер / ux/ui для сложных интерфейсов / 2024 - сейчас
  - Графический дизайнер / баннеры, кампейны, серийные форматы / 2019 - сейчас
  - Визуальный продюсер / съемки, предметная подача, moodboards / 2021 - сейчас
  - Motion / canvas / 3d / анимация для лендингов и сцен / 2023 - сейчас
  - Редактор визуального языка / структура текста и tone of voice / 2024 - сейчас
  - Design lead / процессы, файлы, команда, Figma / 2024 - 2026
  - Brand systems / логотипы, палитры, носители / 2018 - сейчас
  - Photography direction / кампейны, каталоги, музыкальные съемки / 2021 - сейчас
  - Visual prototyping / быстрые интерфейсные и брендовые сцены / 2023 - сейчас
  - Production support / от идеи до рабочего файла и релиза / всегда
*/
const LEGACY_CV_COMMENTS = [
  "Иван Крушинский / looksawful.ru / i@lookawful.ru",
  "Профиль: работа на стыке бренд-дизайна, продуктового UX/UI, motion и 3D",
  "Арт-директор / бренд-системы и визуальные правила / 2024 - сейчас",
  "Продуктовый дизайнер / ux/ui для сложных интерфейсов / 2024 - сейчас",
  "Графический дизайнер / баннеры, кампейны, серийные форматы / 2019 - сейчас",
  "Визуальный продюсер / съемки, предметная подача, moodboards / 2021 - сейчас",
  "Motion / canvas / 3d / анимация для лендингов и сцен / 2023 - сейчас",
  "Редактор визуального языка / структура текста и tone of voice / 2024 - сейчас",
  "Design lead / процессы, файлы, команда, Figma / 2024 - 2026",
  "Brand systems / логотипы, палитры, носители / 2018 - сейчас",
  "Photography direction / кампейны, каталоги, музыкальные съемки / 2021 - сейчас",
  "Visual prototyping / быстрые интерфейсные и брендовые сцены / 2023 - сейчас",
  "Production support / от идеи до рабочего файла и релиза / всегда",
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeComment = (value) => String(value).replaceAll("--", "- -").replaceAll(">", "&gt;");

function renderLegacyComments() {
  return LEGACY_CV_COMMENTS.map((text) => `<!-- cv-profile text parked: ${escapeComment(text)} -->`).join("\n");
}

function renderSwatch(swatch) {
  return `
    <article class="jestei-colors__swatch">
      <span class="jestei-colors__dot" style="background: ${escapeHtml(swatch.hex)}"></span>
      <span class="jestei-colors__swatch-text">
        <span class="jestei-colors__swatch-name">${escapeHtml(swatch.name)}</span>
        <span class="jestei-colors__swatch-hex">${escapeHtml(swatch.hex)}</span>
      </span>
    </article>
  `;
}

function renderGroup(group) {
  return `
    <article
      class="jestei-colors__row"
      style="--jestei-row-bg: ${escapeHtml(group.background)}; --jestei-row-fg: ${escapeHtml(group.foreground)}"
    >
      <h3 class="jestei-colors__title">${escapeHtml(group.title)}</h3>
      <div class="jestei-colors__swatches" aria-label="${escapeHtml(group.family)} colors">
        ${group.swatches.map(renderSwatch).join("")}
      </div>
      <p class="jestei-colors__family">${escapeHtml(group.family)}</p>
    </article>
  `;
}

export function mountJesteiColors(containerId = "jestei-colors-container") {
  const container = document.getElementById(containerId);
  if (!container || container.dataset.jesteiColorsMounted === "true") return;

  container.dataset.jesteiColorsMounted = "true";
  container.classList.add("jestei-colors");
  container.innerHTML = `
    ${renderLegacyComments()}
    <section class="jestei-colors__list" aria-label="Цветовая палитра Jestei Pool">
      ${PALETTE_GROUPS.map(renderGroup).join("")}
    </section>
  `;
}
