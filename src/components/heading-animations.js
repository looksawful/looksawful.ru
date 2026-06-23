/**
 * Soft GSAP reveal engine for section headings + image galleries.
 * Uses IntersectionObserver only. No ScrollTrigger dependency.
 *
 * SAFETY RULES:
 *  - Never call gsap.set() to hide anything upfront.
 *  - Never animate canvas, video, section, or raw img directly.
 *  - Gallery animation only targets a.media-item wrappers.
 *  - No blur.
 *  - No fade / opacity animation.
 *  - No clip-path / masks.
 *  - No bottom-up text reveal.
 *  - No overshoot scale above 1.
 *  - Elements must stay visible if JS, GSAP, or observer fails.
 *
 * Optional heading controls:
 *  - data-reveal-style="text-left"
 *  - data-reveal-style="text-turn"
 *  - data-reveal-style="text-scale"
 *  - data-reveal-style="letters"
 *  - data-letter-repel="true"
 *
 * Optional gallery controls:
 *  - data-reveal-style="gallery-scale"
 *  - data-reveal-style="gallery-flow"
 *  - data-reveal-style="gallery-turn"
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";

const HEADING_SELECTOR = ".component-caption > .title, .block__header > .title";

const GALLERY_SELECTOR = [
  ".media-quad:not([data-showcase-auto-slider])",
  ".media-six:not([data-showcase-auto-slider])",
  ".media-eight:not([data-showcase-auto-slider])",
  ".media-three:not(.playlist-filter-embed__gallery):not([data-showcase-auto-slider])",
].join(", ");

const SAFE_ITEM_SELECTOR = "a.media-item";

const BOUND_ATTR = "data-reveal-bound";
const STYLE_ATTR = "data-reveal-style";
const LETTER_REPEL_ATTR = "data-letter-repel";
const LETTER_READY_ATTR = "data-letter-ready";
const LETTER_REPEL_BOUND_ATTR = "data-letter-repel-bound";

const HEADING_STYLES = ["text-left", "text-turn", "text-scale"];
const GALLERY_STYLES = ["gallery-scale", "gallery-flow", "gallery-turn"];

const MOTION = {
  headingX: -16,
  headingSmallX: -8,
  headingScale: 0.992,
  headingLetterScale: 0.965,
  headingDuration: 0.82,
  headingLetterDuration: 0.68,

  galleryX: 6,
  galleryScale: 0.996,
  galleryDuration: 0.78,

  staggerMin: 0.06,
  staggerMax: 0.14,
  letterStagger: 0.012,

  ease: "power2.out",
  softEase: "sine.out",
};

const REPEL = {
  radius: 86,
  x: 14,
  y: 7,
  rotate: 5,
  duration: 0.24,
  resetDuration: 0.42,
};

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    typeof window.gsap !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function isSafeTarget(el) {
  return (
    el &&
    !el.closest("[hidden]") &&
    !el.closest(".hero") &&
    !el.closest('[data-reveal-bound="skip"]') &&
    !el.hasAttribute(BOUND_ATTR)
  );
}

function observeOnce(el, callback, options = {}) {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];

      if (!entry || !entry.isIntersecting) return;

      observer.unobserve(el);
      callback(el);
    },
    {
      threshold: 0,
      rootMargin: "0px 0px -12% 0px",
      ...options,
    },
  );

  observer.observe(el);

  return () => observer.disconnect();
}

function getPreset(el, presets, index) {
  const customPreset = el.getAttribute(STYLE_ATTR);

  if (customPreset && presets.includes(customPreset)) {
    return customPreset;
  }

  if (customPreset === "letters") {
    return customPreset;
  }

  return presets[index % presets.length];
}

function getGalleryItems(gallery) {
  return [...gallery.querySelectorAll(SAFE_ITEM_SELECTOR)].filter((item) => {
    return !item.closest("canvas") && !item.closest("video") && !item.closest("[hidden]");
  });
}

function getStaggerAmount(items) {
  return Math.min(MOTION.staggerMax, Math.max(MOTION.staggerMin, items.length * 0.016));
}

function hasComplexChildren(el) {
  return [...el.childNodes].some((node) => {
    return node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute("data-reveal-char");
  });
}

function splitTextIntoGraphemes(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    const segmenter = new Intl.Segmenter("ru", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((segment) => segment.segment);
  }

  return [...text];
}

function prepareLetterSpans(target) {
  if (target.hasAttribute(LETTER_READY_ATTR)) {
    return [...target.querySelectorAll("[data-reveal-char]")];
  }

  if (hasComplexChildren(target)) {
    return [];
  }

  const text = target.textContent;

  if (!text || !text.trim()) {
    return [];
  }

  const chars = splitTextIntoGraphemes(text);

  target.textContent = "";
  target.setAttribute("aria-label", text);
  target.setAttribute(LETTER_READY_ATTR, "true");

  chars.forEach((char) => {
    if (/\s/.test(char)) {
      target.appendChild(document.createTextNode(char));
      return;
    }

    const span = document.createElement("span");

    span.textContent = char;
    span.setAttribute("aria-hidden", "true");
    span.setAttribute("data-reveal-char", "true");

    span.style.display = "inline-block";
    span.style.transformOrigin = "50% 60%";
    span.style.willChange = "transform";

    target.appendChild(span);
  });

  return [...target.querySelectorAll("[data-reveal-char]")];
}

function initLetterRepel(target, gsap) {
  if (target.hasAttribute(LETTER_REPEL_BOUND_ATTR)) return;
  if (window.matchMedia(COARSE_POINTER_QUERY).matches) return;

  const chars = prepareLetterSpans(target);

  if (!chars.length) return;

  let frame = null;
  let lastEvent = null;

  function resetChars() {
    gsap.to(chars, {
      x: 0,
      y: 0,
      rotateZ: 0,
      scale: 1,
      duration: REPEL.resetDuration,
      ease: MOTION.ease,
      overwrite: "auto",
    });
  }

  function updateChars() {
    frame = null;

    if (!lastEvent) return;

    const pointerX = lastEvent.clientX;
    const pointerY = lastEvent.clientY;

    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const charX = rect.left + rect.width / 2;
      const charY = rect.top + rect.height / 2;

      const dx = charX - pointerX;
      const dy = charY - pointerY;
      const distance = Math.hypot(dx, dy);

      if (distance > REPEL.radius || distance === 0) {
        gsap.to(char, {
          x: 0,
          y: 0,
          rotateZ: 0,
          scale: 1,
          duration: REPEL.resetDuration,
          ease: MOTION.ease,
          overwrite: "auto",
        });
        return;
      }

      const force = 1 - distance / REPEL.radius;
      const directionX = dx / distance;
      const directionY = dy / distance;

      gsap.to(char, {
        x: directionX * REPEL.x * force,
        y: directionY * REPEL.y * force,
        rotateZ: directionX * REPEL.rotate * force,
        scale: 1 + force * 0.018,
        duration: REPEL.duration,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }

  target.addEventListener("pointermove", (event) => {
    lastEvent = event;

    if (frame) return;

    frame = window.requestAnimationFrame(updateChars);
  });

  target.addEventListener("pointerleave", () => {
    lastEvent = null;

    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }

    resetChars();
  });

  target.setAttribute(LETTER_REPEL_BOUND_ATTR, "true");
}

function animateHeadingLeft(target, gsap) {
  gsap.fromTo(
    target,
    {
      x: MOTION.headingX,
      scale: MOTION.headingScale,
      rotateZ: -0.2,
      transformOrigin: "0% 50%",
    },
    {
      x: 0,
      scale: 1,
      rotateZ: 0,
      duration: MOTION.headingDuration,
      ease: MOTION.ease,
      overwrite: "auto",
      clearProps: "transform,transformOrigin",
    },
  );
}

function animateHeadingTurn(target, gsap) {
  gsap.fromTo(
    target,
    {
      x: MOTION.headingSmallX,
      scale: MOTION.headingScale,
      rotateY: -5,
      transformPerspective: 700,
      transformOrigin: "0% 50%",
    },
    {
      x: 0,
      scale: 1,
      rotateY: 0,
      duration: MOTION.headingDuration,
      ease: MOTION.ease,
      overwrite: "auto",
      clearProps: "transform,transformOrigin,transformPerspective",
    },
  );
}

function animateHeadingScale(target, gsap) {
  gsap.fromTo(
    target,
    {
      x: MOTION.headingSmallX,
      scale: 0.986,
      transformOrigin: "0% 50%",
    },
    {
      x: 0,
      scale: 1,
      duration: MOTION.headingDuration,
      ease: MOTION.ease,
      overwrite: "auto",
      clearProps: "transform,transformOrigin",
    },
  );
}

function animateHeadingLetters(target, gsap) {
  const chars = prepareLetterSpans(target);

  if (!chars.length) {
    animateHeadingLeft(target, gsap);
    return;
  }

  gsap.fromTo(
    chars,
    {
      x: -7,
      scale: MOTION.headingLetterScale,
      rotateY: -10,
      rotateZ: -1.4,
      transformOrigin: "50% 60%",
    },
    {
      x: 0,
      scale: 1,
      rotateY: 0,
      rotateZ: 0,
      duration: MOTION.headingLetterDuration,
      ease: MOTION.ease,
      stagger: {
        each: MOTION.letterStagger,
        from: "start",
      },
      overwrite: "auto",
      clearProps: "transform",
    },
  );
}

function animateHeading(target, preset, gsap) {
  if (preset === "letters") {
    animateHeadingLetters(target, gsap);
    return;
  }

  if (preset === "text-turn") {
    animateHeadingTurn(target, gsap);
    return;
  }

  if (preset === "text-scale") {
    animateHeadingScale(target, gsap);
    return;
  }

  animateHeadingLeft(target, gsap);
}

function animateGalleryScale(items, gsap) {
  gsap.fromTo(
    items,
    {
      scale: MOTION.galleryScale,
      transformOrigin: "50% 50%",
    },
    {
      scale: 1,
      duration: MOTION.galleryDuration,
      ease: MOTION.ease,
      stagger: {
        amount: getStaggerAmount(items),
        from: "center",
        grid: "auto",
        ease: MOTION.softEase,
      },
      overwrite: "auto",
      clearProps: "transform,transformOrigin",
    },
  );
}

function animateGalleryFlow(items, gsap) {
  gsap.fromTo(
    items,
    {
      x: (index) => (index % 2 === 0 ? -MOTION.galleryX : MOTION.galleryX),
      scale: MOTION.galleryScale,
      transformOrigin: "50% 50%",
    },
    {
      x: 0,
      scale: 1,
      duration: MOTION.galleryDuration,
      ease: MOTION.ease,
      stagger: {
        amount: getStaggerAmount(items),
        from: "start",
        grid: "auto",
        ease: MOTION.softEase,
      },
      overwrite: "auto",
      clearProps: "transform,transformOrigin",
    },
  );
}

function animateGalleryTurn(items, gsap) {
  gsap.fromTo(
    items,
    {
      x: (index) => (index % 2 === 0 ? -4 : 4),
      scale: MOTION.galleryScale,
      rotateZ: (index) => (index % 2 === 0 ? -0.35 : 0.35),
      transformOrigin: "50% 50%",
    },
    {
      x: 0,
      scale: 1,
      rotateZ: 0,
      duration: MOTION.galleryDuration,
      ease: MOTION.ease,
      stagger: {
        amount: getStaggerAmount(items),
        from: "start",
        grid: "auto",
        ease: MOTION.softEase,
      },
      overwrite: "auto",
      clearProps: "transform,transformOrigin",
    },
  );
}

function animateGallery(gallery, preset, gsap) {
  const items = getGalleryItems(gallery);

  if (!items.length) return;

  if (preset === "gallery-flow") {
    animateGalleryFlow(items, gsap);
    return;
  }

  if (preset === "gallery-turn") {
    animateGalleryTurn(items, gsap);
    return;
  }

  animateGalleryScale(items, gsap);
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) return;

  const gsap = window.gsap;

  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(isSafeTarget);

  headings.forEach((heading, index) => {
    const preset = getPreset(heading, HEADING_STYLES, index);

    if (preset === "letters" || heading.getAttribute(LETTER_REPEL_ATTR) === "true") {
      prepareLetterSpans(heading);
    }

    if (heading.getAttribute(LETTER_REPEL_ATTR) === "true") {
      initLetterRepel(heading, gsap);
    }

    heading.setAttribute(BOUND_ATTR, "heading");

    observeOnce(
      heading,
      (target) => {
        animateHeading(target, preset, gsap);
      },
      {
        rootMargin: "0px 0px -10% 0px",
      },
    );
  });

  const galleries = [...root.querySelectorAll(GALLERY_SELECTOR)].filter(isSafeTarget);

  galleries.forEach((gallery, index) => {
    const preset = getPreset(gallery, GALLERY_STYLES, index);

    gallery.setAttribute(BOUND_ATTR, "gallery");

    observeOnce(
      gallery,
      (target) => {
        animateGallery(target, preset, gsap);
      },
      {
        rootMargin: "0px 0px -8% 0px",
      },
    );
  });
}
