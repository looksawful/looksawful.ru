import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
loader.setDRACOLoader(dracoLoader);

const MODEL_URLS = {
  logo: new URL("./models/logo.glb", import.meta.url).href,
  laptop: new URL("./models/laptop.glb", import.meta.url).href,
};

const logoColors = [
  new THREE.Color("#000000"),
  //   new THREE.Color("#ffffff"),
  //   new THREE.Color("#1760C1"),
  //   new THREE.Color("#D1E231"),
  //   new THREE.Color("#00b86b"),
  //   new THREE.Color("#b79cff"),
];

const laptopAccentColors = [
  new THREE.Color("#1e90ff"),
  new THREE.Color("#b8a2ff"),
  new THREE.Color("#f18200"),
  new THREE.Color("#d6ee26"),
];

function addEnvironment(scene, renderer, intensity = 0.04) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), intensity).texture;
  pmremGenerator.dispose();
}

function prepareMesh(child, renderer, materials) {
  if (!child.isMesh) {
    return;
  }

  child.castShadow = true;
  child.receiveShadow = true;

  if (child.geometry) {
    child.geometry.computeVertexNormals();
  }

  if (!child.material) {
    return;
  }

  const materialList = Array.isArray(child.material) ? child.material : [child.material];

  materialList.forEach((material) => {
    material.side = THREE.FrontSide;
    material.needsUpdate = true;

    if (typeof material.metalness === "number" && material.metalness > 0) {
      material.metalness = Math.min(0.9, material.metalness + 0.12);
    }

    if (typeof material.roughness === "number") {
      material.roughness = Math.max(0.18, material.roughness * 0.82);
    }

    material.emissive ??= new THREE.Color("#000000");
    materials.push(material);

    if (material.map) {
      material.map.colorSpace = THREE.SRGBColorSpace;
      material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    if (material.normalMap) {
      material.normalScale.set(1, 1);
    }
  });
}

function centerModelInGroup(model, targetSize) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const group = new THREE.Group();

  model.position.sub(center);
  group.scale.setScalar(targetSize / maxSize);
  group.add(model);

  return group;
}

function addLogoObjects(scene, renderer) {
  let model = null;
  const logoMaterials = [];
  let colorTime = 0;

  addEnvironment(scene, renderer);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(3, 4, 5);

  const fillLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);

  scene.add(keyLight);
  scene.add(fillLight);

  loader.load(
    MODEL_URLS.logo,
    (gltf) => {
      model = gltf.scene;

      model.traverse((child) => {
        prepareMesh(child, renderer, logoMaterials);

        if (!child.material) {
          return;
        }

        const materialList = Array.isArray(child.material) ? child.material : [child.material];

        materialList.forEach((material) => {
          material.metalness = 0.8;
          material.roughness = 0.25;
          material.emissiveIntensity = 0.15;
        });
      });

      model.position.set(0, 0, 0);
      model.scale.setScalar(1);
      scene.add(model);
    },
    undefined,
    (error) => {
      console.error("Failed to load 3D logo:", error);
    },
  );

  return () => {
    if (!model) {
      return;
    }

    model.rotation.y += 0.01;
    colorTime += 0.005;

    const colorIndex = Math.floor(colorTime) % logoColors.length;
    const nextColorIndex = (colorIndex + 1) % logoColors.length;
    const mix = colorTime % 1;
    const currentColor = logoColors[colorIndex].clone().lerp(logoColors[nextColorIndex], mix);

    logoMaterials.forEach((material) => {
      material.color.copy(currentColor);
      material.emissive.copy(currentColor);
    });
  };
}

function applyScreenTexture(mesh, texture) {
  // Вычисляем repeat при загрузке изображения
  texture.onUpdate = () => {};
  const img = texture.image;
  if (img && img.width && img.height) {
    const imgAspect = img.width / img.height;
    // MacBook Pro screen ~16:10
    const screenAspect = 1.6;
    const repeatY = screenAspect / imgAspect;
    texture.repeat.set(1, repeatY < 1 ? repeatY : 1);
    // Anchor top: V=1 (верх экрана) → top of image
    texture.offset.set(0, repeatY < 1 ? 1 - repeatY : 0);
  }
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  mat.map = null;
  mat.emissiveMap = texture;
  mat.emissive = new THREE.Color(1, 1, 1);
  mat.emissiveIntensity = 1.0;
  mat.metalness = 0;
  mat.roughness = 0.05;
  mat.needsUpdate = true;
}

function addLaptopObjects(scene, renderer) {
  let laptopGroup = null;
  let colorTime = 0;

  // Только environment map, без источников света
  addEnvironment(scene, renderer, 0.04);
  scene.environmentIntensity = 2.5;

  const base = new THREE.Mesh(
    new THREE.CircleGeometry(1.04, 64),
    new THREE.MeshBasicMaterial({
      color: "#f18200",
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.82;
  scene.add(base);

  // Загружаем текстуру экрана
  const screenTexture = new THREE.TextureLoader().load(
    new URL("./models/Record%20Pool-1.png", import.meta.url).href,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      // Если модель уже загружена — применяем сразу
      if (laptopGroup) {
        laptopGroup.traverse((child) => {
          if (child.isMesh && isScreenMesh(child)) applyScreenTexture(child, tex);
        });
      }
    },
  );
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  loader.load(
    MODEL_URLS.laptop,
    (gltf) => {
      laptopGroup = centerModelInGroup(gltf.scene, 1.78);
      laptopGroup.position.set(0, -0.12, 0);
      laptopGroup.rotation.set(-0.08, -0.48, 0);

      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

      laptopGroup.traverse((child) => {
        if (!child.isMesh) return;

        // Лог для отладки — видно в DevTools
        console.log("[laptop mesh]", JSON.stringify({ name: child.name, mat: child.material?.name }));

        const materialList = Array.isArray(child.material) ? child.material : [child.material];
        materialList.forEach((mat) => {
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.map.anisotropy = maxAnisotropy;
          }
          mat.needsUpdate = true;
        });

        if (isScreenMesh(child) && screenTexture.image) {
          applyScreenTexture(child, screenTexture);
        }
      });

      scene.add(laptopGroup);
    },
    undefined,
    (error) => console.error("Failed to load 3D laptop:", error),
  );

  return () => {
    colorTime += 0.01;

    const colorIndex = Math.floor(colorTime) % laptopAccentColors.length;
    const nextColorIndex = (colorIndex + 1) % laptopAccentColors.length;
    const mix = colorTime % 1;
    const accentColor = laptopAccentColors[colorIndex].clone().lerp(laptopAccentColors[nextColorIndex], mix);
    base.material.color.copy(accentColor);

    if (!laptopGroup) return;

    laptopGroup.rotation.y = -0.48 + Math.sin(colorTime * 1.1) * 0.22;
    laptopGroup.rotation.x = -0.08 + Math.sin(colorTime * 0.7) * 0.025;
    laptopGroup.position.y = -0.12 + Math.sin(colorTime * 0.9) * 0.035;
  };
}

function isScreenMesh(child) {
  const name = (child.name + " " + (child.material?.name ?? "")).toLowerCase();
  return (
    name.includes("screen") ||
    name.includes("display") ||
    name.includes("glass") ||
    name.includes("monitor") ||
    name.includes("lcd")
  );
}

export const addObjects = (scene, renderer, options = {}) => {
  if (options.sceneType === "laptop") {
    return addLaptopObjects(scene, renderer);
  }

  return addLogoObjects(scene, renderer);
};
