const SECTION_SELECTOR = "#jestei-landings";

// TODO: вернуть секцию после переработки материалов.
// Нужно подобрать более сильные тексты и изображения интерфейсов лендингов.
function hideSection(section) {
  if (!section) return;

  section.hidden = true;
  section.setAttribute("aria-hidden", "true");
  section.setAttribute("data-homepage-hidden", "");
  section.style.setProperty("display", "none", "important");
  section.style.setProperty("visibility", "hidden", "important");
  section.style.setProperty("opacity", "0", "important");
}

export function mountHiddenJesteiLandings(root = document) {
  const section = root.querySelector(SECTION_SELECTOR);
  if (!section) return;

  hideSection(section);

  const observer = new MutationObserver(() => {
    const isHidden =
      section.hidden &&
      section.style.getPropertyValue("display") === "none" &&
      section.style.getPropertyPriority("display") === "important";

    if (!isHidden) hideSection(section);
  });

  observer.observe(section, {
    attributes: true,
    attributeFilter: ["hidden", "style", "aria-hidden", "data-homepage-hidden"],
  });

  return () => observer.disconnect();
}
