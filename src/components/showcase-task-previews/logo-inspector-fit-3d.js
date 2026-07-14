import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const BACKGROUND = "#ffffff";
const TARGET_Z = 0.7;
const REVEAL_DURATION = 760;
const REVEAL_STAGGER = 560;
const IDLE_SPEED = 0.36;
const DRAG_SPEED = 0.008;

const DEFAULT_VARIANTS = [
  { id: "pro", color: "#157AFF" },
  { id: "club", color: "#F18200" },
  { id: "event", color: "#D1E231" },
  { id: "experimental", color: "#B2A1EA" },
];

function injectStyles() {}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(value) {
  const t = clamp(value, 0, 1);
  const c1 = 1.08;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function traverseMeshes(root, callback) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) callback(child);
  });
}

function disposeObject(root) {
  const geometries = new Set();
  const materials = new Set();
  traverseMeshes(root, (mesh) => {
    if (mesh.geometry && !geometries.has(mesh.geometry)) {
      geometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    list.forEach((material) => {
      if (!material || materials.has(material)) return;
      materials.add(material);
      material.dispose();
    });
  });
}

async function loadModel(url) {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  draco.setDecoderConfig({ type: "wasm" });
  loader.setDRACOLoader(draco);
  try {
    const gltf = await loader.loadAsync(url);
    return gltf.scene;
  } finally {
    draco.dispose();
  }
}

function normalizeModel(root) {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
  root.updateWorldMatrix(true, true);

  const sphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  const diameter = Math.max(sphere.radius * 2, 0.001);
  root.scale.multiplyScalar(2.35 / diameter);
  root.updateWorldMatrix(true, true);

  const normalizedSphere = new THREE.Box3().setFromObject(root).getBoundingSphere(new THREE.Sphere());
  return Math.max(normalizedSphere.radius * 2, 0.001);
}

function createLogo(source, variant, index) {
  const group = new THREE.Group();
  const model = source.clone(true);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(variant.color),
    roughness: 0.34,
    metalness: 0.64,
    clearcoat: 0.42,
    clearcoatRoughness: 0.36,
    envMapIntensity: 1.24,
  });

  traverseMeshes(model, (mesh) => {
    mesh.material = material.clone();
    mesh.userData.logoGroup = group;
  });

  group.userData.variant = variant;
  group.userData.index = index;
  group.userData.baseRotationX = 0.14;
  group.userData.baseRotationY = -0.22 + index * 0.15;
  group.userData.baseRotationZ = index % 2 === 0 ? -0.045 : 0.045;
  group.userData.targetPosition = new THREE.Vector3();
  group.userData.targetScale = 1;
  group.userData.layoutReady = false;
  group.rotation.set(
    group.userData.baseRotationX,
    group.userData.baseRotationY,
    group.userData.baseRotationZ,
  );
  group.add(model);
  group.visible = false;
  return group;
}

function layoutProfile(width) {
  if (width < 600) {
    return {
      fov: 42,
      cameraZ: 9.6,
      edgePx: clamp(width * 0.065, 20, 34),
      gapPx: clamp(width * 0.075, 22, 40),
      maxLogoPx: clamp(width * 0.34, 92, 170),
    };
  }
  if (width < 960) {
    return {
      fov: 38,
      cameraZ: 8.9,
      edgePx: clamp(width * 0.055, 28, 52),
      gapPx: clamp(width * 0.06, 30, 58),
      maxLogoPx: clamp(width * 0.31, 150, 260),
    };
  }
  return {
    fov: 34,
    cameraZ: 8.2,
    edgePx: clamp(width * 0.045, 40, 76),
    gapPx: clamp(width * 0.05, 44, 84),
    maxLogoPx: clamp(width * 0.27, 220, 360),
  };
}

