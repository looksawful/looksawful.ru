const PREVIEW_FRAME_SELECTOR =
  "#pet-projects .pet-projects-bento__frame, .pet-project-modal__frame";

const FORBIDDEN_PET_UI_SELECTOR = [
  ".mobile-back-button",
  ".pet-shell-nav",
  ".pet-shell-footer",
  ".fkeys",
].join(",");

const PREVIEW_STYLE_ID = "portfolio-pet-preview-cleanup";
const FRAME_STYLE_ID = "portfolio-pet-frame-cleanup";

const USEFUL_PROJECTS = [
  {
    slug: "berserk-timer",
    title: "berserk timer",
    description:
      "Консольный таймер, который задаёт контролирующие вопросы о том, что ты делал.",
    repository: "https://github.com/looksawful/berserk-timer",
    interactivePreview: false,
  },
  {
    slug: "awful-cases",
    title: "awful cases",
    description:
      "Windows-утилита для смены регистра выделенного текста горячими клавишами.",
    repository: "https://github.com/looksawful/awful-cases",
    interactivePreview: true,
  },
  {
    slug: "awful-audit",
    title: "awful audit",
    description:
      "CLI-утилита, которая собирает аудит кода проекта и копирует результат в буфер, архив или документ.",
    repository: "https://github.com/looksawful/awful-audit",
    interactivePreview: false,
  },
];

const GITHUB_ICON = `
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 .7a11.3 11.3 0 0 0-3.6 22c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.6 0-1.2.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.9 1.2 3.1 0 4.3-2.8 5.3-5.4 5.6.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.3 11.3 0 0 0 12 .7Z"/>
  </svg>
`;

const TEXT_CORRECTIONS = [
  [/пет-проекты/giu, "полезное"],
  [/пет-проект/giu, "инструмент"],
  [/\bпеты\b/giu, "полезное"],
  [/артдиректор/gu, "арт-директор"],
  [/Проектирую выразительные визуальные системы и интерфейс\./gu, "Проектирую выразительные визуальные системы и интерфейсы."],
  [/Владею css, canvas, glsl, threejs, пишу на js, ts и react, работаю в\s*blender, figma, adobe, comfyui с 2д и 3д графикой, иллюстрацией и моушеном\./gu, "Владею CSS, Canvas, GLSL, Three.js, пишу на JavaScript, TypeScript и React, работаю в Blender, Figma, Adobe, ComfyUI с 2D- и 3D-графикой, иллюстрацией и моушеном."],
  [/next\.js/giu, "Next.js"],
  [/ui\/ux/giu, "UI/UX"],
  [/ux\/ui/giu, "UX/UI"],
  [/UI\/UX lead/gu, "UI/UX-лид"],
  [/UX\/UI lead/gu, "UX/UI-лид"],
  [/\bux\b/gu, "UX"],
  [/\bui\b/gu, "UI"],
  [/\bcjm\b/giu, "CJM"],
  [/проработали реорганизовали/gu, "реорганизовали"],
  [/дизайн систему/gu, "дизайн-систему"],
  [/для ключевых пользовательских сценариев для/gu, "ключевых пользовательских сценариев для"],
  [/4 сегментов/gu, "четырёх сегментов"],
  [/промо организмы/gu, "промо-организмы"],
  [/леднгиовые/gu, "лендинговые"],
  [/в вк и яндексе/giu, "в VK и Яндексе"],
  [/для нее/gu, "для неё"],
  [/Ве это позволило подняли/gu, "Всё это позволило поднять"],
  [/подготвоиться/gu, "подготовиться"],
  [/объем/gu, "объём"],
  [/ai-пайплайны/giu, "AI-пайплайны"],
  [/дев-модом/gu, "Dev Mode"],
  [/4 цветовых профилей/gu, "четырёх цветовых профилей"],
  [/расширили продуктовую линейку 4 классам/gu, "расширили продуктовую линейку для четырёх классов"],
  [/ии-треки/giu, "ИИ-треки"],
  [/для в двух аудиториях/gu, "для двух аудиторий"],
  [/сша/giu, "США"],
  [/гротекст/gu, "гротеск"],
  [/DRUK Передает/gu, "Druk. Передаёт"],
  [/4 продуктовые темы/gu, "четыре продуктовые темы"],
  [/ивент диджеев/gu, "ивент-диджеев"],
  [/Тепреь/gu, "Теперь"],
  [/твердую/gu, "твёрдую"],
  [/информационный стиль речь/gu, "информационный стиль речи"],
  [/прорпбоатли/gu, "проработали"],
  [/"Что нового"/gu, "«Что нового»"],
  [/200\+ Описаний/gu, "200+ описаний"],
  [/50\+ Жанров/gu, "50+ жанров"],
  [/полезно—/gu, "полезно —"],
  [/Мы Не Пишем/gu, "Мы не пишем"],
  [/Инфоповодами для новости Не Может быть/gu, "Инфоповодами для новости не могут быть"],
  [/редактура,интерфейсы/gu, "редактура, интерфейсы"],
  [/ux\/ui lead/giu, "UX/UI-лид"],
  [/Record pool/gu, "Record Pool"],
  [/1500\+ Креативов/gu, "1500+ креативов"],
  [/\b3d\b/giu, "3D"],
  [/вдохновленный/gu, "вдохновлённый"],
  [/Баннеры для сплита и долями\./gu, "Баннеры для «Сплита» и «Долями»."],
  [/логотип, персонаж бренда/gu, "логотип, персонажа бренда"],
  [/sensetique photostudio/giu, "Sensétique Photostudio"],
  [/издательство прогресс/giu, "издательство «Прогресс-Традиция»"],
  [/с офисами в лондоне и москве/giu, "с офисами в Лондоне и Москве"],
  [/газета о москве/giu, "газета о Москве"],
  [/остается/gu, "остаётся"],
];

