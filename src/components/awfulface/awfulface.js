import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Legacy problem areas removed:
 * - ROUTE_RANGE / ROUTE_STOPS: section-to-section routing was fragile on mobile.
 * - Scroll-scrubbed SVG position: caused crooked movement and wrong viewport binding.
 * - Per-section clamping during ScrollTrigger refresh: produced jumps on resize and mobile.
 * - Route scatter variants: they mixed movement, split, fall, and parking states.
 *
 * New behavior:
 * - The face stays parked in the hero.
 * - Eye tracking stays intact while the face is assembled.
 * - On scroll start from the hero, parts fall down out of the viewport with stagger.
 * - When scrolling back to the top of the hero, the face reassembles.
 */

const HERO_SELECTORS = [".hero", "#hero", "[data-hero]"];
const HERO_FOCUS_SELECTORS = [".hero__screen--cover", ".hero", "#hero", "[data-hero]"];

const FALL_START_PROGRESS = 0.002;
const FALL_SCROLL_OFFSET_PX = 6;
const FALL_DURATION = 0.78;
const FALL_STAGGER = 0.065;
const RESTORE_DURATION = 0.42;

const FALL_STACK = [
  { x: -78, y: 132, rotation: -38 },
  { x: -26, y: 168, rotation: 28 },
  { x: 72, y: 124, rotation: 42 },
  { x: 22, y: 154, rotation: -26 },
  { x: -58, y: 188, rotation: 32 },
  { x: 92, y: 176, rotation: -44 },
];

const POP_STACK = [
  { x: -34, y: -18, rotation: -12 },
  { x: -8, y: -24, rotation: 8 },
  { x: 30, y: -16, rotation: 12 },
  { x: 12, y: -12, rotation: -8 },
  { x: -22, y: -10, rotation: 10 },
  { x: 34, y: -8, rotation: -12 },
];

function asArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function getFirstExistingElement(selectors, fallback = null) {
  for (const selector of asArray(selectors)) {
    const element = document.querySelector(selector);

    if (element) {
      return element;
    }
  }

  return fallback;
}

function getDocumentTop(element) {
  return element.getBoundingClientRect().top + window.scrollY;
}

function clampBetween(value, min, max) {
  if (min > max) {
    return (min + max) * 0.5;
  }

  return Math.max(min, Math.min(max, value));
}

function interpolate(from, to, progress) {
  return from + (to - from) * progress;
}

