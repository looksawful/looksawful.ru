import {
  JESTEI_THEME_CSS_PROPERTIES,
  JESTEI_THEME_DEFINITIONS,
  JESTEI_THEME_DRACO_PATH,
  JESTEI_THEME_MODEL_URL,
  JESTEI_THEME_SETTINGS,
  createJesteiThemeOrganismMarkup,
} from "./jestei-theme-organism-data.js";
import {
  FRAGMENT_SHADER,
  VERTEX_SHADER,
} from "./jestei-theme-organism-shaders.js";

const ORGANISM_DESTROY = Symbol.for("looksawful.jesteiThemeOrganism.destroy");
const MAX_PREPARE_ATTEMPTS = 2;
const RETRY_DELAY_MS = 240;
const RUN_ROOT_MARGIN = "160px 0px";
const noop = () => {};

let runtimePromise = null;
let modelBufferPromise = null;

/**
 * Imports are shared by every instance and every retry. A rejected import is
 * removed from the cache, so a transient chunk-loading error can be retried.
 */
function getAnimatedRuntime() {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/loaders/DRACOLoader.js"),
    ]).then(([THREE, { GLTFLoader }, { DRACOLoader }]) => ({
      THREE,
      GLTFLoader,
      DRACOLoader,
    }));

    runtimePromise.catch(() => {
      runtimePromise = null;
    });
  }

  return runtimePromise;
}

/**
 * The binary model is fetched once. Parsing still happens per WebGL experience
 * because every experience owns and disposes its own scene graph.
 */
