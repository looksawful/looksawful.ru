import PhotoSwipeLightbox from "photoswipe/lightbox";
import type PhotoSwipe from "photoswipe";
import type { SlideData } from "photoswipe";
import type { Content } from "photoswipe/lightbox";
import "photoswipe/style.css";

export type PhotoSwipeImageItem = SlideData & {
  kind: "image";
  src: string;
  width: number;
  height: number;
  captionHtml: string;
};

export type PhotoSwipeVideoItem = SlideData & {
  kind: "video";
  type: "video";
  html: "";
  src: string;
  poster: string;
  width: number;
  height: number;
  loop: boolean;
  resumeAt: number;
  captionHtml: string;
};

export type PhotoSwipeLightboxItem = PhotoSwipeImageItem | PhotoSwipeVideoItem;

type OpenOptions = {
  items: PhotoSwipeLightboxItem[];
  index: number;
  restoreFocus: HTMLElement | null;
};

type VideoContent = Content & {
  element?: HTMLDivElement;
  looksawfulVideo?: HTMLVideoElement;
};

function isLightboxItem(data: SlideData): data is PhotoSwipeLightboxItem {
  return data.kind === "image" || data.kind === "video";
}

function isVideoItem(data: SlideData): data is PhotoSwipeVideoItem {
  return data.kind === "video";
}

function activeItemFor(pswp: PhotoSwipe): PhotoSwipeLightboxItem | null {
  const dataSource = pswp.options.dataSource;
  if (!Array.isArray(dataSource)) {
    return null;
  }

  const item = dataSource[pswp.currIndex];
  return isLightboxItem(item) ? item : null;
}

function setVideoCurrentTime(video: HTMLVideoElement, resumeAt: number): void {
  try {
    if (resumeAt > 0 && (!Number.isFinite(video.duration) || video.duration > resumeAt)) {
      video.currentTime = resumeAt;
    }
  } catch {
    // Some media implementations reject currentTime before seekable data.
  }
}

function playVideo(video: HTMLVideoElement, resumeAt: number): void {
  const play = (): void => {
    setVideoCurrentTime(video, resumeAt);
    void video.play().catch(() => {});
  };

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    play();
    return;
  }

  video.addEventListener("loadedmetadata", play, { once: true });
}

function resetVideo(video: HTMLVideoElement): void {
  video.pause();
  video.removeAttribute("src");
  video.removeAttribute("poster");
  video.load();
}

function videoFor(content: Content): HTMLVideoElement | null {
  const customContent = content as VideoContent;
  if (customContent.looksawfulVideo instanceof HTMLVideoElement) {
    return customContent.looksawfulVideo;
  }

  const element = customContent.element;
  const video = element?.querySelector("video");
  return video instanceof HTMLVideoElement ? video : null;
}

function createVideoElement(item: PhotoSwipeVideoItem): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "pswp__content media-lightbox__figure media-lightbox__video-slide";

  const video = document.createElement("video");
  video.dataset.photoswipeVideo = "";
  video.src = item.src;
  video.poster = item.poster;
  video.controls = true;
  video.loop = item.loop;
  video.muted = false;
  video.defaultMuted = false;
  video.playsInline = true;
  video.preload = "auto";

  wrapper.append(video);
  return wrapper;
}

function updateCaption(element: HTMLElement, pswp: PhotoSwipe): void {
  const item = activeItemFor(pswp);
  element.innerHTML = item?.captionHtml || "";
  element.toggleAttribute("hidden", !element.textContent?.trim());
}

function registerCaptionUi(lightbox: PhotoSwipeLightbox): void {
  lightbox.on("uiRegister", () => {
    const pswp = lightbox.pswp;
    pswp?.ui?.registerElement({
      name: "looksawful-caption",
      className: "media-lightbox__caption",
      tagName: "p",
      isButton: false,
      appendTo: "root",
      order: 9,
      onInit: (element, instance) => {
        const syncCaption = (): void => updateCaption(element, instance);
        instance.on("change", syncCaption);
        instance.on("afterInit", syncCaption);
        syncCaption();
      },
    });
  });
}

function bindVideoLifecycle(lightbox: PhotoSwipeLightbox): void {
  lightbox.on("contentLoad", (event) => {
    if (!isVideoItem(event.content.data)) {
      return;
    }

    event.preventDefault();
    const content = event.content as VideoContent;
    content.element = createVideoElement(event.content.data);
    content.looksawfulVideo = content.element.querySelector("video") || undefined;
  });

  lightbox.on("contentActivate", (event) => {
    if (!isVideoItem(event.content.data)) {
      return;
    }

    const video = videoFor(event.content);
    if (video) {
      playVideo(video, event.content.data.resumeAt);
    }
  });

  lightbox.on("contentDeactivate", (event) => {
    if (!isVideoItem(event.content.data)) {
      return;
    }

    videoFor(event.content)?.pause();
  });

  lightbox.on("contentDestroy", (event) => {
    if (!isVideoItem(event.content.data)) {
      return;
    }

    const video = videoFor(event.content);
    if (video) {
      resetVideo(video);
    }
  });
}

export function createPhotoSwipeLightbox(): {
  open: (options: OpenOptions) => void;
  destroy: () => void;
} {
  let current: PhotoSwipeLightbox | null = null;

  const destroy = (): void => {
    current?.destroy();
    current = null;
  };

  const open = ({ items, index, restoreFocus }: OpenOptions): void => {
    destroy();

    const lightbox = new PhotoSwipeLightbox({
      dataSource: items,
      index,
      pswpModule: () => import("photoswipe"),
      mainClass: "media-lightbox media-lightbox--photoswipe",
      bgOpacity: 0.94,
      loop: items.length > 1,
      showHideAnimationType: "none",
      showAnimationDuration: 0,
      hideAnimationDuration: 0,
      zoomAnimationDuration: 0,
      returnFocus: true,
      preload: [1, 1],
    });

    registerCaptionUi(lightbox);
    bindVideoLifecycle(lightbox);

    lightbox.on("close", () => {
      restoreFocus?.focus();
    });

    lightbox.on("destroy", () => {
      if (current === lightbox) {
        current = null;
      }
    });

    current = lightbox;
    lightbox.loadAndOpen(index);
  };

  return { open, destroy };
}
