/**
 * GSAP scroll-reveal for section headings + galleries.
 * Uses IntersectionObserver (no ScrollTrigger dependency).
 * window.gsap must be loaded via CDN before this module runs.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Only true section-opener headings; not inline text-block titles
const HEADING_SELECTOR = ".component-caption > .title, .block__header > .title";

const GALLERY_SELECTOR = [
  ".media-quad",
  ".media-six",
  ".media-eight",
  ".media-three:not(.playlist-filter-embed__gallery)",
  ".media-masonry",
].join(", ");

function canAnimate() {
  return (
    typeof window !== "undefined" &&
    typeof window.gsap !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

function makeObserver(callback, options = {}) {
  return new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        callback(e.target);
        e.target._revealObserver?.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...options },
  );
}

export function initHeadingAnimations(root = document) {
  if (!canAnimate()) return;

  const gsap = window.gsap;

  /* ── Headings ──────────────────────────────────────── */
  const headings = [...root.querySelectorAll(HEADING_SELECTOR)].filter(
    (el) =>
      !el.closest("[hidden]") &&
      !el.closest(".hero") &&
      !el.hasAttribute("data-reveal"),
  );

  if (headings.length) {
    // Pre-hide so there's no flash before observer fires
    gsap.set(headings, { opacity: 0, y: 16 });

    const hObs = makeObserver((el) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" });
    });

    headings.forEach((el) => {
      el.setAttribute("data-reveal", "heading");
      el._revealObserver = hObs;
      hObs.observe(el);
    });
  }

  /* ── Galleries ─────────────────────────────────────── */
  const galleries = [...root.querySelectorAll(GALLERY_SELECTOR)].filter(
    (el) => !el.closest("[hidden]") && !el.hasAttribute("data-reveal"),
  );

  if (galleries.length) {
    const gObs = makeObserver(
      (gallery) => {
        const items = [...gallery.querySelectorAll(".media-item")];
        if (!items.length) return;
        gsap.fromTo(
          items,
          { opacity: 0, y: 24, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
            stagger: { amount: 0.36, from: "start" },
          },
        );
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    galleries.forEach((el) => {
      el.setAttribute("data-reveal", "gallery");
      el._revealObserver = gObs;
      gObs.observe(el);
    });
  }
}
