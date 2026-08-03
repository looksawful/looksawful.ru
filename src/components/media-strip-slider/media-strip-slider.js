const COMPONENT_NAME = "media-strip-slider";
const FALLBACK_RATIO = 1;
const MIN_VALID_RATIO = 0.05;

function clampIndex(index, length) {
  return Math.min(Math.max(index, 0), Math.max(0, length - 1));
}

function readMediaRatio(media) {
  if (media instanceof HTMLImageElement) {
    if (media.naturalWidth > 0 && media.naturalHeight > 0) {
      return media.naturalWidth / media.naturalHeight;
    }
  }

  if (media instanceof HTMLVideoElement) {
    if (media.videoWidth > 0 && media.videoHeight > 0) {
      return media.videoWidth / media.videoHeight;
    }
  }

  return null;
}

function readRatio(slide, thumbnailMedia = null) {
  const explicitRatio = Number.parseFloat(
    slide.dataset.mediaStripThumbRatio ?? "",
  );

  if (Number.isFinite(explicitRatio) && explicitRatio > MIN_VALID_RATIO) {
    return explicitRatio;
  }

  const slideRatio = readMediaRatio(slide.querySelector("img, video"));

  if (slideRatio && slideRatio > MIN_VALID_RATIO) {
    return slideRatio;
  }

  const thumbnailRatio = readMediaRatio(thumbnailMedia);

  if (thumbnailRatio && thumbnailRatio > MIN_VALID_RATIO) {
    return thumbnailRatio;
  }

  return FALLBACK_RATIO;
}

function cloneThumbnailMedia(slide) {
  const media = slide.querySelector("img, video");

  if (media instanceof HTMLImageElement) {
    const image = media.cloneNode(false);
    image.removeAttribute("id");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    return image;
  }

  if (media instanceof HTMLVideoElement) {
    if (media.poster) {
      const image = document.createElement("img");
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.src = media.poster;
      return image;
    }

    const video = media.cloneNode(false);
    video.removeAttribute("id");
    video.removeAttribute("autoplay");
    video.removeAttribute("controls");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    return video;
  }

  return null;
}

class MediaStripSliderElement extends HTMLElement {
  #slidesContainer = null;
  #thumbnailTrack = null;
  #slides = [];
  #thumbnailButtons = [];
  #activeIndex = 0;
  #observer = null;
  #mounted = false;
  #renderQueued = false;

  connectedCallback() {
    if (this.#mounted) return;

    this.#mounted = true;
    this.#slidesContainer = this.querySelector(
      "[data-media-strip-slider-slides]",
    );
    this.#thumbnailTrack = this.querySelector(
      "[data-media-strip-slider-thumbnails]",
    );

    if (!this.#slidesContainer || !this.#thumbnailTrack) {
      this.dataset.mediaStripSliderState = "invalid";
      return;
    }

