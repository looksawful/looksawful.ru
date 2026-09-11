import {
  createContactHubState,
  transitionContactHub,
  type ContactHubState,
} from "../features/contact-hub/state.ts";

type Destroy = () => void;

const SITE_CONTACT_SELECTOR = '.contact a[href="mailto:i@lookawful.ru"]';

function createHubElement(documentRef: Document): {
  hub: HTMLDivElement;
  closeButton: HTMLButtonElement;
} {
  const hub = documentRef.createElement("div");
  hub.className = "contact-hub";
  hub.hidden = true;
  hub.dataset.contactHub = "";
  hub.dataset.mode = "form";
  hub.dataset.visibility = "closed";
  hub.setAttribute("role", "dialog");
  hub.setAttribute("aria-modal", "true");
  hub.setAttribute("aria-label", "Связаться со мной");

  const shell = documentRef.createElement("div");
  shell.className = "contact-hub__shell";

  const header = documentRef.createElement("header");
  header.className = "contact-hub__header";

  const title = documentRef.createElement("h2");
  title.className = "contact-hub__title";
  title.textContent = "Связаться со мной";

  const closeButton = documentRef.createElement("button");
  closeButton.className = "contact-hub__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Закрыть");
  closeButton.textContent = "×";

  const formScreen = documentRef.createElement("div");
  formScreen.className = "contact-hub__screen contact-hub__screen--form";
  formScreen.dataset.contactHubForm = "";

  const aiScreen = documentRef.createElement("div");
  aiScreen.className = "contact-hub__screen contact-hub__screen--ai";
  aiScreen.dataset.contactHubAi = "";
  aiScreen.hidden = true;

  header.append(title, closeButton);
  shell.append(header, formScreen, aiScreen);
  hub.append(shell);

  return { hub, closeButton };
}

export function mountContactHub(root: Document = document): Destroy {
  const openers = [...root.querySelectorAll<HTMLAnchorElement>(SITE_CONTACT_SELECTOR)];
  if (openers.length === 0 || !root.body) return () => {};

  const existingHub = root.querySelector<HTMLElement>("[data-contact-hub]");
  if (existingHub) return () => {};

  const { hub, closeButton } = createHubElement(root);
  root.body.append(hub);

  let state: ContactHubState = createContactHubState({ aiAvailable: true });
  let opener: HTMLElement | null = null;

  const render = (): void => {
    hub.dataset.mode = state.mode;
    hub.dataset.visibility = state.visibility;
    hub.hidden = state.visibility !== "open";

    const formScreen = hub.querySelector<HTMLElement>("[data-contact-hub-form]");
    const aiScreen = hub.querySelector<HTMLElement>("[data-contact-hub-ai]");
    if (formScreen) formScreen.hidden = state.mode !== "form";
    if (aiScreen) aiScreen.hidden = state.mode !== "ai";
  };

  const openFromSiteContact = (event: Event): void => {
    const current = event.currentTarget;
    if (!(current instanceof HTMLElement)) return;

    event.preventDefault();
    opener = current;
    state = transitionContactHub(state, { type: "OPEN", entryPoint: "site-contact" });
    render();
    closeButton.focus({ preventScroll: true });
  };

  const close = (): void => {
    if (state.visibility === "closed") return;

    const focusTarget = opener;
    state = transitionContactHub(state, { type: "CLOSE" });
    render();
    opener = null;

    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || state.visibility !== "open") return;
    event.preventDefault();
    close();
  };

  openers.forEach((contact) => contact.addEventListener("click", openFromSiteContact));
  closeButton.addEventListener("click", close);
  root.addEventListener("keydown", onKeyDown);
  render();

  return () => {
    openers.forEach((contact) => contact.removeEventListener("click", openFromSiteContact));
    closeButton.removeEventListener("click", close);
    root.removeEventListener("keydown", onKeyDown);
    hub.remove();
  };
}