function getModelBuffer() {
  if (!modelBufferPromise) {
    modelBufferPromise = fetch(JESTEI_THEME_MODEL_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Jestei model request failed: ${response.status}`);
      }

      return response.arrayBuffer();
    });

    modelBufferPromise.catch(() => {
      modelBufferPromise = null;
    });
  }

  return modelBufferPromise;
}

export function preloadJesteiThemeOrganismAssets() {
  return Promise.all([getAnimatedRuntime(), getModelBuffer()]).then(noop);
}

function parseGLB(loader, buffer) {
  return new Promise((resolve, reject) => {
    loader.parse(buffer, "", resolve, reject);
  });
}

function readElements(root) {
  const organism = root.querySelector(".jestei-theme-organism__stage");
  const canvas = root.querySelector("[data-jestei-theme-canvas]");
  const themeTrack = root.querySelector("[data-theme-track]");
  const themeTrackViewport = root.querySelector(
    ".jestei-theme-organism__track-viewport",
  );
  const themeCopyShell = root.querySelector(".jestei-theme-organism__copy");

  if (
    !(organism instanceof HTMLElement) ||
    !(canvas instanceof HTMLCanvasElement) ||
    !(themeTrack instanceof HTMLElement) ||
    !(themeTrackViewport instanceof HTMLElement) ||
    !(themeCopyShell instanceof HTMLElement)
  ) {
    throw new Error("Jestei theme organism markup is incomplete.");
  }

  const sourceThemeCards = Array.from(
    themeTrack.querySelectorAll(
      ".jestei-theme-organism__card:not([data-loop-clone])",
    ),
  );

  if (sourceThemeCards.length !== JESTEI_THEME_DEFINITIONS.length) {
    throw new Error("Jestei theme organism cards do not match theme data.");
  }

  return {
    organism,
    canvas,
    themeTrack,
    themeTrackViewport,
    themeCopyShell,
    paletteNameNodes: Array.from(root.querySelectorAll("[data-color-name]")),
    paletteHexNodes: Array.from(root.querySelectorAll("[data-color-hex]")),
    themeChipNodes: Array.from(
      root.querySelectorAll(
        ".jestei-theme-organism__chips [data-theme-chip]",
      ),
    ),
    sourceThemeCards,
  };
}

function createTrackController(elements) {
  const {
    themeTrack,
    themeTrackViewport,
    themeCopyShell,
    sourceThemeCards,
  } = elements;
  const themeCardsByName = new Map(
    sourceThemeCards.map((card) => [card.dataset.theme, card]),
  );
  const lastThemeIndex = Math.max(0, sourceThemeCards.length - 1);

  let loopClone = null;
  let slideWidth = 0;
  let trackGap = 0;
  let trackPosition = 0;
  let appliedTransform = "";

  function ensureLoopClone() {
    if (loopClone) return;

    const neutralCard = sourceThemeCards.find(
      (card) => card.dataset.theme === "neutral",
    );

    if (!(neutralCard instanceof HTMLElement)) return;

    loopClone = neutralCard.cloneNode(true);
    loopClone.dataset.loopClone = "true";
    loopClone.setAttribute("aria-hidden", "true");
    themeTrack.append(loopClone);
  }

  function removeLoopClone() {
    loopClone?.remove();
    loopClone = null;
  }

  function applyTrackPosition() {
    if (slideWidth <= 0) return;

    const slideStep = slideWidth + trackGap;
    const transform = `translate3d(${-trackPosition * slideStep}px, 0, 0)`;

    if (transform === appliedTransform) return;
    appliedTransform = transform;
    themeTrack.style.transform = transform;
  }

  function resize() {
    const measuredWidth = themeCopyShell.getBoundingClientRect().width;

    // A closed click-accordion panel can be display:none. Keep the previous
    // valid measurement and refresh synchronously when the panel opens.
    if (measuredWidth > 0) {
      slideWidth = measuredWidth;
    }

    if (slideWidth <= 0) return;

    const trackStyles = getComputedStyle(themeTrack);
    trackGap = Number.parseFloat(trackStyles.columnGap) || 0;
    themeTrack.style.setProperty(
      JESTEI_THEME_CSS_PROPERTIES.slideWidth,
      `${slideWidth}px`,
    );
    applyTrackPosition();
  }

  function update(fromIndex, toIndex, progress, THREE) {
    if (fromIndex === toIndex) {
      trackPosition = fromIndex;
    } else if (fromIndex === lastThemeIndex && toIndex === 0) {
      trackPosition = lastThemeIndex + progress;
    } else {
      trackPosition = THREE.MathUtils.lerp(fromIndex, toIndex, progress);
    }

    applyTrackPosition();
  }

  function reset() {
    themeTrack.style.removeProperty("transform");
    themeTrack.style.removeProperty(JESTEI_THEME_CSS_PROPERTIES.slideWidth);
    trackPosition = 0;
    slideWidth = 0;
    trackGap = 0;
    appliedTransform = "";
    removeLoopClone();
  }

  return {
    ensureLoopClone,
    resize,
    update,
    reset,
    themeCardsByName,
    viewport: themeTrackViewport,
  };
}

function colorToRgbChannels(color) {
  return [
    Math.round(color.r * 255),
    Math.round(color.g * 255),
    Math.round(color.b * 255),
  ].join(" ");
}

function smoothThemeProgress(progress, THREE) {
  const accelerated = THREE.MathUtils.clamp(progress / 0.18, 0, 1);
  return 1 - Math.pow(1 - accelerated, 3);
}

function createThemeController(root, elements, track, THREE) {
  const themeColors = JESTEI_THEME_DEFINITIONS.map((theme) => ({
    name: theme.name,
    color: new THREE.Color(theme.color),
  }));
  const themeColor = new THREE.Color();
  const themeFrom = new THREE.Color();
  const themeTo = new THREE.Color();
  const backgroundStart = new THREE.Color();
  const backgroundEnd = new THREE.Color();
  const glow = new THREE.Color();
  const ink = new THREE.Color();
  const paletteColors = [
    new THREE.Color(),
    new THREE.Color(),
    new THREE.Color(),
    new THREE.Color(),
  ];
  const hsl = { h: 0, s: 0, l: 0 };

  let activeName = "";

  function createPalette(baseColor) {
    baseColor.getHSL(hsl);

    paletteColors[0].copy(baseColor);
    paletteColors[1].setHSL(
      hsl.h,
      Math.min(1, hsl.s * 0.92),
      Math.max(0.12, hsl.l * 0.56),
    );
    paletteColors[2].setHSL(
      hsl.h,
      Math.min(1, hsl.s * 0.78),
      Math.min(0.72, hsl.l * 1.08 + 0.12),
    );
    paletteColors[3].setHSL(
      hsl.h,
      Math.min(1, hsl.s * 0.46),
      Math.min(0.94, hsl.l * 0.72 + 0.34),
    );

    if (baseColor.getHex() === 0x000000) {
      paletteColors[0].set("#000000");
      paletteColors[1].set("#3C3C3C");
      paletteColors[2].set("#969696");
      paletteColors[3].set("#E4E4E4");
    }
  }

  function updateActiveContent(nextActiveName) {
    if (nextActiveName === activeName) return;
    activeName = nextActiveName;

    elements.themeChipNodes.forEach((chip) => {
      chip.dataset.active = String(chip.dataset.themeChip === activeName);
    });

    const activeCard = track.themeCardsByName.get(activeName);
    if (!(activeCard instanceof HTMLElement)) return;

    const sourceTokenNames = activeCard.querySelectorAll(
      ".jestei-theme-organism__token-name",
    );
    const sourceTokenValues = activeCard.querySelectorAll(
      ".jestei-theme-organism__token-value",
    );

    elements.paletteNameNodes.forEach((node, index) => {
      const name = sourceTokenNames[index]?.textContent;
      const value = sourceTokenValues[index]?.textContent;

      if (name) node.textContent = name;
      if (value && elements.paletteHexNodes[index]) {
        elements.paletteHexNodes[index].textContent = value;
      }
    });
  }

  function update(fromIndex, toIndex, progress) {
    const easedProgress = smoothThemeProgress(progress, THREE);
    themeFrom.copy(themeColors[fromIndex].color);
    themeTo.copy(themeColors[toIndex].color);
    themeColor.lerpColors(themeFrom, themeTo, easedProgress);
    createPalette(themeColor);
    themeColor.getHSL(hsl);

    backgroundStart.setHSL(hsl.h, Math.min(1, hsl.s * 0.42), 0.97);
    backgroundEnd.setHSL(hsl.h, Math.min(1, hsl.s * 0.68), 0.78);
    glow.setHSL(hsl.h, Math.min(1, hsl.s * 0.34), 0.995);
    ink.setHSL(
      hsl.h,
      Math.min(1, hsl.s * 0.88),
      hsl.l > 0.56 ? 0.16 : 0.1,
    );

    root.style.setProperty(
      JESTEI_THEME_CSS_PROPERTIES.backgroundStart,
      colorToRgbChannels(backgroundStart),
    );
    root.style.setProperty(
      JESTEI_THEME_CSS_PROPERTIES.backgroundEnd,
      colorToRgbChannels(backgroundEnd),
    );
    root.style.setProperty(
      JESTEI_THEME_CSS_PROPERTIES.glow,
      colorToRgbChannels(glow),
    );
    root.style.setProperty(
      JESTEI_THEME_CSS_PROPERTIES.ink,
      colorToRgbChannels(ink),
    );
    root.style.setProperty(
      JESTEI_THEME_CSS_PROPERTIES.border,
      colorToRgbChannels(ink),
    );

    paletteColors.forEach((color, index) => {
      root.style.setProperty(
        JESTEI_THEME_CSS_PROPERTIES.swatches[index],
        colorToRgbChannels(color),
      );
    });

    updateActiveContent(
      easedProgress < 0.5
        ? themeColors[fromIndex].name
        : themeColors[toIndex].name,
    );
    track.update(fromIndex, toIndex, easedProgress, THREE);
  }

  return { update };
}

async function loadNormalizedModel({ THREE, GLTFLoader, DRACOLoader }) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(JESTEI_THEME_DRACO_PATH);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  try {
    const sourceBuffer = await getModelBuffer();
    const gltf = await parseGLB(loader, sourceBuffer.slice(0));
    const model = gltf.scene;
    const rawBounds = new THREE.Box3().setFromObject(model, true);
    const center = rawBounds.getCenter(new THREE.Vector3());
    const sphere = rawBounds.getBoundingSphere(new THREE.Sphere());

    model.position.sub(center);
    model.scale.setScalar(
      JESTEI_THEME_SETTINGS.modelRadius / Math.max(sphere.radius, 0.0001),
    );
    model.updateMatrixWorld(true);

    let localBounds = null;

    model.traverse((object) => {
      if (localBounds || !object.isMesh) return;
      object.geometry.computeBoundingBox();
      localBounds = object.geometry.boundingBox?.clone() ?? null;
    });

    if (!localBounds) {
      throw new Error("В модели не найдена геометрия.");
    }

    return { model, localBounds };
  } finally {
    dracoLoader.dispose();
  }
}

function createEnvironmentFace(topValue, bottomValue, glowValue) {
  const size = 256;
  const face = document.createElement("canvas");
  face.width = size;
  face.height = size;
  const context = face.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const gradient = context.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, `rgb(${topValue}, ${topValue}, ${topValue})`);
  gradient.addColorStop(1, `rgb(${bottomValue}, ${bottomValue}, ${bottomValue})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const glow = context.createRadialGradient(
    size * 0.34,
    size * 0.28,
    0,
    size * 0.34,
    size * 0.28,
    size * 0.72,
  );
  glow.addColorStop(
    0,
    `rgba(${glowValue}, ${glowValue}, ${glowValue}, 0.72)`,
  );
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, size, size);

  return face;
}

function disposeModelGeometry(model) {
  if (!model) return;

  const geometries = new Set();

  model.traverse((object) => {
    if (object.isMesh && object.geometry) {
      geometries.add(object.geometry);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
}

/**
 * Creates and primes one complete WebGL experience. The first frame is rendered
 * before the promise resolves, so the controller can reveal the canvas
 * atomically without a transparent or uncompiled frame.
 */
async function createAnimatedExperience(root, elements, track, { onFatalError } = {}) {
  const { THREE, GLTFLoader, DRACOLoader } = await getAnimatedRuntime();
  const { model, localBounds } = await loadNormalizedModel({
    THREE,
    GLTFLoader,
    DRACOLoader,
  });

  let renderer = null;
  let environment = null;
  let material = null;
  let resizeObserver = null;
  let trackResizeObserver = null;
  let contextLostHandler = null;
  let animationFrameId = 0;
  let running = false;
  let elapsed = 0;
  let previousTime = 0;
  let disposed = false;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: elements.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    environment = new THREE.CubeTexture([
      createEnvironmentFace(238, 188, 255),
      createEnvironmentFace(220, 168, 238),
      createEnvironmentFace(255, 205, 255),
      createEnvironmentFace(152, 98, 172),
      createEnvironmentFace(232, 180, 248),
      createEnvironmentFace(214, 160, 235),
    ]);
    environment.colorSpace = THREE.SRGBColorSpace;
    environment.needsUpdate = true;
    scene.environment = environment;

    const camera = new THREE.PerspectiveCamera(33, 1, 0.01, 100);
    camera.position.set(0, 0.06, 4.9);
    camera.lookAt(0, 0, 0);

    const presentation = new THREE.Group();
    const spinner = new THREE.Group();
    presentation.rotation.set(
      THREE.MathUtils.degToRad(JESTEI_THEME_SETTINGS.baseRotationX),
      THREE.MathUtils.degToRad(JESTEI_THEME_SETTINGS.baseRotationY),
      THREE.MathUtils.degToRad(JESTEI_THEME_SETTINGS.baseRotationZ),
    );
    presentation.add(spinner);
    scene.add(presentation);

    const rotationSteps = Object.freeze([
      { axis: new THREE.Vector3(0, 1, 0), angle: Math.PI * 2 },
      { axis: new THREE.Vector3(1, 0, 0), angle: Math.PI },
      { axis: new THREE.Vector3(0, 0, 1), angle: -Math.PI * 2 },
      { axis: new THREE.Vector3(0, 1, 0), angle: -Math.PI },
    ]);
    const completedRotationQuaternion = new THREE.Quaternion();
    const partialRotationQuaternion = new THREE.Quaternion();
    const completedStepQuaternion = new THREE.Quaternion();
    let completedRotationCycleIndex = -1;

    function resetRotationState() {
      completedRotationQuaternion.identity();
      partialRotationQuaternion.identity();
      completedStepQuaternion.identity();
      completedRotationCycleIndex = -1;
      spinner.quaternion.identity();
    }

    function easeOutCubic(value) {
      const t = THREE.MathUtils.clamp(value, 0, 1);
      return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutSine(value) {
      const t = THREE.MathUtils.clamp(value, 0, 1);
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function physicalTurnProgress(value) {
      const t = THREE.MathUtils.clamp(value, 0, 1);
      if (t < 0.74) return easeOutCubic(t / 0.74) * 1.045;

      return THREE.MathUtils.lerp(
        1.045,
        1,
        easeInOutSine((t - 0.74) / 0.26),
      );
    }

    function applyCompletedRotationSteps(currentCycleIndex) {
      while (completedRotationCycleIndex < currentCycleIndex - 1) {
        const completedStepIndex = completedRotationCycleIndex + 1;
        const completedStep =
          rotationSteps[completedStepIndex % rotationSteps.length];
        completedStepQuaternion.setFromAxisAngle(
          completedStep.axis,
          completedStep.angle,
        );
        completedRotationQuaternion
          .multiply(completedStepQuaternion)
          .normalize();
        completedRotationCycleIndex = completedStepIndex;
      }
    }

    function updateCycleRotation(cycleIndex, cycleProgress) {
      applyCompletedRotationSteps(cycleIndex);
      const currentStep = rotationSteps[cycleIndex % rotationSteps.length];
      partialRotationQuaternion.setFromAxisAngle(
        currentStep.axis,
        currentStep.angle * physicalTurnProgress(cycleProgress),
      );
      spinner.quaternion
        .copy(completedRotationQuaternion)
        .multiply(partialRotationQuaternion)
        .normalize();
    }

    const localCenter = localBounds.getCenter(new THREE.Vector3());
    const sharedStart = new THREE.Vector3(
      localBounds.min.x,
      localBounds.min.y,
      localCenter.z,
    );
    const sharedEnd = new THREE.Vector3(
      localBounds.max.x,
      localBounds.max.y,
      localCenter.z,
    );
    const colors = Object.fromEntries(
      JESTEI_THEME_DEFINITIONS.map((theme) => [
        theme.name,
        new THREE.Color(theme.color),
      ]),
    );
    const uniforms = {
      uIntroMode: { value: 1 },
      uIntroRaw: { value: 0 },
      uCycleTime: { value: 1 },
      uCellSize: { value: JESTEI_THEME_SETTINGS.gridCellSize },
      uLineWidth: { value: JESTEI_THEME_SETTINGS.gridLineWidth },
      uBoundsMin: { value: localBounds.min.clone() },
      uBoundsMax: { value: localBounds.max.clone() },
      uSharedStart: { value: sharedStart },
      uSharedEnd: { value: sharedEnd },
      uColorBlack: { value: colors.neutral.clone() },
      uColorEvent: { value: colors.event.clone() },
      uColorBasic: { value: colors.basic.clone() },
      uColorPro: { value: colors.pro.clone() },
      uColorFeature: { value: colors.feature.clone() },
      uEnvironment: { value: environment },
      uEnvironmentIntensity: { value: 0.42 },
      uRoughness: { value: 0.58 },
      uTextureScale: { value: 6.5 },
    };

    material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
    });

    model.traverse((object) => {
      if (!object.isMesh) return;

      const previousMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      previousMaterials.forEach((previousMaterial) =>
        previousMaterial?.dispose?.(),
      );
      object.material = material;
      object.frustumCulled = false;
    });
    spinner.add(model);

    const themeController = createThemeController(root, elements, track, THREE);

    function resize() {
      if (disposed) return false;

      const rect = elements.canvas.getBoundingClientRect();
      const measuredWidth = Math.round(rect.width);
      const measuredHeight = Math.round(rect.height);

      if (measuredWidth <= 0 || measuredHeight <= 0) {
        return false;
      }

      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          JESTEI_THEME_SETTINGS.pixelRatioLimit,
        ),
      );
      renderer.setSize(measuredWidth, measuredHeight, false);
      camera.aspect = measuredWidth / measuredHeight;
      camera.updateProjectionMatrix();
      return true;
    }

    function updateAnimation(currentElapsed) {
      const introDuration = JESTEI_THEME_SETTINGS.passDuration;

      if (currentElapsed < introDuration) {
        uniforms.uIntroMode.value = 1;
        uniforms.uIntroRaw.value = THREE.MathUtils.clamp(
          currentElapsed / introDuration,
          0,
          1,
        );
        themeController.update(0, 0, 1);
        resetRotationState();
        return;
      }

      uniforms.uIntroMode.value = 0;
      const loopElapsed = currentElapsed - introDuration;
      const colorCycleIndex = Math.floor(
        loopElapsed / JESTEI_THEME_SETTINGS.passDuration,
      );
      const colorCycleProgress =
        (loopElapsed % JESTEI_THEME_SETTINGS.passDuration) /
        JESTEI_THEME_SETTINGS.passDuration;
      const themePhase = colorCycleIndex % JESTEI_THEME_DEFINITIONS.length;

      themeController.update(
        themePhase,
        (themePhase + 1) % JESTEI_THEME_DEFINITIONS.length,
        colorCycleProgress,
      );
      uniforms.uCycleTime.value =
        (colorCycleIndex + colorCycleProgress) %
        JESTEI_THEME_DEFINITIONS.length;
      updateCycleRotation(colorCycleIndex, colorCycleProgress);
    }

    function renderCurrentFrame() {
      if (disposed) return;
      updateAnimation(elapsed);
      resize();
      track.resize();
      renderer.render(scene, camera);
    }

    function render(time) {
      if (!running || disposed) return;
      if (!previousTime) previousTime = time;

      elapsed += Math.min(
        0.1,
        Math.max(0, (time - previousTime) / 1000),
      );
      previousTime = time;
      updateAnimation(elapsed);
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    }

    function resume() {
      if (running || disposed) return;

      track.ensureLoopClone();
      renderCurrentFrame();
      running = true;
      previousTime = 0;
      animationFrameId = requestAnimationFrame(render);
    }

    function pause() {
      if (!running) return;

      running = false;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      previousTime = 0;
    }

    function refresh() {
      if (disposed) return;
      renderCurrentFrame();
    }

    function dispose() {
      if (disposed) return;

      disposed = true;
      running = false;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
      resizeObserver?.disconnect();
      trackResizeObserver?.disconnect();

      if (contextLostHandler) {
        elements.canvas.removeEventListener(
          "webglcontextlost",
          contextLostHandler,
        );
      }

      material?.dispose();
      environment?.dispose();
      disposeModelGeometry(model);
      renderer?.dispose();
      renderer?.forceContextLoss();
      track.reset();
    }

    contextLostHandler = (event) => {
      event.preventDefault();
      pause();
      onFatalError?.(new Error("Jestei WebGL context was lost."));
    };
    elements.canvas.addEventListener("webglcontextlost", contextLostHandler);

    resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(refresh)
        : null;
    trackResizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(track.resize)
        : null;

    track.ensureLoopClone();
    themeController.update(0, 0, 1);
    resize();
    track.resize();
    renderer.compile(scene, camera);
    renderer.render(scene, camera);

    resizeObserver?.observe(elements.canvas);
    trackResizeObserver?.observe(track.viewport);

    return Object.freeze({ resume, pause, refresh, dispose });
  } catch (error) {
    resizeObserver?.disconnect();
    trackResizeObserver?.disconnect();

    if (contextLostHandler) {
      elements.canvas.removeEventListener(
        "webglcontextlost",
        contextLostHandler,
      );
    }

    material?.dispose();
    environment?.dispose();
    disposeModelGeometry(model);
    renderer?.dispose();
    renderer?.forceContextLoss();
    track.reset();
    throw error;
  }
}

function createFallbackMotionPreference() {
  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  return {
    allowsMotion: () => (media ? !media.matches : false),
    subscribe(listener, { immediate = true } = {}) {
      if (!media || typeof listener !== "function") return noop;

      const handleChange = () => listener({ allowed: !media.matches });
      media.addEventListener("change", handleChange);
      if (immediate) handleChange();
      return () => media.removeEventListener("change", handleChange);
    },
  };
}

export function createJesteiThemeOrganism({ root, motion } = {}) {
  if (!(root instanceof HTMLElement)) return null;

  root[ORGANISM_DESTROY]?.();
  root.classList.add("jestei-theme-organism");

  const motionPreference = motion ?? createFallbackMotionPreference();
  let motionAllowed =
    typeof motionPreference.allowsMotion === "function"
      ? motionPreference.allowsMotion()
      : false;

  const initialState = motionAllowed ? "loading" : "static";
  root.dataset.motionPreference = motionAllowed ? "allow" : "reduce";
  root.dataset.motionState = initialState;

  if (!root.querySelector(".jestei-theme-organism__stage")) {
    root.innerHTML = createJesteiThemeOrganismMarkup({ initialState });
  }

  const elements = readElements(root);
  const track = createTrackController(elements);
  const accordionItem = root.closest(".cv-item");
  const accordionHeader = accordionItem?.querySelector(".cv-item__header");
  const abortController = new AbortController();
  const signal = abortController.signal;

  let activeExperience = null;
  let experiencePromise = null;
  let generation = 0;
  let prepareAttempts = 0;
  let retryTimer = 0;
  let failureLocked = false;
  let destroyed = false;
  let externallyPaused = false;
  let visible = !("IntersectionObserver" in window);

  function setPresentationState(state, errorCode = "") {
    root.dataset.motionState = state;
    elements.organism.dataset.motionState = state;
    elements.organism.setAttribute("aria-busy", String(state === "loading"));

    if (state === "error") {
      root.dataset.motionFallback = "true";
      root.dataset.motionError = errorCode || "initialization-failed";
    } else {
      delete root.dataset.motionFallback;
      delete root.dataset.motionError;
    }

    if (state === "static" || state === "error") {
      track.reset();
    }
  }

  function isAccordionItemOpen() {
    return (
      !(accordionHeader instanceof HTMLElement) ||
      accordionHeader.getAttribute("aria-expanded") === "true"
    );
  }

  function shouldPrepare() {
    return !destroyed && motionAllowed && root.isConnected;
  }

  function shouldRun() {
    return (
      !destroyed &&
      motionAllowed &&
      visible &&
      isAccordionItemOpen() &&
      !externallyPaused &&
      document.visibilityState !== "hidden" &&
      root.isConnected
    );
  }

  function cancelRetry() {
    if (!retryTimer) return;
    clearTimeout(retryTimer);
    retryTimer = 0;
  }

  function disposeActiveExperience() {
    activeExperience?.dispose();
    activeExperience = null;
  }

  function lockFallback(error) {
    failureLocked = true;
    console.error("Animated theme organism could not start.", error);
    setPresentationState("error", "webgl-initialization-failed");
  }

  function scheduleRetry(error) {
    console.warn("Animated theme organism will retry once.", error);
    setPresentationState("loading");
    cancelRetry();

    retryTimer = window.setTimeout(() => {
      retryTimer = 0;
      if (!destroyed && motionAllowed && !failureLocked) {
        void ensureExperience();
      }
    }, RETRY_DELAY_MS);
  }

  function handleExperienceFailure(error) {
    if (destroyed || !motionAllowed) return;

    generation += 1;
    disposeActiveExperience();
    prepareAttempts += 1;

    if (prepareAttempts < MAX_PREPARE_ATTEMPTS) {
      scheduleRetry(error);
    } else {
      lockFallback(error);
    }
  }

  async function ensureExperience() {
    if (
      activeExperience ||
      experiencePromise ||
      retryTimer ||
      failureLocked ||
      !shouldPrepare()
    ) {
      return;
    }

    const currentGeneration = generation;
    const promise = createAnimatedExperience(root, elements, track, {
      onFatalError(error) {
        queueMicrotask(() => handleExperienceFailure(error));
      },
    });

    experiencePromise = promise;
    setPresentationState("loading");

    try {
      const nextExperience = await promise;

      if (destroyed || currentGeneration !== generation || !motionAllowed) {
        nextExperience.dispose();
        return;
      }

      activeExperience = nextExperience;
      prepareAttempts = 0;
      failureLocked = false;
      setPresentationState("animated");

      if (shouldRun()) activeExperience.resume();
      else activeExperience.pause();
    } catch (error) {
      if (destroyed || currentGeneration !== generation) return;

      prepareAttempts += 1;

      if (prepareAttempts < MAX_PREPARE_ATTEMPTS) {
        scheduleRetry(error);
      } else {
        lockFallback(error);
      }
    } finally {
      if (experiencePromise === promise) {
        experiencePromise = null;
      }

      if (!destroyed) {
        queueMicrotask(reconcile);
      }
    }
  }

  function reconcile() {
    if (destroyed) return;

    root.dataset.motionPreference = motionAllowed ? "allow" : "reduce";

    if (!motionAllowed) {
      generation += 1;
      cancelRetry();
      prepareAttempts = 0;
      failureLocked = false;
      disposeActiveExperience();
      setPresentationState("static");
      return;
    }

    // Warm imports and the model immediately. There is only one inline
    // organism, so delaying preparation until visibility creates more UX cost
    // than it saves. The loader preserves the final geometry while this runs.
    void preloadJesteiThemeOrganismAssets().catch(noop);

    if (failureLocked) {
      disposeActiveExperience();
      setPresentationState("error", "webgl-initialization-failed");
      return;
    }

    if (activeExperience) {
      setPresentationState("animated");

      if (shouldRun()) activeExperience.resume();
      else activeExperience.pause();

      return;
    }

    setPresentationState("loading");

    if (shouldPrepare()) {
      void ensureExperience();
    }
  }

  const accordionObserver =
    accordionHeader instanceof HTMLElement
      ? new MutationObserver(reconcile)
      : null;
  const runObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries.some(
              (entry) => entry.target === root && entry.isIntersecting,
            );
            reconcile();
          },
          { rootMargin: RUN_ROOT_MARGIN, threshold: 0.01 },
        )
      : null;

  const unsubscribeMotion =
    typeof motionPreference.subscribe === "function"
      ? motionPreference.subscribe(
          ({ allowed } = {}) => {
            motionAllowed = allowed === true;
            reconcile();
          },
          { immediate: false },
        )
      : noop;

  document.addEventListener("visibilitychange", reconcile, { signal });
  accordionObserver?.observe(accordionHeader, {
    attributes: true,
    attributeFilter: ["aria-expanded"],
  });
  runObserver?.observe(root);

  // Exactly one initial reconciliation. The old code also received an
  // immediate motion callback and could start two concurrent WebGL mounts.
  reconcile();

  const api = Object.freeze({
    refresh() {
      activeExperience?.refresh();
    },
    preload() {
      if (motionAllowed && !failureLocked) {
        void preloadJesteiThemeOrganismAssets().catch(noop);
        reconcile();
      }
    },
    pause() {
      externallyPaused = true;
      reconcile();
    },
    resume() {
      externallyPaused = false;
      reconcile();
    },
    destroy() {
      if (destroyed) return;

      destroyed = true;
      generation += 1;
      cancelRetry();
      abortController.abort();
      unsubscribeMotion();
      accordionObserver?.disconnect();
      runObserver?.disconnect();
      experiencePromise = null;
      disposeActiveExperience();
      track.reset();
      root.dataset.motionPreference = "reduce";
      setPresentationState("static");
      delete root[ORGANISM_DESTROY];
    },
  });

  root[ORGANISM_DESTROY] = api.destroy;
  return api;
}

export function createJesteiThemeOrganisms({ root = document, motion } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") return null;

  const instances = Array.from(
    root.querySelectorAll(
      '[data-jestei-theme-organism][data-jestei-theme-instance="inline"]',
    ),
  )
    .map((element) => createJesteiThemeOrganism({ root: element, motion }))
    .filter(Boolean);

  return Object.freeze({
    refresh() {
      instances.forEach((instance) => instance.refresh());
    },
    preload() {
      instances.forEach((instance) => instance.preload());
    },
    pause() {
      instances.forEach((instance) => instance.pause());
    },
    resume() {
      instances.forEach((instance) => instance.resume());
    },
    destroy() {
      instances.splice(0).reverse().forEach((instance) => instance.destroy());
    },
  });
}
