import gsap from "gsap";
import {
  createObservedInitializer,
  createProximityMotion,
  canUsePointerProximity,
  getDistanceToElement,
  getProximityProgress
} from "./proximity-core.js";

const initializedDots = new WeakSet();
const initializedArrows = new WeakSet();
const initializedOpenControls = new WeakSet();
const initializedFullscreenControls = new WeakSet();
const initializedVideoControls = new WeakSet();
const initializedLightboxClose = new WeakSet();

const fullscreenIcon = [
  '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  '<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>',
  '</svg>'
].join("");

const lightboxIcon = [
  '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  '<circle cx="7" cy="7" r="3.25" stroke="currentColor" stroke-width="1.5"></circle>',
  '<path d="M9.5 9.5 13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>',
  '</svg>'
].join("");

const externalIcon = [
  '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  '<path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>',
  '</svg>'
].join("");

const playIcon = [
  '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  '<path d="M5.2 3.6 12.2 8l-7 4.4V3.6Z" fill="currentColor"></path>',
  '</svg>'
].join("");

const pauseIcon = [
  '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
  '<path d="M5.5 4v8M10.5 4v8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>',
  '</svg>'
].join("");

const createProximityControl = ({
  tag = "button",
  className = "",
  label,
  icon = fullscreenIcon
}) => {
  const control = document.createElement(tag);

  control.className = `proximity-control ${className}`.trim();
  control.innerHTML = icon;
  control.dataset.proximityControl = "true";

  if (label) {
    control.setAttribute("aria-label", label);
  }

  if (tag === "button") {
    control.type = "button";
  }

  return control;
};

const isExternalHref = (element) => {
  const href = element.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
};

const requestElementFullscreen = (element) => {
  if (!element) {
    return;
  }

  if (document.fullscreenElement) {
    document.exitFullscreen?.();
    return;
  }

  element.requestFullscreen?.();
};

const getVideoContainer = (video) => {
  return video.closest(".media-item, .media, [data-animation], [data-visual-demo]");
};

const updateVideoControlIcon = (control, video) => {
  control.innerHTML = video.paused ? playIcon : pauseIcon;
  control.setAttribute("aria-label", video.paused ? "play video" : "pause video");
};

export const initMediaSliderDotsProximity = () => {
  document.querySelectorAll(".media-slider").forEach((slider) => {
    const dots = slider.querySelector(".media-slider__dots");

    if (!dots || initializedDots.has(dots)) {
      return;
    }

    initializedDots.add(dots);

    createProximityMotion({
      root: slider,
      target: dots,
      distanceTarget: dots,
      showStart: 280,
      showEnd: 18,
      yFrom: 8,
      yTo: 0,
      scaleXFrom: 0.94,
      scaleXTo: 1,
      scaleYFrom: 0.94,
      scaleYTo: 1,
      transformOrigin: "bottom center",
      activeClassTarget: dots
    });
  });
};

export const initMediaSliderArrowProximity = () => {
  document.querySelectorAll(".media-slider").forEach((slider) => {
    const arrows = slider.querySelectorAll(".media-slider__arrow");

    arrows.forEach((arrow) => {
      if (initializedArrows.has(arrow)) {
        return;
      }

      initializedArrows.add(arrow);
      arrow.classList.add("media-slider__arrow--proximity");

      createProximityMotion({
        root: slider,
        listenRoot: document,
        target: arrow,
        distanceTarget: arrow,
        showStart: 260,
        showEnd: 28,
        yFrom: 0,
        yTo: 0,
        scaleXFrom: 1,
        scaleXTo: 1,
        scaleYFrom: 1,
        scaleYTo: 1,
        transformOrigin: "center",
        activeClassTarget: arrow
      });
    });
  });
};

