const PLACEHOLDER_PATTERN = /^(?:заголовок:?|короткий текст-заполнитель\.?|текст-заполнитель\.?|нумерованный список)$/i;

const PROJECT_PATCHES = {
  "Styx Jewels": {
    description:
      "Нишевый московский бренд украшений, аксессуаров и одежды, вдохновлённый готической романтикой и лавкрафтовским ужасом. Бренд продаётся офлайн в Москве и крупных городах России и отправляет изделия с доставкой по всему миру.",
    briefs: [
      {
        title: "арт-дирекшн",
        items: ["Формирование визуального языка", "Контроль целостности коммуникаций"],
      },
      {
        title: "фирменный стиль",
        items: ["Логотип", "Упаковка", "Печатные материалы", "Сертификаты"],
      },
      {
        title: "графический дизайн",
        items: ["Соцсети", "Рекламные публикации", "Баннеры", "Буклеты"],
      },
      {
        title: "фото и продакшен",
        items: ["Продюсирование кампейнов", "Каталоги", "Лукбуки", "Мини-студия"],
      },
      {
        title: "постобработка",
        items: ["Ретушь", "Художественная обработка", "Стилизация кадров"],
      },
      {
        title: "сканографика и анимация",
        items: ["Сканографические арты", "Перекладная анимация", "Видеолупы"],
      },
    ],
    sectionNotes: {
      "styx-01-": {
        title: "фирменная упаковка",
        text: "Подарочная упаковка, карточки, стикеры и 3D-презентация собраны в одну систему, которая сохраняет характер бренда в физическом и цифровом контакте.",
      },
      "styx-02-": {
        title: "сканографические анимации",
        text: "Сканография стала отдельным выразительным инструментом бренда: предметы и фактуры переводятся в ручную покадровую пластику для социальных сетей и продуктовых запусков.",
      },
      "styx-05-": {
        title: "кампейны и коллаборации",
        text: "Фотографии, коллаборации и экспериментальная обработка объединены общей пластикой, чтобы кампейны оставались узнаваемыми при разном составе команды и материала.",
      },
      "styx-07-": {
        title: "экспериментальная обработка",
        text: "Сканографические портреты и смешанные техники расширяют каталог за пределы обычной предметной съёмки и формируют художественный слой бренда.",
      },
      "styx-10-": {
        title: "графика для соцсетей",
        text: "Инструкции и сервисные публикации оформлены в том же визуальном языке, что и кампейны: функциональный контент не выпадает из общей системы бренда.",
      },
    },
  },
  Shootings: {
    intro:
      "Продюсировал и снимал коммерческие и авторские проекты для музыкантов, брендов и медиа: от визуальной идеи и подготовки команды до съёмки, отбора материала и финальной обработки.",
    briefs: [
      { title: "концепция", items: ["Визуальная идея", "Референсы", "Мудборд", "Сценарий серии"] },
      { title: "подготовка", items: ["Команда", "Локация", "Свет", "Реквизит", "Съёмочный план"] },
      { title: "продюсирование", items: ["Координация участников", "График", "Организация площадки"] },
      { title: "фотосъёмка", items: ["Портрет", "Fashion", "Обложки", "Контент-съёмка"] },
      { title: "постобработка", items: ["Отбор", "Цветокоррекция", "Ретушь", "Композитинг"] },
      { title: "mixed-media", items: ["Коллажи", "Арт-обработка", "Графика для музыкальных релизов"] },
    ],
    firstSectionNote: {
      title: "от идеи до финального кадра",
      text: "Каждая серия строилась вокруг задачи артиста или проекта. Я собирал визуальную концепцию, команду и технический план, а затем контролировал единый результат на съёмке и постобработке.",
    },
    sectionNotes: {
      "shootings-05-": {
        title: "обложка сингла",
        text: "Съёмка и постобработка собраны вокруг одного ключевого кадра, который работает как обложка релиза и основа для последующих промоматериалов.",
      },
      "shootings-12-": {
        title: "музыкальные обложки",
        text: "Для музыкальных релизов фотография становится частью графической системы: кадр, типографика и обработка должны одинаково работать в квадрате, вертикали и промоформатах.",
      },
      "shootings-14-": {
        title: "экспериментальный постпродакшен",
        text: "Смешанная обработка соединяет фотографию, световые эффекты и графические слои, превращая исходный портрет в самостоятельный арт.",
      },
      "shootings-19-": {
        title: "сценические проекты",
        text: "В театральных и перформативных проектах серия фиксирует не только персонажа, но и свет, пластику сцены и атмосферу постановки.",
      },
    },
  },
  "Berry Agency": {
    briefs: [
      { title: "контент-стратегия", items: ["Рубрики", "Ритм публикаций", "Задачи контента для площадок"] },
      { title: "визуальные концепции", items: ["Серии публикаций для кампаний, кастингов и постоянных рубрик"] },
      { title: "система шаблонов", items: ["Модульные макеты для быстрого выпуска постов и сторис"] },
      { title: "анимация и форматы", items: ["Короткая анимация", "Сторис", "Ролики", "Рекламные размеры"] },
      { title: "фотосъёмка", items: ["Модельные тесты", "Коммерческие и editorial-съёмки"] },
      { title: "студия и производство", items: ["Комплектация студии", "Организация съёмочного процесса"] },
    ],
  },
  "S&S": {
    principle: {
      title: "запуск бренда",
      text: "Собрал визуальную коммуникацию для запуска: оформил соцсети, разработал контент-план, организовал съёмки и подготовил материалы для первых продаж и партнёрств.",
    },
    briefs: [
      { title: "smm-стратегия", items: ["Позиционирование в соцсетях", "План запуска", "Рубрики"] },
      { title: "контент-план", items: ["Темы", "График публикаций", "Сценарии постов и сторис"] },
      { title: "дизайн соцсетей", items: ["Оформление профилей", "Шаблоны", "Публикации"] },
      { title: "продюсирование", items: ["Команда", "Локации", "Каталоги", "Лукбуки", "Кампейны"] },
      { title: "фотография", items: ["Съёмка продукта и моделей", "Отбор", "Постобработка"] },
      { title: "продвижение", items: ["Рекламные материалы", "Настройка рекламы", "Партнёрства"] },
    ],
  },
  "Awful Tools": {
    description:
      "Awful Tools — серия небольших прикладных инструментов. В неё входят Awful Cases — Windows-утилита для изменения регистра и типографической обработки выделенного текста, Berserk Timer — консольный таймер с гибкой настройкой длительности и фиксацией выполненной работы после сессии, а также Awful Audit — инструмент для анализа статических фронтенд-проектов, исходного кода, ассетов, импортов, сборки и состояния Git.",
    intro:
      "Разрабатываю небольшие утилиты для повторяющихся задач дизайнера: обработка текста, аудит фронтенда и управление рабочими сессиями.",
    firstSectionNote: {
      title: "инструменты под реальные процессы",
      text: "Каждый инструмент начинается с конкретной рабочей проблемы и остаётся небольшим самостоятельным продуктом с собственным интерфейсом, документацией и сценарием использования.",
    },
  },
  "Moves Awful": {
    intro:
      "Разработал библиотеку Canvas-галерей с настраиваемыми траекториями, скоростью, композицией и режимами управления для разных типов лендингов.",
  },
  "Mad Cow Films": {
    intro:
      "Участвовал в подготовке рекламных съёмок: собирал материалы для тендеров, координировал сметы, кастинги и производственные задачи.",
  },
  "LI-NE Agency": {
    intro:
      "Координировал подготовку fashion- и рекламных съёмок: документы, команды, локации, графики и работу площадки.",
  },
  "Издательство Прогресс-Традиция": {
    aliases: ["Издательство «Прогресс»", "Издательство Прогресс", "Издательство “Прогресс”"],
    title: "Издательство Прогресс-Традиция",
    description:
      "Российское издательство переводной, гуманитарной, художественной и образовательной литературы. Компания выпускает книги и работает с полным издательским циклом: текстом, структурой, редакционной подготовкой, иллюстрациями, вёрсткой и подготовкой материалов к печати.",
    intro:
      "Разрабатывал макеты книг, готовил иллюстрации, верстал издания и сопровождал материалы до печати.",
  },
  "Московские новости": {
    aliases: ["РИА Новости / Московские новости"],
    intro: "Верстал ежедневные выпуски газеты и готовил графические материалы для публикации.",
  },
};

