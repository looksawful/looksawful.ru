function setAspectClass(link, width, height) {
  if (!link || !width || !height) return;

  const ratio = width / height;

  link.classList.remove("is-media-square", "is-media-landscape", "is-media-portrait");
  link.classList.add("is-media-loaded");

  if (ratio > 1.08) {
    link.classList.add("is-media-landscape");
    return;
  }

  if (ratio < 0.92) {
    link.classList.add("is-media-portrait");
    return;
  }

  link.classList.add("is-media-square");
}

function handleImage(image) {
  const link = image.closest(".task-side-gallery__link");
  if (!link) return;

  if (image.complete && image.naturalWidth && image.naturalHeight) {
    setAspectClass(link, image.naturalWidth, image.naturalHeight);
    return;
  }

  image.addEventListener(
    "load",
    function () {
      setAspectClass(link, image.naturalWidth, image.naturalHeight);
    },
    { once: true }
  );
}

function handleVideo(video) {
  const link = video.closest(".task-side-gallery__link");
  if (!link) return;

  if (video.videoWidth && video.videoHeight) {
    setAspectClass(link, video.videoWidth, video.videoHeight);
    return;
  }

  video.addEventListener(
    "loadedmetadata",
    function () {
      setAspectClass(link, video.videoWidth, video.videoHeight);
    },
    { once: true }
  );
}

function initGalleryAspectFit() {
  const selector = ".task-side-gallery--row .task-side-gallery__media";

  document.querySelectorAll(selector).forEach(function (media) {
    if (media.tagName.toLowerCase() === "img") {
      handleImage(media);
      return;
    }

    if (media.tagName.toLowerCase() === "video") {
      handleVideo(media);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGalleryAspectFit, { once: true });
} else {
  initGalleryAspectFit();
}
