import {
  createObservedInitializer,
  createProximityMotion
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
  return video.closest("[data-section-media-item], .section-media, [data-animation], [data-visual-demo]");
};

const updateVideoControlIcon = (control, video) => {
  control.innerHTML = video.paused ? playIcon : pauseIcon;
  control.setAttribute("aria-label", video.paused ? "play video" : "pause video");
};

export const initMediaSliderDotsProximity = () => {
  document.querySelectorAll(".section-media-slider").forEach((slider) => {
    const dots = slider.querySelector(".section-media-slider__dots");

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
  document.querySelectorAll(".section-media-slider").forEach((slider) => {
    const arrows = slider.querySelectorAll(".section-media-slider__arrow");

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
  document.querySelectorAll("a[data-section-media-item][href]").forEach((item) => {
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
    ".section-media",
    "[data-animation]",
    "[data-visual-demo]",
  ].join(",");

  document.querySelectorAll(selector).forEach((element) => {
    if (initializedFullscreenControls.has(element)) {
      return;
    }

    const mediaParent = element.closest(".section-media");

    if (mediaParent && mediaParent !== element) {
      return;
    }

    if (element.closest(".section-media-slider")) {
      return;
    }

    if (element.closest("[data-section-media-item]")) {
      return;
    }

    if (element.querySelector(":scope > a[data-section-media-item]")) {
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

    if (container.matches("a[data-section-media-item][href]")) {
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

export const initProximityComponents = () => {
  initMediaSliderDotsProximity();
  initMediaSliderArrowProximity();
  initMediaItemOpenProximity();
  initMediaFullscreenProximity();
  initMediaVideoProximity();
  initLightboxCloseProximity();
};

createObservedInitializer(initProximityComponents);
