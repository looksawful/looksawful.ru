import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

gsap.registerPlugin(ScrollTrigger);

const STAGE_SELECTOR = "#jestei-logo-follow";
const SECTION_SELECTOR = "#jestei-pool";
const LOGO_URL = new URL("./models/logo.glb", import.meta.url).href;
const LOGO_FOLLOW_ENABLED = false;
const LOGO_Z = -0.1;
const LOGO_TEXT_GAP = 120;
const LOGO_VIEWPORT_PAD = 56;
const LOGO_SCALE_MULTIPLIER = 0.5;
const LOGO_ROUTE_SCRUB = 0.85;
const LOGO_ROUTE_EASE = "sine.inOut";

const LOGO_ROUTE_BLOCKS = [
  { labelId: "jestei-logo-title", side: "left", scale: 0.74 },
  { labelId: "jestei-type-title", side: "right", scale: 0.86 },
  { labelId: "jestei-color-title", side: "left", scale: 0.78 },
  { labelId: "jestei-products-position-title", side: "media-center", scale: 0.88 },
];

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
loader.setDRACOLoader(dracoLoader);

const tuneLogoMaterials = (logo, renderer) => {
  logo.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.geometry.computeVertexNormals();

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      if (!material) {
        return;
      }

      material.side = THREE.FrontSide;
      material.needsUpdate = true;
      material.metalness = 0.8;
      material.roughness = 0.25;
      material.emissive = new THREE.Color("#000000");
      material.emissiveIntensity = 0.15;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }

      if (material.normalMap) {
        material.normalScale.set(1, 1);
      }
    });
  });
};

