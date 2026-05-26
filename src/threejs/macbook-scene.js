/**
 * macbook-scene.js
 *
 * Three.js scene for MacBook GLB.
 *
 * Исправления:
 * - без тени-плашки под ноутом
 * - без contact shadow plane
 * - широкий угол камеры
 * - ручное управление ориентацией текстуры экрана
 * - экран без копирования сломанного GLB Mapping
 * - экран чёткий, toneMapped: false
 * - стекло почти прозрачное, не забивает интерфейс
 * - материалы не делаются случайно металлическими
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const GLB_URL = new URL("../assets/projects/jestei/macbook/model/macbook-threejs-ready.glb", import.meta.url).href;
const SCREEN_URL = new URL("../assets/projects/jestei/macbook/screen/screen-ui-current.png", import.meta.url).href;

/**
 * Общая композиция.
 * Увеличивай MODEL_SCALE_TARGET, если ноут маленький.
 * Уменьшай, если ноут вылезает за блок.
 */
const MODEL_SCALE_TARGET = 1.5;
const MODEL_OFFSET = new THREE.Vector3(0.18, -0.03, 0.0);

/**
 * Широкоугольная камера.
 * FOV 55–65 = заметная перспективная деформация.
 */
const CAMERA = {
  fov: 62,
  near: 0.01,
  far: 100,
  pos: new THREE.Vector3(0.95, 0.58, 1.52),
  target: new THREE.Vector3(0.12, 0.34, -0.05),
};

/**
 * Ручная ориентация картинки экрана.
 *
 * Судя по скрину, сейчас нужно 180°:
 * SCREEN_ROTATION = Math.PI
 *
 * Если окажется не так, меняй только это:
 * 0
 * Math.PI
 * Math.PI / 2
 * -Math.PI / 2
 */
const SCREEN_ROTATION = Math.PI / 2;
const SCREEN_FLIP_Y = true;

const SCREEN_REPEAT = new THREE.Vector2(1, 1);
const SCREEN_OFFSET = new THREE.Vector2(0, 0);
const SCREEN_CENTER = new THREE.Vector2(0.5, 0.5);

/**
 * Стекло экрана.
 * 0.0 = стекла визуально нет, интерфейс максимально чистый.
 * 0.03–0.08 = лёгкое стекло.
 */
const SCREEN_GLASS_OPACITY = 0.035;

const LIGHTS = {
  key: {
    color: 0xfff2e4,
    intensity: 2.8,
    position: new THREE.Vector3(-2.4, 3.2, 2.6),
  },
  fill: {
    color: 0xcddcff,
    intensity: 0.75,
    position: new THREE.Vector3(2.2, 1.4, 2.0),
  },
  rim: {
    color: 0xe6eeff,
    intensity: 1.35,
    position: new THREE.Vector3(2.8, 1.7, -2.6),
  },
  ambient: {
    color: 0xffffff,
    intensity: 0.08,
  },
};

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function isScreenMaterial(mat) {
  const name = (mat?.name || "").toLowerCase();
  return name.includes("screen_ui") || name.includes("screen-picture") || name.includes("screen_picture");
}

function isGlassMaterial(mat) {
  const name = (mat?.name || "").toLowerCase();
  return name.includes("screen-glass") || name.includes("glass");
}

function isSpeakerMaterial(mat, meshName = "") {
  const name = `${mat?.name || ""} ${meshName}`.toLowerCase();
  return name.includes("speaker") || name.includes("raycast") || name.includes("grille");
}

function isKeyboardMaterial(mat, meshName = "") {
  const name = `${mat?.name || ""} ${meshName}`.toLowerCase();
  return name.includes("key") || name.includes("keyboard") || name.includes("keycaps");
}

function isBodyMaterial(mat, meshName = "") {
  const name = `${mat?.name || ""} ${meshName}`.toLowerCase();

  return (
    name.includes("body") ||
    name.includes("base") ||
    name.includes("top_case") ||
    name.includes("trackpad") ||
    name.includes("apple")
  );
}

function setupTexture(tex, renderer, isColor = false) {
  if (!tex) return;

  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }

  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
}

function setupScreenTexture(tex, renderer) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = SCREEN_FLIP_Y;

  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  tex.center.copy(SCREEN_CENTER);
  tex.rotation = SCREEN_ROTATION;
  tex.repeat.copy(SCREEN_REPEAT);
  tex.offset.copy(SCREEN_OFFSET);

  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;

  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
}

