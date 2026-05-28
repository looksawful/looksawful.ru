import { gsap } from "gsap";

const TEXT_SELECTOR = [
  ".hero__title-name",
  ".hero__title-role",
  ".hero__note",
  ".contact-links",
  ".hero__intro",
  ".screen__title",
  ".screen__subtitle",
  ".screen__text",
  ".screen__list",
  ".scanography__intro",
  ".scanography__work p",
  ".scanography__case-text",
  ".scanography__caption",
  ".interface-cases__copy",
  ".music-shoots__meta",
  ".music-shoots__counter",
  ".cv-index",
  ".cv-copy",
  ".cv-columns",
  ".cv-experience article",
  ".cv-archive article",
  ".profile__bio",
  ".profile__section-head",
  ".profile__row",
].join(", ");

const IMAGE_SELECTOR = [
  ".banner",
  ".screen__visual",
  ".scanography__photo",
  ".scanography__case-image",
  ".interface-cases__stage",
  ".music-shoots__slider",
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
