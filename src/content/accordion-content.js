const PLACEHOLDER_PATTERN =
  /^(?:заголовок:?|короткий текст-заполнитель\.?|текст-заполнитель\.?|нумерованный список)$/i;

const PROJECT_CONTENT = {
  "Styx Jewels": {
    description:
      "Нишевый московский бренд украшений, аксессуаров и одежды, вдохновлённый готической романтикой и лавкрафтовским ужасом. Бренд продаётся оффлайн в Москве и Санкт-Петербурге и отправляет изделия с доставкой по всему миру.",
    intro:
      "Возглавил комплексную работу над визуальной системой, сформировал ДНК бренда: разработал логотип, собрал фирменный стиль, разработал дизайн упаковки, печатных материалов, соцсетей, рекламных публикаций, баннеров, продюсировал и снимал кампейны, лукбуки и каталоги, занимался технической, художественной и экспериментальной обработкой фотографий и создавал сканографические перекладные анимации и арты.",
    briefs: [
      {
        title: "графический дизайн",
        items: [
          "ДНК бренда: логотип и фирменный стиль",
          "Визуальная подача бренда",
          "Дизайн подарочной упаковки",
          "Дизайн визиток",
          "Дизайн буклетов",
          "Дизайн сертификатов",
          "Дизайн соцсетей",
          "Рекламные публикации",
          "Баннеры для Сплита и Долями",
        ],
      },
      {
        title: "фирменный стиль",
        items: [
          "Брендовая упаковка",
          "Дизайн печатной продукции",
          "Дизайн сертификатов",
          "Дизайн рекламы",
          "Дизайн буклетов",
        ],
      },
      {
        title: "фото и продакшен",
        items: [
          "Продюсирование съёмок",
          "Фотосъёмка кампейнов",
          "Организация мини-студии для каталога",
          "Ретушь и стилизация кадров",
          "Обработка коллабораций и каталожных съёмок",
        ],
      },
      {
        title: "сканографические анимации для бренда",
        items: [
          "Сканографические анимации для бренда",
          "Подготовка видеоанимаций для коммуникаций",
          "Два видеолупа с ручным включением звука",
        ],
      },
    ],
  },
  Shootings: {
    description:
      "Делаю дизайн обложек для российских музыкантов, продюсирую и снимаю контент-съёмки для музыкальных лейблов и для брендов одежды и публикую творческие работы в российских и европейских fashion- и арт-изданиях с 2017 года.",
    intro:
      "Кадры ниже — мои собственные фотографии, съёмки, которые я продюсировал, экспериментальные микс-медиа, которые я делал из собственных и чужих фотографий на заказ и дизайн, который делал я и который делали другие люди с моими фотографиями.",
    briefs: [
      {
        title: "Музыкальная фотография",
        items: [
          "Съёмка для обложки",
          "Контент-съёмка",
          "Дизайн обложек",
          "Экспериментальная обработка",
        ],
      },
      {
        title: "Экспериментальная фотография",
        items: [
          "Предметная сканография",
          "Портретная сканография",
          "Коллажирование",
          "Микс-медиа арт",
        ],
      },
      {
        title: "Коммерческая фотография",
        items: ["Лукбук", "Кампейн", "Каталожная съёмка"],
      },
      {
        title: "Съёмки для изданий",
        items: ["Спецпроекты", "Эдиториал", "Адверториал", "Фешн-стори"],
      },
    ],
  },
  Illumihand: {
    aliases: ["Иллюмихенд"],
    description: "Российский бренд одежды, родом с Камчатки.",
    hideIntro: true,
    hideBriefs: true,
  },
  "Berry Agency": {
    description:
      "Московское модельное агентство, которое занимается подбором моделей, организацией кастингов, созданием модельных портфолио, а также проведением фото- и видеосъёмок.",
    intro:
      "Работал фотографом и SMM-специалистом агентства, составлял контент-план, создавал дизайн постов, укомплектовал студию агентства оборудованием, снимал модельные тесты, коммерческие и эдиториал-фотосъёмки.",
    hideBriefs: true,
  },
  "S&S": {
    description:
      "Бренд стильных боди и нижнего белья с акцентом на выразительный силуэт, женственность и современную подачу.",
    intro:
      "Оформил инстаграм, создал и оформил соцсети, разработал контент-план, продюсировал фото- и видеосъёмки, снимал каталоги, лукбуки и кампейны, оформлял посты и сторис, настраивал рекламу на этапе запуска. В результате у бренда появились полноценные материалы для продвижения, первые продажи и сотрудничества со стилистами и фотографами.",
    hidePrinciple: true,
    hideBriefs: true,
  },
  "Digital Arts": {
    hideDescription: true,
    hideIntro: true,
    hidePrinciple: true,
    hideBriefs: true,
  },
  "Awful Tools": {
    hideDescription: true,
    hideIntro: true,
    hidePrinciple: true,
    hideBriefs: true,
  },
  "Moves Awful": {
    description: "Библиотека анимированных галерей для лендингов.",
    hideIntro: true,
    hidePrinciple: true,
    hideBriefs: true,
  },
  "Lyve Moscow": {
    aliases: ["Lyvé Moscow"],
    description: "Студия озеленения и ландшафтного дизайна с живым и художественным характером.",
    intro:
      "Ясоздал визуальный язык и дизайн систему: логотип,шрифт, макеты для лендинга,нарисовал маскота бренда",
    briefs: [
      {
        title: null,
        items: [
          "ДНК бренда на основе авторских иллюстраций",
          "Логотип для бренда",
          "Маскот бренда",
          "Иллюстрации для визуальной системы",
          "Дизайн руководства по уходу за растениями",
        ],
      },
      {
        title: null,
        items: ["Минималистичная дизайн-система сайта", "Игривый визуальный язык интерфейса"],
      },
    ],
    hidePrinciple: true,
  },
  Sensetique: {
    description: "Московская фотостудия и продакшн для моды, рекламы и визуального контента.",
    intro: "Занимался запуском, управлением, продюсированием съёмок и организацией команды.",
    hidePrinciple: true,
    hideBriefs: true,
  },
  "Mad Cow Films": {
    description: "Международный рекламный продакшн с офисами в Лондоне и Москве.",
    hideIntro: true,
    hidePrinciple: true,
    hideBriefs: true,
  },
  "LI-NE Agency": {
    description: "Продакшн-агентство в сфере моды, рекламы и медиа.",
    hideIntro: true,
    hidePrinciple: true,
    hideBriefs: true,
  },
  "Издательство Прогресс-Традиция": {
    aliases: ["Издательство «Прогресс»", "Издательство Прогресс", "Издательство “Прогресс”"],
    title: "Издательство Прогресс-Традиция",
    description:
      "Российское издательство переводной, гуманитарной, художественной и образовательной литературы. Компания выпускает книги и работает с полным издательским циклом: текстом, структурой, редакционной подготовкой, иллюстрациями, вёрсткой и подготовкой материалов к печати.",
    hideIntro: true,
    hidePrinciple: true,
    briefs: [
      {
        title: "книжный дизайн",
        items: [
          "Концепции и макеты книг",
          "Предпечатная подготовка иллюстраций",
          "Вёрстка и контроль процесса",
          "Подготовка книги к типографии",
        ],
      },
      {
        title: "клиентская работа",
        items: ["Переговоры с клиентами", "Анализ требований к изданию"],
      },
    ],
  },
  "Московские новости": {
    aliases: ["РИА Новости / Московские новости"],
    description: "Ежедневная городская общественно-политическая газета о Москве.",
    hideIntro: true,
    hidePrinciple: true,
    hideBriefs: true,
  },
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlaceholderText(value) {
  const text = normalizeText(value);
  return !text || PLACEHOLDER_PATTERN.test(text);
}

function isPlaceholder(node) {
  return isPlaceholderText(node?.textContent);
}

function findScene(root, canonicalTitle, content) {
  const acceptedTitles = new Set(
    [canonicalTitle, ...(content.aliases ?? [])].map(normalizeText),
  );

  return [...root.querySelectorAll(".cv-item")].find((scene) => {
    const project = normalizeText(scene.querySelector(".cv-item__project")?.textContent);
    const title = normalizeText(scene.querySelector(".cv-item__title")?.textContent);
    return acceptedTitles.has(project) || acceptedTitles.has(title);
  });
}

function show(node) {
  if (!node) return;
  node.hidden = false;
}

function hide(node) {
  if (!node) return;
  node.hidden = true;
}

function setText(node, value) {
  if (!node || value == null) return false;
  node.textContent = value;
  show(node);
  return true;
}

function getIntroCopy(scene) {
  const copies = [...scene.querySelectorAll(".cv-item__content > .cv-story .cv-story__copy")];
  return copies.find(
    (copy) =>
      !copy.classList.contains("cv-story__copy--section-note") &&
      !copy.closest(".principle") &&
      copy.querySelector("p"),
  );
}

function applyDescription(scene, content) {
  const description = scene.querySelector(".cv-item__copy");
  if (content.hideDescription || !content.description) {
    hide(description);
    return;
  }

  setText(description, content.description);
}

function applyIntro(scene, content) {
  const copy = getIntroCopy(scene);
  if (!copy) return;

  if (content.hideIntro || !content.intro) {
    hide(copy);
    return;
  }

  setText(copy.querySelector("p"), content.intro);
  show(copy);
}

function applyPrinciple(scene, content) {
  const principle = scene.querySelector(".principle");
  if (!principle) return;

  if (content.hidePrinciple || !content.principle) {
    hide(principle);
    return;
  }

  setText(principle.querySelector("h3, h4"), content.principle.title);
  setText(principle.querySelector("p"), content.principle.text);
  show(principle);
}

function writeList(list, items) {
  if (!list) return;

  const existingItems = [...list.children];
  items.forEach((item, index) => {
    const listItem = existingItems[index] ?? document.createElement("li");
    listItem.textContent = item;
    listItem.hidden = false;
    if (!listItem.parentElement) list.append(listItem);
  });

  existingItems.slice(items.length).forEach(hide);
}

function applyBriefs(scene, content) {
  const section = scene.querySelector(".brief");
  if (!section) return;

  const briefs = content.briefs ?? [];
  if (content.hideBriefs || briefs.length === 0) {
    hide(section);
    return;
  }

  const cards = [...section.querySelectorAll(".brief__card")];
  briefs.forEach((brief, index) => {
    const card = cards[index];
    if (!card) return;

    const heading = card.querySelector("h3, h4");
    if (brief.title) setText(heading, brief.title);
    else hide(heading);

    writeList(card.querySelector("ul, ol"), brief.items ?? []);
    show(card);
  });

  cards.slice(briefs.length).forEach(hide);
  show(section);
}

function hidePlaceholderCopies(root) {
  root.querySelectorAll(".cv-story__copy--section-note").forEach((copy) => {
    const heading = copy.querySelector("h3, h4");
    const paragraph = copy.querySelector("p");
    if (isPlaceholder(heading) || isPlaceholder(paragraph)) hide(copy);
  });

  root.querySelectorAll(".category-browser__copy, [data-media-caption]").forEach((node) => {
    if (isPlaceholder(node)) hide(node);
  });

  root.querySelectorAll(".counter-list").forEach((list) => {
    const values = [...list.querySelectorAll("h3, h4, p, li")].map((node) => node.textContent);
    if (values.some(isPlaceholderText)) hide(list.closest(".cv-story__copy") ?? list);
  });

  root.querySelectorAll("template").forEach((template) => {
    template.content
      ?.querySelectorAll("h3, h4, p, figcaption")
      .forEach((node) => {
        if (isPlaceholder(node)) hide(node);
      });
  });
}

function applyProjectContent(root, canonicalTitle, content) {
  const scene = findScene(root, canonicalTitle, content);
  if (!scene) return;

  if (content.title) {
    setText(scene.querySelector(".cv-item__project"), content.title);
    setText(scene.querySelector(".cv-item__title"), content.title);
  }

  applyDescription(scene, content);
  applyIntro(scene, content);
  applyPrinciple(scene, content);
  applyBriefs(scene, content);
}

export function applyAccordionContent(root = document) {
  Object.entries(PROJECT_CONTENT).forEach(([title, content]) => {
    applyProjectContent(root, title, content);
  });

  hidePlaceholderCopies(root);
}
