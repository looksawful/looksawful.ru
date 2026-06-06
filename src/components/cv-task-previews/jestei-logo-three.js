import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import logoModelUrl from "../../visuals/assets/projects/jestei/logo/logo.glb?url";

const LOGO_MODEL_URL = logoModelUrl;
const MIN_RENDER_SIZE = 64;
const MAX_RENDER_SIZE = 320;

function clampRenderSize(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), MIN_RENDER_SIZE), MAX_RENDER_SIZE);
}

function prepareMesh(child, renderer, materials) {
  if (!child.isMesh) {
    return;
  }

  child.castShadow = true;
  child.receiveShadow = true;
  child.geometry?.computeVertexNormals?.();

  if (!child.material) {
    return;
  }

  const materialList = Array.isArray(child.material) ? child.material : [child.material];

  materialList.forEach((material) => {
    material.side = THREE.FrontSide;
    material.metalness = 0.8;
    material.roughness = 0.25;
    material.emissive ??= new THREE.Color("#000000");
    material.emissiveIntensity = 0.15;
    material.needsUpdate = true;
    materials.push(material);

    if (material.map) {
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
  });
}

export function mountJesteiLogoThree(canvas) {
  if (!(canvas instanceof HTMLCanvasElement) || canvas.dataset.threeMounted === "true") {
    return () => {};
  }

  canvas.dataset.threeMounted = "true";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  const logoMaterials = [];

  let frameId = 0;
  let disposed = false;
  let model = null;
  let lastWidth = 0;
  let lastHeight = 0;

  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  loader.setDRACOLoader(dracoLoader);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.DirectionalLight(0xffffff, 2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
  scene.children[0].position.set(3, 4, 5);

  camera.position.set(0, 0, 2.5);

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const width = clampRenderSize(bounds.width || canvas.clientWidth);
    const height = clampRenderSize(bounds.height || canvas.clientHeight);

    if (!width || !height) {
      return;
    }

    if (width === lastWidth && height === lastHeight) {
      return;
    }

    lastWidth = width;
    lastHeight = height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const animate = () => {
    if (disposed) {
      return;
    }

    frameId = requestAnimationFrame(animate);
    resize();

    if (model) {
      model.rotation.y += 0.01;

      logoMaterials.forEach((material) => {
        material.color.set("#000000");
        material.emissive.set("#000000");
      });
    }

    renderer.render(scene, camera);
  };

  loader.load(
    LOGO_MODEL_URL,
    (gltf) => {
      if (disposed) {
        return;
      }

      model = gltf.scene;
      model.traverse((child) => prepareMesh(child, renderer, logoMaterials));
      model.position.set(0, 0, 0);
      model.scale.setScalar(1);
      scene.add(model);
    },
    undefined,
    (error) => {
      console.error("Failed to load Jestei Pool 3D logo:", error);
    },
  );

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener("resize", resize);
  resize();
  animate();

  return () => {
    disposed = true;
    window.removeEventListener("resize", resize);
    resizeObserver.disconnect();
    cancelAnimationFrame(frameId);
    pmremGenerator.dispose();
    dracoLoader.dispose();
    renderer.dispose();
    delete canvas.dataset.threeMounted;
  };
}

