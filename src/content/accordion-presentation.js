const PLACEHOLDER_PATTERN =
  /^(?:заголовок:?|короткий текст-заполнитель\.?|текст-заполнитель\.?|нумерованный список)$/i;

const EDITORIAL_COPY_SELECTOR =
  ".cv-item__content > .cv-story .cv-story__copy";

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasUsefulText(node) {
  const text = normalizeText(node?.textContent);
  return Boolean(text) && !PLACEHOLDER_PATTERN.test(text);
}

function hide(node) {
  if (node instanceof HTMLElement) node.hidden = true;
}

function show(node) {
  if (node instanceof HTMLElement) node.hidden = false;
}

function getProjectName(scene) {
  return normalizeText(
    scene.querySelector(".cv-item__project")?.textContent ??
      scene.querySelector(".cv-item__title")?.textContent,
  );
}

function revealSceneIdentity(scene) {
  show(scene.querySelector(".cv-item__title"));
  show(scene.querySelector(".cv-item__number"));

  const description = scene.querySelector(".cv-item__copy");
  if (hasUsefulText(description)) show(description);
  else hide(description);
}

function findPrimaryCopy(scene) {
  const header = scene.querySelector(".cv-item__intro");
  const existing = header?.querySelector(
    ":scope > [data-accordion-primary-copy]",
  );

  if (existing instanceof HTMLElement) return existing;

  return [...scene.querySelectorAll(EDITORIAL_COPY_SELECTOR)].find((copy) => {
    if (!(copy instanceof HTMLElement) || copy.hidden) return false;
    if (copy.classList.contains("cv-story__copy--section-note")) return false;
    if (copy.closest(".principle")) return false;

    return hasUsefulText(copy.querySelector("p"));
  });
}

function movePrimaryCopy(scene) {
  const header = scene.querySelector(".cv-item__intro");
  const copy = findPrimaryCopy(scene);

  if (!(header instanceof HTMLElement) || !(copy instanceof HTMLElement)) {
    return null;
  }

  const sourceSection = copy.closest(".cv-story");

  copy
    .querySelectorAll(":scope > :is(h1, h2, h3, h4, h5, h6)")
    .forEach(hide);

  const paragraphs = [...copy.querySelectorAll(":scope > p")];
  paragraphs.forEach((paragraph, index) => {
    if (index === 0 && hasUsefulText(paragraph)) show(paragraph);
    else hide(paragraph);
  });

  if (!paragraphs.some((paragraph) => !paragraph.hidden)) {
    hide(copy);
    return null;
  }

  copy.dataset.accordionPrimaryCopy = "";
  show(copy);

  const description = header.querySelector(".cv-item__copy");
  const anchor =
    description instanceof HTMLElement && !description.hidden
      ? description
      : header.querySelector(".cv-item__title");

  if (anchor instanceof HTMLElement && copy.parentElement !== header) {
    anchor.after(copy);
  } else if (copy.parentElement !== header) {
    header.prepend(copy);
  }

  if (
    sourceSection instanceof HTMLElement &&
    sourceSection.children.length === 0
  ) {
    hide(sourceSection);
  }

  return copy;
}

