type Destroy = () => void;

const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const BUBBLE_SELECTOR = "[data-portfolio-pet-bubble]";

export interface MountPortfolioPetBubbleOptions {
  enabled: boolean;
}

export function mountPortfolioPetBubble(
  root: Document = document,
  { enabled }: MountPortfolioPetBubbleOptions,
): Destroy {
  if (!enabled) return () => {};

  const launcher = root.querySelector<HTMLElement>(PET_SELECTOR);
  if (!launcher || launcher.querySelector(BUBBLE_SELECTOR)) return () => {};

  const bubble = root.createElement("span");
  bubble.className = "portfolio-pet__bubble";
  bubble.dataset.portfolioPetBubble = "";
  bubble.setAttribute("aria-hidden", "true");
  bubble.textContent = "привет. могу помочь";
  launcher.append(bubble);

  return () => bubble.remove();
}
