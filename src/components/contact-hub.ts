import {
  createContactHubState,
  transitionContactHub,
  type ContactHubState,
} from "../features/contact-hub/state.ts";
import { applyExplicitAiDraftHandoff } from "../features/contact-hub/handoff.ts";

type Destroy = () => void;

const SITE_CONTACT_SELECTOR = '.contact a[href="mailto:i@lookawful.ru"]';
const PET_SELECTOR = "[data-portfolio-pet-launcher]";

function createTextButton(documentRef: Document, text: string): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = "contact-hub__text-action";
  button.textContent = text;
  return button;
}

function createHubElement(documentRef: Document) {
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

  const modes = documentRef.createElement("div");
  modes.className = "contact-hub__modes";
  const aiModeButton = createTextButton(documentRef, "AI");
  aiModeButton.dataset.contactHubMode = "ai";
  const formModeButton = createTextButton(documentRef, "написать");
  formModeButton.dataset.contactHubMode = "form";
  modes.append(aiModeButton, formModeButton);

  const closeButton = createTextButton(documentRef, "×");
  closeButton.classList.add("contact-hub__close");
  closeButton.dataset.contactHubClose = "";
  closeButton.setAttribute("aria-label", "Закрыть");
  header.append(modes, closeButton);

  const formScreen = documentRef.createElement("form");
  formScreen.className = "contact-hub__screen contact-hub__screen--form";
  formScreen.dataset.contactHubForm = "";

  const createField = (labelText: string, control: HTMLInputElement | HTMLTextAreaElement) => {
    const label = documentRef.createElement("label");
    label.className = "contact-hub__field";
    const labelTextNode = documentRef.createElement("span");
    labelTextNode.textContent = labelText;
    label.append(labelTextNode, control);
    return label;
  };

  const nameInput = documentRef.createElement("input");
  nameInput.name = "name";
  nameInput.autocomplete = "name";
  const emailInput = documentRef.createElement("input");
  emailInput.name = "email";
  emailInput.type = "email";
  emailInput.autocomplete = "email";
  emailInput.required = true;
  const messageInput = documentRef.createElement("textarea");
  messageInput.name = "message";
  messageInput.required = true;
  messageInput.maxLength = 5000;

  const formActions = documentRef.createElement("div");
  formActions.className = "contact-hub__form-actions";
  const attachButton = createTextButton(documentRef, "+ файл");
  attachButton.dataset.contactHubAttach = "";
  const submitButton = documentRef.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "contact-hub__text-action";
  submitButton.textContent = "отправить";
  formActions.append(attachButton, submitButton);

  const mailFallback = documentRef.createElement("a");
  mailFallback.className = "contact-hub__mail-fallback";
  mailFallback.href = "mailto:i@lookawful.ru";
  mailFallback.textContent = "i@lookawful.ru";

  const handoffDecision = documentRef.createElement("div");
  handoffDecision.className = "contact-hub__handoff-decision";
  handoffDecision.dataset.contactHubHandoffDecision = "";
  handoffDecision.hidden = true;
  const appendButton = createTextButton(documentRef, "добавить");
  appendButton.dataset.contactHubHandoffAppend = "";
  const replaceButton = createTextButton(documentRef, "заменить");
  replaceButton.dataset.contactHubHandoffReplace = "";
  const cancelButton = createTextButton(documentRef, "отмена");
  cancelButton.dataset.contactHubHandoffCancel = "";
  handoffDecision.append(appendButton, replaceButton, cancelButton);

  formScreen.append(
    createField("имя", nameInput),
    createField("email", emailInput),
    createField("сообщение", messageInput),
    handoffDecision,
    formActions,
    mailFallback,
  );

  const aiScreen = documentRef.createElement("div");
  aiScreen.className = "contact-hub__screen contact-hub__screen--ai";
  aiScreen.dataset.contactHubAi = "";
  aiScreen.hidden = true;

  const aiLog = documentRef.createElement("div");
  aiLog.className = "contact-hub__ai-log";
  aiLog.setAttribute("role", "log");
  const draft = documentRef.createElement("textarea");
  draft.className = "contact-hub__draft";
  draft.dataset.contactHubAiDraft = "";
  draft.setAttribute("aria-label", "AI draft");
  const handoffButton = createTextButton(documentRef, "написать напрямую");
  handoffButton.dataset.contactHubHandoff = "";
  const composer = documentRef.createElement("div");
  composer.className = "contact-hub__composer";
  composer.dataset.contactHubAiComposer = "";
  const composerInput = documentRef.createElement("textarea");
  composerInput.setAttribute("aria-label", "Сообщение AI");
  const composerSend = createTextButton(documentRef, "отправить");
  composer.append(composerInput, composerSend);
  aiScreen.append(aiLog, draft, handoffButton, composer);

  shell.append(header, formScreen, aiScreen);
  hub.append(shell);

  return {
    hub,
    closeButton,
    aiModeButton,
    formModeButton,
    formScreen,
    aiScreen,
    nameInput,
    emailInput,
    messageInput,
    draft,
    handoffButton,
    handoffDecision,
    appendButton,
    replaceButton,
    cancelButton,
  };
}

