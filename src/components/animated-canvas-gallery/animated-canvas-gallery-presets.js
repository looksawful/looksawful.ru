export const ANIMATED_CANVAS_GALLERY_PRESETS = Object.freeze({
  embedded: Object.freeze({
    "data-animation-preset": "autoplay",
    "data-animation-duration": "moderate",
    "data-animation-is-looping": "true",
    "data-autoplay": "true",
    "data-animation-hover": "true",
    "data-animation-lightbox": "false",
    "data-animation-max-dpr": "1.25",
  }),

  "project-inline": Object.freeze({
    "data-animation-preset": "center-slowdown",
    "data-animation-duration": "slow",
    "data-animation-is-looping": "true",
    "data-autoplay": "true",
    "data-animation-hover": "true",
    "data-animation-lightbox": "false",
    "data-animation-center-min-factor": "0.24",
    "data-animation-max-dpr": "1.25",
  }),

  "project-wide": Object.freeze({
    "data-animation-preset": "autoplay",
    "data-animation-duration": "moderate",
    "data-animation-is-looping": "true",
    "data-autoplay": "true",
    "data-animation-hover": "true",
    "data-animation-lightbox": "false",
    "data-animation-max-dpr": "1.5",
  }),

  "project-showcase": Object.freeze({
    "data-animation-preset": "scroll-slowdown",
    "data-animation-duration": "slow",
    "data-animation-is-looping": "true",
    "data-autoplay": "true",
    "data-animation-hover": "true",
    "data-animation-lightbox": "false",
    "data-animation-scroll-idle-ms": "140",
    "data-animation-scroll-slow-factor": "0.22",
    "data-animation-max-dpr": "1.25",
  }),

  static: Object.freeze({
    "data-animation-preset": "autoplay",
    "data-animation-duration": "static",
    "data-animation-is-looping": "false",
    "data-autoplay": "false",
    "data-animation-hover": "false",
    "data-animation-lightbox": "false",
    "data-animation-max-dpr": "1.25",
  }),
});

export function applyAnimatedCanvasGalleryPreset(
  element,
  name = "embedded",
) {
  const preset = ANIMATED_CANVAS_GALLERY_PRESETS[name];

  if (!(element instanceof HTMLElement)) {
    return null;
  }

  if (!preset) {
    console.warn(
      `Animated Canvas Gallery: пресет "${name}" не найден.`,
    );
    return null;
  }

  for (const [attribute, value] of Object.entries(preset)) {
    if (!element.hasAttribute(attribute)) {
      element.setAttribute(attribute, value);
    }
  }

  return preset;
}
