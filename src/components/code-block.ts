const RESET_DELAY = 1200;

function fallbackCopy(source: HTMLElement): boolean {
  const range = document.createRange();
  range.selectNodeContents(source);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return document.execCommand?.("copy") ?? false;
}

export function createCodeBlock(root: unknown) {
  if (!(root instanceof HTMLElement) || !root.hasAttribute("data-code-copy")) return () => {};
  const button = root.querySelector("[data-code-copy-button]");
  const source = root.querySelector("[data-code-source]");
  if (!(button instanceof HTMLButtonElement) || !(source instanceof HTMLElement)) return () => {};

  const original = (button.textContent as string).trim() || "Copy";
  let timer: number = 0;

  const reset = (): void => {
    window.clearTimeout(timer);
    button.textContent = original;
    button.classList.remove("is-copied");
  };

  const copy = async (_event: Event): Promise<void> => {
    const value = (source.textContent as string).trim();
    let copied = false;
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      copied = fallbackCopy(source);
    }
    if (!copied) return;

    button.textContent = "Copied";
    button.classList.add("is-copied");
    window.clearTimeout(timer);
    timer = window.setTimeout(reset, RESET_DELAY);
  };

  button.addEventListener("click", copy);
  return () => {
    reset();
    button.removeEventListener("click", copy);
  };
}

export function createCodeBlocks(root: ParentNode = document) {
  const destroys = [...root.querySelectorAll("[data-code-block]")].map(createCodeBlock);
  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