export const initMediaItemOpenProximity = () => {
  document.querySelectorAll("a.media-item[href]").forEach((item) => {
    if (initializedOpenControls.has(item)) {
      return;
    }

    if (item.querySelector(".proximity-control--open")) {
      initializedOpenControls.add(item);
      return;
    }

    initializedOpenControls.add(item);
    item.classList.add("has-proximity-control");

    const hasVideo = Boolean(item.querySelector("video")) || /\.(mp4|webm|mov)(\?.*)?(#.*)?$/i.test(item.getAttribute("href") || "");
    const isExternal = isExternalHref(item);

    const control = createProximityControl({
      tag: "span",
      label: isExternal ? "open external link" : hasVideo ? "open video" : "open media",
      icon: isExternal ? externalIcon : hasVideo ? playIcon : lightboxIcon,
      className: [
        "proximity-control--top-right",
        "proximity-control--open",
        isExternal ? "proximity-control--external" : "",
        hasVideo ? "proximity-control--video-link" : "proximity-control--lightbox"
      ].filter(Boolean).join(" ")
    });

    control.setAttribute("aria-hidden", "true");
    item.append(control);

    createProximityMotion({
      root: item,
      target: control,
      distanceTarget: control,
      showStart: 220,
      showEnd: 24,
      yFrom: 8,
      yTo: 0,
      scaleXFrom: 0.94,
      scaleXTo: 1,
      scaleYFrom: 0.94,
      scaleYTo: 1,
      transformOrigin: "center",
      activeClassTarget: control
    });
  });
};

export const initMediaFullscreenProximity = () => {
  const selector = [
    ".media",
    "[data-animation]",
    "[data-visual-demo]",
  ].join(",");

  document.querySelectorAll(selector).forEach((element) => {
    if (initializedFullscreenControls.has(element)) {
      return;
    }

    const mediaParent = element.closest(".media");

    if (mediaParent && mediaParent !== element) {
      return;
    }

    if (element.closest(".media-slider")) {
      return;
    }

    if (element.closest(".media-item")) {
      return;
    }

    if (element.querySelector(":scope > a.media-item")) {
      return;
    }

    if (!element.querySelector("img, video, canvas")) {
      return;
    }

    if (element.querySelector(":scope > .proximity-control--fullscreen")) {
      initializedFullscreenControls.add(element);
      return;
    }

    initializedFullscreenControls.add(element);
    element.classList.add("has-proximity-control");

    const control = createProximityControl({
      label: "fullscreen",
      icon: fullscreenIcon,
      className: "proximity-control--top-right proximity-control--fullscreen"
    });

    element.append(control);

    control.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      requestElementFullscreen(element);
    });

    createProximityMotion({
      root: element,
      listenRoot: document,
      target: control,
      distanceTarget: control,
      showStart: 260,
      showEnd: 24,
      yFrom: 8,
      yTo: 0,
      scaleXFrom: 0.94,
      scaleXTo: 1,
      scaleYFrom: 0.94,
      scaleYTo: 1,
      transformOrigin: "center",
      activeClassTarget: control
    });
  });
};

export const initMediaVideoProximity = () => {
  document.querySelectorAll("video").forEach((video) => {
    const container = getVideoContainer(video);

    if (!container || initializedVideoControls.has(container)) {
      return;
    }

    if (container.matches("a.media-item[href]")) {
      initializedVideoControls.add(container);
      return;
    }

    if (container.querySelector(":scope > .proximity-control--video")) {
      initializedVideoControls.add(container);
      return;
    }

    initializedVideoControls.add(container);
    container.classList.add("has-proximity-control");

    const control = createProximityControl({
      label: "play video",
      icon: playIcon,
      className: "proximity-control--bottom-left proximity-control--video"
    });

    updateVideoControlIcon(control, video);
    container.append(control);

    control.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (video.paused) {
        try {
          await video.play();
        } catch {
          return;
        }
      } else {
        video.pause();
      }

      updateVideoControlIcon(control, video);
    });

    video.addEventListener("play", () => updateVideoControlIcon(control, video));
    video.addEventListener("pause", () => updateVideoControlIcon(control, video));
    video.addEventListener("ended", () => updateVideoControlIcon(control, video));

    createProximityMotion({
      root: container,
      target: control,
      distanceTarget: control,
      showStart: 220,
      showEnd: 22,
      yFrom: 8,
      yTo: 0,
      scaleXFrom: 0.94,
      scaleXTo: 1,
      scaleYFrom: 0.94,
      scaleYTo: 1,
      transformOrigin: "center",
      activeClassTarget: control
    });
  });
};

export const initLightboxCloseProximity = () => {
  document.querySelectorAll(".lightbox").forEach((lightbox) => {
    const close = lightbox.querySelector(".lightbox__close");

    if (!close || initializedLightboxClose.has(close)) {
      return;
    }

    initializedLightboxClose.add(close);
    close.classList.add("lightbox__close--proximity");

    createProximityMotion({
      root: lightbox,
      target: close,
      distanceTarget: close,
      showStart: 180,
      showEnd: 18,
      yFrom: 6,
      yTo: 0,
      scaleXFrom: 0.94,
      scaleXTo: 1,
      scaleYFrom: 0.94,
      scaleYTo: 1,
      transformOrigin: "center",
      activeClassTarget: close
    });
  });
};

const getCopyText = (block) => {
  const code = block.querySelector("code");

  if (code) {
    return code.innerText;
  }

  return block.innerText;
};


const initializedInteractiveSurfaces = new WeakSet();
const interactiveSurfaceRecords = new Map();

let interactiveSurfacePointer = null;
let interactiveSurfaceFrame = 0;
let interactiveSurfaceListening = false;

const interactiveSurfaceSelector = [
  "a[href]:not(.media-item)",
  "button:not([data-proximity-control='true'])",
  "summary",
  "[role='button']",
  ".project-link",
  ".button",
  ".btn",
  ".artifact-reader__open",
  ".artifact-reader__close",
  ".filter-fullscreen-button"
].join(",");

