type Destroy = () => void;

type ContactDraft = {
  name: string;
  email: string;
  message: string;
};

export function buildContactMailtoHref(value: ContactDraft): string {
  const body = [
    value.name.trim() ? `Имя: ${value.name.trim()}` : "",
    `Email: ${value.email.trim()}`,
    "",
    value.message.trim(),
  ]
    .filter((line, index) => line || index === 2)
    .join("\n");
  const subject = "Сообщение с looksawful.ru";
  return `mailto:i@lookawful.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const SITE_CONTACT_SELECTOR = 'a[href="mailto:i@lookawful.ru"]';
const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const DRAFT_STORAGE_KEY = "looksawful.contact-form.draft.v1";
const MOBILE_MEDIA = "(width <= 42.5rem)";

function createTextButton(documentRef: Document, text: string): HTMLButtonElement {
  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = "contact-form-hub__text-action";
  button.textContent = text;
  return button;
}

function readDraft(documentRef: Document): ContactDraft | null {
  try {
    const value: unknown = JSON.parse(
      documentRef.defaultView?.sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const draft = value as Partial<ContactDraft>;
    if (
      typeof draft.name !== "string" ||
      typeof draft.email !== "string" ||
      typeof draft.message !== "string"
    )
      return null;
    return { name: draft.name, email: draft.email, message: draft.message };
  } catch {
    return null;
  }
}

function writeDraft(documentRef: Document, draft: ContactDraft): void {
  try {
    documentRef.defaultView?.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Draft persistence is optional and must not block the form.
  }
}

function createContactForm(documentRef: Document) {
  const hub = documentRef.createElement("div");
  hub.className = "contact-form-hub";
  hub.hidden = true;
  hub.dataset.contactFormHub = "";
  hub.dataset.visibility = "closed";
  hub.setAttribute("role", "dialog");
  hub.setAttribute("aria-label", "Связаться со мной");

  const header = documentRef.createElement("header");
  header.className = "contact-form-hub__header";

  const title = documentRef.createElement("strong");
  title.className = "contact-form-hub__title";
  title.textContent = "написать мне";

  const collapseButton = createTextButton(documentRef, "−");
  collapseButton.classList.add("contact-form-hub__collapse");
  collapseButton.dataset.contactFormHubCollapse = "";
  collapseButton.setAttribute("aria-label", "Свернуть");

  const closeButton = createTextButton(documentRef, "×");
  closeButton.classList.add("contact-form-hub__close");
  closeButton.dataset.contactFormHubClose = "";
  closeButton.setAttribute("aria-label", "Закрыть");
  header.append(title, collapseButton, closeButton);

  const form = documentRef.createElement("form");
  form.className = "contact-form-hub__form";
  form.dataset.contactForm = "";

  const createField = (labelText: string, control: HTMLInputElement | HTMLTextAreaElement) => {
    const label = documentRef.createElement("label");
    label.className = "contact-form-hub__field";
    const caption = documentRef.createElement("span");
    caption.textContent = labelText;
    label.append(caption, control);
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

  const footer = documentRef.createElement("div");
  footer.className = "contact-form-hub__footer";
  const submitButton = documentRef.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "contact-form-hub__text-action contact-form-hub__submit";
  submitButton.textContent = "отправить";

  const fallback = documentRef.createElement("p");
  fallback.className = "contact-form-hub__fallback";
  fallback.append("или ");
  const fallbackLink = documentRef.createElement("a");
  fallbackLink.href = "mailto:i@lookawful.ru";
  fallbackLink.textContent = "i@lookawful.ru";
  fallback.append(fallbackLink);
  footer.append(fallback, submitButton);

  form.append(
    createField("имя", nameInput),
    createField("email", emailInput),
    createField("сообщение", messageInput),
    footer,
  );
  hub.append(header, form);

  const collapsedLauncher = documentRef.createElement("button");
  collapsedLauncher.type = "button";
  collapsedLauncher.className = "contact-form-hub-launcher";
  collapsedLauncher.dataset.contactFormHubLauncher = "";
  collapsedLauncher.setAttribute("aria-label", "Развернуть форму связи");
  collapsedLauncher.textContent = "↗";
  collapsedLauncher.hidden = true;

  return {
    hub,
    collapsedLauncher,
    collapseButton,
    closeButton,
    form,
    nameInput,
    emailInput,
    messageInput,
  };
}

export function mountContactFormHub(root: Document = document): Destroy {
  const siteOpeners = [...root.querySelectorAll<HTMLAnchorElement>(SITE_CONTACT_SELECTOR)];
  const petOpeners = [...root.querySelectorAll<HTMLElement>(PET_SELECTOR)];
  if (!root.body || (siteOpeners.length === 0 && petOpeners.length === 0)) return () => {};
  if (root.querySelector("[data-contact-form-hub]")) return () => {};

  const elements = createContactForm(root);
  const {
    hub,
    collapsedLauncher,
    collapseButton,
    closeButton,
    form,
    nameInput,
    emailInput,
    messageInput,
  } = elements;
  root.body.append(hub, collapsedLauncher);

  let visibility: "closed" | "open" | "collapsed" = "closed";
  let opener: HTMLElement | null = null;

  const draft = readDraft(root);
  if (draft) {
    nameInput.value = draft.name;
    emailInput.value = draft.email;
    messageInput.value = draft.message;
  }

  const currentDraft = (): ContactDraft => ({
    name: nameInput.value,
    email: emailInput.value,
    message: messageInput.value,
  });

  const persistDraft = (): void => writeDraft(root, currentDraft());
  const markInvalid = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.setAttribute("aria-invalid", "true");
    }
  };
  const clearInvalid = (event: Event): void => {
    const target = event.target;
    if (
      (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
      target.validity.valid
    ) {
      target.removeAttribute("aria-invalid");
    }
  };
  const isMobile = (): boolean => root.defaultView?.matchMedia(MOBILE_MEDIA).matches ?? false;

  const resetPosition = (): void => {
    hub.style.removeProperty("inset-inline-start");
    hub.style.removeProperty("inset-block-start");
    hub.style.removeProperty("inset-block-end");
  };

  const positionNearPet = (pet: HTMLElement): void => {
    const view = root.defaultView;
    if (!view || isMobile()) {
      resetPosition();
      return;
    }
    const petRect = pet.getBoundingClientRect();
    const margin = 12;
    const gap = 12;
    const width = Math.min(hub.offsetWidth || 376, view.innerWidth - margin * 2);
    const height = Math.min(hub.offsetHeight || 460, view.innerHeight - margin * 2);
    let left = petRect.right + gap;
    if (left + width > view.innerWidth - margin) left = petRect.left - gap - width;
    left = Math.max(margin, Math.min(left, view.innerWidth - width - margin));
    const top = Math.max(
      margin,
      Math.min(petRect.bottom - height, view.innerHeight - height - margin),
    );
    hub.style.insetInlineStart = `${Math.round(left)}px`;
    hub.style.insetBlockStart = `${Math.round(top)}px`;
    hub.style.insetBlockEnd = "auto";
  };

  const render = (): void => {
    hub.dataset.visibility = visibility;
    hub.hidden = visibility !== "open";
    collapsedLauncher.hidden = visibility !== "collapsed";
    root.documentElement.classList.toggle("contact-form-hub-open", visibility === "open");
  };

  const open = (current: HTMLElement): void => {
    opener = current;
    visibility = "open";
    render();
    if (current.matches(PET_SELECTOR)) positionNearPet(current);
    else resetPosition();
    root.dispatchEvent(new CustomEvent("portfolio-pet:state", { detail: { state: "success" } }));
    root.defaultView?.setTimeout(
      () =>
        root.dispatchEvent(new CustomEvent("portfolio-pet:state", { detail: { state: "idle" } })),
      760,
    );
    requestAnimationFrame(() =>
      (nameInput.value ? messageInput : nameInput).focus({ preventScroll: true }),
    );
  };

  const openFromEvent = (event: Event): void => {
    const current = event.currentTarget;
    if (!(current instanceof HTMLElement)) return;
    event.preventDefault();
    open(current);
  };

  const collapse = (): void => {
    if (visibility !== "open") return;
    visibility = "collapsed";
    render();
    collapsedLauncher.focus({ preventScroll: true });
  };

  const restore = (): void => {
    if (visibility !== "collapsed") return;
    visibility = "open";
    render();
    if (opener?.matches(PET_SELECTOR)) positionNearPet(opener);
    closeButton.focus({ preventScroll: true });
  };

  const close = (): void => {
    if (visibility === "closed") return;
    const focusTarget = opener;
    visibility = "closed";
    opener = null;
    render();
    resetPosition();
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  };

  const submit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const value = currentDraft();
    if (root.defaultView) root.defaultView.location.href = buildContactMailtoHref(value);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || visibility !== "open") return;
    event.preventDefault();
    close();
  };

  const onPetMoved = (): void => {
    if (visibility === "open" && opener?.matches(PET_SELECTOR)) positionNearPet(opener);
  };

  const onViewportChange = (): void => {
    if (visibility !== "open") return;
    if (opener?.matches(PET_SELECTOR)) positionNearPet(opener);
    else resetPosition();
  };

  siteOpeners.forEach((item) => item.addEventListener("click", openFromEvent));
  petOpeners.forEach((item) => item.addEventListener("click", openFromEvent));
  collapseButton.addEventListener("click", collapse);
  collapsedLauncher.addEventListener("click", restore);
  closeButton.addEventListener("click", close);
  form.addEventListener("submit", submit);
  form.addEventListener("invalid", markInvalid, true);
  nameInput.addEventListener("input", persistDraft);
  nameInput.addEventListener("input", clearInvalid);
  emailInput.addEventListener("input", persistDraft);
  emailInput.addEventListener("input", clearInvalid);
  messageInput.addEventListener("input", persistDraft);
  messageInput.addEventListener("input", clearInvalid);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("portfolio-pet:moved", onPetMoved);
  root.defaultView?.addEventListener("resize", onViewportChange);
  root.defaultView?.visualViewport?.addEventListener("resize", onViewportChange);
  render();

  return () => {
    siteOpeners.forEach((item) => item.removeEventListener("click", openFromEvent));
    petOpeners.forEach((item) => item.removeEventListener("click", openFromEvent));
    collapseButton.removeEventListener("click", collapse);
    collapsedLauncher.removeEventListener("click", restore);
    closeButton.removeEventListener("click", close);
    form.removeEventListener("submit", submit);
    form.removeEventListener("invalid", markInvalid, true);
    nameInput.removeEventListener("input", persistDraft);
    nameInput.removeEventListener("input", clearInvalid);
    emailInput.removeEventListener("input", persistDraft);
    emailInput.removeEventListener("input", clearInvalid);
    messageInput.removeEventListener("input", persistDraft);
    messageInput.removeEventListener("input", clearInvalid);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("portfolio-pet:moved", onPetMoved);
    root.defaultView?.removeEventListener("resize", onViewportChange);
    root.defaultView?.visualViewport?.removeEventListener("resize", onViewportChange);
    root.documentElement.classList.remove("contact-form-hub-open");
    hub.remove();
    collapsedLauncher.remove();
  };
}
