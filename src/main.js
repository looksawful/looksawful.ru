const PET_PROJECT_PREVIEW_WIDTHS = [
  ["berserk-timer", 480],
  ["awful-cases", 420],
  ["awful-audit", 420],
];

function getPetProjectPreviewWidth(source) {
  const match = PET_PROJECT_PREVIEW_WIDTHS.find(([slug]) => source.includes(slug));
  return match?.[1] ?? 420;
}

function initializePetProjectModal(dialog) {
  const title = dialog.querySelector("#pet-project-modal-title");
  const closeButton = dialog.querySelector(".pet-project-modal__close");
  const frame = dialog.querySelector(".pet-project-modal__frame");

  if (!title || !closeButton || !frame) {
    return dialog;
  }

  const closeModal = () => {
    if (dialog.open && typeof dialog.close === "function") {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
    document.documentElement.classList.remove("pet-project-modal-open");
    frame.src = "about:blank";
    dialog.petProjectReturnFocus?.focus?.({ preventScroll: true });
  };

  if (dialog.dataset.petProjectModalReady !== "true") {
    dialog.dataset.petProjectModalReady = "true";

    closeButton.addEventListener("click", closeModal);

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeModal();
      }
    });

    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("pet-project-modal-open");
      frame.src = "about:blank";

      const returnFocus = dialog.petProjectReturnFocus;
      dialog.petProjectReturnFocus = null;
      if (returnFocus?.isConnected) {
        requestAnimationFrame(() => returnFocus.focus({ preventScroll: true }));
      }
    });
  }

  dialog.petProjectTitle = title;
  dialog.petProjectFrame = frame;
  dialog.petProjectClose = closeButton;

  return dialog;
}

function createPetProjectModal(root = document) {
  const dialog = document.createElement("dialog");
  dialog.id = "pet-project-modal";
  dialog.className = "pet-project-modal";
  dialog.setAttribute("aria-labelledby", "pet-project-modal-title");

  const shell = root.createElement("div");
  shell.className = "pet-project-modal__shell";

  const bar = root.createElement("div");
  bar.className = "pet-project-modal__bar";

  const title = root.createElement("p");
  title.id = "pet-project-modal-title";
  title.className = "pet-project-modal__title";

  const closeButton = root.createElement("button");
  closeButton.className = "pet-project-modal__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "закрыть");
  closeButton.textContent = "×";

  const body = root.createElement("div");
  body.className = "pet-project-modal__body";

  const frame = root.createElement("iframe");
  frame.className = "pet-project-modal__frame";
  frame.setAttribute("allow", "fullscreen; autoplay");
  frame.title = "";

  bar.append(title, closeButton);
  body.append(frame);
  shell.append(bar, body);
  dialog.append(shell);
  root.body?.append(dialog);
  return dialog;
}

function ensurePetProjectModal(root = document) {
  return initializePetProjectModal(
    root.querySelector("#pet-project-modal") || createPetProjectModal(root),
  );
}

function openPetProjectModal(source, title, opener, root = document) {
  const dialog = ensurePetProjectModal(root);
  dialog.petProjectReturnFocus = opener;
  dialog.petProjectTitle.textContent = title;
  dialog.petProjectFrame.title = `${title} — полноэкранная страница проекта`;
  dialog.petProjectFrame.src = source;
  dialog.petProjectFrame.dispatchEvent(
    new CustomEvent("portfolio:pet-preview-added", { bubbles: true }),
  );
  document.documentElement.classList.add("pet-project-modal-open");

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) {
      dialog.showModal();
    }
  } else {
    dialog.setAttribute("open", "");
  }

  requestAnimationFrame(() => dialog.petProjectClose.focus({ preventScroll: true }));
}

function sizePetProjectPreview(media, frame, viewportWidth) {
  const sync = () => {
    const mediaWidth = media.clientWidth;
    const mediaHeight = media.clientHeight;
    if (!mediaWidth || !mediaHeight) {
      return;
    }

    if (media.closest?.("#pet-projects")) {
      frame.style.inlineSize = "100%";
      frame.style.blockSize = "100%";
      frame.style.transform = "none";
      return;
    }

    const scale = mediaWidth / viewportWidth;
    frame.style.inlineSize = `${viewportWidth}px`;
    frame.style.blockSize = `${Math.ceil(mediaHeight / scale)}px`;
    frame.style.transform = `scale(${scale})`;
  };

  frame.addEventListener("load", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(media);
    media.petProjectResizeObserver = resizeObserver;
  }

  sync();
}

function mountLivePetProjectPreviews(root = document) {
  root.querySelectorAll("#pet-projects .pet-projects-bento__card").forEach((card) => {
    const media = card.querySelector(".pet-projects-bento__media");
    if (!media || media.querySelector("iframe")) {
      return;
    }

    const projectLink = card.querySelector(".pet-projects-bento__body a[href]");
    const source = projectLink?.getAttribute("href");
    if (!source) {
      return;
    }

    const title = projectLink.textContent.trim() || "пет-проект";
    const preview = document.createElement("div");
    preview.className = media.className;

    const frame = document.createElement("iframe");
    frame.className = "pet-projects-bento__frame";
    frame.loading = "lazy";
    frame.src = source;
    frame.title = `${title} — страница проекта`;
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("scrolling", "no");

    const openButton = document.createElement("button");
    openButton.className = "pet-projects-bento__open";
    openButton.type = "button";
    openButton.setAttribute("aria-label", `открыть ${title}`);
    openButton.addEventListener("click", () => {
      openPetProjectModal(source, title, openButton, root);
    });

    preview.append(frame, openButton);
    media.replaceWith(preview);
    sizePetProjectPreview(preview, frame, getPetProjectPreviewWidth(source));
    frame.dispatchEvent(new CustomEvent("portfolio:pet-preview-added", { bubbles: true }));
  });
}

async function loadPetProjectPreviewCleanup(root = document) {
  if (!root.querySelector("#pet-projects")) {
    return;
  }

  await import("./pet-project-preview-cleanup.js");
}

async function start() {
  mountLivePetProjectPreviews(document);
  await loadPetProjectPreviewCleanup(document);

  const { initRuntime } = await import("./runtime/init-runtime.js");
  await initRuntime(document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void start();
  }, { once: true });
} else {
  void start();
}
