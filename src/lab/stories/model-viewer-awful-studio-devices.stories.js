import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const STYLE_ID = "model-viewer-awful-studio-device-styles";

const MODELS = {
  iphone17: { name: "iPhone 17 · v30", src: "/media/projects/awful-studio/model-viewer/iphone-17-v30.glb", aria: "3D-модель iPhone 17", view: [0.32, 0.12, 1], exposure: 1.10, envIntensity: 0.24 },
  ipad11: { name: "iPad Pro 11 M5 · v6", src: "/media/projects/awful-studio/model-viewer/ipad-pro-11-m5-v6.glb", aria: "3D-модель iPad Pro 11 M5", view: [0.34, 0.16, 1], exposure: 1.0, envIntensity: 0.68 },
  ipad13: { name: "iPad Pro 13 M5 · v6", src: "/media/projects/awful-studio/model-viewer/ipad-pro-13-m5-v6.glb", aria: "3D-модель iPad Pro 13 M5", view: [0.34, 0.16, 1], exposure: 1.0, envIntensity: 0.68 },
  macbook14: { name: "MacBook Pro 14 M5 · v1", src: "/media/projects/awful-studio/model-viewer/macbook-pro-14-m5-v1.glb", aria: "3D-модель MacBook Pro 14 M5", view: [0.95, 0.52, 1], exposure: 1.0, envIntensity: 0.72 },
  profotoD1: { name: "Profoto D1 500 Air", src: "/media/projects/awful-studio/model-viewer/profoto-d1-500-air.glb", aria: "3D-модель Profoto D1 500 Air", view: [0.7, 0.4, 1], exposure: 1.0, envIntensity: 0.68 },
  profotoMagnum: { name: "Profoto Magnum 100624", src: "/media/projects/awful-studio/model-viewer/profoto-magnum-100624.glb", aria: "3D-модель Profoto Magnum 100624", view: [0.7, 0.35, 1], exposure: 1.0, envIntensity: 0.68 },
  sandbag: { name: "Studio Sandbag 01", src: "/media/projects/awful-studio/model-viewer/studio-sandbag-01.glb", aria: "3D-модель студийного sandbag", view: [0.75, 0.45, 1], exposure: 1.0, envIntensity: 0.68 },
  cstand: { name: "C-Stand", src: "/media/projects/awful-studio/model-viewer/studio-support-cstand-01.glb", aria: "3D-модель C-Stand", view: [0.5, 0.35, 1], exposure: 1.0, envIntensity: 0.68 },
  whiteStudio: { name: "White Studio v2", src: "/media/projects/awful-studio/model-viewer/white-studio-v2.glb", aria: "3D scene: White Studio", view: [0.75, 0.42, 1], exposure: 1.0, envIntensity: 0.72 },
  darkNeon: { name: "Dark Neon v2", src: "/media/projects/awful-studio/model-viewer/dark-neon-v2.glb", aria: "3D scene: Dark Neon", view: [0.75, 0.38, 1], exposure: 1.08, envIntensity: 0.58 },
  loftDaylight: { name: "Loft Daylight v2", src: "/media/projects/awful-studio/model-viewer/loft-daylight-v2.glb", aria: "3D scene: Loft Daylight", view: [0.78, 0.44, 1], exposure: 1.0, envIntensity: 0.7 },
};

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mv-device-story {
      inline-size: min(100%, 72rem);
      margin-inline: auto;
      container: model-viewer / inline-size;
    }
    .mv-device-story .media__surface {
      position: relative;
      display: grid;
      overflow: hidden;
      inline-size: 100%;
      max-inline-size: 100%;
      aspect-ratio: 16 / 9;
      min-block-size: 0;
      background:
        radial-gradient(circle at 50% 44%, rgb(255 255 255) 0 16%, transparent 58%),
        var(--clr-surface-page);
    }
    .mv-device-stage,
    .mv-device-canvas {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
    }
    .mv-device-canvas {
      display: block;
      touch-action: none;
      cursor: grab;
    }
    .mv-device-canvas:active { cursor: grabbing; }
    .mv-device-toolbar {
      position: absolute;
      z-index: 2;
      inset-inline-end: var(--size-300);
      inset-block-end: var(--size-300);
      display: flex;
      align-items: center;
      gap: .25rem;
      max-inline-size: calc(100% - 2 * var(--size-300));
      padding: .25rem;
      border: var(--border-width-100) solid var(--clr-border);
      border-radius: var(--radius-contained);
      background: color-mix(in srgb, var(--clr-surface-raised), transparent 4%);
      box-shadow: var(--shadow-surface-elevated);
      backdrop-filter: blur(8px);
    }
    .mv-device-button,
    .mv-device-segmented label {
      min-block-size: 2rem;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: .75rem;
      line-height: var(--lh-ui);
    }
    .mv-device-button {
      padding-inline: .65rem;
      cursor: pointer;
    }
    .mv-device-button:is(:hover, :focus-visible),
    .mv-device-segmented input:checked + span,
    .mv-device-segmented label:hover span {
      background: color-mix(in srgb, currentColor, transparent 90%);
    }
    .mv-device-button:focus-visible,
    .mv-device-segmented input:focus-visible + span {
      outline: var(--border-width-200) solid currentColor;
      outline-offset: .12rem;
    }
    .mv-device-segmented {
      display: flex;
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .mv-device-segmented legend {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .mv-device-segmented label {
      position: relative;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .mv-device-segmented input {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      opacity: 0;
      pointer-events: none;
    }
    .mv-device-segmented span {
      display: grid;
      place-items: center;
      min-block-size: 2rem;
      padding-inline: .65rem;
      border-radius: 999px;
    }
    .mv-device-status {
      position: absolute;
      inset-inline-start: var(--size-300);
      inset-block-end: var(--size-300);
      max-inline-size: min(24rem, calc(100% - 2 * var(--size-300)));
      padding: .35rem .5rem;
      border-radius: var(--radius-poster);
      background: color-mix(in srgb, var(--clr-surface-raised), transparent 8%);
      color: var(--clr-text-muted);
      font-size: var(--fs-200);
      line-height: var(--lh-ui);
      pointer-events: none;
    }
    .mv-device-status[hidden] { display: none; }
    .mv-device-caption {
      margin-block-start: var(--size-200);
      color: var(--clr-text-muted);
      font-size: var(--fs-200);
      line-height: var(--lh-ui);
    }
    @container model-viewer (width < 36rem) {
      .mv-device-story .media__surface { aspect-ratio: 1 / 1; }
      .mv-device-toolbar {
        inset-inline: var(--size-200);
        inset-block-end: var(--size-200);
        justify-content: flex-end;
        overflow-x: auto;
        max-inline-size: none;
        scrollbar-width: none;
      }
      .mv-device-toolbar::-webkit-scrollbar { display: none; }
      .mv-device-button,
      .mv-device-segmented span { min-block-size: 44px; }
      .mv-device-status {
        inset-inline-start: var(--size-200);
        inset-block-end: calc(44px + 2 * var(--size-200));
      }
    }
  `;
  document.head.append(style);
};
const loadEnvironment = async (renderer, scene) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  try {
    const environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = environment;
    return environment;
  } finally {
    room.dispose();
    pmrem.dispose();
  }
};

const createStudioLightRig = () => {
  const rig = new THREE.Group();
  const lights = [
    [0xffffff, 9.0, 4.8, 5.6, [3.2, 3.4, 4.4]],
    [0xf5f7ff, 4.2, 5.8, 6.4, [-3.8, 1.2, 3.0]],
    [0xffffff, 6.5, 4.2, 5.0, [-1.8, 3.0, -4.0]],
  ];
  lights.forEach(([color, intensity, width, height, position]) => {
    const light = new THREE.RectAreaLight(color, intensity, width, height);
    light.position.set(...position);
    light.lookAt(0, 0, 0);
    rig.add(light);
  });
  return rig;
};

const disposeMaterial = (material) => {
  const materials = Array.isArray(material) ? material : [material];
  materials.filter(Boolean).forEach((item) => item.dispose?.());
};

const fitModel = (model, camera, controls, view) => {
  model.position.set(0, 0, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);

  const initialBounds = new THREE.Box3().setFromObject(model, true);
  const center = initialBounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.updateMatrixWorld(true);

  const sphere = new THREE.Box3().setFromObject(model, true)
    .getBoundingSphere(new THREE.Sphere());
  const targetRadius = 1.45;
  model.scale.setScalar(targetRadius / Math.max(sphere.radius, 0.0001));
  model.updateMatrixWorld(true);

  const fittedSphere = new THREE.Box3().setFromObject(model, true)
    .getBoundingSphere(new THREE.Sphere());
  const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = fittedSphere.radius / Math.sin(halfFov) * 1.2;
  const direction = new THREE.Vector3(...view).normalize();

  camera.position.copy(fittedSphere.center).addScaledVector(direction, distance);
  camera.near = Math.max(0.03, fittedSphere.radius * 0.025);
  camera.far = distance * 5 + fittedSphere.radius * 2;
  camera.updateProjectionMatrix();

  controls.target.copy(fittedSphere.center);
  controls.minDistance = distance * 0.45;
  controls.maxDistance = distance * 4;
  controls.update();
};

const mountViewer = async (root, device) => {
  const canvas = root.querySelector("[data-device-canvas]");
  const status = root.querySelector("[data-device-status]");
  const surface = root.querySelector(".media__surface");
  if (!(canvas instanceof HTMLCanvasElement) || !(surface instanceof HTMLElement)) {
    throw new Error("Device viewer markup is incomplete.");
  }
  let disposed = false;
  let environment = null;
  let model = null;
  let edgeRoot = null;
  let edgeMaterial = null;
  const materials = new Set();
  const meshes = [];
  const edgeObjects = [];

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = device.exposure;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environmentIntensity = device.envIntensity;
  scene.add(createStudioLightRig());
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;

  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };
  controls.addEventListener("change", render);

  const resize = () => {
    if (disposed) return;
    const rect = surface.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(surface);

  const ensureEdges = () => {
    if (!model || edgeRoot) return;
    model.updateMatrixWorld(true);
    const modelInverse = new THREE.Matrix4().copy(model.matrixWorld).invert();
    edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x3f3f3f,
      transparent: true,
      opacity: 0.7,
      depthTest: true,
      depthWrite: false,
    });
    edgeRoot = new THREE.Group();
    edgeRoot.name = `${device.name}_Edges`;
    edgeRoot.visible = false;
    meshes.forEach((mesh) => {
      mesh.updateWorldMatrix(true, false);
      const geometry = new THREE.EdgesGeometry(mesh.geometry, 28);
      const lines = new THREE.LineSegments(geometry, edgeMaterial);
      lines.matrix.copy(modelInverse.clone().multiply(mesh.matrixWorld));
      lines.matrixAutoUpdate = false;
      edgeRoot.add(lines);
      edgeObjects.push(lines);
    });
    model.add(edgeRoot);
  };
  try {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const [gltf, loadedEnvironment] = await Promise.all([
      loader.loadAsync(device.src),
      loadEnvironment(renderer, scene),
    ]);

    if (disposed) {
      loadedEnvironment?.dispose?.();
      gltf.scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose?.();
        disposeMaterial(object.material);
      });
      return () => {};
    }

    environment = loadedEnvironment;
    model = gltf.scene;
    model.traverse((object) => {
      if (!object.isMesh) return;
      const meshMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      meshMaterials.forEach((material) => {
        if (!material) return;
        material.side = THREE.FrontSide;
        material.needsUpdate = true;
        materials.add(material);
      });
      object.castShadow = false;
      object.receiveShadow = false;
      meshes.push(object);
    });

    scene.add(model);
    fitModel(model, camera, controls, device.view);
    resize();
    status?.setAttribute("hidden", "");
  } catch (error) {
    console.error(error);
    if (status) {
      status.textContent = `Не удалось загрузить ${device.name}`;
      status.removeAttribute("hidden");
    }
  }

  const renderModeInputs = root.querySelectorAll("[data-device-render-mode]");
  const updateRenderMode = (mode) => {
    const showEdges = mode === "wireframe";
    if (showEdges) ensureEdges();
    meshes.forEach((mesh) => { mesh.visible = !showEdges; });
    if (edgeRoot) edgeRoot.visible = showEdges;
    render();
  };
  renderModeInputs.forEach((input) => {
    input.addEventListener("change", () => updateRenderMode(input.value));
  });

  root.querySelector('[data-device-action="fit"]')?.addEventListener("click", () => {
    if (!model) return;
    fitModel(model, camera, controls, device.view);
    render();
  });

  root.querySelector('[data-device-action="fullscreen"]')?.addEventListener("click", async () => {
    if (!document.fullscreenElement) await surface.requestFullscreen?.();
    else await document.exitFullscreen?.();
  });

  resize();

  return () => {
    disposed = true;
    resizeObserver.disconnect();
    controls.removeEventListener("change", render);
    controls.dispose();
    environment?.dispose();
    edgeObjects.forEach((lines) => lines.geometry?.dispose?.());
    edgeObjects.length = 0;
    edgeMaterial?.dispose?.();
    edgeRoot?.removeFromParent();
    materials.forEach((material) => material.dispose?.());
    materials.clear();
    model?.traverse((object) => {
      if (object.isMesh) object.geometry?.dispose?.();
    });
    renderer.dispose();
    renderer.forceContextLoss();
  };
};
const createStory = (device) => {
  ensureStyles();
  const root = document.createElement("figure");
  root.className = "media mv-device-story";
  root.dataset.modelViewer = "";
  root.dataset.modelSrc = device.src;
  root.dataset.modelControls = "render-mode fit-model fullscreen";
  const radioName = `device-render-mode-${device.src.split("/").pop()}`;
  root.innerHTML = `
    <div class="media__surface">
      <div class="mv-device-stage">
        <canvas class="mv-device-canvas" data-device-canvas aria-label="${device.aria}"></canvas>
      </div>
      <div class="mv-device-toolbar" aria-label="Управление 3D-моделью">
        <fieldset class="mv-device-segmented">
          <legend>режим отображения</legend>
          <label>
            <input type="radio" name="${radioName}" value="material" data-device-render-mode checked>
            <span>материал</span>
          </label>
          <label>
            <input type="radio" name="${radioName}" value="wireframe" data-device-render-mode>
            <span>каркас</span>
          </label>
        </fieldset>
        <button class="mv-device-button" type="button" data-device-action="fit">вписать</button>
        <button class="mv-device-button" type="button" data-device-action="fullscreen">экран</button>
      </div>
      <p class="mv-device-status" data-device-status role="status">загрузка ${device.name}…</p>
    </div>
    <figcaption class="mv-device-caption">${device.name} · AWFUL STUDIO web GLB</figcaption>
  `;

  let cleanup = () => {};
  mountViewer(root, device).then((dispose) => { cleanup = dispose; });
  const observer = new MutationObserver(() => {
    if (!root.isConnected) {
      observer.disconnect();
      cleanup();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return root;
};

export default {
  title: "02 Molecules/Model Viewer/AWFUL Studio 3D",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Канонические web-GLB AWFUL STUDIO: четыре финальных устройства и четыре объекта studio rig. Three.js отвечает за окружение, камеру, orbit/zoom, fit, fullscreen и диагностический edge-view.",
      },
    },
  },
};

export const IPhone17 = { name: "iPhone 17", render: () => createStory(MODELS.iphone17) };
export const IPadPro11 = { name: "iPad Pro 11 M5", render: () => createStory(MODELS.ipad11) };
export const IPadPro13 = { name: "iPad Pro 13 M5", render: () => createStory(MODELS.ipad13) };
export const MacBookPro14 = { name: "MacBook Pro 14 M5", render: () => createStory(MODELS.macbook14) };
export const ProfotoD1 = { name: "Profoto D1 500 Air", render: () => createStory(MODELS.profotoD1) };
export const ProfotoMagnum = { name: "Profoto Magnum 100624", render: () => createStory(MODELS.profotoMagnum) };
export const StudioSandbag = { name: "Studio Sandbag 01", render: () => createStory(MODELS.sandbag) };
export const CStand = { name: "C-Stand", render: () => createStory(MODELS.cstand) };
export const WhiteStudio = { name: "White Studio v2", render: () => createStory(MODELS.whiteStudio) };
export const DarkNeon = { name: "Dark Neon v2", render: () => createStory(MODELS.darkNeon) };
export const LoftDaylight = { name: "Loft Daylight v2", render: () => createStory(MODELS.loftDaylight) };
