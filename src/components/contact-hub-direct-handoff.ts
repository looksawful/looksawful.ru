type Destroy = () => void;

const HUB_SELECTOR = "[data-contact-hub]";
const AI_SELECTOR = "[data-contact-hub-ai]";
const SITE_CONTACT_SELECTOR = '.contact a[href="mailto:i@lookawful.ru"]';
const HANDOFF_SELECTOR = "[data-contact-hub-direct-contact]";

export function mountContactHubDirectHandoff(root: Document = document): Destroy {
  const hub = root.querySelector<HTMLElement>(HUB_SELECTOR);
  const aiScreen = root.querySelector<HTMLElement>(AI_SELECTOR);
  const siteContact = root.querySelector<HTMLAnchorElement>(SITE_CONTACT_SELECTOR);
  if (!hub || !aiScreen || !siteContact || aiScreen.querySelector(HANDOFF_SELECTOR)) return () => {};

  const button = root.createElement("button");
  button.type = "button";
  button.className = "contact-hub__text-action contact-hub__direct-contact";
  button.dataset.contactHubDirectContact = "";
  button.textContent = "написать напрямую";

  const onClick = (): void => siteContact.click();
  button.addEventListener("click", onClick);
  aiScreen.append(button);

  return () => {
    button.removeEventListener("click", onClick);
    button.remove();
  };
}
