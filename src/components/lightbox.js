const DISABLED_SELECTOR = ':not([data-lightbox="off"]):not([data-lightbox="false"])';
const LIGHTBOX_SELECTOR = [`[data-lightbox]${DISABLED_SELECTOR}`, `a.media-item[href]${DISABLED_SELECTOR}`].join(", ");
const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)(\?.*)?(#.*)?$/i;
const EXPLICIT_LIGHTBOX_TYPES = new Set(["image", "video"]);

let lightboxInstance = null;
const mountedRoots = new WeakSet();
let activeTrigger = null;

const getMediaType = (src = "", explicitType = "") => {
  if (explicitType) {
    return explicitType;
  }

  return VIDEO_EXTENSION_PATTERN.test(src) ? "video" : "image";
};

const getMediaData = (trigger) => {
  const explicitSrc = trigger.dataset.lightboxSrc;
  const explicitType =
    trigger.dataset.lightboxType ||
    (EXPLICIT_LIGHTBOX_TYPES.has(trigger.dataset.lightbox) ? trigger.dataset.lightbox : "");

  if (explicitSrc) {
    return { src: explicitSrc, type: getMediaType(explicitSrc, explicitType) };
  }

  if (trigger instanceof HTMLAnchorElement && trigger.href) {
    return { src: trigger.href, type: getMediaType(trigger.href, explicitType) };
  }

  const video = trigger.matches("video") ? trigger : trigger.querySelector("video");
  if (video instanceof HTMLVideoElement) {
    return { src: video.currentSrc || video.src, type: "video" };
  }

  const image = trigger.matches("img") ? trigger : trigger.querySelector("img");
  if (image instanceof HTMLImageElement) {
    return { src: image.currentSrc || image.src, type: "image" };
  }

  const canvas = trigger.matches("canvas") ? trigger : trigger.querySelector("canvas");
  if (canvas instanceof HTMLCanvasElement) {
    try {
      return { src: canvas.toDataURL("image/png"), type: "image" };
    } catch {
      return null;
    }
  }

  return null;
};

const createLightbox = () => {
  if (lightboxInstance) {
    return lightboxInstance;
  }

  const root = document.createElement("div");
  root.className = "lightbox";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="просмотр медиа">
      <div class="lightbox__toolbar">
        <button class="lightbox__close" type="button">закрыть</button>
      </div>
      <div class="lightbox__body"></div>
    </div>
  `;

  document.body.append(root);

  lightboxInstance = {
    root,
    body: root.querySelector(".lightbox__body"),
    close: root.querySelector(".lightbox__close"),
    isBound: false,
  };

  return lightboxInstance;
};

export function initLightbox(root = document) {
  if (mountedRoots.has(root)) {
    return;
  }

  mountedRoots.add(root);

  const lightbox = createLightbox();

  if (!(lightbox.body instanceof HTMLElement) || !(lightbox.close instanceof HTMLButtonElement)) {
    return;
  }

  const close = () => {
    if (!lightbox.root.classList.contains("is-open")) {
      return;
    }

    lightbox.root.classList.remove("is-open");
    lightbox.root.setAttribute("aria-hidden", "true");
    lightbox.body.replaceChildren();
    document.documentElement.classList.remove("has-lightbox");

    if (activeTrigger?.isConnected) {
      activeTrigger.focus?.({ preventScroll: true });
    }

    activeTrigger = null;
  };

  const open = ({ src, type }, trigger) => {
    const media = type === "video" ? document.createElement("video") : document.createElement("img");

    media.src = src;
    activeTrigger = trigger;

    if (media instanceof HTMLVideoElement) {
      media.controls = true;
      media.autoplay = true;
      media.playsInline = true;
    } else {
      media.alt = "";
      media.decoding = "async";
    }

    lightbox.body.replaceChildren(media);
    lightbox.root.classList.add("is-open");
    lightbox.root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("has-lightbox");
    lightbox.close.focus();
  };

  const activate = (event, trigger) => {
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const media = getMediaData(trigger);

    if (!media?.src) {
      return;
    }

    event.preventDefault();
    open(media, trigger);
  };

  root.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest(LIGHTBOX_SELECTOR) : null;
    activate(event, trigger);
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const trigger = event.target instanceof Element ? event.target.closest(LIGHTBOX_SELECTOR) : null;

    if (!trigger) {
      return;
    }

    event.preventDefault();
    activate(event, trigger);
  });

  if (!lightbox.isBound) {
    lightbox.close.addEventListener("click", close);
    lightbox.root.addEventListener("click", (event) => {
      if (event.target === lightbox.root) {
        close();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
      }
    });
    lightbox.isBound = true;
  }
}
