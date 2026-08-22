const CAPTION_VIEWS = new Set(["full", "summary", "overlay", "lightbox-only"]);
const OWNER_SELECTOR = "figure.media, figure.before-after";
const LEGACY_MANAGED_SELECTOR =
  'figure.media[data-caption], figure.media[data-caption-rest], figure.before-after[data-caption-rest]';
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

  caption.dataset.captionView = resolveLegacyCaptionView({
    view: caption.dataset.captionView,
    rest: caption.dataset.captionRest,
  });

  caption.removeAttribute("data-caption-rest");
  caption.removeAttribute("data-caption-open");
}

function normalizeOwner(owner) {
  if (!(owner instanceof HTMLElement)) return;

  const wasLegacyManaged = owner.matches(LEGACY_MANAGED_SELECTOR);

  owner.dataset.captionView = resolveLegacyCaptionView({
    view: owner.dataset.captionView,
    mode: owner.dataset.caption,
    rest: owner.dataset.captionRest,
  });

  owner.removeAttribute("data-caption");
  owner.removeAttribute("data-caption-rest");
  owner.removeAttribute("data-caption-open");

  if (wasLegacyManaged && owner.getAttribute("tabindex") === "0") {
    owner.removeAttribute("tabindex");
  }

  owner.querySelectorAll("[data-slide-caption]").forEach(normalizeSlideCaption);
}

export function normalizeMediaCaptions(root = document) {
  if (!root?.querySelectorAll) return;

  root.querySelectorAll(OWNER_SELECTOR).forEach((owner) => {
    const hasCaption = Boolean(
      owner.querySelector(
        ":scope > .media__caption, :scope > figcaption.media__caption",
      ),
    );

    if (
      hasCaption ||
      owner.matches(LEGACY_MANAGED_SELECTOR) ||
      owner.hasAttribute("data-caption-view")
    ) {
      normalizeOwner(owner);
    }
  });

  root.querySelectorAll("[data-slide-caption]").forEach(normalizeSlideCaption);
}

export function createMediaCaptionInteractions({ root = document } = {}) {
  if (!root?.querySelectorAll) return noop;

  // Presentation is deliberately CSS-first:
  // - fine pointers reveal overlay captions with :hover / :focus-within;
  // - coarse pointers receive the compact below-media fallback;
  // - lightbox interaction belongs to the media surface, not the caption.
  normalizeMediaCaptions(root);

  return noop;
}
