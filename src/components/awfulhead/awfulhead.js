import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HERO_ROUTE = {
  triggerSelector: ".hero",
  start: "top top",
  end: "bottom top",
};

const ROUTE_STOPS = [
  {
    id: "title-anchor",
    selector: '[data-awfulhead-anchor="hero-title"]',
    focus: "cover",
    progress: 0,
  },
  {
    id: "title-role",
    selector: ".hero__title-role",
    focus: "cover",
    progress: 0.16,
    x: 0.78,
    y: 0.12,
    offsetX: -0.04,
    offsetY: -0.28,
    scale: 0.82,
  },
  {
    id: "hero-note",
    selector: ".hero__note",
    focus: "cover",
    progress: 0.32,
    x: 0.18,
    y: 0,
    offsetX: 0,
    offsetY: -0.42,
    scale: 0.72,
    mobile: {
      x: 0.18,
      offsetY: -0.4,
    },
  },
  {
    id: "contacts",
    selector: ".contact-links",
    focus: "cover",
    progress: 0.48,
    x: 0.74,
    y: 0,
    offsetX: 0,
    offsetY: -0.42,
    scale: 0.72,
    mobile: {
      x: 0.22,
      offsetY: -0.38,
    },
  },
  {
    id: "about-anchor",
    selector: '[data-awfulhead-anchor="hero-about"]',
    focus: "about",
    progress: 0.64,
  },
  {
    id: "about-middle",
    selector: ".hero__intro",
    focus: "about",
    progress: 0.79,
    x: 0.44,
    y: 0.32,
    offsetX: 0,
    offsetY: -0.18,
    scale: 0.72,
  },
  {
    id: "about-end",
    selector: ".hero__intro",
    focus: "about",
    progress: 0.91,
    x: 0.7,
    y: 0.66,
    offsetX: 0,
    offsetY: -0.08,
    scale: 0.68,
    mobile: {
      x: 0.34,
      y: 0.8,
    },
  },
  {
    id: "hero-exit",
    selector: ".hero__intro",
    focus: "about",
    progress: 1,
    x: 0.82,
    y: 0.9,
    offsetX: 0,
    offsetY: 0.18,
    scale: 0.66,
    mobile: {
      x: 0.5,
      y: 0.92,
      offsetY: 0.08,
    },
  },
];

const SEGMENT_VARIANTS = ["split", "fall", "split", "fall", "split", "fall", "exit-fall"];

const FALL_STACK = [
  { x: -120, y: 305, rotation: -20 },
  { x: -44, y: 365, rotation: 14 },
  { x: 72, y: 285, rotation: 26 },
  { x: 20, y: 340, rotation: -12 },
  { x: -86, y: 420, rotation: 18 },
  { x: 120, y: 385, rotation: -24 },
];

const SPLIT_DRIFT = [
  { y: -210, rotation: -92 },
  { y: 138, rotation: 76 },
  { y: -64, rotation: 124 },
  { y: 220, rotation: -108 },
  { y: -148, rotation: 68 },
  { y: 72, rotation: -132 },
];

const clampProgress = gsap.utils.clamp(0, 1);
const clampUnit = gsap.utils.clamp(0, 1);
const routeEase = gsap.parseEase("sine.inOut");
const fallEase = gsap.parseEase("power1.in");
const splitEase = gsap.parseEase("power2.out");
const collectEase = gsap.parseEase("power3.inOut");
const liftEase = gsap.parseEase("sine.inOut");
const scaleEase = gsap.parseEase("sine.inOut");

function readNumber(value, fallback) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value, start, end) {
  return clampUnit((value - start) / (end - start || 1));
}

function interpolate(from, to, progress) {
  return from + (to - from) * progress;
}

function getSegmentVariant(index) {
  return SEGMENT_VARIANTS[index % SEGMENT_VARIANTS.length];
}

