const mountedChapters = new WeakSet();

function syncChapter(chapter) {
  const isOpen = chapter.classList.contains("is-open");
  const toggle = chapter.querySelector("[data-case-chapter-toggle]");

  chapter.classList.toggle("is-compact", !isOpen);

  if (!toggle) {
    return;
  }

  const openLabel = toggle.getAttribute("data-open-label") || "раскрыть детали";
  const closeLabel = toggle.getAttribute("data-close-label") || "свернуть детали";

  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? closeLabel : openLabel;
}

function preserveScroll(target, callback) {
  const before = target.getBoundingClientRect().top;
  callback();
  const after = target.getBoundingClientRect().top;
  window.scrollBy(0, after - before);
}

export function initCaseChapters(root = document) {
  root.querySelectorAll("[data-case-chapter]").forEach((chapter) => {
    if (!(chapter instanceof HTMLElement) || mountedChapters.has(chapter)) {
      return;
    }

    mountedChapters.add(chapter);
    syncChapter(chapter);

    const toggle = chapter.querySelector("[data-case-chapter-toggle]");

    if (!(toggle instanceof HTMLButtonElement)) {
      return;
    }

    toggle.addEventListener("click", () => {
      preserveScroll(chapter, () => {
        const nextOpen = !chapter.classList.contains("is-open");
        chapter.classList.toggle("is-open", nextOpen);
        chapter.classList.toggle("is-compact", !nextOpen);
        syncChapter(chapter);
      });
    });
  });
}