function prepareJesteiFilterCopy(scene) {
  if (getProjectName(scene) !== "Jestei Pool") return;

  const section = scene.querySelector(".cv-story--workflow-pile");
  const copy = section?.querySelector(":scope > .cv-story__copy");
  const list = copy?.querySelector(":scope > .counter-list");

  if (!(copy instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

  copy.dataset.accordionPersistentCopy = "";

  const title = copy.querySelector(":scope > h3");
  if (title instanceof HTMLElement) {
    title.textContent = "Мы полностью переработали архитектуру фильтра треков.";
    show(title);
  }

  let intro = copy.querySelector(":scope > [data-jestei-filter-intro]");
  if (!(intro instanceof HTMLElement)) {
    intro = document.createElement("p");
    intro.dataset.jesteiFilterIntro = "";
    list.before(intro);
  }

  intro.textContent =
    "Мы провели исследование и переработали его по принципу прогрессивной вложенности: вместо одной модалки со всеми параметрами сразу мы создали в системе фильтрации два пользовательских режима:";
  show(intro);

  const items = [...list.children];
  const modes = [
    {
      title: "Компактный фильтр",
      text: "Предлагает основные параметры, которые диджеи используют при каждом поиске.",
    },
    {
      title: "Продвинутый фильтр",
      text: "Позволяет настроить поиск точнее, фильтруя все существующие в системе параметры. Такой фильтр подходит селекционерам, которые точно знают, что они ищут.",
    },
  ];

  modes.forEach((mode, index) => {
    const item = items[index];
    if (!(item instanceof HTMLElement)) return;

    const itemTitle = item.querySelector("h3, h4");
    const itemText = item.querySelector("p");

    if (itemTitle instanceof HTMLElement) itemTitle.textContent = mode.title;
    if (itemText instanceof HTMLElement) itemText.textContent = mode.text;
    show(item);
  });

  items.slice(modes.length).forEach(hide);
  show(list);
  show(copy);
  show(section);
}

function hideSecondaryEditorialContent(scene, primaryCopy) {
  scene.querySelectorAll(EDITORIAL_COPY_SELECTOR).forEach((copy) => {
    if (
      copy !== primaryCopy &&
      !copy.hasAttribute("data-accordion-persistent-copy")
    ) {
      hide(copy);
    }
  });

  scene.querySelectorAll(".principle, .brief").forEach(hide);
}

function hideJesteiNavigation(scene) {
  if (getProjectName(scene) !== "Jestei Pool") return;

  scene.querySelectorAll(".category-browser").forEach(hide);
  scene
    .querySelectorAll(".jestei-theme-organism-shell__header")
    .forEach(hide);
}

function hideDetailPanel(root) {
  root.querySelectorAll("[data-detail-open]").forEach(hide);

  root.querySelectorAll("[data-detail-host]").forEach((host) => {
    if (host instanceof HTMLDialogElement && host.open) host.close();
    hide(host);
  });
}

function mediaUnitFor(asset) {
  return asset.closest("picture") ?? asset;
}

function directFigureChild(figure, node) {
  let current = node;

  while (
    current instanceof HTMLElement &&
    current.parentElement &&
    current.parentElement !== figure
  ) {
    current = current.parentElement;
  }

  return current instanceof HTMLElement && current.parentElement === figure
    ? current
    : null;
}

function inferredAspectRatio(figure, asset) {
  const computedRatio = getComputedStyle(figure).aspectRatio;

  if (computedRatio && computedRatio !== "auto") return computedRatio;

  const width = Number(asset.getAttribute("width"));
  const height = Number(asset.getAttribute("height"));

  return width > 0 && height > 0 ? `${width} / ${height}` : "";
}

function moveSliderAttributes(figure, surface) {
  [...figure.attributes]
    .filter(({ name }) => name.startsWith("data-media-slider"))
    .forEach(({ name, value }) => {
      surface.setAttribute(name, value);
      figure.removeAttribute(name);
    });
}

function ensureSliderSurface(figure, assets) {
  const existing = figure.querySelector(
    ":scope > [data-media-caption-surface][data-media-slider]",
  );

  if (existing instanceof HTMLElement) return existing;

  const surface = document.createElement("div");
  surface.className = "media-item__surface";
  surface.dataset.mediaCaptionSurface = "";

  const ratio = inferredAspectRatio(figure, assets[0]);
  if (ratio) surface.style.aspectRatio = ratio;

  moveSliderAttributes(figure, surface);
  assets[0].before(surface);
  assets.forEach((asset) => surface.append(mediaUnitFor(asset)));
  return surface;
}

function ensureMediaSurface(figure, asset) {
  const unit = mediaUnitFor(asset);
  const directChild = directFigureChild(figure, unit);

  if (!(directChild instanceof HTMLElement)) return null;

  const ratio = inferredAspectRatio(figure, asset);

  if (directChild !== unit) {
    directChild.dataset.mediaCaptionSurface = "";
    if (ratio && getComputedStyle(directChild).aspectRatio === "auto") {
      directChild.style.aspectRatio = ratio;
    }
    return directChild;
  }

  const surface = document.createElement("div");
  surface.className = "media-item__surface";
  surface.dataset.mediaCaptionSurface = "";
  if (ratio) surface.style.aspectRatio = ratio;

  directChild.replaceWith(surface);
  surface.append(directChild);
  return surface;
}

function directStaticCaption(figure) {
  return figure.querySelector(
    ":scope > :is(figcaption[data-media-caption], figcaption[data-media-captions])",
  );
}

function prepareSliderFigure(figure, assets) {
  ensureSliderSurface(figure, assets);
  figure.dataset.mediaCaptioned = "";
}

function prepareSingleMediaFigure(figure, asset) {
  const surface = ensureMediaSurface(figure, asset);
  if (!(surface instanceof HTMLElement)) return;

  figure.dataset.mediaCaptioned = "";
  const caption = directStaticCaption(figure);
  if (caption instanceof HTMLElement && caption.previousElementSibling !== surface) {
    surface.after(caption);
  }
}

function assetsInFigure(figure) {
  return [...figure.querySelectorAll(":is(img, video)[data-media-id]")];
}

function prepareMediaFigure(figure) {
  if (!(directStaticCaption(figure) instanceof HTMLElement)) return;

  const assets = assetsInFigure(figure);
  if (assets.length === 0) return;

  const slider =
    figure.hasAttribute("data-media-slider") ||
    figure.querySelector(":scope > [data-media-slider]");

  if (slider && assets.length > 1) {
    prepareSliderFigure(figure, assets);
    return;
  }

  prepareSingleMediaFigure(figure, assets[0]);
}

function prepareStaticMediaLayout(scope) {
  if (!(scope instanceof Document || scope instanceof HTMLElement)) return;

  const figures = new Set();
  if (scope instanceof HTMLElement) {
    const ownFigure = scope.closest(".cv-item figure");
    if (ownFigure instanceof HTMLElement && directStaticCaption(ownFigure)) {
      figures.add(ownFigure);
    }
  }

  scope.querySelectorAll(".cv-item figure").forEach((figure) => {
    if (directStaticCaption(figure)) figures.add(figure);
  });

  figures.forEach(prepareMediaFigure);
}

function prepareScene(scene) {
  revealSceneIdentity(scene);
  const primaryCopy = movePrimaryCopy(scene);
  prepareJesteiFilterCopy(scene);
  hideSecondaryEditorialContent(scene, primaryCopy);
  hideJesteiNavigation(scene);
}

export function applyAccordionPresentation(root = document) {
  root.querySelectorAll(".cv-item[data-cv-scene]").forEach(prepareScene);
  hideDetailPanel(root);
  prepareStaticMediaLayout(root);

  const observer =
    typeof MutationObserver === "function"
      ? new MutationObserver((records) => {
          records.forEach((record) => {
            record.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) prepareStaticMediaLayout(node);
            });
          });
        })
      : null;

  observer?.observe(root === document ? document.documentElement : root, {
    childList: true,
    subtree: true,
  });

  return () => observer?.disconnect();
}
