const TARGETS = [
  { selector: "#showcase .policy-shell", title: "редполитика" },
  { selector: "#pets .pet-page-slide__frame", title: "pet preview" },
  { selector: "#showcase .pet-page-slide__frame", title: "pet preview" },
];

const getTargetTitle = (target, fallback) => {
  const slideTitle = target.closest(".pet-page-slide")?.querySelector(".pet-page-slide__title")?.textContent?.trim();
  return slideTitle || target.getAttribute("aria-label") || fallback;
};

const createDialog = (root = document) => {
  let dialog = document.querySelector("[data-artifact-fullscreen-dialog]");
  if (dialog) return dialog;

  dialog = document.createElement("dialog");
  dialog.className = "artifact-fullscreen";
  dialog.dataset.artifactFullscreenDialog = "";
  dialog.innerHTML = `
    <div class="artifact-fullscreen__bar">
      <p class="artifact-fullscreen__title" data-artifact-fullscreen-title></p>
      <button class="artifact-fullscreen__close" type="button" data-artifact-fullscreen-close aria-label="закрыть полноэкранный просмотр">закрыть</button>
    </div>
    <div class="artifact-fullscreen__body" data-artifact-fullscreen-body></div>
  `;
  document.body.append(dialog);

  dialog.querySelector("[data-artifact-fullscreen-close]")?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("close", () => {
    const body = dialog.querySelector("[data-artifact-fullscreen-body]");
    const sourceId = dialog.dataset.sourceId;
    const source = sourceId ? document.querySelector(`[data-artifact-fullscreen-source="${sourceId}"]`) : null;
    const node = body?.firstElementChild;
    const opener = dialog.dataset.openerId ? root.getElementById(dialog.dataset.openerId) : null;

    if (source && node) source.after(node);
    dialog.dataset.sourceId = "";
    dialog.dataset.openerId = "";
    document.documentElement.classList.remove("has-artifact-fullscreen");
    if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
  });

  return dialog;
};

let uid = 0;

const setupTarget = (target, title, dialog) => {
  if (!(target instanceof HTMLElement) || target.dataset.artifactFullscreenReady === "true") return;
  if (target.closest("[data-artifact-fullscreen-dialog]")) return;

  uid += 1;
  const sourceId = `artifact-source-${uid}`;
  const buttonId = `artifact-fullscreen-open-${uid}`;
  const source = document.createElement("span");
  source.hidden = true;
  source.dataset.artifactFullscreenSource = sourceId;

  target.before(source);

  const button = document.createElement("button");
  button.type = "button";
  button.id = buttonId;
  button.className = "artifact-fullscreen-open";
  button.textContent = "открыть на весь экран";
  button.dataset.artifactFullscreenOpen = "";
  target.before(button);

  button.addEventListener("click", () => {
    const body = dialog.querySelector("[data-artifact-fullscreen-body]");
    const titleNode = dialog.querySelector("[data-artifact-fullscreen-title]");
    if (!body || !titleNode) return;

    titleNode.textContent = getTargetTitle(target, title);
    dialog.dataset.sourceId = sourceId;
    dialog.dataset.openerId = buttonId;
    body.append(target);
    document.documentElement.classList.add("has-artifact-fullscreen");
    dialog.showModal();
    dialog.querySelector("[data-artifact-fullscreen-close]")?.focus({ preventScroll: true });
  });

  target.dataset.artifactFullscreenReady = "true";
};

export const mountArtifactFullscreen = (root = document) => {
  const dialog = createDialog(root);
  const seen = new Set();

  TARGETS.forEach(({ selector, title }) => {
    root.querySelectorAll(selector).forEach((target) => {
      if (seen.has(target)) return;
      seen.add(target);
      setupTarget(target, title, dialog);
    });
  });
};
