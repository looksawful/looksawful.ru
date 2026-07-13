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

const TEXT_CORRECTIONS = [
  [/артдиректор/gu, "арт-директор"],
  [/Проектирую выразительные визуальные системы и интерфейс\./gu, "Проектирую выразительные визуальные системы и интерфейсы."],
  [/Владею css, canvas, glsl, threejs, пишу на js, ts и react, работаю в\s*blender, figma, adobe, comfyui с 2д и 3д графикой, иллюстрацией и моушеном\./gu, "Владею CSS, Canvas, GLSL, Three.js, пишу на JavaScript, TypeScript и React, работаю в Blender, Figma, Adobe, ComfyUI с 2D- и 3D-графикой, иллюстрацией и моушеном."],
  [/next\.js/giu, "Next.js"],
  [/ui\/ux/giu, "UI/UX"],
  [/ux\/ui/giu, "UX/UI"],
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

function ensurePreviewStyles() {
  if (document.getElementById(PREVIEW_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = PREVIEW_STYLE_ID;
  style.textContent = `
    #pet-projects .pet-projects-bento__frame {
      inline-size: 100% !important;
      block-size: 100% !important;
      transform: none !important;
    }
  `;
  document.head.append(style);
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

  if (frame.src.includes("/pets/awful-cases/")) {
    frameDocument
      .querySelectorAll('.command-row[aria-label="Project links"]')
      .forEach((node) => node.remove());
  }

  if (!frameDocument.getElementById(FRAME_STYLE_ID)) {
    const style = frameDocument.createElement("style");
    style.id = FRAME_STYLE_ID;

    const isPreview = frame.classList.contains("pet-projects-bento__frame");
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

    style.textContent = `
      ${FORBIDDEN_PET_UI_SELECTOR},
      .command-row[aria-label="Project links"] {
        display: none !important;
      }

      ${frame.src.includes("/pets/awful-audit/") ? ".page { padding-bottom: var(--page-pad) !important; }" : ""}
      ${previewRules}
    `;

    frameDocument.head?.append(style);
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
applyTextCorrections(document);
scanFrames();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) {
        continue;
      }

      applyTextCorrections(node);

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