import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STYLE_ID = "logo-inspector-3d-styles";
const CAMERA_DISTANCE = 7.8;
const IDLE_SPIN_SPEED = 0.42;
const DRAG_ROTATE_SPEED = 0.008;
const RETURN_EASE = 0.08;
const INTRO_SCALE_MS = 820;
const INTRO_START_SCALE = 0.84;
const INTRO_OVERSHOOT_SCALE = 1.045;
const INTRO_TARGET_Z = 0.95;
const INTRO_ROTATION_DRIFT = 0.035;
const INTRO_STAGGER_MS = 90;
const WHITE_BACKGROUND = "#ffffff";

const DEFAULT_ASSETS = {
  model: "./logo.glb",
  poster: "/assets/media/cases/jesteipool/01-logo/01/02.webp",
};

const DEFAULT_VARIANTS = [
  {
    id: "club",
    token: "клубные диджеи",
    color: "#E18200",
  },
  {
    id: "event",
    token: "ивент диджеи",
    color: "#D1E231",
  },
  {
    id: "pro",
    token: "Эксклюзивы",
    color: "#157AFF",
  },
];

const DISPLAY_VARIANT_IDS = ["pro", "club", "event"];

function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .logo-inspector-3d {
      position: relative;
      display: block;
      width: 100%;
      min-width: 0;
      height: clamp(20rem, 44vw, 38rem);
      min-height: min(22rem, 72vh);
      max-height: min(38rem, 76vh);
      overflow: hidden;
      contain: layout paint;
      isolation: isolate;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: #ffffff;
      color: #111111;
      font-family: "Rubik", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-rendering: geometricPrecision;
    }

    .logo-inspector-3d__poster {
      position: absolute;
      z-index: 20;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #ffffff;
      opacity: 1;
      visibility: visible;
      pointer-events: none;
      user-select: none;
      transition:
        opacity 240ms ease,
        visibility 240ms ease;
    }

    .logo-inspector-3d.is-3d-ready .logo-inspector-3d__poster {
      opacity: 0;
      visibility: hidden;
    }

    .logo-inspector-3d.is-3d-fallback .logo-inspector-3d__poster {
      opacity: 1;
      visibility: visible;
    }

    .logo-inspector-3d__canvas {
      position: absolute;
      z-index: 1;
      inset: 0;
      min-width: 0;
      background: #ffffff;
      cursor: default;
      touch-action: none;
      user-select: none;
    }

    .logo-inspector-3d__canvas.is-hovering {
      cursor: grab;
    }

    .logo-inspector-3d__canvas.is-dragging {
      cursor: grabbing;
    }

    .logo-inspector-3d__canvas canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      max-height: 100%;
    }

    .logo-inspector-3d__status {
      position: absolute;
      z-index: 7;
      inset-block-start: 1rem;
      inset-inline-end: 1rem;
      max-width: min(22rem, calc(100% - 2rem));
      padding: 0.4rem 0.58rem 0.45rem;
      border: 1px solid rgba(150, 0, 0, 0.32);
      border-radius: 999px;
      color: #7a1111;
      background: rgba(255, 244, 244, 0.94);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
      font-size: 0.7rem;
      font-weight: 650;
      line-height: 1;
      pointer-events: none;
      backdrop-filter: blur(14px);
    }

    .logo-inspector-3d__status[hidden] {
      display: none;
    }

    @media (max-width: 56rem) {
      .logo-inspector-3d {
        height: clamp(34rem, 104vw, 48rem);
        max-height: none;
      }
    }
  `;


  style.textContent += `\n    /* logo-inspector-fit-v4 */
    .jestei-chapter-hero__media--logo,
    .jestei-chapter-hero__media--logo.media,
    .jestei-chapter-hero__media--logo [data-visual-demo^="logo-inspector"],
    .jestei-chapter-hero__media--logo [data-visual-demo*="logo-inspector"] {
      overflow: visible;
      min-width: 0;
      max-width: none;
    }

    .logo-inspector-3d {
      height: clamp(24rem, 48vw, 40rem);
      min-height: clamp(24rem, 62svh, 34rem);
      max-height: min(42rem, 82svh);
      overflow: hidden;
      contain: layout;
      border: 0;
      border-radius: 0;
      background: #ffffff;
    }

    .logo-inspector-3d__canvas {
      position: absolute;
      inset-block: 0;
      inset-inline: 0;
      width: auto;
      height: 100%;
      overflow: visible;
    }

    .logo-inspector-3d__canvas canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    @media (min-width: 721px) and (max-width: 1180px) {
      .logo-inspector-3d__canvas {
        inset-inline: calc(clamp(2rem, 8vw, 6rem) * -1);
      }
    }

    @media (max-width: 720px) {
      .logo-inspector-3d {
        height: clamp(25rem, 78svh, 40rem);
        min-height: clamp(24rem, 70svh, 34rem);
      }

      .logo-inspector-3d__canvas {
        inset-inline: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, progress) {
  return from + (to - from) * progress;
}

function easeOutCubic(progress) {
  const p = clamp(progress, 0, 1);
  return 1 - Math.pow(1 - p, 3);
}

function createPosterImage(src) {
  if (!src) {
    return null;
  }

  const image = document.createElement("img");
  image.className = "logo-inspector-3d__poster";
  image.alt = "";
  image.decoding = "async";
  image.loading = "eager";
  image.draggable = false;
  image.src = src;
  image.dataset.logoInspectorPoster = src;

  return image;
}

function setLogoInspectorReady(root) {
  root.classList.remove("is-3d-fallback");
  root.classList.add("is-3d-ready");
  delete root.dataset.fallbackReason;
}

function setLogoInspectorFallback(root, reason = "fallback") {
  root.classList.remove("is-3d-ready");
  root.classList.add("is-3d-fallback");
  root.dataset.fallbackReason = reason;
}

function traverseMeshes(object, callback) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      callback(child);
    }
  });
}

