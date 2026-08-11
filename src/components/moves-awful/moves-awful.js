const MOVES_AWFUL_SELECTOR = ".moves-awful-showcase";
const GALLERY_SELECTOR = "[data-animated-canvas-gallery]";
const PREVIEW_SELECTOR = "[data-animated-canvas-gallery-preview]";
const CAPTION_SELECTOR = "[data-moves-awful-caption]";
const LOADER_SELECTOR = "[data-moves-awful-loader]";
const TABS_INSTANCE = Symbol.for("looksawful.movesAwful.tabs");

function createEmptyCaption() {
  const caption = document.createElement("div");
  caption.className = "media-item__caption media-caption prose moves-awful-caption";
  caption.dataset.mediaCaption = "";
  caption.dataset.movesAwfulCaption = "";

  const line = document.createElement("p");
  line.className = "media-caption__line";
  caption.append(line);

  return caption;
}

function previewLabel(preview, index) {
  const title = preview.querySelector(".animated-canvas-gallery-preview__title");
  const text = title?.textContent?.trim();
  const gallery = preview.querySelector(GALLERY_SELECTOR);

  return text || gallery?.dataset.galleryVariant || `view ${index + 1}`;
}

function ensurePanelId(preview, index) {
  if (!preview.id) {
    preview.id = `moves-awful-panel-${index + 1}`;
  }

  return preview.id;
}

function createLoader() {
  const loader = document.createElement("div");
  loader.className = "moves-awful-loader";
  loader.dataset.movesAwfulLoader = "";
  loader.hidden = true;
  loader.setAttribute("aria-live", "polite");
  loader.setAttribute("role", "status");

  const mark = document.createElement("span");
  mark.className = "moves-awful-loader__mark";
  mark.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 6; index += 1) {
    mark.append(document.createElement("span"));
  }

  const label = document.createElement("span");
  label.className = "visually-hidden";
  label.textContent = "Загрузка анимации";

  loader.append(mark, label);
  return loader;
}

function setPreviewActive(preview, active) {
  preview.hidden = !active;
  preview.toggleAttribute("data-moves-awful-active", active);
  preview.dataset.previewActive = String(active);
  preview.setAttribute("aria-hidden", String(!active));

  const gallery = preview.querySelector(GALLERY_SELECTOR);
  if (gallery instanceof HTMLElement) {
    gallery.dataset.previewActive = String(active);
    gallery.setAttribute("data-autoplay", String(active));
  }
}

function updateLoader(showcase, preview) {
  const loader = showcase.querySelector(LOADER_SELECTOR);
  const gallery = preview?.querySelector(GALLERY_SELECTOR);

  if (!(loader instanceof HTMLElement)) {
    return;
  }

  if (gallery instanceof HTMLElement && loader.parentElement !== gallery) {
    gallery.append(loader);
  }

  const loading =
    preview?.dataset.galleryPreviewState === "loading" ||
    gallery?.dataset.galleryState === "loading" ||
    gallery?.dataset.motionState === "loading";

  loader.hidden = !loading;
}

function configureMovesTabs(showcase) {
  if (showcase[TABS_INSTANCE]) {
    return;
  }

  const list = showcase.querySelector(".animated-canvas-gallery-preview-list");
  const previews = Array.from(showcase.querySelectorAll(PREVIEW_SELECTOR))
    .filter((preview) => preview instanceof HTMLElement);

  if (!(list instanceof HTMLElement) || previews.length < 2) {
    return;
  }

  const tabs = document.createElement("div");
  tabs.className = "moves-awful-tabs";
  tabs.dataset.movesAwfulTabs = "";
  tabs.setAttribute("role", "tablist");

  const loader = createLoader();
  list.before(tabs);
  list.append(loader);

  const buttons = previews.map((preview, index) => {
    const button = document.createElement("button");
    button.className = "moves-awful-tabs__button";
    button.type = "button";
    button.id = `moves-awful-tab-${index + 1}`;
    button.textContent = previewLabel(preview, index);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", ensurePanelId(preview, index));

    preview.setAttribute("role", "tabpanel");
    preview.setAttribute("aria-labelledby", button.id);

    tabs.append(button);
    return button;
  });

  let activeIndex = previews.findIndex((preview) =>
    preview.hasAttribute("data-moves-awful-active"),
  );
  if (activeIndex < 0) activeIndex = 0;

  function activate(index) {
    activeIndex = Math.max(0, Math.min(previews.length - 1, index));

    previews.forEach((preview, previewIndex) => {
      setPreviewActive(preview, previewIndex === activeIndex);
    });

    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeIndex;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    updateLoader(showcase, previews[activeIndex]);
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  const cleanups = buttons.map((button, index) => {
    const handleClick = () => activate(index);
    const handleKeydown = (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (activeIndex + direction + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      activate(nextIndex);
    };

    button.addEventListener("click", handleClick);
    button.addEventListener("keydown", handleKeydown);
    return () => {
      button.removeEventListener("click", handleClick);
      button.removeEventListener("keydown", handleKeydown);
    };
  });

  const stateObserver = new MutationObserver(() => {
    updateLoader(showcase, previews[activeIndex]);
  });

  previews.forEach((preview) => {
    stateObserver.observe(preview, {
      attributes: true,
      attributeFilter: ["data-gallery-preview-state"],
    });

    const gallery = preview.querySelector(GALLERY_SELECTOR);
    if (gallery instanceof HTMLElement) {
      stateObserver.observe(gallery, {
        attributes: true,
        attributeFilter: ["data-gallery-state"],
      });
    }
  });

  showcase[TABS_INSTANCE] = {
    destroy() {
      cleanups.forEach((cleanup) => cleanup());
      stateObserver.disconnect();
      delete showcase[TABS_INSTANCE];
    },
  };

  activate(activeIndex);
}

export function configureMovesAwful(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return;
  }

  for (const showcase of root.querySelectorAll(MOVES_AWFUL_SELECTOR)) {
    configureMovesTabs(showcase);

    for (const gallery of showcase.querySelectorAll(GALLERY_SELECTOR)) {
      gallery.setAttribute("data-animation-hover", "false");
      gallery.setAttribute("data-animation-lightbox", "false");

      const preview = gallery.closest("[data-animated-canvas-gallery-preview]");
      if (!preview || preview.querySelector(CAPTION_SELECTOR)) {
        continue;
      }

      gallery.before(createEmptyCaption());
    }
  }
}
