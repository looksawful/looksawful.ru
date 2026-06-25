const mountedShells = new WeakSet();

function syncShell(shell, toggle) {
  const expanded = shell.classList.contains("is-expanded");
  const openLabel = toggle.getAttribute("data-open-label") || "развернуть демо";
  const closeLabel = toggle.getAttribute("data-close-label") || "свернуть демо";

  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.textContent = expanded ? closeLabel : openLabel;
}

export function initDemoShells(root = document) {
  root.querySelectorAll("[data-demo-shell]").forEach((shell) => {
    if (!(shell instanceof HTMLElement) || mountedShells.has(shell)) {
      return;
    }

    mountedShells.add(shell);

    const toggle = shell.querySelector("[data-demo-shell-toggle]");

    if (!(toggle instanceof HTMLButtonElement)) {
      return;
    }

    syncShell(shell, toggle);

    toggle.addEventListener("click", () => {
      shell.classList.toggle("is-expanded");
      syncShell(shell, toggle);
    });
  });
}