export function mountContactHub(root: Document = document): Destroy {
  const openers = [...root.querySelectorAll<HTMLAnchorElement>(SITE_CONTACT_SELECTOR)];
  const petOpeners = [...root.querySelectorAll<HTMLElement>(PET_SELECTOR)];
  if ((openers.length === 0 && petOpeners.length === 0) || !root.body) return () => {};

  const existingHub = root.querySelector<HTMLElement>("[data-contact-hub]");
  if (existingHub) return () => {};

  const elements = createHubElement(root);
  const {
    hub, closeButton, aiModeButton, formModeButton, formScreen, aiScreen,
    nameInput, emailInput, messageInput, draft, handoffButton, handoffDecision,
    appendButton, replaceButton, cancelButton,
  } = elements;
  root.body.append(hub);

  let state: ContactHubState = createContactHubState({ aiAvailable: true });
  let opener: HTMLElement | null = null;
  let pendingDraft = "";

  const render = (): void => {
    hub.dataset.mode = state.mode;
    hub.dataset.visibility = state.visibility;
    hub.hidden = state.visibility !== "open";
    formScreen.hidden = state.mode !== "form";
    aiScreen.hidden = state.mode !== "ai";
    aiModeButton.setAttribute("aria-pressed", String(state.mode === "ai"));
    formModeButton.setAttribute("aria-pressed", String(state.mode === "form"));
  };

  const setMode = (mode: "ai" | "form"): void => {
    state = transitionContactHub(state, { type: "SET_MODE", mode });
    render();
  };

  const open = (current: HTMLElement, entryPoint: "site-contact" | "pet"): void => {
    opener = current;
    state = transitionContactHub(state, { type: "OPEN", entryPoint });
    render();
    closeButton.focus({ preventScroll: true });
  };

  const openFromSiteContact = (event: Event): void => {
    const current = event.currentTarget;
    if (!(current instanceof HTMLElement)) return;
    event.preventDefault();
    open(current, "site-contact");
  };

  const openFromPet = (event: Event): void => {
    const current = event.currentTarget;
    if (!(current instanceof HTMLElement)) return;
    open(current, "pet");
  };

  const formDraft = () => ({ name: nameInput.value, email: emailInput.value, message: messageInput.value });

  const commitHandoff = (selectedDraftText: string, messageStrategy?: "append" | "replace"): void => {
    const result = applyExplicitAiDraftHandoff({ selectedDraftText, formDraft: formDraft(), messageStrategy });
    if (result.kind === "needs_message_decision") {
      pendingDraft = selectedDraftText;
      handoffDecision.hidden = false;
      setMode("form");
      return;
    }
    if (result.kind === "ready") {
      nameInput.value = result.draft.name;
      emailInput.value = result.draft.email;
      messageInput.value = result.draft.message;
      pendingDraft = "";
      handoffDecision.hidden = true;
      setMode("form");
      messageInput.focus({ preventScroll: true });
    }
  };

  const onHandoff = (): void => commitHandoff(draft.value);
  const onAppend = (): void => commitHandoff(pendingDraft, "append");
  const onReplace = (): void => commitHandoff(pendingDraft, "replace");
  const onCancel = (): void => {
    pendingDraft = "";
    handoffDecision.hidden = true;
  };

  const close = (): void => {
    if (state.visibility === "closed") return;
    const focusTarget = opener;
    state = transitionContactHub(state, { type: "CLOSE" });
    render();
    opener = null;
    pendingDraft = "";
    handoffDecision.hidden = true;
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || state.visibility !== "open") return;
    event.preventDefault();
    close();
  };

  const preventPrototypeSubmit = (event: SubmitEvent): void => event.preventDefault();

  openers.forEach((contact) => contact.addEventListener("click", openFromSiteContact));
  petOpeners.forEach((pet) => pet.addEventListener("click", openFromPet));
  aiModeButton.addEventListener("click", () => setMode("ai"));
  formModeButton.addEventListener("click", () => setMode("form"));
  handoffButton.addEventListener("click", onHandoff);
  appendButton.addEventListener("click", onAppend);
  replaceButton.addEventListener("click", onReplace);
  cancelButton.addEventListener("click", onCancel);
  formScreen.addEventListener("submit", preventPrototypeSubmit);
  closeButton.addEventListener("click", close);
  root.addEventListener("keydown", onKeyDown);
  render();

  return () => {
    openers.forEach((contact) => contact.removeEventListener("click", openFromSiteContact));
    petOpeners.forEach((pet) => pet.removeEventListener("click", openFromPet));
    handoffButton.removeEventListener("click", onHandoff);
    appendButton.removeEventListener("click", onAppend);
    replaceButton.removeEventListener("click", onReplace);
    cancelButton.removeEventListener("click", onCancel);
    formScreen.removeEventListener("submit", preventPrototypeSubmit);
    closeButton.removeEventListener("click", close);
    root.removeEventListener("keydown", onKeyDown);
    hub.remove();
  };
}
