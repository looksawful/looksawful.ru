const PROJECT_SECTION_SELECTOR = ".project__section";
const CAPTION_LINE_SELECTOR = ".media__caption-line";
const INDEX_SELECTOR = ":scope > .media__index";

function formatMediaIndex(index: number): string {
  return String(index).padStart(2, "0");
}

export function numberMediaCaptions(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(PROJECT_SECTION_SELECTOR).forEach((section) => {
    const lines = [...section.querySelectorAll<HTMLElement>(CAPTION_LINE_SELECTOR)].filter(
      (line) => line.closest(PROJECT_SECTION_SELECTOR) === section,
    );

    lines.forEach((line, index) => {
      const displayIndex = index + 1;
      const existing = line.querySelector<HTMLElement>(INDEX_SELECTOR);
      const marker = existing ?? section.ownerDocument.createElement("span");

      marker.className = "media__index";
      marker.textContent = formatMediaIndex(displayIndex);
      line.dataset.mediaIndex = String(displayIndex);

      if (!existing) {
        line.prepend(marker);
      }
    });
  });
}
