import type { Material, Mesh, Object3D, Texture } from "three";

const MODEL_VIEWER_SELECTOR = "[data-model-viewer-runtime]";
const MODEL_VIEWER_ROOT_MARGIN = "320px 0px";
const noop = () => {};

type MotionPreference = {
  allowsMotion(): boolean;
  subscribe(
    listener: (state: { allowed: boolean }) => void,
    options?: { immediate?: boolean },
  ): () => void;
};

type ModelViewerOptions = {
  root?: ParentNode;
  motion?: MotionPreference;
};

let runtimePromise: ReturnType<typeof loadRuntime> | null = null;

function loadRuntime() {
  return Promise.all([
    import("three"),
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/controls/OrbitControls.js"),
    import("three/addons/environments/RoomEnvironment.js"),
    import("three/addons/libs/meshopt_decoder.module.js"),
  ]).then(([THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }, { MeshoptDecoder }]) => ({
    THREE,
    GLTFLoader,
    OrbitControls,
    RoomEnvironment,
    MeshoptDecoder,
  }));
}

function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = loadRuntime();
    runtimePromise.catch(() => {
      runtimePromise = null;
    });
  }

  return runtimePromise;
}

function fallbackModelUrl(src: string): string | null {
  return src.endsWith(".meshopt.glb") ? src.replace(/\.meshopt\.glb$/, ".glb") : null;
}

function isTexture(value: unknown): value is Texture {
  return Boolean(
    value &&
      typeof value === "object" &&
      "isTexture" in value &&
      (value as { isTexture?: unknown }).isTexture === true &&
      "dispose" in value,
  );
}
function disposeMaterial(material: Material): void {
  const values = Object.values(material as unknown as Record<string, unknown>);
  values.forEach((value) => {
    if (isTexture(value)) value.dispose();
  });
  material.dispose();
}

function disposeObject(root: Object3D): void {
  const materials = new Set<Material>();
  root.traverse((object) => {
    const candidate = object as Mesh;
    if (!candidate.isMesh) return;

    candidate.geometry?.dispose();
    const meshMaterials = Array.isArray(candidate.material)
      ? candidate.material
      : [candidate.material];
    meshMaterials.forEach((material) => materials.add(material));
  });
  materials.forEach(disposeMaterial);
}

