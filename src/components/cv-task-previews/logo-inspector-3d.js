import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import jesteiLogoSvg from "../../assets/cv/logos/jestei-logo.svg?raw";

const STYLE_ID = "logo-inspector-3d-styles";

const DEFAULT_VARIANTS = [
  { id: "brand-orange", label: "для клубных диджеев", color: "#F18200" },
  { id: "event-pear", label: "для ивент диджеев", color: "#D1E231" },
  { id: "pro-blue", label: "для подписчиков про тарифа", color: "#157AFF" },
];

const DEFAULT_CAMERA = { fov: 30, near: 0.1, far: 100, distance: 6.2 };
const ROTATE_SPEED_X = 0.008;
const ROTATE_SPEED_Y = 0.01;
const WHEEL_ZOOM_SPEED = 0.0025;
const AUTO_SPIN_SPEED = 0.62;
const MIN_DISTANCE = 3.4;
const MAX_DISTANCE = 9.2;

function getLogoIconSvg(color) {
  return jesteiLogoSvg
    .replace("<svg", '<svg class="logo-inspector-3d__icon" aria-hidden="true" focusable="false"')
    .replace(/fill="#151718"/g, `fill="${color}"`);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .logo-inspector-3d {
      position: relative;
      width: 100%;
      min-width: 0;
      height: clamp(20rem, 44vw, var(--logo-inspector-max-height, 36rem));
      min-height: min(var(--logo-inspector-min-height, 22rem), 72vh);
      max-height: min(var(--logo-inspector-max-height, 38rem), 76vh);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 8px;
      background: #050505;
      overflow: hidden;
      contain: layout paint;
      isolation: isolate;
    }

    .logo-inspector-3d__canvas {
      position: absolute;
      inset: 0;
      touch-action: none;
      cursor: grab;
      min-width: 0;
    }

    .logo-inspector-3d__canvas canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      max-height: 100%;
    }

    .logo-inspector-3d__canvas.is-dragging {
      cursor: grabbing;
    }

    .logo-inspector-3d__controls {
      position: absolute;
      left: 50%;
      bottom: 16px;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: min(100% - 88px, 42rem);
      transform: translateX(-50%);
    }

    .logo-inspector-3d__controls-title {
      margin: 0 8px 0 0;
      color: rgba(255, 255, 255, 0.74);
      font: 500 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      white-space: nowrap;
    }

    .logo-inspector-3d__controls-list {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 0;
    }

    .logo-inspector-3d__chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 34px;
      padding: 6px 12px;
      border: 1px solid rgba(17, 17, 17, 0.18);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      color: #151718;
      font: 500 13px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(17, 17, 17, 0.06);
      transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
    }

    .logo-inspector-3d__chip:hover {
      border-color: rgba(17, 17, 17, 0.42);
      background: #fff;
    }

    .logo-inspector-3d__chip.is-active {
      border-color: rgba(21, 122, 255, 0.72);
      box-shadow: 0 0 0 3px rgba(21, 122, 255, 0.14), 0 10px 24px rgba(17, 17, 17, 0.08);
      background: #fff;
    }

    .logo-inspector-3d__icon {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      display: block;
    }

    .logo-inspector-3d__arrow {
      position: absolute;
      top: 50%;
      z-index: 3;
      width: 38px;
      height: 38px;
      border: 1px solid rgba(17, 17, 17, 0.08);
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 4px 14px rgba(17, 17, 17, 0.08);
      cursor: pointer;
      transform: translateY(-50%);
    }

    .logo-inspector-3d__arrow::before {
      content: "";
      position: absolute;
      inset: 0;
      width: 7px;
      height: 7px;
      margin: auto;
      border-top: 2px solid #111;
      border-left: 2px solid #111;
    }

    .logo-inspector-3d__arrow--prev {
      left: 18px;
    }

    .logo-inspector-3d__arrow--prev::before {
      transform: translateX(1px) rotate(-45deg);
    }

    .logo-inspector-3d__arrow--next {
      right: 18px;
    }

    .logo-inspector-3d__arrow--next::before {
      transform: translateX(-1px) rotate(135deg);
    }

    .logo-inspector-3d__status {
      position: absolute;
      right: 16px;
      top: 16px;
      z-index: 2;
      padding: 6px 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      color: #404040;
      font: 500 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      border: 1px solid #c2c2c2;
    }

    .logo-inspector-3d__status[hidden] {
      display: none;
    }

    .logo-inspector-3d__status.is-error {
      color: #991b1b;
      border-color: #efb6b6;
      background: rgba(255, 242, 242, 0.95);
    }

    @media (max-width: 640px) {
      .logo-inspector-3d__controls {
        bottom: 12px;
        width: calc(100% - 24px);
        overflow-x: auto;
        justify-content: flex-start;
        scrollbar-width: none;
      }

      .logo-inspector-3d__controls::-webkit-scrollbar {
        display: none;
      }

      .logo-inspector-3d__controls-title {
        display: none;
      }

      .logo-inspector-3d__arrow {
        display: none;
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

function centerAndScaleObject(object) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const scale = 2.45 / maxDimension;
  object.position.sub(center);
  object.scale.multiplyScalar(scale);
  object.updateWorldMatrix(true, true);
}

function traverseMeshes(object, onMesh) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) onMesh(child);
  });
}

