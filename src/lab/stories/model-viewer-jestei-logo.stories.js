import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODEL_URL = "/media/projects/jestei/model-viewer/jestei-logo-web.glb";
const HDRI_URL = "/media/projects/jestei/model-viewer/studio-small-09-1k.hdr";
const STYLE_ID = "model-viewer-jestei-logo-story-styles";

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .mv-jestei-story {
      inline-size: min(100%, 72rem);
      margin-inline: auto;
      container: model-viewer / inline-size;
    }

    .mv-jestei-story .media__surface {
      position: relative;
      display: grid;
      overflow: hidden;
      inline-size: 100%;
      max-inline-size: 100%;
      aspect-ratio: 16 / 9;
      min-block-size: 0;
      background:
        radial-gradient(circle at 50% 42%, rgb(255 255 255) 0 14%, transparent 55%),
        var(--clr-surface-page);
    }

    .mv-jestei-stage,
    .mv-jestei-canvas {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
    }

    .mv-jestei-canvas {
      display: block;
      touch-action: none;
      cursor: grab;
    }

    .mv-jestei-canvas:active {
      cursor: grabbing;
    }

    .mv-jestei-toolbar {
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
    }

    .mv-jestei-button,
    .mv-jestei-segmented label {
      min-block-size: 2rem;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: .75rem;
      line-height: var(--lh-ui);
    }

    .mv-jestei-button {
      padding-inline: .65rem;
      cursor: pointer;
    }

    .mv-jestei-button:is(:hover, :focus-visible) {
      background: color-mix(in srgb, currentColor, transparent 90%);
    }

    .mv-jestei-button:focus-visible,
    .mv-jestei-segmented input:focus-visible + span {
      outline: var(--border-width-200) solid currentColor;
      outline-offset: .12rem;
    }

    .mv-jestei-segmented {
      display: flex;
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .mv-jestei-segmented legend {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .mv-jestei-segmented label {
      position: relative;
      display: grid;
      place-items: center;
      cursor: pointer;
    }

    .mv-jestei-segmented input {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      opacity: 0;
      pointer-events: none;
    }

    .mv-jestei-segmented span {
      display: grid;
      place-items: center;
      min-block-size: 2rem;
      padding-inline: .65rem;
      border-radius: 999px;
    }

    .mv-jestei-segmented input:checked + span,
    .mv-jestei-segmented label:hover span {
      background: color-mix(in srgb, currentColor, transparent 90%);
    }

    .mv-jestei-status {
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

    .mv-jestei-status[hidden] {
      display: none;
    }

    @container model-viewer (width < 36rem) {
      .mv-jestei-story .media__surface {
        aspect-ratio: 1 / 1;
        min-block-size: 0;
      }

      .mv-jestei-toolbar {
        inset-inline: var(--size-200);
        inset-block-end: var(--size-200);
        justify-content: flex-end;
        overflow-x: auto;
        max-inline-size: none;
        scrollbar-width: none;
      }

      .mv-jestei-toolbar::-webkit-scrollbar {
        display: none;
      }

      .mv-jestei-button,
      .mv-jestei-segmented span {
        min-block-size: 44px;
      }

      .mv-jestei-status {
        inset-inline-start: var(--size-200);
        inset-block-end: calc(44px + 2 * var(--size-200));
      }
    }
  `;

  document.head.append(style);
};

const disposeMaterial = (material) => {
  if (!material) return;
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item) => item?.dispose?.());
};

const loadEnvironment = async (renderer, scene) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  try {
    const source = await new RGBELoader().loadAsync(HDRI_URL);
    const environment = pmrem.fromEquirectangular(source).texture;
    source.dispose();
    scene.environment = environment;
    scene.environmentRotation.set(0, Math.PI * 0.32, 0);
    return environment;
  } catch (error) {
    console.warn("Jestei logo HDRI failed; using neutral PMREM fallback.", error);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    scene.environment = environment;
    scene.environmentRotation.set(0, Math.PI * 0.32, 0);
    return environment;
  } finally {
    pmrem.dispose();
  }
};

const loadJesteiLogo = async () => {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  return gltf.scene;
};

const fitModel = (model, camera, controls) => {
  model.position.set(0, 0, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);

  const initialBounds = new THREE.Box3().setFromObject(model, true);
  const center = initialBounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.updateMatrixWorld(true);

  const sphere = new THREE.Box3()
    .setFromObject(model, true)
    .getBoundingSphere(new THREE.Sphere());
  const targetRadius = 1.45;
  model.scale.setScalar(targetRadius / Math.max(sphere.radius, 0.0001));
  model.updateMatrixWorld(true);

  const fittedSphere = new THREE.Box3()
    .setFromObject(model, true)
    .getBoundingSphere(new THREE.Sphere());
  const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = fittedSphere.radius / Math.sin(halfFov) * 1.08;

  camera.position.set(distance * 0.06, distance * 0.025, distance);
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.target.copy(fittedSphere.center);
  controls.update();
};

const mountViewer = async (root) => {
  const canvas = root.querySelector("[data-jestei-logo-canvas]");
  const status = root.querySelector("[data-jestei-logo-status]");
  const surface = root.querySelector(".media__surface");

  if (!(canvas instanceof HTMLCanvasElement) || !(surface instanceof HTMLElement)) {
    throw new Error("Jestei logo viewer markup is incomplete.");
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
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 14;

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

  try {
    const [loadedModel, loadedEnvironment] = await Promise.all([
      loadJesteiLogo(),
      loadEnvironment(renderer, scene),
    ]);

    if (disposed) {
      loadedEnvironment?.dispose?.();
      loadedModel.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose?.();
        disposeMaterial(object.material);
      });
      return () => {};
    }

    environment = loadedEnvironment;
    model = loadedModel;

    model.traverse((object) => {
      if (!object.isMesh) return;
      const meshMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      meshMaterials.forEach((material) => {
        if (!material) return;
        material.side = THREE.FrontSide;
        if ("envMapIntensity" in material) material.envMapIntensity = 0.95;
        material.needsUpdate = true;
        materials.add(material);
      });
      meshes.push(object);
      object.castShadow = false;
      object.receiveShadow = false;
    });

    scene.add(model);
    fitModel(model, camera, controls);

    model.updateMatrixWorld(true);
    const modelInverse = new THREE.Matrix4().copy(model.matrixWorld).invert();
    edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x3f3f3f,
      transparent: true,
      opacity: 0.72,
      depthTest: true,
      depthWrite: false,
    });
    edgeRoot = new THREE.Group();
    edgeRoot.name = "JesteiLogo_Edges";
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
    resize();
    status?.setAttribute("hidden", "");
  } catch (error) {
    console.error(error);
    if (status) {
      status.textContent = "Не удалось загрузить 3D-логотип Jestei Pool";
      status.removeAttribute("hidden");
    }
  }

  const renderModeInputs = root.querySelectorAll('[data-jestei-render-mode]');
  const updateRenderMode = (mode) => {
    const showEdges = mode === "wireframe";
    meshes.forEach((mesh) => {
      mesh.visible = !showEdges;
    });
    if (edgeRoot) edgeRoot.visible = showEdges;
    render();
  };
  renderModeInputs.forEach((input) => {
    input.addEventListener("change", () => updateRenderMode(input.value));
  });

  const fitButton = root.querySelector('[data-jestei-action="fit"]');
  fitButton?.addEventListener("click", () => {
    if (!model) return;
    fitModel(model, camera, controls);
    render();
  });

  const fullscreenButton = root.querySelector('[data-jestei-action="fullscreen"]');
  fullscreenButton?.addEventListener("click", async () => {
    if (!document.fullscreenElement) {
      await surface.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
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
    if (model) {
      model.traverse((object) => {
        if (object.isMesh) object.geometry?.dispose?.();
      });
    }
    renderer.dispose();
    renderer.forceContextLoss();
  };
};

const createStory = () => {
  ensureStyles();

  const root = document.createElement("figure");
  root.className = "media mv-jestei-story";
  root.dataset.modelViewer = "";
  root.dataset.modelSrc = MODEL_URL;
  root.dataset.modelControls = "render-mode fit-model fullscreen";
  root.innerHTML = `
    <div class="media__surface">
      <div class="mv-jestei-stage">
        <canvas class="mv-jestei-canvas" data-jestei-logo-canvas aria-label="3D-логотип Jestei Pool"></canvas>
      </div>

      <div class="mv-jestei-toolbar" aria-label="Управление 3D-моделью">
        <fieldset class="mv-jestei-segmented">
          <legend>режим отображения</legend>
          <label>
            <input type="radio" name="jestei-render-mode" value="metal" data-jestei-render-mode checked>
            <span>металл</span>
          </label>
          <label>
            <input type="radio" name="jestei-render-mode" value="wireframe" data-jestei-render-mode>
            <span>каркас</span>
          </label>
        </fieldset>
        <button class="mv-jestei-button" type="button" data-jestei-action="fit">вписать</button>
        <button class="mv-jestei-button" type="button" data-jestei-action="fullscreen">экран</button>
      </div>

      <p class="mv-jestei-status" data-jestei-logo-status role="status">загрузка 3D-логотипа…</p>
    </div>
  `;

  let cleanup = () => {};
  mountViewer(root).then((dispose) => {
    cleanup = dispose;
  });

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
  title: "02 Molecules/Model Viewer",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Статический Jestei Pool 3D logo внутри обычной media surface сайта. Используется отдельный исправленный web GLB: manifold-сетка, жёсткие фронт/тыл, контролируемые фаски и экспортированные normals. Материал хранится в GLB; Three.js добавляет только локальную HDRI/PMREM, Neutral tone mapping, камеру и interaction.",
      },
    },
  },
};

export const JesteiLogo = {
  name: "Jestei logo · static metal",
  render: createStory,
};
