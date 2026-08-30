const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function initBlogVideos(root: ParentNode = document): () => void {
  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest("[data-blog-video-trigger]");
    if (!(trigger instanceof HTMLButtonElement)) return;
    const figure = trigger.closest("[data-blog-video]");
    const media = figure?.querySelector("[data-blog-video-media]");
    if (!(figure instanceof HTMLElement) || !(media instanceof HTMLElement)) return;

    const id = figure.dataset.blogVideoId ?? "";
    if (!YOUTUBE_ID_PATTERN.test(id)) return;
    const title = figure.dataset.blogVideoTitle?.trim() || "YouTube video";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    iframe.title = title;
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    media.replaceChildren(iframe);
    figure.dataset.blogVideoLoaded = "true";
  };

  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
