const LEGACY_PROJECT_SECTION_SELECTOR = ".project__section";
const EXPLICIT_CAPTION_SCOPE_SELECTOR = "[data-media-caption-scope]";
const CAPTION_SCOPE_SELECTOR = `${EXPLICIT_CAPTION_SCOPE_SELECTOR}, ${LEGACY_PROJECT_SECTION_SELECTOR}`;
const CAPTION_LINE_SELECTOR = ".media__caption-line";
const INDEX_SELECTOR = ":scope > .media__index";

function formatMediaIndex(index: number): string {
  return String(index).padStart(2, "0");
}

export function numberMediaCaptions(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(CAPTION_SCOPE_SELECTOR).forEach((scope) => {
    const lines = [...scope.querySelectorAll<HTMLElement>(CAPTION_LINE_SELECTOR)].filter(
      (line) => line.closest(CAPTION_SCOPE_SELECTOR) === scope,
    );

    lines.forEach((line, index) => {
      const displayIndex = index + 1;
      const existing = line.querySelector<HTMLElement>(INDEX_SELECTOR);
      const marker = existing ?? scope.ownerDocument.createElement("span");

      marker.className = "media__index";
      marker.textContent = formatMediaIndex(displayIndex);
      line.dataset.mediaIndex = String(displayIndex);

      if (!existing) {
        line.prepend(marker);
      }
    });
  });
}
