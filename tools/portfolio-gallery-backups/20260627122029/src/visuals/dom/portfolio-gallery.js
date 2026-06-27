function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "portfolio-lightbox";
  overlay.setAttribute("data-portfolio-lightbox", "");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <button class="portfolio-lightbox__close" type="button" aria-label="закрыть">×</button>
    <figure class="portfolio-lightbox__figure" data-portfolio-lightbox-content></figure>
  `;
  document.body.append(overlay);
  return overlay;
}

function sourceFromLink(link) {
  const href = link.getAttribute("href");
  const img = link.querySelector("img");
  const video = link.querySelector("video");
  return {
    href,
    poster: video?.getAttribute("poster") || img?.currentSrc || img?.getAttribute("src") || "",
    caption: link.getAttribute("data-caption") || img?.getAttribute("alt") || "",
    isVideo: link.hasAttribute("data-lightbox-video") || /\.(mp4|webm|mov)$/i.test(href || ""),
  };
}

function setOpen(overlay, open) {
  overlay.setAttribute("aria-hidden", String(!open));
  document.documentElement.classList.toggle("is-portfolio-lightbox-open", open);
}

export function initPortfolioGallery(root = document) {
  const items = Array.from(root.querySelectorAll("[data-lightbox-item], [data-lightbox-video]"));
  if (!items.length) return null;

  const overlay = document.querySelector("[data-portfolio-lightbox]") || createOverlay();
  const content = overlay.querySelector("[data-portfolio-lightbox-content]");
  const close = overlay.querySelector(".portfolio-lightbox__close");

  const closeOverlay = () => {
    setOpen(overlay, false);
    content.replaceChildren();
  };

  const openOverlay = (link) => {
    const source = sourceFromLink(link);
    if (!source.href) return;

    content.replaceChildren();

    if (source.isVideo) {
      const video = document.createElement("video");
      video.src = source.href;
      video.poster = source.poster;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      content.append(video);
    } else {
      const image = document.createElement("img");
      image.src = source.href;
      image.alt = source.caption;
      image.decoding = "async";
      content.append(image);
    }

    if (source.caption) {
      const caption = document.createElement("figcaption");
      caption.textContent = source.caption;
      content.append(caption);
    }

    setOpen(overlay, true);
    close?.focus?.();
  };

  root.addEventListener("click", (event) => {
    const link = event.target.closest?.("[data-lightbox-item], [data-lightbox-video]");
    if (!link) return;
    event.preventDefault();
    openOverlay(link);
  });

  close?.addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.getAttribute("aria-hidden") === "false") closeOverlay();
  });

  return { items: items.length };
}