export function createLogoInspector3D(target, options = {}) {
  injectStyles();
  const host = typeof target === "string" ? document.querySelector(target) : target;
  if (!host) throw new Error("createLogoInspector3D: target not found");

  const modelUrl = options.modelUrl || options.assets?.model || "./logo.glb";
  const posterUrl = options.assets?.poster || "/assets/jestei/branding/jestei-logo-mark.svg";
  const variants = DEFAULT_VARIANTS.map((fallback) =>
    options.variants?.find((variant) => variant.id === fallback.id) || fallback,
  );

  host.textContent = "";
  const root = document.createElement("section");
  root.className = "logo-inspector-fit-3d";
  const canvasHost = document.createElement("div");
  canvasHost.className = "logo-inspector-fit-3d__canvas";
  const poster = document.createElement("img");
  poster.className = "logo-inspector-fit-3d__poster";
  poster.alt = "";
  poster.decoding = "async";
  poster.src = posterUrl;
  root.append(canvasHost, poster);
  host.append(root);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  canvasHost.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 220);
  camera.position.set(0, 0, 8.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
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

  let modelDiameter = 2.35;
  let sourceRoot = null;
  let hovered = null;
  let dragged = null;
  let lastX = 0;
  let lastY = 0;
  let introStart = 0;
  let introComplete = false;
  let destroyed = false;
  let raf = 0;
  let previousTime = performance.now();

  const findGroup = (object) => {
    let current = object;
    while (current) {
      if (current.userData?.variant) return current;
      if (current.userData?.logoGroup) return current.userData.logoGroup;
      current = current.parent;
    }
    return null;
  };

  const pick = (event) => {
    if (!introComplete) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(stage.children, true)[0];
    return hit ? findGroup(hit.object) : null;
  };

  const layout = () => {
    const width = Math.max(canvasHost.clientWidth, 1);
    const height = Math.max(canvasHost.clientHeight, 1);
    const profile = layoutProfile(width);
    const aspect = width / height;
    const distance = profile.cameraZ - TARGET_Z;
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(profile.fov / 2)) * distance;
    const visibleWidth = visibleHeight * aspect;
    const worldPerPixelX = visibleWidth / width;
    const worldPerPixelY = visibleHeight / height;

    const edgeX = profile.edgePx * worldPerPixelX;
    const edgeY = profile.edgePx * worldPerPixelY;
    const gapX = profile.gapPx * worldPerPixelX;
    const gapY = profile.gapPx * worldPerPixelY;
    const maxDiameterWorld = Math.min(
      profile.maxLogoPx * worldPerPixelX,
      profile.maxLogoPx * worldPerPixelY,
    );
    const cellWidth = Math.max((visibleWidth - edgeX * 2 - gapX) / 2, 0.01);
    const cellHeight = Math.max((visibleHeight - edgeY * 2 - gapY) / 2, 0.01);
    const fittedDiameter = Math.max(Math.min(cellWidth, cellHeight, maxDiameterWorld), 0.01);
    const scale = fittedDiameter / modelDiameter;
    const spacingX = fittedDiameter + gapX;
    const spacingY = fittedDiameter + gapY;

    camera.aspect = aspect;
    camera.fov = profile.fov;
    camera.position.z = profile.cameraZ;
    camera.updateProjectionMatrix();

    stage.children.forEach((logo, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      logo.userData.targetPosition.set(
        (column === 0 ? -0.5 : 0.5) * spacingX,
        (row === 0 ? 0.5 : -0.5) * spacingY,
        TARGET_Z,
      );
      logo.userData.targetScale = scale;
      if (!logo.userData.layoutReady) {
        logo.position.set(0, 0, TARGET_Z);
        logo.scale.setScalar(scale * 0.42);
        logo.userData.layoutReady = true;
      } else if (introComplete) {
        logo.position.copy(logo.userData.targetPosition);
        logo.scale.setScalar(scale);
      }
    });
  };

  const resize = () => {
    const rect = canvasHost.getBoundingClientRect();
    renderer.setSize(Math.max(Math.round(rect.width), 1), Math.max(Math.round(rect.height), 1), false);
    layout();
  };

  renderer.domElement.addEventListener("pointerdown", (event) => {
    dragged = pick(event);
    if (!dragged) return;
    lastX = event.clientX;
    lastY = event.clientY;
    renderer.domElement.setPointerCapture?.(event.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (event) => {
    if (!dragged) {
      hovered = pick(event);
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    dragged.rotation.y += dx * DRAG_SPEED;
    dragged.rotation.x = clamp(dragged.rotation.x + dy * DRAG_SPEED, -1.4, 1.4);
  });
  const release = (event) => {
    if (!dragged) return;
    renderer.domElement.releasePointerCapture?.(event.pointerId);
    dragged = null;
  };
  renderer.domElement.addEventListener("pointerup", release);
  renderer.domElement.addEventListener("pointercancel", release);
  renderer.domElement.addEventListener("pointerleave", () => { hovered = null; });

  const observer = new ResizeObserver(resize);
  observer.observe(root);

  loadModel(modelUrl)
    .then((loaded) => {
      if (destroyed) return;
      sourceRoot = loaded;
      modelDiameter = normalizeModel(sourceRoot);
      variants.slice(0, 4).forEach((variant, index) => stage.add(createLogo(sourceRoot, variant, index)));
      layout();
      introStart = performance.now();
      root.classList.add("is-ready");
    })
    .catch((error) => console.error("[logo inspector fit] model failed", error));

  const render = (time) => {
    if (destroyed) return;
    const delta = clamp((time - previousTime) / 1000, 0, 0.05);
    previousTime = time;

    if (introStart && !introComplete) {
      const elapsed = time - introStart;
      stage.children.forEach((logo, index) => {
        const local = elapsed - index * REVEAL_STAGGER;
        if (local <= 0) {
          logo.visible = false;
          return;
        }
        const progress = reducedMotion ? 1 : clamp(local / REVEAL_DURATION, 0, 1);
        const move = easeOutCubic(progress);
        const scaleProgress = easeOutBack(progress);
        logo.visible = true;
        logo.position.lerpVectors(new THREE.Vector3(0, 0, TARGET_Z), logo.userData.targetPosition, move);
        logo.scale.setScalar(logo.userData.targetScale * THREE.MathUtils.lerp(0.42, 1, scaleProgress));
      });
      const total = REVEAL_DURATION + (stage.children.length - 1) * REVEAL_STAGGER;
      if (reducedMotion || elapsed >= total) {
        introComplete = true;
        stage.children.forEach((logo) => {
          logo.visible = true;
          logo.position.copy(logo.userData.targetPosition);
          logo.scale.setScalar(logo.userData.targetScale);
        });
      }
    }

    if (introComplete) {
      stage.children.forEach((logo) => {
        if (logo !== dragged && logo !== hovered) logo.rotation.y += delta * IDLE_SPEED;
      });
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };

  resize();
  raf = requestAnimationFrame(render);

  return {
    element: root,
    dispose() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      disposeObject(stage);
      if (sourceRoot) disposeObject(sourceRoot);
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      root.remove();
    },
  };
}
