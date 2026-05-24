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
    progress: 0.0,

    anchorX: 0.26,
    anchorY: 0,

    moveX: -450,
    moveY: -250,

    scale: 1,
  },
  {
    id: "title-role",
    selector: ".hero__title-role",
    focus: "cover",
    progress: 0.16,

    anchorX: 0.78,
    anchorY: 0.12,

    moveX: -8,
    moveY: -56,

    scale: 0.82,
  },
  {
    id: "hero-note",
    selector: ".hero__note",
    focus: "cover",
    progress: 0.32,

    anchorX: 0.18,
    anchorY: 0,

    moveX: 0,
    moveY: -84,

    scale: 0.72,

    mobile: {
      anchorX: 0.18,
      anchorY: 0,
      moveX: 0,
      moveY: -80,
      scale: 0.72,
    },
  },
  {
    id: "contacts",
    selector: ".contact-links",
    focus: "cover",
    progress: 0.48,

    anchorX: 0.74,
    anchorY: 0,

    moveX: 0,
    moveY: -84,

    scale: 0.72,

    mobile: {
      anchorX: 0.22,
      anchorY: 0,
      moveX: 0,
      moveY: -76,
      scale: 0.72,
    },
  },
  {
    id: "about-anchor",
    selector: '[data-awfulhead-anchor="hero-about"]',
    focus: "about",
    progress: 0.64,

    anchorX: 0.22,
    anchorY: 0,

    moveX: 0,
    moveY: -56,

    scale: 0.82,
  },
  {
    id: "about-middle",
    selector: ".hero__intro",
    focus: "about",
    progress: 0.79,

    anchorX: 0.44,
    anchorY: 0.32,

    moveX: 0,
    moveY: -36,

    scale: 0.72,
  },
  {
    id: "about-end",
    selector: ".hero__intro",
    focus: "about",
    progress: 0.91,

    anchorX: 0.7,
    anchorY: 0.66,

    moveX: 0,
    moveY: -16,

    scale: 0.68,

    mobile: {
      anchorX: 0.34,
      anchorY: 0.8,
      moveX: 0,
      moveY: -16,
      scale: 0.68,
    },
  },
  {
    id: "hero-exit",
    selector: ".hero__intro",
    focus: "about",
    progress: 1,

    anchorX: 0.82,
    anchorY: 0.9,

    moveX: 0,
    moveY: 36,

    scale: 0.66,

    mobile: {
      anchorX: 0.5,
      anchorY: 0.92,
      moveX: 0,
      moveY: 16,
      scale: 0.66,
    },
  },
];

const SEGMENT_VARIANTS = ["split", "fall", "split", "fall", "split", "fall", "exit-fall"];

const FALL_STACK = [
  { x: -58, y: 112, rotation: -16 },
  { x: -22, y: 144, rotation: 12 },
  { x: 54, y: 106, rotation: 18 },
  { x: 16, y: 132, rotation: -10 },
  { x: -46, y: 162, rotation: 14 },
  { x: 72, y: 150, rotation: -18 },
];

const SPLIT_DRIFT = [
  { x: -84, y: -56, rotation: -24 },
  { x: 76, y: -68, rotation: 22 },
  { x: -92, y: 12, rotation: 32 },
  { x: 88, y: 34, rotation: -30 },
  { x: -56, y: 82, rotation: 18 },
  { x: 72, y: 92, rotation: -24 },
];

const clampProgress = gsap.utils.clamp(0, 1);
const clampUnit = gsap.utils.clamp(0, 1);

