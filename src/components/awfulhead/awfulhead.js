import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FREE_FALL_DISTANCE_VH = 1.15;
const FREE_FALL_DURATION = 0.72;
const IDLE_PARK_DELAY = 0.1;

const ROUTE_RANGE = {
  startSelectors: [".hero", "#lead", "#cv"],
  endSelectors: ["#cv", "#lead", ".hero"],
  start: "top top",
  end: "bottom top",
};

const ROUTE_STOPS = [
  {
    id: "hero-name-start",
    requiredSelectors: [".hero__title-name", ".hero"],
    selector: ".hero__title-name",
    selectorFallbacks: [".hero"],
    focusSelector: ".hero__screen--cover",
    focusFallbacks: [".hero"],
    scrollRatio: 0.04,
    anchorX: 0,
    anchorY: 0.16,
    moveXByHead: -0.46,
    moveYByHead: -0.12,
    scale: 0.94,
    variant: "split",
    mobile: {
      anchorY: 0.18,
      moveXByHead: -0.34,
      moveYByHead: -0.02,
      scale: 0.8,
    },
  },
  {
    id: "hero-role",
    requiredSelectors: [".hero__title-role", ".hero__title-name", ".hero"],
    selector: ".hero__title-role",
    selectorFallbacks: [".hero__title-name", ".hero"],
    focusSelector: ".hero__screen--cover",
    focusFallbacks: [".hero"],
    scrollRatio: 0.2,
    anchorX: 1,
    anchorY: 0.22,
    moveXByHead: 0.34,
    moveYByHead: -0.14,
    scale: 0.8,
    variant: "fall",
    mobile: {
      anchorX: 0,
      anchorY: 1,
      moveXByHead: -0.12,
      moveYByHead: -0.08,
      scale: 0.72,
    },
  },
  {
    id: "hero-note",
    requiredSelectors: [".hero__note", ".hero"],
    selector: ".hero__note",
    selectorFallbacks: [".hero"],
    focusSelector: ".hero__screen--cover",
    focusFallbacks: [".hero"],
    scrollRatio: 0.42,
    anchorX: 0,
    anchorY: 0.22,
    moveXByHead: -0.36,
    moveYByHead: -0.12,
    scale: 0.72,
    variant: "split",
    mobile: {
      anchorX: 0,
      anchorY: 1,
      moveXByHead: -0.12,
      moveYByHead: -0.08,
      scale: 0.68,
    },
  },
  {
    id: "hero-contacts",
    requiredSelectors: [".contact-links", ".hero"],
    selector: ".contact-links",
    selectorFallbacks: [".hero"],
    focusSelector: ".hero__screen--cover",
    focusFallbacks: [".hero"],
    scrollRatio: 0.62,
    anchorX: 1,
    anchorY: 0.24,
    moveXByHead: 0.3,
    moveYByHead: -0.1,
    scale: 0.7,
    variant: "fall",
    mobile: {
      anchorX: 1,
      anchorY: 0,
      moveXByHead: 0,
      moveYByHead: 0.08,
      scale: 0.64,
    },
  },
  {
    id: "lead-sticky-top",
    requiredSelectors: ["#lead", ".lead__intro"],
    focusSelector: "#lead",
    focusFallbacks: [".lead__intro"],
    scrollRatio: 0.14,
    viewportX: 0.08,
    viewportY: 0.36,
    scale: 0.72,
    variant: "hold",
    mobile: {
      viewportX: 0.86,
      viewportY: 0.18,
      scale: 0.64,
    },
  },
  {
    id: "lead-sticky-bottom",
    requiredSelectors: ["#lead", ".lead__intro"],
    focusSelector: "#lead",
    focusFallbacks: [".lead__intro"],
    scrollRatio: 0.88,
    viewportX: 0.08,
    viewportY: 0.62,
    scale: 0.72,
    variant: "hold",
    mobile: {
      viewportX: 0.86,
      viewportY: 0.82,
      scale: 0.64,
    },
  },
  {
    id: "cv-corner-enter",
    requiredSelectors: ["#cv"],
    focusSelector: "#cv",
    focusFallbacks: ["main", ".site-main"],
    scrollRatio: 0.04,
    viewportX: 0.86,
    viewportY: 0.16,
    scale: 0.62,
    variant: "hold",
    mobile: {
      viewportX: 0.82,
      viewportY: 0.14,
      scale: 0.6,
    },
  },
  {
    id: "cv-corner-hold",
    requiredSelectors: ["#cv"],
    focusSelector: "#cv",
    focusFallbacks: ["main", ".site-main"],
    scrollRatio: 0.82,
    viewportX: 0.86,
    viewportY: 0.16,
    scale: 0.62,
    variant: "hold",
    mobile: {
      viewportX: 0.82,
      viewportY: 0.14,
      scale: 0.6,
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

function clampBetween(value, min, max) {
  if (min > max) {
    return (min + max) * 0.5;
  }

  return Math.max(min, Math.min(max, value));
}

function getSegmentVariant(index) {
  return SEGMENT_VARIANTS[index % SEGMENT_VARIANTS.length];
}

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
  container.style.visibility = "visible";

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
  let isFreeFallActive = false;
  let routeProgress = 0;
  let routePoints = [];
  let collectTween = null;
  let freeFallTween = null;

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

  function clampHeadPosition(position) {
    const scale = position.scale ?? 1;
    const radius = (getHeadSize() * scale) / 2;
    const margin = window.matchMedia("(max-width: 48rem)").matches ? 10 : 18;

    return {
      ...position,
      scale,
      x: clampBetween(position.x, radius + margin, window.innerWidth - radius - margin),
      y: clampBetween(position.y, radius + margin, window.innerHeight - radius - margin),
    };
  }

  function getDocumentTop(element) {
    return element.getBoundingClientRect().top + window.scrollY;
  }

  function getRequiredSelectors(point) {
    const selectors = point.requiredSelectors
      ? asArray(point.requiredSelectors)
      : [point.selector, ...asArray(point.selectorFallbacks), point.focusSelector, ...asArray(point.focusFallbacks)];

    return selectors.filter(Boolean);
  }

  function canUsePoint(point) {
    const requiredSelectors = getRequiredSelectors(point);

    if (!requiredSelectors.length) {
      return true;
    }

    return Boolean(getFirstExistingElement(requiredSelectors));
  }

  function buildRouteStops() {
    const stops = ROUTE_STOPS.filter(canUsePoint);

    if (stops.length) {
      return stops;
    }

    return [
      {
        id: "awfulhead-floating-fallback",
        viewportX: 0.5,
        viewportY: 0.34,
        scale: 0.82,
        variant: "hold",
      },
    ];
  }

  function getResponsivePointSettings(point) {
    const isCompact = window.matchMedia("(max-width: 68rem)").matches;
    return isCompact && point.mobile ? { ...point, ...point.mobile } : point;
  }

  function getAvailableRouteAnchors() {
    const anchors = [
      getFirstExistingElement(ROUTE_RANGE.startSelectors),
      getFirstExistingElement(["#lead", ".lead__intro"]),
      getFirstExistingElement(["#cv"]),
      container.closest(".hero, section"),
      container.parentElement,
    ].filter(Boolean);

    return anchors
      .filter((element, index, list) => list.indexOf(element) === index)
      .sort((left, right) => getDocumentTop(left) - getDocumentTop(right));
  }

  function getRouteMetrics() {
    const anchors = getAvailableRouteAnchors();
    const startElement = anchors[0] ?? container.parentElement ?? container;
    const endElement =
      getFirstExistingElement(ROUTE_RANGE.endSelectors, anchors[anchors.length - 1] ?? startElement) ?? startElement;
    const startTop = getDocumentTop(startElement);
    const endHeight = Math.max(endElement.getBoundingClientRect().height, window.innerHeight * 0.6);
    const endTop = getDocumentTop(endElement) + endHeight;

    return {
      startElement,
      endElement,
      startTop,
      endTop: Math.max(startTop + 1, endTop),
    };
  }

  function resolvePoint(point, routeMetrics) {
    const pointSettings = getResponsivePointSettings(point);
    const target = getFirstExistingElement([pointSettings.selector, ...asArray(pointSettings.selectorFallbacks)], null);
    const focusElement = getFirstExistingElement(
      [pointSettings.focusSelector, ...asArray(pointSettings.focusFallbacks)],
      target ?? routeMetrics.startElement,
    );

    const focusTop = getDocumentTop(focusElement);
    const focusHeight = Math.max(focusElement.getBoundingClientRect().height, 1);
    const rawScroll =
      focusTop +
      focusHeight * (pointSettings.scrollRatio ?? 0) +
      window.innerHeight * (pointSettings.scrollOffsetVh ?? 0) +
      (pointSettings.scrollOffset ?? 0);

    const stopScroll = Math.min(routeMetrics.endTop, Math.max(routeMetrics.startTop, rawScroll));

    const moveX = pointSettings.moveX ?? getHeadSize() * (pointSettings.moveXByHead ?? 0);
    const moveY = pointSettings.moveY ?? getHeadSize() * (pointSettings.moveYByHead ?? 0);

    let x = window.innerWidth * 0.5 + moveX;
    let y = window.innerHeight * 0.42 + moveY;

    if (typeof pointSettings.viewportX === "number") {
      x = window.innerWidth * pointSettings.viewportX + moveX;
    } else if (target) {
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width * (pointSettings.anchorX ?? 0.5) + moveX;
    }

    if (typeof pointSettings.viewportY === "number") {
      y = window.innerHeight * pointSettings.viewportY + moveY;
    } else if (target) {
      const rect = target.getBoundingClientRect();
      y = rect.top + window.scrollY - stopScroll + rect.height * (pointSettings.anchorY ?? 0.5) + moveY;
    }

    return {
      id: pointSettings.id,
      progress: normalize(stopScroll, routeMetrics.startTop, routeMetrics.endTop),
      x,
      y,
      scale: pointSettings.scale ?? 1,
      variant: pointSettings.variant ?? "split",
    };
  }

  function refreshRoutePoints() {
    const routeMetrics = getRouteMetrics();

    routePoints = buildRouteStops()
      .map((point) => resolvePoint(point, routeMetrics))
      .filter(Boolean)
      .sort((left, right) => left.progress - right.progress);
  }

  function getRouteFrame(progress) {
    const clampedProgress = clampProgress(progress);
    const defaultPoint = {
      id: "route-default",
      progress: 0,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.42,
      scale: 1,
      variant: "split",
    };

    const firstStop = routePoints[0] ?? defaultPoint;
    const lastStop = routePoints[routePoints.length - 1] ?? firstStop;

    if (routePoints.length < 2 || clampedProgress <= firstStop.progress) {
      return {
        segmentIndex: 0,
        variant: firstStop.variant ?? getSegmentVariant(0),
        localProgress: 0,
        position: firstStop,
      };
    }

    if (clampedProgress >= lastStop.progress) {
      return {
        segmentIndex: Math.max(0, routePoints.length - 2),
        variant: lastStop.variant ?? getSegmentVariant(Math.max(0, routePoints.length - 2)),
        localProgress: 1,
        position: lastStop,
      };
    }

    for (let index = 0; index < routePoints.length - 1; index += 1) {
      const from = routePoints[index];
      const to = routePoints[index + 1];

      if (clampedProgress <= to.progress) {
        const localProgress = normalize(clampedProgress, from.progress, to.progress);
        const easedProgress = routeEase(localProgress);

        return {
          segmentIndex: index,
          variant: to.variant ?? from.variant ?? getSegmentVariant(index),
          localProgress,
          position: {
            x: interpolate(from.x, to.x, easedProgress),
            y: interpolate(from.y, to.y, easedProgress),
            scale: interpolate(from.scale, to.scale, scaleEase(localProgress)),
          },
        };
      }
    }

    return {
      segmentIndex: Math.max(0, routePoints.length - 2),
      variant: lastStop.variant ?? "exit-fall",
      localProgress: 1,
      position: lastStop,
    };
  }

  function getScatterTarget(variant, index, segmentIndex) {
    if (variant === "hold") {
      return {
        x: 0,
        y: 0,
        rotation: 0,
      };
    }

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
    if (frame.variant === "hold") {
      return {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        amount: 0,
      };
    }

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

  function setHeadPosition(position, { keepInViewport = true } = {}) {
    const safePosition = keepInViewport ? clampHeadPosition(position) : position;

    setSvgX(safePosition.x);
    setSvgY(safePosition.y);
    setSvgScale(safePosition.scale);
  }

  function stopCollectingHeadParts() {
    collectTween?.kill();
    collectTween = null;
  }

  function stopFreeFall() {
    freeFallTween?.kill();
    freeFallTween = null;
    isFreeFallActive = false;
  }

  function getSafeLeadParkingPosition() {
    const leadText = document.querySelector(".lead__intro");
    const isCompact = window.matchMedia("(max-width: 48rem)").matches;
    const fallback = {
      x: window.innerWidth * (isCompact ? 0.84 : 0.08),
      y: window.innerHeight * (isCompact ? 0.18 : 0.5),
      scale: isCompact ? 0.64 : 0.72,
    };

    if (!(leadText instanceof HTMLElement)) {
      return clampHeadPosition(fallback);
    }

    const rect = leadText.getBoundingClientRect();
    const scale = isCompact ? 0.64 : 0.72;
    const headRadius = (getHeadSize() * scale) / 2;
    const sideGap = headRadius + 24;
    const hasLeftParking = rect.left > sideGap * 1.15;
    const hasRightParking = window.innerWidth - rect.right > sideGap * 1.15;

    if (hasLeftParking) {
      return clampHeadPosition({
        x: rect.left - sideGap,
        y: clampBetween(rect.top + rect.height * 0.5, window.innerHeight * 0.18, window.innerHeight * 0.82),
        scale,
      });
    }

    if (hasRightParking) {
      return clampHeadPosition({
        x: rect.right + sideGap,
        y: clampBetween(rect.top + rect.height * 0.5, window.innerHeight * 0.18, window.innerHeight * 0.82),
        scale,
      });
    }

    return clampHeadPosition(fallback);
  }

  function getSafeHeroParkingPosition() {
    const isCompact = window.matchMedia("(max-width: 48rem)").matches;

    return clampHeadPosition({
      x: window.innerWidth * (isCompact ? 0.82 : 0.24),
      y: window.innerHeight * (isCompact ? 0.14 : 0.16),
      scale: isCompact ? 0.66 : 0.82,
    });
  }

  function getIdleParkingPosition() {
    const lead = document.getElementById("lead");
    const cv = document.getElementById("cv");

    if (cv instanceof HTMLElement) {
      const cvRect = cv.getBoundingClientRect();
      if (cvRect.top <= window.innerHeight * 0.58 && cvRect.bottom >= window.innerHeight * 0.18) {
        return clampHeadPosition(getRouteFrame(routeProgress).position);
      }
    }

    if (lead instanceof HTMLElement) {
      const leadRect = lead.getBoundingClientRect();
      if (leadRect.top <= window.innerHeight * 0.72 && leadRect.bottom >= window.innerHeight * 0.18) {
        return getSafeLeadParkingPosition();
      }
    }

    return getSafeHeroParkingPosition();
  }

  function collectHeadParts() {
    stopCollectingHeadParts();

    isScrollActive = false;
    isFreeFallActive = false;

    const parkingPosition = getIdleParkingPosition();

    collectTween = gsap.timeline({
      onStart() {
        stopEyeTracking();
      },
      onComplete() {
        collectTween = null;
        startEyeTracking();
      },
    });

    collectTween
      .to(
        svg,
        {
          x: parkingPosition.x,
          y: parkingPosition.y,
          scale: parkingPosition.scale,
          duration: 0.34,
          ease: collectEase,
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
          duration: 0.34,
          ease: collectEase,
          overwrite: "auto",
          stagger: {
            each: 0.012,
            from: "center",
          },
        },
        0,
      );
  }

  function setHeadParts(frame) {
    if (fallOnScroll && !isScrollActive && !isFreeFallActive) {
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

  function renderFreeFall(progress, basePosition) {
    const easedProgress = fallEase(progress);

    setHeadPosition(
      {
        x: basePosition.x,
        y: basePosition.y + window.innerHeight * FREE_FALL_DISTANCE_VH * easedProgress,
        scale: interpolate(basePosition.scale, basePosition.scale * 0.92, progress),
      },
      {
        keepInViewport: window.matchMedia("(max-width: 48rem)").matches,
      },
    );

    setHeadParts({
      variant: "exit-fall",
      segmentIndex: Math.max(0, routePoints.length - 1),
      localProgress: progress,
    });
  }

  function playFreeFall() {
    stopFreeFall();

    const basePosition = { ...getRouteFrame(routeProgress).position };
    const state = { progress: 0 };

    isScrollActive = false;
    isFreeFallActive = true;
    stopEyeTracking();
    stopCollectingHeadParts();

    freeFallTween = gsap.to(state, {
      progress: 1,
      duration: FREE_FALL_DURATION,
      ease: "power2.in",
      overwrite: "auto",
      onUpdate: () => {
        renderFreeFall(state.progress, basePosition);
      },
      onComplete: () => {
        freeFallTween = null;
      },
    });
  }

  function showHead() {
    if (isHeadVisible) {
      return;
    }

    isHeadVisible = true;
    container.style.visibility = "visible";
    startEyeTracking();
  }

  function setupScrollRoute() {
    const routeMetrics = getRouteMetrics();
    const trigger = routeMetrics.startElement;
    const endTrigger = routeMetrics.endElement;
    const collectDelay = gsap.delayedCall(IDLE_PARK_DELAY, collectHeadParts).pause();

    function stopIdleCollectDelay() {
      collectDelay.pause(0);
    }

    function scheduleCollecting() {
      if (routeProgress >= 0.98 || freeFallTween) {
        return;
      }

      collectDelay.restart(true);
    }

    function syncHeadWithScroll(self) {
      stopIdleCollectDelay();
      stopCollectingHeadParts();
      stopFreeFall();

      isScrollActive = true;
      routeProgress = clampProgress(self.progress);

      showHead();
      renderRouteProgress(routeProgress);
      scheduleCollecting();
    }

    ScrollTrigger.create({
      trigger,
      endTrigger,
      start: ROUTE_RANGE.start,
      end: ROUTE_RANGE.end,
      scrub: 0.6,
      invalidateOnRefresh: true,

      onEnter: syncHeadWithScroll,
      onEnterBack: syncHeadWithScroll,
      onUpdate: syncHeadWithScroll,

      onLeave: () => {
        stopIdleCollectDelay();
        stopCollectingHeadParts();

        routeProgress = 1;

        showHead();
        renderRouteProgress(1);
        playFreeFall();
      },

      onLeaveBack: () => {
        stopIdleCollectDelay();
        stopCollectingHeadParts();
        stopFreeFall();

        isScrollActive = false;
        routeProgress = 0;

        showHead();
        renderRouteProgress(0);
      },

      onRefresh: (self) => {
        refreshRoutePoints();
        syncHeadWithScroll(self);
      },
    });
  }

  function refreshPosition() {
    refreshRoutePoints();

    if (!isHeadVisible) {
      return;
    }

    if (isFreeFallActive) {
      stopFreeFall();
    }

    renderRouteProgress(routeProgress);
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

  renderRouteProgress(0);

  if (fallOnScroll) {
    setupScrollRoute();
  } else {
    startEyeTracking();
  }
}
