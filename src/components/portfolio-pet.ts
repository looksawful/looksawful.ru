type Destroy = () => void;

export interface MountPortfolioPetOptions {
  enabled: boolean;
}

const PET_SELECTOR = "[data-portfolio-pet-launcher]";

export function mountPortfolioPet(
  root: Document = document,
  { enabled }: MountPortfolioPetOptions,
): Destroy {
  if (!enabled || !root.body || root.querySelector(PET_SELECTOR)) return () => {};

  const launcher = root.createElement("button");
  launcher.type = "button";
  launcher.className = "portfolio-pet";
  launcher.dataset.portfolioPetLauncher = "";
  launcher.setAttribute("aria-label", "Открыть чат с Venus");

  const image = root.createElement("img");
  image.className = "portfolio-pet__image";
  image.src = "/pets/venus/venus-idle.webp";
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.fetchPriority = "high";

  launcher.append(image);
  root.body.append(launcher);

  return () => launcher.remove();
}
