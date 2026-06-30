const COLORS = [
  "#f18200",
  "#ffb45a",
  "#157aff",
  "#62a6ff",
  "#d1e231",
  "#e3ef68",
  "#b2a1ea",
  "#c8bcf4",
];

const reduceMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

const splitGraphemes = (text) => {
  if (globalThis.Intl?.Segmenter) {
    return Array.from(new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
};

const getGsap = async () => {
  if (globalThis.gsap) return globalThis.gsap;
  try {
    await import("../vendor/gsap-globals.js");
  } catch {
    return null;
  }
  return globalThis.gsap || null;
};

const wrapLetters = (root) => {
  if (root.dataset.colorHeadlineReady === "true") {
    return root.querySelectorAll("[data-color-headline-letter]");
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.nodeValue.trim()) continue;
    nodes.push(node);
  }

  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();

    splitGraphemes(node.nodeValue).forEach((char) => {
      if (!char.trim()) {
        fragment.append(document.createTextNode(char));
        return;
      }

      const span = document.createElement("span");
      span.dataset.colorHeadlineLetter = "";
      span.textContent = char;
      fragment.append(span);
    });

    node.replaceWith(fragment);
  });

  root.dataset.colorHeadlineReady = "true";
  return root.querySelectorAll("[data-color-headline-letter]");
};

export const mountShowcaseSignatures = async (root = document) => {
  const headlines = root.querySelectorAll('[data-color-headline="jestei"]');

  headlines.forEach(async (headline) => {
    if (headline.dataset.colorHeadlineAnimated === "true") return;

    const letters = wrapLetters(headline);

    if (!letters.length) return;

    headline.dataset.colorHeadlineAnimated = "true";

    if (reduceMotion()) {
      letters.forEach((letter, index) => {
        letter.style.color = COLORS[index % COLORS.length];
        letter.style.willChange = "auto";
      });
      return;
    }

    const gsap = await getGsap();

    if (!gsap) {
      letters.forEach((letter, index) => {
        letter.style.color = COLORS[index % COLORS.length];
      });
      return;
    }

    gsap.set(letters, {
      color: (index) => COLORS[index % COLORS.length],
    });

    gsap.timeline({
      repeat: -1,
      repeatDelay: 1.6,
      defaults: { duration: 0.65, ease: "power2.inOut" },
    })
      .to(letters, {
        color: (index) => COLORS[(index + 3) % COLORS.length],
        stagger: { each: 0.035, from: "random" },
      })
      .to(letters, {
        color: (index) => COLORS[(index + 6) % COLORS.length],
        stagger: { each: 0.025, from: "center" },
      }, "-=0.25");
  });
};
