import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STYLE_ID = "logo-inspector-3d-styles";

const DEFAULT_VARIANTS = [
  {
    id: "club",
    theme: "",
    token: "клубные диджеи",
    hex: "#E18200",
    color: "#E18200",
    palette: ["#FFE3B1", "#FFBE4A", "#E18200", "#B76600", "#7A4200", "#2A1600"],
  },
  {
    id: "event",
    theme: "",
    token: "ивент диджеи",
    hex: "#D1E231",
    color: "#D1E231",
    palette: ["#F4FFB8", "#EAF85A", "#D1E231", "#A1B314", "#5E6A08", "#1A2000"],
  },
  {
    id: "pro",
    theme: "",
    token: "Эксклюзивы",
    hex: "#157AFF",
    color: "#157AFF",
    palette: ["#D8ECFF", "#74B8FF", "#157AFF", "#0D55C8", "#082F78", "#050C22"],
  },
];

const CAMERA_DISTANCE = 8;
const IDLE_SPIN_SPEED = 0.42;
const DRAG_ROTATE_SPEED = 0.008;
const RETURN_EASE = 0.08;
const CANVAS_BACKGROUND = "#ffffff";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

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
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      color: #111111;
      background: #ffffff;
      font-family:
        "Rubik",
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      text-rendering: geometricPrecision;
    }

    .logo-inspector-3d__canvas {
      position: absolute;
      z-index: 1;
      inset: 0;
      min-width: 0;
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

    .logo-inspector-3d__overlay {
      position: absolute;
      z-index: 2;
      inset: 0;
      display: grid;
      align-items: stretch;
      padding: clamp(1.2rem, 2.4vw, 2rem);
      pointer-events: none;
    }

    .logo-inspector-3d__columns {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: clamp(1rem, 2.4vw, 1.8rem);
      min-width: 0;
      min-height: 0;
    }

    .logo-inspector-3d__column {
      --accent: #111111;
      --gradient-start: #ffffff;
      --gradient-mid: #ffffff;
      --gradient-end: #ffffff;

      position: relative;
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border-radius: 18px;
    }

    .logo-inspector-3d__header {
      position: relative;
      z-index: 2;
      display: grid;
      justify-items: center;
      gap: 0.3rem;
      align-self: start;
      min-width: 0;
      padding-block-start: clamp(0.35rem, 0.9vw, 0.75rem);
      text-align: center;
    }

    .logo-inspector-3d__color-name {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      padding: 0.38rem 0.72rem 0.42rem;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 999px;
      color: #111111;
      background: rgba(255, 255, 255, 0.92);
      box-shadow:
        0 8px 22px rgba(0, 0, 0, 0.08),
        inset 0 -2px 0 color-mix(in srgb, var(--accent) 38%, transparent);
      font-size: clamp(1.02rem, 1.58vw, 1.5rem);
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0.035em;
      text-transform: uppercase;
      white-space: nowrap;
      backdrop-filter: blur(12px);
    }

    .logo-inspector-3d__theme {
      color: rgba(17, 17, 17, 0.72);
      font-size: clamp(0.66rem, 0.8vw, 0.82rem);
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .logo-inspector-3d__theme:empty {
      display: none;
    }

    .logo-inspector-3d__token-list {
      position: relative;
      z-index: 2;
      align-self: end;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.56rem 0.64rem;
      min-width: 0;
      padding: 0.8rem 0.9rem 1rem;
      margin-block-end: clamp(0.1rem, 0.35vw, 0.4rem);
    }

    .logo-inspector-3d__token-item {
      display: inline-flex;
      align-items: center;
      gap: 0.38rem;
      min-width: 0;
      padding: 0.38rem 0.6rem 0.4rem 0.46rem;
      border: 1px solid rgba(0, 0, 0, 0.24);
      border-radius: 999px;
      color: #111111;
      background: rgba(255, 255, 255, 0.94);
      box-shadow:
        0 7px 18px rgba(0, 0, 0, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
    }

    .logo-inspector-3d__dot {
      width: clamp(0.56rem, 0.72vw, 0.72rem);
      aspect-ratio: 1;
      flex: 0 0 auto;
      border: 1px solid rgba(0, 0, 0, 0.34);
      border-radius: 999px;
      background: var(--dot);
      box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.92),
        0 1px 4px rgba(0, 0, 0, 0.18);
    }

    .logo-inspector-3d__hex {
      color: #111111;
      font-size: clamp(0.52rem, 0.62vw, 0.66rem);
      font-weight: 650;
      line-height: 1;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .logo-inspector-3d__status {
      position: absolute;
      z-index: 4;
      inset-block-start: 16px;
      inset-inline-end: 16px;
      max-width: min(22rem, calc(100% - 32px));
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

      .logo-inspector-3d__overlay {
        padding: clamp(0.8rem, 3vw, 1.2rem);
      }

      .logo-inspector-3d__columns {
        gap: 0.5rem;
      }

      .logo-inspector-3d__color-name {
        padding: 0.3rem 0.52rem 0.34rem;
        font-size: clamp(0.72rem, 2.15vw, 1rem);
        letter-spacing: 0.025em;
      }

      .logo-inspector-3d__theme {
        font-size: clamp(0.48rem, 1.5vw, 0.62rem);
      }

      .logo-inspector-3d__token-list {
        gap: 0.34rem;
        padding: 0.55rem 0.25rem 0.7rem;
      }

      .logo-inspector-3d__token-item {
        gap: 0.26rem;
        padding: 0.26rem 0.42rem 0.28rem 0.34rem;
      }

      .logo-inspector-3d__dot {
        width: clamp(0.48rem, 1.5vw, 0.62rem);
      }

      .logo-inspector-3d__hex {
        font-size: clamp(0.42rem, 1.2vw, 0.52rem);
      }
    }
  `;

  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createFallbackMesh() {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.3, 72, 180));
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.2, 56, 140));
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 0.18));

  plate.position.set(1.45, -0.18, 0);
  group.add(outer, inner, plate);

  return group;
}

function traverseMeshes(object, callback) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) callback(child);
  });
}

function disposeMaterial(material, textureCache, materialCache) {
  if (!material || materialCache.has(material)) return;

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
      mesh.material.forEach((material) => disposeMaterial(material, textures, materials));
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
  group.rotation.set(group.userData.baseRotationX, group.userData.baseRotationY, group.userData.baseRotationZ);

  return group;
}

function createSimpleOverlay(variants) {
  const overlay = document.createElement("div");
  overlay.className = "logo-inspector-3d__overlay";

  const columns = document.createElement("div");
  columns.className = "logo-inspector-3d__columns";

  variants.slice(0, 3).forEach((variant) => {
    const column = document.createElement("div");
    column.className = "logo-inspector-3d__column";
    column.style.setProperty("--accent", variant.color);
    column.style.setProperty("--gradient-start", variant.palette[0]);
    column.style.setProperty("--gradient-mid", variant.palette[2]);
    column.style.setProperty("--gradient-end", variant.palette[5]);

    const header = document.createElement("div");
    header.className = "logo-inspector-3d__header";

    const colorName = document.createElement("span");
    colorName.className = "logo-inspector-3d__color-name";
    colorName.textContent = variant.token;

    const theme = document.createElement("span");
    theme.className = "logo-inspector-3d__theme";
    theme.textContent = variant.theme;

    header.append(colorName, theme);

    const tokenList = document.createElement("div");
    tokenList.className = "logo-inspector-3d__token-list";

    variant.palette.forEach((color) => {
      const token = document.createElement("span");
      token.className = "logo-inspector-3d__token-item";

      const dot = document.createElement("span");
      dot.className = "logo-inspector-3d__dot";
      dot.style.setProperty("--dot", color);

      const hex = document.createElement("span");
      hex.className = "logo-inspector-3d__hex";
      hex.textContent = color;

      token.append(dot, hex);
      tokenList.appendChild(token);
    });

    column.append(header, tokenList);
    columns.appendChild(column);
  });

  overlay.appendChild(columns);
  return overlay;
}

async function loadModel(modelUrl) {
  if (!modelUrl) return createFallbackMesh();

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

export function createLogoInspector3D(target, options = {}) {
  injectStyles();

  const host = typeof target === "string" ? document.querySelector(target) : target;

  if (!host) {
    throw new Error("createLogoInspector3D: target not found");
  }

  const { modelUrl = "./logo.glb", variants = DEFAULT_VARIANTS } = options;
  const background = CANVAS_BACKGROUND;

  host.textContent = "";

  const root = document.createElement("section");
  root.className = "logo-inspector-3d";
  root.style.background = background;

  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-3d__canvas";

  const overlay = createSimpleOverlay(variants);

  const status = document.createElement("div");
  status.className = "logo-inspector-3d__status";
  status.hidden = true;

  root.append(canvasHost, overlay, status);
  host.appendChild(root);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.OrthographicCamera(-3.3, 3.3, 1.9, -1.9, 0.1, 100);
  camera.position.set(0, 0, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environmentTexture;

  canvasHost.appendChild(renderer.domElement);

  const stage = new THREE.Group();
  stage.rotation.x = 0.24;
  stage.rotation.z = -0.04;
  scene.add(stage);

  scene.add(new THREE.AmbientLight("#ffffff", 0.44));

  const key = new THREE.DirectionalLight("#ffffff", 2.35);
  const fill = new THREE.DirectionalLight("#e7eef8", 0.84);
  const rim = new THREE.DirectionalLight("#fff5df", 1.16);

  key.position.set(4.8, 4.4, 5);
  fill.position.set(-4, 1.8, 3.4);
  rim.position.set(-4.4, 5.2, -4.8);
  scene.add(key, fill, rim);

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

  const setStatus = (text) => {
    status.textContent = text;
    status.hidden = !text;
  };

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
    const rect = renderer.domElement.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return null;
    }

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(stage.children, true);
    return intersections.length ? getLogoFromObject(intersections[0].object) : null;
  };

  const updateHover = (event) => {
    if (draggedLogo) return;

    hoveredLogo = pickLogo(event);
    canvasHost.classList.toggle("is-hovering", Boolean(hoveredLogo));
  };

  const clearHover = () => {
    if (draggedLogo) return;

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
    draggedLogo.rotation.x = clamp(draggedLogo.rotation.x + dy * DRAG_ROTATE_SPEED, -Math.PI * 0.62, Math.PI * 0.62);
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
    const height = Math.max(canvasHost.clientHeight || root.clientHeight || 1, 1);
    const aspect = width / height;
    const compact = width < 760;
    const viewWidth = compact ? 5.8 : 6.8;
    const viewHeight = viewWidth / Math.max(aspect, 0.48);

    camera.left = -viewWidth * 0.5;
    camera.right = viewWidth * 0.5;
    camera.top = viewHeight * 0.5;
    camera.bottom = -viewHeight * 0.5;
    camera.updateProjectionMatrix();

    const spacing = compact ? 1.78 : 2.16;
    const scale = compact ? 0.68 : 0.84;
    const y = compact ? 0.08 : 0.12;

    stage.children.forEach((logo, index) => {
      logo.position.set((index - 1) * spacing, y, 0);
      logo.scale.setScalar(scale);
    });
  };

  const resize = () => {
    const bounds = canvasHost.getBoundingClientRect();
    const width = Math.max(Math.floor(bounds.width || canvasHost.clientWidth || 1), 1);
    const height = Math.max(Math.floor(bounds.height || canvasHost.clientHeight || 1), 1);

    renderer.setSize(width, height, false);
    layoutLogos();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvasHost);

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("pointercancel", handlePointerUp);
  renderer.domElement.addEventListener("pointerleave", clearHover);

  const renderLoop = (time) => {
    if (destroyed) return;

    const delta = clamp((time - lastTime) / 1000, 0, 0.05);
    lastTime = time;

    stage.children.forEach((logo) => {
      const isPausedByUser = logo === hoveredLogo || logo === draggedLogo;

      if (!isPausedByUser) {
        logo.rotation.y += delta * IDLE_SPIN_SPEED;
      }

      if (!logo.userData.hasManualRotation && !isPausedByUser) {
        logo.rotation.x += (logo.userData.baseRotationX - logo.rotation.x) * RETURN_EASE;
        logo.rotation.z += (logo.userData.baseRotationZ - logo.rotation.z) * RETURN_EASE;
      }
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  };

  loadModel(modelUrl)
    .then((loadedRoot) => {
      if (destroyed) {
        disposeObjectResources(loadedRoot);
        return;
      }

      sourceRoot = loadedRoot;
      centerAndScaleObject(sourceRoot, 2.35);

      variants.slice(0, 3).forEach((variant, index) => {
        stage.add(createVariantLogo(sourceRoot, variant, index));
      });

      layoutLogos();
    })
    .catch((error) => {
      console.error(error);

      if (destroyed) return;

      sourceRoot = createFallbackMesh();
      centerAndScaleObject(sourceRoot, 2.35);

      variants.slice(0, 3).forEach((variant, index) => {
        stage.add(createVariantLogo(sourceRoot, variant, index));
      });

      layoutLogos();
      setStatus("модель не загрузилась, показываю fallback");
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