function cloneMaterial(mat) {
  if (!mat) return null;

  const cloned = mat.clone();
  cloned.name = mat.name;

  return cloned;
}

function makeScreenMaterial(screenTex, renderer) {
  setupScreenTexture(screenTex, renderer);

  const mat = new THREE.MeshBasicMaterial({
    name: "SCREEN_UI_EXTERNAL",
    map: screenTex,
    toneMapped: false,
    transparent: false,
    side: THREE.DoubleSide,
  });

  return mat;
}

function makeRuntimeGlassMaterial(baseMat) {
  return new THREE.MeshPhysicalMaterial({
    name: baseMat?.name || "screen-glass-runtime",
    color: new THREE.Color(0xeaf3ff),
    metalness: 0.0,
    roughness: 0.018,
    transparent: true,
    opacity: SCREEN_GLASS_OPACITY,
    transmission: 0.0,
    thickness: 0.01,
    ior: 1.45,
    envMapIntensity: 1.25,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

function improveGenericPBR(mat, meshName, renderer) {
  if (!mat) return mat;

  const m = cloneMaterial(mat);

  setupTexture(m.map, renderer, true);
  setupTexture(m.normalMap, renderer, false);
  setupTexture(m.roughnessMap, renderer, false);
  setupTexture(m.metalnessMap, renderer, false);
  setupTexture(m.aoMap, renderer, false);
  setupTexture(m.alphaMap, renderer, false);

  if (isKeyboardMaterial(m, meshName)) {
    m.metalness = 0.0;
    m.roughness = 0.86;

    if (!m.map) {
      m.color = new THREE.Color(0x080808);
    }
  } else if (isSpeakerMaterial(m, meshName)) {
    m.metalness = 0.0;
    m.roughness = 0.92;
    m.alphaTest = Math.max(m.alphaTest || 0, 0.45);
    m.transparent = false;
    m.depthWrite = true;

    if (!m.map) {
      m.color = new THREE.Color(0x030303);
    }
  } else if (isBodyMaterial(m, meshName)) {
    const lower = `${m.name} ${meshName}`.toLowerCase();

    if (lower.includes("black") || lower.includes("dark")) {
      m.metalness = 0.0;
      m.roughness = 0.74;

      if (!m.map) {
        m.color = new THREE.Color(0x0a0a0a);
      }
    } else if (lower.includes("trackpad")) {
      m.metalness = 0.35;
      m.roughness = 0.5;

      if (!m.map) {
        m.color = new THREE.Color(0x6b6760);
      }
    } else {
      m.metalness = 0.8;
      m.roughness = 0.42;

      if (!m.map) {
        m.color = new THREE.Color(0x8f8a82);
      }
    }
  }

  m.envMapIntensity = 1.0;
  m.needsUpdate = true;

  return m;
}

function applyMaterialPipeline(model, screenTex, renderer) {
  model.traverse((child) => {
    if (!child.isMesh) return;

    /**
     * На белом сайте под ноутом не нужна тень-плашка.
     * Поэтому тени полностью отключаем на мешах.
     */
    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMats = Array.isArray(child.material) ? child.material : [child.material];

    const nextMats = sourceMats.map((mat) => {
      if (!mat) return mat;

      if (isScreenMaterial(mat)) {
        return makeScreenMaterial(screenTex, renderer);
      }

      if (isGlassMaterial(mat)) {
        return makeRuntimeGlassMaterial(mat);
      }

      return improveGenericPBR(mat, child.name, renderer);
    });

    child.material = Array.isArray(child.material) ? nextMats : nextMats[0];
  });
}

function normalizeModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSide = Math.max(size.x, size.y, size.z, 0.001);
  const scale = MODEL_SCALE_TARGET / maxSide;

  model.scale.setScalar(scale);

  model.position.set(
    -center.x * scale + MODEL_OFFSET.x,
    -box.min.y * scale + MODEL_OFFSET.y,
    -center.z * scale + MODEL_OFFSET.z,
  );

  model.updateMatrixWorld(true);

  return model;
}

function setupRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 0);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;

  /**
   * Важно: никаких теней под ноутом.
   */
  renderer.shadowMap.enabled = false;

  return renderer;
}

function setupEnvironment(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.045).texture;

  scene.environment = env;
  scene.background = null;

  return env;
}

