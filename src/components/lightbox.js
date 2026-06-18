const LIGHTBOX_SELECTOR = "[data-lightbox]";

const getMediaData = (trigger) => {
  const explicitSrc = trigger.dataset.lightboxSrc;
  const explicitType = trigger.dataset.lightboxType;

  if (explicitSrc) {
    return { src: explicitSrc, type: explicitType || "image" };
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
    return { src: canvas.toDataURL("image/png"), type: "image" };
  }

  if (trigger instanceof HTMLAnchorElement && trigger.href) {
    const type = /\.(mp4|webm|mov)$/i.test(trigger.href) ? "video" : "image";
    return { src: trigger.href, type };
  }

  return null;
};

const createLightbox = () => {
  const root = document.createElement("div");
  root.className = "lightbox";
  root.innerHTML = `
    <div class="lightbox__dialog" role="dialog" aria-modal="true" aria-label="просмотр медиа">
      <div class="lightbox__toolbar">
        <button class="lightbox__close" type="button">закрыть</button>
      </div>
      <div class="lightbox__body"></div>
    </div>
  `;

  document.body.append(root);

  return {
    root,
    body: root.querySelector(".lightbox__body"),
    close: root.querySelector(".lightbox__close"),
  };
};

export function initLightbox(root = document) {
  const lightbox = createLightbox();

  if (!(lightbox.body instanceof HTMLElement) || !(lightbox.close instanceof HTMLButtonElement)) {
    return;
  }

  const close = () => {
    lightbox.root.classList.remove("is-open");
    lightbox.body.replaceChildren();
  };

  const open = ({ src, type }) => {
    const media = type === "video" ? document.createElement("video") : document.createElement("img");

    media.src = src;

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
    lightbox.close.focus();
  };

  root.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest(LIGHTBOX_SELECTOR) : null;

    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    const media = getMediaData(trigger);

    if (!media?.src) {
      return;
    }

    event.preventDefault();
    open(media);
  });

  lightbox.close.addEventListener("click", close);
  lightbox.root.addEventListener("click", (event) => {
    if (event.target === lightbox.root) {
      close();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.root.classList.contains("is-open")) {
      close();
    }
  });
}
