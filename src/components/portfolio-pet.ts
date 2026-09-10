import type { PortfolioPetLocalAction, PortfolioPetLocale } from "../features/portfolio-pet/intent-router.ts";
import {
  getPortfolioPetQuickActions,
  getPortfolioPetShellCopy,
} from "../features/portfolio-pet/view-model.ts";

export interface PortfolioPetMountOptions {
  root?: HTMLElement;
  locale?: PortfolioPetLocale;
  onAction?: (action: PortfolioPetLocalAction) => void;
  onSubmit?: (message: string) => void;
}

export interface PortfolioPetController {
  open(): void;
  close(): void;
  destroy(): void;
  readonly element: HTMLElement;
}

function inferLocale(): PortfolioPetLocale {
  return document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ru";
}

export function mountPortfolioPet({
  root = document.body,
  locale = inferLocale(),
  onAction,
  onSubmit,
}: PortfolioPetMountOptions = {}): PortfolioPetController {
  const copy = getPortfolioPetShellCopy(locale);
  const abortController = new AbortController();
  const { signal } = abortController;

  const host = document.createElement("aside");
  host.className = "portfolio-pet";
  host.dataset.portfolioPet = "";

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "portfolio-pet__launcher";
  launcher.setAttribute("aria-label", copy.accessibleName);
  launcher.setAttribute("aria-expanded", "false");

  const spriteSlot = document.createElement("span");
  spriteSlot.className = "portfolio-pet__sprite";
  spriteSlot.dataset.petSprite = "idle";
  spriteSlot.setAttribute("aria-hidden", "true");
  launcher.append(spriteSlot);

  const panel = document.createElement("section");
  panel.className = "portfolio-pet__panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", copy.accessibleName);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "portfolio-pet__close";
  closeButton.textContent = copy.closeLabel;

  const actions = document.createElement("nav");
  actions.className = "portfolio-pet__actions";
  actions.setAttribute("aria-label", locale === "ru" ? "Быстрые действия" : "Quick actions");

  for (const action of getPortfolioPetQuickActions(locale)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portfolio-pet__action";
    button.dataset.petAction = action.id;
    button.textContent = action.label;
    button.addEventListener("click", () => onAction?.(action.id), { signal });
    actions.append(button);
  }

  const form = document.createElement("form");
  form.className = "portfolio-pet__form";

  const label = document.createElement("label");
  label.className = "portfolio-pet__input-label";
  label.textContent = copy.inputLabel;

  const input = document.createElement("input");
  input.className = "portfolio-pet__input";
  input.type = "text";
  input.name = "portfolio-pet-question";
  input.autocomplete = "off";
  input.maxLength = 800;
  input.placeholder = copy.inputPlaceholder;
  label.append(input);

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "portfolio-pet__submit";
  submit.textContent = copy.submitLabel;

  form.append(label, submit);
  panel.append(closeButton, actions, form);
  host.append(panel, launcher);
  root.append(host);

  const open = (): void => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    spriteSlot.dataset.petSprite = "open";
    closeButton.focus();
  };

  const close = (): void => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    spriteSlot.dataset.petSprite = "idle";
    launcher.focus();
  };

  launcher.addEventListener("click", () => {
    if (panel.hidden) open();
    else close();
  }, { signal });
  closeButton.addEventListener("click", close, { signal });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    onSubmit?.(message);
  }, { signal });
  host.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close();
    }
  }, { signal });

  return {
    element: host,
    open,
    close,
    destroy(): void {
      abortController.abort();
      host.remove();
    },
  };
}
