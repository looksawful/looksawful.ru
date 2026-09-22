const VIDEO_CARD_SELECTOR = '[data-gallery-card][data-gallery-kind="video"]';
const PREVIEW_SELECTOR = "[data-gallery-video-preview]";
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function videoCardFor(root: HTMLElement, target: EventTarget | null): HTMLElement | null {
  const element = target instanceof Element ? target : null;
  const card = element?.closest<HTMLElement>(VIDEO_CARD_SELECTOR) ?? null;
  return card && root.contains(card) ? card : null;
}

function previewFor(card: HTMLElement): HTMLVideoElement | null {
  return card.querySelector<HTMLVideoElement>(PREVIEW_SELECTOR);
}

function relatedTargetInside(card: HTMLElement, event: MouseEvent | FocusEvent): boolean {
  return event.relatedTarget instanceof Node && card.contains(event.relatedTarget);
}

function resetPreview(card: HTMLElement): void {
  const video = previewFor(card);
  card.removeAttribute("data-gallery-video-previewing");
  if (!video) return;

  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    // Browsers may reject seeking until metadata is available.
  }
}

function startPreview(card: HTMLElement): void {
  const video = previewFor(card);
  if (!video) return;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  try {
    video.currentTime = 0;
  } catch {
    // Browsers may reject seeking until metadata is available.
  }
  card.setAttribute("data-gallery-video-previewing", "");
  void video.play().catch(() => {
    card.removeAttribute("data-gallery-video-previewing");
  });
}

export function createGalleryVideoPreviews(root: HTMLElement): () => void {
  const finePointer = window.matchMedia?.(FINE_POINTER_QUERY);
  let keyboardNavigation = false;

  const canPreviewFromFocus = (): boolean => (
    keyboardNavigation || finePointer?.matches === true
  );

  const handleKeydown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === "Tab" || event.key.startsWith("Arrow")) {
      keyboardNavigation = true;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    const card = videoCardFor(root, event.target);
    if (card) resetPreview(card);
  };

  const handlePointerDown = (): void => {
    keyboardNavigation = false;
  };

  const handlePointerOver = (event: Event): void => {
    if (!(event instanceof PointerEvent) || finePointer?.matches !== true) return;
    const card = videoCardFor(root, event.target);
    if (!card || relatedTargetInside(card, event)) return;
    startPreview(card);
  };

  const handlePointerOut = (event: Event): void => {
    if (!(event instanceof PointerEvent)) return;
    const card = videoCardFor(root, event.target);
    if (!card || relatedTargetInside(card, event)) return;
    resetPreview(card);
  };

  const handleFocusIn = (event: Event): void => {
    if (!(event instanceof FocusEvent) || !canPreviewFromFocus()) return;
    const card = videoCardFor(root, event.target);
    if (card) startPreview(card);
  };

  const handleFocusOut = (event: Event): void => {
    if (!(event instanceof FocusEvent)) return;
    const card = videoCardFor(root, event.target);
    if (!card || relatedTargetInside(card, event)) return;
    resetPreview(card);
  };

  const handleClick = (event: Event): void => {
    const card = videoCardFor(root, event.target);
    if (card) resetPreview(card);
  };

  root.addEventListener("keydown", handleKeydown);
  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointerover", handlePointerOver);
  root.addEventListener("pointerout", handlePointerOut);
  root.addEventListener("focusin", handleFocusIn);
  root.addEventListener("focusout", handleFocusOut);
  root.addEventListener("click", handleClick);

  return () => {
    root.removeEventListener("keydown", handleKeydown);
    root.removeEventListener("pointerdown", handlePointerDown);
    root.removeEventListener("pointerover", handlePointerOver);
    root.removeEventListener("pointerout", handlePointerOut);
    root.removeEventListener("focusin", handleFocusIn);
    root.removeEventListener("focusout", handleFocusOut);
    root.removeEventListener("click", handleClick);
    root.querySelectorAll<HTMLElement>(VIDEO_CARD_SELECTOR).forEach(resetPreview);
  };
}
