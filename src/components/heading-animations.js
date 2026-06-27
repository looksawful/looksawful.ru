import { createLetterIdleMotion, splitTextIntoGraphemes } from "./letter-motion.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const HEADING_SELECTOR = "#showcase :is(.jestei-chapter-section, .case-section-clean, [data-jestei-chapter-title], [data-case-chapter-title]) > .jestei-chapter-hero > .jestei-chapter-hero__title";

const EXCLUDED_SELECTOR = [
  ".site-header",
  ".portfolio-toc",
  ".contact-links",
  ".chips",
  ".project__header",
  ".project__head",
  ".project__logo",
  ".jestei-responsibilities-header",
  ".project-responsibilities",
  ".responsibility-card",
  ".text-sections",
  ".text-section",
  ".token-list",
  ".media-group",
  ".media",
  ".media-item",
  ".playlist-filter-embed",
  ".jestei-policy-marquee",
  ".policy-book",
  ".artifact-reader",
  ".lightbox",
  "[data-visual-demo]",
  "[data-animation]",
  "canvas",
  "video",
  "svg",
  "ul",
  "ol",
  "li",
].join(", ");

const BOUND_ATTR = "data-reveal-bound";
const READY_ATTR = "data-letter-ready";
const CHAR_ATTR = "data-reveal-char";

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    typeof window.gsap !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function isSafeHeading(el) {
  return (
    el &&
    el.matches(HEADING_SELECTOR) &&
    !el.hasAttribute(BOUND_ATTR) &&
    !el.closest("[hidden]") &&
    !el.closest('[data-reveal-bound="skip"]') &&
    !el.closest(EXCLUDED_SELECTOR) &&
    Boolean(el.textContent && el.textContent.trim())
  );
}

function isTextNode(node) {
  return node && node.nodeType === Node.TEXT_NODE;
}

function isElementNode(node) {
  return node && node.nodeType === Node.ELEMENT_NODE;
}

function canSplitInside(element) {
  if (!element || !element.tagName) return false;

  return ![
    "SCRIPT",
    "STYLE",
    "SVG",
    "IMG",
    "VIDEO",
    "CANVAS",
    "PICTURE",
    "SOURCE",
    "BR",
    "INPUT",
    "TEXTAREA",
    "SELECT",
    "BUTTON",
  ].includes(element.tagName);
}

function createChar(char) {
  const span = document.createElement("span");

  span.textContent = char;
  span.setAttribute("aria-hidden", "true");
  span.setAttribute(CHAR_ATTR, "true");
  span.style.display = "inline-block";
  span.style.transformOrigin = "50% 60%";
  span.style.willChange = "transform";
  span.style.backfaceVisibility = "visible";

  return span;
}

function splitTextNode(node) {
  const fragment = document.createDocumentFragment();
  const parts = splitTextIntoGraphemes(node.nodeValue || "");

  parts.forEach((char) => {
    if (/s/.test(char)) {
      fragment.appendChild(document.createTextNode(char));
      return;
    }

    fragment.appendChild(createChar(char));
  });

  node.replaceWith(fragment);
}

function splitElementTree(element) {
  [...element.childNodes].forEach((node) => {
    if (isTextNode(node)) {
      splitTextNode(node);
      return;
    }

    if (isElementNode(node) && canSplitInside(node) && !node.hasAttribute(CHAR_ATTR)) {
      splitElementTree(node);
    }
  });
}

function prepareLetters(target) {
  if (target.hasAttribute(READY_ATTR)) {
    return [...target.querySelectorAll("[" + CHAR_ATTR + "]")];
  }

  const label = target.textContent ? target.textContent.trim() : "";

  if (!label) return [];

  target.setAttribute("aria-label", label);
  target.setAttribute(READY_ATTR, "true");
  splitElementTree(target);

  return [...target.querySelectorAll("[" + CHAR_ATTR + "]")];
}

function observeOnce(el, callback) {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;

      observer.unobserve(el);
      callback(el);
    },
    {
      threshold: 0,
      rootMargin: "20% 0px 20% 0px",
    },
  );

  observer.observe(el);
}

function startHeading(target) {
  const letters = prepareLetters(target);
  if (!letters.length) return;

  createLetterIdleMotion(target, {
    letters,
    profile: "display",
  });
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) return;

  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(isSafeHeading);

  headings.forEach((heading) => {
    prepareLetters(heading);
    heading.setAttribute(BOUND_ATTR, "heading");

    observeOnce(heading, (target) => {
      startHeading(target);
    });
  });
}
