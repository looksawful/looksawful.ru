const RESET_DELAY = 1000;

function selectTarget(target) {
  const range = document.createRange();
  range.selectNodeContents(target);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function getCopyValue(button, target) {
  const value = target.textContent ?? "";
  if (button.dataset.copyTransform === "dos") {
    return value
      .replace(/^C:\\>\s?/gm, "")
      .replace(/^C:\\awful-cases>\s?/gm, "")
      .replace(/^REM\s?/gm, "# ")
      .trim();
  }
  return value.trim();
}

function copiedLabel(button) {
  return button.querySelector(".btn-u")
    ? '<span class="btn-u">C</span>opied'
    : "copied";
}

export function enhanceCodeCopy(root = document) {
  root.querySelectorAll("[data-copy-target]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement) || button.dataset.copyEnhanced === "true") return;
    button.dataset.copyEnhanced = "true";
    button.addEventListener("click", async () => {
      const targetId = button.dataset.copyTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      const value = getCopyValue(button, target);
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        selectTarget(target);
        return;
      }

      const original = button.innerHTML;
      button.classList.add("is-copied");
      button.innerHTML = copiedLabel(button);
      window.setTimeout(() => {
        button.classList.remove("is-copied");
        button.innerHTML = original;
      }, RESET_DELAY);
    });
  });
}

enhanceCodeCopy();