const interactiveSurfaceSkipSelector = [
  ".site-header",
  ".playlist-filter-embed",
  ".proximity-control",
  "[data-proximity-control='true']",
  ".media-slider__arrow--proximity",
  ".media-slider__dots",
  ".media-slider__dot",
  ".lightbox__close--proximity",
  "input",
  "select",
  "textarea",
  "label",
  "[disabled]",
  "[aria-disabled='true']",
  "[hidden]",
  "[aria-hidden='true']"
].join(",");

const isInteractiveSurfaceCandidate = (element) => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (initializedInteractiveSurfaces.has(element)) {
    return false;
  }

  if (element.matches(interactiveSurfaceSkipSelector)) {
    return false;
  }

  if (element.closest(".site-header, .playlist-filter-embed, .proximity-control, [hidden], [aria-hidden='true']")) {
    return false;
  }

  if (element.closest(".media-slider__dots")) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return rect.width >= 8 && rect.height >= 8;
};

const resetInteractiveSurfaceRecord = (record) => {
  record.xTo(0);
  record.yTo(0);
  record.scaleTo(1);
  record.element.classList.remove("is-proximity-interactive");
};

const updateInteractiveSurfaceRecords = () => {
  interactiveSurfaceFrame = 0;

  if (!interactiveSurfacePointer) {
    interactiveSurfaceRecords.forEach(resetInteractiveSurfaceRecord);
    return;
  }

  interactiveSurfaceRecords.forEach((record, element) => {
    if (!element.isConnected) {
      interactiveSurfaceRecords.delete(element);
      return;
    }

    const rect = element.getBoundingClientRect();

    if (rect.width < 8 || rect.height < 8) {
      resetInteractiveSurfaceRecord(record);
      return;
    }

    const distance = getDistanceToElement(interactiveSurfacePointer, element);
    const progress = getProximityProgress({
      distance,
      showStart: 132,
      showEnd: 10
    });

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pointerX = (interactiveSurfacePointer.clientX - centerX) / Math.max(rect.width, 1);
    const pointerY = (interactiveSurfacePointer.clientY - centerY) / Math.max(rect.height, 1);

    const x = pointerX * 5.2 * progress;
    const y = (pointerY * 3.4 - 1.15) * progress;
    const scale = 1 + progress * 0.026;

    record.xTo(x);
    record.yTo(y);
    record.scaleTo(scale);
    element.classList.toggle("is-proximity-interactive", progress > 0.08);
  });
};

const requestInteractiveSurfaceUpdate = () => {
  if (interactiveSurfaceFrame) {
    return;
  }

  interactiveSurfaceFrame = window.requestAnimationFrame(updateInteractiveSurfaceRecords);
};

const handleInteractiveSurfacePointerMove = (event) => {
  if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
    return;
  }

  interactiveSurfacePointer = {
    clientX: event.clientX,
    clientY: event.clientY
  };

  requestInteractiveSurfaceUpdate();
};

const resetInteractiveSurfaceRecords = () => {
  interactiveSurfacePointer = null;
  requestInteractiveSurfaceUpdate();
};

const ensureInteractiveSurfaceListeners = () => {
  if (interactiveSurfaceListening) {
    return;
  }

  interactiveSurfaceListening = true;

  document.addEventListener("pointermove", handleInteractiveSurfacePointerMove, { passive: true });
  window.addEventListener("scroll", resetInteractiveSurfaceRecords, { passive: true });
  window.addEventListener("blur", resetInteractiveSurfaceRecords);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetInteractiveSurfaceRecords();
    }
  });
};

export const initInteractiveSurfaceProximity = () => {
  if (!canUsePointerProximity()) {
    return;
  }

  document.querySelectorAll(interactiveSurfaceSelector).forEach((element) => {
    if (!isInteractiveSurfaceCandidate(element)) {
      return;
    }

    initializedInteractiveSurfaces.add(element);
    element.classList.add("proximity-surface");

    gsap.set(element, {
      x: 0,
      y: 0,
      scale: 1,
      transformOrigin: "center",
      force3D: true
    });

    const record = {
      element,
      xTo: gsap.quickTo(element, "x", { duration: 0.24, ease: "power3.out" }),
      yTo: gsap.quickTo(element, "y", { duration: 0.24, ease: "power3.out" }),
      scaleTo: gsap.quickTo(element, "scale", { duration: 0.24, ease: "power3.out" })
    };

    interactiveSurfaceRecords.set(element, record);

    element.addEventListener("focusin", () => {
      record.yTo(-1.15);
      record.scaleTo(1.026);
      element.classList.add("is-proximity-interactive");
    });

    element.addEventListener("focusout", () => {
      resetInteractiveSurfaceRecord(record);
    });
  });

  ensureInteractiveSurfaceListeners();
};
export const initProximityComponents = () => {
  
  initInteractiveSurfaceProximity();initMediaSliderDotsProximity();
  initMediaSliderArrowProximity();
  initMediaItemOpenProximity();
  initMediaFullscreenProximity();
  initMediaVideoProximity();
  initLightboxCloseProximity();
};

createObservedInitializer(initProximityComponents);


