import PhotoSwipeLightbox from "photoswipe/lightbox";
import type PhotoSwipe from "photoswipe";
import type { SlideData } from "photoswipe";
import type { Content } from "photoswipe/lightbox";
import PhotoSwipeDynamicCaption from "photoswipe-dynamic-caption-plugin";

import "photoswipe/style.css";
import "photoswipe-dynamic-caption-plugin/photoswipe-dynamic-caption-plugin.css";
import "./desk-lightbox.css";

export type DeskImageItem = SlideData & {
  kind: "image";
  src: string;
  width: number;
  height: number;
  captionHtml: string;
};

export type DeskVideoItem = SlideData & {
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

export type DeskLightboxItem = DeskImageItem | DeskVideoItem;

type OpenOptions = {
  items: DeskLightboxItem[];
  index: number;
  restoreFocus: HTMLElement | null;
};

type VideoContent = Content & {
  element?: HTMLDivElement;
  deskVideo?: HTMLVideoElement;
};

function isDeskItem(data: SlideData): data is DeskLightboxItem {
  return data.kind === "image" || data.kind === "video";
}

function isVideoItem(data: SlideData): data is DeskVideoItem {
  return data.kind === "video";
}

function activeItemFor(pswp: PhotoSwipe): DeskLightboxItem | null {
  const dataSource = pswp.options.dataSource;
  if (!Array.isArray(dataSource)) return null;

  const item = dataSource[pswp.currIndex];
  return isDeskItem(item) ? item : null;
}

function setVideoCurrentTime(
  video: HTMLVideoElement,
  resumeAt: number,
): void {
  try {
    if (
      resumeAt > 0 &&
      (
        !Number.isFinite(video.duration) ||
        video.duration > resumeAt
      )
    ) {
      video.currentTime = resumeAt;
    }
  } catch {
    // Media implementations may reject seek before metadata.
  }
}

function playVideo(
  video: HTMLVideoElement,
  resumeAt: number,
): void {
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
  const custom = content as VideoContent;

  if (custom.deskVideo instanceof HTMLVideoElement) {
    return custom.deskVideo;
  }

  const video = custom.element?.querySelector("video");
  return video instanceof HTMLVideoElement ? video : null;
}

function createVideoElement(item: DeskVideoItem): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "pswp__content md-lightbox-video";

  const video = document.createElement("video");
  video.src = item.src;
  video.poster = item.poster;
  video.controls = true;
  video.loop = item.loop;
  video.playsInline = true;
  video.preload = "auto";

  wrapper.append(video);
  return wrapper;
}

function updateVideoCaption(
  element: HTMLElement,
  pswp: PhotoSwipe,
): void {
  const item = activeItemFor(pswp);
  const visible = item?.kind === "video";

  element.innerHTML = visible ? item.captionHtml : "";
  element.toggleAttribute(
    "hidden",
    !visible || !element.textContent?.trim(),
  );
}

function registerVideoCaption(
  lightbox: PhotoSwipeLightbox,
): void {
  lightbox.on("uiRegister", () => {
    lightbox.pswp?.ui?.registerElement({
      name: "desk-video-caption",
      className: "md-lightbox-video-caption",
      tagName: "div",
      isButton: false,
      appendTo: "root",
      order: 9,
      onInit: (element, instance) => {
        const sync = (): void => {
          updateVideoCaption(element, instance);
        };

        instance.on("change", sync);
        instance.on("afterInit", sync);
        sync();
      },
    });
  });
}

function bindVideoLifecycle(
  lightbox: PhotoSwipeLightbox,
): void {
  lightbox.on("contentLoad", (event) => {
    if (!isVideoItem(event.content.data)) return;

    event.preventDefault();

    const content = event.content as VideoContent;
    content.element = createVideoElement(event.content.data);
    content.deskVideo =
      content.element.querySelector("video") ?? undefined;
  });

  lightbox.on("contentActivate", (event) => {
    if (!isVideoItem(event.content.data)) return;

    const video = videoFor(event.content);
    if (video) {
      playVideo(video, event.content.data.resumeAt);
    }
  });

  lightbox.on("contentDeactivate", (event) => {
    if (!isVideoItem(event.content.data)) return;
    videoFor(event.content)?.pause();
  });

  lightbox.on("contentDestroy", (event) => {
    if (!isVideoItem(event.content.data)) return;

    const video = videoFor(event.content);
    if (video) resetVideo(video);
  });
}

export function createDeskLightbox(): {
  open: (options: OpenOptions) => void;
  destroy: () => void;
} {
  let current: PhotoSwipeLightbox | null = null;

  const destroy = (): void => {
    current?.destroy();
    current = null;
  };

  const open = ({
    items,
    index,
    restoreFocus,
  }: OpenOptions): void => {
    destroy();

    const lightbox = new PhotoSwipeLightbox({
      dataSource: items,
      index,
      pswpModule: () => import("photoswipe"),
      mainClass: "md-lightbox",
      bgOpacity: 0.96,
      loop: items.length > 1,
      showHideAnimationType: "none",
      showAnimationDuration: 0,
      hideAnimationDuration: 0,
      zoomAnimationDuration: 0,
      returnFocus: true,
      preload: [1, 1],
    });

    new PhotoSwipeDynamicCaption(lightbox, {
      type: "auto",
      mobileLayoutBreakpoint: 720,
      mobileCaptionOverlapRatio: 1,
      verticallyCenterImage: true,
      horizontalEdgeThreshold: 16,
      captionContent: (slide) => {
        const data = slide.data;
        return isDeskItem(data) && data.kind === "image"
          ? data.captionHtml
          : "";
      },
    });

    registerVideoCaption(lightbox);
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
