import { createScene } from "./scene.js";
import { createCamera } from "./camera.js";
import { createRenderer } from "./renderer.js";
import { addObjects } from "./objects.js";

const CAMERA_OPTIONS = {
  logo: { fov: 60, z: 2.5 },
  laptop: { fov: 42, y: 0.04, z: 2.65 },
};

export const mountThreeCanvas = (target = "#three-canvas") => {
  const canvas = typeof target === "string" ? document.querySelector(target) : target;

  if (
    !(canvas instanceof HTMLCanvasElement) ||
    canvas.dataset.threeMounted === "true" ||
    canvas.closest(".scene-wrap--hidden")
  ) {
    return null;
  }

  canvas.dataset.threeMounted = "true";

  const sceneType = canvas.dataset.threeScene ?? "logo";
  const scene = createScene();
  const camera = createCamera(canvas, CAMERA_OPTIONS[sceneType]);
  const renderer = createRenderer(canvas);
  const updateObjects = addObjects(scene, renderer, { sceneType });

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) {
      return;
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  let frameId = 0;

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    updateObjects();
    resize();
    renderer.render(scene, camera);
  };

  window.addEventListener("resize", resize);
  resize();
  animate();

  return () => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(frameId);
    renderer.dispose();
    delete canvas.dataset.threeMounted;
  };
};
