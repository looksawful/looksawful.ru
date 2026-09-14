import "../../styles/contact-form-hub.css";

import { mountContactFormHub } from "../../components/contact-form-hub.ts";

const CLEANUP_KEY = "__looksawfulContactHubStoryCleanup";
const DRAFT_KEY = "looksawful.contact-form.draft.v1";

const cleanupPrevious = () => {
  window[CLEANUP_KEY]?.();
  window[CLEANUP_KEY] = null;
  document.documentElement.classList.remove("contact-form-hub-open");
  localStorage.removeItem(DRAFT_KEY);
};

const renderStage = () => {
  const root = document.createElement("main");
  root.style.cssText = "min-height:100vh;background:#f4f4f1;color:#111;padding:32px;font:14px/1.4 Inter,system-ui,sans-serif";
  root.innerHTML = '<a href="mailto:i@lookawful.ru" style="color:inherit">open contact form</a>';
  return root;
};

const mountOpen = () => {
  cleanupPrevious();
  const destroy = mountContactFormHub(document);
  document.querySelector('a[href="mailto:i@lookawful.ru"]')?.click();
  window[CLEANUP_KEY] = () => {
    destroy();
    document.documentElement.classList.remove("contact-form-hub-open");
  };
};

const meta = {
  title: "03 Organisms/Contact Form Hub",
  tags: ["autodocs", "wip", "release-candidate"],
  render: renderStage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Canonical contact-form runtime and production CSS. Use the Lab viewport harness for 320×480 and 390×844 approval checks.",
      },
    },
  },
};

export default meta;

export const Open = {
  play: mountOpen,
};

export const ShortMobile = {
  play: mountOpen,
};