export function mountawfulface(containerId = "awfulface", { eyeStrength = 1, fallOnScroll = true } = {}) {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.awfulfaceMounted === "true") {
    return;
  }

  container.dataset.awfulfaceMounted = "true";

  const previousContainerStyle = {
    position: container.style.position,
    inset: container.style.inset,
    width: container.style.width,
    height: container.style.height,
    pointerEvents: container.style.pointerEvents,
    visibility: container.style.visibility,
    zIndex: container.style.zIndex,
  };

  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.pointerEvents = "none";
  container.style.visibility = "visible";

  if (!container.style.zIndex) {
    container.style.zIndex = "30";
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "400");
  svg.setAttribute("height", "400");
  svg.setAttribute("viewBox", "-200 -200 400 400");
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.overflow = "visible";

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const leftEye = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  leftEye.setAttribute("cx", "-62");
  leftEye.setAttribute("cy", "-8");
  leftEye.setAttribute("rx", "7");
  leftEye.setAttribute("ry", "5");

  const rightEye = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  rightEye.setAttribute("cx", "26");
  rightEye.setAttribute("cy", "-24");
  rightEye.setAttribute("rx", "7");
  rightEye.setAttribute("ry", "5");

  const rightBrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  rightBrow.setAttribute("d", "M -25 -28 L 30 -65");
  rightBrow.setAttribute("stroke", "#222222");
  rightBrow.setAttribute("stroke-width", "9");
  rightBrow.setAttribute("fill", "none");

  const dashGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  dashGroup.setAttribute("transform", "translate(-20 5)");

  const dash = document.createElementNS("http://www.w3.org/2000/svg", "path");
  dash.setAttribute("d", "M -5 62 L 30 82");
  dash.setAttribute("stroke", "#222222");
  dash.setAttribute("stroke-width", "9");
  dash.setAttribute("fill", "none");
  dashGroup.appendChild(dash);

  const nose = document.createElementNS("http://www.w3.org/2000/svg", "path");
  nose.setAttribute("d", "M -75 -48 Q -30 -45 -25 -32 Q -20 0 -20 -5 Q -20 15 -5 7 Q 15 -10 1 0");
  nose.setAttribute("stroke", "#222222");
  nose.setAttribute("stroke-width", "9");
  nose.setAttribute("fill", "none");
  nose.setAttribute("stroke-linejoin", "round");

  const mouth = document.createElementNS("http://www.w3.org/2000/svg", "path");
  mouth.setAttribute("d", "M -60 55 Q -35 27 -20 48 Q -15 70 10 35 Q 22 32 35 48 Q 55 42 50 46");
  mouth.setAttribute("stroke", "#222222");
  mouth.setAttribute("stroke-width", "9");
  mouth.setAttribute("fill", "none");
  mouth.setAttribute("stroke-linecap", "round");
  mouth.setAttribute("stroke-linejoin", "round");

  const headShapes = [leftEye, rightEye, rightBrow, dashGroup, nose, mouth];

  const headParts = headShapes.map((shape) => {
    const part = document.createElementNS("http://www.w3.org/2000/svg", "g");
    part.setAttribute("data-awfulface-part", "");
    part.appendChild(shape);
    group.appendChild(part);
    return part;
  });

  svg.appendChild(group);
  container.appendChild(svg);

  gsap.set(svg, {
    xPercent: -50,
    yPercent: -50,
    transformOrigin: "50% 50%",
  });

  gsap.set(headParts, {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    opacity: 1,
    transformBox: "fill-box",
    transformOrigin: "50% 50%",
  });

  const setSvgX = gsap.quickSetter(svg, "x", "px");
  const setSvgY = gsap.quickSetter(svg, "y", "px");
  const setSvgScale = gsap.quickSetter(svg, "scale");

  const leftBase = { x: -62, y: -8 };
  const rightBase = { x: 26, y: -24 };

  let isEyeTrackingActive = true;
  let hasFallen = false;
  let fallTimeline = null;
  let restoreTimeline = null;
  let scrollTrigger = null;
  let scrollRaf = null;
  let resizeRaf = null;

  let currentHeadPosition = {
    x: window.innerWidth * 0.24,
    y: window.innerHeight * 0.16,
    scale: 0.94,
  };

  function resetEyes() {
    leftEye.setAttribute("cx", leftBase.x);
    leftEye.setAttribute("cy", leftBase.y);
    rightEye.setAttribute("cx", rightBase.x);
    rightEye.setAttribute("cy", rightBase.y);
  }

  function trackEyes(event) {
    if (!isEyeTrackingActive || hasFallen) {
      return;
    }

    const rect = svg.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const mouseX = ((event.clientX - rect.left) / rect.width) * 400 - 200;
    const mouseY = ((event.clientY - rect.top) / rect.height) * 400 - 200;

    const dx1 = ((mouseX - leftBase.x) / 200) * eyeStrength;
    const dy1 = ((mouseY - leftBase.y) / 200) * eyeStrength;

    leftEye.setAttribute("cx", leftBase.x + dx1);
    leftEye.setAttribute("cy", leftBase.y + dy1);

    const dx2 = ((mouseX - rightBase.x) / 200) * eyeStrength;
    const dy2 = ((mouseY - rightBase.y) / 200) * 0.5 * eyeStrength;

    rightEye.setAttribute("cx", rightBase.x + dx2);
    rightEye.setAttribute("cy", rightBase.y + dy2);
  }

  function stopEyeTracking() {
    if (!isEyeTrackingActive) {
      return;
    }

    isEyeTrackingActive = false;
    resetEyes();
  }

  function startEyeTracking() {
    if (isEyeTrackingActive || hasFallen) {
      return;
    }

    isEyeTrackingActive = true;
  }

  function getHeadSize() {
    const size = Number.parseFloat(getComputedStyle(svg).width);
    return Number.isFinite(size) && size > 0 ? size : 400;
  }

  function clampHeadPosition(position) {
    const scale = position.scale ?? 1;
    const radius = (getHeadSize() * scale) / 2;
    const isCompact = window.matchMedia("(max-width: 48rem)").matches;
    const margin = isCompact ? 8 : 16;

    return {
      ...position,
      scale,
      x: clampBetween(position.x, radius + margin, window.innerWidth - radius - margin),
      y: clampBetween(position.y, radius + margin, window.innerHeight - radius - margin),
    };
  }

  function getHeroParkingPosition() {
    const isCompact = window.matchMedia("(max-width: 48rem)").matches;
    const hero = getFirstExistingElement(HERO_SELECTORS, container.closest(".hero") || container.parentElement);
    const focusElement = getFirstExistingElement(HERO_FOCUS_SELECTORS, hero || container.parentElement || container);

    const fallback = {
      x: window.innerWidth * (isCompact ? 0.24 : 0.24),
      y: window.innerHeight * (isCompact ? 0.14 : 0.16),
      scale: isCompact ? 0.8 : 0.94,
    };

    if (!(focusElement instanceof HTMLElement)) {
      return clampHeadPosition(fallback);
    }

    const rect = focusElement.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return clampHeadPosition(fallback);
    }

    return clampHeadPosition({
      x: rect.left + rect.width * (isCompact ? 0.24 : 0.24),
      y: rect.top + rect.height * (isCompact ? 0.14 : 0.16),
      scale: isCompact ? 0.8 : 0.94,
    });
  }

  function setHeadPosition(position, { keepInViewport = true } = {}) {
    const safePosition = keepInViewport ? clampHeadPosition(position) : position;

    currentHeadPosition = {
      x: safePosition.x,
      y: safePosition.y,
      scale: safePosition.scale ?? 1,
    };

    setSvgX(currentHeadPosition.x);
    setSvgY(currentHeadPosition.y);
    setSvgScale(currentHeadPosition.scale);
  }

  function resetHeadParts() {
    gsap.set(headParts, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      overwrite: "auto",
    });
  }

  function stopFall() {
    fallTimeline?.kill();
    fallTimeline = null;
  }

  function stopRestore() {
    restoreTimeline?.kill();
    restoreTimeline = null;
  }

  function getFallTarget(index, basePosition) {
    const headSize = getHeadSize();
    const stack = FALL_STACK[index % FALL_STACK.length];
    const exitY = Math.max(window.innerHeight - basePosition.y + headSize * 0.78, headSize * 1.35);

    return {
      x: stack.x,
      y: exitY + stack.y + index * 28,
      rotation: stack.rotation,
    };
  }

  function getPopTarget(index) {
    return POP_STACK[index % POP_STACK.length];
  }

  function playFall() {
    if (hasFallen) {
      return;
    }

    stopRestore();
    stopFall();

    hasFallen = true;
    stopEyeTracking();

    const basePosition = { ...currentHeadPosition };

    fallTimeline = gsap.timeline({
      onComplete() {
        fallTimeline = null;
      },
    });

    headParts.forEach((part, index) => {
      const popTarget = getPopTarget(index);
      const fallTarget = getFallTarget(index, basePosition);
      const startAt = index * FALL_STAGGER;

      fallTimeline
        .to(
          part,
          {
            x: popTarget.x,
            y: popTarget.y,
            rotation: popTarget.rotation,
            scale: 1,
            duration: 0.16,
            ease: "power2.out",
            overwrite: "auto",
          },
          startAt,
        )
        .to(
          part,
          {
            x: fallTarget.x,
            y: fallTarget.y,
            rotation: fallTarget.rotation,
            scale: 1,
            duration: FALL_DURATION,
            ease: "power2.in",
            overwrite: "auto",
          },
          startAt + 0.1,
        );
    });
  }

  function restoreHead() {
    stopFall();
    stopRestore();

    hasFallen = false;
    stopEyeTracking();

    const parkingPosition = getHeroParkingPosition();

    restoreTimeline = gsap.timeline({
      onComplete() {
        restoreTimeline = null;
        startEyeTracking();
      },
    });

    restoreTimeline
      .to(
        svg,
        {
          x: parkingPosition.x,
          y: parkingPosition.y,
          scale: parkingPosition.scale,
          duration: RESTORE_DURATION,
          ease: "power3.out",
          overwrite: "auto",
        },
        0,
      )
      .to(
        headParts,
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: RESTORE_DURATION,
          ease: "power3.out",
          overwrite: "auto",
          stagger: {
            each: 0.018,
            from: "center",
          },
        },
        0,
      );
  }

  function updateParkingPosition() {
    if (hasFallen || fallTimeline || restoreTimeline) {
      return;
    }

    setHeadPosition(getHeroParkingPosition());
    resetHeadParts();
    startEyeTracking();
  }

  function getHeroTriggerElement() {
    return getFirstExistingElement(HERO_SELECTORS, container.closest(".hero") || document.body);
  }

  function handleNativeScroll(hero) {
    if (scrollRaf) {
      return;
    }

    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = null;

      const heroTop = getDocumentTop(hero);
      const hasStartedHeroScroll = window.scrollY > heroTop + FALL_SCROLL_OFFSET_PX;
      const isBackAtHeroTop = window.scrollY <= heroTop + 1;

      if (!hasFallen && hasStartedHeroScroll) {
        playFall();
      }

      if (hasFallen && isBackAtHeroTop) {
        restoreHead();
      }
    });
  }

  function setupScrollFallTrigger() {
    const hero = getHeroTriggerElement();

    scrollTrigger = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      invalidateOnRefresh: true,

      // Problem zone from the old version:
      // Do not scrub x/y/scale by scroll progress. ScrollTrigger is only a launch trigger now.
      onUpdate(self) {
        if (!hasFallen && self.direction > 0 && self.progress > FALL_START_PROGRESS) {
          playFall();
        }

        if (hasFallen && self.direction < 0 && self.progress <= 0.001) {
          restoreHead();
        }
      },

      onLeave() {
        if (!hasFallen) {
          playFall();
        }
      },

      onLeaveBack() {
        if (hasFallen) {
          restoreHead();
        }
      },

      onRefresh() {
        updateParkingPosition();
      },
    });

    const onScroll = () => handleNativeScroll(hero);
    window.addEventListener("scroll", onScroll, { passive: true });

    requestAnimationFrame(() => {
      updateParkingPosition();
      handleNativeScroll(hero);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }

  function handleResize() {
    if (resizeRaf) {
      return;
    }

    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = null;

      if (hasFallen) {
        stopFall();
        playFall();
        return;
      }

      updateParkingPosition();
      ScrollTrigger.refresh();
    });
  }

  document.addEventListener("mousemove", trackEyes);
  window.addEventListener("resize", handleResize);

  setHeadPosition(getHeroParkingPosition());
  resetHeadParts();

  let removeNativeScroll = null;

  if (fallOnScroll) {
    removeNativeScroll = setupScrollFallTrigger();
  } else {
    startEyeTracking();
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      updateParkingPosition();
      ScrollTrigger.refresh();
    });
  }

  return function destroyAwfulface() {
    stopFall();
    stopRestore();

    scrollTrigger?.kill();
    scrollTrigger = null;

    removeNativeScroll?.();
    removeNativeScroll = null;

    document.removeEventListener("mousemove", trackEyes);
    window.removeEventListener("resize", handleResize);

    if (scrollRaf) {
      window.cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
    }

    if (resizeRaf) {
      window.cancelAnimationFrame(resizeRaf);
      resizeRaf = null;
    }

    svg.remove();

    container.dataset.awfulfaceMounted = "false";
    container.style.position = previousContainerStyle.position;
    container.style.inset = previousContainerStyle.inset;
    container.style.width = previousContainerStyle.width;
    container.style.height = previousContainerStyle.height;
    container.style.pointerEvents = previousContainerStyle.pointerEvents;
    container.style.visibility = previousContainerStyle.visibility;
    container.style.zIndex = previousContainerStyle.zIndex;
  };
}
