import { gsap } from "gsap";

const FACE_SIZE = 400;

const FACE_LAYOUT = {
  desktop: {
    media: "(min-width: 68.01rem)",
    anchorX: 0.24,
    anchorY: 0.16,
    scale: 1,
    margin: 16,
    fallExtra: 220,
  },
  tablet: {
    media: "(min-width: 36.01rem) and (max-width: 68rem)",
    anchorX: 0.23,
    anchorY: 0.14,
    scale: 1,
    margin: 12,
    fallExtra: 190,
  },
  mobile: {
    media: "(max-width: 36rem)",
    anchorX: 0.2,
    anchorY: 0.12,
    scale: 1,
    margin: 8,
    fallExtra: 160,
  },
};

const FALL = {
  triggerOffset: 4,
  impactDrop: 9,
  shakeDuration: 0.045,
  popDuration: 0.13,
  restoreDuration: 0.42,
  stagger: 0.065,
};

const PARTS_POP = {
  "left-eye": { x: -34, y: -18, rotation: -12 },
  "right-eye": { x: -8, y: -24, rotation: 8 },
  brow: { x: 30, y: -16, rotation: 12 },
  dash: { x: 12, y: -12, rotation: -8 },
  nose: { x: -22, y: -10, rotation: 10 },
  mouth: { x: 34, y: -8, rotation: -12 },
};

const PARTS_FALL = {
  "left-eye": { x: -120, rotation: -80, duration: 0.72 },
  "right-eye": { x: -44, rotation: 60, duration: 0.82 },
  brow: { x: 96, rotation: 120, duration: 0.76 },
  dash: { x: 24, rotation: -70, duration: 0.86 },
  nose: { x: -76, rotation: 90, duration: 0.8 },
  mouth: { x: 132, rotation: -110, duration: 0.9 },
};

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);

  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });

  return el;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getLayout() {
  if (window.matchMedia(FACE_LAYOUT.mobile.media).matches) {
    return FACE_LAYOUT.mobile;
  }

  if (window.matchMedia(FACE_LAYOUT.tablet.media).matches) {
    return FACE_LAYOUT.tablet;
  }

  return FACE_LAYOUT.desktop;
}

function getHeroRect() {
  const hero = document.querySelector(".hero__screen--cover") || document.querySelector(".hero") || document.body;
  return hero.getBoundingClientRect();
}

function getScrollTop() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function createLine(attrs = {}) {
  return svgEl("path", {
    stroke: "#222222",
    "stroke-width": "9",
    fill: "none",
    ...attrs,
  });
}

