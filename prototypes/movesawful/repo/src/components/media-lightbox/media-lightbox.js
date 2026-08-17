const SOURCE_SELECTOR = "[data-media-lightbox-source]";
const INSTANCE = Symbol.for("looksawful.mediaLightbox.instance");

const noop = () => {};

function videoFromSource(source) {
  return source?.querySelector?.("video") ?? null;
}

function sourceAtPoint(scope, x, y) {
  const candidates = [
    ...scope.querySelectorAll(SOURCE_SELECTOR),
  ];

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];
    const rect = candidate.getBoundingClientRect();

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return candidate;
    }
  }

  return null;
}

function resolvePointerSource(root, event) {
  const direct =
    event.target instanceof Element
      ? event.target.closest(SOURCE_SELECTOR)
      : null;

  if (direct instanceof HTMLElement) return direct;

  const marquee =
    event.target instanceof Element
      ? event.target.closest("[data-media-marquee]")
      : null;

  if (!(marquee instanceof HTMLElement)) return null;

  return sourceAtPoint(
    marquee,
    event.clientX,
    event.clientY,
  );
}

function createShell() {
  const shell = document.createElement("div");
  shell.className = "media-lightbox";
  shell.setAttribute("role", "dialog");
  shell.setAttribute("aria-modal", "true");
  shell.setAttribute("aria-label", "Просмотр видео");

  shell.innerHTML = `
    <button
      class="media-lightbox__close"
      type="button"
      aria-label="Закрыть"
    >×</button>
    <figure class="media-lightbox__figure">
      <video
        class="media-lightbox__video"
        controls
        playsinline
        preload="metadata"
      ></video>
    </figure>
  `;

  return shell;
}

export function createMediaLightbox({
  root = document,
} = {}) {
  if (
    !root ||
    typeof root.addEventListener !== "function"
  ) {
    return noop;
  }

  if (root[INSTANCE]) {
    return root[INSTANCE].destroy;
  }

  let shell = null;
  let video = null;
  let lastFocused = null;

  function close() {
    if (!shell) return;

    video?.pause();
    shell.remove();

    shell = null;
    video = null;

    document.removeEventListener(
      "keydown",
      handleDocumentKeydown,
    );

    lastFocused?.focus?.();
    lastFocused = null;

    if (root instanceof HTMLElement) {
      root.removeAttribute(
        "data-media-lightbox-open",
      );
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key === "Escape") close();
  }

  function open(source) {
    const sourceVideo = videoFromSource(source);

    if (!(sourceVideo instanceof HTMLVideoElement)) {
      return;
    }

    close();

    lastFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    shell = createShell();
    video = shell.querySelector(
      ".media-lightbox__video",
    );

    if (!(video instanceof HTMLVideoElement)) {
      shell = null;
      video = null;
      return;
    }

    video.src =
      sourceVideo.currentSrc || sourceVideo.src;

    const poster =
      sourceVideo.getAttribute("poster");

    if (poster) {
      video.poster = poster;
    }

    shell.addEventListener(
      "pointerdown",
      (event) => {
        const target = event.target;

        if (
          target === shell ||
          (
            target instanceof Element &&
            target.closest(
              ".media-lightbox__close",
            )
          )
        ) {
          close();
        }
      },
    );

    document.body.append(shell);

    document.addEventListener(
      "keydown",
      handleDocumentKeydown,
    );

    if (root instanceof HTMLElement) {
      root.setAttribute(
        "data-media-lightbox-open",
        "",
      );
    }

    shell
      .querySelector(".media-lightbox__close")
      ?.focus();

    const play = video.play();

    play?.catch?.(() => {
      // Native controls stay available if playback
      // with sound is blocked by browser policy.
    });
  }

  function handleClick(event) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest(
        "a, button:not(.media-lightbox__close)",
      )
    ) {
      return;
    }

    const source =
      resolvePointerSource(root, event);

    if (!(source instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    open(source);
  }

  function handleKeydown(event) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    const source =
      event.target instanceof Element
        ? event.target.closest(SOURCE_SELECTOR)
        : null;

    if (!(source instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();
    open(source);
  }

  root.addEventListener("click", handleClick);
  root.addEventListener(
    "keydown",
    handleKeydown,
  );

  const destroy = () => {
    close();

    root.removeEventListener(
      "click",
      handleClick,
    );
    root.removeEventListener(
      "keydown",
      handleKeydown,
    );

    if (root[INSTANCE]?.destroy === destroy) {
      delete root[INSTANCE];
    }
  };

  root[INSTANCE] = { destroy };

  return destroy;
}