function correctTextValue(value, parentElement) {
  let corrected = value;

  for (const [pattern, replacement] of TEXT_CORRECTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }

  if (parentElement?.closest?.(".policy-page")) {
    corrected = corrected.replace(/^(\s*\d+)\.(?=\S)/u, "$1. ");
  }

  return corrected;
}

function applyTextCorrections(root = document) {
  const rootDocument = root.nodeType === 9 ? root : root.ownerDocument || document;
  const walker = rootDocument.createTreeWalker(root, 4);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const parentElement = node.parentElement;
    if (parentElement?.closest?.("script, style, code, pre, textarea")) {
      return;
    }

    const corrected = correctTextValue(node.nodeValue || "", parentElement);
    if (corrected !== node.nodeValue) {
      node.nodeValue = corrected;
    }
  });

  root.querySelectorAll?.("#jestei-cover .jestei-cover__detail strong").forEach((label) => {
    if (!label.textContent.trim().endsWith(":")) {
      label.textContent = `${label.textContent.trim()}:`;
    }
  });
}

function ensureDesktopResumeLink(root = document) {
  const desktopNav = root.querySelector(".site-header__chips[data-nav-chips]");
  if (!desktopNav || desktopNav.querySelector('a[href="/resume/"]')) {
    return;
  }

  const slot = root.createElement("span");
  slot.className = "site-header__chip-slot";

  const link = root.createElement("a");
  link.className = "site-header__chip";
  link.href = "/resume/";
  link.dataset.navChip = "";
  link.dataset.navState = "default";
  link.textContent = "резюме";

  slot.append(link);
  desktopNav.append(slot);
}

function retargetUsefulLinks(root = document) {
  root
    .querySelectorAll?.(
      '.site-header a[href="#pet-projects"], .site-header a[href="#pets"], .site-header a[href="#berserk-timer"]',
    )
    .forEach((link) => {
      if (link.getAttribute("href") !== "#pet-projects") {
        link.setAttribute("href", "#pet-projects");
      }
      if (link.textContent.trim().toLowerCase() !== "полезное") {
        link.textContent = "полезное";
      }
    });
}

function getUsefulProject(card) {
  const source = [
    card.querySelector(".pet-projects-bento__frame")?.getAttribute("src"),
    card.querySelector(".pet-projects-bento__body a[href]")?.getAttribute("href"),
    card.className,
  ]
    .filter(Boolean)
    .join(" ");

  return USEFUL_PROJECTS.find((project) => source.includes(project.slug));
}

function createGithubLink(project, root = document) {
  const link = root.createElement("a");
  link.className = "pet-projects-bento__github";
  link.href = project.repository;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `перейти на GitHub: ${project.title}`);
  link.innerHTML = `${GITHUB_ICON}<span class="pet-projects-bento__github-label">перейти на github</span>`;
  return link;
}

