const CAPTION_VIEWS = new Set(["full", "summary", "overlay", "lightbox-only"]);
const OWNER_SELECTOR = "figure.media, figure.before-after";
const OVERLAY_OWNER_SELECTOR =
  'figure.media[data-caption-view="overlay"], figure.before-after[data-caption-view="overlay"]';
const OPEN_OWNER_SELECTOR =
  "figure.media[data-caption-open], figure.before-after[data-caption-open]";
const LEGACY_MANAGED_SELECTOR =
  'figure.media[data-caption], figure.media[data-caption-rest], figure.before-after[data-caption-rest]';
const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, [contenteditable='true']";
const noop = () => {};

export function resolveLegacyCaptionView({ view, mode, rest } = {}) {
  if (CAPTION_VIEWS.has(view)) return view;
  if (mode === "overlay") return "overlay";
  if (rest === "summary") return "summary";
  if (rest === "none") return "lightbox-only";
  return "full";
}

function normalizeSlideCaption(caption) {
  if (!(caption instanceof HTMLElement)) return;
  const view = resolveLegacyCaptionView({ view: caption.dataset.captionView, rest: caption.dataset.captionRest });
  caption.dataset.captionView = view;
  caption.removeAttribute("data-caption-rest");
}

function normalizeOwner(owner) {
  if (!(owner instanceof HTMLElement)) return;
  const wasLegacyManaged = owner.matches(LEGACY_MANAGED_SELECTOR);
  const view = resolveLegacyCaptionView({
    view: owner.dataset.captionView,
    mode: owner.dataset.caption,
    rest: owner.dataset.captionRest,
  });
  owner.dataset.captionView = view;
  owner.removeAttribute("data-caption");
  owner.removeAttribute("data-caption-rest");
  owner.removeAttribute("data-caption-open");
  if (wasLegacyManaged && owner.getAttribute("tabindex") === "0") owner.removeAttribute("tabindex");
  owner.querySelectorAll("[data-slide-caption]").forEach(normalizeSlideCaption);
}

export function normalizeMediaCaptions(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll(OWNER_SELECTOR).forEach((owner) => {
    const hasCaption = Boolean(owner.querySelector(":scope > .media__caption, :scope > figcaption.media__caption"));
    if (hasCaption || owner.matches(LEGACY_MANAGED_SELECTOR) || owner.hasAttribute("data-caption-view")) normalizeOwner(owner);
  });
  root.querySelectorAll("[data-slide-caption]").forEach(normalizeSlideCaption);
}

function overlayOwnerFor(element, root) {
  const owner = element?.closest?.(OVERLAY_OWNER_SELECTOR);
  return owner instanceof HTMLElement && root.contains(owner) ? owner : null;
}

export function createMediaCaptionInteractions({ root = document } = {}) {
  if (!root?.addEventListener) return noop;
  normalizeMediaCaptions(root);
  const coarsePointer = window.matchMedia?.("(hover: none), (pointer: coarse)");

  const closeAll = (except = null) => {
    root.querySelectorAll(OPEN_OWNER_SELECTOR).forEach((owner) => {
      if (owner !== except) owner.removeAttribute("data-caption-open");
    });
  };

  const handleClick = (event) => {
    if (!coarsePointer?.matches) return;
    const target = event.target instanceof Element ? event.target : null;
    const owner = target ? overlayOwnerFor(target, root) : null;
    if (!owner) {
      closeAll();
      return;
    }
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    const open = owner.hasAttribute("data-caption-open");
    if (!open) {
      closeAll(owner);
      owner.setAttribute("data-caption-open", "");
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    owner.removeAttribute("data-caption-open");
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") closeAll();
  };
  const handlePointerModeChange = () => {
    if (!coarsePointer?.matches) closeAll();
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleKeydown);
  coarsePointer?.addEventListener?.("change", handlePointerModeChange);

  return () => {
    closeAll();
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleKeydown);
    coarsePointer?.removeEventListener?.("change", handlePointerModeChange);
  };
}
