import "../../styles/contact-form-hub.css";

import { mountContactFormHub } from "../../components/contact-form-hub.ts";

const CLEANUP_KEY = "__looksawfulContactHubStoryCleanup";
const DRAFT_KEY = "looksawful.contact-form.draft.v1";

const cleanupPrevious = () => {
  window[CLEANUP_KEY]?.();
  window[CLEANUP_KEY] = null;
  document.documentElement.classList.remove("contact-form-hub-open");
  sessionStorage.removeItem(DRAFT_KEY);
};

const renderStage = () => {
  const root = document.createElement("main");
  root.dataset.contactStoryStage = "";
  root.innerHTML = `
    <style>
      [data-contact-story-stage] { min-height:100vh; padding:clamp(24px,5vw,72px); background:var(--clr-bg); color:var(--clr-text); }
      [data-contact-story-shell] { min-height:min(70vh,680px); display:grid; align-content:space-between; gap:var(--size-500); padding:var(--size-500); border:var(--border-width-100) solid var(--clr-border); border-radius:var(--radius-shell); background:var(--clr-surface-raised); }
      [data-contact-story-copy] { max-width:34rem; display:grid; gap:var(--size-200); }
      [data-contact-story-copy] h1 { margin:0; font-size:var(--fs-600); font-weight:var(--fw-600); letter-spacing:var(--ls-heading); }
      [data-contact-story-copy] p { margin:0; color:var(--clr-text-muted); font-size:var(--fs-300); }
      [data-contact-story-open] { min-block-size:var(--control-block-size); justify-self:start; display:inline-grid; place-items:center; padding-inline:var(--control-padding-inline); border:var(--border-width-100) solid var(--clr-border); border-radius:var(--control-radius); background:var(--clr-surface-elevated); color:inherit; box-shadow:var(--shadow-control); font-size:var(--fs-200); text-decoration:none; }
    </style>
    <section data-contact-story-shell>
      <div data-contact-story-copy>
        <small>final non-AI contact flow</small>
        <h1>форма в реальном runtime</h1>
        <p>Открывай, вводи текст, проверяй focus, validation, collapse/restore и viewport. Состояние для сравнения выбирается штатным Storybook Control.</p>
      </div>
      <a data-contact-story-open href="mailto:i@lookawful.ru">открыть форму</a>
    </section>`;
  return root;
};

const setValue = (control, value) => {
  control.value = value;
  control.dispatchEvent(new Event("input", { bubbles: true }));
};

const mountScenario = (scenario = "open") => {
  cleanupPrevious();
  const destroy = mountContactFormHub(document);
  const opener = document.querySelector("[data-contact-story-open]");

  if (scenario !== "closed") opener?.click();

  const form = document.querySelector("[data-contact-form]");
  const name = form?.querySelector('[name="name"]');
  const email = form?.querySelector('[name="email"]');
  const message = form?.querySelector('[name="message"]');

  if (form instanceof HTMLFormElement && name instanceof HTMLInputElement && email instanceof HTMLInputElement && message instanceof HTMLTextAreaElement) {
    if (scenario === "filled") {
      setValue(name, "Иван");
      setValue(email, "hello@example.com");
      setValue(message, "Привет! Хочу обсудить проект и доступные сроки.");
    }
    if (scenario === "validation") {
      setValue(email, "wrong-email");
      setValue(message, "Проверяем реальное состояние валидации.");
      email.dispatchEvent(new Event("invalid", { cancelable: true }));
    }
    if (scenario === "focused") requestAnimationFrame(() => email.focus({ preventScroll: true }));
    if (scenario === "collapsed") document.querySelector("[data-contact-form-hub-collapse]")?.click();
  }

  window[CLEANUP_KEY] = () => {
    destroy();
    document.documentElement.classList.remove("contact-form-hub-open");
  };
};

const playScenario = ({ args }) => mountScenario(args.scenario);

const meta = {
  title: "03 Organisms/Contact Form Hub",
  tags: ["autodocs", "wip", "release-candidate"],
  render: renderStage,
  args: { scenario: "open" },
  argTypes: {
    scenario: {
      control: "select",
      options: ["closed", "open", "focused", "filled", "validation", "collapsed"],
      description: "Initial canonical runtime state. The form remains interactive after mount.",
    },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Canonical contact-form runtime and production CSS. Use Controls for deterministic states, then interact with the real form directly. No AI/chat layer and no fake sent state before transport exists.",
      },
    },
  },
};

export default meta;

export const ReviewFlow = { args: { scenario: "closed" }, play: playScenario };
export const Open = { args: { scenario: "open" }, play: playScenario };
export const Focused = { args: { scenario: "focused" }, play: playScenario };
export const FilledDraft = { args: { scenario: "filled" }, play: playScenario };
export const Validation = { args: { scenario: "validation" }, play: playScenario };
export const CollapsedRestore = { args: { scenario: "collapsed" }, play: playScenario };
export const ShortMobile = { args: { scenario: "open" }, play: playScenario };
