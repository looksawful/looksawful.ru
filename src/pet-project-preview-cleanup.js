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
scanFrames();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) {
        continue;
      }

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