    this.addEventListener("keydown", this.#handleKeydown);

    this.#observer = new MutationObserver(this.#queueRender);
    this.#observer.observe(this.#slidesContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "src",
        "poster",
        "data-media-strip-thumb-ratio",
      ],
    });

    this.#render();
    this.dataset.mediaStripSliderState = "ready";
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.removeEventListener("keydown", this.#handleKeydown);

    for (const button of this.#thumbnailButtons) {
      button.removeEventListener("click", this.#handleThumbnailClick);
    }

    this.#thumbnailButtons = [];
    this.#slides = [];
    this.#mounted = false;

    this.style.removeProperty("--media-strip-slider-thumb-count");
    this.style.removeProperty("--media-strip-slider-thumb-gap-count");
    this.style.removeProperty("--media-strip-slider-thumb-ratio-sum");

    delete this.dataset.mediaStripSliderCount;
    delete this.dataset.mediaStripSliderState;
  }

  #queueRender = () => {
    if (this.#renderQueued) return;

    this.#renderQueued = true;

    queueMicrotask(() => {
      this.#renderQueued = false;

      if (this.isConnected) {
        this.#render();
      }
    });
  };

  #syncThumbnailMetrics = () => {
    const ratios = this.#slides.map((slide, index) => {
      const button = this.#thumbnailButtons[index];
      const thumbnailMedia = button?.querySelector("img, video") ?? null;
      const ratio = readRatio(slide, thumbnailMedia);

      button?.style.setProperty(
        "--media-strip-thumb-ratio",
        String(ratio),
      );

      return ratio;
    });

    const count = ratios.length;
    const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0);

    this.dataset.mediaStripSliderCount = String(count);

    this.style.setProperty(
      "--media-strip-slider-thumb-count",
      String(Math.max(count, 1)),
    );
    this.style.setProperty(
      "--media-strip-slider-thumb-gap-count",
      String(Math.max(count - 1, 0)),
    );
    this.style.setProperty(
      "--media-strip-slider-thumb-ratio-sum",
      String(Math.max(ratioSum, FALLBACK_RATIO)),
    );
  };

  #render() {
    this.#slides = Array.from(
      this.#slidesContainer.children,
    ).filter((node) => node.matches("[data-media-strip-slider-slide]"));

    for (const button of this.#thumbnailButtons) {
      button.removeEventListener("click", this.#handleThumbnailClick);
    }

    this.#thumbnailButtons = [];
    this.#thumbnailTrack.replaceChildren();

    this.#slides.forEach((slide, index) => {
      const button = document.createElement("button");
      button.className = "media-strip-slider__thumb";
      button.type = "button";
      button.dataset.mediaStripSliderThumbnail = "";
      button.dataset.mediaStripSliderIndex = String(index);
      button.setAttribute("aria-label", `Слайд ${index + 1}`);

      const thumbnailMedia = cloneThumbnailMedia(slide);

      if (thumbnailMedia) {
        button.append(thumbnailMedia);

        const updateMetrics = () => {
          this.#syncThumbnailMetrics();
        };

        thumbnailMedia.addEventListener("load", updateMetrics, {
          once: true,
        });
        thumbnailMedia.addEventListener(
          "loadedmetadata",
          updateMetrics,
          { once: true },
        );
      }

      button.addEventListener("click", this.#handleThumbnailClick);
      this.#thumbnailTrack.append(button);
      this.#thumbnailButtons.push(button);
    });

    this.#syncThumbnailMetrics();

    this.#setActiveIndex(
      clampIndex(this.#activeIndex, this.#slides.length),
      false,
    );
  }

  #setActiveIndex(index, scrollThumbnail = true) {
    this.#activeIndex = clampIndex(index, this.#slides.length);

    this.#slides.forEach((slide, slideIndex) => {
      const active = slideIndex === this.#activeIndex;
      slide.toggleAttribute("data-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });

    this.#thumbnailButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === this.#activeIndex;
      button.setAttribute("aria-current", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    if (scrollThumbnail) {
      this.#thumbnailButtons[this.#activeIndex]?.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches
          ? "auto"
          : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }

    this.dispatchEvent(
      new CustomEvent("media-strip-slider-change", {
        bubbles: true,
        detail: {
          index: this.#activeIndex,
          count: this.#slides.length,
        },
      }),
    );
  }

  #handleThumbnailClick = (event) => {
    const button = event.currentTarget;
    const index = Number.parseInt(
      button.dataset.mediaStripSliderIndex ?? "0",
      10,
    );

    this.#setActiveIndex(index);
  };

  #handleKeydown = (event) => {
    if (this.#slides.length < 2) return;

    let nextIndex = this.#activeIndex;

    if (event.key === "ArrowRight") {
      nextIndex += 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex -= 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = this.#slides.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    this.#setActiveIndex(nextIndex);
    this.#thumbnailButtons[this.#activeIndex]?.focus();
  };
}

if (!customElements.get(COMPONENT_NAME)) {
  customElements.define(COMPONENT_NAME, MediaStripSliderElement);
}

export { MediaStripSliderElement };
