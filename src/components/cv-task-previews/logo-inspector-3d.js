import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const STYLE_ID = "logo-inspector-3d-styles";

const DEFAULT_VARIANTS = [
  { id: "brand-orange", label: "Orange", color: "#f08b2f" },
  { id: "mono-black", label: "Black", color: "#141414" },
  { id: "mono-white", label: "White", color: "#f6f2eb" },
  { id: "event-green", label: "Event", color: "#87b84d" },
  { id: "pro-blue", label: "Pro", color: "#1e90ff" },
  { id: "feature-lavender", label: "Feature", color: "#b39cff" },
];

const DEFAULT_CAMERA = { fov: 32, near: 0.1, far: 100, distance: 6.6 };

const ROTATE_SPEED_X = 0.008;
const ROTATE_SPEED_Y = 0.01;
const WHEEL_ZOOM_SPEED = 0.0025;
const AUTO_SPIN_SPEED = 0.68;
const MIN_DISTANCE = 3.4;
const MAX_DISTANCE = 9.5;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .logo-inspector-3d {
      position: relative;
      width: 100%;
      min-height: 560px;
      border: 1px solid #808080;
      background: #dcdcdc;
      overflow: hidden;
    }

    .logo-inspector-3d__canvas {
      position: absolute;
      inset: 0;
      touch-action: none;
      cursor: grab;
    }

    .logo-inspector-3d__canvas.is-dragging {
      cursor: grabbing;
    }

    .logo-inspector-3d__controls {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: min(320px, calc(100% - 32px));
    }

    .logo-inspector-3d__chip {
      border: 1px solid #8d8d8d;
      border-radius: 999px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.86);
      color: #1d1d1d;
      font: 600 13px/1.1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      cursor: pointer;
      transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
    }

    .logo-inspector-3d__chip:hover {
      border-color: #5a5a5a;
    }

    .logo-inspector-3d__chip.is-active {
      border-color: #6267ff;
      box-shadow: 0 0 0 2px rgba(98, 103, 255, .18);
      background: rgba(255, 255, 255, 0.95);
    }

    .logo-inspector-3d__swatch {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,.18);
      flex: 0 0 auto;
    }

    .logo-inspector-3d__status {
      position: absolute;
      right: 16px;
      bottom: 16px;
      z-index: 2;
      padding: 6px 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.82);
      color: #404040;
      font: 500 12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      border: 1px solid #c2c2c2;
    }

    .logo-inspector-3d__status.is-error {
      color: #991b1b;
      border-color: #efb6b6;
      background: rgba(255, 242, 242, 0.95);
    }
  `;

  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createFallbackMesh() {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.35, 48, 160));
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.25, 40, 140));
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 2.9, 0.16));
  plate.position.set(1.55, -0.22, 0.0);
  outer.rotation.x = 0.2;
  inner.rotation.x = -0.1;
  group.add(outer, inner, plate);
  return group;
}

function centerAndScaleObject(object) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  const scale = 2 / maxDimension;
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

function applyVariantColor(root, hexColor) {
  const color = new THREE.Color(hexColor);

  traverseMeshes(root, (mesh) => {
    const base = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.56,
      metalness: 0.12,
      emissive: new THREE.Color("#000000"),
    });

    if (base && base.transparent) {
      material.transparent = true;
      material.opacity = base.opacity;
    }

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
    minHeight = 560,
    background = "#dcdcdc",
    autoSpin = true,
  } = options;

  const root = document.createElement("section");
  root.className = "logo-inspector-3d";
  root.style.minHeight = `${Math.max(240, Number(minHeight) || 560)}px`;
  root.style.background = background;

  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-3d__canvas";

  const controls = document.createElement("div");
  controls.className = "logo-inspector-3d__controls";

  const status = document.createElement("div");
  status.className = "logo-inspector-3d__status";
  status.textContent = "Loading 3D model...";

  root.append(canvasHost, controls, status);
  host.appendChild(root);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(
    DEFAULT_CAMERA.fov,
    1,
    DEFAULT_CAMERA.near,
    DEFAULT_CAMERA.far,
  );

  const baseDirection = new THREE.Vector3(3.35, 2.55, 5.2).normalize();
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

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  canvasHost.appendChild(renderer.domElement);

  const stage = new THREE.Group();
  const spinner = new THREE.Group();
  stage.rotation.x = 0.4;
  stage.rotation.z = -0.22;
  stage.add(spinner);
  scene.add(stage);

  const ambient = new THREE.AmbientLight("#ffffff", 0.28);
  const hemisphere = new THREE.HemisphereLight("#dfe8ff", "#17131b", 0.8);
  const key = new THREE.DirectionalLight("#ffffff", 1.9);
  const fill = new THREE.DirectionalLight("#c4d8ff", 0.52);
  const rim = new THREE.DirectionalLight("#ffd59c", 1.1);

  key.position.set(4.8, 4.8, 4.6);
  fill.position.set(-3.6, 1.5, 3.2);
  rim.position.set(-4.8, 5, -4.8);

  scene.add(ambient, hemisphere, key, fill, rim);

  let meshRoot = null;
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
  };

  const setVariant = (variantId) => {
    const variant = variants.find((v) => v.id === variantId) || variants[0];
    if (!variant || !meshRoot) return;

    controls.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.variantId === variant.id);
    });

    applyVariantColor(meshRoot, variant.color);
    setStatus(`Variant: ${variant.label}`);
  };

  for (const variant of variants) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "logo-inspector-3d__chip";
    button.dataset.variantId = variant.id;

    const swatch = document.createElement("span");
    swatch.className = "logo-inspector-3d__swatch";
    swatch.style.background = variant.color;

    button.append(swatch, document.createTextNode(variant.label));
    button.addEventListener("click", () => setVariant(variant.id));
    controls.appendChild(button);
  }

  const resize = () => {
    const width = Math.max(canvasHost.clientWidth, 1);
    const height = Math.max(canvasHost.clientHeight, 1);
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
      setVariant(initialVariantId);
      setStatus("Ready");
    })
    .catch((error) => {
      console.error(error);
      if (destroyed) return;

      meshRoot = createFallbackMesh();
      centerAndScaleObject(meshRoot);
      spinner.add(meshRoot);
      setVariant(initialVariantId);
      setStatus("Model load failed. Using fallback shape.", true);
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

      renderer.dispose();
      root.remove();
    },
  };
}