function disposeMaterial(material, textureCache, materialCache) {
  if (!material || materialCache.has(material)) {
    return;
  }

  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture && !textureCache.has(value)) {
      textureCache.add(value);
      value.dispose();
    }
  }

  materialCache.add(material);
  material.dispose();
}

function disposeObjectResources(object, cache = {}) {
  const geometries = cache.geometries || new Set();
  const textures = cache.textures || new Set();
  const materials = cache.materials || new Set();

  traverseMeshes(object, (mesh) => {
    if (mesh.geometry && !geometries.has(mesh.geometry)) {
      geometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) =>
        disposeMaterial(material, textures, materials),
      );
    } else {
      disposeMaterial(mesh.material, textures, materials);
    }
  });

  cache.geometries = geometries;
  cache.textures = textures;
  cache.materials = materials;

  return cache;
}

function centerAndScaleObject(object, targetSize = 2.35) {
  object.updateWorldMatrix(true, true);

  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const scale = targetSize / maxDimension;

  object.position.sub(center);
  object.scale.multiplyScalar(scale);
  object.updateWorldMatrix(true, true);
}

function applyVariantColor(root, colorValue, logoGroup) {
  const color = new THREE.Color(colorValue);

  traverseMeshes(root, (mesh) => {
    mesh.geometry?.computeVertexNormals?.();
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.logoGroup = logoGroup;
    mesh.material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.34,
      metalness: 0.64,
      clearcoat: 0.42,
      clearcoatRoughness: 0.36,
      envMapIntensity: 1.24,
      side: THREE.FrontSide,
    });
  });
}

function createVariantLogo(sourceRoot, variant, index) {
  const group = new THREE.Group();
  const root = sourceRoot.clone(true);

  group.name = `logo-${variant.id}`;
  group.userData.variant = variant;
  group.userData.index = index;
  group.userData.baseRotationX = 0.18;
  group.userData.baseRotationY = -0.2 + index * 0.2;
  group.userData.baseRotationZ = -0.08;
  group.userData.hasManualRotation = false;

  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);

  applyVariantColor(root, variant.color, group);
  group.add(root);
  group.rotation.set(0.18, -0.2, -0.08);

  return group;
}