function disposeMaterial(material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) value.dispose();
  });
  material.dispose();
}

function disposeObjectResources(object) {
  traverseMeshes(object, (mesh) => {
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial);
    } else if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

function applyVariantColor(root, hexColor, renderer) {
  const color = new THREE.Color(hexColor);

  traverseMeshes(root, (mesh) => {
    mesh.geometry?.computeVertexNormals?.();

    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.34,
      metalness: 0.64,
      clearcoat: 0.42,
      clearcoatRoughness: 0.36,
      envMapIntensity: 1.24,
    });

    material.side = THREE.FrontSide;

    if (renderer?.capabilities && material.map) {
      material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material = material;
  });
}

async function loadModel(modelUrl) {
  if (!modelUrl) return createFallbackMesh();

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  return gltf.scene;
}

export function createLogoInspector3D(target, options = {}) {
  injectStyles();

  const host = typeof target === "string" ? document.querySelector(target) : target;
  if (!host) {
    throw new Error("createLogoInspector3D: target not found");
  }

  const {
    modelUrl = "./logo.glb",
    variants = DEFAULT_VARIANTS,
    initialVariantId = variants[0]?.id,
    minHeight = 520,
    background = "#050505",
    autoSpin = true,
  } = options;

  const root = document.createElement("section");
  root.className = "logo-inspector-3d";
  const safeMinHeight = clamp(Number(minHeight) || 520, 280, 560);
  const safeMaxHeight = clamp(safeMinHeight + 120, 360, 680);
  root.style.setProperty("--logo-inspector-min-height", `${safeMinHeight}px`);
  root.style.setProperty("--logo-inspector-max-height", `${safeMaxHeight}px`);
  root.style.background = background;

  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-3d__canvas";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className = "logo-inspector-3d__arrow logo-inspector-3d__arrow--prev";
  prevButton.setAttribute("aria-label", "Предыдущий цвет логотипа");

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "logo-inspector-3d__arrow logo-inspector-3d__arrow--next";
  nextButton.setAttribute("aria-label", "Следующий цвет логотипа");

  const controls = document.createElement("div");
  controls.className = "logo-inspector-3d__controls";

  const controlsTitle = document.createElement("p");
  controlsTitle.className = "logo-inspector-3d__controls-title";
  controlsTitle.textContent = "цветовые темы и тарифы";

  const controlsList = document.createElement("div");
  controlsList.className = "logo-inspector-3d__controls-list";
  controls.append(controlsTitle, controlsList);

  const status = document.createElement("div");
  status.className = "logo-inspector-3d__status";
  status.hidden = true;

  root.append(canvasHost, prevButton, nextButton, controls, status);
  host.appendChild(root);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(DEFAULT_CAMERA.fov, 1, DEFAULT_CAMERA.near, DEFAULT_CAMERA.far);
  const baseDirection = new THREE.Vector3(3.2, 2.35, 5.1).normalize();
  let cameraDistance = DEFAULT_CAMERA.distance;

  const updateCamera = () => {
    cameraDistance = clamp(cameraDistance, MIN_DISTANCE, MAX_DISTANCE);
    camera.position.copy(baseDirection.clone().multiplyScalar(cameraDistance));
    camera.lookAt(0, 0, 0);
  };

  updateCamera();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  canvasHost.appendChild(renderer.domElement);

  const stage = new THREE.Group();
  const spinner = new THREE.Group();
  stage.rotation.x = 0.36;
  stage.rotation.z = -0.18;
  stage.add(spinner);
  scene.add(stage);

  const ambient = new THREE.AmbientLight("#ffffff", 0.3);
  const key = new THREE.DirectionalLight("#ffffff", 2.4);
  const fill = new THREE.DirectionalLight("#dbe9ff", 0.74);
  const rim = new THREE.DirectionalLight("#fff2d2", 1.3);

  key.position.set(4.8, 4.4, 5);
  fill.position.set(-4, 1.8, 3.4);
  rim.position.set(-4.4, 5.2, -4.8);
  scene.add(ambient, key, fill, rim);

  let meshRoot = null;
  let activeVariantIndex = Math.max(0, variants.findIndex((variant) => variant.id === initialVariantId));
  let autoSpinAngle = 0;
  const dragRotation = { x: 0, y: 0 };
  let paused = false;
  let pointerDown = false;
  let lastPointer = { x: 0, y: 0 };
  let raf = 0;
  let destroyed = false;

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle("is-error", isError);
    status.hidden = !isError;
  };

  const setVariant = (variantId) => {
    const nextIndex = variants.findIndex((variant) => variant.id === variantId);
    activeVariantIndex = nextIndex >= 0 ? nextIndex : 0;
    const variant = variants[activeVariantIndex];

    controls.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.variantId === variant.id);
    });

    if (meshRoot) {
      applyVariantColor(meshRoot, variant.color, renderer);
    }
  };

  const shiftVariant = (direction) => {
    const nextIndex = (activeVariantIndex + direction + variants.length) % variants.length;
    setVariant(variants[nextIndex].id);
  };

  variants.forEach((variant) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "logo-inspector-3d__chip";
    button.dataset.variantId = variant.id;
    button.innerHTML = `${getLogoIconSvg(variant.color)}<span>${variant.label}</span>`;
    button.addEventListener("click", () => setVariant(variant.id));
    controlsList.appendChild(button);
  });

  prevButton.addEventListener("click", () => shiftVariant(-1));
  nextButton.addEventListener("click", () => shiftVariant(1));

  const resize = () => {
    const bounds = canvasHost.getBoundingClientRect();
    const rootBounds = root.getBoundingClientRect();
    const width = Math.max(Math.floor(bounds.width || canvasHost.clientWidth || rootBounds.width || 1), 1);
    const height = Math.max(Math.floor(bounds.height || canvasHost.clientHeight || rootBounds.height || safeMinHeight || 1), 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvasHost);
  resize();

  const onPointerDown = (event) => {
    pointerDown = true;
    paused = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    canvasHost.classList.add("is-dragging");
    renderer.domElement.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!pointerDown) return;

    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };

    dragRotation.y += dx * ROTATE_SPEED_Y;
    dragRotation.x += dy * ROTATE_SPEED_X;
    dragRotation.x = clamp(dragRotation.x, -0.55, 0.55);
  };

  const onPointerUp = (event) => {
    pointerDown = false;
    paused = false;
    canvasHost.classList.remove("is-dragging");

    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
      renderer.domElement.releasePointerCapture(event.pointerId);
    }
  };

  const onWheel = (event) => {
    event.preventDefault();
    cameraDistance += event.deltaY * WHEEL_ZOOM_SPEED;
    updateCamera();
  };

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  const clock = new THREE.Clock();

  const renderLoop = () => {
    if (destroyed) return;

    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (autoSpin && !paused) {
      autoSpinAngle += delta * AUTO_SPIN_SPEED;
      stage.rotation.y = Math.sin(elapsed * 0.22) * 0.12;
    }

    spinner.rotation.y = autoSpinAngle + dragRotation.y;
    spinner.rotation.x = dragRotation.x;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  };

  setVariant(variants[activeVariantIndex]?.id);
  renderLoop();

  loadModel(modelUrl)
    .then((loadedRoot) => {
      if (destroyed) {
        disposeObjectResources(loadedRoot);
        return;
      }

      meshRoot = loadedRoot;
      centerAndScaleObject(meshRoot);
      spinner.add(meshRoot);
      setVariant(variants[activeVariantIndex]?.id);
    })
    .catch((error) => {
      console.error(error);
      if (destroyed) return;

      meshRoot = createFallbackMesh();
      centerAndScaleObject(meshRoot);
      spinner.add(meshRoot);
      setVariant(variants[activeVariantIndex]?.id);
      setStatus("модель не загрузилась, показываю fallback", true);
    });

  return {
    element: root,
    setVariant,
    resize,
    destroy() {
      if (destroyed) return;
      destroyed = true;

      cancelAnimationFrame(raf);
      resizeObserver.disconnect();

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);

      if (meshRoot) {
        spinner.remove(meshRoot);
        disposeObjectResources(meshRoot);
      }

      pmremGenerator.dispose();
      renderer.dispose();
      root.remove();
    },
  };
}