export function mountAwfulHead(containerId = "awfulhead", { eyeStrength = 1, fallOnScroll = false } = {}) {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.awfulHeadMounted === "true") {
    return;
  }

  container.dataset.awfulHeadMounted = "true";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "400");
  svg.setAttribute("height", "400");
  svg.setAttribute("viewBox", "-200 -200 400 400");
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
    part.setAttribute("data-awfulhead-part", "");
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
    transformOrigin: "50% 50%",
  });

  const setSvgX = gsap.quickSetter(svg, "x", "px");
  const setSvgY = gsap.quickSetter(svg, "y", "px");
  const setSvgScale = gsap.quickSetter(svg, "scale");
  const partSetters = headParts.map((part) => ({
    x: gsap.quickSetter(part, "x", "px"),
    y: gsap.quickSetter(part, "y", "px"),
    rotation: gsap.quickSetter(part, "rotation", "deg"),
    scale: gsap.quickSetter(part, "scale"),
  }));

  const leftBase = { x: -62, y: -8 };
  const rightBase = { x: 26, y: -24 };
  let isEyeTrackingActive = true;
  let isHeadVisible = true;
  let routeProgress = 0;
  let routePointMap = new Map();

  function resetEyes() {
    leftEye.setAttribute("cx", leftBase.x);
    leftEye.setAttribute("cy", leftBase.y);
    rightEye.setAttribute("cx", rightBase.x);
    rightEye.setAttribute("cy", rightBase.y);
  }

  function trackEyes(event) {
    if (!isEyeTrackingActive || !isHeadVisible) {
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
    if (isEyeTrackingActive) {
      return;
    }

    isEyeTrackingActive = true;
  }

  function getHeadSize() {
    const size = Number.parseFloat(getComputedStyle(svg).width);
    return Number.isFinite(size) && size > 0 ? size : 180;
  }

  function getDocumentTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function getFocusScrolls() {
    const hero = document.querySelector(HERO_ROUTE.triggerSelector) ?? container.closest(".hero") ?? container;
    const cover = hero.querySelector(".hero__screen--cover") ?? hero;
    const about = document.getElementById("hero-about") ?? hero;

    return {
      cover: getDocumentTop(cover),
      about: getDocumentTop(about),
    };
  }

  function resolvePoint(point, focusScrolls) {
    const isCompact = window.matchMedia("(max-width: 68rem)").matches;
    const pointSettings = isCompact && point.mobile ? { ...point, ...point.mobile } : point;
    const target = document.querySelector(pointSettings.selector);
    const dataset = target?.dataset ?? {};

    const fallbackX = readNumber(dataset.awfulheadAnchorX, 0.5);
    const fallbackY = readNumber(dataset.awfulheadAnchorY, 0.5);
    const fallbackOffsetX = readNumber(dataset.awfulheadOffsetX, 0);
    const fallbackOffsetY = readNumber(dataset.awfulheadOffsetY, 0);
    const fallbackScale = readNumber(dataset.awfulheadScale, 1);
    const x = readNumber(pointSettings.x, fallbackX);
    const y = readNumber(pointSettings.y, fallbackY);
    const offsetX = readNumber(pointSettings.offsetX, fallbackOffsetX);
    const offsetY = readNumber(pointSettings.offsetY, fallbackOffsetY);
    const scale = readNumber(pointSettings.scale, fallbackScale);

    if (!target) {
      return {
        id: pointSettings.id,
        progress: pointSettings.progress,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.42,
        scale,
      };
    }

    const rect = target.getBoundingClientRect();
    const documentLeft = rect.left + window.scrollX;
    const documentTop = rect.top + window.scrollY;
    const headSize = getHeadSize();
    const focusScroll = focusScrolls[pointSettings.focus] ?? focusScrolls.cover;

    return {
      id: pointSettings.id,
      progress: pointSettings.progress,
      x: documentLeft - window.scrollX + rect.width * x + headSize * offsetX,
      y: documentTop - focusScroll + rect.height * y + headSize * offsetY,
      scale,
    };
  }

  function refreshRoutePoints() {
    const focusScrolls = getFocusScrolls();
    routePointMap = new Map(ROUTE_STOPS.map((point) => [point.id, resolvePoint(point, focusScrolls)]));
  }

  function getRoutePoint(stop) {
    return (
      routePointMap.get(stop.id) ?? {
        id: stop.id,
        progress: stop.progress,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.42,
        scale: 1,
      }
    );
  }

  function getRouteFrame(progress) {
    const clampedProgress = clampProgress(progress);
    const firstStop = ROUTE_STOPS[0];
    const lastStop = ROUTE_STOPS[ROUTE_STOPS.length - 1];

    if (clampedProgress <= firstStop.progress) {
      const point = getRoutePoint(firstStop);
      return {
        segmentIndex: 0,
        variant: getSegmentVariant(0),
        localProgress: 0,
        position: point,
      };
    }

    if (clampedProgress >= lastStop.progress) {
      const point = getRoutePoint(lastStop);
      return {
        segmentIndex: ROUTE_STOPS.length - 2,
        variant: getSegmentVariant(ROUTE_STOPS.length - 2),
        localProgress: 1,
        position: point,
      };
    }

    const segmentIndex = ROUTE_STOPS.findIndex((stop, index) => {
      const nextStop = ROUTE_STOPS[index + 1];
      return nextStop && clampedProgress >= stop.progress && clampedProgress <= nextStop.progress;
    });
    const safeSegmentIndex = Math.max(0, segmentIndex);
    const from = getRoutePoint(ROUTE_STOPS[safeSegmentIndex]);
    const to = getRoutePoint(ROUTE_STOPS[safeSegmentIndex + 1]);
    const localProgress = normalize(clampedProgress, from.progress, to.progress);
    const easedProgress = routeEase(localProgress);

    return {
      segmentIndex: safeSegmentIndex,
      variant: getSegmentVariant(safeSegmentIndex),
      localProgress,
      position: {
        x: interpolate(from.x, to.x, easedProgress),
        y: interpolate(from.y, to.y, easedProgress),
        scale: interpolate(from.scale, to.scale, scaleEase(localProgress)),
      },
    };
  }

  function getNearestStopProgress(progress) {
    const frame = getRouteFrame(progress);
    const fromStop = ROUTE_STOPS[frame.segmentIndex];
    const toStop = ROUTE_STOPS[frame.segmentIndex + 1] ?? fromStop;

    return frame.localProgress < 0.5 ? fromStop.progress : toStop.progress;
  }

  function getViewportExitX(index, segmentIndex) {
    const side = (index + segmentIndex) % 2 === 0 ? -1 : 1;
    const viewportInSvgUnits = (window.innerWidth / getHeadSize()) * 420;
    return side * (Math.max(900, viewportInSvgUnits) + index * 120);
  }

  function getScatterTarget(variant, index, segmentIndex) {
    if (variant === "exit-fall") {
      const stack = FALL_STACK[index];
      const viewportFall = (window.innerHeight / getHeadSize()) * 430;

      return {
        x: stack.x * 0.72,
        y: viewportFall + 360 + index * 54,
        rotation: stack.rotation * 2.3,
      };
    }

    if (variant === "split") {
      const drift = SPLIT_DRIFT[index];
      return {
        x: getViewportExitX(index, segmentIndex),
        y: drift.y + (segmentIndex % 2 === 0 ? -40 : 40),
        rotation: drift.rotation,
      };
    }

    const stack = FALL_STACK[index];
    const segmentShift = segmentIndex % 2 === 0 ? -24 : 24;
    return {
      x: stack.x + segmentShift,
      y: stack.y,
      rotation: stack.rotation,
    };
  }

  function getSplitTransform(localProgress, target, index) {
    const breakProgress = splitEase(normalize(localProgress, index * 0.018, 0.5 + index * 0.012));
    const collectProgress = collectEase(normalize(localProgress, 0.44 + index * 0.014, 1));
    const amount = localProgress < 0.5 ? breakProgress : 1 - collectProgress;

    return {
      x: target.x * amount,
      y: target.y * amount,
      rotation: target.rotation * amount,
      scale: 1,
      amount,
    };
  }

  function getFallTransform(localProgress, target, index) {
    const breakProgress = fallEase(normalize(localProgress, index * 0.018, 0.52 + index * 0.012));
    const collectProgress = collectEase(normalize(localProgress, 0.44 + index * 0.018, 1));
    const liftProgress = liftEase(normalize(collectProgress, 0.64, 1));

    if (localProgress < 0.5) {
      return {
        x: target.x * breakProgress,
        y: target.y * breakProgress,
        rotation: target.rotation * breakProgress,
        scale: 1,
        amount: breakProgress,
      };
    }

    return {
      x: target.x * (1 - collectProgress),
      y: target.y * (1 - liftProgress),
      rotation: target.rotation * (1 - collectProgress),
      scale: 1,
      amount: Math.max(1 - collectProgress, 1 - liftProgress),
    };
  }

  function getExitFallTransform(localProgress, target, index) {
    const fallProgress = fallEase(normalize(localProgress, index * 0.025, 1));
    const driftProgress = splitEase(normalize(localProgress, 0.16 + index * 0.012, 1));

    return {
      x: target.x * driftProgress,
      y: target.y * fallProgress,
      rotation: target.rotation * fallProgress,
      scale: 1,
      amount: fallProgress,
    };
  }

  function getPartTransform(frame, index) {
    const target = getScatterTarget(frame.variant, index, frame.segmentIndex);

    if (frame.variant === "exit-fall") {
      return getExitFallTransform(frame.localProgress, target, index);
    }

    if (frame.variant === "split") {
      return getSplitTransform(frame.localProgress, target, index);
    }

    return getFallTransform(frame.localProgress, target, index);
  }

  function setHeadPosition(position) {
    setSvgX(position.x);
    setSvgY(position.y);
    setSvgScale(position.scale);
  }

  function setHeadParts(frame) {
    let maxScatterAmount = 0;

    headParts.forEach((_, index) => {
      const transform = getPartTransform(frame, index);
      const setters = partSetters[index];

      setters.x(transform.x);
      setters.y(transform.y);
      setters.rotation(transform.rotation);
      setters.scale(transform.scale);
      maxScatterAmount = Math.max(maxScatterAmount, transform.amount);
    });

    if (maxScatterAmount > 0.035) {
      stopEyeTracking();
      return;
    }

    startEyeTracking();
  }

  function renderRouteProgress(progress) {
    routeProgress = clampProgress(progress);

    if (!isHeadVisible) {
      return;
    }

    const frame = getRouteFrame(routeProgress);
    setHeadPosition(frame.position);
    setHeadParts(frame);
  }

  function showHead() {
    if (isHeadVisible) {
      return;
    }

    isHeadVisible = true;
    container.style.visibility = "visible";
  }

  function hideHead() {
    if (!isHeadVisible) {
      return;
    }

    isHeadVisible = false;
    container.style.visibility = "hidden";
    stopEyeTracking();
  }

  function setupScrollRoute() {
    const trigger = document.querySelector(HERO_ROUTE.triggerSelector) ?? container.closest(".hero") ?? container;
    let settleTween;
    const settleDelay = gsap.delayedCall(0.12, settleToNearestStop).pause();

    function isTriggerVisible() {
      const rect = trigger.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    function stopSettling() {
      settleDelay.pause(0);
      settleTween?.kill();
      settleTween = null;
    }

    function settleToNearestStop() {
      if (!isHeadVisible) {
        return;
      }

      const targetProgress = getNearestStopProgress(routeProgress);

      if (Math.abs(targetProgress - routeProgress) < 0.001) {
        renderRouteProgress(targetProgress);
        return;
      }

      settleTween = gsap.to(
        { progress: routeProgress },
        {
          progress: targetProgress,
          duration: 0.28,
          ease: "power2.out",
          overwrite: true,
          onUpdate() {
            renderRouteProgress(this.targets()[0].progress);
          },
          onComplete() {
            settleTween = null;
          },
        },
      );
    }

    function scheduleSettling() {
      settleDelay.restart(true);
    }

    function syncHeadWithScroll(self) {
      stopSettling();
      routeProgress = clampProgress(self.progress);

      if (!isTriggerVisible()) {
        hideHead();
        return;
      }

      showHead();
      renderRouteProgress(routeProgress);
      scheduleSettling();
    }

    const routeTrigger = ScrollTrigger.create({
      trigger,
      start: HERO_ROUTE.start,
      end: HERO_ROUTE.end,
      invalidateOnRefresh: true,
      onEnter: syncHeadWithScroll,
      onEnterBack: syncHeadWithScroll,
      onUpdate: syncHeadWithScroll,
      onLeave: () => {
        stopSettling();
        routeProgress = 1;
        hideHead();
      },
      onLeaveBack: syncHeadWithScroll,
      onRefresh: (self) => {
        refreshRoutePoints();
        syncHeadWithScroll(self);
      },
    });

    syncHeadWithScroll(routeTrigger);
  }

  function refreshPosition() {
    refreshRoutePoints();

    if (isHeadVisible) {
      renderRouteProgress(routeProgress);
    }
  }

  document.addEventListener("mousemove", trackEyes);
  window.addEventListener("resize", refreshPosition);

  refreshRoutePoints();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      refreshRoutePoints();
      ScrollTrigger.refresh();
    });
  }

  if (fallOnScroll) {
    hideHead();
    setupScrollRoute();
  } else {
    renderRouteProgress(0);
  }
}
