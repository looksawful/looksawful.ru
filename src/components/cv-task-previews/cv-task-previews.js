import { gsap } from "gsap";

const CHIP_SELECTOR = ".cv-task-chip";
const PREVIEW_SELECTOR = ".cv-task-chip[data-preview-src]";
const PROJECT_MORE_BUTTON_SELECTOR = ".cv-project-more__button";
const PREVIEW_CLASS = "cv-task-preview";
const VISIBLE_CLASS = "is-visible";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TONE_COUNT = 24;
const TONE_SEQUENCE = [
  1, 12, 6, 19, 3, 15, 9, 22, 5, 17, 11, 24,
  2, 14, 8, 21, 4, 16, 10, 23, 7, 18, 13, 20,
];

let previewImage = null;

function getReducedMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function assignChipTones(chips) {
  chips.forEach((chip) => {
    if (chip.dataset.tone) {
      return;
    }

    const list = chip.closest(".cv-task-chips");
    const row = list ? [...document.querySelectorAll(".cv-task-chips")].indexOf(list) : 0;
    const chipIndex = [...(list?.querySelectorAll(CHIP_SELECTOR) ?? chips)].indexOf(chip);
    const sequenceIndex = (chipIndex * 5 + row * 7) % TONE_COUNT;

    chip.dataset.tone = TONE_SEQUENCE[sequenceIndex];
  });
}

function ensurePreviewImage() {
  if (previewImage) {
    return previewImage;
  }

  previewImage = document.createElement("img");
  previewImage.className = PREVIEW_CLASS;
  previewImage.alt = "";
  previewImage.decoding = "async";
  previewImage.setAttribute("aria-hidden", "true");
  document.body.appendChild(previewImage);

  return previewImage;
}

function movePreview(event) {
  if (!previewImage) {
    return;
  }

  if (typeof event.clientX === "number" && typeof event.clientY === "number") {
    previewImage.style.left = `${event.clientX}px`;
    previewImage.style.top = `${event.clientY}px`;
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();
  previewImage.style.left = `${rect.left + rect.width / 2}px`;
  previewImage.style.top = `${rect.top + rect.height}px`;
}

function showPreview(event) {
  const source = event.currentTarget.dataset.previewSrc;

  if (!source) {
    return;
  }

  const preview = ensurePreviewImage();
  preview.src = source;
  movePreview(event);
  preview.classList.add(VISIBLE_CLASS);
}

function hidePreview() {
  previewImage?.classList.remove(VISIBLE_CLASS);
}

function getRelatedChips(chip) {
  return [...(chip.closest(".cv-task-chips")?.querySelectorAll(CHIP_SELECTOR) ?? [])];
}

function getScaleForDistance(activeRect, chip) {
  const rect = chip.getBoundingClientRect();
  const activeX = activeRect.left + activeRect.width / 2;
  const activeY = activeRect.top + activeRect.height / 2;
  const chipX = rect.left + rect.width / 2;
  const chipY = rect.top + rect.height / 2;
  const normalizedDistance = Math.hypot((chipX - activeX) / 96, (chipY - activeY) / 42);

  if (normalizedDistance < 0.45) {
    return 1.065;
  }

  if (normalizedDistance < 1.55) {
    return 1.035;
  }

  if (normalizedDistance < 2.35) {
    return 1.016;
  }

  return 1;
}

function animateChipCluster(activeChip) {
  if (getReducedMotionPreference()) {
    return;
  }

  const chips = getRelatedChips(activeChip);
  const activeRect = activeChip.getBoundingClientRect();

  gsap.killTweensOf(chips);
  gsap.to(chips, {
    scale: (_, chip) => getScaleForDistance(activeRect, chip),
    y: (_, chip) => (chip === activeChip ? -1 : 0),
    zIndex: (_, chip) => (chip === activeChip ? 2 : 1),
    duration: 0.24,
    ease: "power3.out",
    overwrite: true,
  });
}

function resetChipCluster(chip) {
  if (getReducedMotionPreference()) {
    return;
  }

  const chips = getRelatedChips(chip);

  gsap.killTweensOf(chips);
  gsap.to(chips, {
    scale: 1,
    y: 0,
    zIndex: 1,
    duration: 0.28,
    ease: "power3.out",
    overwrite: true,
  });
}

function handleChipEnter(event) {
  animateChipCluster(event.currentTarget);
  showPreview(event);
}

function handleChipMove(event) {
  movePreview(event);
}

function handleChipLeave(event) {
  resetChipCluster(event.currentTarget);
  hidePreview();
}

function initProjectAccordions() {
  const buttons = [...document.querySelectorAll(PROJECT_MORE_BUTTON_SELECTOR)];

  buttons.forEach((button) => {
    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    if (!panel) {
      return;
    }

    button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("aria-expanded") !== "true";

      button.setAttribute("aria-expanded", String(shouldOpen));
      panel.hidden = !shouldOpen;
    });
  });
}

export function initCvTaskPreviews() {
  const chips = [...document.querySelectorAll(CHIP_SELECTOR)];
  const previewChips = [...document.querySelectorAll(PREVIEW_SELECTOR)];

  initProjectAccordions();

  if (!chips.length) {
    return;
  }

  assignChipTones(chips);

  chips.forEach((chip) => {
    chip.addEventListener("pointerenter", handleChipEnter);
    chip.addEventListener("pointermove", handleChipMove);
    chip.addEventListener("pointerleave", handleChipLeave);
  });

  previewChips.forEach((chip) => {
    chip.addEventListener("focus", showPreview);
    chip.addEventListener("blur", hidePreview);
  });
}
