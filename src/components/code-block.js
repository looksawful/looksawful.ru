const RESET_DELAY = 1200;

function fallbackCopy(source) {
  const range = document.createRange();
  range.selectNodeContents(source);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return document.execCommand?.("copy") ?? false;
}

export function createCodeBlock(root) {
  if (!(root instanceof HTMLElement) || !root.hasAttribute("data-code-copy")) return () => {};
  const button = root.querySelector("[data-code-copy-button]");
  const source = root.querySelector("[data-code-source]");
  if (!(button instanceof HTMLButtonElement) || !(source instanceof HTMLElement)) return () => {};

  const original = button.textContent.trim() || "Copy";
  let timer = 0;

  const reset = () => {
    window.clearTimeout(timer);
    button.textContent = original;
    button.classList.remove("is-copied");
  };

  const copy = async () => {
    const value = source.textContent.trim();
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

export function createCodeBlocks(root = document) {
  const destroys = [...root.querySelectorAll("[data-code-block]")].map(createCodeBlock);
  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
