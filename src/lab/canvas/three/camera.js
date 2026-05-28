import * as THREE from "three";

export const createCamera = (canvas, options = {}) => {
  const fov = options.fov ?? 60;
  const z = options.z ?? 2.5;
  const y = options.y ?? 0;
  const aspect = canvas.clientHeight ? canvas.clientWidth / canvas.clientHeight : 1;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);

  camera.position.set(0, y, z);
  return camera;
};
