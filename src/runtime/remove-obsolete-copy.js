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

export function removeObsoleteCopy(root = document) {
  SELECTORS.forEach((selector) => {
    root.querySelector(selector)?.remove();
  });

  updateJesteiColorCopy(root);
}
