/**
 * heading idle motion
 * hero-like letter motion for regular headings only.
 * no fly-in, no bottom reveal, no full heading rotation.
 */

import { createLetterIdleMotion, splitTextIntoGraphemes } from "./letter-motion.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const HEADING_SELECTOR = [
  "main :is(h2, h3, h4, h5, h6)",
  "main .title",
  ".project__head .title",
  ".section-head > .title",
  ".block__header > .title",
  ".text-block > .title",
  ".component-caption > .title",
  ".component-caption > :is(h2, h3, h4, h5, h6)"
].join(", ");

const EXCLUDED_SELECTOR = [
  ".hero",
  ".site-header",
  ".showcase-toc",
  ".contact-links",
  ".chips",
  ".list-cards",
  ".list-card",
  ".list-card__title",
  ".project-responsibilities",
  ".responsibility-card",
  ".responsibility-card__title",
  ".responsibility-card__item-title",
  ".responsibility-card__list",
  ".token-list",
  ".cv-role-chips",
  ".cv-task-list",
  ".cv-task-list-group",
  ".media",
  ".media-item",
  ".media-slider",
  ".media-marquee",
  ".playlist-filter-embed",
  ".lightbox",
  "[data-visual-demo]",
  "[data-animation]",
  "canvas",
  "video",
  "svg",
  "ul",
  "ol",
  "li"
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

function isListHeading(el) {
  return Boolean(
    el.closest(".list-cards") ||
    el.closest(".list-card") ||
    el.closest(".project-responsibilities") ||
    el.closest(".responsibility-card") ||
    el.closest(".token-list") ||
    el.closest(".cv-role-chips") ||
    el.closest(".cv-task-list") ||
    el.closest(".cv-task-list-group") ||
    el.closest("ul") ||
    el.closest("ol") ||
    el.closest("li")
  );
}

function isSafeHeading(el) {
  return (
    el &&
    !el.hasAttribute(BOUND_ATTR) &&
    !el.closest("[hidden]") &&
    !el.closest('[data-reveal-bound="skip"]') &&
    !el.closest(EXCLUDED_SELECTOR) &&
    !isListHeading(el) &&
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
  if (!element || !element.tagName) {
    return false;
  }

  return !["SCRIPT", "STYLE", "SVG", "IMG", "VIDEO", "CANVAS", "PICTURE", "SOURCE", "BR", "INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(element.tagName);
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
    if (/\s/.test(char)) {
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

  if (!label) {
    return [];
  }

  target.setAttribute("aria-label", label);
  target.setAttribute(READY_ATTR, "true");

  splitElementTree(target);

  return [...target.querySelectorAll("[" + CHAR_ATTR + "]")];
}

function observeOnce(el, callback) {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (!entry || !entry.isIntersecting) {
        return;
      }

      observer.unobserve(el);
      callback(el);
    },
    {
      threshold: 0,
      rootMargin: "20% 0px 20% 0px"
    }
  );

  observer.observe(el);
}

function getProfile(target) {
  if (target.classList.contains("title--display") || target.classList.contains("title--xl") || target.matches("h2")) {
    return "display";
  }

  if (target.matches("h4, h5, h6")) {
    return "subheading";
  }

  return "heading";
}

function startHeading(target) {
  const letters = prepareLetters(target);

  if (!letters.length) {
    return;
  }

  createLetterIdleMotion(target, {
    letters,
    profile: getProfile(target)
  });
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) {
    return;
  }

  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(isSafeHeading);

  headings.forEach((heading) => {
    prepareLetters(heading);
    heading.setAttribute(BOUND_ATTR, "heading");

    observeOnce(heading, (target) => {
      startHeading(target);
    });
  });
}