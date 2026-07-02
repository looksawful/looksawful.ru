const COLORS = ["#f18200", "#157aff", "#d1e231", "#b2a1ea"];
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const splitGraphemes = (text) => {
  if (globalThis.Intl?.Segmenter) {
    return Array.from(new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
};

const wrapAccentLetters = (headline) => {
  const accent = headline.querySelector("[data-section-title-accent]") || headline;
  const existingLetters = accent.querySelectorAll("[data-reveal-char], [data-heading-char]");

  if (existingLetters.length) {
    return existingLetters;
  }

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
    span.style.display = "inline-block";
    fragment.append(span);
  });

  accent.replaceChildren(fragment);
  accent.dataset.colorHeadlineReady = "true";
  return accent.querySelectorAll("[data-color-headline-letter]");
};

const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches;

const paintStaticLetters = (letters) => {
  letters.forEach((letter, index) => {
    letter.style.color = COLORS[index % COLORS.length];
    letter.style.willChange = "auto";
  });
};

export const mountShowcaseSignatures = async (root = document) => {
  const headlines = root.querySelectorAll('[data-color-headline="jestei"]');

  headlines.forEach((headline) => {
    if (headline.dataset.colorHeadlineAnimated === "true") return;

    const letters = wrapAccentLetters(headline);
    if (!letters.length) return;

    headline.dataset.colorHeadlineAnimated = "true";
    paintStaticLetters([...letters]);

    const gsap = window.gsap;
    if (!gsap || prefersReducedMotion()) {
      return;
    }

    gsap
      .timeline({ repeat: -1, repeatDelay: 1.1 })
      .to(letters, {
        color: (index) => COLORS[(index + 1) % COLORS.length],
        duration: 0.42,
        ease: "power2.out",
        stagger: { each: 0.035, from: "random" },
      })
      .to(
        letters,
        {
          color: (index) => COLORS[(index + 3) % COLORS.length],
          duration: 0.5,
          ease: "power2.out",
          stagger: { each: 0.03, from: "center" },
        },
        "+=0.15",
      )
      .to(
        letters,
        {
          color: (index) => COLORS[index % COLORS.length],
          duration: 0.55,
          ease: "power2.inOut",
          stagger: { each: 0.025, from: "start" },
        },
        "+=0.25",
      );
  });
};

export const initShowcaseSignatures = mountShowcaseSignatures;
