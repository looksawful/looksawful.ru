import {
  createContactHubState,
  transitionContactHub,
  type ContactHubState,
} from "../features/contact-hub/state.ts";
import { applyExplicitAiDraftHandoff } from "../features/contact-hub/handoff.ts";
import {
  createSessionContactDraftStore,
  type ContactDraftStore,
} from "../features/contact-hub/persistence.ts";
import { createPortfolioAssistantClient } from "../features/portfolio-pet/assistant-client.ts";
import { createPreviewPortfolioAssistantRouter } from "../features/portfolio-pet/prepared-answers.ts";

type Destroy = () => void;

type AiAuthor = "bot" | "user";

const SITE_CONTACT_SELECTOR = '.contact a[href="mailto:i@lookawful.ru"]';
const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const ASSISTANT_SESSION_KEY = "looksawful:portfolio-assistant-session:v1";
const MOBILE_MEDIA = "(width <= 42.5rem)";

function createTextButton(documentRef: Document, text: string): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = "contact-hub__text-action";
  button.textContent = text;
  return button;
}

function resolveDraftStore(documentRef: Document): ContactDraftStore | null {
  try {
    const storage = documentRef.defaultView?.sessionStorage;
    return storage ? createSessionContactDraftStore(storage) : null;
  } catch {
    return null;
  }
}

