import { gsap } from "gsap";

const TEXT_SELECTOR = [
  ".site-nav__link",
  ".project-nav .nav-item",
  ".hero__title-name",
  ".hero__title-role",
  ".hero__note",
  ".contact-links",
  ".hero__intro",
  ".project__title",
  ".project__intro",
  ".project-work",
  ".project-article__title",
  ".project-article__intro",
  ".jestei-type-showcase__text",
  ".subarticle__title",
  ".subarticle__text",
].join(", ");

const IMAGE_SELECTOR = [
  ".awfulhead-container",
  ".project__banner",
  ".banner",
  ".image-placeholder",
  ".subarticle__media",
  ".scene-wrap",
  ".orbit",
].join(", ");

function prepareTargets(selector, typeClass) {
  return [...document.querySelectorAll(selector)].map((target) => {
    target.classList.add("gsap-reveal", typeClass);
    return target;
  });
}

export function initGsapRevealHooks() {
  const targets = [
    ...prepareTargets(TEXT_SELECTOR, "gsap-reveal--text"),
    ...prepareTargets(IMAGE_SELECTOR, "gsap-reveal--image"),
  ];

  if (!targets.length) {
    return;
  }

  gsap.set(targets, {
    "--gsap-reveal-opacity": 1,
    "--gsap-reveal-y": "0rem",
    "--gsap-reveal-scale": 1,
  });

  targets.forEach((target) => {
    target.classList.add("is-gsap-reveal-ready");
  });
}
