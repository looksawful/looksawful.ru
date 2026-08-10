const MOVES_AWFUL_SELECTOR = ".moves-awful-showcase";
const GALLERY_SELECTOR = "[data-animated-canvas-gallery]";
const CAPTION_SELECTOR = "[data-moves-awful-caption]";

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

export function configureMovesAwful(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return;
  }

  for (const showcase of root.querySelectorAll(MOVES_AWFUL_SELECTOR)) {
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