export function mountawfulface(containerId = "awfulface", { eyeStrength = 1, variant = "hero", fallOnScroll = true } = {}) {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.awfulfaceMounted === "true") {
    return;
  }

  const isInline = variant === "inline";

  container.dataset.awfulfaceMounted = "true";
  container.classList.add("awfulface-container", isInline ? "awfulface-container--inline" : "awfulface-container--hero");

  const svg = svgEl("svg", {
    width: FACE_SIZE,
    height: FACE_SIZE,
    viewBox: "-200 -200 400 400",
    "aria-hidden": "true",
  });

  svg.style.left = "0";
  svg.style.top = "0";

  const group = svgEl("g");

  const leftEye = svgEl("ellipse", {
    cx: "-62",
    cy: "-8",
    rx: "7",
    ry: "5",
    fill: "#222222",
  });

  const rightEye = svgEl("ellipse", {
    cx: "26",
    cy: "-24",
    rx: "7",
    ry: "5",
    fill: "#222222",
  });

  const brow = createLine({
    d: "M -25 -28 L 30 -65",
  });

  const dashGroup = svgEl("g", {
    transform: "translate(-20 5)",
  });

  const dash = createLine({
    d: "M -5 62 L 30 82",
  });

  dashGroup.appendChild(dash);

  const nose = createLine({
    d: "M -75 -48 Q -30 -45 -25 -32 Q -20 0 -20 -5 Q -20 15 -5 7 Q 15 -10 1 0",
    "stroke-linejoin": "round",
  });

  const mouth = createLine({
    d: "M -60 55 Q -35 27 -20 48 Q -15 70 10 35 Q 22 32 35 48 Q 55 42 50 46",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

  const shapes = [
    { name: "left-eye", node: leftEye },
    { name: "right-eye", node: rightEye },
    { name: "brow", node: brow },
    { name: "dash", node: dashGroup },
    { name: "nose", node: nose },
    { name: "mouth", node: mouth },
  ];

  const parts = shapes.map(({ name, node }) => {
    const part = svgEl("g");
    part.dataset.awfulfacePart = name;
    part.appendChild(node);
    group.appendChild(part);
    return part;
  });

  svg.appendChild(group);
  container.appendChild(svg);

  const state = {
    fallen: false,
    animating: false,
    scale: 1,
    timeline: null,
  };

  const leftBase = { x: -62, y: -8 };
  const rightBase = { x: 26, y: -24 };

  gsap.set(svg, {
    xPercent: -50,
    yPercent: -50,
    transformOrigin: "50% 50%",
    force3D: true,
  });

  gsap.set(parts, {
    x: 0,
    y: 0,
    rotation: 0,
    visibility: "visible",
    transformBox: "fill-box",
    transformOrigin: "50% 50%",
    force3D: true,
  });

  function resetEyes() {
    leftEye.setAttribute("cx", leftBase.x);
    leftEye.setAttribute("cy", leftBase.y);
    rightEye.setAttribute("cx", rightBase.x);
    rightEye.setAttribute("cy", rightBase.y);
  }

  function getSvgUnitPx() {
    const rect = svg.getBoundingClientRect();
    return rect.width / FACE_SIZE || 1;
  }

  function placeFace() {
    if (isInline) {
      state.scale = 1;
      gsap.set(svg, {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        visibility: "visible",
      });

      gsap.set(container, {
        visibility: "visible",
      });
      return;
    }

    const layout = getLayout();
    const rect = getHeroRect();
    const rawSvgWidth = Number.parseFloat(getComputedStyle(svg).width) || FACE_SIZE;
    const size = rawSvgWidth * layout.scale;

    const x = clamp(
      rect.left + rect.width * layout.anchorX,
      size / 2 + layout.margin,
      window.innerWidth - size / 2 - layout.margin,
    );

    const y = clamp(
      rect.top + rect.height * layout.anchorY,
      size / 2 + layout.margin,
      window.innerHeight - size / 2 - layout.margin,
    );

    state.scale = layout.scale;

    gsap.set(svg, {
      x,
      y,
      scale: layout.scale,
      rotation: 0,
      visibility: "visible",
    });

    gsap.set(container, {
      visibility: "visible",
    });
  }

  function resetParts() {
    gsap.set(parts, {
      x: 0,
      y: 0,
      rotation: 0,
      visibility: "visible",
    });
  }

  function getPartName(part) {
    return part.dataset.awfulfacePart;
  }

  function getFallY(part, index) {
    const layout = getLayout();
    const unitPx = getSvgUnitPx();
    const rect = part.getBoundingClientRect();
    const distancePx = window.innerHeight - rect.top + rect.height + layout.fallExtra + index * 54;

    return Math.max(distancePx / unitPx, FACE_SIZE * 1.4);
  }

  function trackEyes(event) {
    if (state.fallen || state.animating) {
      return;
    }

    const rect = svg.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const mouseX = ((event.clientX - rect.left) / rect.width) * FACE_SIZE - FACE_SIZE / 2;
    const mouseY = ((event.clientY - rect.top) / rect.height) * FACE_SIZE - FACE_SIZE / 2;

    leftEye.setAttribute("cx", leftBase.x + ((mouseX - leftBase.x) / 200) * eyeStrength);
    leftEye.setAttribute("cy", leftBase.y + ((mouseY - leftBase.y) / 200) * eyeStrength);

    rightEye.setAttribute("cx", rightBase.x + ((mouseX - rightBase.x) / 200) * eyeStrength);
    rightEye.setAttribute("cy", rightBase.y + ((mouseY - rightBase.y) / 200) * 0.5 * eyeStrength);
  }

  function fallApart() {
    if (state.fallen || state.animating) {
      return;
    }

    state.animating = true;
    resetEyes();

    state.timeline?.kill();

    gsap.set(svg, {
      visibility: "visible",
    });

    gsap.set(parts, {
      visibility: "visible",
    });

    state.timeline = gsap.timeline({
      onComplete() {
        gsap.set(svg, {
          visibility: "hidden",
        });

        state.fallen = true;
        state.animating = false;
        state.timeline = null;
      },
    });

    state.timeline
      .to(svg, {
        y: `+=${FALL.impactDrop}`,
        scale: state.scale * 0.98,
        duration: 0.08,
        ease: "power2.in",
      })
      .to(svg, {
        rotation: -2,
        duration: FALL.shakeDuration,
      })
      .to(svg, {
        rotation: 2,
        duration: FALL.shakeDuration,
      })
      .to(svg, {
        rotation: 0,
        duration: FALL.shakeDuration,
      });

    parts.forEach((part, index) => {
      const name = getPartName(part);
      const pop = PARTS_POP[name];
      const fall = PARTS_FALL[name];
      const start = 0.12 + index * FALL.stagger;

      state.timeline
        .to(
          part,
          {
            x: pop.x,
            y: pop.y,
            rotation: pop.rotation,
            duration: FALL.popDuration,
            ease: "back.out(2.4)",
          },
          start,
        )
        .to(
          part,
          {
            x: fall.x,
            y: getFallY(part, index),
            rotation: fall.rotation,
            duration: fall.duration,
            ease: "power3.in",
          },
          start + 0.08,
        );
    });
  }

  function restoreFace() {
    if (!state.fallen && !state.animating) {
      return;
    }

    state.timeline?.kill();

    state.fallen = false;
    state.animating = true;

    placeFace();

    gsap.set(svg, {
      visibility: "visible",
      rotation: 0,
    });

    gsap.set(parts, {
      visibility: "visible",
    });

    state.timeline = gsap.timeline({
      onComplete() {
        state.animating = false;
        state.timeline = null;
      },
    });

    state.timeline.to(parts, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: FALL.restoreDuration,
      ease: "power3.out",
      stagger: {
        each: 0.018,
        from: "center",
      },
    });
  }

  function handleScroll() {
    if (getScrollTop() > FALL.triggerOffset) {
      fallApart();
      return;
    }

    restoreFace();
  }

  function handleResize() {
    if (state.animating || state.fallen) {
      return;
    }

    placeFace();
  }

  placeFace();
  resetParts();

  document.addEventListener("mousemove", trackEyes);
  window.addEventListener("resize", handleResize);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!state.animating && !state.fallen) {
        placeFace();
      }
    });
  }

  if (fallOnScroll && !isInline) {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  return function destroyAwfulface() {
    state.timeline?.kill();

    document.removeEventListener("mousemove", trackEyes);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);

    svg.remove();
    delete container.dataset.awfulfaceMounted;
  };
}
