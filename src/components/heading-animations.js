/**
 * GSAP scroll-reveal for section headings + image galleries.
 * Uses IntersectionObserver (no ScrollTrigger dependency).
 *
 * SAFETY RULES:
 *  - Never call gsap.set() to hide anything upfront. Only animate when
 *    element enters viewport. This prevents canvas/video/slider breakage.
 *  - Gallery animation only targets <a> and <img> children, never canvas.
 *  - All animations start from visible (opacity ≥ 0.001) so elements
 *    never stay invisible if the observer fails to fire.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const HEADING_SELECTOR = ".component-caption > .title, .block__header > .title";

// Only multi-item image grids — no sliders, no media-banner (single item)
const GALLERY_SELECTOR = [
  ".media-quad:not([data-showcase-auto-slider])",
  ".media-six:not([data-showcase-auto-slider])",
  ".media-eight:not([data-showcase-auto-slider])",
  ".media-three:not(.playlist-filter-embed__gallery):not([data-showcase-auto-slider])",
].join(", ");

// Items safe to animate inside a gallery (never canvas, video, section)
const SAFE_ITEM_SELECTOR = "a.media-item";

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    typeof window.gsap !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function observe(el, callback, options = {}) {
  const obs = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      obs.unobserve(el);
      callback(el);
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px", ...options },
  );
  obs.observe(el);
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) return;

  const gsap = window.gsap;

  /* ── Headings: fade-up on enter, CSS initial state handles pre-enter ── */
  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(
    (el) =>
      !el.closest("[hidden]") &&
      !el.closest(".hero") &&
      !el.hasAttribute("data-reveal"),
  );

  headings.forEach((el) => {
    el.setAttribute("data-reveal", "heading");

    observe(el, (target) => {
      // fromTo starting from barely visible so there is no "pop-in" if
      // the element is already partially in view when the page loads.
      gsap.fromTo(
        target,
        { opacity: 0.001, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
      );
    });
  });

  /* ── Galleries: staggered fade-in of <a> items only ── */
  const galleries = [...root.querySelectorAll(GALLERY_SELECTOR)].filter(
    (el) => !el.closest("[hidden]") && !el.hasAttribute("data-reveal"),
  );

  galleries.forEach((gallery) => {
    gallery.setAttribute("data-reveal", "gallery");

    observe(
      gallery,
      (target) => {
        const items = [...target.querySelectorAll(SAFE_ITEM_SELECTOR)];
        if (!items.length) return;

        gsap.fromTo(
          items,
          { opacity: 0.001, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            stagger: { amount: 0.45, from: "start" },
            clearProps: "transform,opacity",
          },
        );
      },
      { threshold: 0.05 },
    );
  });
}
