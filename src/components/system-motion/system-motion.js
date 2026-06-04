import { gsap } from "gsap";

const MOTION_SELECTOR = [
  ".cv-section-title",
  ".cv-project-hero",
  ".cv-task-domain",
  ".pet-card",
  ".pet-page-section",
  ".resume-hero",
  ".site-footer",
].join(", ");

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const mountedTargets = new WeakSet();

function canAnimate() {
  return typeof window !== "undefined" && !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function initSystemMotion(root = document) {
  if (!canAnimate() || !("IntersectionObserver" in window)) {
    return null;
  }

  const targets = [...root.querySelectorAll(MOTION_SELECTOR)].filter((target) => {
    if (!(target instanceof HTMLElement) || mountedTargets.has(target)) {
      return false;
    }

    mountedTargets.add(target);
    return true;
  });

  if (!targets.length) {
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.unobserve(entry.target);
        gsap.fromTo(
          entry.target,
          {
            autoAlpha: 0.82,
            y: 8,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.34,
            ease: "power2.out",
            clearProps: "opacity,visibility,transform",
          },
        );
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.08,
    },
  );

  targets.forEach((target) => observer.observe(target));

  return () => observer.disconnect();
}