async function loadModel(modelUrl) {
  if (!modelUrl) {
    throw new Error("logo inspector model url is missing");
  }

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath("/draco/");
  dracoLoader.setDecoderConfig({ type: "wasm" });
  loader.setDRACOLoader(dracoLoader);

  try {
    const gltf = await loader.loadAsync(modelUrl);
    return gltf.scene;
  } finally {
    dracoLoader.dispose();
  }
}

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  return renderer;
}

function getOrderedVariants(variants) {
  return DISPLAY_VARIANT_IDS.map((id) =>
    variants.find((item) => item.id === id),
  ).filter(Boolean);
}

export function createLogoInspector3D(target, options = {}) {
  injectStyles();

  const host =
    typeof target === "string" ? document.querySelector(target) : target;

  if (!host) {
    throw new Error("createLogoInspector3D: target not found");
  }

  const {
    modelUrl = DEFAULT_ASSETS.model,
    variants = DEFAULT_VARIANTS,
    assets = {},
  } = options;
  const assetUrls = {
    ...DEFAULT_ASSETS,
    ...assets,
    model: assets.model || modelUrl || DEFAULT_ASSETS.model,
  };
  const orderedVariants = getOrderedVariants(variants);

  host.textContent = "";

  const root = document.createElement("section");
  root.className = "logo-inspector-3d";
  root.style.background = WHITE_BACKGROUND;

  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-3d__canvas";

  const status = document.createElement("div");
  status.className = "logo-inspector-3d__status";
  status.hidden = true;

  const poster = createPosterImage(assetUrls.poster);

  root.append(canvasHost, status);

  if (poster) {
    root.appendChild(poster);
  }

  host.appendChild(root);

  let renderer;

  try {
    renderer = createRenderer();
  } catch (error) {
    console.error(
      "[logo inspector] WebGL renderer failed, showing poster fallback",
      error,
    );
    setLogoInspectorFallback(root, "renderer-error");

    return {
      element: root,
      dispose() {
        root.remove();
      },
    };
  }

  canvasHost.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WHITE_BACKGROUND);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 220);
  camera.position.set(0, 0, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmremGenerator.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture;
  scene.environment = environmentTexture;
  scene.add(new THREE.AmbientLight("#ffffff", 0.44));

  const key = new THREE.DirectionalLight("#ffffff", 2.35);
  const fill = new THREE.DirectionalLight("#e7eef8", 0.84);
  const rim = new THREE.DirectionalLight("#fff5df", 1.16);

  key.position.set(4.8, 4.4, 5);
  fill.position.set(-4, 1.8, 3.4);
  rim.position.set(-4.4, 5.2, -4.8);
  scene.add(key, fill, rim);

  const stage = new THREE.Group();
  scene.add(stage);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let sourceRoot = null;
  let hoveredLogo = null;
  let draggedLogo = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let raf = 0;
  let destroyed = false;
  let lastTime = performance.now();
  let introStartTime = 0;
  let introComplete = false;

  const setStatus = (text) => {
    status.textContent = text;
    status.hidden = !text;
  };

  const getLogoFromObject = (object) => {
    let current = object;

    while (current) {
      if (current.userData?.variant) {
        return current;
      }

      if (current.userData?.logoGroup) {
        return current.userData.logoGroup;
      }

      current = current.parent;
    }

    return null;
  };

  const pickLogo = (event) => {
    if (!introComplete && introStartTime > 0) {
      return null;
    }

    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return null;
    }

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(stage.children, true);
    return intersections.length
      ? getLogoFromObject(intersections[0].object)
      : null;
  };

  const updateHover = (event) => {
    if (draggedLogo) {
      return;
    }

    hoveredLogo = pickLogo(event);
    canvasHost.classList.toggle("is-hovering", Boolean(hoveredLogo));
  };

  const clearHover = () => {
    if (draggedLogo) {
      return;
    }

    hoveredLogo = null;
    canvasHost.classList.remove("is-hovering");
  };

  const handlePointerDown = (event) => {
    const logo = pickLogo(event);

    if (!logo) {
      return;
    }

    event.preventDefault();

    draggedLogo = logo;
    hoveredLogo = logo;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    logo.userData.hasManualRotation = true;

    canvasHost.classList.add("is-hovering", "is-dragging");
    renderer.domElement.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!draggedLogo) {
      updateHover(event);
      return;
    }

    event.preventDefault();

    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    draggedLogo.rotation.y += dx * DRAG_ROTATE_SPEED;
    draggedLogo.rotation.x = clamp(
      draggedLogo.rotation.x + dy * DRAG_ROTATE_SPEED,
      -Math.PI * 0.62,
      Math.PI * 0.62,
    );
  };

  const handlePointerUp = (event) => {
    if (!draggedLogo) {
      return;
    }

    renderer.domElement.releasePointerCapture?.(event.pointerId);
    draggedLogo = null;
    canvasHost.classList.remove("is-dragging");
    updateHover(event);
  };

  const layoutLogos = () => {
    const width = Math.max(canvasHost.clientWidth || root.clientWidth || 1, 1);
    const height = Math.max(
      canvasHost.clientHeight || root.clientHeight || 1,
      1,
    );
    const aspect = width / height;
    const tight = aspect < 1.35;
    const compact = width < 860 || aspect < 1.62;
    const roomy = width >= 1100 && aspect >= 1.82;

    const fov = clamp(tight ? 39 : compact ? 36 : 32, 30, 40);
    const cameraZ = clamp(
      CAMERA_DISTANCE + (tight ? 0.7 : compact ? 0.36 : 0),
      CAMERA_DISTANCE,
      8.7,
    );

    const preferredScale = roomy ? 0.9 : compact ? 0.82 : 0.86;
    const visibleWidth =
      2 *
      Math.tan(THREE.MathUtils.degToRad(fov * 0.5)) *
      Math.max(cameraZ - INTRO_TARGET_Z, 1) *
      aspect;
    const estimatedLogoWidth = 1.48;
    const targetGap = tight ? 0.3 : compact ? 0.4 : 0.56;
    const fitScale =
      (visibleWidth * 0.9 - targetGap * 2) / (estimatedLogoWidth * 3);
    const scale = clamp(
      Math.min(preferredScale, fitScale),
      tight ? 0.66 : 0.72,
      roomy ? 0.92 : 0.86,
    );
    const spacing = clamp(
      estimatedLogoWidth * scale + targetGap,
      tight ? 1.46 : 1.62,
      roomy ? 2.58 : 2.28,
    );

    camera.aspect = aspect;
    camera.fov = fov;
    camera.position.z = cameraZ;
    camera.updateProjectionMatrix();

    stage.children.forEach((logo, index) => {
      const side = index - 1;
      const targetPosition = new THREE.Vector3(
        side * spacing,
        0,
        INTRO_TARGET_Z,
      );

      logo.userData.targetPosition = targetPosition;
      logo.userData.targetScale = scale;

      if (!logo.userData.layoutReady) {
        logo.position.copy(targetPosition);
        logo.scale.setScalar(scale * INTRO_START_SCALE);
        logo.visible = true;
        logo.userData.layoutReady = true;
        return;
      }

      logo.position.copy(targetPosition);

      if (introComplete) {
        logo.scale.setScalar(scale);
      }
    });
  };

  const updateLogoIntro = (time) => {
    if (!introStartTime || introComplete) {
      return 1;
    }

    const elapsed = time - introStartTime;
    const progress = clamp(elapsed / INTRO_SCALE_MS, 0, 1);

    stage.children.forEach((logo, index) => {
      const targetPosition = logo.userData.targetPosition;

      if (!targetPosition) {
        return;
      }

      const localElapsed = Math.max(0, elapsed - index * INTRO_STAGGER_MS);
      const localProgress = clamp(localElapsed / INTRO_SCALE_MS, 0, 1);
      const localEased = easeOutCubic(localProgress);
      const overshoot =
        Math.sin(localEased * Math.PI) * (INTRO_OVERSHOOT_SCALE - 1);
      const currentScale = lerp(INTRO_START_SCALE, 1, localEased) + overshoot;
      const targetScale = logo.userData.targetScale || 1;
      const side = index - 1;

      logo.visible = true;
      logo.position.copy(targetPosition);
      logo.scale.setScalar(targetScale * currentScale);

      if (!logo.userData.hasManualRotation) {
        logo.rotation.x =
          logo.userData.baseRotationX +
          Math.sin((1 - localEased) * Math.PI) * INTRO_ROTATION_DRIFT;
        logo.rotation.y =
          logo.userData.baseRotationY +
          side * Math.sin((1 - localEased) * Math.PI) * INTRO_ROTATION_DRIFT;
        logo.rotation.z = logo.userData.baseRotationZ;
      }
    });

    if (progress >= 1) {
      introComplete = true;

      stage.children.forEach((logo) => {
        logo.visible = true;

        if (logo.userData.targetPosition) {
          logo.position.copy(logo.userData.targetPosition);
        }

        if (logo.userData.targetScale) {
          logo.scale.setScalar(logo.userData.targetScale);
        }

        if (!logo.userData.hasManualRotation) {
          logo.rotation.set(
            logo.userData.baseRotationX,
            logo.userData.baseRotationY,
            logo.userData.baseRotationZ,
          );
        }
      });
    }

    return progress;
  };

  const resize = () => {
    const bounds = canvasHost.getBoundingClientRect();
    const width = Math.max(
      Math.floor(bounds.width || canvasHost.clientWidth || 1),
      1,
    );
    const height = Math.max(
      Math.floor(bounds.height || canvasHost.clientHeight || 1),
      1,
    );

    renderer.setSize(width, height, false);
    layoutLogos();
  };

  const renderLoop = (time) => {
    if (destroyed) {
      return;
    }

    const delta = clamp((time - lastTime) / 1000, 0, 0.05);
    lastTime = time;

    const introProgress = updateLogoIntro(time);
    const isIntroRunning = introProgress < 1;

    stage.children.forEach((logo) => {
      const isPausedByUser = logo === hoveredLogo || logo === draggedLogo;

      if (!isPausedByUser && !isIntroRunning) {
        logo.rotation.y += delta * IDLE_SPIN_SPEED;
      }

      if (
        !logo.userData.hasManualRotation &&
        !isPausedByUser &&
        !isIntroRunning
      ) {
        logo.rotation.x +=
          (logo.userData.baseRotationX - logo.rotation.x) * RETURN_EASE;
        logo.rotation.z +=
          (logo.userData.baseRotationZ - logo.rotation.z) * RETURN_EASE;
      }
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  resizeObserver.observe(canvasHost);

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("pointercancel", handlePointerUp);
  renderer.domElement.addEventListener("pointerleave", clearHover);

  loadModel(assetUrls.model)
    .then((loadedRoot) => {
      if (destroyed) {
        disposeObjectResources(loadedRoot);
        return;
      }

      sourceRoot = loadedRoot;
      centerAndScaleObject(sourceRoot, 2.35);

      orderedVariants.slice(0, 3).forEach((variant, index) => {
        stage.add(createVariantLogo(sourceRoot, variant, index));
      });

      layoutLogos();

      stage.children.forEach((logo) => {
        logo.visible = true;
      });

      introStartTime = performance.now();
      introComplete = false;
      setLogoInspectorReady(root);
    })
    .catch((error) => {
      console.error(
        "[logo inspector] model failed, showing poster fallback",
        error,
      );

      if (destroyed) {
        return;
      }

      setStatus("");
      setLogoInspectorFallback(root, "model-load-error");
    });

  resize();
  raf = requestAnimationFrame(renderLoop);

  return {
    element: root,
    dispose() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();

      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", clearHover);

      const cache = {};
      disposeObjectResources(stage, cache);

      if (sourceRoot) {
        disposeObjectResources(sourceRoot, cache);
      }

      environmentTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      root.remove();
    },
  };
}