const initLogoFollow = () => {
  if (!LOGO_FOLLOW_ENABLED) {
    return;
  }

  const stage = document.querySelector(STAGE_SELECTOR);
  const section = document.querySelector(SECTION_SELECTOR);

  if (!stage || !section || stage.dataset.logoFollowMounted === "true") {
    return;
  }

  const routeBlocks = LOGO_ROUTE_BLOCKS.map((routeBlock) => {
    const title = document.getElementById(routeBlock.labelId);
    const block = title?.closest(".subarticle");

    if (!block) {
      return null;
    }

    const media = block.querySelector(".subarticle__media");
    const body = block.querySelector(".subarticle__body");

    if (!media || !body) {
      return null;
    }

    return {
      ...routeBlock,
      block,
      media,
      body,
    };
  }).filter(Boolean);

  if (routeBlocks.length < 2) {
    return;
  }

  stage.dataset.logoFollowMounted = "true";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  const logoMotion = {
    x: 0,
    y: 0,
    z: LOGO_Z,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 0.55 * LOGO_SCALE_MULTIPLIER,
  };

  let logo = null;
  let logoRoutePoints = [];
  let logoRouteProgress = 0;

  camera.position.set(0, 0, 5);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;

  stage.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(3, 4, 5);

  const fillLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);

  scene.add(keyLight);
  scene.add(fillLight);

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (logoRoutePoints.length) {
      refreshLogoRoute();
      setLogoMotion(getLogoMotionAtProgress(logoRouteProgress));
    }
  };

  const showStage = () => {
    stage.classList.add("is-active");
  };

  const hideStage = () => {
    stage.classList.remove("is-active");
  };

  const getDocumentTop = (element) => element.getBoundingClientRect().top + window.scrollY;
  const getMediaCenterScroll = (media) => {
    const rect = media.getBoundingClientRect();

    return getDocumentTop(media) + rect.height / 2;
  };
  const getCenteredMediaScroll = (media) => getMediaCenterScroll(media) - window.innerHeight / 2;

  const getClientX = ({ side, media, body }) => {
    const mediaRect = media.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    if (side === "media-center") {
      return mediaRect.left + mediaRect.width / 2;
    }

    const contentLeft = Math.min(mediaRect.left, bodyRect.left);
    const contentRight = Math.max(mediaRect.right, bodyRect.right);
    const outsideContentX = side === "left" ? contentLeft - LOGO_TEXT_GAP : contentRight + LOGO_TEXT_GAP;

    return gsap.utils.clamp(LOGO_VIEWPORT_PAD, window.innerWidth - LOGO_VIEWPORT_PAD, outsideContentX);
  };

  const getWorldPoint = (clientX, clientY, z = LOGO_Z) => {
    const pointer = new THREE.Vector3((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1, 0.5);
    pointer.unproject(camera);

    const direction = pointer.sub(camera.position).normalize();
    const distance = (z - camera.position.z) / direction.z;

    return camera.position.clone().add(direction.multiplyScalar(distance));
  };

  const createRoutePoint = (routeBlock, startScroll, endScroll, index) => {
    const mediaCenterScroll = getMediaCenterScroll(routeBlock.media);
    const pointScroll = getCenteredMediaScroll(routeBlock.media);
    const at =
      index === 0
        ? 0
        : index === routeBlocks.length - 1
          ? 1
          : gsap.utils.clamp(0, 1, (pointScroll - startScroll) / (endScroll - startScroll || 1));
    const clientY = mediaCenterScroll - pointScroll;
    const worldPoint = getWorldPoint(getClientX(routeBlock), clientY);

    return {
      at,
      x: worldPoint.x,
      y: worldPoint.y,
      z: worldPoint.z,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: routeBlock.scale * LOGO_SCALE_MULTIPLIER,
    };
  };

  const refreshLogoRoute = () => {
    const startScroll = getCenteredMediaScroll(routeBlocks[0].media);
    const endScroll = getCenteredMediaScroll(routeBlocks[routeBlocks.length - 1].media);

    logoRoutePoints = routeBlocks
      .map((routeBlock, index) => createRoutePoint(routeBlock, startScroll, endScroll, index))
      .sort((a, b) => a.at - b.at);
  };

  const interpolateLogoMotion = (from, to, progress) => {
    const easedProgress = gsap.parseEase(LOGO_ROUTE_EASE)(gsap.utils.clamp(0, 1, progress));

    return {
      x: gsap.utils.interpolate(from.x, to.x, easedProgress),
      y: gsap.utils.interpolate(from.y, to.y, easedProgress),
      z: gsap.utils.interpolate(from.z, to.z, easedProgress),
      rotationX: gsap.utils.interpolate(from.rotationX, to.rotationX, easedProgress),
      rotationY: gsap.utils.interpolate(from.rotationY, to.rotationY, easedProgress),
      rotationZ: gsap.utils.interpolate(from.rotationZ, to.rotationZ, easedProgress),
      scale: gsap.utils.interpolate(from.scale, to.scale, easedProgress),
    };
  };

  const getLogoMotionAtProgress = (progress) => {
    const clampedProgress = gsap.utils.clamp(0, 1, progress);
    const nextIndex = logoRoutePoints.findIndex((point) => point.at >= clampedProgress);

    if (nextIndex <= 0) {
      return logoRoutePoints[0];
    }

    if (nextIndex === -1) {
      return logoRoutePoints[logoRoutePoints.length - 1];
    }

    const from = logoRoutePoints[nextIndex - 1];
    const to = logoRoutePoints[nextIndex];
    const localProgress = (clampedProgress - from.at) / (to.at - from.at || 1);

    return interpolateLogoMotion(from, to, localProgress);
  };

  const setLogoMotion = (nextMotion) => {
    Object.assign(logoMotion, nextMotion);
  };

  const setupScrollAnimation = () => {
    const firstBlock = routeBlocks[0].block;
    const lastBlock = routeBlocks[routeBlocks.length - 1].block;
    const firstMedia = routeBlocks[0].media;
    const lastMedia = routeBlocks[routeBlocks.length - 1].media;

    ScrollTrigger.create({
      trigger: firstBlock,
      start: "top 82%",
      endTrigger: lastBlock,
      end: "bottom 18%",
      onEnter: showStage,
      onEnterBack: showStage,
      onLeave: hideStage,
      onLeaveBack: hideStage,
    });

    ScrollTrigger.create({
      trigger: firstMedia,
      start: "center center",
      endTrigger: lastMedia,
      end: "center center",
      scrub: LOGO_ROUTE_SCRUB,
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        logoRouteProgress = self.progress;
        refreshLogoRoute();
        setLogoMotion(getLogoMotionAtProgress(logoRouteProgress));
      },
      onUpdate: (self) => {
        logoRouteProgress = self.progress;
        setLogoMotion(getLogoMotionAtProgress(logoRouteProgress));
      },
    });
  };

  loader.load(
    LOGO_URL,
    (gltf) => {
      logo = gltf.scene;
      tuneLogoMaterials(logo, renderer);
      scene.add(logo);
    },
    undefined,
    (error) => {
      console.error("Error loading logo follow model:", error);
    },
  );

  const animate = () => {
    if (logo) {
      logo.position.set(logoMotion.x, logoMotion.y, logoMotion.z);
      logo.rotation.set(logoMotion.rotationX, logoMotion.rotationY, logoMotion.rotationZ);
      logo.scale.setScalar(logoMotion.scale);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  window.addEventListener("resize", resize);
  resize();
  refreshLogoRoute();
  setLogoMotion(getLogoMotionAtProgress(0));
  setupScrollAnimation();
  animate();
};

initLogoFollow();
