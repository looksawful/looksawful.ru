import "./portfolio-pet.css";

import type { PortfolioPetLocalAction, PortfolioPetLocale } from "../features/portfolio-pet/intent-router.ts";
import {
  getPortfolioPetPrototypeCharacters,
  observePortfolioPetCharacter,
  type PortfolioPetCharacterId,
} from "../features/portfolio-pet/character-context.ts";
import {
  getPortfolioPetQuickActions,
  getPortfolioPetShellCopy,
} from "../features/portfolio-pet/view-model.ts";

export interface PortfolioPetMountOptions {
  root?: HTMLElement;
  locale?: PortfolioPetLocale;
  onAction?: (action: PortfolioPetLocalAction) => void;
  onSubmit?: (message: string) => void;
  onCharacterChange?: (characterId: PortfolioPetCharacterId) => void;
}

export interface PortfolioPetController {
  open(): void;
  close(): void;
  destroy(): void;
  readonly element: HTMLElement;
  readonly characterId: PortfolioPetCharacterId;
}

function inferLocale(root: Document): PortfolioPetLocale {
  return root.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ru";
}

function appendPrototypeFigure(spriteSlot: HTMLElement): void {
  const figure = document.createElement("span");
  figure.className = "portfolio-pet__figure";

  for (const part of ["hair", "head", "body", "arm-a", "arm-b", "leg-a", "leg-b"] as const) {
    const element = document.createElement("span");
    element.className = `portfolio-pet__figure-${part}`;
    figure.append(element);
  }

  spriteSlot.append(figure);
}

export function mountPortfolioPet({
  root = document.body,
  locale = inferLocale(root.ownerDocument),
  onAction,
  onSubmit,
  onCharacterChange,
}: PortfolioPetMountOptions = {}): PortfolioPetController {
  const documentRoot = root.ownerDocument;
  const copy = getPortfolioPetShellCopy(locale);
  const characters = getPortfolioPetPrototypeCharacters();
  const abortController = new AbortController();
  const { signal } = abortController;
  let characterId: PortfolioPetCharacterId = "default";

  const host = documentRoot.createElement("aside");
  host.className = "portfolio-pet";
  host.dataset.portfolioPet = "";
  host.dataset.character = characterId;

  const launcher = documentRoot.createElement("button");
  launcher.type = "button";
  launcher.className = "portfolio-pet__launcher";
  launcher.setAttribute("aria-label", copy.accessibleName);
  launcher.setAttribute("aria-expanded", "false");

  const spriteSlot = documentRoot.createElement("span");
  spriteSlot.className = "portfolio-pet__sprite";
  spriteSlot.dataset.petSprite = "idle";
  spriteSlot.setAttribute("aria-hidden", "true");
  appendPrototypeFigure(spriteSlot);
  launcher.append(spriteSlot);

  const panel = documentRoot.createElement("section");
  panel.className = "portfolio-pet__panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", copy.accessibleName);

  const header = documentRoot.createElement("header");
  header.className = "portfolio-pet__header";

  const contextLabel = documentRoot.createElement("span");
  contextLabel.className = "portfolio-pet__context";
  contextLabel.textContent = characters[characterId].label;

  const closeButton = documentRoot.createElement("button");
  closeButton.type = "button";
  closeButton.className = "portfolio-pet__close";
  closeButton.textContent = copy.closeLabel;
  header.append(contextLabel, closeButton);

  const intro = documentRoot.createElement("p");
  intro.className = "portfolio-pet__intro";
  intro.textContent = locale === "ru"
    ? "Спроси о работе, кейсах или резюме. Частые действия работают локально."
    : "Ask about work, cases or the resume. Common actions stay local.";

  const actions = documentRoot.createElement("nav");
  actions.className = "portfolio-pet__actions";
  actions.setAttribute("aria-label", locale === "ru" ? "Быстрые действия" : "Quick actions");

  const prototypeStatus = documentRoot.createElement("p");
  prototypeStatus.className = "portfolio-pet__status";
  prototypeStatus.setAttribute("aria-live", "polite");

  for (const action of getPortfolioPetQuickActions(locale)) {
    const button = documentRoot.createElement("button");
    button.type = "button";
    button.className = "portfolio-pet__action";
    button.dataset.petAction = action.id;
    button.textContent = action.label;
    button.addEventListener("click", () => {
      prototypeStatus.textContent = locale === "ru"
        ? `Прототип: ${action.label.toLowerCase()} откроется здесь без лишнего AI-запроса.`
        : `Prototype: ${action.label.toLowerCase()} opens here without an unnecessary AI call.`;
      onAction?.(action.id);
    }, { signal });
    actions.append(button);
  }

  const form = documentRoot.createElement("form");
  form.className = "portfolio-pet__form";

  const label = documentRoot.createElement("label");
  label.className = "portfolio-pet__input-label";
  label.textContent = copy.inputLabel;

  const input = documentRoot.createElement("input");
  input.className = "portfolio-pet__input";
  input.type = "text";
  input.name = "portfolio-pet-question";
  input.autocomplete = "off";
  input.maxLength = 800;
  input.placeholder = copy.inputPlaceholder;
  label.append(input);

  const submit = documentRoot.createElement("button");
  submit.type = "submit";
  submit.className = "portfolio-pet__submit";
  submit.textContent = copy.submitLabel;

  form.append(label, submit);
  panel.append(header, intro, actions, prototypeStatus, form);
  host.append(panel, launcher);
  root.append(host);

  const setCharacter = (nextCharacterId: PortfolioPetCharacterId): void => {
    if (nextCharacterId === characterId) return;
    characterId = nextCharacterId;
    host.dataset.character = nextCharacterId;
    contextLabel.textContent = characters[nextCharacterId].label;
    launcher.dataset.character = nextCharacterId;
    onCharacterChange?.(nextCharacterId);
  };

  const characterObserver = observePortfolioPetCharacter({
    root: documentRoot,
    onChange: setCharacter,
  });

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
    prototypeStatus.textContent = locale === "ru"
      ? "Свободный AI-ответ подключится следующим серверным этапом."
      : "Free-form AI replies arrive in the next server-side stage.";
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
    get characterId() {
      return characterId;
    },
    open,
    close,
    destroy(): void {
      characterObserver.destroy();
      abortController.abort();
      host.remove();
    },
  };
}
