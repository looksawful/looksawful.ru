function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function findSceneByProject(root, project) {
  return [...root.querySelectorAll(".cv-item[data-cv-scene]")].find(
    (scene) =>
      normalizeText(scene.querySelector(".cv-item__project")?.textContent) === project,
  );
}

export function prepareSensetiqueCase(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") return null;

  const sensetique = findSceneByProject(root, "Sensetique");
  const styx = findSceneByProject(root, "Styx Jewels");
  if (!(sensetique instanceof HTMLElement)) return null;

  sensetique.dataset.cvTheme = sensetique.dataset.cvTheme || "item-04";
  sensetique
    .querySelector(":scope > .cv-item__header")
    ?.setAttribute("aria-expanded", "false");

  if (
    styx instanceof HTMLElement &&
    styx.parentElement === sensetique.parentElement &&
    styx.nextElementSibling !== sensetique
  ) {
    styx.after(sensetique);
  }

  return sensetique;
}
