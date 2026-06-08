const TITLE_SELECTOR = "#hero-title";
const LINE_SELECTOR = ".hero__title-name, .hero__title-role";
const FIT_SAFE_GAP = 2;
const FIT_MIN_FONT_SIZE = 20;

function wrapLineLetters(line) {
  const words = line.textContent.trim().split(/\s+/);
  const fragment = document.createDocumentFragment();
  let letterIndex = 0;

  words.forEach((word) => {
    const wordElement = document.createElement("span");
    wordElement.className = "hero-title-word";

    [...word].forEach((letter) => {
      const letterElement = document.createElement("span");
      letterElement.className = "hero-title-letter";
      letterElement.dataset.heroLetter = String(letterIndex);
      letterElement.textContent = letter;
      wordElement.appendChild(letterElement);
      letterIndex += 1;
    });

    fragment.appendChild(wordElement);
  });

  line.textContent = "";
  line.appendChild(fragment);
}

function getAvailableWidth(title) {
  const wrap = title.closest(".hero__headline-wrap") || title;
  const rect = wrap.getBoundingClientRect();
  const width = rect.width || wrap.clientWidth || window.innerWidth;

  return Math.max(0, Math.floor(width - FIT_SAFE_GAP));
}

function fitLine(line, availableWidth) {
  line.style.fontSize = "";
  line.classList.remove("is-hero-title-fitted");

  const style = window.getComputedStyle(line);
  const baseFontSize = Number.parseFloat(style.fontSize);

  if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) {
    return;
  }

  const widestWord = [...line.querySelectorAll(".hero-title-word")].reduce(
    (max, word) => Math.max(max, Math.ceil(word.scrollWidth)),
    0,
  );

  if (!widestWord || widestWord <= availableWidth) {
    return;
  }

  const scale = availableWidth / widestWord;
  const nextFontSize = Math.max(FIT_MIN_FONT_SIZE, Math.floor(baseFontSize * scale * 1000) / 1000);

  line.style.fontSize = `${nextFontSize}px`;
  line.classList.add("is-hero-title-fitted");
}

function fitHeroTitle(title, lines) {
  const availableWidth = getAvailableWidth(title);

  if (!availableWidth) {
    return;
  }

  lines.forEach((line) => fitLine(line, availableWidth));
}

function bindHeroTitleFit(title, lines) {
  let frame = 0;
  const wrap = title.closest(".hero__headline-wrap") || title;

  const scheduleFit = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;
      fitHeroTitle(title, lines);
    });
  };

  scheduleFit();

  document.fonts?.ready?.then(scheduleFit).catch(() => {});

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(wrap);
  }

  window.addEventListener("resize", scheduleFit, { passive: true });
  window.addEventListener("orientationchange", scheduleFit, { passive: true });
}

export function initHeroTitleAnimation(root = document) {
  const title = root.querySelector(TITLE_SELECTOR);

  if (!title || title.dataset.heroTitleMounted === "true") {
    return null;
  }

  const lines = [...title.querySelectorAll(LINE_SELECTOR)];

  if (!lines.length) {
    return null;
  }

  title.dataset.heroTitleMounted = "true";
  title.setAttribute("aria-label", lines.map((line) => line.textContent.trim()).join(" "));

  lines.forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    wrapLineLetters(line);
  });

  bindHeroTitleFit(title, lines);
  title.classList.add("is-hero-title-ready");

  return title;
}