function upgradeUsefulSection(root = document) {
  const section = root.querySelector?.("#pet-projects");
  if (!section) {
    return;
  }

  section.setAttribute("aria-label", "полезное");

  const head = section.querySelector(".pet-projects-bento__head");
  const title = head?.querySelector(".pet-projects-bento__title");
  if (title && title.textContent.trim().toLowerCase() !== "полезное") {
    title.textContent = "полезное";
  }

  if (head && !head.querySelector(".pet-projects-bento__lead")) {
    const lead = root.createElement("p");
    lead.className = "pet-projects-bento__lead";
    lead.textContent = "Полезные инструменты, которые я создаю на досуге";
    head.append(lead);
  }

  section.querySelectorAll(".pet-projects-bento__card").forEach((card) => {
    if (card.dataset.usefulProjectReady === "true") {
      return;
    }

    const project = getUsefulProject(card);
    const body = card.querySelector(".pet-projects-bento__body");
    const media = card.querySelector(".pet-projects-bento__media");
    const frame = media?.querySelector(".pet-projects-bento__frame");
    const openButton = media?.querySelector(".pet-projects-bento__open");

    if (!project || !body || !media) {
      return;
    }

    card.dataset.usefulProjectReady = "true";
    card.dataset.usefulProject = project.slug;

    const titleLink = body.querySelector("h3 a");
    if (titleLink) {
      titleLink.textContent = project.title;
      titleLink.setAttribute("aria-label", `открыть ${project.title}`);
    }

    const description = body.querySelector("p");
    if (description) {
      description.textContent = project.description;
    }

    const actions = root.createElement("div");
    actions.className = "pet-projects-bento__actions";

    if (openButton) {
      openButton.className = "pet-projects-bento__visit";
      openButton.removeAttribute("style");
      openButton.textContent = "открыть";
      openButton.setAttribute("aria-label", `открыть ${project.title} на сайте`);
      actions.append(openButton);
    }

    actions.append(createGithubLink(project, root));
    body.append(actions);

    if (project.interactivePreview && frame) {
      card.setAttribute("data-interactive-preview", "");
      frame.tabIndex = 0;
      frame.removeAttribute("aria-hidden");
      frame.title = `${project.title} — интерактивная игра`;

      const hint = root.createElement("span");
      hint.className = "pet-projects-bento__game-hint";
      hint.textContent = "играть в карточке";
      media.append(hint);
    } else if (openButton) {
      const mediaOpen = root.createElement("button");
      mediaOpen.className = "pet-projects-bento__media-open";
      mediaOpen.type = "button";
      mediaOpen.setAttribute("aria-label", `открыть ${project.title}`);
      mediaOpen.addEventListener("click", () => openButton.click());
      media.append(mediaOpen);
    }
  });
}

