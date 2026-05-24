import * as THREE from "three";

export const createCamera = (canvas, options = {}) => {
  const fov = options.fov ?? 60;
  const z = options.z ?? 2.5;
  const y = options.y ?? 0;
  const camera = new THREE.PerspectiveCamera(fov, canvas.clientWidth / canvas.clientHeight, 0.1, 100);

  camera.position.set(0, y, z);
  return camera;
};
