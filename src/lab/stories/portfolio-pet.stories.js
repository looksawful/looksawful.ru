import "../../styles/portfolio-pet.css";
import "../../styles/contact-form-hub.css";

import { mountPortfolioPet } from "../../components/portfolio-pet.ts";
import { mountContactFormHub } from "../../components/contact-form-hub.ts";

const CLEANUP_KEY = "__looksawfulAwfulStoryCleanup";
const POSITION_KEY = "looksawful:portfolio-pet-position:v1";
const DRAFT_KEY = "looksawful.contact-form.draft.v1";

const cleanupPrevious = () => {
  window[CLEANUP_KEY]?.();
  window[CLEANUP_KEY] = null;
  document.documentElement.classList.remove("contact-form-hub-open");
  localStorage.removeItem(POSITION_KEY);
  localStorage.removeItem(DRAFT_KEY);
};

const stage = () => {
  const root = document.createElement("main");
  root.style.cssText = "min-height:100vh;background:#f4f4f1;color:#111;padding:32px;font:14px/1.4 Inter,system-ui,sans-serif";
  root.innerHTML = '<p style="margin:0;max-width:32rem">Awful release candidate · drag the mascot, click it to open contact.</p><a href="mailto:i@lookawful.ru" style="position:absolute;right:32px;top:32px;color:inherit">contact</a>';
  return root;
};

const installReducedMotion = (enabled) => {
  if (!enabled) return () => {};
  const original = window.matchMedia;
  window.matchMedia = (query) => {
    if (query !== "(prefers-reduced-motion: reduce)") return original.call(window, query);
    return {
      matches: true,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() { return true; },
    };
  };
  return () => { window.matchMedia = original; };
};

const mountCandidate = ({ open = false, facing = "right", hidden = false, reducedMotion = false } = {}) => {
  cleanupPrevious();
  const restoreMatchMedia = installReducedMotion(reducedMotion);
  const destroyPet = mountPortfolioPet(document, { enabled: true });
  const destroyHub = mountContactFormHub(document);
  const launcher = document.querySelector("[data-portfolio-pet-launcher]");
  if (launcher instanceof HTMLElement && facing === "left") {
    launcher.dataset.facing = "left";
    launcher.style.setProperty("--pet-facing", "-1");
  }
  if (hidden) {
    const dismiss = document.querySelector("[data-portfolio-pet-dismiss]");
    if (dismiss instanceof HTMLButtonElement) dismiss.click();
  }
  if (open && launcher instanceof HTMLButtonElement) launcher.click();

  const cleanup = () => {
    destroyHub();
    destroyPet();
    restoreMatchMedia();
    document.documentElement.classList.remove("contact-form-hub-open");
  };
  window[CLEANUP_KEY] = cleanup;
};

const meta = {
  title: "03 Organisms/Awful Contact",
  tags: ["autodocs", "wip", "release-candidate"],
  render: stage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Canonical Awful v6 mascot and contact-form runtime from the current production release candidate. Story-only controls change preview state; markup, animation runtime and production CSS remain canonical.",
      },
    },
  },
};

export default meta;

export const Interactive = {
  play: () => mountCandidate(),
};

export const ContactOpen = {
  play: () => mountCandidate({ open: true }),
};

export const LeftFacing = {
  play: () => mountCandidate({ facing: "left" }),
};

export const HiddenRestore = {
  play: () => mountCandidate({ hidden: true }),
};

export const ReducedMotion = {
  play: () => mountCandidate({ reducedMotion: true }),
};