function ensurePreviewStyles() {
  let style = document.getElementById(PREVIEW_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = PREVIEW_STYLE_ID;
    document.head.append(style);
  }

  style.textContent = `
    #pet-projects .pet-projects-bento__head {
      display: grid;
      gap: clamp(0.55rem, 1.2vw, 0.9rem);
    }

    #pet-projects .pet-projects-bento__lead {
      max-inline-size: 42rem;
      margin: 0;
      color: color-mix(in srgb, var(--black) 72%, transparent);
      font-size: clamp(0.95rem, 1.25vw, 1.18rem);
      line-height: 1.35;
    }

    #pet-projects .pet-projects-bento__card {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      aspect-ratio: 3 / 4;
      background: color-mix(in srgb, var(--white) 96%, var(--black));
    }

    #pet-projects .pet-projects-bento__media {
      position: relative;
      inset: auto;
      min-block-size: 0;
      border-radius: 0;
      overflow: hidden;
    }

    #pet-projects .pet-projects-bento__frame {
      inline-size: 100% !important;
      block-size: 100% !important;
      transform: none !important;
      pointer-events: none;
    }

    #pet-projects [data-interactive-preview] .pet-projects-bento__frame {
      pointer-events: auto;
    }

    #pet-projects .pet-projects-bento__body {
      position: relative;
      z-index: 5;
      display: grid;
      gap: 0.45rem;
      min-block-size: clamp(7.8rem, 10vw, 9.4rem);
      border-block-start: 1px solid color-mix(in srgb, var(--black) 16%, transparent);
      padding: clamp(0.85rem, 1.5vw, 1.15rem);
      background: color-mix(in srgb, var(--white) 96%, var(--black));
    }

    #pet-projects .pet-projects-bento__body h3 {
      margin: 0;
      font-size: clamp(0.92rem, 1.1vw, 1.08rem);
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.015em;
    }

    #pet-projects .pet-projects-bento__body h3 a {
      color: inherit;
      text-decoration: none;
    }

    #pet-projects .pet-projects-bento__body p {
      margin: 0;
      color: color-mix(in srgb, var(--black) 70%, transparent);
      font-size: clamp(0.76rem, 0.88vw, 0.88rem);
      line-height: 1.35;
    }

    #pet-projects .pet-projects-bento__actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.55rem;
      margin-block-start: auto;
      padding-block-start: 0.25rem;
    }

    #pet-projects .pet-projects-bento__visit,
    #pet-projects .pet-projects-bento__github {
      position: static;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.42rem;
      min-block-size: 2.2rem;
      border: 1px solid color-mix(in srgb, var(--black) 20%, transparent);
      border-radius: 999px;
      padding: 0.48rem 0.75rem;
      background: var(--white);
      color: var(--black);
      font: inherit;
      font-size: 0.74rem;
      font-weight: 650;
      line-height: 1;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      box-shadow: none;
      transition: background-color 160ms var(--ease-standard), color 160ms var(--ease-standard), transform 160ms var(--ease-standard);
    }

    #pet-projects .pet-projects-bento__visit::after {
      content: "↗";
      position: static;
      display: inline;
      inline-size: auto;
      block-size: auto;
      border: 0;
      background: transparent;
      color: currentColor;
      font-size: 0.9rem;
      opacity: 1;
      transform: none;
      box-shadow: none;
    }

    #pet-projects .pet-projects-bento__visit:hover,
    #pet-projects .pet-projects-bento__visit:focus-visible,
    #pet-projects .pet-projects-bento__github:hover,
    #pet-projects .pet-projects-bento__github:focus-visible {
      background: var(--black);
      color: var(--white);
      outline: 0;
      transform: translateY(-1px);
    }

    #pet-projects .pet-projects-bento__github svg {
      inline-size: 1rem;
      block-size: 1rem;
      flex: 0 0 auto;
    }

    #pet-projects .pet-projects-bento__media-open {
      position: absolute;
      z-index: 3;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      border: 0;
      padding: 0;
      background: transparent;
      color: var(--black);
      cursor: zoom-in;
    }

    #pet-projects .pet-projects-bento__media-open::after {
      content: "↗";
      position: absolute;
      inset-block-start: 0.65rem;
      inset-inline-end: 0.65rem;
      display: grid;
      place-items: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border: 1px solid color-mix(in srgb, var(--black) 20%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--white) 90%, transparent);
      color: var(--black);
      font-size: 0.95rem;
      box-shadow: 0 0.3rem 0.9rem rgba(0, 0, 0, 0.1);
      -webkit-backdrop-filter: blur(0.5rem);
      backdrop-filter: blur(0.5rem);
      transition: background-color 160ms var(--ease-standard), color 160ms var(--ease-standard), transform 160ms var(--ease-standard);
    }

    #pet-projects .pet-projects-bento__media-open:hover::after,
    #pet-projects .pet-projects-bento__media-open:focus-visible::after {
      background: var(--black);
      color: var(--white);
      transform: scale(1.04);
    }

    #pet-projects .pet-projects-bento__media-open:focus-visible {
      outline: 3px solid var(--black);
      outline-offset: -3px;
    }

    #pet-projects .pet-projects-bento__game-hint {
      position: absolute;
      z-index: 2;
      inset-inline-start: 0.65rem;
      inset-block-end: 0.65rem;
      display: inline-flex;
      align-items: center;
      min-block-size: 2rem;
      border: 1px solid color-mix(in srgb, var(--black) 20%, transparent);
      border-radius: 999px;
      padding: 0.4rem 0.65rem;
      background: color-mix(in srgb, var(--white) 90%, transparent);
      color: var(--black);
      font-size: 0.7rem;
      font-weight: 650;
      line-height: 1;
      pointer-events: none;
      -webkit-backdrop-filter: blur(0.5rem);
      backdrop-filter: blur(0.5rem);
    }

    @media (max-width: 44rem) {
      #pet-projects .pet-projects-bento__card {
        aspect-ratio: auto;
        block-size: clamp(38rem, 82svh, 46rem);
      }

      #pet-projects .pet-projects-bento__body {
        min-block-size: 9.5rem;
        padding: 0.85rem;
      }

      #pet-projects .pet-projects-bento__github {
        inline-size: 2.35rem;
        padding-inline: 0;
      }

      #pet-projects .pet-projects-bento__github-label {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #pet-projects .pet-projects-bento__visit,
      #pet-projects .pet-projects-bento__github,
      #pet-projects .pet-projects-bento__media-open::after {
        transition: none;
      }
    }
  `;
}

