import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

const screens = [
  { id: "home", label: "Домой", src: null },
  { id: "off", label: "Выключен", src: null },
  { id: "lock", label: "Блокировка", src: "/media/models/devices/screens/iphone-lock.png" },
  { id: "website", label: "looksawful.ru", src: "/media/models/devices/screens/iphone-website.png" },
  { id: "resume", label: "Резюме", src: "/media/models/devices/screens/iphone-resume.png" },
] as const;

type ScreenState = (typeof screens)[number]["id"];

export function prepareIphonePresentation(model: THREE.Object3D) {
  const screenNode = model.getObjectByName("SCREEN_CONTENT");
  const screen = screenNode instanceof THREE.Mesh ? screenNode : screenNode?.children.find(child => {
    if (!(child instanceof THREE.Mesh)) return false;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    return materials.some(material => material.name === "MAT_SCREEN_CONTENT");
  });
  if (!(screen instanceof THREE.Mesh)) return null;
  const sourceMaterials = Array.isArray(screen.material) ? screen.material : [screen.material];
  const front = sourceMaterials.find(material => material.name === "MAT_SCREEN_CONTENT") ?? sourceMaterials[0];
  if (!(front instanceof THREE.MeshStandardMaterial)) return null;
  const originalMap = front.map ?? front.emissiveMap;
  front.map = originalMap;
  const originalEmissiveMap = front.emissiveMap;
  front.toneMapped = false;
  front.color.set(0x000000);
  front.roughness = 1;
  front.envMapIntensity = 0;
  if (front instanceof THREE.MeshPhysicalMaterial) {
    front.clearcoat = 0;
    front.specularIntensity = 0;
  }
  front.emissive.set(0xffffff);
  front.emissiveMap = front.map;
  front.emissiveIntensity = 1;
  const edge = sourceMaterials.find(material => material.name === "MAT_SCREEN_EDGE") ?? new THREE.MeshStandardMaterial({ color: 0x020203, roughness: .36, metalness: 0 });
  const geometry = screen.geometry;
  const normal = geometry.getAttribute("normal");
  const index = geometry.index;
  const count = index?.count ?? normal.count;
  geometry.clearGroups();
  let start = 0;
  let previous = -1;
  for (let i = 0; i < count; i += 3) {
    const frontFacing = [0, 1, 2].every(j => normal.getZ(index ? index.getX(i + j) : i + j) > .995);
    const side = frontFacing ? 0 : 1;
    if (side !== previous) {
      if (i > start) geometry.addGroup(start, i - start, previous);
      start = i;
      previous = side;
    }
  }
  if (count > start) geometry.addGroup(start, count - start, previous);
  screen.material = [front, edge];
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return null;
  const size = box.getSize(new THREE.Vector3());
  RectAreaLightUniformsLib.init();
  const glow = new THREE.RectAreaLight(0xd9eaff, 8, size.x, size.y);
  glow.name = "AWFUL_SCREEN_GLOW";
  glow.position.z = box.max.z + .00002;
  glow.rotation.y = Math.PI;
  screen.add(glow);
  const pill = model.getObjectByName("DYNAMIC_ISLAND");
  const camera = model.getObjectByName("FRONT_CAMERA_GLASS");
  if (pill && camera) {
    const delta = pill.position.y - camera.position.y;
    model.traverse(object => {
      if (/^FRONT_CAMERA_|^FRONT_SENSOR_PILL$/.test(object.name)) object.position.y += delta;
    });
  }
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (/^BOTTOM_.*APERTURE|^USB_C_CAVITY$/.test(object.name)) {
      const cavities = materials.map(material => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return material;
        const cavity = material.clone();
        cavity.roughness = .82;
        cavity.metalness = 0;
        cavity.envMapIntensity = .15;
        return cavity;
      });
      object.material = Array.isArray(object.material) ? cavities : cavities[0] ?? object.material;
    }
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (material.name === "MAT_DYNAMIC_ISLAND" || material.name === "MAT_FRONT_SENSOR_PILL") {
        material.roughness = .6;
        material.envMapIntensity = .1;
        if (material instanceof THREE.MeshPhysicalMaterial) material.clearcoat = 0;
      }
      if (material.name === "MAT_FASTENER") {
        material.roughness = .5;
        material.envMapIntensity = .35;
      }
      if (material.name === "MAT_FRONT_OPTIC") {
        material.envMapIntensity = .1;
        if (material instanceof THREE.MeshPhysicalMaterial) material.specularIntensity = .15;
      }
    }
  });

  return { front, originalMap, originalEmissiveMap, glow };
}

export function mountIphoneScreenControls(
  element: HTMLElement,
  presentation: NonNullable<ReturnType<typeof prepareIphonePresentation>>,
  render: () => void,
) {
  const { front, originalMap, originalEmissiveMap, glow } = presentation;
  const previousRole = element.getAttribute("role");
  element.setAttribute("role", "group");
  const label = document.createElement("label");
  label.className = "model-viewer__screen-control";
  label.append("Экран ");
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Состояние экрана iPhone");
  for (const state of screens) {
    const option = document.createElement("option");
    option.value = state.id;
    option.textContent = state.label;
    select.append(option);
  }
  label.append(select);
  element.append(label);
  const textures = new Map<string, Promise<THREE.Texture>>();
  let disposed = false;
  let revision = 0;
  let current: ScreenState = "home";
  element.dataset.modelScreenState = current;

  const apply = (id: ScreenState, texture: THREE.Texture | null) => {
    const off = id === "off";
    front.map = off ? null : texture;
    front.emissiveMap = off ? null : texture;
    front.color.set(off ? 0x020203 : 0x000000);
    front.emissive.set(off ? 0x000000 : 0xffffff);
    front.emissiveIntensity = off ? 0 : 1;
    front.needsUpdate = true;
    glow.intensity = off ? 0 : 8;
    current = id;
    element.dataset.modelScreenState = id;
    render();
  };
  const change = async () => {
    const state = screens.find(candidate => candidate.id === select.value);
    if (!state) return;
    const request = ++revision;
    select.setAttribute("aria-busy", "true");
    try {
      let texture = originalMap;
      if (state.src) {
        let pending = textures.get(state.src);
        if (!pending) {
          pending = new THREE.TextureLoader().loadAsync(state.src).then(loaded => {
            loaded.colorSpace = THREE.SRGBColorSpace;
            loaded.flipY = false;
            loaded.anisotropy = originalMap?.anisotropy ?? 1;
            return loaded;
          }).catch((error: unknown) => {
            textures.delete(state.src);
            throw error;
          });
          textures.set(state.src, pending);
        }
        texture = await pending;
      }
      if (disposed || request !== revision) return;
      apply(state.id, texture);
    } catch (error: unknown) {
      if (disposed || request !== revision) return;
      select.value = current;
      console.warn("iPhone screen texture failed to load.", error);
    } finally {
      if (!disposed && request === revision) select.removeAttribute("aria-busy");
    }
  };
  const handleChange = () => { void change(); };
  select.addEventListener("change", handleChange);
  return () => {
    disposed = true;
    revision++;
    select.removeEventListener("change", handleChange);
    label.remove();
    if (previousRole) element.setAttribute("role", previousRole);
    else element.removeAttribute("role");
    delete element.dataset.modelScreenState;
    front.map = originalMap;
    front.emissiveMap = originalEmissiveMap;
    glow.removeFromParent();
    textures.forEach(pending => { void pending.then(texture => texture.dispose(), () => {}); });
    textures.clear();
  };
}
