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
  sessionStorage.removeItem(DRAFT_KEY);
};

const stage = () => {
  const root = document.createElement("main");
  root.dataset.awfulLabStage = "";
  root.innerHTML = `
    <style>
      [data-awful-lab-stage] { min-height:100vh; padding:clamp(24px,5vw,72px); background:var(--clr-bg); color:var(--clr-text); }
      [data-awful-lab-shell] { min-height:min(76vh,720px); position:relative; display:grid; align-content:space-between; gap:var(--size-500); overflow:hidden; padding:var(--size-500); border:var(--border-width-100) solid var(--clr-border); border-radius:var(--radius-shell); background:var(--clr-surface-raised); }
      [data-awful-lab-copy] { max-width:38rem; display:grid; gap:var(--size-200); }
      [data-awful-lab-copy] h1 { margin:0; max-width:12ch; font-size:var(--fs-700); font-weight:var(--fw-500); letter-spacing:var(--ls-heading); }
      [data-awful-lab-copy] p { margin:0; max-width:52ch; color:var(--clr-text-muted); font-size:var(--fs-300); }
      [data-awful-lab-contact] { justify-self:start; color:inherit; font-size:var(--fs-200); text-underline-offset:.18em; }
    </style>
    <section data-awful-lab-shell>
      <div data-awful-lab-copy>
        <small>Awful v6 · final non-AI review</small>
        <h1>маскот как вход в контакт</h1>
        <p>Кликни Awful, перетащи его, сверни форму, закрой её, спрячь маскота штатным контролом и верни обратно. Начальные состояния задаются через Storybook Controls, runtime остаётся production-кодом.</p>
      </div>
      <a data-awful-lab-contact href="mailto:i@lookawful.ru">обычный контакт</a>
    </section>`;
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
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
      dispatchEvent() { return true; },
    };
  };
  return () => { window.matchMedia = original; };
};

const setFacing = (launcher, facing) => {
  if (!(launcher instanceof HTMLElement)) return;
  launcher.dataset.facing = facing;
  launcher.style.setProperty("--pet-facing", facing === "left" ? "-1" : "1");
};

const mountCandidate = ({ contactOpen = false, facing = "right", hidden = false, reducedMotion = false } = {}) => {
  cleanupPrevious();
  const restoreMatchMedia = installReducedMotion(reducedMotion);
  const destroyPet = mountPortfolioPet(document, { enabled: true });
  const destroyHub = mountContactFormHub(document);
  const launcher = document.querySelector("[data-portfolio-pet-launcher]");
  setFacing(launcher, facing);

  if (hidden) document.querySelector("[data-portfolio-pet-dismiss]")?.click();
  if (contactOpen && launcher instanceof HTMLButtonElement) launcher.click();

  window[CLEANUP_KEY] = () => {
    destroyHub();
    destroyPet();
    restoreMatchMedia();
    document.documentElement.classList.remove("contact-form-hub-open");
  };
};

const playCandidate = ({ args }) => mountCandidate(args);

const meta = {
  title: "03 Organisms/Awful Contact",
  tags: ["autodocs", "wip", "release-candidate"],
  render: stage,
  args: {
    contactOpen: false,
    facing: "right",
    hidden: false,
    reducedMotion: false,
  },
  argTypes: {
    contactOpen: { control: "boolean", description: "Open the canonical contact form after mount." },
    facing: { control: "inline-radio", options: ["right", "left"] },
    hidden: { control: "boolean" },
    reducedMotion: { control: "boolean" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Canonical Awful v6 mascot and contact-form runtime. Controls only choose the initial state; click, drag, hide/restore and the form itself remain real production behavior.",
      },
    },
  },
};

export default meta;

export const ReviewPlayground = { play: playCandidate };
export const Interactive = { play: playCandidate };
export const ContactOpen = { args: { contactOpen: true }, play: playCandidate };
export const LeftFacing = { args: { facing: "left" }, play: playCandidate };
export const HiddenRestore = { args: { hidden: true }, play: playCandidate };
export const ReducedMotion = { args: { reducedMotion: true }, play: playCandidate };