function cleanFrameDocument(frame) {
  let frameDocument;

  try {
    frameDocument = frame.contentDocument;
  } catch {
    return;
  }

  if (!frameDocument?.documentElement) {
    return;
  }

  frameDocument.querySelectorAll(FORBIDDEN_PET_UI_SELECTOR).forEach((node) => node.remove());
  applyTextCorrections(frameDocument);

  const isPreview = frame.classList.contains("pet-projects-bento__frame");
  const isAwfulCases = frame.src.includes("/pets/awful-cases/");

  if (isAwfulCases) {
    frameDocument
      .querySelectorAll('.command-row[aria-label="Project links"]')
      .forEach((node) => node.remove());
  }

  let style = frameDocument.getElementById(FRAME_STYLE_ID);
  if (!style) {
    style = frameDocument.createElement("style");
    style.id = FRAME_STYLE_ID;
    frameDocument.head?.append(style);
  }

  const previewRules = isPreview
    ? `
      :root {
        --page: 100% !important;
      }

      html,
      body {
        inline-size: 100% !important;
        min-inline-size: 0 !important;
        overflow-x: hidden !important;
      }

      .page,
      .desktop {
        inline-size: 100% !important;
        max-inline-size: none !important;
        margin-inline: 0 !important;
      }
    `
    : "";

  const awfulCasesPreviewRules = isPreview && isAwfulCases
    ? `
      html,
      body {
        block-size: 100% !important;
        min-block-size: 100% !important;
        overflow: hidden !important;
        background: #007a7a !important;
      }

      .desktop {
        display: block !important;
        block-size: 100% !important;
        min-block-size: 100% !important;
        padding: 0 !important;
      }

      .desktop > :not(.window--runner) {
        display: none !important;
      }

      .window--runner {
        display: block !important;
        inline-size: 100% !important;
        max-inline-size: none !important;
        block-size: 100% !important;
        border: 0 !important;
        box-shadow: none !important;
      }

      .window--runner > .titlebar,
      .window--runner > .menubar {
        display: none !important;
      }

      .window--runner > .client {
        inline-size: 100% !important;
        block-size: 100% !important;
        min-block-size: 100% !important;
        padding: 0 !important;
      }

      .runner-shell,
      .runner-frame {
        inline-size: 100% !important;
        block-size: 100% !important;
        height: 100% !important;
        min-block-size: 100% !important;
        border: 0 !important;
      }
    `
    : "";

  style.textContent = `
    ${FORBIDDEN_PET_UI_SELECTOR},
    .command-row[aria-label="Project links"] {
      display: none !important;
    }

    ${frame.src.includes("/pets/awful-audit/") ? ".page { padding-bottom: var(--page-pad) !important; }" : ""}
    ${previewRules}
    ${awfulCasesPreviewRules}
  `;

  if (isPreview && isAwfulCases) {
    const runnerFrame = frameDocument.querySelector(".runner-frame");
    if (runnerFrame) {
      runnerFrame.removeAttribute("tabindex");
      runnerFrame.setAttribute("title", "Awful Cases — игра");
      runnerFrame.style.pointerEvents = "auto";
    }
  }
}

function prepareFrame(frame) {
  if (frame.dataset.petPreviewCleanupReady === "true") {
    cleanFrameDocument(frame);
    return;
  }

  frame.dataset.petPreviewCleanupReady = "true";
  frame.addEventListener("load", () => cleanFrameDocument(frame));
  cleanFrameDocument(frame);
}

function scanFrames(root = document) {
  root.querySelectorAll?.(PREVIEW_FRAME_SELECTOR).forEach(prepareFrame);
}

ensurePreviewStyles();
ensureDesktopResumeLink(document);
retargetUsefulLinks(document);
applyTextCorrections(document);
upgradeUsefulSection(document);
scanFrames();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) {
        continue;
      }

      applyTextCorrections(node);
      retargetUsefulLinks(document);
      upgradeUsefulSection(document);

      if (node.matches(PREVIEW_FRAME_SELECTOR)) {
        prepareFrame(node);
      }

      scanFrames(node);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
