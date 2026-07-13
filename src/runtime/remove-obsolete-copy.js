const SELECTORS = [
  "#jestei-tariffs .jestei-tariffs__screen > p:last-child",
  "#resume-title",
];

const COLOR_LEAD_SELECTOR = "#jestei-color .jestei-color-bento__lead";
const COLOR_LEAD_VISIBLE =
  "Сегментировали конфликтующие аудитории при помощи 4 цветовых профилей. Теперь цвет направляет пользователя к нужным продуктам.";
const COLOR_LEAD_COMMENTED =
  "Создали отдельные визуальные зоны для ивент диджеев, клубных диджеев и саунд-продюсеров. Цветовые профили связали продукты и подписки, разделили конфликтующие аудитории и снизили количество конфликтов между ними. Раньше сервис держался на серо-оранжевой палитре. Теперь в системе 4 продуктовые темы: оранжевая для клуба, грушевая для ивента, синяя для эксклюзивов и лавандовая для экспериментальных инструментов.";

const COLOR_PROFILE_HEX = [
  ["#jestei-color .jestei-color-bento__theme--orange .jestei-color-bento__theme-head > span", "#f18200"],
  ["#jestei-color .jestei-color-bento__theme--blue .jestei-color-bento__theme-head > span", "#157aff"],
  ["#jestei-color .jestei-color-bento__theme--pear .jestei-color-bento__theme-head > span", "#d1e231"],
  ["#jestei-color .jestei-color-bento__theme--biloba .jestei-color-bento__theme-head > span", "#b2a1ea"],
];

const GRAPHICS_LEAD =
  "Оживили графический дизайн и креативы бренда: добавили иллюстрации, коллажи, градиенты и геометрические паттерны.";
const GRAPHICS_REMOVED_MEDIA =
  "/assets/media/cases/jesteipool/06-graphic/01/34.webp";
const GRAPHICS_RUNTIME_STYLE_ID = "jestei-graphics-runtime-contract";

function updateJesteiColorCopy(root) {
  const lead = root.querySelector(COLOR_LEAD_SELECTOR);

  if (lead) {
    lead.replaceChildren(
      root.createTextNode(COLOR_LEAD_VISIBLE),
      root.createComment(` ${COLOR_LEAD_COMMENTED} `),
    );
  }

  COLOR_PROFILE_HEX.forEach(([selector, hex]) => {
    const label = root.querySelector(selector);
    if (label) label.textContent = hex;
  });
}

function ensureJesteiGraphicsRuntimeStyles(root) {
  if (root.getElementById(GRAPHICS_RUNTIME_STYLE_ID)) return;

  const style = root.createElement("style");
  style.id = GRAPHICS_RUNTIME_STYLE_ID;
  style.textContent = `
    main[data-showcase] #jestei-graphics [data-content-head]::before {
      content: none !important;
      display: none !important;
    }

    main[data-showcase] #jestei-graphics .jestei-graphics__lead {
      display: block !important;
      align-self: start;
      max-inline-size: 30rem;
      margin: 0;
      color: color-mix(in srgb, var(--black) 72%, transparent);
      font-size: clamp(0.98rem, 1vw, 1.16rem);
      font-weight: 400;
      line-height: 1.38;
      letter-spacing: 0;
      text-wrap: pretty;
    }

    main[data-showcase] #jestei-graphics [data-media-cluster][data-media-layout="grid"] > [data-section-media-item]:nth-last-child(5) {
      display: block !important;
    }

    @media (max-width: 58rem) {
      main[data-showcase] #jestei-graphics .jestei-graphics__lead {
        max-inline-size: 42rem;
      }
    }

    @media (max-width: 48rem) {
      main[data-showcase] #jestei-graphics .jestei-graphics__lead {
        font-size: clamp(0.98rem, 4.2vw, 1.12rem);
        line-height: 1.42;
      }
    }
  `;
  root.head.append(style);
}

function updateJesteiGraphics(root) {
  const section = root.querySelector("#jestei-graphics");
  if (!section) return;

  section.setAttribute("aria-label", "графический дизайн");
  section.setAttribute("data-chapter-title", "графический дизайн");

  const title = section.querySelector(".jestei-graphics__title");
  if (title) {
    const main = root.createElement("span");
    main.setAttribute("data-section-title-main", "");
    main.textContent = "графический";

    const accent = root.createElement("span");
    accent.setAttribute("data-section-title-accent", "");
    accent.textContent = "дизайн";

    title.replaceChildren(main, accent);
  }

  section.querySelectorAll("p").forEach((paragraph) => paragraph.remove());

  const contentHead = section.querySelector("[data-content-head]");
  if (contentHead) {
    const lead = root.createElement("p");
    lead.className = "jestei-graphics__lead";
    lead.setAttribute("data-section-lead", "");
    lead.textContent = GRAPHICS_LEAD;
    contentHead.prepend(lead);
  }

  section
    .querySelectorAll(`[data-section-media-item][href="${GRAPHICS_REMOVED_MEDIA}"]`)
    .forEach((item) => item.remove());

  ensureJesteiGraphicsRuntimeStyles(root);
}

export function removeObsoleteCopy(root = document) {
  SELECTORS.forEach((selector) => {
    root.querySelector(selector)?.remove();
  });

  updateJesteiColorCopy(root);
  updateJesteiGraphics(root);
}