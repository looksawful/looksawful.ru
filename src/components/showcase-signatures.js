const COLORS = ["#f18200", "#157aff", "#d1e231", "#b2a1ea"];

const splitGraphemes = (text) => {
  if (globalThis.Intl?.Segmenter) {
    return Array.from(new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
};

const wrapAccentLetters = (headline) => {
  const accent = headline.querySelector(".case-chapter-heading__accent") || headline;

  if (accent.dataset.colorHeadlineReady === "true") {
    return accent.querySelectorAll("[data-color-headline-letter]");
  }

  const label = accent.textContent || "";
  const fragment = document.createDocumentFragment();

  splitGraphemes(label).forEach((char) => {
    if (!char.trim()) {
      fragment.append(document.createTextNode(char));
      return;
    }

    const span = document.createElement("span");
    span.dataset.colorHeadlineLetter = "";
    span.textContent = char;
    fragment.append(span);
  });

  accent.replaceChildren(fragment);
  accent.dataset.colorHeadlineReady = "true";
  return accent.querySelectorAll("[data-color-headline-letter]");
};

export const mountShowcaseSignatures = async (root = document) => {
  const headlines = root.querySelectorAll('[data-color-headline="jestei"]');

  headlines.forEach((headline) => {
    if (headline.dataset.colorHeadlineAnimated === "true") return;

    const letters = wrapAccentLetters(headline);
    if (!letters.length) return;

    headline.dataset.colorHeadlineAnimated = "true";
    letters.forEach((letter, index) => {
      letter.style.color = COLORS[index % COLORS.length];
      letter.style.willChange = "auto";
    });
  });
};