const routeEase = gsap.parseEase("sine.inOut");
const splitEase = gsap.parseEase("power2.out");
const fallEase = gsap.parseEase("power1.in");
const collectEase = "power3.out";
const scaleEase = gsap.parseEase("sine.inOut");

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
    transformBox: "fill-box",
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
  let isScrollActive = false;
  let routeProgress = 0;
  let routePointMap = new Map();
  let collectTween = null;

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

    const anchorX = pointSettings.anchorX;
    const anchorY = pointSettings.anchorY;
    const moveX = pointSettings.moveX;
    const moveY = pointSettings.moveY;
    const scale = pointSettings.scale;

    if (!target) {
      return {
        id: pointSettings.id,
        progress: pointSettings.progress,
        x: window.innerWidth * 0.5 + moveX,
        y: window.innerHeight * 0.42 + moveY,
        scale,
      };
    }

    const rect = target.getBoundingClientRect();
    const documentLeft = rect.left + window.scrollX;
    const documentTop = rect.top + window.scrollY;
    const focusScroll = focusScrolls[pointSettings.focus] ?? focusScrolls.cover;

    return {
      id: pointSettings.id,
      progress: pointSettings.progress,

      x: documentLeft - window.scrollX + rect.width * anchorX + moveX,
      y: documentTop - focusScroll + rect.height * anchorY + moveY,

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

  function getScatterTarget(variant, index, segmentIndex) {
    if (variant === "exit-fall") {
      const stack = FALL_STACK[index];
      const viewportFall = (window.innerHeight / getHeadSize()) * 430;

      return {
        x: stack.x * 0.85,
        y: viewportFall + 280 + index * 42,
        rotation: stack.rotation * 2.4,
      };
    }

    if (variant === "split") {
      const drift = SPLIT_DRIFT[index];
      const sideShift = segmentIndex % 2 === 0 ? -8 : 8;

      return {
        x: drift.x + sideShift,
        y: drift.y,
        rotation: drift.rotation,
      };
    }

    const stack = FALL_STACK[index];
    const sideShift = segmentIndex % 2 === 0 ? -10 : 10;

    return {
      x: stack.x + sideShift,
      y: stack.y,
      rotation: stack.rotation,
    };
  }

  function getScatterAmount(localProgress, index) {
    const stagger = index * 0.015;
    const progress = normalize(localProgress, stagger, 1);
    const bell = Math.sin(progress * Math.PI);

    return splitEase(Math.max(0, bell));
  }

  function getExitFallTransform(localProgress, target, index) {
    const fallProgress = fallEase(normalize(localProgress, index * 0.025, 1));
    const driftProgress = splitEase(normalize(localProgress, 0.12 + index * 0.012, 1));

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

    const amount = getScatterAmount(frame.localProgress, index);

    return {
      x: target.x * amount,
      y: target.y * amount,
      rotation: target.rotation * amount,
      scale: 1,
      amount,
    };
  }

  function setHeadPosition(position) {
    setSvgX(position.x);
    setSvgY(position.y);
    setSvgScale(position.scale);
  }

  function stopCollectingHeadParts() {
    collectTween?.kill();
    collectTween = null;
  }

  function collectHeadParts() {
    stopCollectingHeadParts();

    isScrollActive = false;

    collectTween = gsap.to(headParts, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: 0.34,
      ease: collectEase,
      overwrite: "auto",
      stagger: {
        each: 0.012,
        from: "center",
      },
      onStart() {
        stopEyeTracking();
      },
      onComplete() {
        collectTween = null;
        startEyeTracking();
      },
    });
  }

  function setHeadParts(frame) {
    if (fallOnScroll && !isScrollActive) {
      partSetters.forEach((setters) => {
        setters.x(0);
        setters.y(0);
        setters.rotation(0);
        setters.scale(1);
      });

      startEyeTracking();
      return;
    }

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
    startEyeTracking();
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
    const collectDelay = gsap.delayedCall(0.14, collectHeadParts).pause();

    function isTriggerVisible() {
      const rect = trigger.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    function stopIdleCollectDelay() {
      collectDelay.pause(0);
    }

    function scheduleCollecting() {
      collectDelay.restart(true);
    }

    function syncHeadWithScroll(self) {
      stopIdleCollectDelay();
      stopCollectingHeadParts();

      isScrollActive = true;
      routeProgress = clampProgress(self.progress);

      if (!isTriggerVisible()) {
        hideHead();
        return;
      }

      showHead();
      renderRouteProgress(routeProgress);
      scheduleCollecting();
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
        stopIdleCollectDelay();
        stopCollectingHeadParts();

        isScrollActive = true;
        routeProgress = 1;

        showHead();
        renderRouteProgress(1);
        collectHeadParts();
        hideHead();
      },

      onLeaveBack: () => {
        stopIdleCollectDelay();
        stopCollectingHeadParts();

        isScrollActive = false;
        routeProgress = 0;

        showHead();
        renderRouteProgress(0);
        collectHeadParts();
      },

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
    setupScrollRoute();
  } else {
    renderRouteProgress(0);
  }
}