function setupLights(scene) {
  const keyLight = new THREE.DirectionalLight(LIGHTS.key.color, LIGHTS.key.intensity);
  keyLight.name = "KEY_LIGHT";
  keyLight.position.copy(LIGHTS.key.position);
  keyLight.castShadow = false;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(LIGHTS.fill.color, LIGHTS.fill.intensity);
  fillLight.name = "FILL_LIGHT";
  fillLight.position.copy(LIGHTS.fill.position);
  fillLight.castShadow = false;
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(LIGHTS.rim.color, LIGHTS.rim.intensity);
  rimLight.name = "RIM_LIGHT";
  rimLight.position.copy(LIGHTS.rim.position);
  rimLight.castShadow = false;
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(LIGHTS.ambient.color, LIGHTS.ambient.intensity);
  ambient.name = "AMBIENT_MINIMAL";
  scene.add(ambient);

  return {
    keyLight,
    fillLight,
    rimLight,
    ambient,
  };
}

function fitCameraToCanvas(camera, canvas) {
  const parent = canvas.parentElement;
  const w = (parent ? parent.clientWidth : canvas.clientWidth) || 1;
  const h = (parent ? parent.clientHeight : canvas.clientHeight) || 1;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  return { w, h };
}

export function mountMacbookScene(canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) return () => {};

  const renderer = setupRenderer(canvas);
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.copy(CAMERA.pos);
  camera.lookAt(CAMERA.target);

  setupEnvironment(scene, renderer);
  setupLights(scene);

  let model = null;
  let mixer = null;
  let action = null;
  let clipDuration = 0;
  let openProgress = 1;
  let microT = 0;

  const screenTexturePromise = new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(SCREEN_URL, (tex) => resolve(tex), undefined, reject);
  });

  const gltfPromise = new Promise((resolve, reject) => {
    new GLTFLoader().load(GLB_URL, resolve, undefined, reject);
  });

  Promise.all([screenTexturePromise, gltfPromise])
    .then(([screenTex, gltf]) => {
      model = gltf.scene;

      normalizeModel(model);
      applyMaterialPipeline(model, screenTex, renderer);

      scene.add(model);

      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);

        const clip =
          gltf.animations.find((a) => /lid|hinge|open|close|top_case|cover/i.test(a.name)) || gltf.animations[0];

        clipDuration = clip.duration;
        action = mixer.clipAction(clip);
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
        action.play();
      } else {
        openProgress = 1;
      }

      console.group("[macbook-scene] loaded");
      console.log(
        "animations:",
        gltf.animations.map((a) => a.name),
      );
      model.traverse((child) => {
        if (!child.isMesh) return;

        const mats = Array.isArray(child.material) ? child.material : [child.material];

        console.log(
          child.name,
          mats.map((m) => m?.name),
        );
      });
      console.groupEnd();
    })
    .catch((error) => {
      console.error("[macbook-scene] load error:", error);
    });

  function resize() {
    const { w, h } = fitCameraToCanvas(camera, canvas);
    renderer.setSize(w, h, false);
  }

  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement ?? canvas);

  const clock = new THREE.Clock();
  let rafId = null;

  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  function tick() {
    rafId = requestAnimationFrame(tick);

    const delta = clock.getDelta();
    microT += delta;

    if (mixer) {
      mixer.update(delta);

      if (clipDuration > 0 && action) {
        openProgress = THREE.MathUtils.clamp(mixer.time / clipDuration, 0, 1);
      }
    }

    const eased = easeInOutCubic(openProgress);

    camPos.copy(CAMERA.pos);
    camTarget.copy(CAMERA.target);

    /**
     * Очень слабое движение после старта.
     * Можно удалить, если нужен полностью статичный рендер.
     */
    camPos.x += Math.sin(microT * 0.22) * 0.01 * eased;
    camPos.y += Math.sin(microT * 0.17) * 0.006 * eased;

    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    renderer.render(scene, camera);
  }

  tick();

  return () => {
    cancelAnimationFrame(rafId);
    ro.disconnect();

    scene.traverse((obj) => {
      if (!obj.isMesh) return;

      if (obj.geometry) {
        obj.geometry.dispose();
      }

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      mats.forEach((mat) => {
        if (!mat) return;
        mat.dispose();
      });
    });

    renderer.dispose();
  };
}
