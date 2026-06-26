const mountedButtons = new WeakSet();

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

function clearElement(element) {
  while (element.firstChild) {
    element.firstChild.remove();
  }
}

function cloneArtifactSource(source) {
  const clone = source.cloneNode(true);

  clone.querySelectorAll("[id]").forEach((node) => {
    node.removeAttribute("id");
  });

  clone.querySelectorAll("[tabindex]").forEach((node) => {
    node.removeAttribute("tabindex");
  });

  clone.querySelectorAll("[data-policy-current]").forEach((node) => {
    node.textContent = "";
  });

  clone.querySelectorAll("[data-policy-total]").forEach((node) => {
    node.textContent = "";
  });

  return clone;
}

export function initArtifactReaders(root = document) {
  root.querySelectorAll("[data-artifact-reader-open]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement) || mountedButtons.has(button)) {
      return;
    }

    mountedButtons.add(button);

    const name = button.getAttribute("data-artifact-reader-open");

    if (!name) {
      return;
    }

    const source = root.querySelector('[data-artifact-source="' + name + '"]');
    const dialog = root.querySelector('[data-artifact-reader="' + name + '"]');

    if (!(source instanceof HTMLElement) || !(dialog instanceof HTMLDialogElement)) {
      return;
    }

    const body = dialog.querySelector("[data-artifact-reader-body]");

    if (!(body instanceof HTMLElement)) {
      return;
    }

    button.addEventListener("click", () => {
      clearElement(body);
      body.appendChild(cloneArtifactSource(source));
      openDialog(dialog);
    });

    dialog.querySelectorAll("[data-artifact-reader-close]").forEach((closeButton) => {
      if (!(closeButton instanceof HTMLButtonElement)) {
        return;
      }

      closeButton.addEventListener("click", () => {
        closeDialog(dialog);
      });
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog(dialog);
      }
    });
  });
}

