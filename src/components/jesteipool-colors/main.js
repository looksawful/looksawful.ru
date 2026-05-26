import "./style.css";

import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { EasePack } from "gsap/EasePack";

gsap.registerPlugin(MorphSVGPlugin, CustomEase, EasePack);

export function mountJesteiColors(containerId) {
  const container = document.getElementById(containerId);
  if (!container || container.dataset.jesteiColorsMounted === "true") return;
  container.dataset.jesteiColorsMounted = "true";
  container.classList.add("jestei-colors");

  // ── HTML ───────────────────────────────────────────────────────────────────
  const CIRCLE_D_INIT =
    "M 40 0 C 40 22.092 22.092 40 0 40 C -22.092 40 -40 22.092 -40 0 C -40 -22.092 -22.092 -40 0 -40 C 22.092 -40 40 -22.092 40 0 Z";

  container.innerHTML = `
    <svg id="svg-stage" xmlns="http://www.w3.org/2000/svg" viewBox="-220 -220 440 440">
      <defs>
        <filter id="gooey" x="-80%" y="-80%" width="260%" height="260%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
      <g id="goo-group" filter="url(#gooey)">
        <g id="goo-orange" class="palette-trigger" data-palette="basic">
          <path id="path-orange" fill="#F18200" d="${CIRCLE_D_INIT}" />
        </g>
        <g id="goo-green" class="palette-trigger" data-palette="event">
          <path id="path-green" fill="#F18200" d="${CIRCLE_D_INIT}" />
        </g>
        <g id="goo-pro" class="palette-trigger" data-palette="pro" style="opacity:0;visibility:hidden">
          <path id="path-pro" fill="#F18200" d="${CIRCLE_D_INIT}" />
        </g>
        <g id="goo-biloba" class="palette-trigger" data-palette="biloba" style="opacity:0;visibility:hidden">
          <path id="path-biloba" fill="#F18200" d="${CIRCLE_D_INIT}" />
        </g>
      </g>
    </svg>
    <section class="palette-panel" id="palette-info" aria-hidden="true">
      <div class="panel-header">
        <h2 class="panel-title" id="palette-title"></h2>
        <p class="panel-desc" id="palette-desc"></p>
      </div>
      <div class="swatches" id="palette-swatches"></div>
    </section>
  `;

  // ── Весь оригинальный код ниже, DOM-ссылки через container ─────────────────

  CustomEase.create("liquidOut", "M0,0 C0.04,0 0.18,0.52 0.36,0.78 0.54,1.06 0.74,1.09 0.88,1.02 1,0.97 1,1 1,1");

  const scopeSelector = `#${containerId}`;

  const ORANGE_COLOR = "#F18200";
  const PEAR_COLOR = "#D1E231";
  const BLUE_COLOR = "#157AFF";
  const BILOBA_COLOR = "#B2A4D4";

  const CIRCLE_D =
    "M 40 0 C 40 22.092 22.092 40 0 40 C -22.092 40 -40 22.092 -40 0 C -40 -22.092 -22.092 -40 0 -40 C 22.092 -40 40 -22.092 40 0 Z";

  const SQUARE_D =
    "M 30 -38 C 34.5 -38 38 -34.5 38 -30 L 38 30 C 38 34.5 34.5 38 30 38 L -30 38 C -34.5 38 -38 34.5 -38 30 L -38 -30 C -38 -34.5 -34.5 -38 -30 -38 Z";

  const PENTAGON_D =
    "M 0 -40 C 4 -40 7 -38 10 -35 L 34 -17 C 38 -14 39 -9 37 -5 L 27 27 C 26 32 22 35 17 35 L -17 35 C -22 35 -26 32 -27 27 L -37 -5 C -39 -9 -38 -14 -34 -17 L -10 -35 C -7 -38 -4 -40 0 -40 Z";

  const STAR_D =
    "M 0 -42 C 3 -42 5 -39 6 -35 L 11 -18 C 12 -15 15 -13 18 -13 L 36 -13 C 41 -13 43 -8 39 -5 L 24 6 C 21 8 20 12 21 15 L 27 32 C 29 38 23 42 18 38 L 4 28 C 1 26 -1 26 -4 28 L -18 38 C -23 42 -29 38 -27 32 L -21 15 C -20 12 -21 8 -24 6 L -39 -5 C -43 -8 -41 -13 -36 -13 L -18 -13 C -15 -13 -12 -15 -11 -18 L -6 -35 C -5 -39 -3 -42 0 -42 Z";

  const PALETTES = {
    basic: {
      title: "Basic",
      desc: "Gold Drop, горящий оранжевый оттенок живого огня.",
      text: "#AC3012",
      muted: "rgba(172, 48, 18, 0.7)",
      code: "rgba(172, 48, 18, 0.55)",
      swatches: [
        { name: "Glow", hex: "#F9D4B0" },
        { name: "Light", hex: "#F1B067" },
        { name: "Normal", hex: "#F18200" },
        { name: "Darker", hex: "#AC3012" },
      ],
    },
    event: {
      title: "Event",
      desc: "Pear, живой жёлто-зелёный оттенок весеннего дня.",
      text: "#96A834",
      muted: "rgba(150, 168, 52, 0.72)",
      code: "rgba(150, 168, 52, 0.58)",
      swatches: [
        { name: "Glow", hex: "#DEF4AC" },
        { name: "Light", hex: "#DFEF85" },
        { name: "Normal", hex: "#D1E231" },
        { name: "Darker", hex: "#96A834" },
      ],
    },
    pro: {
      title: "Pro",
      desc: "Blue, чистый насыщенный синий для акцентов и premium-состояний.",
      text: "#0D3F9E",
      muted: "rgba(13, 63, 158, 0.72)",
      code: "rgba(13, 63, 158, 0.58)",
      swatches: [
        { name: "Glow", hex: "#B9D4FF" },
        { name: "Light", hex: "#6FA8FF" },
        { name: "Normal", hex: "#157AFF" },
        { name: "Darker", hex: "#0D3F9E" },
      ],
    },
    biloba: {
      title: "Biloba",
      desc: "Biloba Flower, мягкий лавандовый оттенок для спокойных вторичных акцентов.",
      text: "#73669C",
      muted: "rgba(115, 102, 156, 0.72)",
      code: "rgba(115, 102, 156, 0.58)",
      swatches: [
        { name: "Glow", hex: "#DDD6F0" },
        { name: "Light", hex: "#C9BFE5" },
        { name: "Normal", hex: "#B2A4D4" },
        { name: "Darker", hex: "#73669C" },
      ],
    },
  };

  const svgStage = container.querySelector("#svg-stage");
  const gooGroup = container.querySelector("#goo-group");
  const gOrange = container.querySelector("#goo-orange");
  const gGreen = container.querySelector("#goo-green");
  const gPro = container.querySelector("#goo-pro");
  const gBiloba = container.querySelector("#goo-biloba");
  const pOrange = container.querySelector("#path-orange");
  const pGreen = container.querySelector("#path-green");
  const pPro = container.querySelector("#path-pro");
  const pBiloba = container.querySelector("#path-biloba");
  const palettePanel = container.querySelector("#palette-info");
  const paletteTitle = container.querySelector("#palette-title");
  const paletteDesc = container.querySelector("#palette-desc");
  const paletteSwatches = container.querySelector("#palette-swatches");

  const INNER_R = 96;
  const OUTER_R = 168;
  const INNER_DURATION = 7;
  const OUTER_DURATION = INNER_DURATION * 2;
  const COLOR_BLEND = 10;

  const SHAPE_BASE_R = 42;
  const SELECTED_SCALE = 2.08;
  const OTHER_SCALE = 0.66;
  const EDGE_OVERLAP = 11;

  const clamp01 = (value) => Math.max(0, Math.min(1, value));

  const shapes = [
    {
      key: "basic",
      group: gOrange,
      path: pOrange,
      color: ORANGE_COLOR,
      scale: 1,
      hitR: 0,
      focusX: 0,
      focusY: 0,
      baseX: 0,
      baseY: 0,
      rotation: 0,
      hit: null,
    },
    {
      key: "event",
      group: gGreen,
      path: pGreen,
      color: PEAR_COLOR,
      scale: 1,
      hitR: 0,
      focusX: 0,
      focusY: 0,
      baseX: 0,
      baseY: 0,
      rotation: 0,
      hit: null,
    },
    {
      key: "pro",
      group: gPro,
      path: pPro,
      color: BLUE_COLOR,
      scale: 1,
      hitR: 0,
      focusX: 0,
      focusY: 0,
      baseX: 0,
      baseY: 0,
      rotation: 0,
      hit: null,
    },
    {
      key: "biloba",
      group: gBiloba,
      path: pBiloba,
      color: BILOBA_COLOR,
      scale: 1,
      hitR: 0,
      focusX: 0,
      focusY: 0,
      baseX: 0,
      baseY: 0,
      rotation: 0,
      hit: null,
    },
  ];

  const hitLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  hitLayer.setAttribute("id", "hit-layer");
  svgStage.appendChild(hitLayer);

  shapes.forEach((shape) => {
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hit.setAttribute("class", "shape-hit");
    hit.setAttribute("data-palette", shape.key);
    hit.setAttribute("r", "0");
    hit.style.pointerEvents = "none";
    hitLayer.appendChild(hit);
    shape.hit = hit;
  });

  function innerProgressByY(y) {
    return clamp01((-y + COLOR_BLEND) / (COLOR_BLEND * 2));
  }

  function innerColorByY(y) {
    return gsap.utils.interpolate(ORANGE_COLOR, PEAR_COLOR, innerProgressByY(y));
  }

  function renderPalette(key) {
    const palette = PALETTES[key];
    if (!palette) return;

    palettePanel.style.setProperty("--palette-text", palette.text);
    palettePanel.style.setProperty("--palette-muted", palette.muted);
    palettePanel.style.setProperty("--palette-code", palette.code);

    paletteTitle.textContent = palette.title;
    paletteDesc.textContent = palette.desc;

    paletteSwatches.innerHTML = palette.swatches
      .map(
        (swatch) => `
          <article class="swatch-item">
            <div class="swatch-dot" style="background: ${swatch.hex}"></div>
            <p class="swatch-name">${swatch.name}</p>
            <p class="swatch-code">${swatch.hex}</p>
          </article>
        `,
      )
      .join("");
  }

  function showPalette(key) {
    renderPalette(key);

    gsap.to(palettePanel, {
      autoAlpha: 1,
      duration: 0.28,
      ease: "power2.out",
      overwrite: true,
    });

    gsap.fromTo(
      `${scopeSelector} .panel-title, ${scopeSelector} .panel-desc, ${scopeSelector} .swatch-item`,
      { y: 10, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.34,
        stagger: { each: 0.035, from: "start" },
        ease: "power2.out",
        overwrite: true,
      },
    );
  }

  function hidePalette() {
    gsap.to(palettePanel, {
      autoAlpha: 0,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });
  }

  function renderScene() {
    shapes.forEach((shape) => {
      const x = shape.baseX + shape.focusX;
      const y = shape.baseY + shape.focusY;

      gsap.set(shape.group, { x, y, autoAlpha: 1 });

      gsap.set(shape.path, {
        rotation: shape.rotation,
        scale: shape.scale,
        transformOrigin: "50% 50%",
      });

      gsap.set(shape.hit, {
        attr: { cx: x, cy: y, r: shape.hitR },
      });
    });

    if (orangeMorph && greenMorph) {
      orangeMorph.progress(innerProgressByY(shapes[0].baseY));
      greenMorph.progress(innerProgressByY(shapes[1].baseY));
    }

    gsap.set(pOrange, { fill: innerColorByY(shapes[0].baseY) });
    gsap.set(pGreen, { fill: innerColorByY(shapes[1].baseY) });
    gsap.set(pPro, { fill: BLUE_COLOR });
    gsap.set(pBiloba, { fill: BILOBA_COLOR });
  }

  function setHitMode(mode, selectedShape = null) {
    shapes.forEach((shape) => {
      if (mode === "off") {
        shape.hit.style.pointerEvents = "none";
        return;
      }
      if (mode === "focus") {
        shape.hit.style.pointerEvents = shape === selectedShape ? "all" : "none";
        return;
      }
      shape.hit.style.pointerEvents = "all";
    });
  }

  function getEdgeTarget(shape, selectedShape) {
    const dx = shape.baseX - selectedShape.baseX;
    const dy = shape.baseY - selectedShape.baseY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const selectedRadius = SHAPE_BASE_R * SELECTED_SCALE;
    const otherRadius = SHAPE_BASE_R * OTHER_SCALE;
    const targetDistance = selectedRadius + otherRadius - EDGE_OVERLAP;
    return {
      x: selectedShape.baseX + ux * targetDistance,
      y: selectedShape.baseY + uy * targetDistance,
    };
  }

  function focusShape(selectedShape) {
    pauseOrbit();
    const selectedIndex = shapes.indexOf(selectedShape);
    gooGroup.appendChild(selectedShape.group);
    setHitMode("focus", selectedShape);
    gsap.killTweensOf(shapes);

    gsap.to(shapes, {
      scale(index, shape) {
        return shape === selectedShape ? SELECTED_SCALE : OTHER_SCALE;
      },
      hitR(index, shape) {
        return shape === selectedShape ? SHAPE_BASE_R * SELECTED_SCALE * 1.18 : 0;
      },
      focusX(index, shape) {
        if (shape === selectedShape) return 0;
        return getEdgeTarget(shape, selectedShape).x - shape.baseX;
      },
      focusY(index, shape) {
        if (shape === selectedShape) return 0;
        return getEdgeTarget(shape, selectedShape).y - shape.baseY;
      },
      duration: 0.82,
      ease: "elastic.out(1, 0.52)",
      stagger: { amount: 0.18, from: selectedIndex },
      overwrite: true,
      onUpdate: renderScene,
    });
  }

  function resetFocusShape() {
    setHitMode("off");
    gsap.killTweensOf(shapes);

    gsap.to(shapes, {
      scale: 1,
      focusX: 0,
      focusY: 0,
      hitR: 58,
      duration: 0.76,
      ease: "elastic.out(1, 0.56)",
      stagger: { amount: 0.14, from: "center" },
      overwrite: true,
      onUpdate: renderScene,
      onComplete() {
        setHitMode("normal");
      },
    });

    resumeOrbit();
  }

  gsap.set([gOrange, gGreen], { x: 0, y: 0, autoAlpha: 1 });
  gsap.set([gPro, gBiloba], { x: 0, y: 0, autoAlpha: 0 });

  gsap.set([pOrange, pGreen, pPro, pBiloba], {
    attr: { d: CIRCLE_D },
    fill: ORANGE_COLOR,
    scale: 0,
    rotation: 0,
    transformOrigin: "50% 50%",
  });

  const splitState = { progress: 0 };

  let orbitStarted = false;
  let orbitPaused = false;
  let orbitStartTime = 0;
  let orbitElapsed = 0;
  let orangeMorph;
  let greenMorph;
  let activeShape = null;

  const tl = gsap.timeline({ delay: 0.5 });

  tl.to([pOrange, pGreen], {
    scale: 1.1,
    duration: 1.5,
    ease: "expo.out",
    transformOrigin: "50% 50%",
  })
    .to([pOrange, pGreen], {
      scale: 0.9,
      duration: 0.22,
      ease: "power3.in",
      transformOrigin: "50% 50%",
    })

    .to([gPro, gBiloba], { autoAlpha: 1, duration: 0.01, ease: "none" }, "<")

    .to(splitState, {
      progress: 1,
      duration: 1.5,
      ease: "liquidOut",
      onUpdate() {
        const p = splitState.progress;

        shapes[0].baseX = 0;
        shapes[0].baseY = INNER_R * p;
        shapes[1].baseX = 0;
        shapes[1].baseY = -INNER_R * p;
        shapes[2].baseX = OUTER_R * p;
        shapes[2].baseY = 0;
        shapes[3].baseX = -OUTER_R * p;
        shapes[3].baseY = 0;

        shapes[0].rotation = 18 * p;
        shapes[1].rotation = -18 * p;
        shapes[2].rotation = 72 * p;
        shapes[3].rotation = -72 * p;

        shapes.forEach((shape) => {
          shape.scale = 0.9 + 0.1 * p;
          shape.hitR = 0;
        });

        renderScene();

        gsap.set(pOrange, { fill: ORANGE_COLOR });
        gsap.set(pGreen, { fill: gsap.utils.interpolate(ORANGE_COLOR, PEAR_COLOR, p) });
        gsap.set(pPro, { fill: gsap.utils.interpolate(ORANGE_COLOR, BLUE_COLOR, p) });
        gsap.set(pBiloba, { fill: gsap.utils.interpolate(ORANGE_COLOR, BILOBA_COLOR, p) });
      },
    })

    .to(pOrange, { morphSVG: SQUARE_D, duration: 1.35, ease: "liquidOut", transformOrigin: "50% 50%" }, "<")
    .to(pGreen, { morphSVG: CIRCLE_D, duration: 1.35, ease: "liquidOut", transformOrigin: "50% 50%" }, "<")
    .to(pPro, { morphSVG: STAR_D, duration: 1.35, ease: "liquidOut", transformOrigin: "50% 50%" }, "<")
    .to(pBiloba, { morphSVG: PENTAGON_D, duration: 1.35, ease: "liquidOut", transformOrigin: "50% 50%" }, "<")

    .add(() => {
      startOrbit();
    });

  function ensureOrbitMorphs() {
    if (orangeMorph && greenMorph) return;

    orangeMorph = gsap.fromTo(
      pOrange,
      { morphSVG: SQUARE_D },
      { morphSVG: CIRCLE_D, duration: 1, ease: "none", paused: true },
    );
    greenMorph = gsap.fromTo(
      pGreen,
      { morphSVG: SQUARE_D },
      { morphSVG: CIRCLE_D, duration: 1, ease: "none", paused: true },
    );
  }

  function startOrbit() {
    if (orbitStarted) return;
    orbitStarted = true;
    orbitPaused = false;
    orbitStartTime = gsap.ticker.time;
    shapes.forEach((shape) => {
      shape.hitR = 58;
    });
    setHitMode("normal");
    ensureOrbitMorphs();
    updateOrbit();
    gsap.ticker.add(updateOrbit);
  }

  function pauseOrbit() {
    if (!orbitStarted || orbitPaused) return;
    orbitElapsed = gsap.ticker.time - orbitStartTime;
    orbitPaused = true;
    gsap.ticker.remove(updateOrbit);
  }

  function resumeOrbit() {
    if (!orbitStarted || !orbitPaused) return;
    orbitStartTime = gsap.ticker.time - orbitElapsed;
    orbitPaused = false;
    gsap.ticker.add(updateOrbit);
  }

  function updateOrbit() {
    orbitElapsed = gsap.ticker.time - orbitStartTime;

    const innerAngle = Math.PI / 2 + (orbitElapsed / INNER_DURATION) * Math.PI * 2;
    const outerAngle = 0 - (orbitElapsed / OUTER_DURATION) * Math.PI * 2;

    shapes[0].baseX = Math.cos(innerAngle) * INNER_R;
    shapes[0].baseY = Math.sin(innerAngle) * INNER_R;
    shapes[1].baseX = Math.cos(innerAngle + Math.PI) * INNER_R;
    shapes[1].baseY = Math.sin(innerAngle + Math.PI) * INNER_R;
    shapes[2].baseX = Math.cos(outerAngle) * OUTER_R;
    shapes[2].baseY = Math.sin(outerAngle) * OUTER_R;
    shapes[3].baseX = Math.cos(outerAngle + Math.PI) * OUTER_R;
    shapes[3].baseY = Math.sin(outerAngle + Math.PI) * OUTER_R;

    shapes[0].rotation = orbitElapsed * 52;
    shapes[1].rotation = orbitElapsed * -42;
    shapes[2].rotation = orbitElapsed * 62;
    shapes[3].rotation = orbitElapsed * -54;

    renderScene();
  }

  shapes.forEach((shape) => {
    shape.hit.addEventListener("pointerenter", () => {
      if (!orbitStarted || activeShape) return;
      activeShape = shape;
      showPalette(shape.key);
      focusShape(shape);
    });

    shape.hit.addEventListener("pointerleave", () => {
      if (activeShape !== shape) return;
      activeShape = null;
      hidePalette();
      resetFocusShape();
    });
  });
}
