export {};

const storageKey = "looksawful:lab:scratch-css:v1";
const styleId = "looksawful-lab-scratch-style";

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Lab scratch element: ${selector}`);
  return element;
}

const frame = required<HTMLIFrameElement>("[data-preview-frame]");
const textarea = required<HTMLTextAreaElement>("[data-scratch-css]");
const status = required<HTMLElement>("[data-scratch-status]");
const copyButton = required<HTMLButtonElement>("[data-action='scratch-copy']");
const resetButton = required<HTMLButtonElement>("[data-action='scratch-reset']");

function readStoredCss(): string {
  try {
    return localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function writeStoredCss(value: string): void {
  try {
    if (value) localStorage.setItem(storageKey, value);
    else localStorage.removeItem(storageKey);
  } catch {
    // The scratchpad still works for the current page when storage is unavailable.
  }
}

function updateStatus(value: string): void {
  status.textContent = value.trim() ? "live override active" : "no override";
  status.dataset.active = value.trim() ? "true" : "false";
}

function applyCss(value: string): void {
  writeStoredCss(value);
  updateStatus(value);

  const doc = frame.contentDocument;
  if (!doc?.head) return;

  let style = doc.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = styleId;
    style.dataset.labOnly = "scratch-css";
    doc.head.append(style);
  }
  style.textContent = value;
}

async function copyCss(): Promise<void> {
  try {
    await navigator.clipboard.writeText(textarea.value);
    const previous = copyButton.textContent;
    copyButton.textContent = "copied";
    window.setTimeout(() => {
      copyButton.textContent = previous;
    }, 900);
  } catch {
    status.textContent = "clipboard unavailable";
  }
}

function resetCss(): void {
  textarea.value = "";
  applyCss("");
  textarea.focus();
}

textarea.value = readStoredCss();
updateStatus(textarea.value);

textarea.addEventListener("input", () => applyCss(textarea.value));
copyButton.addEventListener("click", () => void copyCss());
resetButton.addEventListener("click", resetCss);
frame.addEventListener("load", () => applyCss(textarea.value));