const JESTEI_SECTION_NOTES = {
  "jestei-03-": {
    title: "ux/ui-стратегия",
    text: "Собрали интерфейс вокруг основных сценариев диджея: поиск нового материала, подготовка к сету, работа с плейлистами и быстрый доступ к скачиванию. Навигацию и компоненты объединили в единую систему, чтобы новые разделы можно было запускать без пересборки продукта.",
  },
  "jestei-04-": {
    title: "добавили цвет",
    text: "Расширили монохромную основу функциональными цветовыми темами. Палитры помогают различать режимы и разделы, поддерживают контраст интерфейса и дают продукту эмоциональный диапазон без потери узнаваемости.",
  },
  "jestei-05-": {
    title: "добавили графический дизайн",
    text: "Разработали графическую систему для продуктовых запусков и коммуникаций: обложки, баннеры, 3D-сцены, генеративные композиции и адаптивные шаблоны. Один визуальный язык работает в интерфейсе, соцсетях и рекламных форматах.",
  },
};

const JESTEI_DETAILS = {
  "detail-jestei-logo":
    "Логотип построен как компактный цифровой знак и словесное написание. Он одинаково работает в интерфейсе, на обложках, в анимации и в малых форматах.",
  "detail-jestei-palette":
    "Основу палитры составляют нейтральные интерфейсные цвета и набор акцентных тем. Акцент помогает различать контекст, не конкурируя с музыкальными обложками и данными.",
  "detail-jestei-type":
    "Типографическая система разделяет навигацию, данные и редакционный текст. Размеры и начертания объединены в токены, поэтому иерархия сохраняется на всех экранах.",
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlaceholder(node) {
  const text = normalizeText(node?.textContent);
  return !text || PLACEHOLDER_PATTERN.test(text);
}

function findScene(root, canonicalTitle, patch) {
  const acceptedTitles = new Set([canonicalTitle, ...(patch.aliases ?? [])].map(normalizeText));

  return [...root.querySelectorAll(".cv-item")].find((scene) => {
    const project = normalizeText(scene.querySelector(".cv-item__project")?.textContent);
    const title = normalizeText(scene.querySelector(".cv-item__title")?.textContent);
    return acceptedTitles.has(project) || acceptedTitles.has(title);
  });
}

function replaceText(node, value, { placeholderOnly = false } = {}) {
  if (!node || !value || (placeholderOnly && !isPlaceholder(node))) return false;
  node.textContent = value;
  return true;
}

function applyBriefs(scene, briefs) {
  if (!briefs?.length) return;

  const cards = [...scene.querySelectorAll(".brief__card")];
  briefs.forEach((brief, index) => {
    const card = cards[index];
    if (!card) return;

    replaceText(card.querySelector("h3, h4"), brief.title);

    const list = card.querySelector("ul, ol");
    if (!list) return;

    list.replaceChildren(
      ...brief.items.map((item) => {
        const listItem = document.createElement("li");
        listItem.textContent = item;
        return listItem;
      }),
    );
  });
}

function applySectionNote(section, note) {
  if (!section || !note) return;
  const copy = section.querySelector(".cv-story__copy--section-note, .cv-story__copy");
  if (!copy) return;

  const heading = copy.querySelector("h3, h4");
  const paragraph = copy.querySelector("p");
  if (!isPlaceholder(heading) && !isPlaceholder(paragraph)) return;

  replaceText(heading, note.title);
  replaceText(paragraph, note.text);
}

function applyMediaSectionNotes(scene, sectionNotes) {
  Object.entries(sectionNotes ?? {}).forEach(([mediaPrefix, note]) => {
    const media = scene.querySelector(`[data-media-id^="${mediaPrefix}"]`);
    applySectionNote(media?.closest("section"), note);
  });
}

function applyFirstSectionNote(scene, note) {
  if (!note) return;

  const candidates = [...scene.querySelectorAll(".cv-story__copy--section-note")];
  const copy = candidates.find((candidate) => {
    const heading = candidate.querySelector("h3, h4");
    const paragraph = candidate.querySelector("p");
    return isPlaceholder(heading) || isPlaceholder(paragraph);
  });

  applySectionNote(copy?.closest("section"), note);
}

function applyIntro(scene, text) {
  if (!text) return;

  const paragraphs = [...scene.querySelectorAll(".cv-item__content > .cv-story .cv-story__copy p")];
  const paragraph = paragraphs.find(isPlaceholder);
  replaceText(paragraph, text, { placeholderOnly: true });
}

function applyPrinciple(scene, principle) {
  if (!principle) return;
  const block = scene.querySelector(".principle");
  if (!block) return;

  replaceText(block.querySelector("h3, h4"), principle.title, { placeholderOnly: true });
  replaceText(block.querySelector("p"), principle.text, { placeholderOnly: true });
}

function applyProjectPatch(root, canonicalTitle, patch) {
  const scene = findScene(root, canonicalTitle, patch);
  if (!scene) return;

  if (patch.title) {
    replaceText(scene.querySelector(".cv-item__project"), patch.title);
    replaceText(scene.querySelector(".cv-item__title"), patch.title);
  }

  replaceText(scene.querySelector(".cv-item__copy"), patch.description);
  applyIntro(scene, patch.intro);
  applyPrinciple(scene, patch.principle);
  applyBriefs(scene, patch.briefs);
  applyFirstSectionNote(scene, patch.firstSectionNote);
  applyMediaSectionNotes(scene, patch.sectionNotes);
}

function applyJesteiCounterList(root) {
  const heading = root.querySelector("#jestei-filter-steps-title");
  const story = heading?.closest(".cv-story");
  if (!story) return;

  replaceText(heading, "как устроили сложный фильтр", { placeholderOnly: true });

  const steps = [
    {
      title: "базовый режим",
      text: "Оставили самые частые параметры: жанр, BPM, тональность, рейтинг и тип трека.",
    },
    {
      title: "продвинутые условия",
      text: "Добавили группы условий с логикой «И» и «ИЛИ» для сложных музыкальных запросов.",
    },
    {
      title: "прозрачное состояние",
      text: "Пользователь видит активные параметры и может сбросить отдельное условие или весь набор.",
    },
  ];

  [...story.querySelectorAll(".counter-list > li")].forEach((item, index) => {
    const step = steps[index];
    if (!step) return;
    replaceText(item.querySelector("h4, h3"), step.title, { placeholderOnly: true });
    replaceText(item.querySelector("p"), step.text, { placeholderOnly: true });
  });
}

function applyJesteiDetails(root) {
  Object.entries(JESTEI_DETAILS).forEach(([id, text]) => {
    const template = root.getElementById(id);
    const paragraph = template?.content?.querySelector("p") ?? template?.querySelector("p");
    replaceText(paragraph, text, { placeholderOnly: true });
  });
}

export function applyAccordionContent(root = document) {
  Object.entries(PROJECT_PATCHES).forEach(([title, patch]) => {
    applyProjectPatch(root, title, patch);
  });

  const jestei = findScene(root, "Jestei Pool", {});
  if (jestei) applyMediaSectionNotes(jestei, JESTEI_SECTION_NOTES);

  applyJesteiCounterList(root);
  applyJesteiDetails(root);
}
