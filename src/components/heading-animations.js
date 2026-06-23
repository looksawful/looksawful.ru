/**
 * Subtle GSAP scroll-reveal animations for section headings.
 * Uses window.gsap + window.ScrollTrigger (loaded via CDN in HTML).
 * Respects prefers-reduced-motion.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Only animate headings that are true section openers (inside block__header / component-caption),
// excluding inline text-block headings and hidden sections.
const HEADING_SELECTOR = ".block__header > .title, .component-caption > .title";

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    typeof window.gsap !== "undefined" &&
    typeof window.ScrollTrigger !== "undefined" &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) return;

  const { gsap, ScrollTrigger } = window;

  // Register plugin (safe to call multiple times)
  gsap.registerPlugin(ScrollTrigger);

  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(
    (el) =>
      // Skip hidden elements
      !el.closest("[hidden]") &&
      // Skip hero section (has its own animation)
      !el.closest(".hero") &&
      // Skip elements already initialized by other animators
      !el.hasAttribute("data-heading-animated"),
  );

  headings.forEach((el) => {
    el.setAttribute("data-heading-animated", "1");

    gsap.fromTo(
      el,
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.52,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 89%",
          once: true,
        },
      },
    );
  });
}
