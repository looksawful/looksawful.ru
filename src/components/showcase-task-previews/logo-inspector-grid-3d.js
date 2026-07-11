import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STYLE_ID = "logo-inspector-grid-3d-styles";
const BACKGROUND = "#ffffff";
const CAMERA_DISTANCE = 8.2;
const TARGET_Z = 0.72;
const REVEAL_DURATION_MS = 760;
const REVEAL_STAGGER_MS = 560;
const REVEAL_START_SCALE = 0.42;
const IDLE_SPIN_SPEED = 0.38;
const DRAG_ROTATE_SPEED = 0.008;
const RETURN_EASE = 0.08;

const DEFAULT_ASSETS = {
  model: "./logo.glb",
  poster: "/assets/media/cases/jesteipool/01-logo/01/02.webp",
};

const DEFAULT_VARIANTS = [
  { id: "pro", token: "эксклюзивы", color: "#157AFF" },
  { id: "club", token: "клубные диджеи", color: "#F18200" },
  { id: "event", token: "ивент-диджеи", color: "#D1E231" },
  { id: "experimental", token: "экспериментальные инструменты", color: "#B2A1EA" },
];

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .logo-inspector-grid-3d {
      position: relative;
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
      block-size: clamp(34rem, 58vw, 48rem);
      min-block-size: 34rem;
      overflow: hidden;
      contain: layout paint;
      isolation: isolate;
      border: 0;
      background: ${BACKGROUND};
    }

    .logo-inspector-grid-3d__canvas {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: ${BACKGROUND};
      cursor: default;
      touch-action: none;
      user-select: none;
    }

    .logo-inspector-grid-3d__canvas.is-hovering {
      cursor: grab;
    }

    .logo-inspector-grid-3d__canvas.is-dragging {
      cursor: grabbing;
    }

    .logo-inspector-grid-3d__canvas canvas {
      display: block;
      inline-size: 100%;
      block-size: 100%;
      max-inline-size: 100%;
      max-block-size: 100%;
    }

    .logo-inspector-grid-3d__poster {
      position: absolute;
      z-index: 2;
      inset: 0;
      display: block;
      inline-size: 100%;
      block-size: 100%;
      object-fit: contain;
      background: ${BACKGROUND};
      opacity: 1;
      visibility: visible;
      pointer-events: none;
      transition: opacity 220ms ease, visibility 220ms ease;
    }

    .logo-inspector-grid-3d.is-3d-ready .logo-inspector-grid-3d__poster {
      opacity: 0;
      visibility: hidden;
    }

    .logo-inspector-grid-3d.is-3d-fallback .logo-inspector-grid-3d__poster {
      opacity: 1;
      visibility: visible;
    }

    @media (max-width: 56rem) {
      .logo-inspector-grid-3d {
        block-size: clamp(34rem, 86vw, 44rem);
      }
    }

    @media (max-width: 43rem) {
      .logo-inspector-grid-3d {
        block-size: clamp(34rem, 126vw, 46rem);
        min-block-size: 34rem;
      }
    }
  `;
  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  const progress = clamp(value, 0, 1);
  return 1 - Math.pow(1 - progress, 3);
}

function easeOutBack(value) {
  const progress = clamp(value, 0, 1);
  const c1 = 1.12;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
}

function traverseMeshes(object, callback) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) callback(child);
  });
}

function disposeMaterial(material, caches) {
  if (!material || caches.materials.has(material)) return;

  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture && !caches.textures.has(value)) {
      caches.textures.add(value);
      value.dispose();
    }
  });

  caches.materials.add(material);
  material.dispose();
}

function disposeObjectResources(object, caches = {
  geometries: new Set(),
  materials: new Set(),
  textures: new Set(),
}) {
  traverseMeshes(object, (mesh) => {
    if (mesh.geometry && !caches.geometries.has(mesh.geometry)) {
      caches.geometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => disposeMaterial(material, caches));
    } else {
      disposeMaterial(mesh.material, caches);
    }
  });

  return caches;
}

function centerAndScaleObject(object, targetSize = 2.35) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);

  object.position.sub(center);
  object.scale.multiplyScalar(targetSize / maxDimension);
  object.updateWorldMatrix(true, true);
}

function applyVariantMaterial(root, variant, logoGroup) {
  const color = new THREE.Color(variant.color);

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
  const model = sourceRoot.clone(true);

  group.name = `logo-${variant.id}`;
  group.userData.variant = variant;
  group.userData.index = index;
  group.userData.baseRotationX = 0.16;
  group.userData.baseRotationY = -0.28 + index * 0.18;
  group.userData.baseRotationZ = index % 2 === 0 ? -0.055 : 0.055;
  group.userData.hasManualRotation = false;
  group.userData.layoutReady = false;

  applyVariantMaterial(model, variant, group);
  group.add(model);
  group.rotation.set(
    group.userData.baseRotationX,
    group.userData.baseRotationY,
    group.userData.baseRotationZ,
  );
  group.visible = false;

  return group;
}

async function loadModel(modelUrl) {
  if (!modelUrl) throw new Error("logo inspector model url is missing");

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

function createPoster(src) {
  if (!src) return null;

  const image = document.createElement("img");
  image.className = "logo-inspector-grid-3d__poster";
  image.alt = "";
  image.decoding = "async";
  image.loading = "eager";
  image.draggable = false;
  image.src = src;
  return image;
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

export function createLogoInspector3D(target, options = {}) {
  injectStyles();

  const host = typeof target === "string" ? document.querySelector(target) : target;
  if (!host) throw new Error("createLogoInspector3D: target not found");

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
  const orderedVariants = DEFAULT_VARIANTS.map((fallback) =>
    variants.find((variant) => variant.id === fallback.id) || fallback,
  );

  host.textContent = "";

  const root = document.createElement("section");
  root.className = "logo-inspector-grid-3d";

  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-grid-3d__canvas";

  const poster = createPoster(assetUrls.poster);
  root.append(canvasHost);
  if (poster) root.append(poster);
  host.append(root);

  let renderer;
  try {
    renderer = createRenderer();
  } catch (error) {
    console.error("[logo inspector grid] renderer failed", error);
    root.classList.add("is-3d-fallback");
    return { element: root, dispose: () => root.remove() };
  }

  canvasHost.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 220);
  camera.position.set(0, 0, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environmentTexture;
  scene.add(new THREE.AmbientLight("#ffffff", 0.46));

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
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

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

  const getLogoFromObject = (object) => {
    let current = object;
    while (current) {
      if (current.userData?.variant) return current;
      if (current.userData?.logoGroup) return current.userData.logoGroup;
      current = current.parent;
    }
    return null;
  };

  const pickLogo = (event) => {
    if (!introComplete) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(stage.children, true);
    return intersections.length ? getLogoFromObject(intersections[0].object) : null;
  };

  const clearHover = () => {
    if (draggedLogo) return;
    hoveredLogo = null;
    canvasHost.classList.remove("is-hovering");
  };

  const updateHover = (event) => {
    if (draggedLogo) return;
    hoveredLogo = pickLogo(event);
    canvasHost.classList.toggle("is-hovering", Boolean(hoveredLogo));
  };

  const handlePointerDown = (event) => {
    const logo = pickLogo(event);
    if (!logo) return;

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
    if (!draggedLogo) return;
    renderer.domElement.releasePointerCapture?.(event.pointerId);
    draggedLogo = null;
    canvasHost.classList.remove("is-dragging");
    updateHover(event);
  };

  const layoutLogos = () => {
    const width = Math.max(canvasHost.clientWidth || root.clientWidth || 1, 1);
    const height = Math.max(canvasHost.clientHeight || root.clientHeight || 1, 1);
    const aspect = width / height;
    const compact = width < 760 || aspect < 1.2;
    const fov = compact ? 39 : 34;
    const cameraZ = compact ? 8.65 : CAMERA_DISTANCE;
    const distance = Math.max(cameraZ - TARGET_Z, 1);
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(fov * 0.5)) * distance;
    const visibleWidth = visibleHeight * aspect;
    const estimatedWidth = 1.52;
    const estimatedHeight = 1.46;
    const gapX = compact ? 0.24 : 0.48;
    const gapY = compact ? 0.28 : 0.5;
    const fitScaleX = (visibleWidth * 0.86 - gapX) / (estimatedWidth * 2);
    const fitScaleY = (visibleHeight * 0.82 - gapY) / (estimatedHeight * 2);
    const preferredScale = compact ? 0.72 : 0.9;
    const scale = clamp(Math.min(preferredScale, fitScaleX, fitScaleY), compact ? 0.5 : 0.62, 0.94);
    const spacingX = estimatedWidth * scale + gapX;
    const spacingY = estimatedHeight * scale + gapY;

    camera.aspect = aspect;
    camera.fov = fov;
    camera.position.z = cameraZ;
    camera.updateProjectionMatrix();

    stage.children.forEach((logo, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const targetPosition = new THREE.Vector3(
        (column === 0 ? -0.5 : 0.5) * spacingX,
        (row === 0 ? 0.5 : -0.5) * spacingY,
        TARGET_Z,
      );

      logo.userData.targetPosition = targetPosition;
      logo.userData.targetScale = scale;

      if (!logo.userData.layoutReady) {
        logo.position.set(0, 0, TARGET_Z);
        logo.scale.setScalar(scale * REVEAL_START_SCALE);
        logo.visible = false;
        logo.userData.layoutReady = true;
        return;
      }

      if (introComplete) {
        logo.position.copy(targetPosition);
        logo.scale.setScalar(scale);
      }
    });
  };

  const finishIntro = () => {
    introComplete = true;
    stage.children.forEach((logo) => {
      logo.visible = true;
      logo.position.copy(logo.userData.targetPosition);
      logo.scale.setScalar(logo.userData.targetScale);
      if (!logo.userData.hasManualRotation) {
        logo.rotation.set(
          logo.userData.baseRotationX,
          logo.userData.baseRotationY,
          logo.userData.baseRotationZ,
        );
      }
    });
  };

  const updateIntro = (time) => {
    if (!introStartTime || introComplete) return 1;
    if (reducedMotion) {
      finishIntro();
      return 1;
    }

    const elapsed = time - introStartTime;
    const totalDuration = REVEAL_DURATION_MS + Math.max(0, stage.children.length - 1) * REVEAL_STAGGER_MS;

    stage.children.forEach((logo, index) => {
      const localElapsed = elapsed - index * REVEAL_STAGGER_MS;
      if (localElapsed <= 0) {
        logo.visible = false;
        return;
      }

      const progress = clamp(localElapsed / REVEAL_DURATION_MS, 0, 1);
      const moveProgress = easeOutCubic(progress);
      const scaleProgress = easeOutBack(progress);
      const targetPosition = logo.userData.targetPosition;
      const targetScale = logo.userData.targetScale || 1;

      logo.visible = true;
      logo.position.set(
        THREE.MathUtils.lerp(0, targetPosition.x, moveProgress),
        THREE.MathUtils.lerp(0, targetPosition.y, moveProgress),
        TARGET_Z,
      );
      logo.scale.setScalar(
        targetScale * THREE.MathUtils.lerp(REVEAL_START_SCALE, 1, scaleProgress),
      );

      if (!logo.userData.hasManualRotation) {
        const rotationDrift = (1 - moveProgress) * (index % 2 === 0 ? -0.22 : 0.22);
        logo.rotation.x = logo.userData.baseRotationX + (1 - moveProgress) * 0.08;
        logo.rotation.y = logo.userData.baseRotationY + rotationDrift;
        logo.rotation.z = logo.userData.baseRotationZ;
      }
    });

    if (elapsed >= totalDuration) finishIntro();
    return clamp(elapsed / totalDuration, 0, 1);
  };

  const resize = () => {
    const bounds = canvasHost.getBoundingClientRect();
    const width = Math.max(Math.floor(bounds.width || canvasHost.clientWidth || 1), 1);
    const height = Math.max(Math.floor(bounds.height || canvasHost.clientHeight || 1), 1);
    renderer.setSize(width, height, false);
    layoutLogos();
  };

  const renderLoop = (time) => {
    if (destroyed) return;

    const delta = clamp((time - lastTime) / 1000, 0, 0.05);
    lastTime = time;
    const introProgress = updateIntro(time);
    const introRunning = introProgress < 1;

    stage.children.forEach((logo) => {
      const paused = logo === hoveredLogo || logo === draggedLogo;
      if (!paused && !introRunning && logo.visible) {
        logo.rotation.y += delta * IDLE_SPIN_SPEED;
      }

      if (!logo.userData.hasManualRotation && !paused && !introRunning) {
        logo.rotation.x += (logo.userData.baseRotationX - logo.rotation.x) * RETURN_EASE;
        logo.rotation.z += (logo.userData.baseRotationZ - logo.rotation.z) * RETURN_EASE;
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
      orderedVariants.slice(0, 4).forEach((variant, index) => {
        stage.add(createVariantLogo(sourceRoot, variant, index));
      });

      layoutLogos();
      introStartTime = performance.now();
      introComplete = false;
      updateIntro(introStartTime + 1);
      renderer.render(scene, camera);
      root.classList.add("is-3d-ready");
    })
    .catch((error) => {
      console.error("[logo inspector grid] model failed", error);
      if (!destroyed) root.classList.add("is-3d-fallback");
    });

  resize();
  raf = requestAnimationFrame(renderLoop);

  return {
    element: root,
    dispose() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", clearHover);

      const caches = {
        geometries: new Set(),
        materials: new Set(),
        textures: new Set(),
      };
      disposeObjectResources(stage, caches);
      if (sourceRoot) disposeObjectResources(sourceRoot, caches);
      environmentTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      root.remove();
    },
  };
}