function readViewDirection(
  view: string | undefined,
): readonly [number, number, number] {
  if (view === "front") return [0, 0.08, 1];
  if (view === "side") return [1, 0.08, 0];
  if (view === "top") return [0.01, 1, 0.01];
  return [1, 0.62, 1.2];
}
async function mountModelViewer(
  element: HTMLElement,
  motion?: MotionPreference,
): Promise<() => void> {
  const canvas = element.querySelector<HTMLCanvasElement>("[data-model-viewer-canvas]");
  const modelSrc = element.dataset.modelSrc?.trim();
  if (!canvas || !modelSrc) {
    element.dataset.modelState = "error";
    return noop;
  }

  element.dataset.modelState = "loading";
  const runtime = await getRuntime();
  const { THREE, GLTFLoader, OrbitControls, RoomEnvironment, MeshoptDecoder } = runtime;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.001, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.8;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const fallbackSrc = fallbackModelUrl(modelSrc);
  let loadedSrc = modelSrc;
  let gltf;

  try {
    gltf = await loader.loadAsync(modelSrc);
  } catch (primaryError) {
    if (!fallbackSrc) throw primaryError;
    loadedSrc = fallbackSrc;
    gltf = await loader.loadAsync(fallbackSrc);
  }

  const model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  const radius = Math.max(size.length() * 0.5, 0.001);
  const direction = new THREE.Vector3(...readViewDirection(element.dataset.modelView)).normalize();
  const fovRadians = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const distance = (radius / Math.sin(fovRadians)) * 1.12;
  camera.position.copy(direction.multiplyScalar(distance));
  camera.near = Math.max(distance / 100, 0.0005);
  camera.far = Math.max(distance * 24, 10);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.minDistance = radius * 1.05;
  controls.maxDistance = radius * 8;
  controls.update();

  const replacedTextures = new Set<Texture>();
  const screenSrc = element.dataset.modelScreenSrc?.trim();
  let screenTexture: Texture | null = null;
  if (screenSrc) {
    try {
      screenTexture = await new THREE.TextureLoader().loadAsync(screenSrc);
      screenTexture.colorSpace = THREE.SRGBColorSpace;
      screenTexture.flipY = false;
      model.traverse((object) => {
        const mesh = object as Mesh;
        const isScreen = mesh.isMesh &&
          (mesh.name === "SCREEN_CONTENT" || mesh.userData.runtime_role === "screen");
        if (!isScreen) return;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          const mapped = material as Material & {
            map?: Texture | null;
            emissiveMap?: Texture | null;
            needsUpdate: boolean;
          };
          if ("map" in mapped) {
            if (isTexture(mapped.map)) replacedTextures.add(mapped.map);
            mapped.map = screenTexture;
          }
          if ("emissiveMap" in mapped && mapped.emissiveMap) {
            if (isTexture(mapped.emissiveMap)) replacedTextures.add(mapped.emissiveMap);
            mapped.emissiveMap = screenTexture;
          }
          mapped.needsUpdate = true;
        });
      });
    } catch (error) {
      console.warn("Model viewer screen texture failed to load.", error);
      screenTexture = null;
    }
  }

  element.dataset.modelVariant = loadedSrc === modelSrc && modelSrc.endsWith(".meshopt.glb")
    ? "meshopt"
    : "compat";
  element.dataset.modelState = "ready";

  let frame = 0;
  let destroyed = false;
  let visible = true;
  let documentVisible = !document.hidden;
  let motionAllowed = motion?.allowsMotion() ?? false;
  const autoRotate = element.dataset.modelAutorotate !== "false";
  let previousTime = performance.now();
  const renderOnce = () => {
    if (!destroyed) renderer.render(scene, camera);
  };

  const shouldAnimate = () => autoRotate && visible && documentVisible && motionAllowed;

  const tick = (time: number) => {
    frame = 0;
    if (destroyed || !shouldAnimate()) return;
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    model.rotation.y += delta * 0.28;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };

  const syncAnimation = () => {
    if (shouldAnimate()) {
      if (!frame) {
        previousTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
      return;
    }
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    renderOnce();
  };

  const resize = () => {
    const rect = element.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderOnce();
  };

  const handleVisibilityChange = () => {
    documentVisible = !document.hidden;
    syncAnimation();
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);
  controls.addEventListener("change", renderOnce);

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(resize)
    : null;
  resizeObserver?.observe(element);

  const visibilityObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        const entry = entries[0];
        visible = entry?.isIntersecting ?? true;
        syncAnimation();
      }, { rootMargin: "160px 0px", threshold: 0 })
    : null;
  visibilityObserver?.observe(element);

  const unsubscribeMotion = motion?.subscribe(({ allowed }) => {
    motionAllowed = allowed;
    syncAnimation();
  }) ?? noop;
  resize();
  syncAnimation();

  return () => {
    destroyed = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    unsubscribeMotion();
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    controls.removeEventListener("change", renderOnce);
    controls.dispose();
    scene.remove(model);
    disposeObject(model);
    replacedTextures.forEach((texture) => texture.dispose());
    screenTexture?.dispose();
    scene.environment = null;
    environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    delete element.dataset.modelState;
    delete element.dataset.modelVariant;
  };
}

export function createModelViewers(
  { root = document, motion }: ModelViewerOptions = {},
): () => void {
  const elements = [...root.querySelectorAll<HTMLElement>(MODEL_VIEWER_SELECTOR)];
  if (!elements.length) return noop;

  const mounted = new Map<HTMLElement, () => void>();
  let destroyed = false;
  const mount = (element: HTMLElement) => {
    if (mounted.has(element)) return;
    mounted.set(element, noop);
    void mountModelViewer(element, motion)
      .then((destroy) => {
        if (destroyed) {
          destroy();
          return;
        }
        mounted.set(element, destroy);
      })
      .catch((error: unknown) => {
        element.dataset.modelState = "error";
        console.error("Model viewer failed to initialize.", error);
      });
  };

  const observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target;
          if (!(element instanceof HTMLElement)) return;
          currentObserver.unobserve(element);
          mount(element);
        });
      }, { rootMargin: MODEL_VIEWER_ROOT_MARGIN, threshold: 0 })
    : null;

  elements.forEach((element) => {
    if (observer) observer.observe(element);
    else mount(element);
  });

  return () => {
    destroyed = true;
    observer?.disconnect();
    mounted.forEach((destroy) => destroy());
    mounted.clear();
  };
}
