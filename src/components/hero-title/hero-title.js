import { createLetterIdleMotion, splitTextIntoGraphemes } from "../letter-motion.js";

const TITLE_SELECTOR = "#hero-title";
const LINE_SELECTOR = ".hero__title-name, .hero__title-role";
const ROLE_LINE_SELECTOR = '.hero__title-role[data-hero-role-line="true"]';
const FIT_SAFE_GAP = 2;
const FIT_MIN_FONT_SIZE = 20;
const ROLE_FIT_MIN_FONT_SIZE = 14;

function createLetterElement(letter, index) {
  const letterElement = document.createElement("span");
  const isSpace = /\s/.test(letter);

  letterElement.className = isSpace ? "hero-title-letter is-space" : "hero-title-letter";
  letterElement.dataset.heroLetter = String(index);
  letterElement.textContent = isSpace ? "\u00a0" : letter;

  return letterElement;
}

function createWordElement(text, startIndex, isSingleLine = false) {
  const wordElement = document.createElement("span");
  let letterIndex = startIndex;

  wordElement.className = isSingleLine ? "hero-title-word hero-title-word--line" : "hero-title-word";

  splitTextIntoGraphemes(text).forEach((letter) => {
    wordElement.appendChild(createLetterElement(letter, letterIndex));
    letterIndex += 1;
  });

  return {
    element: wordElement,
    nextIndex: letterIndex,
  };
}

function wrapLineLetters(line, startIndex = 0) {
  const isRoleLine = line.matches(ROLE_LINE_SELECTOR);
  const label = line.textContent.trim().replace(/\s+/g, " ");
  const fragment = document.createDocumentFragment();
  const parts = isRoleLine ? [label] : label.split(/\s+/);
  let letterIndex = startIndex;

  line.dataset.heroTitleText = label;
  line.setAttribute("aria-label", label);

  parts.forEach((part) => {
    const word = createWordElement(part, letterIndex, isRoleLine);

    fragment.appendChild(word.element);
    letterIndex = word.nextIndex;
  });

  line.textContent = "";
  line.appendChild(fragment);

  return letterIndex;
}

function getAvailableWidth(title, line) {
  if (line?.matches?.(ROLE_LINE_SELECTOR)) {
    const roleRect = line.getBoundingClientRect();
    const roleWidth = roleRect.width || line.clientWidth || 0;

    if (roleWidth > 0) {
      return Math.max(0, Math.floor(roleWidth - FIT_SAFE_GAP));
    }
  }

  const wrap = title.closest(".hero__headline-wrap") || title;
  const rect = wrap.getBoundingClientRect();
  const width = rect.width || wrap.clientWidth || window.innerWidth;

  return Math.max(0, Math.floor(width - FIT_SAFE_GAP));
}

function getLineMeasure(line) {
  const words = [...line.querySelectorAll(".hero-title-word")];

  if (!words.length) {
    return 0;
  }

  return words.reduce((max, word) => Math.max(max, Math.ceil(word.scrollWidth)), 0);
}

function fitLine(title, line) {
  line.style.fontSize = "";
  line.classList.remove("is-hero-title-fitted");

  const availableWidth = getAvailableWidth(title, line);

  if (!availableWidth) {
    return;
  }

  const style = window.getComputedStyle(line);
  const baseFontSize = Number.parseFloat(style.fontSize);

  if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) {
    return;
  }

  const contentWidth = getLineMeasure(line);

  if (!contentWidth || contentWidth <= availableWidth) {
    return;
  }

  const minFontSize = line.matches(ROLE_LINE_SELECTOR) ? ROLE_FIT_MIN_FONT_SIZE : FIT_MIN_FONT_SIZE;
  const scale = availableWidth / contentWidth;
  const nextFontSize = Math.max(minFontSize, Math.floor(baseFontSize * scale * 1000) / 1000);

  line.style.fontSize = String(nextFontSize) + "px";
  line.classList.add("is-hero-title-fitted");
}

function fitHeroTitle(title, lines) {
  lines.forEach((line) => fitLine(title, line));
}

function bindHeroTitleFit(title, lines) {
  let frame = 0;

  const scheduleFit = () => {
    cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => fitHeroTitle(title, lines));
  };

  scheduleFit();

  window.addEventListener("resize", scheduleFit, { passive: true });
  window.addEventListener("orientationchange", scheduleFit, { passive: true });

  document.fonts?.ready?.then(scheduleFit).catch(() => {});

  const wrap = title.closest(".hero__headline-wrap") || title;
  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          scheduleFit();
        });

  observer?.observe(wrap);
  lines.forEach((line) => observer?.observe(line));

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", scheduleFit);
    window.removeEventListener("orientationchange", scheduleFit);
    observer?.disconnect();
  };
}

export function initHeroTitleAnimation(root = document) {
  const title = root.querySelector(TITLE_SELECTOR);

  if (!title || title.dataset.heroTitleReady === "true") {
    return title;
  }

  const lines = [...title.querySelectorAll(LINE_SELECTOR)];

  if (!lines.length) {
    return title;
  }

  let letterIndex = 0;

  lines.forEach((line) => {
    letterIndex = wrapLineLetters(line, letterIndex);
  });

  bindHeroTitleFit(title, lines);
  title.classList.add("is-hero-title-ready");
  title.dataset.heroTitleReady = "true";

  createLetterIdleMotion(title, {
    selector: ".hero-title-letter",
    profile: "hero",
  });

  return title;
}