function resolveAssistantSessionId(documentRef: Document): string {
  try {
    const storage = documentRef.defaultView?.sessionStorage;
    const existing = storage?.getItem(ASSISTANT_SESSION_KEY)?.trim();
    if (existing) return existing;

    const generated = documentRef.defaultView?.crypto.randomUUID?.()
      ?? `venus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    storage?.setItem(ASSISTANT_SESSION_KEY, generated);
    return generated;
  } catch {
    return `venus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function isPreviewAssistantRuntime(documentRef: Document): boolean {
  const hostname = documentRef.defaultView?.location.hostname ?? "";
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname.endsWith(".looksawful-ru-preview.pages.dev");
}

function createAiMessage(documentRef: Document, text: string, author: AiAuthor): HTMLParagraphElement {
  const message = documentRef.createElement("p");
  message.className = `contact-hub__message contact-hub__message--${author}`;
  message.textContent = text;
  return message;
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

  const collapseButton = createTextButton(documentRef, "−");
  collapseButton.classList.add("contact-hub__collapse");
  collapseButton.dataset.contactHubCollapse = "";
  collapseButton.setAttribute("aria-label", "Свернуть");

  const closeButton = createTextButton(documentRef, "×");
  closeButton.classList.add("contact-hub__close");
  closeButton.dataset.contactHubClose = "";
  closeButton.setAttribute("aria-label", "Закрыть");
  header.append(modes, collapseButton, closeButton);

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
  submitButton.className = "contact-hub__text-action contact-hub__submit";
  submitButton.textContent = "отправить";
  formActions.append(attachButton, submitButton);

  const mailFallback = documentRef.createElement("p");
  mailFallback.className = "contact-hub__mail-fallback";
  mailFallback.append("или ");
  const mailFallbackLink = documentRef.createElement("a");
  mailFallbackLink.href = "mailto:i@lookawful.ru";
  mailFallbackLink.textContent = "i@lookawful.ru";
  mailFallback.append(mailFallbackLink);

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
  aiLog.setAttribute("aria-live", "polite");
  aiLog.append(createAiMessage(
    documentRef,
    "Привет. Могу рассказать о проектах или помочь найти нужное.",
    "bot",
  ));

  const quickActions = documentRef.createElement("div");
  quickActions.className = "contact-hub__quick-actions";
  const quickActionDefinitions = [
    ["кейсы", "Покажи кейсы"],
    ["резюме", "Покажи резюме"],
    ["обо мне", "Расскажи о Ване"],
  ] as const;
  const quickActionButtons = quickActionDefinitions.map(([label, query]) => {
    const button = createTextButton(documentRef, label);
    button.classList.add("contact-hub__quick-action");
    button.dataset.contactHubQuickQuery = query;
    return button;
  });
  quickActions.append(...quickActionButtons);
  aiLog.append(quickActions);

  const draft = documentRef.createElement("textarea");
  draft.className = "contact-hub__draft";
  draft.dataset.contactHubAiDraft = "";
  draft.setAttribute("aria-label", "AI draft");
  draft.hidden = true;
  const handoffButton = createTextButton(documentRef, "перенести в сообщение");
  handoffButton.dataset.contactHubHandoff = "";
  handoffButton.classList.add("contact-hub__handoff");
  handoffButton.hidden = true;
  aiScreen.append(aiLog, draft, handoffButton);

  const composer = documentRef.createElement("form");
  composer.className = "contact-hub__composer";
  composer.dataset.contactHubAiComposer = "";
  const composerInput = documentRef.createElement("input");
  composerInput.autocomplete = "off";
  composerInput.placeholder = "спросить Venus";
  composerInput.setAttribute("aria-label", "Сообщение AI");
  const composerSend = documentRef.createElement("button");
  composerSend.type = "submit";
  composerSend.className = "contact-hub__send";
  composerSend.textContent = "\u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c";
  composerSend.setAttribute("aria-label", "Отправить");
  composer.append(composerInput, composerSend);

  shell.append(header, formScreen, aiScreen, composer);
  hub.append(shell);

  const collapsedLauncher = documentRef.createElement("button");
  collapsedLauncher.type = "button";
  collapsedLauncher.className = "contact-hub-launcher";
  collapsedLauncher.dataset.contactHubLauncher = "";
  collapsedLauncher.setAttribute("aria-label", "Развернуть");
  collapsedLauncher.textContent = "↗";
  collapsedLauncher.hidden = true;

  return {
    hub,
    collapsedLauncher,
    collapseButton,
    closeButton,
    aiModeButton,
    formModeButton,
    formScreen,
    aiScreen,
    aiLog,
    nameInput,
    emailInput,
    messageInput,
    draft,
    handoffButton,
    handoffDecision,
    appendButton,
    replaceButton,
    cancelButton,
    composer,
    composerInput,
    composerSend,
    quickActionButtons,
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
    hub, collapsedLauncher, collapseButton, closeButton, aiModeButton, formModeButton,
    formScreen, aiScreen, aiLog, nameInput, emailInput, messageInput, draft, handoffButton,
    handoffDecision, appendButton, replaceButton, cancelButton, composer, composerInput,
    composerSend, quickActionButtons,
  } = elements;
  root.body.append(hub, collapsedLauncher);

  let state: ContactHubState = createContactHubState({ aiAvailable: true });
  let opener: HTMLElement | null = null;
  let pendingDraft = "";
  let assistantBusy = false;
  let petStateTimer = 0;
  const draftStore = resolveDraftStore(root);
  const previewAssistant = isPreviewAssistantRuntime(root);
  const assistantClient = createPortfolioAssistantClient(
    {
      sessionId: resolveAssistantSessionId(root),
      endpoint: previewAssistant ? "/api/portfolio-chat" : undefined,
    },
    previewAssistant ? { router: createPreviewPortfolioAssistantRouter() } : {},
  );

  const formDraft = () => ({ name: nameInput.value, email: emailInput.value, message: messageInput.value });

  const persistDraft = (): void => {
    try {
      draftStore?.write(formDraft());
    } catch {
      // Storage is a convenience boundary; failures must not break Contact Hub.
    }
  };

  try {
    const storedDraft = draftStore?.read();
    if (storedDraft) {
      nameInput.value = storedDraft.name;
      emailInput.value = storedDraft.email;
      messageInput.value = storedDraft.message;
    }
  } catch {
    // Corrupt/blocked storage fails closed and leaves an empty form.
  }

  const setPetState = (visualState: "idle" | "thinking" | "speaking" | "success" | "error"): void => {
    root.dispatchEvent(new CustomEvent("portfolio-pet:state", { detail: { state: visualState } }));
  };

  const schedulePetIdle = (delayMs: number): void => {
    const view = root.defaultView;
    if (!view) return;
    view.clearTimeout(petStateTimer);
    petStateTimer = view.setTimeout(() => setPetState("idle"), delayMs);
  };

  const isMobile = (): boolean => root.defaultView?.matchMedia(MOBILE_MEDIA).matches ?? false;

  const resetHubPosition = (): void => {
    hub.style.removeProperty("inset-inline-start");
    hub.style.removeProperty("inset-block-start");
    hub.style.removeProperty("inset-block-end");
    hub.style.removeProperty("inline-size");
  };

  const positionHubNearPet = (pet: HTMLElement): void => {
    const view = root.defaultView;
    if (!view || isMobile()) {
      resetHubPosition();
      return;
    }

    const petRect = pet.getBoundingClientRect();
    const margin = 12;
    const gap = 12;
    const viewportWidth = view.visualViewport?.width ?? view.innerWidth;
    const viewportHeight = view.visualViewport?.height ?? view.innerHeight;
    const hubWidth = Math.min(state.mode === "form" ? 328 : 356, Math.max(280, viewportWidth - (margin * 2)));
    const requestedHeight = state.mode === "form" ? 382 : 464;
    const hubHeight = Math.min(requestedHeight, viewportHeight - (margin * 2));

    let left = petRect.right + gap;
    if (left + hubWidth > viewportWidth - margin) left = petRect.left - gap - hubWidth;
    left = Math.max(margin, Math.min(left, viewportWidth - hubWidth - margin));
    const top = Math.max(margin, Math.min(
      petRect.bottom - hubHeight,
      viewportHeight - hubHeight - margin,
    ));

    hub.style.insetInlineStart = `${Math.round(left)}px`;
    hub.style.insetBlockStart = `${Math.round(top)}px`;
    hub.style.insetBlockEnd = "auto";
    hub.style.inlineSize = `${Math.round(hubWidth)}px`;
  };

  const render = (): void => {
    const isOpen = state.visibility === "open";
    hub.dataset.mode = state.mode;
    hub.dataset.visibility = state.visibility;
    hub.hidden = !isOpen;
    collapsedLauncher.hidden = state.visibility !== "collapsed";
    formScreen.hidden = state.mode !== "form";
    aiScreen.hidden = state.mode !== "ai";
    composer.hidden = state.mode !== "ai";
    aiModeButton.setAttribute("aria-current", state.mode === "ai" ? "page" : "false");
    formModeButton.setAttribute("aria-current", state.mode === "form" ? "page" : "false");
    root.documentElement.classList.toggle("contact-hub-open", isOpen);
  };

  const setMode = (mode: "ai" | "form"): void => {
    state = transitionContactHub(state, { type: "SET_MODE", mode });
    render();
    if (opener?.matches(PET_SELECTOR)) positionHubNearPet(opener);
    if (mode === "ai") composerInput.focus({ preventScroll: true });
    else (nameInput.value ? messageInput : nameInput).focus({ preventScroll: true });
  };

  const open = (current: HTMLElement, entryPoint: "site-contact" | "pet"): void => {
    opener = current;
    state = transitionContactHub(state, { type: "OPEN", entryPoint });
    render();
    if (entryPoint === "pet") {
      positionHubNearPet(current);
      setPetState("success");
      schedulePetIdle(760);
      requestAnimationFrame(() => composerInput.focus({ preventScroll: true }));
      return;
    }
    resetHubPosition();
    requestAnimationFrame(() => (nameInput.value ? messageInput : nameInput).focus({ preventScroll: true }));
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
      persistDraft();
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

  const scrollAiToEnd = (): void => {
    requestAnimationFrame(() => {
      aiScreen.scrollTop = aiScreen.scrollHeight;
    });
  };

  const submitAiMessage = async (rawMessage: string): Promise<void> => {
    const message = rawMessage.trim();
    if (!message || assistantBusy || state.mode !== "ai" || state.visibility !== "open") return;

    assistantBusy = true;
    composerInput.value = "";
    composerInput.disabled = true;
    composerSend.disabled = true;
    aiLog.append(createAiMessage(root, message, "user"));

    const pendingMessage = createAiMessage(root, "думаю…", "bot");
    pendingMessage.dataset.pending = "true";
    aiLog.append(pendingMessage);
    scrollAiToEnd();
    setPetState("thinking");

    const result = await assistantClient.reply({
      message,
      locale: root.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ru",
      context: { page: root.defaultView?.location.pathname ?? "home" },
    });

    let responseText: string;
    let successfulAnswer = false;
    if (result.kind === "prepared" || result.kind === "generated") {
      responseText = result.text;
      successfulAnswer = true;
      draft.value = result.text;
      handoffButton.hidden = false;
    } else if (result.kind === "no_data") {
      responseText = "Пока нет согласованных данных для ответа на это. Можно переключиться на «написать» и связаться напрямую.";
    } else if (result.kind === "rate_limited") {
      responseText = "Слишком много запросов. Попробуй ещё раз через минуту.";
    } else {
      responseText = "Чат сейчас недоступен. Можно переключиться на «написать» и связаться напрямую.";
    }

    pendingMessage.textContent = responseText;
    delete pendingMessage.dataset.pending;
    assistantBusy = false;
    composerInput.disabled = false;
    composerSend.disabled = false;
    composerInput.focus({ preventScroll: true });
    scrollAiToEnd();

    setPetState(successfulAnswer ? "speaking" : result.kind === "unavailable" ? "error" : "speaking");
    schedulePetIdle(successfulAnswer ? 1_150 : 900);
  };

  const onComposerSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    void submitAiMessage(composerInput.value);
  };

  const onQuickAction = (event: Event): void => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    const query = button.dataset.contactHubQuickQuery;
    if (query) void submitAiMessage(query);
  };

  const collapse = (): void => {
    if (state.visibility !== "open") return;
    state = transitionContactHub(state, { type: "COLLAPSE" });
    render();
    collapsedLauncher.focus({ preventScroll: true });
  };

  const restore = (): void => {
    if (state.visibility !== "collapsed") return;
    state = transitionContactHub(state, { type: "RESTORE" });
    render();
    if (opener?.matches(PET_SELECTOR)) positionHubNearPet(opener);
    if (state.mode === "ai") composerInput.focus({ preventScroll: true });
    else closeButton.focus({ preventScroll: true });
  };

  const close = (): void => {
    if (state.visibility === "closed") return;
    const focusTarget = opener;
    state = transitionContactHub(state, { type: "CLOSE" });
    render();
    opener = null;
    pendingDraft = "";
    handoffDecision.hidden = true;
    resetHubPosition();
    setPetState("idle");
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || state.visibility !== "open") return;
    event.preventDefault();
    close();
  };

  const onPetMoved = (): void => {
    if (state.visibility !== "open" || state.entryPoint !== "pet" || !opener) return;
    positionHubNearPet(opener);
  };

  const onViewportChange = (): void => {
    if (state.visibility !== "open") return;
    if (state.entryPoint === "pet" && opener) positionHubNearPet(opener);
    else resetHubPosition();
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
  collapseButton.addEventListener("click", collapse);
  collapsedLauncher.addEventListener("click", restore);
  nameInput.addEventListener("input", persistDraft);
  emailInput.addEventListener("input", persistDraft);
  messageInput.addEventListener("input", persistDraft);
  formScreen.addEventListener("submit", preventPrototypeSubmit);
  composer.addEventListener("submit", onComposerSubmit);
  quickActionButtons.forEach((button) => button.addEventListener("click", onQuickAction));
  closeButton.addEventListener("click", close);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("portfolio-pet:moved", onPetMoved);
  root.defaultView?.addEventListener("resize", onViewportChange);
  root.defaultView?.visualViewport?.addEventListener("resize", onViewportChange);
  render();

  return () => {
    openers.forEach((contact) => contact.removeEventListener("click", openFromSiteContact));
    petOpeners.forEach((pet) => pet.removeEventListener("click", openFromPet));
    handoffButton.removeEventListener("click", onHandoff);
    appendButton.removeEventListener("click", onAppend);
    replaceButton.removeEventListener("click", onReplace);
    cancelButton.removeEventListener("click", onCancel);
    collapseButton.removeEventListener("click", collapse);
    collapsedLauncher.removeEventListener("click", restore);
    nameInput.removeEventListener("input", persistDraft);
    emailInput.removeEventListener("input", persistDraft);
    messageInput.removeEventListener("input", persistDraft);
    formScreen.removeEventListener("submit", preventPrototypeSubmit);
    composer.removeEventListener("submit", onComposerSubmit);
    quickActionButtons.forEach((button) => button.removeEventListener("click", onQuickAction));
    closeButton.removeEventListener("click", close);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("portfolio-pet:moved", onPetMoved);
    root.defaultView?.removeEventListener("resize", onViewportChange);
    root.defaultView?.visualViewport?.removeEventListener("resize", onViewportChange);
    if (root.defaultView) root.defaultView.clearTimeout(petStateTimer);
    root.documentElement.classList.remove("contact-hub-open");
    hub.remove();
    collapsedLauncher.remove();
  };
}
