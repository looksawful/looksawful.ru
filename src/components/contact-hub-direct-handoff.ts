type Destroy = () => void;

const HUB_SELECTOR = "[data-contact-hub]";
const AI_SELECTOR = "[data-contact-hub-ai]";
const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const SITE_CONTACT_SELECTOR = '.contact a[href="mailto:i@lookawful.ru"]';
const HANDOFF_SELECTOR = "[data-contact-hub-direct-contact]";
const MOBILE_MEDIA = "(width <= 42.5rem)";

export function mountContactHubDirectHandoff(root: Document = document): Destroy {
  const hub = root.querySelector<HTMLElement>(HUB_SELECTOR);
  const aiScreen = root.querySelector<HTMLElement>(AI_SELECTOR);
  const siteContact = root.querySelector<HTMLAnchorElement>(SITE_CONTACT_SELECTOR);
  const pets = [...root.querySelectorAll<HTMLElement>(PET_SELECTOR)];
  if (!hub || !aiScreen || !siteContact || aiScreen.querySelector(HANDOFF_SELECTOR)) return () => {};

  let activePet: HTMLElement | null = null;
  let handoffClicking = false;
  let frame = 0;

  const resetInlineAnchor = (): void => {
    hub.style.removeProperty("inset-inline-start");
    hub.style.removeProperty("inset-block-start");
    hub.style.removeProperty("inset-block-end");
    hub.style.removeProperty("inline-size");
  };

  const syncPetAnchor = (): void => {
    const view = root.defaultView;
    if (!view || !activePet || hub.hidden || hub.dataset.visibility !== "open") return;
    if (view.matchMedia(MOBILE_MEDIA).matches) {
      resetInlineAnchor();
      return;
    }

    const petRect = activePet.getBoundingClientRect();
    const hubRect = hub.getBoundingClientRect();
    const margin = 12;
    const gap = 10;
    const viewportWidth = view.visualViewport?.width ?? view.innerWidth;
    const viewportHeight = view.visualViewport?.height ?? view.innerHeight;
    const width = Math.min(328, Math.max(280, viewportWidth - (margin * 2)));
    const height = Math.min(hubRect.height, viewportHeight - (margin * 2));

    let left = petRect.right + gap;
    if (left + width > viewportWidth - margin) left = petRect.left - gap - width;
    left = Math.max(margin, Math.min(left, viewportWidth - width - margin));
    const top = Math.max(margin, Math.min(petRect.bottom - height, viewportHeight - height - margin));

    hub.style.insetInlineStart = `${Math.round(left)}px`;
    hub.style.insetBlockStart = `${Math.round(top)}px`;
    hub.style.insetBlockEnd = "auto";
    hub.style.inlineSize = `${Math.round(width)}px`;
  };

  const scheduleAnchor = (): void => {
    const view = root.defaultView;
    if (!view) return;
    view.cancelAnimationFrame(frame);
    frame = view.requestAnimationFrame(syncPetAnchor);
  };

  const button = root.createElement("button");
  button.type = "button";
  button.className = "contact-hub__text-action contact-hub__direct-contact";
  button.dataset.contactHubDirectContact = "";
  button.textContent = "написать напрямую";

  const onHandoffClick = (): void => {
    handoffClicking = true;
    siteContact.click();
    handoffClicking = false;
    scheduleAnchor();
  };
  const onPetClick = (event: Event): void => {
    if (event.currentTarget instanceof HTMLElement) activePet = event.currentTarget;
    scheduleAnchor();
  };
  const onSiteContactClick = (): void => {
    if (!handoffClicking) activePet = null;
  };
  const onPetMoved = (): void => scheduleAnchor();
  const onResize = (): void => scheduleAnchor();

  button.addEventListener("click", onHandoffClick);
  pets.forEach((pet) => pet.addEventListener("click", onPetClick));
  siteContact.addEventListener("click", onSiteContactClick, true);
  root.addEventListener("portfolio-pet:moved", onPetMoved);
  root.defaultView?.addEventListener("resize", onResize);

  const observer = new MutationObserver(scheduleAnchor);
  observer.observe(hub, {
    attributes: true,
    attributeFilter: ["data-mode", "data-visibility", "hidden"],
  });
  aiScreen.append(button);

  return () => {
    root.defaultView?.cancelAnimationFrame(frame);
    observer.disconnect();
    button.removeEventListener("click", onHandoffClick);
    pets.forEach((pet) => pet.removeEventListener("click", onPetClick));
    siteContact.removeEventListener("click", onSiteContactClick, true);
    root.removeEventListener("portfolio-pet:moved", onPetMoved);
    root.defaultView?.removeEventListener("resize", onResize);
    button.remove();
  };
}
